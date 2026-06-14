import { setDefaultResultOrder } from "node:dns";
// UploadThing CDN is unreachable over IPv6 in local dev — force IPv4
setDefaultResultOrder("ipv4first");

import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { prisma } from "@/lib/prisma";

export const maxDuration = 300;

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const PROMPT = `Extract all questions and answers from this test/exam document. Return a JSON object with the following structure:
{
  "questions": [
    {
      "text": "ONLY the question stem — stop before any answer options appear. Do NOT include option labels (a, b, c, d) or option text here.",
      "options": ["Text of option a only", "Text of option b only", "Text of option c only", "Text of option d only"],
      "correctAnswer": "The exact text of the correct option (must match one entry in options exactly)",
      "explanation": "Optional brief explanation of why this answer is correct"
    }
  ]
}

CRITICAL rules:
- "text" must contain ONLY the question stem. It must end before the first answer option (a), b), A), B), 1., 2., etc.).
- "options" must be a flat array of strings — one entry per answer choice, containing only the option text, NOT the label (no "a)", "b)", "A.", etc.).
- Every option that appears in the document must be a separate element in the array.
- "correctAnswer" must exactly match one of the strings in "options".
- If the document marks a correct answer (e.g. bold, underlined, starred, circled letter), use that as correctAnswer.
- If it's a true/false question, options should be ["True", "False"].
- Include ALL questions found in the document.
- Return ONLY valid JSON — no markdown fences, no extra text.
- IMPORTANT: In JSON strings, LaTeX backslashes MUST be doubled. Write \\\\sum not \\sum, \\\\frac not \\frac, etc.

MATHEMATICAL FORMULAS — read with extreme care:
- Render every formula in LaTeX: $...$ for inline, $$...$$ for block.
- Before writing any formula, LOOK AGAIN at the exact symbol in the image. Do not write from memory or assumption.

SYMBOL REFERENCE TABLE — match what you see to the correct LaTeX:
  OPERATORS
    ∑  (capital sigma, tall zigzag, summation)   → \\\\sum         $\\\\sum_{i=1}^{n} x_i$
    ∏  (capital pi, tall rectangle legs, product) → \\\\prod        $\\\\prod_{i=1}^{n} x_i$
    ∫  (elongated S, integral)                   → \\\\int         $\\\\int_a^b f(x)\\\\,dx$
    ±  (plus-minus)                              → \\\\pm
    ×  (multiplication cross)                    → \\\\times
    ÷  (division)                                → \\\\div
    ≠  (not equal)                               → \\\\neq
    ≤  (less-or-equal)                           → \\\\leq
    ≥  (greater-or-equal)                        → \\\\geq
    ≈  (approximately equal)                     → \\\\approx
    ∞  (infinity)                                → \\\\infty
  ROOTS & FRACTIONS
    √x  (square root)                            → \\\\sqrt{x}
    ⁿ√x (n-th root)                              → \\\\sqrt[n]{x}
    a/b (fraction)                               → \\\\frac{a}{b}
  GREEK LETTERS (lowercase)
    α → \\\\alpha   β → \\\\beta    γ → \\\\gamma   δ → \\\\delta
    ε → \\\\epsilon ζ → \\\\zeta    η → \\\\eta     θ → \\\\theta
    λ → \\\\lambda  μ → \\\\mu      ν → \\\\nu      ξ → \\\\xi
    π → \\\\pi      ρ → \\\\rho     σ → \\\\sigma   τ → \\\\tau
    φ → \\\\phi     χ → \\\\chi     ψ → \\\\psi     ω → \\\\omega
  GREEK LETTERS (uppercase — these differ from operators above)
    Γ → \\\\Gamma   Δ → \\\\Delta   Θ → \\\\Theta   Λ → \\\\Lambda
    Ξ → \\\\Xi      Π → \\\\Pi      Σ → \\\\Sigma   Φ → \\\\Phi
    Ψ → \\\\Psi     Ω → \\\\Omega
  STATISTICS & PROBABILITY
    x̄  (x with overbar, sample mean)             → \\\\bar{x}
    x̂  (x with hat, estimator)                  → \\\\hat{x}
    x²  or x^2 (squared)                        → x^2
    C(n,k) or ⁿCₖ (combinations)                → \\\\binom{n}{k}
    P(A|B) (conditional probability)             → P(A|B)
    μ (population mean) → \\\\mu
    σ (population std dev) → \\\\sigma
    σ² (variance) → \\\\sigma^2
    s² (sample variance) → s^2
    Σ when used as summation operator            → \\\\sum   (NOT \\\\Sigma)

CRITICAL ANTI-CONFUSION RULES:
1. ∑ (summation) vs ∏ (product): ∑ has a zigzag/M-shape top and bottom; ∏ has a flat top and two vertical legs extending down. They are NEVER interchangeable.
2. σ (lowercase sigma) vs Σ (uppercase sigma used as summation): If it has limits (subscript/superscript i=1, n), it is \\\\sum. If it stands alone as a parameter, it is \\\\sigma.
3. π (pi, ratio of circumference) vs ∏ (product operator with limits): ∏ is taller and has explicit index limits. π is just the constant ≈3.14159.
4. μ (mu) vs u (letter u): μ has two downward strokes; u has a curved bottom.
5. Never omit subscripts or superscripts — if you see $x_i$ do not write just $x$.
6. Never flatten a fraction a/b into just text — always use \\\\frac{a}{b}.
7. If a root has an index (small number in the crook), include it: \\\\sqrt[3]{x} not \\\\sqrt{x}.

After writing each formula, re-read the original image and verify the symbol matches exactly. If uncertain between two symbols, output the one that is visually present, not the one that is more common in textbooks.`;

const MODELS = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-2.0-flash-lite"];

function sanitizeJsonBackslashes(raw: string): string {
  // Gemini sometimes outputs bare LaTeX backslashes (\sum, \frac) inside JSON strings,
  // which are invalid JSON escape sequences. This escapes any lone backslash that is not
  // already a valid JSON escape: \", \\, \/, \b, \f, \n, \r, \t, \uXXXX
  return raw.replace(/\\(?!["\\/bfnrtu])/g, "\\\\");
}

export async function POST(req: NextRequest) {
  const { pdfUrl, testName, testId: existingTestId } = await req.json();

  if (!pdfUrl || !testName) {
    return NextResponse.json({ error: "Missing pdfUrl or testName" }, { status: 400 });
  }

  const encoder = new TextEncoder();

  // Stream the response so proxy/CDN idle-connection timeouts can't kill a long Gemini call.
  // Heartbeat newlines keep the TCP connection alive; the final line is the JSON result.
  const body = new ReadableStream({
    async start(controller) {
      const heartbeat = setInterval(() => {
        try { controller.enqueue(encoder.encode('\n')); } catch { /* stream already closed */ }
      }, 15_000);

      const send = (payload: object) => {
        try { controller.enqueue(encoder.encode(JSON.stringify(payload) + '\n')); } catch { /* ignore */ }
      };

      try {
        let rawAiResponse: string | null = null;
        let extractionError: string | null = null;
        let extractStatus = "ready";
        let validQuestions: Array<{ text: string; options: string[]; correctAnswer: string; explanation?: string }> = [];

        try {
          const pdfResponse = await fetch(pdfUrl);
          if (!pdfResponse.ok) throw new Error(`Failed to fetch PDF (HTTP ${pdfResponse.status})`);
          const pdfBuffer = Buffer.from(await pdfResponse.arrayBuffer());
          console.log("[extract] PDF size:", pdfBuffer.length);

          const base64Pdf = pdfBuffer.toString("base64");
          let lastError: unknown;

          for (const modelName of MODELS) {
            try {
              const model = genAI.getGenerativeModel({ model: modelName });
              const result = await model.generateContent([
                { inlineData: { mimeType: "application/pdf", data: base64Pdf } },
                PROMPT,
              ]);
              rawAiResponse = result.response.text();
              console.log("[extract] succeeded with model:", modelName);
              break;
            } catch (err: unknown) {
              const status = (err as { status?: number }).status;
              if (status === 429 || status === 404) {
                console.warn(`[extract] model ${modelName} unavailable (${status}) — trying next`);
                lastError = err;
                continue;
              }
              throw err;
            }
          }

          if (!rawAiResponse) {
            throw new Error(`All Gemini models are rate-limited. Please wait a minute and try again. Last error: ${String(lastError)}`);
          }

          const jsonText = sanitizeJsonBackslashes(
            rawAiResponse.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim()
          );
          const parsed = JSON.parse(jsonText) as { questions: typeof validQuestions };
          validQuestions = parsed.questions.filter((q) => q.correctAnswer != null);

        } catch (err) {
          extractStatus = "error";
          extractionError = err instanceof Error ? err.message : String(err);
          console.error("[extract] error:", extractionError);
        }

        const questionRows = validQuestions.map((q, i) => ({
          text: q.text,
          options: JSON.stringify(q.options),
          correctAnswer: q.correctAnswer,
          explanation: q.explanation ?? null,
          order: i,
        }));

        try {
          let test;
          if (existingTestId) {
            await prisma.question.deleteMany({ where: { testId: existingTestId } });
            test = await prisma.test.update({
              where: { id: existingTestId },
              data: { name: testName, extractStatus, rawAiResponse, extractionError, questions: { create: questionRows } },
              include: { questions: true },
            });
          } else {
            test = await prisma.test.create({
              data: { name: testName, pdfUrl, extractStatus, rawAiResponse, extractionError, questions: { create: questionRows } },
              include: { questions: true },
            });
          }

          if (extractStatus === "error") {
            send({ error: extractionError, testId: test.id });
          } else {
            send({ test });
          }
        } catch (dbErr) {
          console.error("[extract] DB error:", dbErr);
          send({ error: "Failed to save test to database" });
        }

      } finally {
        clearInterval(heartbeat);
        try { controller.close(); } catch { /* ignore */ }
      }
    },
  });

  return new Response(body, { headers: { "Content-Type": "application/json" } });
}

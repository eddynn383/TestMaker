import { setDefaultResultOrder } from "node:dns";
// UploadThing CDN is unreachable over IPv6 in local dev — force IPv4
setDefaultResultOrder("ipv4first");

import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { prisma } from "@/lib/prisma";

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

MATHEMATICAL FORMULAS — read with extreme care:
- Render every formula in LaTeX: $...$ for inline, $$...$$ for block.
- These symbols are frequently confused — identify each one precisely before writing LaTeX:
    ∑ (sigma, summation) → \\sum        e.g. $\\sum_{i=1}^{n} x_i$
    ∏ (pi, product)      → \\prod       e.g. $\\prod_{i=1}^{n} x_i$   ← NOT \\sum
    √  (square root)     → \\sqrt{}     e.g. $\\sqrt{x}$
    ⁿ√ (n-th root)       → \\sqrt[n]{} e.g. $\\sqrt[n]{\\prod_{i=1}^{n} x_i}$
    x̄  (x-bar, mean)     → \\bar{x}
    x²  (squared)        → x^2
- Never substitute one operator for another. If a formula contains ∏ it must appear as \\prod, not \\sum.
- Preserve all superscripts, subscripts, fraction bars, and root indices exactly as printed.
- If a formula is unclear, reproduce what is visually present rather than guessing a simpler equivalent.`;

const MODELS = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-2.0-flash-lite"];

export async function POST(req: NextRequest) {
  const { pdfUrl, testName } = await req.json();

  if (!pdfUrl || !testName) {
    return NextResponse.json({ error: "Missing pdfUrl or testName" }, { status: 400 });
  }

  let rawAiResponse: string | null = null;
  let extractionError: string | null = null;
  let extractStatus = "ready";
  let validQuestions: Array<{ text: string; options: string[]; correctAnswer: string; explanation?: string }> = [];

  try {
    // Fetch the PDF
    const pdfResponse = await fetch(pdfUrl);
    if (!pdfResponse.ok) {
      throw new Error(`Failed to fetch PDF (HTTP ${pdfResponse.status})`);
    }
    const pdfBuffer = Buffer.from(await pdfResponse.arrayBuffer());
    console.log("[extract] PDF size:", pdfBuffer.length);

    // Call Gemini — fall back through models on quota errors
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

    // Parse JSON
    const jsonText = rawAiResponse.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    // Gemini sometimes emits single backslashes in LaTeX (e.g. \sum, \bar) which are
    // invalid JSON escape sequences. Fix them before parsing.
    const sanitizedJsonText = jsonText.replace(/\\(?!["\\/bfnrtu])/g, "\\\\");
    const parsed = JSON.parse(sanitizedJsonText) as { questions: typeof validQuestions };
    validQuestions = parsed.questions.filter((q) => q.correctAnswer != null);

  } catch (err) {
    extractStatus = "error";
    extractionError = err instanceof Error ? err.message : String(err);
    console.error("[extract] error:", extractionError);
  }

  // Always persist a Test record — even on failure — so the log is visible in the UI
  try {
    const test = await prisma.test.create({
      data: {
        name: testName,
        pdfUrl,
        extractStatus,
        rawAiResponse,
        extractionError,
        questions: {
          create: validQuestions.map((q, i) => ({
            text: q.text,
            options: JSON.stringify(q.options),
            correctAnswer: q.correctAnswer,
            explanation: q.explanation ?? null,
            order: i,
          })),
        },
      },
      include: { questions: true },
    });

    if (extractStatus === "error") {
      return NextResponse.json({ error: extractionError, testId: test.id }, { status: 422 });
    }
    return NextResponse.json({ test });

  } catch (dbErr) {
    console.error("[extract] DB error:", dbErr);
    return NextResponse.json({ error: "Failed to save test to database" }, { status: 500 });
  }
}

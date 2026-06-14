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


export async function POST(req: NextRequest) {
  try {
    const { pdfUrl, testName } = await req.json();

    if (!pdfUrl || !testName) {
      return NextResponse.json({ error: "Missing pdfUrl or testName" }, { status: 400 });
    }

    // Fetch the PDF
    const pdfResponse = await fetch(pdfUrl);
    if (!pdfResponse.ok) {
      console.error("[extract] fetch failed:", pdfResponse.status, pdfResponse.statusText);
      return NextResponse.json({ error: "Failed to fetch PDF" }, { status: 400 });
    }
    const pdfBuffer = Buffer.from(await pdfResponse.arrayBuffer());
    console.log("[extract] PDF size:", pdfBuffer.length);

    // Send PDF directly to Gemini — works for both text and scanned/image PDFs.
    // Falls back through models if one's free-tier quota is exhausted.
    const MODELS = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-2.0-flash-lite"];
    const base64Pdf = pdfBuffer.toString("base64");
    let rawText = "";
    let lastError: unknown;

    for (const modelName of MODELS) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent([
          { inlineData: { mimeType: "application/pdf", data: base64Pdf } },
          PROMPT,
        ]);
        rawText = result.response.text();
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

    if (!rawText) {
      console.error("[extract] all models rate limited:", lastError);
      return NextResponse.json(
        { error: "All Gemini models are rate-limited. Please wait a minute and try again." },
        { status: 429 }
      );
    }

    let parsed: { questions: Array<{ text: string; options: string[]; correctAnswer: string; explanation?: string }> };
    try {
      const jsonText = rawText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      parsed = JSON.parse(jsonText);
    } catch {
      return NextResponse.json({ error: "Failed to parse AI response", raw: rawText }, { status: 500 });
    }

    // Save to database — skip questions where the AI couldn't determine the correct answer
    const validQuestions = parsed.questions.filter((q) => q.correctAnswer != null);

    const test = await prisma.test.create({
      data: {
        name: testName,
        pdfUrl,
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

    return NextResponse.json({ test });
  } catch (error) {
    console.error("Extract error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

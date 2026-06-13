import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/prisma";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { pdfUrl, testName } = await req.json();

    if (!pdfUrl || !testName) {
      return NextResponse.json({ error: "Missing pdfUrl or testName" }, { status: 400 });
    }

    // Fetch the PDF as base64
    const pdfResponse = await fetch(pdfUrl);
    if (!pdfResponse.ok) {
      return NextResponse.json({ error: "Failed to fetch PDF" }, { status: 400 });
    }
    const pdfBuffer = await pdfResponse.arrayBuffer();
    const pdfBase64 = Buffer.from(pdfBuffer).toString("base64");

    // Use Claude to extract questions from the PDF
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "document",
              source: {
                type: "base64",
                media_type: "application/pdf",
                data: pdfBase64,
              },
            },
            {
              type: "text",
              text: `Extract all questions and answers from this test/exam PDF. Return a JSON array with the following structure for each question:
{
  "questions": [
    {
      "text": "The full question text (preserve any math formulas using LaTeX notation with $ for inline and $$ for block)",
      "options": ["Option A text", "Option B text", "Option C text", "Option D text"],
      "correctAnswer": "The exact text of the correct answer option",
      "explanation": "Brief explanation of why this is correct (optional)"
    }
  ]
}

Rules:
- Preserve mathematical formulas using LaTeX notation
- Include ALL questions found in the document
- For multiple choice, list all options
- If it's a true/false question, options should be ["True", "False"]
- correctAnswer must exactly match one of the options
- Return ONLY the JSON, no other text`,
            },
          ],
        },
      ],
    });

    const content = message.content[0];
    if (content.type !== "text") {
      return NextResponse.json({ error: "Unexpected response from AI" }, { status: 500 });
    }

    let parsed: { questions: Array<{ text: string; options: string[]; correctAnswer: string; explanation?: string }> };
    try {
      const jsonText = content.text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      parsed = JSON.parse(jsonText);
    } catch {
      return NextResponse.json({ error: "Failed to parse AI response", raw: content.text }, { status: 500 });
    }

    // Save to database
    const test = await prisma.test.create({
      data: {
        name: testName,
        pdfUrl,
        questions: {
          create: parsed.questions.map((q, i) => ({
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

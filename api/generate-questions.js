export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      error: "Method not allowed",
    });
  }

  const adminSecret = req.headers["x-admin-secret"];

  if (
    !process.env.ADMIN_IMPORT_SECRET ||
    adminSecret !== process.env.ADMIN_IMPORT_SECRET
  ) {
    return res.status(401).json({
      success: false,
      error: "Unauthorized",
    });
  }

  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({
      success: false,
      error: "OPENAI_API_KEY is not configured.",
    });
  }

  try {
   const {
  classNumber,
  subject,
  chapter,
  board,
  questionCount,
  sourceText,
  sourceFiles,
} = req.body || {};

if (
  !classNumber ||
  !subject ||
  !chapter ||
  !questionCount ||
  (!String(sourceText || "").trim() &&
    (!Array.isArray(sourceFiles) || sourceFiles.length === 0))
) {
  return res.status(400).json({
    success: false,
    error:
      "Class, subject, chapter, question count and source material are required.",
  });
}

    const count = Number(questionCount);

    if (!Number.isInteger(count) || count < 1 || count > 50) {
      return res.status(400).json({
        success: false,
        error: "Question count must be between 1 and 50.",
      });
    }

    if (String(sourceText).length > 50000) {
      return res.status(400).json({
        success: false,
        error: "Source text is too long. Maximum allowed is 50,000 characters.",
      });
    }

    const prompt = `
You are the academic MCQ generation engine for Sharvin Academy.

Create exactly ${count} high-quality multiple-choice questions.

ACADEMIC CONTEXT
Class: ${classNumber}
Subject: ${subject}
Chapter: ${chapter}
Board: ${board || "Not specified"}

SOURCE MATERIAL
The questions MUST be based only on the source material supplied below.
Do not introduce facts that are not supported by the supplied material.

--- SOURCE START ---
${sourceText}
--- SOURCE END ---

QUESTION QUALITY RULES
1. Create exactly ${count} unique MCQs.
2. Every question must have exactly four options: A, B, C and D.
3. Exactly one option must be correct.
4. "Correct" must contain only one letter: A, B, C or D.
5. Avoid duplicate or near-duplicate questions.
6. Avoid ambiguous questions.
7. Distractors should be plausible but clearly incorrect.
8. Use language appropriate for Class ${classNumber}.
9. Keep questions syllabus-oriented and suitable for student testing.
10. Create a reasonable mix of easy, medium and difficult questions.
11. Difficulty must be exactly one of: easy, medium, difficult.
12. Marks must always be 1.
13. Provide a short explanation for the correct answer.
14. Concept should identify the specific concept tested.
15. Do not number questions inside the Question field.
`;
const inputContent = [
  {
    type: "input_text",
    text: prompt,
  },
];

if (Array.isArray(sourceFiles) && sourceFiles.length > 0) {
  for (const sourceFile of sourceFiles) {
    if (!sourceFile?.id) continue;

    if (
      sourceFile.type === "image/jpeg" ||
      sourceFile.type === "image/png"
    ) {
      inputContent.push({
        type: "input_image",
        file_id: sourceFile.id,
      });
    } else {
      inputContent.push({
        type: "input_file",
        file_id: sourceFile.id,
      });
    }
  }
}
const openAIInput = [
  {
    role: "user",
    content: inputContent,
  },
];
    const openAIResponse = await fetch(
      "https://api.openai.com/v1/responses",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-5.6-luna",
          input: openAIInput,
          reasoning: {
            effort: "low",
          },
          text: {
            format: {
              type: "json_schema",
              name: "sharvin_mcq_questions",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  questions: {
                    type: "array",
                    minItems: count,
                    maxItems: count,
                    items: {
                      type: "object",
                      properties: {
                        Concept: {
                          type: "string",
                        },
                        Question: {
                          type: "string",
                        },
                        A: {
                          type: "string",
                        },
                        B: {
                          type: "string",
                        },
                        C: {
                          type: "string",
                        },
                        D: {
                          type: "string",
                        },
                        Correct: {
                          type: "string",
                          enum: ["A", "B", "C", "D"],
                        },
                        Marks: {
                          type: "integer",
                          enum: [1],
                        },
                        Difficulty: {
                          type: "string",
                          enum: ["easy", "medium", "difficult"],
                        },
                        Explaination: {
                          type: "string",
                        },
                      },
                      required: [
                        "Concept",
                        "Question",
                        "A",
                        "B",
                        "C",
                        "D",
                        "Correct",
                        "Marks",
                        "Difficulty",
                        "Explaination",
                      ],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["questions"],
                additionalProperties: false,
              },
            },
          },
        }),
      }
    );

    const responseText = await openAIResponse.text();

    if (!openAIResponse.ok) {
      console.error("OpenAI status:", openAIResponse.status);
      console.error("OpenAI response:", responseText);

      return res.status(openAIResponse.status).json({
        success: false,
        error: responseText,
      });
    }

    let openAIData;

    try {
      openAIData = JSON.parse(responseText);
    } catch {
      return res.status(500).json({
        success: false,
        error: "Could not parse OpenAI response.",
      });
    }

    const outputText =
      openAIData.output
        ?.flatMap((item) => item.content || [])
        ?.find((item) => item.type === "output_text")
        ?.text || "";

    if (!outputText) {
      console.error("Unexpected OpenAI response:", responseText);

      return res.status(500).json({
        success: false,
        error: "OpenAI returned no question data.",
      });
    }

    let generated;

    try {
      generated = JSON.parse(outputText);
    } catch {
      return res.status(500).json({
        success: false,
        error: "Generated question JSON could not be parsed.",
      });
    }

    const questions = generated.questions.map((q, index) => ({
      Class: Number(classNumber),
      Subject: String(subject).trim(),
      Chapter: String(chapter).trim(),
      Concept: String(q.Concept).trim(),
      Q: index + 1,
      Question: String(q.Question).trim(),
      A: String(q.A).trim(),
      B: String(q.B).trim(),
      C: String(q.C).trim(),
      D: String(q.D).trim(),
      Correct: String(q.Correct).trim().toUpperCase(),
      Marks: 1,
      Difficulty: String(q.Difficulty).trim().toLowerCase(),
      Board: String(board || "").trim(),
      Explaination: String(q.Explaination).trim(),
      Source: "Sharvin Academy AI Generator",
    }));

    return res.status(200).json({
      success: true,
      count: questions.length,
      questions,
    });
  } catch (error) {
    console.error("Generate questions error:", error);

    return res.status(500).json({
      success: false,
      error: error.message || "Internal server error",
    });
  }
}

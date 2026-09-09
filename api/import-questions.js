export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      error: "Method not allowed",
    });
  }

  try {
    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_SERVICE_ROLE_KEY =
      process.env.SUPABASE_SERVICE_ROLE_KEY;
    const ADMIN_IMPORT_SECRET =
      process.env.ADMIN_IMPORT_SECRET;

    if (
      !SUPABASE_URL ||
      !SUPABASE_SERVICE_ROLE_KEY ||
      !ADMIN_IMPORT_SECRET
    ) {
      return res.status(500).json({
        success: false,
        error: "Server configuration is incomplete",
      });
    }

    const suppliedSecret = req.headers["x-admin-secret"];

    if (suppliedSecret !== ADMIN_IMPORT_SECRET) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized",
      });
    }

    const questions = req.body?.questions;

    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({
        success: false,
        error: "No questions supplied",
      });
    }

    if (questions.length > 500) {
      return res.status(400).json({
        success: false,
        error: "Maximum 500 questions per import",
      });
    }

    const requiredFields = [
      "ID",
      "Class",
      "Subject",
      "Chapter",
      "Concept",
      "Q",
      "Question",
      "A",
      "B",
      "C",
      "D",
      "Correct",
      "Marks",
      "Difficulty",
      "Board",
    ];

    const validAnswers = ["A", "B", "C", "D"];
    const seenIds = new Set();

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];

      for (const field of requiredFields) {
        if (
          q[field] === undefined ||
          q[field] === null ||
          String(q[field]).trim() === ""
        ) {
          return res.status(400).json({
            success: false,
            error: `Row ${i + 1}: Missing ${field}`,
          });
        }
      }

      const id = String(q.ID).trim();

      if (seenIds.has(id)) {
        return res.status(400).json({
          success: false,
          error: `Duplicate ID in upload: ${id}`,
        });
      }

      seenIds.add(id);

      if (
        !validAnswers.includes(
          String(q.Correct).trim().toUpperCase()
        )
      ) {
        return res.status(400).json({
          success: false,
          error: `Row ${i + 1}: Correct must be A, B, C, or D`,
        });
      }
    }

    const rows = questions.map((q) => ({
      ID: String(q.ID).trim(),
      Class: Number(q.Class),
      Subject: String(q.Subject).trim(),
      Chapter: String(q.Chapter).trim(),
      Concept: String(q.Concept).trim(),
      Q: Number(q.Q),
      Question: String(q.Question).trim(),
      A: String(q.A).trim(),
      B: String(q.B).trim(),
      C: String(q.C).trim(),
      D: String(q.D).trim(),
      Correct: String(q.Correct).trim().toUpperCase(),
      Marks: Number(q.Marks),
      Difficulty: String(q.Difficulty).trim(),
      Board: String(q.Board).trim(),
      Explaination:
        q.Explaination == null
          ? ""
          : String(q.Explaination).trim(),
      Source:
        q.Source == null
          ? ""
          : String(q.Source).trim(),
    }));

    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/questions`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          Prefer: "return=representation",
        },
        body: JSON.stringify(rows),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        success: false,
        error: "Supabase insert failed",
        details: result,
      });
    }

    return res.status(200).json({
      success: true,
      inserted: result.length,
      message: `${result.length} questions added successfully`,
    });
  } catch (error) {
    console.error("Question import error:", error);

    return res.status(500).json({
      success: false,
      error: "Question import failed",
    });
  }
}

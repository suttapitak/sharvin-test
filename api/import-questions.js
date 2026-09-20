function normalizeBoard(value) {
  const raw = String(value ?? "").trim();
  const v = raw.toUpperCase().replace(/\s+/g, " ");

  if (
    [
      "CBSE",
      "NCERT",
      "CBSE/NCERT",
      "CBSE / NCERT",
      "CBSE-NCERT",
    ].includes(v)
  ) {
    return "CBSE / NCERT";
  }

  if (v === "ICSE") return "ICSE";
  if (v === "IGCSE") return "IGCSE";
  if (v === "SSC") return "SSC";
  if (v === "IB") return "IB";

  return null;
}

function normalizeSubject(value) {
  const raw = String(value ?? "").trim();
  const v = raw.toLowerCase().replace(/\s+/g, " ");

  const subjectMap = {
    math: "Mathematics",
    maths: "Mathematics",
    mathematics: "Mathematics",

    science: "Science",
    physics: "Physics",
    chemistry: "Chemistry",
    biology: "Biology",

    english: "English",
    hindi: "Hindi",
    marathi: "Marathi",
    sst: "SST",
    "social science": "SST",
    economics: "Economics",
    "the world around us": "The World Around Us",
  };

  return subjectMap[v] || null;
}

function normalizeDifficulty(value) {
  const raw = String(value ?? "").trim();
  const v = raw.toLowerCase();

  if (v === "easy") return "Easy";
  if (v === "medium") return "Medium";

  if (
    v === "difficult" ||
    v === "difficulty" ||
    v === "hard"
  ) {
    return "Difficult";
  }

  return null;
}

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

    if (questions.length > 2000) {
      return res.status(400).json({
        success: false,
        error: "Maximum 2000 questions per import",
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

    const rows = [];

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      const rowNumber = i + 1;

      for (const field of requiredFields) {
        if (
          q[field] === undefined ||
          q[field] === null ||
          String(q[field]).trim() === ""
        ) {
          return res.status(400).json({
            success: false,
            error: `Row ${rowNumber}: Missing ${field}`,
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

      const correct = String(q.Correct).trim().toUpperCase();

      if (!validAnswers.includes(correct)) {
        return res.status(400).json({
          success: false,
          error: `Row ${rowNumber}: Correct must be A, B, C, or D`,
        });
      }

      const classNumber = Number(q.Class);

      if (
        !Number.isInteger(classNumber) ||
        classNumber < 1 ||
        classNumber > 12
      ) {
        return res.status(400).json({
          success: false,
          error: `Row ${rowNumber}: Class must be an integer from 1 to 12`,
        });
      }

      const questionNumber = Number(q.Q);

      if (!Number.isFinite(questionNumber) || questionNumber < 1) {
        return res.status(400).json({
          success: false,
          error: `Row ${rowNumber}: Invalid Q value`,
        });
      }

      const marks = Number(q.Marks);

      if (!Number.isFinite(marks) || marks <= 0) {
        return res.status(400).json({
          success: false,
          error: `Row ${rowNumber}: Invalid Marks value`,
        });
      }

      const board = normalizeBoard(q.Board);

      if (!board) {
        return res.status(400).json({
          success: false,
          error: `Row ${rowNumber}: Invalid Board "${q.Board}". Allowed values: CBSE / NCERT, ICSE, IGCSE, SSC, IB`,
        });
      }

      const subject = normalizeSubject(q.Subject);

      if (!subject) {
        return res.status(400).json({
          success: false,
          error: `Row ${rowNumber}: Invalid Subject "${q.Subject}"`,
        });
      }

      const difficulty = normalizeDifficulty(q.Difficulty);

      if (!difficulty) {
        return res.status(400).json({
          success: false,
          error: `Row ${rowNumber}: Invalid Difficulty "${q.Difficulty}". Use Easy, Medium, or Difficult`,
        });
      }

      rows.push({
        ID: id,
        Class: classNumber,
        Subject: subject,
        Chapter: String(q.Chapter).trim(),
        Concept: String(q.Concept).trim(),
        Q: questionNumber,
        Question: String(q.Question).trim(),
        A: String(q.A).trim(),
        B: String(q.B).trim(),
        C: String(q.C).trim(),
        D: String(q.D).trim(),
        Correct: correct,
        Marks: marks,
        Difficulty: difficulty,
        Board: board,

        Explaination:
          q.Explaination == null
            ? ""
            : String(q.Explaination).trim(),

        Source:
          q.Source == null
            ? ""
            : String(q.Source).trim(),
      });
    }

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
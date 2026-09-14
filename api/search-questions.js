export default async function handler(req, res) {
  if (req.method !== "GET") {
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

    const classNumber = String(req.query.class || "").trim();
    const subject = String(req.query.subject || "").trim();
    const chapter = String(req.query.chapter || "").trim();

    if (!classNumber || !subject || !chapter) {
      return res.status(400).json({
        success: false,
        error: "Class, Subject and Chapter are required",
      });
    }

    const params = new URLSearchParams();

    params.set(
      "select",
      "ID,Class,Subject,Chapter,Concept,Q,Question,Difficulty,Board,Source"
    );
    params.set("Class", `eq.${classNumber}`);
    params.set("Subject", `eq.${subject}`);
   params.set("Chapter", `ilike.*${chapter}*`);
    params.set("order", "Q.asc");

    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/questions?${params.toString()}`,
      {
        method: "GET",
        headers: {
          apikey: SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        },
      }
    );

    const questions = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        success: false,
        error:
          questions?.message ||
          "Unable to load questions from Supabase",
      });
    }

    return res.status(200).json({
      success: true,
      count: Array.isArray(questions)
        ? questions.length
        : 0,
      questions: Array.isArray(questions)
        ? questions
        : [],
    });
  } catch (error) {
    console.error("Search questions error:", error);

    return res.status(500).json({
      success: false,
      error: "Unable to search questions",
      details: error?.message || String(error),
    });
  }
}

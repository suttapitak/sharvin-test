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

    const ids = req.body?.ids;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        error: "No question IDs supplied",
      });
    }

    if (ids.length > 500) {
      return res.status(400).json({
        success: false,
        error: "Maximum 500 questions can be deleted at one time",
      });
    }

    const cleanIds = ids
      .map((id) => String(id || "").trim())
      .filter(Boolean);

    if (cleanIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: "No valid question IDs supplied",
      });
    }

    const encodedIds = cleanIds
      .map((id) => `"${id.replace(/"/g, '\\"')}"`)
      .join(",");

    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/questions?ID=in.(${encodeURIComponent(
        encodedIds
      )})`,
      {
        method: "DELETE",
        headers: {
          apikey: SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          Prefer: "return=representation",
        },
      }
    );

    const deletedRows = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        success: false,
        error:
          deletedRows?.message ||
          "Unable to delete questions from Supabase",
      });
    }

    return res.status(200).json({
      success: true,
      deleted: Array.isArray(deletedRows)
        ? deletedRows.length
        : cleanIds.length,
      deletedRows: Array.isArray(deletedRows)
        ? deletedRows
        : [],
    });
  } catch (error) {
    console.error("Delete questions error:", error);

    return res.status(500).json({
      success: false,
      error: "Unable to delete questions",
      details: error?.message || String(error),
    });
  }
}

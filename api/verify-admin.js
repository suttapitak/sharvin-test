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
      error: "Incorrect Admin Password",
    });
  }

  return res.status(200).json({
    success: true,
    message: "Admin Password verified",
  });
}

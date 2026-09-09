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
      fileName,
      fileType,
      fileData,
    } = req.body || {};

    if (!fileName || !fileType || !fileData) {
      return res.status(400).json({
        success: false,
        error: "File name, type and data are required.",
      });
    }

    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
    ];

    if (!allowedTypes.includes(fileType)) {
      return res.status(400).json({
        success: false,
        error: "Only PDF, JPG, JPEG and PNG files are allowed.",
      });
    }

    const match = String(fileData).match(
      /^data:(.+);base64,(.+)$/
    );

    if (!match) {
      return res.status(400).json({
        success: false,
        error: "Invalid file data.",
      });
    }

    const base64Data = match[2];
    const buffer = Buffer.from(base64Data, "base64");

    const maxFileSize = 2.5 * 1024 * 1024;

    if (buffer.length > maxFileSize) {
      return res.status(400).json({
        success: false,
        error:
          "Each source file must currently be smaller than 2.5 MB.",
      });
    }

    const formData = new FormData();

    formData.append(
      "file",
      new Blob([buffer], { type: fileType }),
      fileName
    );

    formData.append("purpose", "user_data");

    const openAIResponse = await fetch(
      "https://api.openai.com/v1/files",
      {
        method: "POST",
        headers: {
          Authorization:
            `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: formData,
      }
    );

    const responseText = await openAIResponse.text();

    if (!openAIResponse.ok) {
      console.error(
        "OpenAI file upload error:",
        responseText
      );

      return res.status(openAIResponse.status).json({
        success: false,
        error: responseText,
      });
    }

    const data = JSON.parse(responseText);

    return res.status(200).json({
      success: true,
      file: {
        id: data.id,
        name: fileName,
        type: fileType,
        size: buffer.length,
      },
    });
  } catch (error) {
    console.error("AI source upload error:", error);

    return res.status(500).json({
      success: false,
      error:
        error.message || "Unable to upload source file.",
    });
  }
}

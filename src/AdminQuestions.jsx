import { useState } from "react";
import logo from "./assets/logo.jpg";

const REQUIRED_COLUMNS = [
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
  "Explaination",
  "Source",
];

function parseCSV(text) {
  const rows = [];
  let row = [];
  let value = "";
  let insideQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"' && insideQuotes && nextChar === '"') {
      value += '"';
      i++;
    } else if (char === '"') {
      insideQuotes = !insideQuotes;
    } else if (char === "," && !insideQuotes) {
      row.push(value);
      value = "";
    } else if ((char === "\n" || char === "\r") && !insideQuotes) {
      if (char === "\r" && nextChar === "\n") {
        i++;
      }

      row.push(value);

      if (row.some((cell) => String(cell).trim() !== "")) {
        rows.push(row);
      }

      row = [];
      value = "";
    } else {
      value += char;
    }
  }

  if (value !== "" || row.length > 0) {
    row.push(value);

    if (row.some((cell) => String(cell).trim() !== "")) {
      rows.push(row);
    }
  }

  return rows;
}

export default function AdminQuestions() {
  const [adminSecret, setAdminSecret] = useState("");
  const [fileName, setFileName] = useState("");
  const [questions, setQuestions] = useState([]);
  const [errors, setErrors] = useState([]);
  const [importing, setImporting] = useState(false);
  const [message, setMessage] = useState("");
const [aiClass, setAiClass] = useState("7");
const [aiSubject, setAiSubject] = useState("");
const [aiChapter, setAiChapter] = useState("");
const [aiBoard, setAiBoard] = useState("CBSE");
const [aiQuestionCount, setAiQuestionCount] = useState("3");
const [aiSourceText, setAiSourceText] = useState("");
  const [aiSourceFiles, setAiSourceFiles] = useState([]);
const [aiUploadedSources, setAiUploadedSources] = useState([]);
const [aiUploadingFiles, setAiUploadingFiles] = useState(false);
const [aiUploadProgress, setAiUploadProgress] = useState("");
const [selectedAiQuestions, setSelectedAiQuestions] = useState([]);

function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Unable to read file."));

    reader.readAsDataURL(file);
  });
}

async function handleAiSourceFiles(event) {
  const files = Array.from(event.target.files || []);

  if (!files.length) return;

  if (!aiPasswordVerified) {
    setAiError("Please verify the Admin Password before selecting files.");
    event.target.value = "";
    return;
  }

  if (files.length > 10) {
    setAiError("You can upload a maximum of 10 files at one time.");
    event.target.value = "";
    return;
  }

  const allowedTypes = [
    "application/pdf",
    "image/jpeg",
    "image/png",
  ];

  for (const file of files) {
    if (!allowedTypes.includes(file.type)) {
      setAiError(
        `${file.name}: Only PDF, JPG, JPEG and PNG files are allowed.`
      );
      event.target.value = "";
      return;
    }

    const maxFileSize = 2.5 * 1024 * 1024;

    if (file.size > maxFileSize) {
      setAiError(
        `${file.name}: Each file must currently be smaller than 2.5 MB.`
      );
      event.target.value = "";
      return;
    }
  }

  setAiError("");
  setAiSourceFiles(files);
  setAiUploadedSources([]);
  setAiUploadingFiles(true);
  setAiUploadProgress(`Uploading 0 of ${files.length} files...`);

  try {
    const uploaded = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      setAiUploadProgress(
        `⏳ Uploading ${i + 1} of ${files.length}: ${file.name}`
      );

      const fileData = await readFileAsDataURL(file);

      const response = await fetch("/api/upload-ai-source", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-secret": aiAdminPassword,
        },
        body: JSON.stringify({
          fileName: file.name,
          fileType: file.type,
          fileData,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error || `Unable to upload ${file.name}.`
        );
      }

      uploaded.push(data.file);
      setAiUploadedSources([...uploaded]);
    }

    setAiUploadProgress(
      `✅ ${uploaded.length} source files uploaded and ready.`
    );
  } catch (error) {
    setAiUploadedSources([]);
    setAiError(
      error?.message || "Unable to upload source files."
    );
    setAiUploadProgress("");
  } finally {
    setAiUploadingFiles(false);
  }
}
const [aiQuestions, setAiQuestions] = useState([]);
const [aiGenerating, setAiGenerating] = useState(false);
const [aiError, setAiError] = useState("");
    // Separate Admin Password controls for AI Generator
  const [aiAdminPassword, setAiAdminPassword] = useState("");
  const [showAiPassword, setShowAiPassword] = useState(false);
  const [aiPasswordVerified, setAiPasswordVerified] = useState(false);
  const [aiPasswordChecking, setAiPasswordChecking] = useState(false);
  const [aiPasswordMessage, setAiPasswordMessage] = useState("");

  // Separate Admin Password controls for CSV Upload
  const [csvAdminPassword, setCsvAdminPassword] = useState("");
  const [showCsvPassword, setShowCsvPassword] = useState(false);
  const [csvPasswordVerified, setCsvPasswordVerified] = useState(false);
  const [csvPasswordChecking, setCsvPasswordChecking] = useState(false);
  const [csvPasswordMessage, setCsvPasswordMessage] = useState("");
  async function verifyAdminPassword(type) {
  const isAI = type === "ai";

  const password = isAI
    ? aiAdminPassword
    : csvAdminPassword;

  const setChecking = isAI
    ? setAiPasswordChecking
    : setCsvPasswordChecking;

  const setVerified = isAI
    ? setAiPasswordVerified
    : setCsvPasswordVerified;

  const setPasswordMessage = isAI
    ? setAiPasswordMessage
    : setCsvPasswordMessage;

  if (!password.trim()) {
    setVerified(false);
    setPasswordMessage("Please enter Admin Password.");
    return;
  }

  setChecking(true);
  setVerified(false);
  setPasswordMessage("");

  try {
    const response = await fetch("/api/verify-admin", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-secret": password,
      },
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      setVerified(false);
      setPasswordMessage(
        data.error || "Incorrect Admin Password."
      );
      return;
    }

    setVerified(true);
    setPasswordMessage("Admin Password verified.");
  } catch (error) {
    setVerified(false);
    setPasswordMessage(
      error?.message || "Unable to verify password."
    );
  } finally {
    setChecking(false);
  }
}
  function resetImport() {
    setFileName("");
    setQuestions([]);
    setErrors([]);
    setMessage("");
  }

  function validateQuestions(data) {
    const validationErrors = [];
    const ids = new Set();

    data.forEach((q, index) => {
      const rowNumber = index + 2;

      REQUIRED_COLUMNS.forEach((column) => {
        if (
          q[column] === undefined ||
          q[column] === null ||
          String(q[column]).trim() === ""
        ) {
          validationErrors.push(
            `Row ${rowNumber}: ${column} is missing.`
          );
        }
      });

      const id = String(q.ID || "").trim();

      if (id) {
        if (ids.has(id)) {
          validationErrors.push(
            `Row ${rowNumber}: Duplicate ID ${id}.`
          );
        }

        ids.add(id);
      }

      const correct = String(q.Correct || "")
        .trim()
        .toUpperCase();

      if (correct && !["A", "B", "C", "D"].includes(correct)) {
        validationErrors.push(
          `Row ${rowNumber}: Correct must be A, B, C, or D.`
        );
      }

      const classNumber = Number(q.Class);

      if (!Number.isInteger(classNumber) || classNumber < 1 || classNumber > 12) {
        validationErrors.push(
          `Row ${rowNumber}: Class must be between 1 and 12.`
        );
      }

      const marks = Number(q.Marks);

      if (!Number.isFinite(marks) || marks <= 0) {
        validationErrors.push(
          `Row ${rowNumber}: Marks must be greater than 0.`
        );
      }

      const questionNumber = Number(q.Q);

      if (!Number.isFinite(questionNumber) || questionNumber <= 0) {
        validationErrors.push(
          `Row ${rowNumber}: Q must be a valid question number.`
        );
      }
    });

    return validationErrors;
  }

  async function handleFile(event) {
    resetImport();

    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".csv")) {
      setErrors(["Please select a CSV file."]);
      return;
    }

    setFileName(file.name);

    try {
      const text = await file.text();
      const parsedRows = parseCSV(text);

      if (parsedRows.length < 2) {
        setErrors(["CSV contains no question rows."]);
        return;
      }

      const headers = parsedRows[0].map((header) =>
        String(header)
          .replace(/^\uFEFF/, "")
          .trim()
      );

      const missingColumns = REQUIRED_COLUMNS.filter(
        (column) => !headers.includes(column)
      );

      if (missingColumns.length > 0) {
        setErrors([
          `Missing required columns: ${missingColumns.join(", ")}`,
        ]);
        return;
      }

      const data = parsedRows.slice(1).map((row) => {
        const item = {};

        headers.forEach((header, index) => {
          item[header] =
            row[index] === undefined
              ? ""
              : String(row[index]).trim();
        });

        return item;
      });

      const validationErrors = validateQuestions(data);

      setQuestions(data);
      setErrors(validationErrors);

      if (validationErrors.length === 0) {
        setMessage(
          `${data.length} questions validated successfully. Review them below before importing.`
        );
      }
    } catch (error) {
      console.error(error);
      setErrors(["Unable to read the CSV file."]);
    }
  }

  async function importQuestions() {
    setMessage("");

    if (!adminSecret.trim()) {
      setErrors(["Enter the Admin Import Secret first."]);
      return;
    }

    if (questions.length === 0) {
      setErrors(["No questions are ready for import."]);
      return;
    }

    const validationErrors = validateQuestions(questions);

    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    const confirmed = window.confirm(
      `Import ${questions.length} questions into the live Sharvin Academy database?`
    );

    if (!confirmed) return;

    try {
      setImporting(true);
      setErrors([]);

      const response = await fetch("/api/import-questions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-secret": adminSecret.trim(),
        },
        body: JSON.stringify({
          questions,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result?.details?.message ||
            result?.error ||
            "Import failed."
        );
      }

      setMessage(
        `${result.inserted} questions added successfully to Supabase.`
      );

      setQuestions([]);
      setFileName("");
    } catch (error) {
      setErrors([
        error?.message || "Unable to import questions.",
      ]);
    } finally {
      setImporting(false);
    }
  }
async function handleGenerateQuestions() {
  setAiError("");
  setAiQuestions([]);

  if (!aiPasswordVerified) {
  setAiError("Please verify the Admin Password first.");
  return;
}

  if (!aiClass || !aiSubject.trim() || !aiChapter.trim()) {
    setAiError("Class, Subject and Chapter are required.");
    return;
  }

if (!aiSourceText.trim() && aiUploadedSources.length === 0) {
  setAiError("Paste textbook content or upload PDF/JPG/PNG source files first.");
  return;
}

  const count = Number(aiQuestionCount);

  if (!Number.isInteger(count) || count < 1 || count > 50) {
    setAiError("Question count must be between 1 and 50.");
    return;
  }

  setAiGenerating(true);

  try {
    const response = await fetch("/api/generate-questions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
       "x-admin-secret": aiAdminPassword,
      },
      body: JSON.stringify({
        classNumber: Number(aiClass),
        subject: aiSubject.trim(),
        chapter: aiChapter.trim(),
        board: aiBoard.trim(),
        questionCount: count,
        sourceText: aiSourceText.trim(),
        sourceFiles: aiUploadedSources,
      }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.error || "Unable to generate questions.");
    }

    setAiQuestions(data.questions || []);
    setSelectedAiQuestions(
  (data.questions || []).map((_, index) => index)
);
  } catch (error) {
    setAiError(error?.message || "Unable to generate questions.");
  } finally {
    setAiGenerating(false);
  }
}
  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.header}>
          <img
            src={logo}
            alt="Sharvin Academy"
            style={styles.logo}
          />

          <div>
            <h1 style={styles.title}>
              Sharvin Academy
            </h1>

            <div style={styles.subtitle}>
              Admin Question Manager
            </div>
          </div>
        </div>

        <div style={styles.notice}>
          This page adds questions directly to the live
          Supabase question database. Always review the
          questions before importing.
        </div>

        
         
            <div style={styles.card}>
  <h2 style={styles.cardTitle}>
    Generate Questions with AI
  </h2>
<label style={styles.label}>Admin Password</label>

<div
  style={{
    display: "flex",
    gap: "10px",
    alignItems: "center",
  }}
>
  <input
    type={showAiPassword ? "text" : "password"}
    value={aiAdminPassword}
    onChange={(e) => {
      setAiAdminPassword(e.target.value);
      setAiPasswordVerified(false);
      setAiPasswordMessage("");
    }}
    placeholder="Enter Admin Password"
    autoComplete="off"
    style={{
      ...styles.input,
      flex: 1,
    }}
  />

  <button
    type="button"
    onClick={() => setShowAiPassword(!showAiPassword)}
    style={styles.button}
  >
    {showAiPassword ? "Hide" : "View"}
  </button>

  <button
    type="button"
    onClick={() => verifyAdminPassword("ai")}
    disabled={aiPasswordChecking}
    style={styles.button}
  >
    {aiPasswordChecking ? "⏳ Checking..." : "Enter"}
  </button>
</div>

{aiPasswordMessage && (
  <div
    style={{
      marginTop: "10px",
      fontWeight: "600",
      color: aiPasswordVerified ? "#166534" : "#991b1b",
    }}
  >
    {aiPasswordVerified ? "✅ " : "❌ "}
    {aiPasswordMessage}
  </div>
)}

<div style={{ height: "18px" }} />
  <label style={styles.label}>Class</label>
  <input
    type="number"
    min="1"
    max="12"
    value={aiClass}
    onChange={(e) => setAiClass(e.target.value)}
    style={styles.input}
  />

  <div style={{ height: "14px" }} />

  <label style={styles.label}>Subject</label>
  <input
    type="text"
    value={aiSubject}
    onChange={(e) => setAiSubject(e.target.value)}
    placeholder="Example: Science"
    style={styles.input}
  />

  <div style={{ height: "14px" }} />

  <label style={styles.label}>Chapter</label>
  <input
    type="text"
    value={aiChapter}
    onChange={(e) => setAiChapter(e.target.value)}
    placeholder="Example: Earth, Moon, and the Sun"
    style={styles.input}
  />

  <div style={{ height: "14px" }} />

  <label style={styles.label}>Board</label>
  <input
    type="text"
    value={aiBoard}
    onChange={(e) => setAiBoard(e.target.value)}
    placeholder="Example: CBSE"
    style={styles.input}
  />

  <div style={{ height: "14px" }} />

  <label style={styles.label}>Number of Questions</label>
  <input
    type="number"
    min="1"
    max="50"
    value={aiQuestionCount}
    onChange={(e) => setAiQuestionCount(e.target.value)}
    style={styles.input}
  />

  <div style={{ height: "14px" }} />

  <label style={styles.label}>
    Textbook / Chapter Content
  </label>

  <textarea
    value={aiSourceText}
    onChange={(e) => setAiSourceText(e.target.value)}
    placeholder="Paste the textbook or chapter content here..."
    rows={12}
    style={{
      ...styles.input,
      resize: "vertical",
      minHeight: "220px",
      fontFamily: "inherit",
    }}
  />
<div style={{ height: "14px" }} />

<label style={styles.label}>
  Or Upload Textbook / Chapter File
</label>

<input
  type="file"
  multiple
  accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
  onChange={handleAiSourceFiles}
  disabled={aiUploadingFiles}
/>

{aiSourceFiles.length > 0 && (
  <div style={{ marginTop: "10px" }}>
    <strong>Selected source files ({aiSourceFiles.length}):</strong>

    {aiSourceFiles.map((file, index) => (
      <div key={`${file.name}-${index}`} style={{ marginTop: "4px" }}>
        {index + 1}. {file.name}{" "}
        ({(file.size / 1024 / 1024).toFixed(2)} MB)
      </div>
    ))}
  </div>
)}

{aiUploadProgress && (
  <div
    style={{
      marginTop: "12px",
      fontWeight: "600",
      color: aiUploadProgress.startsWith("✅")
        ? "#166534"
        : "#1e3a8a",
    }}
  >
    {aiUploadProgress}
  </div>
)}
  <div style={{ height: "18px" }} />

  <button
    type="button"
    onClick={handleGenerateQuestions}
   disabled={aiGenerating || aiUploadingFiles}
    style={styles.button}
  >
    {aiUploadingFiles
  ? "⏳ Uploading Source Files..."
  : aiGenerating
    ? `⏳ Generating ${aiQuestionCount} Questions...`
    : "Generate Questions"}
  </button>

  {aiError && (
    <div
      style={{
        marginTop: "18px",
        padding: "12px",
        borderRadius: "8px",
        background: "#fee2e2",
        color: "#991b1b",
      }}
    >
      {aiError}
    </div>
  )}

  {aiQuestions.length > 0 && (
  <div style={{ marginTop: "24px" }}>
    <h3>
      Generated Questions ({aiQuestions.length})
    </h3>

    <div
      style={{
        display: "flex",
        gap: "10px",
        alignItems: "center",
        flexWrap: "wrap",
        marginBottom: "14px",
      }}
    >
      <strong>
        Selected: {selectedAiQuestions.length} of {aiQuestions.length}
      </strong>

      <button
        type="button"
        onClick={() =>
          setSelectedAiQuestions(
            aiQuestions.map((_, index) => index)
          )
        }
        style={styles.button}
      >
        Select All
      </button>

      <button
        type="button"
        onClick={() => setSelectedAiQuestions([])}
        style={styles.button}
      >
        Deselect All
      </button>
    </div>

    {aiQuestions.map((q, index) => (
      <div
        key={index}
        style={{
          marginTop: "16px",
          padding: "16px",
          border: "1px solid #d1d5db",
          borderRadius: "10px",
        }}
      >
        <div
          style={{
            marginBottom: "10px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <input
            type="checkbox"
            checked={selectedAiQuestions.includes(index)}
            onChange={() => {
              setSelectedAiQuestions((current) =>
                current.includes(index)
                  ? current.filter((item) => item !== index)
                  : [...current, index]
              );
            }}
          />

          <strong>Include this question</strong>
        </div>

        <strong>
          {index + 1}. {q.Question}
        </strong>

        <div style={{ marginTop: "10px" }}>
          A. {q.A}
        </div>
        <div>B. {q.B}</div>
        <div>C. {q.C}</div>
        <div>D. {q.D}</div>

        <div style={{ marginTop: "10px" }}>
          <strong>Correct:</strong> {q.Correct}
        </div>

        <div>
          <strong>Difficulty:</strong>{" "}
          {q.Difficulty}
        </div>

        <div>
          <strong>Concept:</strong> {q.Concept}
        </div>

        <div style={{ marginTop: "6px" }}>
          <strong>Explanation:</strong>{" "}
          {q.Explaination}
        </div>
      </div>
    ))}
  </div>
)}
</div>

<div style={{ height: "24px" }} />
            <div style={styles.card}>
  <h2 style={styles.cardTitle}>
            Bulk Upload CSV
          </h2>

          <label style={styles.label}>
            Admin Import Secret
          </label>

          <input
            type="password"
            value={adminSecret}
            onChange={(e) =>
              setAdminSecret(e.target.value)
            }
            placeholder="Enter admin secret"
            autoComplete="off"
            style={styles.input}
          />

          <div style={{ height: "18px" }} />

          <label style={styles.label}>
            Select Question CSV
          </label>

          <input
            type="file"
            accept=".csv,text/csv"
            onChange={handleFile}
            style={styles.fileInput}
          />

          {fileName && (
            <div style={styles.fileName}>
              Selected file: {fileName}
            </div>
          )}

          <div style={styles.schema}>
            Required columns:
            <br />
            ID, Class, Subject, Chapter, Concept, Q,
            Question, A, B, C, D, Correct, Marks,
            Difficulty, Board, Explaination, Source
            <br />
            <strong>
              Correct must contain A, B, C, or D.
            </strong>
          </div>
        </div>

        {errors.length > 0 && (
          <div style={styles.errorBox}>
            <strong>
              Validation failed ({errors.length})
            </strong>

            <div style={styles.errorList}>
              {errors.slice(0, 30).map((error, index) => (
                <div key={index}>
                  • {error}
                </div>
              ))}

              {errors.length > 30 && (
                <div>
                  ...and {errors.length - 30} more errors.
                </div>
              )}
            </div>
          </div>
        )}

        {message && (
          <div style={styles.successBox}>
            {message}
          </div>
        )}

        {questions.length > 0 && (
          <div style={styles.card}>
            <div style={styles.previewHeader}>
              <div>
                <h2 style={styles.cardTitle}>
                  Preview
                </h2>

                <div>
                  Total questions:{" "}
                  <strong>{questions.length}</strong>
                </div>
              </div>

              <button
                onClick={importQuestions}
                disabled={
                  importing || errors.length > 0
                }
                style={{
                  ...styles.importButton,
                  opacity:
                    importing || errors.length > 0
                      ? 0.5
                      : 1,
                }}
              >
                {importing
                  ? "Importing..."
                  : `Import ${questions.length} Questions`}
              </button>
            </div>

            <div style={styles.tableWrapper}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>ID</th>
                    <th style={styles.th}>Class</th>
                    <th style={styles.th}>Subject</th>
                    <th style={styles.th}>Chapter</th>
                    <th style={styles.th}>Q</th>
                    <th style={styles.th}>Question</th>
                    <th style={styles.th}>A</th>
                    <th style={styles.th}>B</th>
                    <th style={styles.th}>C</th>
                    <th style={styles.th}>D</th>
                    <th style={styles.th}>Correct</th>
                    <th style={styles.th}>Difficulty</th>
                  </tr>
                </thead>

                <tbody>
                  {questions
                    .slice(0, 20)
                    .map((q, index) => (
                      <tr key={`${q.ID}-${index}`}>
                        <td style={styles.td}>
                          {q.ID}
                        </td>
                        <td style={styles.td}>
                          {q.Class}
                        </td>
                        <td style={styles.td}>
                          {q.Subject}
                        </td>
                        <td style={styles.td}>
                          {q.Chapter}
                        </td>
                        <td style={styles.td}>
                          {q.Q}
                        </td>
                        <td style={styles.questionCell}>
                          {q.Question}
                        </td>
                        <td style={styles.td}>
                          {q.A}
                        </td>
                        <td style={styles.td}>
                          {q.B}
                        </td>
                        <td style={styles.td}>
                          {q.C}
                        </td>
                        <td style={styles.td}>
                          {q.D}
                        </td>
                        <td style={styles.correctCell}>
                          {q.Correct}
                        </td>
                        <td style={styles.td}>
                          {q.Difficulty}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            {questions.length > 20 && (
              <div style={styles.previewNote}>
                Showing the first 20 of{" "}
                {questions.length} questions.
              </div>
            )}
          </div>
        )}

        <div style={styles.footer}>
          Sharvin Academy — Question Bank Administration
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f4f7fb",
    padding: "30px 16px",
    fontFamily:
      "Arial, Helvetica, sans-serif",
  },

  container: {
    maxWidth: "1250px",
    margin: "0 auto",
  },

  header: {
    background: "#13264c",
    color: "white",
    padding: "22px 28px",
    borderRadius: "14px",
    display: "flex",
    alignItems: "center",
    gap: "18px",
    marginBottom: "20px",
  },

  logo: {
    width: "68px",
    height: "68px",
    objectFit: "contain",
    borderRadius: "8px",
  },

  title: {
    margin: 0,
    fontSize: "28px",
  },

  subtitle: {
    marginTop: "6px",
    fontSize: "16px",
    opacity: 0.9,
  },

  notice: {
    background: "#fff7dd",
    border: "1px solid #ead899",
    borderRadius: "10px",
    padding: "14px 18px",
    marginBottom: "20px",
    lineHeight: 1.5,
  },

  card: {
    background: "white",
    borderRadius: "14px",
    padding: "24px",
    marginBottom: "20px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
  },

  cardTitle: {
    marginTop: 0,
    marginBottom: "18px",
    color: "#13264c",
  },

  label: {
    display: "block",
    fontWeight: 700,
    marginBottom: "8px",
  },

  input: {
    width: "100%",
    maxWidth: "500px",
    boxSizing: "border-box",
    padding: "12px",
    border: "1px solid #c8ced8",
    borderRadius: "8px",
    fontSize: "16px",
  },

  fileInput: {
    display: "block",
    marginTop: "8px",
  },

  fileName: {
    marginTop: "12px",
    fontWeight: 600,
  },

  schema: {
    marginTop: "20px",
    background: "#f5f7fa",
    borderRadius: "8px",
    padding: "14px",
    lineHeight: 1.6,
    fontSize: "14px",
  },

  errorBox: {
    background: "#fff0f0",
    border: "1px solid #e6aaaa",
    color: "#8a1818",
    borderRadius: "10px",
    padding: "16px",
    marginBottom: "20px",
  },

  errorList: {
    marginTop: "10px",
    lineHeight: 1.5,
    maxHeight: "280px",
    overflowY: "auto",
  },

  successBox: {
    background: "#edf9f0",
    border: "1px solid #abd5b5",
    color: "#155c27",
    borderRadius: "10px",
    padding: "16px",
    marginBottom: "20px",
    fontWeight: 700,
  },

  previewHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "20px",
    flexWrap: "wrap",
  },

  importButton: {
    border: "none",
    background: "#1769aa",
    color: "white",
    padding: "13px 20px",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: 700,
    fontSize: "15px",
  },

  tableWrapper: {
    overflowX: "auto",
    marginTop: "20px",
    border: "1px solid #e0e4ea",
    borderRadius: "8px",
  },

  table: {
    width: "100%",
    borderCollapse: "collapse",
    minWidth: "1500px",
  },

  th: {
    background: "#13264c",
    color: "white",
    padding: "10px",
    textAlign: "left",
    whiteSpace: "nowrap",
    fontSize: "13px",
  },

  td: {
    padding: "9px",
    borderBottom: "1px solid #e6e9ee",
    verticalAlign: "top",
    fontSize: "13px",
  },

  questionCell: {
    padding: "9px",
    borderBottom: "1px solid #e6e9ee",
    verticalAlign: "top",
    fontSize: "13px",
    minWidth: "260px",
  },

  correctCell: {
    padding: "9px",
    borderBottom: "1px solid #e6e9ee",
    verticalAlign: "top",
    fontWeight: 800,
    fontSize: "14px",
    textAlign: "center",
  },

  previewNote: {
    marginTop: "12px",
    fontSize: "13px",
    color: "#666",
  },

  footer: {
    textAlign: "center",
    padding: "20px",
    color: "#667",
    fontSize: "13px",
  },
};

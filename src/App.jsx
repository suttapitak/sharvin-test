import { useState, useEffect } from "react";
import logo from "./assets/logo.jpg";

const API =
  "https://script.google.com/macros/s/AKfycbwIFddo27aMS7nr-Hr21NjOmdC8qbLDCMUPV0g77WQVlQh_yg2i9VBrPc-M60KrmYnL/exec";

export default function App() {
  const [studentName, setStudentName] = useState("");
  const [school, setSchool] = useState("");
  const [parentPhone, setParentPhone] = useState("");
  const [selectedClass, setSelectedClass] = useState("3");
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [score, setScore] = useState(null);
  const [started, setStarted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);   
  
  const [errors, setErrors] = useState({
    studentName: "",
    school: "",
    parentPhone: "",
    selectedClass: "",
  });

  function validateForm() {
    const newErrors = {
      studentName: "",
      school: "",
      parentPhone: "",
      selectedClass: "",
    };

    let isValid = true;

    if (!studentName.trim()) {
      newErrors.studentName = "Please enter student name.";
      isValid = false;
    }

    if (!school.trim()) {
      newErrors.school = "Please enter school name.";
      isValid = false;
    }

    if (!parentPhone.trim()) {
      newErrors.parentPhone = "Please enter parent mobile number.";
      isValid = false;
    } else if (!/^[0-9]{10}$/.test(parentPhone.trim())) {
      newErrors.parentPhone = "Please enter a valid 10-digit mobile number.";
      isValid = false;
    }

    if (!selectedClass.trim()) {
      newErrors.selectedClass = "Please select class.";
      isValid = false;
    }

    setErrors(newErrors);

    if (!isValid) {
      if (newErrors.studentName) {
        alert(newErrors.studentName);
      } else if (newErrors.school) {
        alert(newErrors.school);
      } else if (newErrors.parentPhone) {
        alert(newErrors.parentPhone);
      } else if (newErrors.selectedClass) {
        alert(newErrors.selectedClass);
      }
    }

    return isValid;
  }

function getTestDurationByClass() {
  return 30 * 60; // 30 minutes for all classes
}

  async function startTest() {
    if (!validateForm()) return;

    setLoading(true);
    setScore(null);
    setAnswers({});
    setSubmitted(false);
    setTimeLeft(getTestDurationByClass());

    try {
      const response = await fetch(`${API}?class=${selectedClass}`);
      const data = await response.json();
      setQuestions(data);
      setStarted(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      alert("Failed to load questions.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  function selectAnswer(questionText, value) {
    setAnswers((prev) => ({
      ...prev,
      [questionText]: value,
    }));
  }

  async function submitTest() {
    let correct = 0;

    questions.forEach((q) => {
      if (String(answers[q.question]) === String(q.correct)) {
        correct++;
      }
    });

    setScore(correct);
    setSubmitted(true);

    const payload = {
      studentName: studentName,
      school: school,
      parentPhone: parentPhone,
      className: selectedClass,
      score: correct,
      totalQuestions: questions.length,
      attempted: Object.keys(answers).length,
      testType: `Class ${selectedClass} Online Test`,
      submittedBy: "Student",
      answers: answers,
      questions: questions,
    };

    try {
      const response = await fetch(API, {
        method: "POST",
        headers: {
          "Content-Type": "text/plain;charset=utf-8",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.text();
      console.log("Saved result:", result);
      alert("Result saved successfully.");
      window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
    } catch (error) {
      console.error("Failed to save result:", error);
      alert("Score shown, but failed to save result in Google Sheet.");
    }
  }

useEffect(() => {
  if (!started || submitted) return;
  if (timeLeft <= 0) return;

  const timer = setInterval(() => {
    setTimeLeft((prev) => {
      if (prev <= 1) {
        clearInterval(timer);

        setTimeout(() => {
          if (!submitted) {
            submitTest();
            alert("Time is over. Test submitted automatically.");
          }
        }, 0);

        return 0;
      }

      return prev - 1;
    });
  }, 1000);

  return () => clearInterval(timer);
}, [started, submitted, timeLeft]);

  function resetTest() {
    setStudentName("");
    setSchool("");
    setParentPhone("");
    setSelectedClass("3");
    setQuestions([]);
    setAnswers({});
    setScore(null);
    setStarted(false);
    setLoading(false);
    setSubmitted(false);
    setTimeLeft(0);
    setErrors({
      studentName: "",
      school: "",
      parentPhone: "",
      selectedClass: "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
}

function downloadResultPdf() {
  window.print();
}

  const styles = {
    page: {
      minHeight: "100vh",
      background: "linear-gradient(180deg, #06153c 0%, #0b1e54 100%)",
      color: "#f8f3e7",
      fontFamily: "Georgia, 'Times New Roman', serif",
      padding: "30px 20px 60px",
    },
    container: {
      maxWidth: "960px",
      margin: "0 auto",
    },
    heroCard: {
      background: "rgba(255,255,255,0.06)",
      border: "1px solid rgba(215,180,95,0.35)",
      borderRadius: "24px",
      padding: "28px",
      boxShadow: "0 10px 35px rgba(0,0,0,0.28)",
      backdropFilter: "blur(8px)",
      marginBottom: "24px",
    },
    logo: {
      width: "140px",
      maxWidth: "100%",
      display: "block",
      margin: "0 auto 16px",
      borderRadius: "18px",
      boxShadow: "0 8px 24px rgba(0,0,0,0.35)",
    },
    academyName: {
      textAlign: "center",
      fontSize: "44px",
      margin: "0 0 8px",
      color: "#f4d27c",
      fontWeight: "700",
      letterSpacing: "0.5px",
    },
    punchline: {
      textAlign: "center",
      fontSize: "20px",
      margin: "0 0 10px",
      color: "#fff3c8",
    },
    subtitle: {
      textAlign: "center",
      fontSize: "18px",
      margin: "0 0 18px",
      color: "#d7cfae",
    },
    infoBar: {
      textAlign: "center",
      fontSize: "15px",
      color: "#f8f3e7",
      lineHeight: 1.7,
      fontFamily: "Arial, sans-serif",
    },
    formCard: {
      background: "#ffffff",
      color: "#1d2740",
      borderRadius: "22px",
      padding: "28px",
      boxShadow: "0 12px 30px rgba(0,0,0,0.18)",
      marginBottom: "24px",
    },
    questionCard: {
      background: "#ffffff",
      color: "#1d2740",
      borderRadius: "18px",
      padding: "22px",
      boxShadow: "0 10px 22px rgba(0,0,0,0.12)",
      marginBottom: "18px",
    },
    label: {
      display: "block",
      marginBottom: "8px",
      fontWeight: "700",
      fontSize: "15px",
      fontFamily: "Arial, sans-serif",
    },
    input: {
      padding: "12px 14px",
      width: "100%",
      fontSize: "16px",
      borderRadius: "12px",
      border: "1px solid #cbd5e1",
      boxSizing: "border-box",
      outline: "none",
      fontFamily: "Arial, sans-serif",
    },
    select: {
      padding: "12px 14px",
      width: "100%",
      fontSize: "16px",
      borderRadius: "12px",
      border: "1px solid #cbd5e1",
      boxSizing: "border-box",
      outline: "none",
      background: "#fff",
      fontFamily: "Arial, sans-serif",
    },
    buttonPrimary: {
      padding: "14px 22px",
      fontSize: "16px",
      cursor: "pointer",
      background: "linear-gradient(90deg, #c9a64f 0%, #f4d27c 100%)",
      color: "#18233d",
      border: "none",
      borderRadius: "12px",
      fontWeight: "700",
      boxShadow: "0 8px 18px rgba(0,0,0,0.16)",
      fontFamily: "Arial, sans-serif",
    },
    buttonSecondary: {
      padding: "14px 22px",
      fontSize: "16px",
      cursor: "pointer",
      background: "#0b1e54",
      color: "#ffffff",
      border: "none",
      borderRadius: "12px",
      fontWeight: "700",
      fontFamily: "Arial, sans-serif",
    },

    buttonSuccess: {
  padding: "14px 22px",
  fontSize: "16px",
  cursor: "pointer",
  background: "#1f7a3d",
  color: "#ffffff",
  border: "none",
  borderRadius: "12px",
  fontWeight: "700",
  marginTop: "16px"
},
    error: {
      color: "#dc2626",
      marginTop: "6px",
      fontSize: "14px",
      fontFamily: "Arial, sans-serif",
    },
    metaBox: {
      background: "rgba(255,255,255,0.08)",
      border: "1px solid rgba(215,180,95,0.3)",
      borderRadius: "16px",
      padding: "18px 20px",
      marginBottom: "20px",
      lineHeight: 1.8,
      color: "#fff8e1",
      fontFamily: "Arial, sans-serif",
    },
    scoreBox: {
      marginTop: "24px",
      padding: "18px 20px",
      borderRadius: "14px",
      background: "#ecfdf5",
      color: "#166534",
      fontSize: "28px",
      fontWeight: "700",
      fontFamily: "Arial, sans-serif",
      border: "1px solid #bbf7d0",
    },
    footer: {
      marginTop: "30px",
      textAlign: "center",
      color: "#d8caa2",
      fontSize: "14px",
      lineHeight: 1.7,
      fontFamily: "Arial, sans-serif",
    },
  };
function downloadResultPdf() {
  window.print();
}

const totalMarks = questions.length;
const percentage =
  score !== null && totalMarks > 0
    ? ((score / totalMarks) * 100).toFixed(2)
    : "0.00";

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.heroCard}>
          <img src={logo} alt="Sharvin Academy Logo" style={styles.logo} />
          <h1 style={styles.academyName}>Sharvin Academy</h1>
          <div style={styles.punchline}>Premium Concept Learning Studio</div>
          <div style={styles.subtitle}>Scholarship & Diagnostic Test Portal</div>
          <div style={styles.infoBar}>
            Please fill all mandatory details correctly before starting the test.
            <br />
            For support contact: <strong>9021300386, 020-40043888</strong>
          </div>
        </div>

        {!started && (
          <div style={styles.formCard}>
            <div style={{ marginBottom: "15px" }}>
              <label style={styles.label}>
                Student Name <span style={{ color: "red" }}>*</span>
              </label>
              <input
                type="text"
                value={studentName}
                onChange={(e) => {
                  setStudentName(e.target.value);
                  setErrors((prev) => ({ ...prev, studentName: "" }));
                }}
                style={styles.input}
              />
              {errors.studentName && <div style={styles.error}>{errors.studentName}</div>}
            </div>

            <div style={{ marginBottom: "15px" }}>
              <label style={styles.label}>
                School Name <span style={{ color: "red" }}>*</span>
              </label>
              <input
                type="text"
                value={school}
                onChange={(e) => {
                  setSchool(e.target.value);
                  setErrors((prev) => ({ ...prev, school: "" }));
                }}
                style={styles.input}
              />
              {errors.school && <div style={styles.error}>{errors.school}</div>}
            </div>

            <div style={{ marginBottom: "15px" }}>
              <label style={styles.label}>
                Parent Mobile Number <span style={{ color: "red" }}>*</span>
              </label>
              <input
                type="text"
                value={parentPhone}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, "");
                  setParentPhone(value);
                  setErrors((prev) => ({ ...prev, parentPhone: "" }));
                }}
                maxLength={10}
                style={styles.input}
              />
              {errors.parentPhone && <div style={styles.error}>{errors.parentPhone}</div>}
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label style={styles.label}>
                Select Class <span style={{ color: "red" }}>*</span>
              </label>
              <select
                value={selectedClass}
                onChange={(e) => {
                  setSelectedClass(e.target.value);
                  setErrors((prev) => ({ ...prev, selectedClass: "" }));
                }}
                style={styles.select}
              >
                <option value="3">Class 3</option>
                <option value="4">Class 4</option>
                <option value="5">Class 5</option>
                <option value="6">Class 6</option>
              </select>
              {errors.selectedClass && <div style={styles.error}>{errors.selectedClass}</div>}
            </div>

            <button onClick={startTest} disabled={loading} style={styles.buttonPrimary}>
              {loading ? "Loading Questions..." : "Start Test"}
            </button>
          </div>
        )}

        {started && (
          <>
          <div
  style={{
    background: "#ffe9e9",
    color: "#8b0000",
    padding: "12px 18px",
    borderRadius: "10px",
    fontWeight: "bold",
    fontSize: "18px",
    marginBottom: "20px",
    textAlign: "center"
  }}
>
  Time Left: {formatTime(timeLeft)}
</div>
            <div style={styles.metaBox}>
              <strong>Student:</strong> {studentName}
              <br />
              <strong>School:</strong> {school}
              <br />
              <strong>Parent Phone:</strong> {parentPhone}
              <br />
              <strong>Class:</strong> {selectedClass}
            </div>

            {questions.map((q, i) => (
              <div key={i} style={styles.questionCard}>
                <h3 style={{ marginTop: 0, marginBottom: "14px" }}>
                  Q{i + 1}. {q.question}
                </h3>

                {[q.A, q.B, q.C, q.D].map((opt) => (
                  <div key={opt} style={{ marginBottom: "8px", fontFamily: "Arial, sans-serif" }}>
                    <label>
                      <input
                        type="radio"
                        name={q.question}
                        value={opt}
                        checked={answers[q.question] === opt}
                        onChange={() => selectAnswer(q.question, opt)}
                        disabled={submitted}
                      />
                      {" "}{opt}
                    </label>
                  </div>
                ))}
              </div>
            ))}

            {!submitted && (
              <button onClick={submitTest} style={{ ...styles.buttonPrimary, marginRight: "12px" }}>
                Submit Test
              </button>
            )}

            {submitted && (
              <button onClick={resetTest} style={styles.buttonSecondary}>
                Start New Test
              </button>
            )}

           {score !== null && (
  <div style={styles.scoreBox}>

    <div style={{ marginBottom: "12px", fontSize: "22px", fontWeight: "700" }}>
      Sharvin Academy Result Summary
    </div>

    <div style={{ marginBottom: "8px" }}>
      Student Name: <strong>{studentName}</strong>
    </div>

    <div style={{ marginBottom: "8px" }}>
      School: <strong>{school}</strong>
    </div>

    <div style={{ marginBottom: "8px" }}>
      Class: <strong>{selectedClass}</strong>
    </div>

    <div style={{ marginBottom: "8px" }}>
      Parent Phone: <strong>{parentPhone}</strong>
    </div>

    <div style={{ marginBottom: "8px" }}>
      Score: <strong>{score}</strong> / <strong>{totalMarks}</strong>
    </div>

    <div style={{ marginBottom: "8px" }}>
      Percentage: <strong>{percentage}%</strong>
    </div>

    <div style={{ marginBottom: "12px" }}>
      Date: <strong>{new Date().toLocaleString()}</strong>
    </div>

    <button
      onClick={downloadResultPdf}
      style={styles.buttonSuccess}
    >
      Download / Print Result
    </button>

  </div>
)}

        <div style={styles.footer}>
          Sharvin Academy • Premium Concept Learning Studio
          <br />
          Amanora Magarpatta Road, Hadapsar • Amanora Branch
        </div>
      </div>
    </div>
  );
}
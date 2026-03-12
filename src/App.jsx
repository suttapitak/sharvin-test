import { useState, useEffect } from "react";
import logo from "./assets/logo.jpg";

const API =
  "hhttps://script.google.com/macros/s/AKfycbwIFddo27aMS7nr-Hr21NjOmdC8qbLDCMUPV0g77WQVlQh_yg2i9VBrPc-M60KrmYnL/exec";

const SUBJECT_OPTIONS = [
  "Maths",
  "Science",
  "Physics",
  "Chemistry",
  "Biology",
  "English",
  "SST",
  "Marathi",
  "Hindi",
];

export default function App() {
  const [studentName, setStudentName] = useState("");
  const [school, setSchool] = useState("");
  const [parentPhone, setParentPhone] = useState("");
  const [selectedClass, setSelectedClass] = useState("1");
  const [selectedSubject, setSelectedSubject] = useState("Maths");
  const [selectedChapter, setSelectedChapter] = useState("All Chapters");
  const [selectedConcept, setSelectedConcept] = useState("All Concepts");
  const [selectedDifficulty, setSelectedDifficulty] = useState("All Levels");

  const [chapterOptions, setChapterOptions] = useState(["All Chapters"]);
  const [conceptOptions, setConceptOptions] = useState(["All Concepts"]);
  const [difficultyOptions, setDifficultyOptions] = useState(["All Levels"]);

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
    selectedSubject: "",
  });

  useEffect(() => {
    document.title = "Sharvin Academy Test Portal";
  }, []);

  useEffect(() => {
    async function loadFilters() {
      try {
        const url =
          `${API}?mode=filters` +
          `&class=${encodeURIComponent(selectedClass)}` +
          `&subject=${encodeURIComponent(selectedSubject)}` +
          `&chapter=${encodeURIComponent(selectedChapter)}`;

        const response = await fetch(url);
        const data = await response.json();

        const chapters = ["All Chapters", ...(data.chapters || [])];
        const concepts = ["All Concepts", ...(data.concepts || [])];
        const difficulties = ["All Levels", ...(data.difficulties || [])];

        setChapterOptions(chapters);
        setConceptOptions(concepts);
        setDifficultyOptions(difficulties);

        if (!chapters.includes(selectedChapter)) {
          setSelectedChapter("All Chapters");
        }
        if (!concepts.includes(selectedConcept)) {
          setSelectedConcept("All Concepts");
        }
        if (!difficulties.includes(selectedDifficulty)) {
          setSelectedDifficulty("All Levels");
        }
      } catch (error) {
        console.error("Failed to load filters:", error);
      }
    }

    if (selectedClass && selectedSubject) {
      loadFilters();
    }
  }, [selectedClass, selectedSubject, selectedChapter]);

  function validateForm() {
    const newErrors = {
      studentName: "",
      school: "",
      parentPhone: "",
      selectedClass: "",
      selectedSubject: "",
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

    if (!selectedSubject.trim()) {
      newErrors.selectedSubject = "Please select subject.";
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
      } else if (newErrors.selectedSubject) {
        alert(newErrors.selectedSubject);
      }
    }

    return isValid;
  }

  function getTestDurationByClass() {
    return 30 * 60;
  }

  async function startTest() {
    if (!validateForm()) return;

    setLoading(true);
    setScore(null);
    setAnswers({});
    setSubmitted(false);
    setTimeLeft(getTestDurationByClass());

    try {
      const url =
        `${API}?class=${encodeURIComponent(selectedClass)}` +
        `&subject=${encodeURIComponent(selectedSubject)}` +
        `&chapter=${encodeURIComponent(selectedChapter)}` +
        `&concept=${encodeURIComponent(selectedConcept)}` +
        `&difficulty=${encodeURIComponent(selectedDifficulty)}`;

      const response = await fetch(url);
      const data = await response.json();

      if (!Array.isArray(data) || data.length === 0) {
        alert("No questions available for selected filters. Please change Chapter, Concept, or Difficulty.");
        return;
      }

      if (data.length < 30) {
        alert(`Only ${data.length} questions are available for selected filters. Please add more questions or relax the filters.`);
        return;
      }

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

  function selectAnswer(questionId, value) {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  }

  function calculateResult() {
    let totalScore = 0;
    let totalMarks = 0;

    questions.forEach((q) => {
      const marks = Number(q.marks || 1);
      totalMarks += marks;

      if (String(answers[q.id]) === String(q.correct)) {
        totalScore += marks;
      }
    });

    return { totalScore, totalMarks };
  }

  async function submitTest() {
    const { totalScore, totalMarks } = calculateResult();

    setScore(totalScore);
    setSubmitted(true);

    const payload = {
      studentName: studentName,
      school: school,
      parentPhone: parentPhone,
      className: selectedClass,
      subjectName: selectedSubject,
      score: totalScore,
      totalMarks: totalMarks,
      attempted: Object.keys(answers).length,
      testType: `Class ${selectedClass} ${selectedSubject} Practice Test`,
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
    setSelectedClass("1");
    setSelectedSubject("Maths");
    setSelectedChapter("All Chapters");
    setSelectedConcept("All Concepts");
    setSelectedDifficulty("All Levels");
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
      selectedSubject: "",
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

  const { totalMarks } = calculateResult();
  const percentage =
    score !== null && totalMarks > 0
      ? ((score / totalMarks) * 100).toFixed(2)
      : "0.00";

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
      marginTop: "16px",
      fontFamily: "Arial, sans-serif",
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
      fontSize: "20px",
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

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.heroCard}>
          <img src={logo} alt="Sharvin Academy Logo" style={styles.logo} />
          <h1 style={styles.academyName}>Sharvin Academy</h1>
          <div style={styles.punchline}>Premium Concept Learning Studio</div>
          <div style={styles.subtitle}>Practice Test Portal</div>
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
                {Array.from({ length: 12 }, (_, i) => i + 1).map((cls) => (
                  <option key={cls} value={String(cls)}>
                    Class {cls}
                  </option>
                ))}
              </select>
              {errors.selectedClass && <div style={styles.error}>{errors.selectedClass}</div>}
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label style={styles.label}>
                Select Subject <span style={{ color: "red" }}>*</span>
              </label>
              <select
                value={selectedSubject}
                onChange={(e) => {
                  setSelectedSubject(e.target.value);
                  setSelectedChapter("All Chapters");
                  setSelectedConcept("All Concepts");
                  setSelectedDifficulty("All Levels");
                  setErrors((prev) => ({ ...prev, selectedSubject: "" }));
                }}
                style={styles.select}
              >
                {SUBJECT_OPTIONS.map((subject) => (
                  <option key={subject} value={subject}>
                    {subject}
                  </option>
                ))}
              </select>
              {errors.selectedSubject && <div style={styles.error}>{errors.selectedSubject}</div>}
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label style={styles.label}>Chapter</label>
              <select
                value={selectedChapter}
                onChange={(e) => {
                  setSelectedChapter(e.target.value);
                  setSelectedConcept("All Concepts");
                }}
                style={styles.select}
              >
                {chapterOptions.map((chapter) => (
                  <option key={chapter} value={chapter}>
                    {chapter}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label style={styles.label}>Concept</label>
              <select
                value={selectedConcept}
                onChange={(e) => setSelectedConcept(e.target.value)}
                style={styles.select}
              >
                {conceptOptions.map((concept) => (
                  <option key={concept} value={concept}>
                    {concept}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label style={styles.label}>Difficulty</label>
              <select
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                style={styles.select}
              >
                {difficultyOptions.map((level) => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </select>
            </div>

            <button onClick={startTest} disabled={loading} style={styles.buttonPrimary}>
              {loading ? "Loading Questions..." : "Start Test"}
            </button>
          </div>
        )}

        {started && (
          <div>
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
              <br />
              <strong>Subject:</strong> {selectedSubject}
              <br />
              <strong>Chapter:</strong> {selectedChapter}
              <br />
              <strong>Concept:</strong> {selectedConcept}
              <br />
              <strong>Difficulty:</strong> {selectedDifficulty}
            </div>

            {questions.map((q, i) => (
              <div key={q.id || i} style={styles.questionCard}>
                <h3 style={{ marginTop: 0, marginBottom: "10px" }}>
                  Q{i + 1}. {q.question}
                </h3>

                <div style={{ fontSize: "13px", color: "#555", marginBottom: "12px" }}>
                  Chapter: {q.chapter || "-"} | Concept: {q.concept || "-"} | Difficulty: {q.difficulty || "-"} | Marks: {q.marks || 1}
                </div>

                {[q.A, q.B, q.C, q.D].map((opt) => {
                  const selectedAnswer = answers[q.id];
                  const attemptedThisQuestion = selectedAnswer !== undefined && selectedAnswer !== "";
                  const isSelectedOption = String(selectedAnswer) === String(opt);
                  const isCorrectOption = String(q.correct) === String(opt);

                  const showGreen =
                    submitted &&
                    attemptedThisQuestion &&
                    (isCorrectOption && (isSelectedOption || selectedAnswer !== q.correct));

                  const showRed =
                    submitted &&
                    attemptedThisQuestion &&
                    isSelectedOption &&
                    !isCorrectOption;

                  let border = "1px solid #ddd";
                  let background = "#fff";

                  if (showGreen) {
                    border = "2px solid #2e7d32";
                    background = "#e8f5e9";
                  } else if (showRed) {
                    border = "2px solid #c62828";
                    background = "#ffebee";
                  }

                  return (
                    <div
                      key={opt}
                      style={{
                        marginBottom: "8px",
                        fontFamily: "Arial, sans-serif",
                        padding: "10px 12px",
                        borderRadius: "10px",
                        border: border,
                        background: background
                      }}
                    >
                      <label style={{ display: "block", cursor: submitted ? "default" : "pointer" }}>
                        <input
                          type="radio"
                          name={`question-${q.id}`}
                          value={opt}
                          checked={answers[q.id] === opt}
                          onChange={() => selectAnswer(q.id, opt)}
                          disabled={submitted}
                        />
                        {" "}{opt}

                        {submitted && attemptedThisQuestion && showGreen && (
                          <span style={{ color: "#2e7d32", fontWeight: "700", marginLeft: "10px" }}>
                            Correct
                          </span>
                        )}

                        {submitted && attemptedThisQuestion && showRed && (
                          <span style={{ color: "#c62828", fontWeight: "700", marginLeft: "10px" }}>
                            Wrong
                          </span>
                        )}
                      </label>
                    </div>
                  );
                })}
              </div>
            ))}

            {!submitted && (
              <button
                onClick={submitTest}
                style={{ ...styles.buttonPrimary, marginRight: "12px" }}
              >
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
                  Subject: <strong>{selectedSubject}</strong>
                </div>

                <div style={{ marginBottom: "8px" }}>
                  Chapter: <strong>{selectedChapter}</strong>
                </div>

                <div style={{ marginBottom: "8px" }}>
                  Concept: <strong>{selectedConcept}</strong>
                </div>

                <div style={{ marginBottom: "8px" }}>
                  Difficulty: <strong>{selectedDifficulty}</strong>
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

                <button onClick={downloadResultPdf} style={styles.buttonSuccess}>
                  Download / Print Result
                </button>
              </div>
            )}
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
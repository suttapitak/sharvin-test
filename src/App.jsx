import { useState, useEffect } from "react";
import logo from "./assets/logo.jpg";

const API = "https://script.google.com/macros/s/AKfycbwwxw-TEHqb5yuv2B1nGGpgg0SIsQQ8hOCzOUY81I12txi3PmM9tLsJ1GLR9O-aeAwe/exec";
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
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
  const [gamification, setGamification] = useState(null);
  const [tierUp, setTierUp] = useState(null);
  const [dashboard, setDashboard] = useState(null);
const [dashboardLoading, setDashboardLoading] = useState(false);
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
function getTierName(coins) {
  const total = Number(coins || 0);

  if (total >= 550) return "Platinum Pro Max";
  if (total >= 500) return "Platinum Pro";
  if (total >= 450) return "Platinum";
  if (total >= 400) return "Gold Pro Max";
  if (total >= 350) return "Gold Pro";
  if (total >= 300) return "Gold";
  if (total >= 250) return "Silver Pro Max";
  if (total >= 200) return "Silver Pro";
  if (total >= 150) return "Silver";
  if (total >= 100) return "Bronze Pro Max";
  if (total >= 50) return "Bronze Pro";

  return "Bronze";
}
async function loadStudentDashboard() {
  if (!studentName || !parentPhone || !selectedClass) {
    alert("Please enter Student Name, Parent Mobile Number, and Class first.");
    return;
  }

  setDashboardLoading(true);

  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/rpc/get_student_dashboard`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
        },
        body: JSON.stringify({
          p_student_name: studentName,
          p_parent_mobile: parentPhone,
          p_class_name: selectedClass,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(await response.text());
    }

    const data = await response.json();
    setDashboard(data?.[0] || null);
  } catch (error) {
    console.error("Dashboard load failed:", error);
    alert("Unable to load student progress.");
  } finally {
    setDashboardLoading(false);
  }
}
  async function startTest() {
    if (!validateForm()) return;

    setLoading(true);
    setScore(null);
    setAnswers({});
    setSubmitted(false);
    setTimeLeft(getTestDurationByClass());

    try {
     const response = await fetch(
  `${SUPABASE_URL}/rest/v1/rpc/get_practice_questions`,
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
    },
    body: JSON.stringify({
      p_class: Number(selectedClass),
      p_subject: selectedSubject,
      p_chapter: selectedChapter,
      p_concept: selectedConcept,
      p_difficulty: selectedDifficulty,
      p_limit: 10,
    }),
  }
);

if (!response.ok) {
  throw new Error(await response.text());
}

const data = await response.json();

      if (!Array.isArray(data) || data.length === 0) {
        alert("No questions available for selected filters. Please change Chapter, Concept, or Difficulty.");
        return;
      }
    const normalizedQuestions = data.map((q) => ({
  ...q,
  id: q.ID,
  question: q.Question,
  chapter: q.Chapter,
  concept: q.Concept,
  difficulty: q.Difficulty,
  correct: q.Correct,
  marks: q.Marks,
}));

setQuestions(normalizedQuestions);
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

      if (String(answers[q.ID]) === String(q.correct)) {
        totalScore += marks;
      }
    });

    return { totalScore, totalMarks };
  }

  async function submitTest() {
    const { totalScore, totalMarks } = calculateResult();

    setScore(totalScore);
    setSubmitted(true);
const percentage =
  totalMarks > 0 ? (totalScore / totalMarks) * 100 : 0;

try {
  const gamificationResponse = await fetch(
    `${SUPABASE_URL}/rest/v1/rpc/complete_student_test`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
      },
      body: JSON.stringify({
        p_student_name: studentName,
        p_parent_mobile: parentPhone,
        p_class_name: selectedClass,
        p_school_name: school,
        p_percentage: percentage,
      }),
    }
  );

  if (!gamificationResponse.ok) {
    throw new Error(await gamificationResponse.text());
  }

  const gamificationData = await gamificationResponse.json();
  console.log("Gamification updated:", gamificationData);
  setGamification(gamificationData);
 const newCoins = Number(gamificationData?.[0]?.total_gold_coins || 0);
const coinsEarned = Number(gamificationData?.[0]?.coins_awarded || 0);
const oldCoins = newCoins - coinsEarned;

const tierThresholds = [50, 100, 150, 200, 250, 300, 350, 400, 450, 500, 550];

const crossedTier = tierThresholds.some(
  (threshold) => oldCoins < threshold && newCoins >= threshold
);

if (crossedTier) {
  setTierUp(gamificationData[0].student_level);
} else {
  setTierUp(null);
}
} catch (error) {
  console.error("Gamification update failed:", error);
}
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
         <button
  onClick={loadStudentDashboard}
  disabled={dashboardLoading}
  style={{
    ...styles.buttonSuccess,
    marginLeft: "12px",
  }}
>
  {dashboardLoading ? "Loading Progress..." : "View My Progress"}
</button>
        {dashboard && (
  <div
    style={{
      marginTop: "24px",
      padding: "22px",
      borderRadius: "16px",
      background: "#fff7d6",
      border: "2px solid #d4af37",
      color: "#146c3a",
      fontWeight: "700",
      fontSize: "18px",
    }}
  >
    <div
      style={{
        fontSize: "26px",
        fontWeight: "800",
        marginBottom: "14px",
      }}
    >
      📊 My Progress
    </div>

    <div>👤 Student: {dashboard.student_name}</div>
    <div>🏫 School: {dashboard.school_name}</div>
    <div>🎓 Class: {dashboard.class_name}</div>
    <div>🪙 Total Gold Coins: {dashboard.total_gold_coins}</div>
    <div>✅ Tests Attempted: {dashboard.tests_attempted}</div>

    <div>
      🏆 Current Tier:{" "}
      {dashboard.total_gold_coins < 50
        ? "🥉 Bronze"
        : dashboard.total_gold_coins < 100
        ? "🥉 Bronze Pro"
        : dashboard.total_gold_coins < 150
        ? "🥉 Bronze Pro Max"
        : dashboard.total_gold_coins < 200
        ? "🥈 Silver"
        : dashboard.total_gold_coins < 250
        ? "🥈 Silver Pro"
        : dashboard.total_gold_coins < 300
        ? "🥈 Silver Pro Max"
        : dashboard.total_gold_coins < 350
        ? "🥇 Gold"
        : dashboard.total_gold_coins < 400
        ? "🥇 Gold Pro"
        : dashboard.total_gold_coins < 450
        ? "🥇 Gold Pro Max"
        : dashboard.total_gold_coins < 500
        ? "💎 Platinum"
        : dashboard.total_gold_coins < 550
        ? "💎 Platinum Pro"
        : "💎 Platinum Pro Max"}
    </div>

    <div>📅 Last Test: {dashboard.last_test_date || "No test yet"}</div>
  </div>
)} 
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
              <div key={q.ID || i} style={styles.questionCard}>
                <h3 style={{ marginTop: 0, marginBottom: "10px" }}>
                  Q{i + 1}. {q.question}
                </h3>

                <div style={{ fontSize: "13px", color: "#555", marginBottom: "12px" }}>
                  Chapter: {q.chapter || "-"} | Concept: {q.concept || "-"} | Difficulty: {q.difficulty || "-"} | Marks: {q.marks || 1}
                </div>

                {[q.A, q.B, q.C, q.D].map((opt) => {
                  const selectedAnswer = answers[q.ID];
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
                          name={`question-${q.ID}`}
value={opt}
checked={answers[q.ID] === opt}
onChange={() => selectAnswer(q.ID, opt)}
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
                {/* Performance Celebration Banner */}
<div
  style={{
    textAlign: "center",
    padding: "22px 16px",
    marginBottom: "22px",
    borderRadius: "18px",
    background:
      score >= 6
        ? "linear-gradient(135deg, #fff7cc, #ffe082)"
        : score >= 1
        ? "linear-gradient(135deg, #e3f2fd, #bbdefb)"
        : "linear-gradient(135deg, #f5f5f5, #e0e0e0)",
    boxShadow: "0 6px 18px rgba(0,0,0,0.15)",
    border: "2px solid rgba(255,255,255,0.8)",
  }}
>
  <div
    style={{
      fontSize: "30px",
      fontWeight: "800",
      marginBottom: "8px",
    }}
  >
    {score >= 6
      ? "🎉 Congratulations!"
      : score >= 1
      ? "👍 Good Effort!"
      : "💪 Hard Luck This Time!"}
  </div>

  <div
    style={{
      fontSize: "18px",
      fontWeight: "600",
      marginBottom: "14px",
    }}
  >
    {score >= 6
      ? "Excellent effort — keep going!"
      : score >= 1
      ? "You are doing well. Keep practicing and improve further!"
      : "Let's try again and improve next time!"}
  </div>

  {gamification && gamification[0] && (() => {
  const g = gamification[0];
  const totalCoins = Number(g.total_gold_coins || 0);

  let nextTierName = null;
  let nextTierCoins = null;

  if (totalCoins < 50) {
    nextTierName = "Bronze Pro";
    nextTierCoins = 50;
  } else if (totalCoins < 100) {
    nextTierName = "Bronze Pro Max";
    nextTierCoins = 100;
  } else if (totalCoins < 150) {
    nextTierName = "Silver";
    nextTierCoins = 150;
  } else if (totalCoins < 200) {
    nextTierName = "Silver Pro";
    nextTierCoins = 200;
  } else if (totalCoins < 250) {
    nextTierName = "Silver Pro Max";
    nextTierCoins = 250;
  } else if (totalCoins < 300) {
    nextTierName = "Gold";
    nextTierCoins = 300;
  } else if (totalCoins < 350) {
    nextTierName = "Gold Pro";
    nextTierCoins = 350;
  } else if (totalCoins < 400) {
    nextTierName = "Gold Pro Max";
    nextTierCoins = 400;
  } else if (totalCoins < 450) {
    nextTierName = "Platinum";
    nextTierCoins = 450;
  } else if (totalCoins < 500) {
    nextTierName = "Platinum Pro";
    nextTierCoins = 500;
  } else if (totalCoins < 550) {
    nextTierName = "Platinum Pro Max";
    nextTierCoins = 550;
  }

  return (
    <div
      style={{
        fontSize: "18px",
        fontWeight: "700",
        lineHeight: "1.8",
      }}
    >
      🏆 Present Tier: {getTierName(totalCoins)}
      <br />
      🪙 Gold Coins Earned This Test: +{g.coins_awarded || 0}
      <br />
      ⭐ Total Gold Coins: {totalCoins}
      <br />
      ✨{" "}
      {nextTierCoins
        ? `You need ${nextTierCoins - totalCoins} more coins to reach ${nextTierName}`
        : "Maximum tier achieved!"}
    </div>
  );
})()}
</div>
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
{tierUp && (
  <div
    style={{
      marginTop: "20px",
      marginBottom: "20px",
      padding: "24px",
      borderRadius: "16px",
      background: "linear-gradient(135deg, #071a4a, #102d70)",
      border: "2px solid #d4af37",
      textAlign: "center",
      color: "#ffffff",
      boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
    }}
  >
    <img
      src={logo}
      alt="Sharvin Academy"
      style={{
        width: "110px",
        height: "110px",
        objectFit: "contain",
        borderRadius: "12px",
        marginBottom: "12px",
      }}
    />

    <div
      style={{
        fontSize: "30px",
        fontWeight: "800",
        color: "#ffd700",
        marginBottom: "8px",
      }}
    >
      🎉 CONGRATULATIONS! 🎉
    </div>

    <div
      style={{
        fontSize: "21px",
        fontWeight: "700",
        marginBottom: "6px",
      }}
    >
      You have been promoted to
    </div>

    <div
      style={{
        fontSize: "28px",
        fontWeight: "800",
        color: "#ffd700",
      }}
    >
      {tierUp === 2
        ? "🥉 Bronze Pro"
        : tierUp === 3
        ? "🥉 Bronze Pro Max"
        : tierUp === 4
        ? "🥈 Silver"
        : tierUp === 5
        ? "🥈 Silver Pro"
        : tierUp === 6
        ? "🥈 Silver Pro Max"
        : tierUp === 7
        ? "🥇 Gold"
        : tierUp === 8
        ? "🥇 Gold Pro"
        : tierUp === 9
        ? "🥇 Gold Pro Max"
        : tierUp === 10
        ? "💎 Platinum"
        : tierUp === 11
        ? "💎 Platinum Pro"
        : tierUp === 12
        ? "💎 Platinum Pro Max"
        : "New Tier"}
    </div>
  </div>
)}
                {gamification && gamification.length > 0 && (
  <div
    style={{
      marginTop: "20px",
      marginBottom: "20px",
      padding: "16px",
      borderRadius: "12px",
      background: "#fff7d6",
      fontWeight: "700",
      fontSize: "18px",
    }}
  >
   {(() => {
  const coins = gamification[0].total_gold_coins;

  const tiers = [
    { min: 0, name: "🥉 Bronze", next: 50, nextName: "Bronze Pro" },
    { min: 50, name: "🥉 Bronze Pro", next: 100, nextName: "Bronze Pro Max" },
    { min: 100, name: "🥉 Bronze Pro Max", next: 150, nextName: "Silver" },
    { min: 150, name: "🥈 Silver", next: 200, nextName: "Silver Pro" },
    { min: 200, name: "🥈 Silver Pro", next: 250, nextName: "Silver Pro Max" },
    { min: 250, name: "🥈 Silver Pro Max", next: 300, nextName: "Gold" },
    { min: 300, name: "🥇 Gold", next: 350, nextName: "Gold Pro" },
    { min: 350, name: "🥇 Gold Pro", next: 400, nextName: "Gold Pro Max" },
    { min: 400, name: "🥇 Gold Pro Max", next: 450, nextName: "Platinum" },
    { min: 450, name: "💎 Platinum", next: 500, nextName: "Platinum Pro" },
    { min: 500, name: "💎 Platinum Pro", next: 550, nextName: "Platinum Pro Max" },
    { min: 550, name: "💎 Platinum Pro Max", next: null, nextName: null },
  ];

  const currentTier = [...tiers].reverse().find((tier) => coins >= tier.min);

  return (
    <>
      {currentTier.name}
      <br />
      ✨{" "}
      {currentTier.next
        ? `${currentTier.next - coins} coins to ${currentTier.nextName}`
        : "Maximum tier achieved!"}
    </>
  );
})()}
    <br />
    🪙 Coins Earned: +{gamification[0].coins_awarded}
    <br />
    💰 Total Gold Coins: {gamification[0].total_gold_coins}
    <br />
    ✅ Tests Attempted: {gamification[0].total_tests_attempted}
  </div>
)}
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

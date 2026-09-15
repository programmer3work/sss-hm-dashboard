"use client";

import "./AIToolsModal.css";
import AcademicAnalytics from "./AcademicAnalytics";
import ReportPanel from "./ReportPanel";
import TextToVoiceButton from "./TextToVoiceButton";
import { getSupportedLanguages } from "@/config/languages";

import { useState } from "react";
import axios from "axios";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  LabelList,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";

// ==========================================
// CHART COLORS
// ==========================================

const COLORS = [
  "#3B82F6",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#8B5CF6",
  "#06B6D4",
];

const hasFullName = (value) => value.trim().split(/\s+/).filter(Boolean).length >= 2;



// ==========================================
// TEAMMATE AI BACKEND
// ==========================================

const aiApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_AI_API_BASE_URL,
});

export default function AIToolsModal({
  open,
  onClose,
  headmaster,
}) {
  // ==========================================
  // STATES
  // ==========================================

  const [selectedReport, setSelectedReport] = useState("");

  const [report, setReport] = useState("");

  const [analyticsData, setAnalyticsData] = useState(null);

  const [loading, setLoading] = useState(false);

  // Student Assessment
  const [student, setStudent] = useState("");
  const [subject, setSubject] = useState("All Subjects");

  // Class Assessment
  const [selectedClass, setSelectedClass] = useState("");

  // Teacher Assessment
  const [teacher, setTeacher] = useState("");

  // Translation
  const [language, setLanguage] = useState("English");
  const [originalReport, setOriginalReport] = useState("");
  const [isTranslating, setIsTranslating] =
    useState(false);


  //audio translation
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [audioTranslation, setAudioTranslation] = useState("");
  const supportedLanguages = getSupportedLanguages();

  // ==========================================
  // SAFE CONDITIONAL RETURN
  // ==========================================

  if (!open) return null;

  // ==========================================
  // RESET REPORT DATA
  // ==========================================

  const resetReportData = () => {
    setAnalyticsData(null);
    setReport("");
    setOriginalReport("");
    setLanguage("English");
  };

  // ==========================================
  // GENERATE REPORT
  // ==========================================

  const generateReport = async () => {
    if (!selectedReport) {
      alert("Please select an assessment.");
      return;
    }

    setLoading(true);

    try {
      // ======================================
      // CLASS ASSESSMENT
      // ======================================

      if (selectedReport === "class") {
        if (!selectedClass.trim()) {
          alert("Please enter class.");
          return;
        }

        const payload = {
          class_name: selectedClass.trim(),
          metrics: {},
          user_email: headmaster?.email || "",
          client_name: "SSS",
        };

        console.log(
          "Class Assessment Payload:",
          payload
        );

        const res = await aiApi.post(
          "/api/hm/assess/classroom",
          payload
        );

        console.log(
          "Class Assessment Response:",
          res.data
        );

        const classReport =
          res.data?.assessment_report || null;

        setAnalyticsData(classReport);

        setOriginalReport(
          JSON.stringify(classReport || {})
        );

        setReport("");
        setLanguage("English");
      }

      // ======================================
      // TEACHER ASSESSMENT
      // ======================================

      else if (selectedReport === "teacher") {
        if (!teacher.trim()) {
          alert("Please enter teacher name.");
          return;
        }

        const payload = {
          teacher_name: teacher.trim(),
          metrics: {},
          user_email: headmaster?.email || "",
          client_name: "SSS",
        };

        console.log(
          "Teacher Assessment Payload:",
          payload
        );

        const res = await aiApi.post(
          "/api/hm/assess/teacher",
          payload
        );

        console.log(
          "Teacher Assessment Response:",
          res.data
        );

        const teacherReport =
          res.data?.assessment_report || "";

        setReport(teacherReport);
        setOriginalReport(teacherReport);

        setAnalyticsData(null);
        setLanguage("English");
      }

      // ======================================
      // STUDENT ASSESSMENT
      // ======================================

      else if (selectedReport === "student") {
        if (!hasFullName(student)) {
          alert("Please enter the student's full name.");
          return;
        }

        const payload = {
          student_name: student.trim(),

          metrics: {
            class_name: selectedClass,
            subject: subject,
          },

          user_email: headmaster?.email || "",
          client_name: "SSS",
        };

        console.log(
          "Student Assessment Payload:",
          payload
        );

        const res = await aiApi.post(
          "/api/hm/assess/student",
          payload
        );

        console.log(
          "Student Assessment Response:",
          res.data
        );

        const studentReport =
          res.data?.assessment_report || null;

        setAnalyticsData(studentReport);

        setOriginalReport(
          JSON.stringify(studentReport || {})
        );

        setReport("");
        setLanguage("English");
      }
    } catch (error) {
      console.error(
        "Assessment API Error:",
        error?.response?.data || error
      );

      alert(
        error?.response?.data?.detail ||
          "Failed to generate assessment."
      );
    } finally {
      setLoading(false);
    }
  };

// ==========================================
// TRANSLATION HELPER
// ==========================================

const translateText = async (text, targetLanguage) => {
  if (!text) return text;

  const res = await aiApi.post(
    "/api/hm/translate",
    {
      text,
      target_language: targetLanguage,
      user_email: headmaster?.email || "",
      client_name: "SSS",
    }
  );

  console.log("Translation API Response:", res.data);

  return res.data?.translated_text || text;
};


// ==========================================
// TRANSLATION
// ==========================================

const translateContent = async (selectedLanguage) => {
  if (!originalReport) {
    return;
  }

  setIsTranslating(true);

  try {
    // ======================================
    // RESTORE ENGLISH
    // ======================================

    if (selectedLanguage === "English") {
      if (selectedReport === "teacher") {
        setReport(originalReport);
      }

      if (
        selectedReport === "class" ||
        selectedReport === "student"
      ) {
        try {
          const originalData =
            JSON.parse(originalReport);

          setAnalyticsData(originalData);
        } catch (error) {
          console.error(
            "Restore English Error:",
            error
          );
        }
      }

      return;
    }

    // ======================================
    // TEACHER ASSESSMENT
    // ======================================

    if (selectedReport === "teacher") {
      const translatedReport =
        await translateText(
          originalReport,
          selectedLanguage
        );

      setReport(translatedReport);

      return;
    }

    // ======================================
    // PARSE ORIGINAL JSON
    // ======================================

    let originalData = {};

    try {
      originalData =
        JSON.parse(originalReport);
    } catch (error) {
      console.error(
        "Original Report Parse Error:",
        error
      );

      return;
    }

    // ======================================
    // CLASS ASSESSMENT
    // ======================================

    if (selectedReport === "class") {
      const translatedSummary =
        await translateText(
          originalData.macro_summary || "",
          selectedLanguage
        );

      const translatedTopAreas =
        await Promise.all(
          (
            originalData.top_performing_areas || []
          ).map((item) =>
            translateText(
              String(item),
              selectedLanguage
            )
          )
        );

      const translatedIntervention =
        await Promise.all(
          (
            originalData.areas_needing_intervention || []
          ).map((item) =>
            translateText(
              String(item),
              selectedLanguage
            )
          )
        );

      const translatedRecommendations =
        await Promise.all(
          (
            originalData.teacher_recommendations || []
          ).map((item) =>
            translateText(
              String(item),
              selectedLanguage
            )
          )
        );

      setAnalyticsData({
        ...originalData,

        macro_summary:
          translatedSummary,

        top_performing_areas:
          translatedTopAreas,

        areas_needing_intervention:
          translatedIntervention,

        teacher_recommendations:
          translatedRecommendations,

        chart_data:
          originalData.chart_data || [],
      });

      return;
    }

    // ======================================
    // STUDENT ASSESSMENT
    // ======================================

    if (selectedReport === "student") {
      const translatedSummary =
        await translateText(
          originalData.executive_summary || "",
          selectedLanguage
        );

      const translatedStrengths =
        await Promise.all(
          (
            originalData.strengths || []
          ).map((item) =>
            translateText(
              String(item),
              selectedLanguage
            )
          )
        );

      const translatedImprovement =
        await Promise.all(
          (
            originalData.areas_for_improvement || []
          ).map((item) =>
            translateText(
              String(item),
              selectedLanguage
            )
          )
        );

      const translatedActions =
        await Promise.all(
          (
            originalData.recommended_actions || []
          ).map((item) =>
            translateText(
              String(item),
              selectedLanguage
            )
          )
        );

      setAnalyticsData({
        ...originalData,

        executive_summary:
          translatedSummary,

        strengths:
          translatedStrengths,

        areas_for_improvement:
          translatedImprovement,

        recommended_actions:
          translatedActions,

        chart_data:
          originalData.chart_data || [],
      });
    }
  } catch (error) {
    console.error(
      "Translation Error:",
      error?.response?.data || error
    );

    alert(
      error?.response?.data?.detail ||
        "Translation failed."
    );
  } finally {
    setIsTranslating(false);
  }
};

  // ==========================================
  // SAFE DATA
  // ==========================================

  const analysis = analyticsData || {};

  // ==========================================
  // STUDENT CHART
  //
  // API:
  // chart_data:
  // [
  //   {
  //     subject: "Mathematics",
  //     score: 88,
  //     class_average: 78
  //   }
  // ]
  // ==========================================

  const studentChartData =
    selectedReport === "student" &&
    Array.isArray(analysis?.chart_data)
      ? analysis.chart_data.map((item) => ({
          subject:
            item.subject ??
            item.test ??
            "Unknown",

          score:
            Number(item.score) || 0,

          class_average:
            Number(item.class_average) || 0,
        }))
      : [];

  // ==========================================
  // CLASS CHART
  //
  // API:
  // chart_data:
  // [
  //   {
  //     metric_name: "...",
  //     value: 0
  //   }
  // ]
  // ==========================================

  const classChartData =
    selectedReport === "class" &&
    Array.isArray(analysis?.chart_data)
      ? analysis.chart_data.map((item) => ({
          metric_name:
            item.metric_name ?? "Unknown",

          value:
            Number(item.value) || 0,
        }))
      : [];

    // ==========================================
// TEXT FOR TEXT-TO-VOICE
// ==========================================

let textToSpeak = "";

// Teacher Assessment
if (selectedReport === "teacher") {
  textToSpeak = report || "";
}

// Class Assessment
if (selectedReport === "class") {
  textToSpeak = [
    analyticsData?.macro_summary,

    ...(analyticsData?.top_performing_areas || []),

    ...(analyticsData?.areas_needing_intervention || []),

    ...(analyticsData?.teacher_recommendations || []),
  ]
    .filter(Boolean)
    .join(". ");
}

// Student Assessment
if (selectedReport === "student") {
  textToSpeak = [
    analyticsData?.executive_summary,

    ...(analyticsData?.strengths || []),

    ...(analyticsData?.areas_for_improvement || []),

    ...(analyticsData?.recommended_actions || []),
  ]
    .filter(Boolean)
    .join(". ");
}

  // ==========================================
  // RENDER ARRAY / STRING SAFELY
  // ==========================================

  const renderItems = (items) => {
    if (!items) {
      return <p>No data available.</p>;
    }

    // Array
    if (Array.isArray(items)) {
      if (items.length === 0) {
        return <p>No data available.</p>;
      }

      return (
        <ul className="analysis-list">
          {items.map((item, index) => (
            <li key={index}>
              {typeof item === "object"
                ? JSON.stringify(item)
                : String(item)}
            </li>
          ))}
        </ul>
      );
    }

    // String
    if (typeof items === "string") {
      return <p>{items}</p>;
    }

    // Object
    if (typeof items === "object") {
      return (
        <ul className="analysis-list">
          {Object.entries(items).map(
            ([key, value]) => (
              <li key={key}>
                <strong>{key}: </strong>

                {typeof value === "object"
                  ? JSON.stringify(value)
                  : String(value)}
              </li>
            )
          )}
        </ul>
      );
    }

    return <p>{String(items)}</p>;
  };

  // ==========================================
  // MAIN UI
  // ==========================================

  return (
    <div className="ai-modal-overlay">
      <div className="ai-modal">

        {/* ==================================
            HEADER
        ================================== */}

        <div className="ai-modal-header">
          <h2>🤖 AI Tools</h2>

          <button
            className="close-btn"
            onClick={onClose}
          >
            ✖
          </button>
        </div>

        <div className="ai-modal-body">

          {/* ==================================
              LEFT PANEL
          ================================== */}

          <div className="ai-left">

            {/* ==============================
                CLASS ASSESSMENT BUTTON
            ============================== */}

            <button
              className={`ai-card ${
                selectedReport === "class"
                  ? "active"
                  : ""
              }`}
              onClick={() => {
                setSelectedReport("class");
                resetReportData();
              }}
            >
              🏫 Class Assessment
            </button>

            {/* ==============================
                TEACHER ASSESSMENT BUTTON
            ============================== */}

            <button
              className={`ai-card ${
                selectedReport === "teacher"
                  ? "active"
                  : ""
              }`}
              onClick={() => {
                setSelectedReport("teacher");
                resetReportData();
              }}
            >
              👨‍🏫 Teacher Assessment
            </button>

            {/* ==============================
                STUDENT ASSESSMENT BUTTON
            ============================== */}

            <button
              className={`ai-card ${
                selectedReport === "student"
                  ? "active"
                  : ""
              }`}
              onClick={() => {
                setSelectedReport("student");
                resetReportData();
              }}
            >
              📊 Student Assessment
            </button>

            {/* ==============================
                GENERATE BUTTON
            ============================== */}

            <button
              className="generate-btn"
              onClick={generateReport}
              disabled={loading}
            >
              {loading
                ? "Generating..."
                : "Generate Report"}
            </button>
          </div>

          {/* ==================================
              RIGHT PANEL
          ================================== */}

          <div className="ai-right">

            {/* ==================================
                LANGUAGE
            ================================== */}

            <div className="language-bar">
              <label>Select Language</label>

              <select
                className="language-select"
                value={language}
                disabled={isTranslating || !originalReport}
                onChange={(e) => {
                  const lang =
                    e.target.value;

                  setLanguage(lang);

                  translateContent(lang);
                }}
              >
                {supportedLanguages.map((lang) => (
                  <option key={lang.value} value={lang.value}>
                    {lang.label}
                  </option>
                ))}
              </select>
                <TextToVoiceButton
    text={textToSpeak}
    language={language}
    languageCode={supportedLanguages.find((lang) => lang.value === language)?.ttsCode}
    userEmail={headmaster?.email || ""}
  />

              {isTranslating && (
                <span>
                  Translating...
                </span>
              )}
            </div>

            <div className="content-panel">

              {/* ==================================
                  CLASS ASSESSMENT
              ================================== */}

              {selectedReport === "class" && (
                <>

                  {/* Before Generate */}

                  {!analyticsData && (
                    <div className="analysis-container">

                      <h3 className="analytics-title">
                        🏫 Class Assessment
                      </h3>

                      <label>
                        Class Name
                      </label>

                      <input
                        type="text"
                        value={selectedClass}
                        placeholder="Example: 8"
                        onChange={(e) =>
                          setSelectedClass(
                            e.target.value
                          )
                        }
                        style={{
                          width: "100%",
                          padding: "12px",
                          marginTop: "8px",
                          borderRadius: "8px",
                          border:
                            "1px solid #ccc",
                        }}
                      />

                      <p
                        style={{
                          marginTop: "12px",
                        }}
                      >
                        Enter class name and click
                        Generate Report.
                      </p>
                    </div>
                  )}

                  {/* After Generate */}

                  {analyticsData && (
                    <>

                      <h3 className="analytics-title">
                        🏫 Class Assessment
                      </h3>

                      {/* =========================
                          MACRO SUMMARY
                      ========================= */}

                      {analysis.macro_summary && (
                        <>
                          <h4 className="chart-title">
                            AI Analysis
                          </h4>

                          <div className="analysis-container">
                            <p>
                              {
                                analysis.macro_summary
                              }
                            </p>
                          </div>
                        </>
                      )}

                      {/* =========================
                          TOP PERFORMING AREAS
                      ========================= */}

                      {analysis.top_performing_areas && (
                        <>
                          <h4 className="chart-title">
                            ✅ Top Performing Areas
                          </h4>

                          <div className="analysis-container">
                            {renderItems(
                              analysis.top_performing_areas
                            )}
                          </div>
                        </>
                      )}

                      {/* =========================
                          AREAS NEEDING INTERVENTION
                      ========================= */}

                      {analysis.areas_needing_intervention && (
                        <>
                          <h4 className="chart-title">
                            📌 Areas Needing
                            Intervention
                          </h4>

                          <div className="analysis-container">
                            {renderItems(
                              analysis.areas_needing_intervention
                            )}
                          </div>
                        </>
                      )}

                      {/* =========================
                          TEACHER RECOMMENDATIONS
                      ========================= */}

                      {analysis.teacher_recommendations && (
                        <>
                          <h4 className="chart-title">
                            💡 Teacher Recommendations
                          </h4>

                          <div className="analysis-container">
                            {renderItems(
                              analysis.teacher_recommendations
                            )}
                          </div>
                        </>
                      )}

                      {/* =========================
                          CLASS CHART
                      ========================= */}

                      {classChartData.length >
                        0 && (
                        <>
                          <h4 className="chart-title">
                            📊 Performance Overview
                          </h4>

                          <div className="chart-container">

                            <ResponsiveContainer
                              width="100%"
                              height={350}
                            >
                              <BarChart
                                data={
                                  classChartData
                                }
                              >
                                <XAxis
                                  dataKey="metric_name"
                                />

                                <YAxis
                                  domain={[
                                    0,
                                    100,
                                  ]}
                                />

                                <Tooltip />

                                <Bar
                                  dataKey="value"
                                  name="Value"
                                >
                                  <LabelList
                                    dataKey="value"
                                    position="top"
                                  />

                                  {classChartData.map(
                                    (
                                      _,
                                      index
                                    ) => (
                                      <Cell
                                        key={
                                          index
                                        }
                                        fill={
                                          COLORS[
                                            index %
                                              COLORS.length
                                          ]
                                        }
                                      />
                                    )
                                  )}
                                </Bar>
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </>
                      )}
                    </>
                  )}
                </>
              )}

              {/* ==================================
                  TEACHER ASSESSMENT
              ================================== */}

              {selectedReport ===
                "teacher" && (
                <>

                  {/* Before Generate */}

                  {!report && (
                    <div className="analysis-container">

                      <h3 className="analytics-title">
                        👨‍🏫 Teacher Assessment
                      </h3>

                      <label>
                        Teacher Name
                      </label>

                      <input
                        type="text"
                        value={teacher}
                        placeholder="Example: Sandipani Acharya"
                        onChange={(e) =>
                          setTeacher(
                            e.target.value
                          )
                        }
                        style={{
                          width: "100%",
                          padding: "12px",
                          marginTop: "8px",
                          borderRadius: "8px",
                          border:
                            "1px solid #ccc",
                        }}
                      />

                      <p
                        style={{
                          marginTop: "12px",
                        }}
                      >
                        Enter teacher name and click
                        Generate Report.
                      </p>
                    </div>
                  )}

                  {/* After Generate */}

                  {report && (
                    <ReportPanel
                      title="Teacher Assessment"
                      icon="👨‍🏫"
                      report={report}
                      previewTitle="Teacher Assessment Preview"
                      previewText="Enter teacher name and click Generate Report."
                    />
                  )}
                </>
              )}

              {/* ==================================
                  STUDENT ASSESSMENT
              ================================== */}

              {selectedReport ===
                "student" && (
                <>

                  {/* Student Input UI */}

                  {!analyticsData && (
                    <AcademicAnalytics
                      selectedClass={
                        selectedClass
                      }
                      setSelectedClass={
                        setSelectedClass
                      }
                      student={student}
                      setStudent={setStudent}
                      subject={subject}
                      setSubject={setSubject}
                    />
                  )}

                  {/* Student Result */}

                  {analyticsData && (
                    <>

                      <h3 className="analytics-title">
                        📊 Student Assessment
                      </h3>

                      {/* =========================
                          EXECUTIVE SUMMARY
                      ========================= */}

                      {analysis.executive_summary && (
                        <>
                          <h4 className="chart-title">
                            AI Analysis
                          </h4>

                          <div className="analysis-container">
                            <p>
                              {
                                analysis.executive_summary
                              }
                            </p>
                          </div>
                        </>
                      )}

                      {/* =========================
                          STRENGTHS
                      ========================= */}

                      {analysis.strengths && (
                        <>
                          <h4 className="chart-title">
                            ✅ Strengths
                          </h4>

                          <div className="analysis-container">
                            {renderItems(
                              analysis.strengths
                            )}
                          </div>
                        </>
                      )}

                      {/* =========================
                          AREAS FOR IMPROVEMENT
                      ========================= */}

                      {analysis.areas_for_improvement && (
                        <>
                          <h4 className="chart-title">
                            📌 Areas for
                            Improvement
                          </h4>

                          <div className="analysis-container">
                            {renderItems(
                              analysis.areas_for_improvement
                            )}
                          </div>
                        </>
                      )}

                      {/* =========================
                          RECOMMENDED ACTIONS
                      ========================= */}

                      {analysis.recommended_actions && (
                        <>
                          <h4 className="chart-title">
                            💡 Recommended Actions
                          </h4>

                          <div className="analysis-container">
                            {renderItems(
                              analysis.recommended_actions
                            )}
                          </div>
                        </>
                      )}

                      {/* =========================
                          STUDENT CHART
                      ========================= */}

                      {studentChartData.length >
                        0 && (
                        <>
                          <h4 className="chart-title">
                            📊 Performance Overview
                          </h4>

                          <div className="chart-container">

                            <ResponsiveContainer
                              width="100%"
                              height={350}
                            >
                              <BarChart
                                data={
                                  studentChartData
                                }
                              >
                                <XAxis
                                  dataKey="subject"
                                />

                                <YAxis
                                  domain={[
                                    0,
                                    100,
                                  ]}
                                />

                                <Tooltip />

                                <Legend />

                                {/* Student Score */}

                                <Bar
                                  dataKey="score"
                                  name="Student Score"
                                >
                                  <LabelList
                                    dataKey="score"
                                    position="top"
                                  />

                                  {studentChartData.map(
                                    (
                                      _,
                                      index
                                    ) => (
                                      <Cell
                                        key={`student-${index}`}
                                        fill={
                                          COLORS[
                                            index %
                                              COLORS.length
                                          ]
                                        }
                                      />
                                    )
                                  )}
                                </Bar>

                                {/* Class Average */}

                                <Bar
                                  dataKey="class_average"
                                  name="Class Average"
                                  fill="#94A3B8"
                                >
                                  <LabelList
                                    dataKey="class_average"
                                    position="top"
                                  />
                                </Bar>

                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </>
                      )}
                    </>
                  )}
                </>
              )}

              {/* ==================================
                  NOTHING SELECTED
              ================================== */}

              {!selectedReport && (
                <div className="analysis-container">
                  <h3>
                    Select an AI Assessment
                  </h3>

                  <p>
                    Choose Class Assessment,
                    Teacher Assessment, or
                    Student Assessment from the
                    left side.
                  </p>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
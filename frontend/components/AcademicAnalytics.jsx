"use client";

import "./AcademicAnalytics.css";

export default function AcademicAnalytics({
  selectedClass,
  setSelectedClass,
  student,
  setStudent,
  subject,
  setSubject,
 
}) {
  return (
    <div className="academic-analytics">

      <h3>📊 Student Assessment</h3>

      <p className="subtitle">
        Select a class, search a student and generate AI-powered insights.
      </p>

      <div className="analytics-filters">

        {/* Class */}
        <div className="field">
          <label>Class</label>

          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
          >
            <option value="">Select Class</option>
            <option>6th Grade</option>
            <option>7th Grade</option>
            <option>8th Grade</option>
            <option>9th Grade</option>
            <option>10th Grade</option>
          </select>
        </div>

        {/* Student */}
        <div className="field">
          <label>Student</label>

          <input
            type="text"
            placeholder="Enter student name"
            value={student}
            onChange={(e) => setStudent(e.target.value)}
          />
        </div>

        {/* Subject */}
        <div className="field">
          <label>Subject</label>

          <select
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          >
            <option value="All Subjects">All Subjects</option>
            <option value="Mathematics">Mathematics</option>
            <option value="Science">Science</option>
            <option value="English">English</option>
            <option value="Social">Social</option>
            <option value="Computer">Computer</option>
          </select>
        </div>

      </div>
       <div className="analytics-placeholder">
  <h4>Ready to Generate</h4>
  <p>
    Enter the student details and click <strong>Generate Report</strong> from
    the left panel.
  </p>
</div>

    </div>
  );
}
"use client";

import { useEffect, useMemo, useRef, useState } from "react";

export default function StudentsSection({
  students = [],
  allStudents = [],
  searchText = "",
  loaded = false,
  onSectionChange,
}) {
  const tabs = useMemo(() => {
    return [
      ...new Set(
        allStudents
          .filter(
            (student) =>
              student.class_name != null &&
              student.section_name != null
          )
          .map(
            (student) =>
              `${student.class_name} - Section ${student.section_name}`
          )
      ),
    ];
  }, [allStudents]);

  const [activeSectionTab, setActiveSectionTab] = useState("");
  const requestedSectionRef = useRef("");
  const selectedSectionTab = tabs.includes(activeSectionTab)
    ? activeSectionTab
    : tabs[0] || "";

  const getSectionSelection = (label) => {
    const separator = " - Section ";
    const separatorIndex = label.indexOf(separator);

    return {
      label,
      className: label.slice(0, separatorIndex),
      section: label.slice(separatorIndex + separator.length),
    };
  };

  useEffect(() => {
    if (
      selectedSectionTab &&
      selectedSectionTab !== requestedSectionRef.current
    ) {
      requestedSectionRef.current = selectedSectionTab;
      const payload = getSectionSelection(selectedSectionTab);
      console.log("Section change payload:", payload);
      onSectionChange?.(payload);
    }
  }, [activeSectionTab, onSectionChange, selectedSectionTab]);

  const filteredStudents = students.filter((student) => {
    const search = searchText.trim().toLowerCase();

    const matchesSearch =
      !search ||
      student.name?.toLowerCase().includes(search) ||
      student.admission_no?.toLowerCase().includes(search) ||
      student.class_name?.toLowerCase().includes(search) ||
      student.section_name?.toLowerCase().includes(search) ||
      student.parent_name?.toLowerCase().includes(search) ||
      student.email_id?.toLowerCase().includes(search);

    if (search) {
      return matchesSearch;
    }

    // Class data is missing, so show all students instead of hiding them.
    if (tabs.length === 0) {
      return true;
    }

    return (
      `${student.class_name} - Section ${student.section_name}` ===
      selectedSectionTab
    );
  });

  return (
    <div className="page-card">
      <div className="page-header">
        <h2>Students Management</h2>
      </div>

      {tabs.length > 0 && (
        <div className="student-section-tabs">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveSectionTab(tab);
                requestedSectionRef.current = tab;
                const payload = getSectionSelection(tab);
                console.log("Section change payload:", payload);
                onSectionChange?.(payload);
              }}
              className={
                selectedSectionTab === tab ? "active-student-tab" : ""
              }
            >
              {tab}
            </button>
          ))}
        </div>
      )}

      <div className="table-scroll-wrapper">
        <table className="table-scroll">
          <thead>
            <tr>
              <th>Admission No</th>
              <th>Name</th>
              <th>Class</th>
              <th>Section</th>
              <th>Roll No</th>
              <th>Parent</th>
              <th>Mobile</th>
              <th>Email</th>
            </tr>
          </thead>

          <tbody>
            {!loaded ? null : filteredStudents.length === 0 ? (
              <tr>
                <td colSpan={8}>No students found</td>
              </tr>
            ) : (
              filteredStudents.map((student, index) => (
                <tr key={`${student.student_id}-${index}`}>
                  <td>{student.admission_no || "-"}</td>
                  <td>{student.name || "-"}</td>
                  <td>{student.class_name || "-"}</td>
                  <td>{student.section_name || "-"}</td>
                  <td>{student.roll_number || "-"}</td>
                  <td>{student.parent_name || "-"}</td>
                  <td>{student.mobile_no || "-"}</td>
                  <td>{student.email_id || "-"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
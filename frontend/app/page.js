"use client";

import { useEffect, useState } from "react";
import useAuthGuard from "@/hooks/useAuthGuard";
import axios from "axios";

import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";

import AIToolsModal from "../components/AIToolsModal";
import DashboardSection from "../components/DashboardSection";
import StudentsSection from "../components/StudentsSection";
import TeachersSection from "../components/TeachersSection";
import ProgressSection from "../components/ProgressSection";
import NotificationsSection from "../components/NotificationsSection";
import FunctionsSection from "../components/FunctionsSection";
import ToursSection from "../components/ToursSection";
import ClassTeachersSection from "../components/ClassTeachersSection";
import { translateActiveTab } from "./utils/translateActiveTab";
// ================= API SETUP =================
const api = axios.create({
  baseURL:
    process.env.NODE_ENV === "production"
      ? process.env.NEXT_PUBLIC_PRODUCTION_API_BASE_URL
      : process.env.NEXT_PUBLIC_API_BASE_URL,
  timeout: 30000, // production safety
});

const getRefreshInterval = (fallbackMs, envKey) => {
  const envValue = Number(process.env[envKey] ?? fallbackMs);
  return Number.isFinite(envValue) && envValue > 0 ? envValue : fallbackMs;
};

console.log("Frontend API base URL:", api.defaults.baseURL);
console.log("Frontend environment:", process.env.NODE_ENV);

// ================= MAIN PAGE =================
export default function HomePage() {
  useAuthGuard();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [loading, setLoading] = useState(false);

  const [students, setStudents] = useState([]);
  const [originalStudents, setOriginalStudents] = useState([]);
 const [teachers, setTeachers] = useState([]);
const [originalTeachers, setOriginalTeachers] = useState([]);

const [progressData, setProgressData] = useState([]);
const [originalProgressData, setOriginalProgressData] = useState([]);

const [notifications, setNotifications] = useState([]);
const [originalNotifications, setOriginalNotifications] = useState([]);

const [classTeachers, setClassTeachers] = useState([]);
const [originalClassTeachers, setOriginalClassTeachers] = useState([]);

const [functionsData, setFunctionsData] = useState([]);
const [originalFunctionsData, setOriginalFunctionsData] = useState([]);

const [toursData, setToursData] = useState([]);
const [originalToursData, setOriginalToursData] = useState([]);

  const [dashboardSummary, setDashboardSummary] = useState({});
  const [performanceData, setPerformanceData] = useState([]);
  const [pieData, setPieData] = useState([]);
  const [headmaster, setHeadmaster] = useState(null);

  const [unreadCount, setUnreadCount] = useState(0);
  const [searchText, setSearchText] = useState("");
  const [language, setLanguage] = useState("English".trim());
  const [openAI, setOpenAI] = useState(false);
  const [activeSection, setActiveSection] = useState("");
  const [loaded, setLoaded] = useState({
    students: false,
    teachers: false,
    progress: false,
    notifications: false,
    functions: false,
    tours: false,
    classTeachers: false,
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // ================= DASHBOARD LOAD =================
  useEffect(() => {
    let mounted = true;
    const refreshInterval = getRefreshInterval(
      300000,
      "NEXT_PUBLIC_DASHBOARD_REFRESH_INTERVAL_MS"
    );

    const loadDashboard = async () => {
      try {
        setLoading(true);

        const res = await api.get("/dashboard/", {
          params: { refresh: Date.now() },
          headers: { "Cache-Control": "no-cache" },
        });
        const data = res.data;

        if (!mounted) return;
        setDashboardSummary(data.summary || {});
        setPerformanceData(data.performance || []);
        setPieData(data.pass_fail || []);
        setHeadmaster(data.headmaster || null);
        setUnreadCount(data.unread_count || 0);

      } catch (err) {
        console.error("Dashboard API Error:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadDashboard();
    const refreshTimer = setInterval(loadDashboard, refreshInterval);

    return () => {
      mounted = false;
      clearInterval(refreshTimer);
    };
  }, []);

  const loadTabData = async (tab, shouldShowLoading = true) => {
    if (!tab) return;

    try {
      if (shouldShowLoading) setLoading(true);

      if (tab === "students") {
        const res = await api.get("/students/");
        const data = res.data || [];
        setOriginalStudents(data);
        setStudents(
          activeSection
            ? data.filter(
                (student) =>
                  `${student.class_name} - Section ${student.section_name}` ===
                  activeSection
              )
            : data
        );
        setLoaded((p) => ({ ...p, students: true }));
      }

      if (tab === "teachers") {
        const res = await api.get("/teachers/");
        const data = res.data || [];
        setOriginalTeachers(data);
        setTeachers(data);
        setLoaded((p) => ({ ...p, teachers: true }));
      }

      if (tab === "progress") {
        const res = await api.get("/students/progress");
        const data = res.data || [];
        setOriginalProgressData(data);
        setProgressData(data);
        setLoaded((p) => ({ ...p, progress: true }));
      }

      if (tab === "notifications") {
        const res = await api.get("/notifications/");
        const data = res.data || [];
        setOriginalNotifications(data);
        setNotifications(data);
        await api.put("/notifications/mark-read");
        setUnreadCount(0);
        setLoaded((p) => ({ ...p, notifications: true }));
      }

      if (tab === "functions") {
        const res = await api.get("/functions/");
        const data = res.data || [];
        setOriginalFunctionsData(data);
        setFunctionsData(data);
        setLoaded((p) => ({ ...p, functions: true }));
      }

      if (tab === "tours") {
        const res = await api.get("/tours/");
        const data = res.data || [];
        setOriginalToursData(data);
        setToursData(data);
        setLoaded((p) => ({ ...p, tours: true }));
      }

      if (tab === "classTeachers") {
        const res = await api.get("/class-teachers/");
        const data = res.data || [];
        setOriginalClassTeachers(data);
        setClassTeachers(data);
        setLoaded((p) => ({ ...p, classTeachers: true }));
      }
    } catch (err) {
      console.error("Tab API Error:", err);
    } finally {
      if (shouldShowLoading) setLoading(false);
    }
  };
  // ================= TAB HANDLER =================
  const handleTabChange = async (tab) => {

  // Restore the current tab to English before leaving it
  if (activeTab === "students") {
    setStudents(originalStudents);
  } else if (activeTab === "teachers") {
    setTeachers(originalTeachers);
  } else if (activeTab === "progress") {
    setProgressData(originalProgressData);
  } else if (activeTab === "notifications") {
    setNotifications(originalNotifications);
  } else if (activeTab === "functions") {
    setFunctionsData(originalFunctionsData);
  } else if (activeTab === "tours") {
    setToursData(originalToursData);
  } else if (activeTab === "classTeachers") {
    setClassTeachers(originalClassTeachers);
  }

  // Reset the language button
  setLanguage("English");

  // Switch to the new tab
  setActiveTab(tab);

  try {
      setLoading(true);
      await loadTabData(tab, false);
    } catch (err) {
      console.error("Tab API Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!activeTab) return;

    const refreshInterval = getRefreshInterval(
      60000,
      "NEXT_PUBLIC_ACTIVE_TAB_REFRESH_INTERVAL_MS"
    );

    let isMounted = true;

    const refreshActiveTab = async () => {
      try {
        if (!isMounted) return;
        await loadTabData(activeTab, false);
      } catch (err) {
        console.error("Refresh active tab error:", err);
      }
    };

    refreshActiveTab();

    const timer = setInterval(refreshActiveTab, refreshInterval);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        refreshActiveTab();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      isMounted = false;
      clearInterval(timer);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [activeTab]);

  // ================= SEARCH =================
  const searchItems = (items, keys) => {
    if (!searchText.trim()) return items || [];

    const search = searchText.toLowerCase();

    return (items || []).filter((item) =>
      keys.some((key) =>
        String(item?.[key] || "")
          .toLowerCase()
          .includes(search)
      )
    );
  };

  // ================= TRANSLATE FUNCTION =================

const handleSectionChange = async ({ label, className, section }) => {
  setActiveSection(label);

  const params = { class_name: className, section };
  console.log("Section change payload:", { label, className, section });
  console.log("API request params:", params);

  try {
    setLoading(true);
    const res = await api.get("/students/", {
      params,
    });
    setStudents(res.data || []);
  } catch (error) {
    console.error("Student section API Error:", error);
    setStudents([]);
  } finally {
    setLoading(false);
  }
};
const bulkTranslate = async (items, field, lang) => {

  if (!items || items.length === 0) {
    return items;
  }

  try {

    const texts = items
      .map(item => item[field])
      .filter(Boolean);

      console.log("Field:", field);
console.log("Texts count:", texts.length);


    const response = await api.post(
      "/headmaster/translate",
      {
        text: texts,
        target_language: lang,
        user_info: {
          name: headmaster?.name || "Headmaster",
          email: headmaster?.email || "",
          role: "Headmaster"
        }
      }
    );


    const translated = response.data?.translated || [];


    let index = 0;


    return items.map(item => {

      if(item[field]){

        return {
          ...item,
          [field]: translated[index++]
        };

      }

      return item;

    });


  } catch(error){

    console.error(
      "Bulk translation error",
      error
    );

    return items;

  }

};

useEffect(() => {

  const translateStudents = async () => {

    if (language === "English") {
      setStudents(
        activeSection
          ? originalStudents.filter(
              (student) =>
                `${student.class_name} - Section ${student.section_name}` ===
                activeSection
            )
          : originalStudents
      );
      return;
    }

    if (!activeSection || originalStudents.length === 0) {
      return;
    }

    // Translate only selected section
    const sectionStudents = originalStudents.filter(
      (student) =>
        `${student.class_name} - Section ${student.section_name}` === activeSection
    );
    console.log("Active Section:", activeSection);
console.log("Students in section:", sectionStudents.length);

    try {

      let translatedSection = await bulkTranslate(
        sectionStudents,
        "full_name",
        language
      );

      translatedSection = await bulkTranslate(
        translatedSection,
        "parent_name",
        language
      );

      setStudents(translatedSection);

    } catch (error) {

      console.error(error);
      setStudents(originalStudents);

    }

  };

  translateStudents();

}, [language, activeSection, originalStudents]);

 // ================= TRANSLATION FOR OTHER TABS=================
useEffect(() => {

  translateActiveTab({

    activeTab,
    language,
    bulkTranslate,

    originalTeachers,
    setTeachers,

    originalProgressData,
    setProgressData,

    originalNotifications,
    setNotifications,

    originalFunctionsData,
    setFunctionsData,

    originalToursData,
    setToursData,

    originalClassTeachers,
    setClassTeachers,

  });

}, [
  language,
  activeTab,
  originalTeachers,
  originalProgressData,
  originalNotifications,
  originalFunctionsData,
  originalToursData,
  originalClassTeachers,
]);
  // ================= UI =================
  return (
    <div className="layout">
<Sidebar
  activeTab={activeTab}
  setActiveTab={handleTabChange}
  isOpen={sidebarOpen}
  onClose={() => setSidebarOpen(false)}
/>
      <div className="main-content">

   <Topbar
  headmaster={headmaster}
  searchText={searchText}
  setSearchText={setSearchText}
  notificationCount={unreadCount}
  language={language}
  setLanguage={setLanguage}
  onOpenAI={() => setOpenAI(true)}
  onOpenNotifications={() => handleTabChange("notifications")}
  sidebarOpen={sidebarOpen}
  setSidebarOpen={setSidebarOpen}
/>
       <AIToolsModal
  open={openAI}
  onClose={() => setOpenAI(false)}
/>


        {/* Optional loading indicator */}
        {loading && (
          <div style={{ padding: "10px" }}>
            Loading...
          </div>
        )}

        {activeTab === "dashboard" && (
          <DashboardSection
            dashboardSummary={dashboardSummary}
            performanceData={performanceData}
            pieData={pieData}
          />
        )}

    {activeTab === "students" && (
  <StudentsSection
    students={students}
    allStudents={originalStudents}
    searchText={searchText}
    loaded={loaded.students}
    onSectionChange={handleSectionChange}
  />
)}

        {activeTab === "teachers" && (
          <TeachersSection
            teachers={searchItems(teachers, [
              "full_name",
              "subject_name",
              "teacher_id",
              "role",
              "email_id",
              "phone",
            ])}
          />
        )}

        {activeTab === "progress" && (
          <ProgressSection
            progressData={searchItems(progressData, [
              "full_name",
              "exam_name",
              "subject_name",
              "grade",
              "remarks",
            ])}
          />
        )}
        {activeTab === "notifications" && (
        <NotificationsSection
        notifications={searchItems(notifications, [
        "notice_title",
        "notice_text",
        "notice_date",
    ])}
    loaded={loaded.notifications}
  />
)}

{activeTab === "functions" && (
  <FunctionsSection
    functionsData={searchItems(functionsData, [
      "function_name",
      "description",
    ])}
  />
)}

{activeTab === "tours" && (
  <ToursSection
    toursData={searchItems(toursData, [
      "tour_name",
      "destination",
    ])}
  />
)}

{activeTab === "classTeachers" && (
  <ClassTeachersSection
    classTeachers={searchItems(classTeachers, [
      "class_teacher_name",
      "class_name",
    ])}
  />
)}
      </div>
    </div>
  );
}
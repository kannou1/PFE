import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/pages/Auth/ProtectedRoute";
import Unauthorized from "@/components/shared/Unauthorized";

// Auth
import Login from "./pages/Auth/Login";
import Forget from "./pages/Auth/Forget";

// Admin Section
import AdminLayout from "./pages/Admin/Layout";
import AdminDashboard from "./pages/Admin/Dashboard";
import AdminUsers from "./pages/Admin/Users";
import AdminCourses from "./pages/Admin/Courses";
import AdminClasses from "./pages/Admin/classes";
import AdminReports from "./pages/Admin/Reports";
import AdminSettings from "./pages/Admin/Settings";
import AdminMessages from "./pages/Admin/Messages";
import AdminProfile from "./pages/Admin/Profile";
import AdminNotifications from "./pages/Admin/Notifications";
import AdminAnnouncements from "./pages/Admin/announcements";
import AdminDemandes from "@/pages/Admin/demandes";
import AdminTimetable from "@/pages/Admin/Timetable";

// Teacher Section
import TeacherLayout from "./pages/Teacher/Layout";
import TeacherDashboard from "./pages/Teacher/Dashboard";
import TeacherCourses from "./pages/Teacher/Courses";
import TeacherAttendance from "./pages/Teacher/Attendance";
import TeacherGrading from "./pages/Teacher/Grading";
import TeacherSchedule from "./pages/Teacher/Schedule";
import TeacherStudents from "./pages/Teacher/Students";
import TeacherMessages from "./pages/Teacher/Messages";
import TeacherProfile from "./pages/Teacher/Profile";
import TeacherNotifications from "./pages/Teacher/Notifications";
import TeacherAnnouncements from "./pages/Teacher/Announcements";
import TeacherAssignments from "./pages/Teacher/Assignments";

// Student Section
import StudentLayout from "./pages/Student/Layout";
import StudentDashboard from "./pages/Student/Dashboard";
import StudentCourses from "./pages/Student/Courses";
import StudentAttendance from "./pages/Student/Attendance";
import StudentTimetable from "./pages/Student/Timetable";
import StudentExams from "./pages/Student/Exams";
import StudentRequests from "./pages/Student/Requests";
import StudentMessages from "./pages/Student/Messages";
import StudentNotifications from "./pages/Student/Notifications";
import StudentProfile from "./pages/Student/Profile";
import Studentannoucement from "./pages/Student/announcements";
import StudentCourseDetails from "./pages/Student/CourseDetails";
import StudentNotFound from "./pages/Student/NotFound";
import ChatPage from "./pages/Student/EduBot";

// Wrapper to extract courseId from URL params
import { useParams } from "react-router-dom";

const CourseDetailsPageWrapper = () => {
  const { courseId } = useParams();
  return <CourseDetailsPage courseId={courseId} />;
};
const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Public */}
              <Route path="/" element={<Login />} />
              <Route path="/login" element={<Login />} />
              <Route path="/forget" element={<Forget />} />
              <Route path="/unauthorized" element={<Unauthorized />} />

              {/* Student Protected Routes */}
              <Route
                path="/student/*"
                element={
                  <ProtectedRoute allowedRoles={["etudiant"]}>
                    <StudentLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<StudentDashboard />} />
                <Route path="courses" element={<StudentCourses />} />
                <Route path="attendance" element={<StudentAttendance />} />
                <Route path="timetable" element={<StudentTimetable />} />
                <Route path="exams" element={<StudentExams />} />
                <Route path="requests" element={<StudentRequests />} />
                <Route path="messages" element={<StudentMessages />} />
                <Route path="announcements" element={<Studentannoucement />} />
                <Route
                  path="notifications"
                  element={<StudentNotifications />}
                />  
                <Route path="profile" element={<StudentProfile />} />
                {/* ✅ Corrected relative route */}
                <Route path="courses/:id" element={<StudentCourseDetails />} />
                <Route path="chatbot" element={<ChatPage />} />
                <Route path="*" element={<StudentNotFound />} />
              </Route>

              {/* Teacher Protected Routes */}
              <Route
                path="/teacher/*"
                element={
                  <ProtectedRoute allowedRoles={["enseignant"]}>
                    <TeacherLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<TeacherDashboard />} />
                <Route path="courses" element={<TeacherCourses />} />
                <Route path="students" element={<TeacherStudents />} />
                <Route path="grading" element={<TeacherGrading />} />
                <Route path="attendance" element={<TeacherAttendance />} />
                <Route path="schedule" element={<TeacherSchedule />} />
                <Route path="messages" element={<TeacherMessages />} />
                <Route
                  path="notifications"
                  element={<TeacherNotifications />}
                />
                <Route path="announcements" element={<TeacherAnnouncements />} />
                <Route path="profile" element={<TeacherProfile />} />
                <Route path="assignments" element={<TeacherAssignments />} />
                <Route path="*" element={<StudentNotFound />} />
              </Route>

              {/* Admin Protected Routes */}
              <Route
                path="/admin/*"
                element={
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <AdminLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<AdminDashboard />} />
                <Route path="users" element={<AdminUsers />} />
                <Route path="courses" element={<AdminCourses />} />
                <Route path="classes" element={<AdminClasses />} />
                <Route path="reports" element={<AdminReports />} />
                <Route path="settings" element={<AdminSettings />} />
                <Route path="messages" element={<AdminMessages />} />
                <Route path="notifications" element={<AdminNotifications />} />
                <Route path="requests" element={<AdminDemandes />} />
                <Route path="timetable" element={<AdminTimetable />} />
                <Route path="announcements" element={<AdminAnnouncements />} />
                <Route path="profile" element={<AdminProfile />} />
                <Route path="*" element={<StudentNotFound />} />
              </Route>

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;

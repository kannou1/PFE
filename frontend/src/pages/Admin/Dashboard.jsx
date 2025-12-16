import { useState, useEffect } from "react";
import { useTheme } from "../../contexts/ThemeContext";
import { getDashboardStats } from "../../services/dashboardService";
import { useLocation } from "react-router-dom";


export default function AdminDashboard() {
  const { theme } = useTheme();
  const location = useLocation();
  const [timeRange, setTimeRange] = useState("week");
  const [dashboardData, setDashboardData] = useState(location.state?.dashboardData || null);
  const [loading, setLoading] = useState(!location.state?.dashboardData);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (dashboardData) return;
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const data = await getDashboardStats();
        setDashboardData(data);
      } catch (err) {
        setError(err.message);
        console.error("Failed to fetch dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, [dashboardData]);

  if (loading) {
    return (
      <div className="min-h-screen p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className={`text-lg ${theme === 'dark' ? 'text-gray-300' : 'text-slate-600'}`}>
            Loading dashboard data...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen p-6 flex items-center justify-center">
        <div className="text-center">
          <p className={`text-lg text-red-500 mb-4`}>Error loading dashboard: {error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const stats = dashboardData?.stats || [];
  const enrollmentData = dashboardData?.enrollmentData || [];
  const genderData = dashboardData?.genderData || { male: 0, female: 0 };
  const classPerformanceData = dashboardData?.classPerformanceData || [];
  const classAttendanceData = dashboardData?.classAttendanceData || [];
  const announcements = dashboardData?.announcements || [];
  const recentActivity = dashboardData?.recentActivity || [];

  const maxStudents = Math.max(...enrollmentData.map((d) => d.students));
  const maxTeachers = Math.max(...enrollmentData.map((d) => d.teachers));

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Admin Dashboard
            </h1>
            <p className={`mt-2 ${theme === 'dark' ? 'text-gray-300' : 'text-slate-600'}`}>
              Welcome back, Administrator • {new Date().toLocaleDateString()}
            </p>
          </div>
          <div className="flex gap-2">
            {["week", "month", "year"].map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  timeRange === range
                    ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg"
                    : theme === 'dark' ? "bg-gray-700 text-gray-300 hover:bg-gray-600" : "bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                {range.charAt(0).toUpperCase() + range.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <div
              key={index}
              className={`relative rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group cursor-pointer ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}
            >
              <div
                className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-5 transition-opacity`}
              ></div>
              <div className="relative">
                <div className="flex items-start justify-between mb-4">
                  <div
                    className={`p-3 rounded-xl bg-gradient-to-br ${stat.color} shadow-lg transform group-hover:scale-110 transition-transform text-2xl`}
                  >
                    {stat.icon}
                  </div>
                  <div className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                    ↗ {stat.change}
                  </div>
                </div>
                <p className={`text-sm font-medium mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-slate-600'}`}>
                  {stat.title}
                </p>
                <p className={`text-3xl font-bold ${theme === 'dark' ? 'text-gray-100' : 'text-slate-800'}`}>
                  {stat.value}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Combined Students and Teachers Chart */}
          <div className={`lg:col-span-2 rounded-2xl p-6 shadow-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="mb-6">
              <h3 className={`text-xl font-bold ${theme === 'dark' ? 'text-gray-100' : 'text-slate-800'}`}>
                Enrollment Trend
              </h3>
              <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-gray-300' : 'text-slate-600'}`}>
                Students and teachers over time
              </p>
            </div>
            <div className="h-64 flex items-end justify-between gap-2 px-4">
              {enrollmentData.map((data, index) => {
                const studentHeight = (data.students / maxStudents) * 100;
                const teacherHeight = (data.teachers / maxTeachers) * 100;
                return (
                  <div key={index} className="flex-1 flex flex-col items-center gap-2">
                    <div className="w-full flex gap-1 items-end h-48">
                      <div className="flex-1 relative group">
                        <div
                          className="w-full bg-gradient-to-t from-blue-500 to-cyan-400 rounded-t-lg transition-all hover:opacity-80 cursor-pointer"
                          style={{ height: `${studentHeight}%` }}
                        >
                          <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-slate-800 text-white px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                            {data.students}
                          </div>
                        </div>
                      </div>
                      <div className="flex-1 relative group">
                        <div
                          className="w-full bg-gradient-to-t from-purple-500 to-pink-400 rounded-t-lg transition-all hover:opacity-80 cursor-pointer"
                          style={{ height: `${teacherHeight}%` }}
                        >
                          <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-slate-800 text-white px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                            {data.teachers}
                          </div>
                        </div>
                      </div>
                    </div>
                    <span className={`text-xs font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-slate-600'}`}>
                      {data.month}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="flex justify-center gap-6 mt-6">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-500 to-cyan-400"></div>
                <span className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-slate-600'}`}>Students</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-gradient-to-r from-purple-500 to-pink-400"></div>
                <span className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-slate-600'}`}>Teachers</span>
              </div>
            </div>
          </div>
          {/* Gender Distribution */}
          <div className={`rounded-2xl p-6 shadow-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="mb-6">
              <h3 className={`text-xl font-bold ${theme === 'dark' ? 'text-gray-100' : 'text-slate-800'}`}>
                Gender Distribution
              </h3>
              <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-gray-300' : 'text-slate-600'}`}>Student demographics</p>
            </div>
            <div className="flex justify-center mb-6">
              <div className="relative w-48 h-48">
                <svg viewBox="0 0 200 200" className="transform -rotate-90">
                  {/* Male segment */}
                  <path
                    d={`M 100 100 L 100 30 A 70 70 0 ${genderData.male > 50 ? 1 : 0} 1 ${
                      100 + 70 * Math.cos((genderData.male * 360 * Math.PI) / 18000)
                    } ${
                      100 + 70 * Math.sin((genderData.male * 360 * Math.PI) / 18000)
                    } Z`}
                    fill="#3b82f6"
                    className="hover:opacity-80 transition-opacity cursor-pointer"
                  />
                  {/* Female segment */}
                  <path
                    d={`M 100 100 L ${
                      100 + 70 * Math.cos((genderData.male * 360 * Math.PI) / 18000)
                    } ${
                      100 + 70 * Math.sin((genderData.male * 360 * Math.PI) / 18000)
                    } A 70 70 0 ${genderData.female > 50 ? 1 : 0} 1 100 30 Z`}
                    fill="#ec4899"
                    className="hover:opacity-80 transition-opacity cursor-pointer"
                  />
                  <circle cx="100" cy="100" r="40" fill={theme === 'dark' ? '#1f2937' : 'white'} />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <p className={`text-2xl font-bold ${theme === 'dark' ? 'text-gray-100' : 'text-slate-800'}`}>
                      {stats.find(s => s.title === "Total Students")?.value || "0"}
                    </p>
                    <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-slate-500'}`}>Total</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <div className={`flex items-center justify-between p-3 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-slate-50'}`}>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <span className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-200' : 'text-slate-700'}`}>
                    Male
                  </span>
                </div>
                <span className={`text-sm font-bold ${theme === 'dark' ? 'text-gray-100' : 'text-slate-800'}`}>
                  {genderData.male}%
                </span>
              </div>
              <div className={`flex items-center justify-between p-3 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-slate-50'}`}>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-pink-500"></div>
                  <span className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-200' : 'text-slate-700'}`}>
                    Female
                  </span>
                </div>
                <span className={`text-sm font-bold ${theme === 'dark' ? 'text-gray-100' : 'text-slate-800'}`}>
                  {genderData.female}%
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Class Performance Chart */}
          <div className={`rounded-2xl p-6 shadow-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="mb-6">
              <h3 className={`text-xl font-bold ${theme === 'dark' ? 'text-gray-100' : 'text-slate-800'}`}>
                Class Performance
              </h3>
              <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-gray-300' : 'text-slate-600'}`}>
                Average grades by class
              </p>
            </div>
            <div className="space-y-4">
              {classPerformanceData.map((data, index) => (
                <div key={index} className="group">
                  <div className="flex justify-between items-center mb-2">
                    <span className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-200' : 'text-slate-700'}`}>
                      {data.class}
                    </span>
                    <span className={`text-sm font-bold ${theme === 'dark' ? 'text-gray-100' : 'text-slate-800'}`}>
                      {data.average}%
                    </span>
                  </div>
                  <div className={`relative h-3 rounded-full overflow-hidden ${theme === 'dark' ? 'bg-gray-700' : 'bg-slate-100'}`}>
                    <div
                      className="absolute top-0 left-0 h-full rounded-full transition-all duration-500 group-hover:opacity-80"
                      style={{
                        width: `${data.average}%`,
                        backgroundColor: data.color
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Class Attendance Chart */}
          <div className={`rounded-2xl p-6 shadow-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="mb-6">
              <h3 className={`text-xl font-bold ${theme === 'dark' ? 'text-gray-100' : 'text-slate-800'}`}>
                Class Attendance
              </h3>
              <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-gray-300' : 'text-slate-600'}`}>
                Attendance rates by class
              </p>
            </div>
            <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
              {classAttendanceData.map((data, index) => (
                <div key={index} className="group">
                  <div className="flex justify-between items-center mb-2">
                    <span className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-200' : 'text-slate-700'}`}>
                      {data.class}
                    </span>
                    <span className={`text-sm font-bold ${theme === 'dark' ? 'text-gray-100' : 'text-slate-800'}`}>
                      {data.attendance}%
                    </span>
                  </div>
                  <div className={`relative h-2 rounded-full overflow-hidden ${theme === 'dark' ? 'bg-gray-700' : 'bg-slate-100'}`}>
                    <div
                      className="absolute top-0 left-0 h-full rounded-full transition-all duration-500 group-hover:opacity-80"
                      style={{
                        width: `${data.attendance}%`,
                        backgroundColor: data.color
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Announcements */}
          <div className={`rounded-2xl p-6 shadow-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="mb-6">
              <h3 className={`text-xl font-bold ${theme === 'dark' ? 'text-gray-100' : 'text-slate-800'}`}>
                Recent Announcements
              </h3>
              <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-gray-300' : 'text-slate-600'}`}>
                Latest school updates
              </p>
            </div>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {announcements.map((announcement, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-xl transition-all cursor-pointer ${
                    theme === 'dark'
                      ? 'bg-gray-700 hover:bg-gray-600'
                      : 'bg-slate-50 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">{announcement.icon}</div>
                    <div className="flex-1">
                      <h4 className={`font-semibold mb-1 ${theme === 'dark' ? 'text-gray-100' : 'text-slate-800'}`}>
                        {announcement.title}
                      </h4>
                      <p className={`text-sm mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-slate-600'}`}>
                        {announcement.description}
                      </p>
                      <span className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-slate-500'}`}>
                        {announcement.date}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className={`rounded-2xl p-6 shadow-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="mb-6">
            <h3 className={`text-xl font-bold ${theme === 'dark' ? 'text-gray-100' : 'text-slate-800'}`}>
              Recent System Activity
            </h3>
            <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-gray-300' : 'text-slate-600'}`}>
              Latest updates and changes
            </p>
          </div>
          <div className="space-y-4">
            {recentActivity.map((activity, index) => (
              <div
                key={index}
                className={`flex items-center gap-4 p-4 rounded-xl transition-colors cursor-pointer ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-slate-50'}`}
              >
                <div
                  className={`p-3 rounded-xl bg-gradient-to-br ${activity.color} shadow-md text-2xl`}
                >
                  {activity.icon}
                </div>
                <div className="flex-1">
                  <p className={`font-semibold ${theme === 'dark' ? 'text-gray-100' : 'text-slate-800'}`}>
                    {activity.action}
                  </p>
                  <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-slate-600'}`}>{activity.user}</p>
                </div>
                <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-slate-500'}`}>{activity.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

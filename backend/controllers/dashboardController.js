const User = require("../models/userSchema");
const Cours = require("../models/coursSchema");
const Presence = require("../models/presenceSchema");
const Note = require("../models/noteSchema");
const Classe = require("../models/classeSchema");
const Announcement = require("../models/announcementSchema");
const NodeCache = require('node-cache');

// Initialize cache with 5 minute TTL
const cache = new NodeCache({ stdTTL: 300 });

/* ===========================================================
  GET DASHBOARD STATS
=========================================================== */
exports.getDashboardStats = async (req, res) => {
  try {
    // Check cache first
    const cacheKey = 'dashboard_stats_v2'; // Updated cache key to invalidate old data
    const cachedData = cache.get(cacheKey);
    if (cachedData) {
      return res.status(200).json(cachedData);
    }
    // Use aggregation pipeline for efficient counting and stats
    const userStats = await User.aggregate([
      {
        $group: {
          _id: "$role",
          count: { $sum: 1 },
          maleCount: {
            $sum: { $cond: [{ $and: [{ $eq: ["$role", "etudiant"] }, { $eq: ["$sexe", "Homme"] }] }, 1, 0] }
          },
          femaleCount: {
            $sum: { $cond: [{ $and: [{ $eq: ["$role", "etudiant"] }, { $eq: ["$sexe", "Femme"] }] }, 1, 0] }
          }
        }
      }
    ]);

    // Extract stats from aggregation result
    const totalStudents = userStats.find(stat => stat._id === "etudiant")?.count || 0;
    const totalTeachers = userStats.find(stat => stat._id === "enseignant")?.count || 0;
    const totalAdmins = userStats.find(stat => stat._id === "admin")?.count || 0;
    const maleStudents = userStats.find(stat => stat._id === "etudiant")?.maleCount || 0;
    const femaleStudents = userStats.find(stat => stat._id === "etudiant")?.femaleCount || 0;
    const totalGenderStudents = maleStudents + femaleStudents;

    const genderData = {
      male: totalGenderStudents > 0 ? Math.round((maleStudents / totalGenderStudents) * 100) : 0,
      female: totalGenderStudents > 0 ? Math.round((femaleStudents / totalGenderStudents) * 100) : 0,
      maleCount: maleStudents,
      femaleCount: femaleStudents,
    };

    // Overall attendance rate using aggregation
    const attendanceStats = await Presence.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          present: { $sum: { $cond: [{ $eq: ["$statut", "présent"] }, 1, 0] } }
        }
      }
    ]);

    const totalPresences = attendanceStats[0]?.total || 0;
    const presentCount = attendanceStats[0]?.present || 0;
    const attendanceRate = totalPresences > 0 ? Math.round((presentCount / totalPresences) * 100) : 0;

    const activeCourses = await Cours.countDocuments();

    // Total enrollment (all time)
    const totalEnrollmentStats = await User.aggregate([
      {
        $match: {
          role: { $in: ["etudiant", "enseignant"] }
        }
      },
      {
        $group: {
          _id: "$role",
          count: { $sum: 1 }
        }
      }
    ]);

    const totalStudentsEnrolled = totalEnrollmentStats.find(stat => stat._id === "etudiant")?.count || 0;
    const totalTeachersEnrolled = totalEnrollmentStats.find(stat => stat._id === "enseignant")?.count || 0;

    // Process enrollment data as general totals
    const enrollmentData = [
      {
        category: "Students",
        count: totalStudentsEnrolled,
      },
      {
        category: "Teachers",
        count: totalTeachersEnrolled,
      }
    ];

    // Simplified class performance and attendance - get basic class list for now
    // TODO: Optimize these queries further if needed
    const classes = await Classe.find({}, 'nom').limit(10); // Limit to 10 classes for performance

    // Simplified class performance - just return basic data
    const classPerformanceData = classes.map((cls, index) => ({
      class: cls.nom,
      average: Math.floor(Math.random() * 20) + 80, // Mock data for performance
      color: `#${Math.floor(Math.random()*16777215).toString(16)}`
    }));

    // Simplified class attendance - just return basic data
    const classAttendanceData = classes.map((cls, index) => ({
      class: cls.nom,
      attendance: Math.floor(Math.random() * 20) + 75, // Mock data for performance
      color: `#${Math.floor(Math.random()*16777215).toString(16)}`
    }));

    // Recent announcements (last 4)
    const recentAnnouncements = await Announcement.find({ estActif: true })
      .populate("auteur", "prenom nom")
      .sort({ createdAt: -1 })
      .limit(4)
      .then(announcements => announcements.map(ann => ({
        title: ann.titre,
        description: ann.contenu.length > 100 ? ann.contenu.substring(0, 100) + "..." : ann.contenu,
        date: getTimeAgo(ann.createdAt),
        type: ann.type,
        icon: getAnnouncementIcon(ann.type),
      })));

    // Recent system activity (mock data for now - could be enhanced with actual activity logs)
    const recentActivity = [
      {
        action: "New teacher registered",
        user: "Dr. Sarah Johnson",
        time: "2 hours ago",
        icon: "👨‍🏫",
        color: "from-blue-500 to-cyan-400",
      },
      {
        action: "Course updated",
        user: "Mathematics 101",
        time: "5 hours ago",
        icon: "📚",
        color: "from-purple-500 to-pink-400",
      },
      {
        action: "Student enrolled",
        user: "John Smith - Physics",
        time: "1 day ago",
        icon: "👥",
        color: "from-pink-500 to-blue-500",
      },
    ];

    // Calculate changes (simplified - in real app, compare with previous period)
    const stats = [
      {
        title: "Total Students",
        value: totalStudents.toLocaleString(),
        icon: "👥",
        change: "+12%", // Mock change
        color: "from-blue-500 to-cyan-400",
      },
      {
        title: "Total Teachers",
        value: totalTeachers.toString(),
        icon: "👨‍🏫",
        change: "+5%", // Mock change
        color: "from-purple-500 to-pink-400",
      },
      {
        title: "Active Courses",
        value: activeCourses.toString(),
        icon: "📚",
        change: "+8%", // Mock change
        color: "from-pink-500 to-blue-500",
      },
      {
        title: "Attendance Rate",
        value: `${attendanceRate}%`,
        icon: "📈",
        change: "+3%", // Mock change
        color: "from-cyan-400 to-purple-500",
      },
    ];

    const responseData = {
      stats,
      enrollmentData,
      genderData,
      classPerformanceData,
      classAttendanceData,
      announcements: recentAnnouncements,
      recentActivity,
    };

    // Cache the result for 5 minutes
    cache.set(cacheKey, responseData);

    res.status(200).json(responseData);

  } catch (error) {
    console.error("❌ Erreur getDashboardStats:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// Helper function to get time ago
function getTimeAgo(date) {
  const now = new Date();
  const diffInMs = now - new Date(date);
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInHours < 1) return "Less than an hour ago";
  if (diffInHours < 24) return `${diffInHours} hours ago`;
  if (diffInDays === 1) return "1 day ago";
  if (diffInDays < 7) return `${diffInDays} days ago`;
  return new Date(date).toLocaleDateString();
}

// Helper function to get announcement icon
function getAnnouncementIcon(type) {
  const icons = {
    holiday: "🎄",
    meeting: "👥",
    course: "🚀",
    exam: "📝",
    info: "ℹ️",
    warning: "⚠️",
    success: "✅",
  };
  return icons[type] || "📢";
}
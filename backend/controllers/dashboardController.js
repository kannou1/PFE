const User = require("../models/userSchema");
const Cours = require("../models/coursSchema");
const Presence = require("../models/presenceSchema");
const Note = require("../models/noteSchema");
const Classe = require("../models/classeSchema");
const Announcement = require("../models/announcementSchema");

/* ===========================================================
  GET DASHBOARD STATS
=========================================================== */
exports.getDashboardStats = async (req, res) => {
  try {
    // Total counts
    const totalStudents = await User.countDocuments({ role: "etudiant" });
    const totalTeachers = await User.countDocuments({ role: "enseignant" });
    const totalAdmins = await User.countDocuments({ role: "admin" });
    const activeCourses = await Cours.countDocuments();

    // Gender distribution for students
    const maleStudents = await User.countDocuments({ role: "etudiant", sexe: "Homme" });
    const femaleStudents = await User.countDocuments({ role: "etudiant", sexe: "Femme" });
    const totalGenderStudents = maleStudents + femaleStudents;
    const genderData = {
      male: totalGenderStudents > 0 ? Math.round((maleStudents / totalGenderStudents) * 100) : 0,
      female: totalGenderStudents > 0 ? Math.round((femaleStudents / totalGenderStudents) * 100) : 0,
    };

    // Overall attendance rate
    const totalPresences = await Presence.countDocuments();
    const presentCount = await Presence.countDocuments({ statut: "present" });
    const attendanceRate = totalPresences > 0 ? Math.round((presentCount / totalPresences) * 100) : 0;

    // Enrollment trend (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const enrollmentData = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);

      const studentsCount = await User.countDocuments({
        role: "etudiant",
        createdAt: { $lte: monthEnd }
      });

      const teachersCount = await User.countDocuments({
        role: "enseignant",
        createdAt: { $lte: monthEnd }
      });

      enrollmentData.push({
        month: monthStart.toLocaleDateString('en-US', { month: 'short' }),
        students: studentsCount,
        teachers: teachersCount,
      });
    }

    // Class performance (average grades)
    const classes = await Classe.find().populate('etudiants');
    const classPerformanceData = [];

    for (const classe of classes) {
      const studentIds = classe.etudiants.map(s => s._id);
      const notes = await Note.find({ etudiant: { $in: studentIds } });

      if (notes.length > 0) {
        const average = notes.reduce((sum, note) => sum + note.valeur, 0) / notes.length;
        classPerformanceData.push({
          class: classe.nom,
          average: Math.round(average),
          color: `#${Math.floor(Math.random()*16777215).toString(16)}` // Random color
        });
      }
    }

    // Class attendance rates
    const classAttendanceData = [];

    for (const classe of classes) {
      const studentIds = classe.etudiants.map(s => s._id);
      const presences = await Presence.find({ etudiant: { $in: studentIds } });

      if (presences.length > 0) {
        const presentCount = presences.filter(p => p.statut === "present").length;
        const attendanceRate = Math.round((presentCount / presences.length) * 100);
        classAttendanceData.push({
          class: classe.nom,
          attendance: attendanceRate,
          color: `#${Math.floor(Math.random()*16777215).toString(16)}` // Random color
        });
      }
    }

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

    res.status(200).json({
      stats,
      enrollmentData,
      genderData,
      classPerformanceData,
      classAttendanceData,
      announcements: recentAnnouncements,
      recentActivity,
    });

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

// ai-service/services/chat.service.js
const axios = require('axios');

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5001';

/**
 * Detect user intent from message
 */
function detectIntent(message) {
  const msg = message.toLowerCase();
  
  const intents = {
    schedule: /schedule|emploi|seance|timetable|calendar|cours aujourd'hui|this week|séance/i,
    exams: /exam|test|assignment|devoir|controle|quiz|examen/i,
    grades: /note|grade|score|mark|resultat|moyenne/i,
    attendance: /presence|absence|absent|attend|attendance|présence/i,
    courses: /cours|course|subject|matiere|class|matière/i,
    teachers: /teacher|professor|enseignant|prof/i,
    students: /student|etudiant|classmate|camarade|étudiant/i,
    notifications: /notification|notif|alert|reminder|rappel/i,
    requests: /demande|request|certificat|document/i,
    announcements: /announcement|annonce|news|info/i,
    profile: /my info|my profile|who am i|mes informations|mon profil/i,
  };

  for (const [intent, regex] of Object.entries(intents)) {
    if (regex.test(msg)) return intent;
  }
  
  return 'general';
}

/**
 * Fetch relevant data based on user context
 */
async function fetchUserContext(userId, intent, token, message) {
  try {
    const context = {
      user: await fetchUserProfile(userId, token)
    };

    // Fetch data based on intent
    switch (intent) {
      case 'schedule':
        context.schedule = await fetchSchedule(userId, token);
        break;
        
      case 'exams':
        context.exams = await fetchExams(userId, token);
        break;
        
      case 'grades':
        context.grades = await fetchGrades(userId, token);
        break;
        
      case 'attendance':
        context.attendance = await fetchAttendance(userId, token);
        break;
        
      case 'courses':
        context.courses = await fetchCourses(userId, token);
        break;
        
      case 'teachers':
        context.teachers = await fetchTeachers(userId, token);
        break;
        
      case 'students':
        context.students = await fetchStudents(userId, token);
        break;
        
      case 'notifications':
        context.notifications = await fetchNotifications(userId, token);
        break;
        
      case 'requests':
        context.requests = await fetchRequests(userId, token);
        break;
        
      case 'announcements':
        context.announcements = await fetchAnnouncements(userId, token);
        break;
        
      case 'profile':
        context.profile = await fetchUserProfile(userId, token);
        break;
        
      default:
        // For general queries, fetch a summary
        context.summary = await fetchSummary(userId, token);
    }

    return context;
  } catch (error) {
    console.error('Error fetching user context:', error);
    return null;
  }
}

// ============== DATA FETCHING FUNCTIONS ==============

async function fetchUserProfile(userId, token) {
  try {
    console.log(`👤 Fetching user profile for ${userId}`);
    const response = await axios.get(`${BACKEND_URL}/users/getUserById/${userId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const user = response.data;
    return {
      name: `${user.prenom} ${user.nom}`,
      role: user.role,
      email: user.email,
      classe: user.classe?.nom || null,
      classeId: user.classe?._id || null,
      phone: user.NumTel || user.NumTelEnseignant,
      address: user.Adresse,
      dateOfBirth: user.datedeNaissance,
      academicYear: user.classe?.anneeAcademique
    };
  } catch (error) {
    console.error('Error fetching user profile:', error.response?.data || error.message);
    return null;
  }
}

async function fetchSchedule(userId, token) {
  try {
    console.log('📅 Fetching schedule...');
    const response = await axios.get(`${BACKEND_URL}/seance/getAllSeances`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log(`📅 Total seances: ${response.data.length}`);
    
    const seances = response.data;
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    const thisWeekSeances = seances.filter(s => {
      if (!s.dateDebut) return false;
      const seanceDate = new Date(s.dateDebut);
      return seanceDate >= startOfWeek && seanceDate <= endOfWeek;
    });

    console.log(`📅 This week seances: ${thisWeekSeances.length}`);
    
    if (thisWeekSeances.length === 0 && seances.length > 0) {
      console.log('⚠️ No seances this week, returning all seances');
      return seances.slice(0, 10).map(s => ({
        day: s.jourSemaine,
        time: `${s.heureDebut} - ${s.heureFin}`,
        course: s.cours?.nom || 'Unknown',
        teacher: s.enseignant ? `${s.enseignant.prenom} ${s.enseignant.nom}` : 'N/A',
        room: s.salle,
        type: s.typeCours,
        date: s.dateDebut
      }));
    }

    return thisWeekSeances.map(s => ({
      day: s.jourSemaine,
      time: `${s.heureDebut} - ${s.heureFin}`,
      course: s.cours?.nom || 'Unknown',
      teacher: s.enseignant ? `${s.enseignant.prenom} ${s.enseignant.nom}` : 'N/A',
      room: s.salle,
      type: s.typeCours,
      date: s.dateDebut
    }));
  } catch (error) {
    console.error('❌ Error fetching schedule:', error.response?.data || error.message);
    return [];
  }
}

async function fetchExams(userId, token) {
  try {
    console.log('📝 Fetching exams...');
    // ✅ FIXED: Route is /examen/getAll
    const response = await axios.get(`${BACKEND_URL}/examen/getAll`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log(`📝 Total exams: ${response.data.length}`);
    const examens = response.data;

    const mappedExams = examens.map(e => ({
      name: e.nom,
      course: e.coursId?.nom || 'Unknown',
      class: e.classeId?.nom || 'Unknown',
      type: e.type,
      date: e.date,
      maxScore: e.noteMax,
      description: e.description,
      duration: e.duree
    }));

    console.log(`📝 Mapped exams: ${mappedExams.length}`);
    return mappedExams;
  } catch (error) {
    console.error('❌ Error fetching exams:', error.response?.data || error.message);
    return [];
  }
}

async function fetchGrades(userId, token) {
  try {
    console.log('📊 Fetching grades...');
    
    // Get user info
    const userResponse = await axios.get(`${BACKEND_URL}/users/getUserById/${userId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const user = userResponse.data;
    console.log(`📊 User role: ${user.role}`);
    
    // ✅ OPTION 1: Use student-specific endpoint if available
    if (user.role === 'etudiant') {
      try {
        const response = await axios.get(`${BACKEND_URL}/note/getForStudent`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        console.log(`📊 Total notes for student: ${response.data.length}`);
        
        return response.data.map(n => ({
          exam: n.examen?.nom || 'Unknown',
          course: n.examen?.coursId?.nom || 'Unknown',
          score: n.note,
          maxScore: n.examen?.noteMax || 100,
          percentage: n.examen?.noteMax ? ((n.note / n.examen.noteMax) * 100).toFixed(2) + '%' : 'N/A',
          feedback: n.commentaire || ''
        }));
      } catch (error) {
        console.error('❌ Error with getForStudent, trying getAllNotes');
      }
    }
    
    // ✅ OPTION 2: Fallback to get all and filter
    const response = await axios.get(`${BACKEND_URL}/note/get`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log(`📊 Total notes in DB: ${response.data.length}`);
    let notes = response.data;
    
    // Filter by student
    if (user.role === 'etudiant') {
      notes = notes.filter(n => {
        const etudiantId = n.etudiant?._id || n.etudiant;
        return etudiantId && etudiantId.toString() === userId.toString();
      });
      console.log(`📊 Filtered notes for student: ${notes.length}`);
    }

    const mappedNotes = notes.map(n => ({
      exam: n.examen?.nom || 'Unknown',
      course: n.examen?.coursId?.nom || 'Unknown',
      score: n.note,
      maxScore: n.examen?.noteMax || 100,
      percentage: n.examen?.noteMax ? ((n.note / n.examen.noteMax) * 100).toFixed(2) + '%' : 'N/A',
      feedback: n.commentaire || ''
    }));

    console.log(`📊 Mapped notes: ${mappedNotes.length}`);
    return mappedNotes;
  } catch (error) {
    console.error('❌ Error fetching grades:', error.response?.data || error.message);
    console.error('❌ Full error:', error.response?.status, error.response?.statusText);
    return [];
  }
}


async function fetchAttendance(userId, token) {
  try {
    console.log('📋 Fetching attendance...');
    console.log(`📋 User ID: ${userId}`);
    
    // Try the specific endpoint
    const response = await axios.get(`${BACKEND_URL}/presence/getPresenceByEtudiant/${userId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log(`📋 Total attendance records: ${response.data.length}`);
    
    if (response.data.length === 0) {
      console.log('📋 No attendance records found');
      return {
        attendanceRate: '0%',
        totalClasses: 0,
        present: 0,
        absent: 0,
        recentRecords: []
      };
    }
    
    const presences = response.data;
    const total = presences.length;
    const present = presences.filter(p => p.statut === 'présent' || p.statut === 'present').length;
    const rate = total > 0 ? ((present / total) * 100).toFixed(2) : 0;

    return {
      attendanceRate: `${rate}%`,
      totalClasses: total,
      present: present,
      absent: total - present,
      recentRecords: presences.slice(0, 10).map(p => ({
        date: p.date,
        course: p.seance?.cours?.nom || 'Unknown',
        status: p.statut
      }))
    };
  } catch (error) {
    console.error('❌ Error fetching attendance:', error.response?.data || error.message);
    console.error('❌ Status:', error.response?.status);
    console.error('❌ Full response:', error.response);
    return {
      attendanceRate: '0%',
      totalClasses: 0,
      present: 0,
      absent: 0,
      recentRecords: []
    };
  }
}
async function fetchCourses(userId, token) {
  try {
    console.log('📚 Fetching courses...');
    const response = await axios.get(`${BACKEND_URL}/cours/getAllCours`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log(`📚 Total courses: ${response.data.length}`);
    const cours = response.data;

    const mappedCours = cours.map(c => ({
      name: c.nom,
      code: c.code,
      credits: c.credits || c.credit,
      semester: c.semestre,
      teacher: c.enseignant ? `${c.enseignant.prenom} ${c.enseignant.nom}` : 'N/A',
      class: c.classe?.nom || 'N/A',
      description: c.description
    }));

    console.log(`📚 Mapped courses: ${mappedCours.length}`);
    return mappedCours;
  } catch (error) {
    console.error('❌ Error fetching courses:', error.response?.data || error.message);
    return [];
  }
}

async function fetchTeachers(userId, token) {
  try {
    console.log('👨‍🏫 Fetching teachers...');
    const userResponse = await axios.get(`${BACKEND_URL}/users/getUserById/${userId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const user = userResponse.data;
    console.log(`👨‍🏫 User class: ${user.classe?._id}`);
    
    if (user.classe && user.classe._id) {
      const classeResponse = await axios.get(`${BACKEND_URL}/classe/getClasseById/${user.classe._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const classe = classeResponse.data;
      const enseignants = classe.enseignants || [];
      console.log(`👨‍🏫 Teachers found: ${enseignants.length}`);

      return enseignants.map(t => ({
        name: `${t.prenom} ${t.nom}`,
        email: t.email,
        specialty: t.specialite || 'N/A',
        phone: t.NumTelEnseignant
      }));
    }
    
    console.log('👨‍🏫 No class found for user');
    return [];
  } catch (error) {
    console.error('❌ Error fetching teachers:', error.response?.data || error.message);
    return [];
  }
}

async function fetchStudents(userId, token) {
  try {
    console.log('👨‍🎓 Fetching students...');
    const userResponse = await axios.get(`${BACKEND_URL}/users/getUserById/${userId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const user = userResponse.data;
    console.log(`👨‍🎓 User role: ${user.role}`);
    
    if (user.role === 'enseignant') {
      const classesResponse = await axios.get(`${BACKEND_URL}/classe/getAllClasses`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const classes = classesResponse.data.filter(c => 
        c.enseignants && c.enseignants.some(e => e._id === userId)
      );
      
      console.log(`👨‍🎓 Classes taught: ${classes.length}`);
      
      const students = [];
      classes.forEach(c => {
        if (c.etudiants) {
          c.etudiants.forEach(s => {
            students.push({
              name: `${s.prenom} ${s.nom}`,
              email: s.email,
              class: c.nom
            });
          });
        }
      });
      
      console.log(`👨‍🎓 Total students: ${students.length}`);
      return students;
    } else if (user.role === 'etudiant' && user.classe) {
      const classeResponse = await axios.get(`${BACKEND_URL}/classe/getClasseById/${user.classe._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const classe = classeResponse.data;
      const students = classe.etudiants
        ? classe.etudiants
            .filter(s => s._id !== userId)
            .map(s => ({
              name: `${s.prenom} ${s.nom}`,
              email: s.email
            }))
        : [];
      
      console.log(`👨‍🎓 Classmates: ${students.length}`);
      return students;
    }
    
    return [];
  } catch (error) {
    console.error('❌ Error fetching students:', error.response?.data || error.message);
    return [];
  }
}

async function fetchNotifications(userId, token) {
  try {
    console.log('🔔 Fetching notifications...');
    // ✅ FIXED: Route is /notification/user/:userId
    const response = await axios.get(`${BACKEND_URL}/notification/user/${userId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log(`🔔 Total notifications: ${response.data.length}`);
    const notifications = response.data;

    return notifications.slice(0, 10).map(n => ({
      message: n.message,
      type: n.type,
      read: n.estLu, // ✅ FIXED: Field name is 'estLu'
      date: n.dateCreation || n.createdAt
    }));
  } catch (error) {
    console.error('❌ Error fetching notifications:', error.response?.data || error.message);
    return [];
  }
}

async function fetchRequests(userId, token) {
  try {
    console.log('📄 Fetching requests...');
    // ✅ FIXED: Route is /demande/user/:userId
    const response = await axios.get(`${BACKEND_URL}/demande/user/${userId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log(`📄 Total requests: ${response.data.length}`);
    const demandes = response.data;

    return demandes.map(d => ({
      type: d.type,
      status: d.statut,
      date: d.createdAt,
      response: d.reponse || null,
      description: d.description
    }));
  } catch (error) {
    console.error('❌ Error fetching requests:', error.response?.data || error.message);
    return [];
  }
}

async function fetchAnnouncements(userId, token) {
  try {
    console.log('📢 Fetching announcements...');
    
    // Route is /announcement/ (root)
    const response = await axios.get(`${BACKEND_URL}/announcement`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log(`📢 Total announcements: ${response.data.length}`);
    
    if (response.data.length === 0) {
      console.log('📢 No announcements found');
      return [];
    }
    
    const announcements = response.data;

    const mappedAnnouncements = announcements.slice(0, 5).map(a => ({
      title: a.titre,
      message: a.contenu,
      date: a.datePublication || a.createdAt,
      author: a.auteur?.prenom && a.auteur?.nom ? `${a.auteur.prenom} ${a.auteur.nom}` : 'Admin'
    }));

    console.log(`📢 Mapped announcements: ${mappedAnnouncements.length}`);
    return mappedAnnouncements;
  } catch (error) {
    console.error('❌ Error fetching announcements:', error.response?.data || error.message);
    console.error('❌ Status:', error.response?.status);
    console.error('❌ URL tried:', `${BACKEND_URL}/announcement`);
    return [];
  }
}

async function fetchSummary(userId, token) {
  try {
    const [profile, exams, grades, schedule] = await Promise.all([
      fetchUserProfile(userId, token),
      fetchExams(userId, token),
      fetchGrades(userId, token),
      fetchSchedule(userId, token)
    ]);

    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });

    return {
      role: profile?.role,
      class: profile?.classe,
      upcomingExams: exams.filter(e => new Date(e.date) > new Date()).slice(0, 3),
      recentGrades: grades.slice(0, 3),
      todaySchedule: schedule.filter(s => s.day === today)
    };
  } catch (error) {
    console.error('Error fetching summary:', error);
    return null;
  }
}

module.exports = {
  detectIntent,
  fetchUserContext
};

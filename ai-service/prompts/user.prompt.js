// ai-service/prompts/user.prompt.js

function userDataPrompt(context) {
  let prompt = "USER CONTEXT:\n";
  
  if (context.user) {
    prompt += `Name: ${context.user.name}\n`;
    prompt += `Role: ${context.user.role}\n`;
    prompt += `Email: ${context.user.email}\n`;
    if (context.user.classe) {
      prompt += `Class: ${context.user.classe}\n`;
    }
    prompt += "\n";
  }

  if (context.schedule && context.schedule.length > 0) {
    prompt += "SCHEDULE FOR THIS WEEK:\n";
    context.schedule.forEach(s => {
      prompt += `- ${s.day}: ${s.course} (${s.time}) in ${s.room} with ${s.teacher}\n`;
    });
    prompt += "\n";
  } else if (context.schedule) {
    prompt += "SCHEDULE FOR THIS WEEK:\nNo classes scheduled for this week.\n\n";
  }

  if (context.exams && context.exams.length > 0) {
    prompt += "UPCOMING EXAMS:\n";
    context.exams.forEach(e => {
      prompt += `- ${e.name} (${e.course}) on ${e.date}\n`;
    });
    prompt += "\n";
  } else if (context.exams) {
    prompt += "UPCOMING EXAMS:\nNo exams scheduled.\n\n";
  }

  if (context.grades && context.grades.length > 0) {
    prompt += "RECENT GRADES:\n";
    context.grades.forEach(g => {
      prompt += `- ${g.exam} (${g.course}): ${g.score}/${g.maxScore} (${g.percentage})\n`;
    });
    prompt += "\n";
  } else if (context.grades) {
    prompt += "RECENT GRADES:\nNo grades available.\n\n";
  }

  if (context.attendance) {
    prompt += `ATTENDANCE:\nRate: ${context.attendance.attendanceRate}\n`;
    prompt += `Present: ${context.attendance.present}, Absent: ${context.attendance.absent}\n\n`;
  }

  if (context.courses && context.courses.length > 0) {
    prompt += "COURSES:\n";
    context.courses.forEach(c => {
      prompt += `- ${c.name} (${c.code}) - ${c.credits} credits, ${c.teacher}\n`;
    });
    prompt += "\n";
  } else if (context.courses) {
    prompt += "COURSES:\nNo courses found.\n\n";
  }

  if (context.teachers && context.teachers.length > 0) {
    prompt += "TEACHERS:\n";
    context.teachers.forEach(t => {
      prompt += `- ${t.name} (${t.email})\n`;
    });
    prompt += "\n";
  } else if (context.teachers) {
    prompt += "TEACHERS:\nNo teachers found.\n\n";
  }

  if (context.students && context.students.length > 0) {
    prompt += "STUDENTS:\n";
    context.students.slice(0, 10).forEach(s => {
      prompt += `- ${s.name} (${s.email})${s.class ? ` - ${s.class}` : ''}\n`;
    });
    if (context.students.length > 10) {
      prompt += `... and ${context.students.length - 10} more students\n`;
    }
    prompt += "\n";
  } else if (context.students) {
    prompt += "STUDENTS:\nNo students found.\n\n";
  }

  if (context.notifications && context.notifications.length > 0) {
    prompt += "RECENT NOTIFICATIONS:\n";
    context.notifications.forEach(n => {
      prompt += `- [${n.type}] ${n.message} (${n.read ? 'Read' : 'Unread'})\n`;
    });
    prompt += "\n";
  } else if (context.notifications) {
    prompt += "RECENT NOTIFICATIONS:\nNo notifications.\n\n";
  }

  if (context.requests && context.requests.length > 0) {
    prompt += "RECENT REQUESTS:\n";
    context.requests.forEach(r => {
      prompt += `- ${r.type}: ${r.status} (${r.date})\n`;
    });
    prompt += "\n";
  } else if (context.requests) {
    prompt += "RECENT REQUESTS:\nNo pending requests.\n\n";
  }

  if (context.announcements && context.announcements.length > 0) {
    prompt += "RECENT ANNOUNCEMENTS:\n";
    context.announcements.forEach(a => {
      prompt += `- ${a.title}: ${a.message} (Posted: ${a.date})\n`;
    });
    prompt += "\n";
  } else if (context.announcements) {
    prompt += "RECENT ANNOUNCEMENTS:\nNo announcements posted.\n\n";
  }

  if (context.summary) {
    prompt += `SUMMARY:\nRole: ${context.summary.role}\n`;
    if (context.summary.class) {
      prompt += `Class: ${context.summary.class}\n`;
    }
    if (context.summary.upcomingExams?.length > 0) {
      prompt += `Upcoming Exams: ${context.summary.upcomingExams.length}\n`;
    }
    if (context.summary.recentGrades?.length > 0) {
      prompt += `Recent Grades: ${context.summary.recentGrades.length}\n`;
    }
    prompt += "\n";
  }

  prompt += "INSTRUCTION: Answer the user's question using ONLY the information above. ";
  prompt += "If data is missing or empty, clearly state that there is no information available. ";
  prompt += "Do NOT make up or assume any information.";

  return prompt;
}

module.exports = { userDataPrompt };

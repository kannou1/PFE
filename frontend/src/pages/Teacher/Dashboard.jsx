import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, BookOpen, ClipboardCheck, BarChart3, LogOut, Bell, Search, Calendar, TrendingUp, Clock, CheckCircle2, AlertCircle } from 'lucide-react';

export default function TeacherDashboard() {
  const [selectedClass, setSelectedClass] = useState(null);

  const stats = [
    { 
      title: 'My Courses', 
      value: '5', 
      change: '+1 this semester',
      icon: BookOpen, 
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'bg-blue-500/10',
      iconColor: 'text-blue-500'
    },
    { 
      title: 'Total Students', 
      value: '124', 
      change: '+8 from last term',
      icon: Users, 
      color: 'from-purple-500 to-pink-500',
      bgColor: 'bg-purple-500/10',
      iconColor: 'text-purple-500'
    },
    { 
      title: 'Pending Grades', 
      value: '23', 
      change: '4 due this week',
      icon: ClipboardCheck, 
      color: 'from-orange-500 to-red-500',
      bgColor: 'bg-orange-500/10',
      iconColor: 'text-orange-500'
    },
    { 
      title: 'Avg Attendance', 
      value: '92%', 
      change: '+3% from last month',
      icon: TrendingUp, 
      color: 'from-green-500 to-emerald-500',
      bgColor: 'bg-green-500/10',
      iconColor: 'text-green-500'
    },
  ];

  const todayClasses = [
    { 
      id: 1,
      time: '09:00 AM', 
      endTime: '10:30 AM',
      course: 'Mathematics 101', 
      room: 'Room 301', 
      students: 30,
      attendanceTaken: true,
      status: 'completed'
    },
    { 
      id: 2,
      time: '11:00 AM', 
      endTime: '12:30 PM',
      course: 'Algebra II', 
      room: 'Room 205', 
      students: 25,
      attendanceTaken: false,
      status: 'upcoming'
    },
    { 
      id: 3,
      time: '02:00 PM', 
      endTime: '03:30 PM',
      course: 'Calculus I', 
      room: 'Room 402', 
      students: 28,
      attendanceTaken: false,
      status: 'upcoming'
    },
  ];

  const recentActivity = [
    { type: 'submission', student: 'Sarah Johnson', action: 'submitted Assignment 5', time: '2 hours ago', icon: ClipboardCheck },
    { type: 'question', student: 'Michael Chen', action: 'asked a question in Math 101', time: '4 hours ago', icon: AlertCircle },
    { type: 'grade', student: 'Emma Davis', action: 'achieved 95% on Quiz 3', time: '5 hours ago', icon: TrendingUp },
  ];

  const teacherActions = [
    { 
      title: 'Grade Assignments', 
      description: 'Review and grade pending submissions', 
      icon: ClipboardCheck, 
      color: 'from-orange-500 to-red-500',
      count: 23
    },
    { 
      title: 'Take Attendance', 
      description: 'Mark attendance for today\'s classes', 
      icon: Users, 
      color: 'from-blue-500 to-cyan-500',
      count: 2
    },
    { 
      title: 'View Students', 
      description: 'Manage student information and progress', 
      icon: Users, 
      color: 'from-purple-500 to-pink-500'
    },
    { 
      title: 'My Schedule', 
      description: 'View weekly teaching schedule', 
      icon: Calendar, 
      color: 'from-green-500 to-emerald-500'
    },
  ];

  const getStatusBadge = (status) => {
    if (status === 'completed') {
      return (
        <span className="px-2 py-1 text-xs font-medium bg-green-500/10 text-green-500 dark:text-green-400 rounded-full flex items-center gap-1 border border-green-500/20">
          <CheckCircle2 className="h-3 w-3" />
          Completed
        </span>
      );
    }
    return (
      <span className="px-2 py-1 text-xs font-medium bg-blue-500/10 text-blue-500 dark:text-blue-400 rounded-full flex items-center gap-1 border border-blue-500/20">
        <Clock className="h-3 w-3" />
        Upcoming
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-6">
      <div className="container mx-auto space-y-6">
        {/* Enhanced Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 dark:from-blue-400 dark:via-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
              Teacher Dashboard
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-2 flex items-center gap-2">
              <span className="text-lg">Welcome back, Professor Anderson</span>
              <span className="text-sm text-slate-400 dark:text-slate-600">•</span>
              <span className="text-sm text-slate-500 dark:text-slate-500">Wednesday, Dec 17, 2025</span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="icon" className="relative">
              <Bell className="h-4 w-4" />
              <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                3
              </span>
            </Button>
            <Button variant="outline" size="icon">
              <Search className="h-4 w-4" />
            </Button>
            <Button variant="outline" className="gap-2">
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>

        {/* Enhanced Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <Card 
              key={index} 
              className="relative overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer border-border"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-5`}></div>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">
                      {stat.title}
                    </p>
                    <p className="text-3xl font-bold">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.change}</p>
                  </div>
                  <div className={`h-12 w-12 rounded-xl ${stat.bgColor} flex items-center justify-center`}>
                    <stat.icon className={`h-6 w-6 ${stat.iconColor}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Today's Classes - Takes 2 columns */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl">Today's Classes</CardTitle>
                    <CardDescription className="mt-1">Your teaching schedule for today</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Calendar className="h-4 w-4" />
                    View Full Schedule
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {todayClasses.map((cls) => (
                    <div 
                      key={cls.id} 
                      className={`p-4 rounded-xl transition-all duration-300 border-2 ${
                        selectedClass === cls.id 
                          ? 'border-blue-500 bg-blue-500/5 shadow-md' 
                          : 'border-border hover:border-blue-500/50 hover:shadow-md'
                      }`}
                      onClick={() => setSelectedClass(cls.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 flex-1">
                          <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg flex-shrink-0">
                            <div className="text-center">
                              <div className="text-white font-bold text-sm">{cls.time.split(':')[0]}</div>
                              <div className="text-white text-xs opacity-90">{cls.time.split(' ')[1]}</div>
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <p className="font-semibold text-lg">{cls.course}</p>
                              {getStatusBadge(cls.status)}
                            </div>
                            <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {cls.time} - {cls.endTime}
                              </span>
                              <span>•</span>
                              <span>{cls.room}</span>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                {cls.students} students
                              </span>
                            </div>
                          </div>
                        </div>
                        <Button 
                          variant={cls.attendanceTaken ? "outline" : "default"} 
                          size="sm"
                          className={cls.attendanceTaken ? "" : "bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"}
                        >
                          {cls.attendanceTaken ? (
                            <>
                              <CheckCircle2 className="h-4 w-4 mr-2" />
                              Attendance Taken
                            </>
                          ) : (
                            'Take Attendance'
                          )}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity - Takes 1 column */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Recent Activity</CardTitle>
                <CardDescription>Latest updates from your classes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-start gap-3 pb-4 border-b border-border last:border-b-0 last:pb-0">
                      <div className="h-10 w-10 rounded-lg bg-blue-500/10 dark:bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                        <activity.icon className="h-5 w-5 text-blue-500 dark:text-blue-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{activity.student}</p>
                        <p className="text-sm text-muted-foreground">{activity.action}</p>
                        <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Enhanced Quick Actions */}
        <div>
          <h2 className="text-2xl font-bold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {teacherActions.map((action, index) => (
              <Card
                key={index}
                className="cursor-pointer hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group relative overflow-hidden"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${action.color} opacity-0 group-hover:opacity-10 transition-opacity`}></div>
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center text-center space-y-3">
                    <div className={`h-16 w-16 rounded-2xl bg-gradient-to-br ${action.color} flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg relative`}>
                      <action.icon className="h-8 w-8 text-white" />
                      {action.count && (
                        <span className="absolute -top-2 -right-2 h-6 w-6 bg-red-500 rounded-full text-xs text-white flex items-center justify-center font-bold shadow-lg">
                          {action.count}
                        </span>
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{action.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{action.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
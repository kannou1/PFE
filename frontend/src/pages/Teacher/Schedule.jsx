import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Clock, MapPin, Users, ChevronRight, Bell, Filter } from 'lucide-react';

import { getAllEmplois } from '@/services/emploiDuTempsService';
import { useAuth } from '@/hooks/useAuth';

export default function TeacherSchedule() {

  const [selectedWeek, setSelectedWeek] = useState('current');
  const [selectedDay, setSelectedDay] = useState(null);
  const [emplois, setEmplois] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    const fetchEmplois = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('token');
        const data = await getAllEmplois(token);
        // Only keep emplois/seances for this teacher
        let filtered = [];
        if (user && user.role === 'enseignant') {
          filtered = data.filter(emploi =>
            emploi.seances && emploi.seances.some(seance => seance.cours && seance.cours.enseignant && seance.cours.enseignant._id === user._id)
          ).map(emploi => ({
            ...emploi,
            seances: emploi.seances.filter(seance => seance.cours && seance.cours.enseignant && seance.cours.enseignant._id === user._id)
          }));
        } else {
          filtered = data;
        }
        setEmplois(filtered);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    if (user) fetchEmplois();
  }, [user]);

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (error) return <div className="min-h-screen flex items-center justify-center text-red-500">Error: {error}</div>;

  const daysOfWeek = [
    'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
  ];

  // Process emplois data to create schedule
  const schedule = emplois.map(emploi => ({
    id: emploi._id,
    titre: emploi.titre,
    classe: emploi.classe,
    seances: emploi.seances || []
  }));

  // Map French days to English for filtering
  const dayMap = {
    'Lundi': 'Monday',
    'Mardi': 'Tuesday',
    'Mercredi': 'Wednesday',
    'Jeudi': 'Thursday',
    'Vendredi': 'Friday',
    'Samedi': 'Saturday',
    'Dimanche': 'Sunday',
  };

  // Group seances by day (convert French to English)
  const scheduleByDay = daysOfWeek.map(day => ({
    day,
    date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    classes: schedule.flatMap(emploi =>
      emploi.seances.filter(seance => dayMap[seance.jourSemaine] === day).map(seance => ({
        time: `${seance.heureDebut} - ${seance.heureFin}`,
        course: seance.cours ? seance.cours.nom : 'Unknown Course',
        room: seance.salle,
        students: emploi.classe?.etudiants?.length || 0, // Assuming etudiants is populated
        emploiId: emploi._id,
        seanceId: seance._id
      }))
    )
  }));

  const todayIdx = new Date().getDay();
  const todayDay = daysOfWeek[todayIdx === 0 ? 6 : todayIdx - 1];
  const todayClasses = scheduleByDay.find(day => day.day === todayDay)?.classes || [];

  const totalClasses = scheduleByDay.reduce((total, day) => total + day.classes.length, 0);
  const totalHours = scheduleByDay.reduce((total, day) => total + (day.classes.length * 1.5), 0);
  const totalStudents = scheduleByDay.reduce((total, day) =>
    total + day.classes.reduce((sum, cls) => sum + cls.students, 0), 0
  );

  const isToday = (day) => day === todayDay;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-6">
      <div className="container mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Teaching Schedule
            </h1>
            <p className="text-muted-foreground mt-2">Manage your weekly teaching schedule</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="icon">
              <Bell className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
            <Select value={selectedWeek} onValueChange={setSelectedWeek}>
              <SelectTrigger className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="previous">Previous Week</SelectItem>
                <SelectItem value="current">Current Week</SelectItem>
                <SelectItem value="next">Next Week</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="hover:shadow-lg transition-all duration-300">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Classes</p>
                  <p className="text-3xl font-bold mt-2">{totalClasses}</p>
                  <p className="text-xs text-muted-foreground mt-1">This week</p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-blue-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all duration-300">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Teaching Hours</p>
                  <p className="text-3xl font-bold mt-2">{totalHours}h</p>
                  <p className="text-xs text-muted-foreground mt-1">Scheduled time</p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-purple-500/10 flex items-center justify-center">
                  <Clock className="h-6 w-6 text-purple-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all duration-300">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Students</p>
                  <p className="text-3xl font-bold mt-2">{totalStudents}</p>
                  <p className="text-xs text-muted-foreground mt-1">Across all classes</p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-green-500/10 flex items-center justify-center">
                  <Users className="h-6 w-6 text-green-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Today's Classes */}
        {todayClasses.length > 0 && (
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-2xl">
                    <Calendar className="h-6 w-6 text-blue-500" />
                    Today's Classes
                  </CardTitle>
                  <CardDescription className="mt-1">Your schedule for {todayDay}, {scheduleByDay.find(d => d.day === todayDay)?.date}</CardDescription>
                </div>
                <Badge variant="secondary" className="h-8 px-3">
                  {todayClasses.length} {todayClasses.length === 1 ? 'class' : 'classes'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {todayClasses.map((cls, index) => (
                  <div
                    key={index}
                    className="group p-4 border-2 rounded-xl hover:border-blue-500/50 hover:shadow-md transition-all duration-300"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg flex-shrink-0">
                          <div className="text-center">
                            <div className="text-white font-bold text-sm">{cls.time.split(' - ')[0]}</div>
                            <div className="text-white text-xs opacity-90">{cls.time.split(' - ')[0].includes('AM') ? 'AM' : 'PM'}</div>
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-lg mb-1">{cls.course}</p>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {cls.time}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {cls.room}
                            </span>
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {cls.students} students
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          View Details
                        </Button>
                        <Button size="sm" className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">
                          Take Attendance
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Weekly Schedule Grid */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Weekly Overview</CardTitle>
            <CardDescription>Your complete teaching schedule for the week</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {scheduleByDay.map((day) => (
                <div
                  key={day.day}
                  className={`border-2 rounded-xl p-5 transition-all duration-300 cursor-pointer ${
                    isToday(day.day)
                      ? 'border-blue-500 bg-blue-500/5 shadow-md'
                      : selectedDay === day.day
                      ? 'border-purple-500 bg-purple-500/5 shadow-md'
                      : 'border-border hover:border-primary/50 hover:shadow-md'
                  }`}
                  onClick={() => setSelectedDay(day.day)}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-bold text-xl flex items-center gap-2">
                        {day.day}
                        {isToday(day.day) && (
                          <Badge className="bg-blue-500 hover:bg-blue-600">Today</Badge>
                        )}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">{day.date}, 2025</p>
                    </div>
                    <Badge variant="outline" className="h-8 px-3">
                      {day.classes.length} {day.classes.length === 1 ? 'class' : 'classes'}
                    </Badge>
                  </div>

                  {day.classes.length > 0 ? (
                    <div className="space-y-2">
                      {day.classes.map((cls, index) => (
                        <div
                          key={index}
                          className="p-3 bg-card border rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 flex-1">
                              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                                <Clock className="h-5 w-5 text-white" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium truncate">{cls.course}</p>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                                  <span>{cls.time}</span>
                                  <span>•</span>
                                  <span>{cls.room}</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" className="text-xs">
                                {cls.students}
                              </Badge>
                              <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="h-16 w-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-3">
                        <Calendar className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <p className="text-muted-foreground text-sm">No classes scheduled</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

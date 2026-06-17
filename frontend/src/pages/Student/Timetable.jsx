import React, { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Clock, User, BookOpen, ChevronLeft, ChevronRight, Calendar, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getAllEmplois } from "@/services/emploiDuTempsService";
import { getAllSeances } from "@/services/seanceService";

const Timetable = () => {
  const [schedule, setSchedule] = useState({});
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [currentWeek, setCurrentWeek] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const days = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];

  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        setLoading(true);
        setError(null);
        const token = localStorage.getItem("token");
        
        if (!token) {
          console.error("No authentication token found");
          setError("Authentication required");
          setLoading(false);
          return;
        }

        const [emploisData, seancesData] = await Promise.all([
          getAllEmplois(token),
          getAllSeances(token)
        ]);

        console.log("=== TIMETABLE DEBUG ===");
        console.log("Emplois:", emploisData);
        console.log("Seances:", seancesData);

        if (!seancesData || !Array.isArray(seancesData) || seancesData.length === 0) {
          console.warn("No seances data available");
          setError("No schedule data available");
          setLoading(false);
          return;
        }


        const userStr = localStorage.getItem("user");
        const user = userStr ? JSON.parse(userStr) : null;
        const userClassId = user?.classe?._id || user?.classe;

        console.log("User Class ID:", userClassId);

        let filteredSeances = seancesData;

        if (userClassId) {
          filteredSeances = seancesData.filter((seance) => {
            const seanceClassId = typeof seance.classe === 'object' 
              ? (seance.classe?._id || seance.classe?.id) 
              : seance.classe;
            return seanceClassId === userClassId;
          });
        }

        console.log("Filtered seances:", filteredSeances);

        if (filteredSeances.length === 0) {
          console.warn("No seances found for user class");
          setError("No schedule found for your class");
          setLoading(false);
          return;
        }
         
        
        const normalizeJourSemaine = (value) => {
          if (!value) return null;
          const v = String(value).trim().toLowerCase();
          const map = {
            lundi: "Lundi",
            mardi: "Mardi",
            mercredi: "Mercredi",
            jeudi: "Jeudi",
            vendredi: "Vendredi",
            samedi: "Samedi",
            dimanche: "Dimanche",
          };
          return map[v] || null;
        };

        const normalizeTimeHHmm = (value) => {
          if (value == null) return "00:00";
          const s = String(value).trim().replaceAll("h", ":");
          const parts = s.split(":");
          if (parts.length < 2) return "00:00";
          const hh = String(parseInt(parts[0] || "0", 10)).padStart(2, "0");
          const mm = String(parseInt(parts[1] || "0", 10)).padStart(2, "0");
          return `${hh}:${mm}`;
        };

        // Group seances by day
        // Ensure we always render all 7 days, even if some have no sessions
        const scheduleData = {};
        days.forEach((d) => {
          scheduleData[d] = [];
        });

        filteredSeances.forEach((seance) => {
          const day = normalizeJourSemaine(seance.jourSemaine);
          if (!day) {
            console.warn(`Seance ${seance._id} invalid jourSemaine:`, seance.jourSemaine);
            return;
          }

          const courseName = seance.cours?.nom || seance.cours?.name || "Course";

          // Backend populates `enseignant` separately on the seance document.
          const instructor = seance.enseignant;
          const instructorName = instructor
            ? `${instructor.prenom || ""} ${instructor.nom || ""}`.trim() || "Instructor"
            : "Instructor";

          // Backend uses `typeCours` in the seance document.
          const seanceType = seance.typeCours || seance.type || "Lecture";

          scheduleData[day].push({
            course: courseName,

            room: seance.salle || "Room TBA",
            instructor: instructorName || "Instructor",
            type: seance.typeCours || "Lecture",
            seanceId: seance._id,
            notes: seance.notes || "",
            heureDebut: normalizeTimeHHmm(seance.heureDebut),
            heureFin: normalizeTimeHHmm(seance.heureFin),
          });
        });

        // Sort sessions by start time for each day
        days.forEach((day) => {
          scheduleData[day].sort((a, b) => a.heureDebut.localeCompare(b.heureDebut));
        });

        console.log("Final schedule:", scheduleData);
        setSchedule(scheduleData);
      } catch (err) {
        console.error("Error fetching schedule:", err);
        setError(err.message || "Error loading schedule");
      } finally {
        setLoading(false);
      }
    };

    fetchSchedule();
  }, []);

  const getCellClass = (course) => {
    const colorMap = {
      "Advanced JavaScript": "from-blue-500 to-blue-600 border-blue-400",
      "Web Development Fundamentals": "from-purple-500 to-purple-600 border-purple-400",
      "Network Security Fundamentals": "from-green-500 to-green-600 border-green-400",
      "Cryptography & Encryption": "from-red-500 to-red-600 border-red-400",
      "Machine Learning Basics": "from-orange-500 to-orange-600 border-orange-400",
      "Data Analytics with Python": "from-pink-500 to-pink-600 border-pink-400",
    };
    return colorMap[course] || "from-indigo-500 to-indigo-600 border-indigo-400";
  };

  const getTodayIndex = () => {
    const today = new Date().getDay();
    return today === 0 ? 6 : today - 1;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-6">
        <div className="container mx-auto">
          <Card className="border-0 shadow-lg">
            <CardContent className="flex flex-col items-center justify-center py-20">
              <div className="relative">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary/20 border-t-primary"></div>
                <Calendar className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-6 w-6 text-primary" />
              </div>
              <p className="text-muted-foreground mt-6 text-lg">Loading your timetable...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-6">
        <div className="container mx-auto">
          <Card className="border-0 shadow-lg border-l-4 border-l-red-500">
            <CardContent className="py-12">
              <div className="text-center max-w-md mx-auto">
                <div className="h-16 w-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="h-8 w-8 text-red-500" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Error Loading Schedule</h3>
                <p className="text-muted-foreground mb-6">{error}</p>
                <Button onClick={() => window.location.reload()} className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">
                  Try Again
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const hasSchedule = Object.keys(schedule).length > 0;
  const totalClasses = Object.values(schedule).reduce((acc, day) => acc + day.length, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-6">
      <div className="container mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Weekly Schedule
            </h1>
            <p className="text-muted-foreground mt-2">
              {hasSchedule 
                ? `${totalClasses} classes scheduled this week` 
                : "No schedule available"}
            </p>
          </div>
          <div className="flex items-center gap-3 bg-card border rounded-lg p-1 shadow-sm">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCurrentWeek(currentWeek - 1)}
              className="h-9 w-9"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="px-4 py-2 text-center min-w-[140px]">
              <p className="text-sm font-semibold">Week {Math.abs(currentWeek) + 1}</p>
              <p className="text-xs text-muted-foreground">Fall 2025</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCurrentWeek(currentWeek + 1)}
              className="h-9 w-9"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Main Schedule Card */}
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            {!hasSchedule ? (
              <div className="text-center py-16">
                <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="h-10 w-10 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-2">No Schedule Available</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  No classes found for this week. Please check back later or contact your administrator.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
                {days.map((day, index) => {
                  const isToday = index === getTodayIndex();
                  const dayClasses = schedule[day] || [];
                  
                  return (
                    <div key={day} className="space-y-3">
                      {/* Day Header */}
                      <div
                        className={`text-center p-3 rounded-xl font-semibold transition-all ${
                          isToday
                            ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg"
                            : "bg-muted hover:bg-muted/80"
                        }`}
                      >
                        <div className="text-sm">{day}</div>
                        {isToday && (
                          <div className="text-xs mt-1 opacity-90">Today</div>
                        )}
                      </div>

                      {/* Day Classes */}
                      <div className="space-y-3 min-h-[500px]">
                        {dayClasses.length > 0 ? (
                          dayClasses.map((session, idx) => (
                            <div
                              key={`${session.seanceId}-${idx}`}
                              className={`group relative p-4 rounded-xl bg-gradient-to-br ${getCellClass(
                                session.course
                              )} cursor-pointer hover:shadow-xl hover:scale-105 transition-all duration-300 border-l-4 overflow-hidden`}
                              onClick={() => setSelectedCourse(session)}
                            >
                              {/* Hover overlay */}
                              <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors rounded-xl"></div>
                              
                              <div className="relative z-10">
                                <p className="font-bold text-sm text-white mb-3 leading-tight pr-6">
                                  {session.course}
                                </p>
                                
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2">
                                    <div className="h-6 w-6 rounded-md bg-white/20 flex items-center justify-center flex-shrink-0">
                                      <Clock className="h-3 w-3 text-white" />
                                    </div>
                                    <p className="text-xs text-white font-medium">
                                      {session.heureDebut} - {session.heureFin}
                                    </p>
                                  </div>

                                  <div className="flex items-center gap-2">
                                    <div className="h-6 w-6 rounded-md bg-white/20 flex items-center justify-center flex-shrink-0">
                                      <MapPin className="h-3 w-3 text-white" />
                                    </div>
                                    <p className="text-xs text-white">{session.room}</p>
                                  </div>
                                </div>

                                <div className="mt-3 pt-3 border-t border-white/20">
                                  <Badge variant="secondary" className="text-xs bg-white/90 hover:bg-white text-gray-900">
                                    {session.type}
                                  </Badge>
                                </div>

                                {/* Info icon */}
                                <div className="absolute top-3 right-3 h-6 w-6 rounded-full bg-white/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Info className="h-3 w-3 text-white" />
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="flex items-center justify-center h-32 border-2 border-dashed border-muted rounded-xl">
                            <p className="text-sm text-muted-foreground">No classes</p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Course Details Dialog */}
      <Dialog open={!!selectedCourse} onOpenChange={() => setSelectedCourse(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {selectedCourse?.course}
            </DialogTitle>
          </DialogHeader>
          {selectedCourse && (
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-1 gap-4">
                <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                  <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                    <User className="h-5 w-5 text-blue-500" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-muted-foreground">Instructor</p>
                    <p className="text-base font-semibold mt-1">{selectedCourse.instructor}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                  <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                    <MapPin className="h-5 w-5 text-purple-500" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-muted-foreground">Location</p>
                    <p className="text-base font-semibold mt-1">{selectedCourse.room}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                  <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center flex-shrink-0">
                    <Clock className="h-5 w-5 text-green-500" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-muted-foreground">Schedule</p>
                    <p className="text-base font-semibold mt-1">
                      {selectedCourse.heureDebut} - {selectedCourse.heureFin}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                  <div className="h-10 w-10 rounded-lg bg-orange-500/10 flex items-center justify-center flex-shrink-0">
                    <BookOpen className="h-5 w-5 text-orange-500" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-muted-foreground">Type</p>
                    <p className="text-base font-semibold mt-1">{selectedCourse.type}</p>
                  </div>
                </div>
              </div>

              {selectedCourse.notes && (
                <div className="pt-4 border-t">
                  <p className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <Info className="h-4 w-4" />
                    Additional Notes
                  </p>
                  <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                    {selectedCourse.notes}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Timetable;
  import React, { useState, useEffect } from "react";
  import { Link, useLocation } from "react-router-dom";
  import {
    LayoutDashboard,
    BookOpen,
    Calendar,
    FileText,
    UserCheck,
    Send,
    MessageSquare,
    Bell,
    Megaphone,
  } from "lucide-react";
  import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarHeader,
    SidebarFooter,
    useSidebar,
    
  } from "@/components/ui/sidebar";
  import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
  import { getUserAuth } from "@/services/userService";

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://http://192.168.1.165:5000';

  const navItems = [
    { path: "", label: "Dashboard", icon: LayoutDashboard },
    { path: "courses", label: "Courses", icon: BookOpen },
    { path: "timetable", label: "Timetable", icon: Calendar },
    { path: "exams", label: "Exams & Notes", icon: FileText },
    { path: "attendance", label: "Attendance", icon: UserCheck },
    { path: "announcements", label: "Announcements", icon: Megaphone }, 
    { path: "requests", label: "Requests", icon: Send },
    { path: "messages", label: "Messages", icon: MessageSquare },
    { path: "notifications", label: "Notifications", icon: Bell },
    {path: "chatbot", label: "EduBot", icon: MessageSquare }
  ];

  export function StudentSidebar() {
    const location = useLocation();
    const { state } = useSidebar();
    const isCollapsed = state === "collapsed";
    const [student, setStudent] = useState(null);

    useEffect(() => {
      const fetchStudent = async () => {
        try {
          const response = await getUserAuth();
          const userData = response.data || response;
          setStudent(userData);
        } catch (error) {
          console.error("Error fetching student data:", error);
        }
      };
      fetchStudent();
    }, []);

    const getInitials = () => {
      if (!student) return "ST";
      const first = student.prenom?.[0]?.toUpperCase() || "";
      const last = student.nom?.[0]?.toUpperCase() || "";
      return first + last || "ST";
    };

    const getFullName = () => {
      if (!student) return "Student";
      return `${student.prenom || ""} ${student.nom || ""}`.trim() || "Student";
    };

    return (
      <Sidebar 
        collapsible="icon" 
        className="border-r transition-[width] duration-200 ease-out flex flex-col h-screen"
      >
        {/* HEADER */}
        <SidebarHeader 
          className="h-16 border-b border-border/50 bg-gradient-to-br from-sidebar to-sidebar/80 flex items-center flex-shrink-0"
        >
          <Link
            to="/student/"
            className={`flex items-center w-full transition-all duration-200 ${
              isCollapsed ? "justify-center px-3" : "gap-3 px-4"
            }`}
          >
            {/* FIXED PERFECT COLLAPSED LOGO */}
            <div
              className={`
                flex items-center justify-center 
                rounded-xl shadow-lg 
                bg-gradient-to-br from-primary to-secondary
                transition-all duration-200
                w-9 h-9 flex-shrink-0
              `}
            >
              <span className="text-base font-bold text-white select-none">E</span>
            </div>

            {!isCollapsed && (
              <div className="flex flex-col transition-opacity duration-200">
                <span className="text-base font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  EduNex
                </span>
                <span className="text-[10px] text-muted-foreground">
                  Student Portal
                </span>
              </div>
            )}
          </Link>
        </SidebarHeader>

        {/* MENU - No scroll, flex-1 to fill space */}
        <SidebarContent 
          className={`py-4 transition-all duration-200 flex-1 overflow-hidden ${
            isCollapsed ? 'px-1' : 'px-2'
          }`}
        >
          <SidebarGroup className="h-full flex flex-col">
            
            <SidebarGroupContent className="flex-1 flex flex-col justify-center">
              <SidebarMenu className="space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === `/student${item.path ? `/${item.path}` : ''}`;

                  return (
                    <SidebarMenuItem key={item.path}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        tooltip={item.label}
                        className={`transition-all duration-200 hover:bg-accent/50 ${
                          isCollapsed
                            ? 'h-11 w-11 p-0 justify-center mx-auto rounded-lg'
                            : 'h-11 px-3'
                        } ${
                          isActive
                            ? 'bg-gradient-to-r from-primary/15 to-secondary/15 border-l-4 border-primary shadow-sm'
                            : ''
                        }`}
                      >
                        <Link 
                          to={item.path} 
                          className={`flex items-center w-full ${
                            isCollapsed ? 'justify-center' : 'gap-3'
                          }`}
                        >
                          <Icon 
                            className={`h-5 w-5 flex-shrink-0 transition-all duration-200 ${
                              isActive ? 'text-primary' : ''
                            }`} 
                          />
                          {!isCollapsed && (
                            <span className="font-medium whitespace-nowrap">
                              {item.label}
                            </span>
                          )}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        {/* FOOTER - Connected Student Info */}
        <SidebarFooter 
          className={`border-t border-border/50 transition-all duration-200 flex-shrink-0 ${
            isCollapsed ? 'p-2' : 'p-4'
          }`}
        >
          <Link
            to="/student/profile"
            className={`flex items-center rounded-lg hover:bg-accent/50 transition-all duration-200 cursor-pointer overflow-hidden ${
              isCollapsed ? 'justify-center p-2' : 'gap-3 px-2 py-2'
            }`}
          >
            <Avatar className="h-9 w-9 border-2 border-primary/20 flex-shrink-0">
              {student?.image_User ? (
                <AvatarImage 
                  src={`${API_BASE_URL}/images/${student.image_User}`}
                  alt={getFullName()}
                />
              ) : null}
              <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white font-semibold">
                {getInitials()}
              </AvatarFallback>
            </Avatar>
            {!isCollapsed && (
              <div className="flex flex-col flex-1 min-w-0">
                <span className="text-sm font-semibold truncate whitespace-nowrap">
                  {getFullName()}
                </span>
                <span className="text-xs text-muted-foreground truncate whitespace-nowrap">
                  {student?.email || "student@edunex.com"}
                </span>
              </div>
            )}
          </Link>
        </SidebarFooter>
      </Sidebar>
    );
  }

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { DatePicker } from '@/components/ui/date-picker';
import { Search, Trash2, Mail, Loader2, AlertCircle, UserPlus, Eye, EyeOff, Calendar, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Edit, Phone, MapPin, Briefcase, GraduationCap } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { getAllUsers, deleteUserById, createUser, updateUserById } from '@/services/userService';
import { getAllClasses } from '@/services/classeService';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

// ✅ SUPER SIMPLE UserAvatar Component
const UserAvatar = ({ user, size = 'default' }) => {
  const [imageError, setImageError] = useState(false);
  
  const sizeClasses = {
    small: 'h-8 w-8 text-xs',
    default: 'h-9 w-9 sm:h-10 sm:w-10 text-sm',
    large: 'h-12 w-12 sm:h-14 sm:w-14 text-base',
    xl: 'h-20 w-20 sm:h-24 sm:w-24 text-xl'
  };

  const initial = user.prenom?.charAt(0)?.toUpperCase() || user.nom?.charAt(0)?.toUpperCase() || 'U';

  if (!user.image_User || imageError) {
    return (
      <div className={`${sizeClasses[size]} flex-shrink-0 rounded-full bg-gradient-to-br from-purple-600 to-cyan-600 flex items-center justify-center text-white font-semibold`}>
        {initial}
      </div>
    );
  }

  return (
    <div className={`${sizeClasses[size]} flex-shrink-0 rounded-full overflow-hidden border-2 border-purple-600/20 bg-gray-100`}>
      <img
       src={`${API_BASE_URL}/images/${user.image_User}`}
        alt={`${user.prenom} ${user.nom}`}
        className="h-full w-full object-cover"
        onError={() => setImageError(true)}
        loading="lazy"
      />
    </div>
  );
};

export default function AdminUsers() {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [classFilter, setClassFilter] = useState('all');
  const [allUsers, setAllUsers] = useState([]);
  const [allClasses, setAllClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [deletingUser, setDeletingUser] = useState(null);
  const [updatingUser, setUpdatingUser] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [newUser, setNewUser] = useState({
    nom: '',
    prenom: '',
    email: '',
    password: '',
    role: 'etudiant',
    sexe: '',
    image_User: null,
    NumTel: '',
    Adresse: '',
    datedeNaissance: '',
    classe: '',
    dateInscription: '',
    specialite: '',
    dateEmbauche: '',
    NumTelEnseignant: '',
    classes: [],
    adminCode: '',
  });
  const [formErrors, setFormErrors] = useState({});
  const [createError, setCreateError] = useState(null);
  const [updateError, setUpdateError] = useState(null);
  const [deleteError, setDeleteError] = useState(null);

  useEffect(() => {
    fetchUsers();
    fetchClasses();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, roleFilter, classFilter]);

  useEffect(() => {
    if (roleFilter !== 'etudiant') {
      setClassFilter('all');
    }
  }, [roleFilter]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getAllUsers();
      
      const users = response?.data?.data?.userList || 
                    response?.data?.userList || 
                    response?.data || 
                    [];
      
      setAllUsers(users);
    } catch (err) {
      setAllUsers([]);
      setError(err?.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchClasses = async () => {
    try {
      const response = await getAllClasses();
      const classes = Array.isArray(response?.data) ? response.data : Array.isArray(response) ? response : [];
      setAllClasses(classes);
    } catch (err) {
      setAllClasses([]);
      console.error('Error fetching classes:', err);
    }
  };

  const filteredUsers = useMemo(() => {
    return (Array.isArray(allUsers) ? allUsers : []).filter(user => {
      if (roleFilter !== 'all' && user.role !== roleFilter) return false;
      if (roleFilter === 'etudiant' && classFilter !== 'all') {
        const userClassId = typeof user.classe === 'object' ? user.classe._id : user.classe;
        if (userClassId !== classFilter) return false;
      }
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const fullName = `${user.prenom || ''} ${user.nom || ''}`.toLowerCase();
        return fullName.includes(term) || (user.email || '').toLowerCase().includes(term);
      }
      return true;
    });
  }, [allUsers, searchTerm, roleFilter, classFilter]);

  const totalPages = Math.ceil((filteredUsers || []).length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentUsers = (filteredUsers || []).slice(startIndex, endIndex);

  const goToPage = (page) => setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  const goToFirstPage = () => setCurrentPage(1);
  const goToLastPage = () => setCurrentPage(totalPages);
  const goToPreviousPage = () => setCurrentPage(prev => Math.max(1, prev - 1));
  const goToNextPage = () => setCurrentPage(prev => Math.min(totalPages, prev + 1));

  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else if (currentPage <= 3) {
      for (let i = 1; i <= 4; i++) pages.push(i);
      pages.push('...');
      pages.push(totalPages);
    } else if (currentPage >= totalPages - 2) {
      pages.push(1, '...');
      for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1, '...');
      for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
      pages.push('...', totalPages);
    }
    return pages;
  };

  const getRoleBadgeColor = role => {
    switch (role) {
      case 'admin': return 'bg-red-500 text-white hover:bg-red-600';
      case 'enseignant': return 'bg-blue-500 text-white hover:bg-blue-600';
      case 'etudiant': return 'bg-green-500 text-white hover:bg-green-600';
      default: return 'bg-gray-500 text-white hover:bg-gray-600';
    }
  };

  const getRoleLabel = role => {
    switch (role) {
      case 'admin': return 'Admin';
      case 'enseignant': return 'Teacher';
      case 'etudiant': return 'Student';
      default: return role;
    }
  };

  const handleDeleteUser = async () => {
    try {
      setActionLoading(true);
      setDeleteError(null);
      await deleteUserById(deletingUser._id);
      setSuccess(`User ${deletingUser.prenom} ${deletingUser.nom} deleted successfully`);
      await fetchUsers();
      setIsDeleteDialogOpen(false);
      setDeletingUser(null);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setDeleteError(err?.response?.data?.message || err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const validateForm = (isUpdate = false) => {
    const errors = {};
    const userData = isUpdate ? updatingUser : newUser;

    if (!userData.nom.trim()) errors.nom = 'Last name is required';
    if (!userData.prenom.trim()) errors.prenom = 'First name is required';
    if (!userData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userData.email)) {
      errors.email = 'Invalid email address';
    }

    // Password only required for new users
    if (!isUpdate) {
      if (!userData.password) {
        errors.password = 'Password is required';
      } else if (!/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}$/.test(userData.password)) {
        errors.password = 'Password must contain at least 8 characters, one uppercase, one lowercase and one number';
      }
    } else if (userData.password && !/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}$/.test(userData.password)) {
      errors.password = 'Password must contain at least 8 characters, one uppercase, one lowercase and one number';
    }

    if (!userData.role) errors.role = 'Role is required';
    if (!userData.sexe) errors.sexe = 'Gender is required';
    if (userData.role === 'etudiant' && !userData.classe) {
      errors.classe = 'Class is required for students';
    }
    if (userData.role === 'enseignant' && !userData.specialite?.trim()) {
      errors.specialite = 'Specialty is required for teachers';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateUser = async () => {
    if (!validateForm(false)) return;

    try {
      setActionLoading(true);
      setCreateError(null);

      const userData = {
        nom: newUser.nom,
        prenom: newUser.prenom,
        email: newUser.email,
        password: newUser.password,
        role: newUser.role,
      };

      if (newUser.role === "etudiant") {
        if (newUser.sexe) userData.sexe = newUser.sexe;
        if (newUser.NumTel) userData.NumTel = newUser.NumTel;
        if (newUser.Adresse) userData.Adresse = newUser.Adresse;
        if (newUser.datedeNaissance) userData.datedeNaissance = newUser.datedeNaissance;
        if (newUser.classe) userData.classe = newUser.classe;
        if (newUser.dateInscription) userData.dateInscription = newUser.dateInscription;
      }

      if (newUser.role === "enseignant") {
        if (newUser.specialite) userData.specialite = newUser.specialite;
        if (newUser.dateEmbauche) userData.dateEmbauche = newUser.dateEmbauche;
        if (newUser.NumTelEnseignant) userData.NumTelEnseignant = newUser.NumTelEnseignant;
        if ((newUser.classes || []).length > 0) userData.classes = newUser.classes;
      }

      if (newUser.role === "admin") {
        if (newUser.adminCode) userData.adminCode = newUser.adminCode;
      }

      if (newUser.image_User instanceof File) {
        userData.image_User = newUser.image_User;
      }

      await createUser(userData);
      setSuccess(`User ${newUser.prenom} ${newUser.nom} created successfully`);
      await fetchUsers();
      setIsCreateDialogOpen(false);
      resetCreateForm();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setCreateError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateUser = async () => {
    if (!validateForm(true)) return;

    try {
      setActionLoading(true);
      setUpdateError(null);

      const userData = {
        nom: updatingUser.nom,
        prenom: updatingUser.prenom,
        email: updatingUser.email,
        role: updatingUser.role,
        sexe: updatingUser.sexe,
      };

      // Only include password if it was changed
      if (updatingUser.password) {
        userData.password = updatingUser.password;
      }

      if (updatingUser.role === "etudiant") {
        if (updatingUser.NumTel) userData.NumTel = updatingUser.NumTel;
        if (updatingUser.Adresse) userData.Adresse = updatingUser.Adresse;
        if (updatingUser.datedeNaissance) userData.datedeNaissance = updatingUser.datedeNaissance;
        if (updatingUser.classe) userData.classe = updatingUser.classe;
        if (updatingUser.dateInscription) userData.dateInscription = updatingUser.dateInscription;
      }

      if (updatingUser.role === "enseignant") {
        if (updatingUser.specialite) userData.specialite = updatingUser.specialite;
        if (updatingUser.dateEmbauche) userData.dateEmbauche = updatingUser.dateEmbauche;
        if (updatingUser.NumTelEnseignant) userData.NumTelEnseignant = updatingUser.NumTelEnseignant;
        if ((updatingUser.classes || []).length > 0) userData.classes = updatingUser.classes;
      }

      if (updatingUser.role === "admin") {
        if (updatingUser.adminCode) userData.adminCode = updatingUser.adminCode;
      }

      if (updatingUser.image_User instanceof File) {
        userData.image_User = updatingUser.image_User;
      }

      await updateUserById(updatingUser._id, userData);
      setSuccess(`User ${updatingUser.prenom} ${updatingUser.nom} updated successfully`);
      await fetchUsers();
      setIsUpdateDialogOpen(false);
      setUpdatingUser(null);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setUpdateError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const resetCreateForm = () => {
    setNewUser({
      nom: '',
      prenom: '',
      email: '',
      password: '',
      role: 'etudiant',
      image_User: null,
      NumTel: '',
      Adresse: '',
      datedeNaissance: '',
      classe: '',
      dateInscription: '',
      specialite: '',
      dateEmbauche: '',
      NumTelEnseignant: '',
      classes: [],
      adminCode: '',
    });
    setFormErrors({});
    setShowPassword(false);
    setCreateError(null);
  };

  const openCreateDialog = () => {
    resetCreateForm();
    setIsCreateDialogOpen(true);
  };

  const openUpdateDialog = (user) => {
    setUpdatingUser({
      ...user,
      password: '', // Don't prefill password
      datedeNaissance: user.datedeNaissance ? new Date(user.datedeNaissance).toISOString().split('T')[0] : '',
      dateInscription: user.dateInscription ? new Date(user.dateInscription).toISOString().split('T')[0] : '',
      dateEmbauche: user.dateEmbauche ? new Date(user.dateEmbauche).toISOString().split('T')[0] : '',
      classes: user.classes?.map(c => typeof c === 'object' ? c._id : c) || [],
      classe: typeof user.classe === 'object' ? user.classe._id : user.classe,
    });
    setFormErrors({});
    setShowPassword(false);
    setUpdateError(null);
    setIsUpdateDialogOpen(true);
  };

  const openDeleteDialog = user => {
    setDeletingUser(user);
    setDeleteError(null);
    setIsDeleteDialogOpen(true);
  };

  const openDetailsDialog = (user) => {
    setSelectedUser(user);
    setIsDetailsDialogOpen(true);
  };

  const handleRoleChange = (value, isUpdate = false) => {
    if (isUpdate) {
      setUpdatingUser({
        ...updatingUser,
        role: value,
        NumTel: '',
        Adresse: '',
        datedeNaissance: '',
        classe: '',
        dateInscription: '',
        specialite: '',
        dateEmbauche: '',
        NumTelEnseignant: '',
        classes: [],
        adminCode: '',
      });
    } else {
      setNewUser({
        ...newUser,
        role: value,
        NumTel: '',
        Adresse: '',
        datedeNaissance: '',
        classe: '',
        dateInscription: '',
        specialite: '',
        dateEmbauche: '',
        NumTelEnseignant: '',
        classes: [],
        adminCode: '',
      });
    }
    setFormErrors({});
  };

  const handleClassesChange = (classId, isUpdate = false) => {
    const userData = isUpdate ? updatingUser : newUser;
    const setUserData = isUpdate ? setUpdatingUser : setNewUser;
    const currentClasses = userData.classes || [];
    
    if (currentClasses.includes(classId)) {
      setUserData({
        ...userData,
        classes: currentClasses.filter(id => id !== classId)
      });
    } else {
      setUserData({
        ...userData,
        classes: [...currentClasses, classId]
      });
    }
  };

  const handleImageChange = (e, isUpdate = false) => {
    const file = e.target.files[0];
    if (file) {
      if (isUpdate) {
        setUpdatingUser({ ...updatingUser, image_User: file });
      } else {
        setNewUser({ ...newUser, image_User: file });
      }
    }
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const getClassInfo = (classe) => {
    if (!classe) return 'N/A';
    if (typeof classe === 'object') {
      return `${classe.nom} - ${classe.annee} ${classe.specialisation}`;
    }
    const foundClass = allClasses.find(c => c._id === classe);
    return foundClass ? `${foundClass.nom} - ${foundClass.annee} ${foundClass.specialisation}` : classe;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-2 sm:p-4 lg:p-6">
      <div className="container mx-auto space-y-3 sm:space-y-4 lg:space-y-6 max-w-7xl">
        <div className="flex flex-col gap-3 sm:gap-4">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
            <div className="flex-1">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                User Management
              </h1>
              <p className="text-muted-foreground mt-1 text-xs sm:text-sm">
                View and manage all users in the system
              </p>
            </div>
            <Button onClick={openCreateDialog} className="bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 hover:from-purple-500 hover:via-blue-500 hover:to-cyan-500 text-white shadow-lg w-full sm:w-auto sm:shrink-0" size="sm">
              <UserPlus className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
              <span className="text-sm">Create User</span>
            </Button>
          </div>

          {error && (
            <Alert variant="destructive" className="animate-in slide-in-from-top-2 duration-300">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="bg-green-50 dark:bg-green-950/50 text-green-900 dark:text-green-300 border-green-200 dark:border-green-800/50 animate-in slide-in-from-top-2 duration-300">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">{success}</AlertDescription>
            </Alert>
          )}
        </div>

        <Card className="shadow-xl">
          <CardHeader className="space-y-1 p-4 sm:p-6">
            <CardTitle className="text-lg sm:text-xl lg:text-2xl">All Users</CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Showing {startIndex + 1}-{Math.min(endIndex, (filteredUsers || []).length)} of {(filteredUsers || []).length} user{(filteredUsers || []).length !== 1 ? 's' : ''}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 space-y-4">
            <div className="flex flex-col gap-3">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 text-sm h-9 sm:h-10"
                  />
                </div>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="w-full sm:w-[160px] lg:w-[180px] h-9 sm:h-10 text-sm">
                    <SelectValue placeholder="Filter by role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="enseignant">Teacher</SelectItem>
                    <SelectItem value="etudiant">Student</SelectItem>
                  </SelectContent>
                </Select>
                {roleFilter === 'etudiant' && (
                  <Select value={classFilter} onValueChange={setClassFilter}>
                    <SelectTrigger className="w-full sm:w-[160px] lg:w-[180px] h-9 sm:h-10 text-sm">
                      <SelectValue placeholder="Filter by class" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Classes</SelectItem>
                      {(Array.isArray(allClasses) ? allClasses : []).map((classe) => (
                        <SelectItem key={classe._id} value={classe._id} className="text-sm">
                          {classe.nom} - {classe.annee} {classe.specialisation}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground text-xs sm:text-sm whitespace-nowrap">Show:</span>
                <Select value={itemsPerPage.toString()} onValueChange={(value) => { setItemsPerPage(Number(value)); setCurrentPage(1); }}>
                  <SelectTrigger className="w-[70px] h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
                <span className="text-muted-foreground text-xs sm:text-sm">per page</span>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (Array.isArray(currentUsers) && currentUsers.length === 0) ? (
              <div className="text-center py-12 text-muted-foreground text-sm">
                {(filteredUsers || []).length === 0 ? 'No users found' : 'No users on this page'}
              </div>
            ) : (
              <div className="space-y-2 sm:space-y-3">
                {(Array.isArray(currentUsers) ? currentUsers : []).map(user => (
                  <div 
                    key={user._id} 
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 border rounded-lg hover:bg-accent/50 transition-colors gap-3 cursor-pointer"
                    onClick={() => openDetailsDialog(user)}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <UserAvatar user={user} size="default" />
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate text-sm sm:text-base">
                          {user.prenom} {user.nom}
                        </p>
                        <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                          <Mail className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">{user.email}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap" onClick={(e) => e.stopPropagation()}>
                      <Badge className={`${getRoleBadgeColor(user.role)} text-xs px-2 py-0.5`}>
                        {getRoleLabel(user.role)}{user.role === 'etudiant' && user.classe ? ` - ${typeof user.classe === 'object' ? user.classe.nom : (allClasses.find(c => c._id === user.classe)?.nom || 'Unknown')}` : ''}
                      </Badge>
                      <Badge className={`text-xs px-2 py-0.5 ${user.Status ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-slate-600 hover:bg-slate-700'}`}>
                        {user.Status ? 'Active' : 'Inactive'}
                      </Badge>
                      <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); openUpdateDialog(user); }} className="hover:bg-blue-500/10 hover:text-blue-600 h-8 w-8 sm:h-9 sm:w-9">
                        <Edit className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); openDeleteDialog(user); }} className="hover:bg-destructive/10 hover:text-destructive h-8 w-8 sm:h-9 sm:w-9">
                        <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!loading && (filteredUsers || []).length > 0 && totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t">
                <div className="text-xs sm:text-sm text-muted-foreground order-2 sm:order-1">
                  Page {currentPage} of {totalPages}
                </div>
                <div className="flex items-center gap-1 sm:gap-2 order-1 sm:order-2">
                  <Button variant="outline" size="icon" onClick={goToFirstPage} disabled={currentPage === 1} className="h-8 w-8 sm:h-9 sm:w-9 hidden sm:flex">
                    <ChevronsLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" onClick={goToPreviousPage} disabled={currentPage === 1} className="h-8 w-8 sm:h-9 sm:w-9">
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <div className="flex items-center gap-1">
                    {(Array.isArray(getPageNumbers()) ? getPageNumbers() : []).map((page, index) => (
                      page === '...' ? (
                        <span key={`ellipsis-${index}`} className="px-2 text-muted-foreground hidden sm:inline">
                          ...
                        </span>
                      ) : (
                        <Button
                          key={page}
                          variant={currentPage === page ? "default" : "outline"}
                          size="icon"
                          onClick={() => goToPage(page)}
                          className={`h-8 w-8 sm:h-9 sm:w-9 text-xs sm:text-sm ${
                            currentPage === page 
                              ? 'bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500' 
                              : ''
                          } ${index > 1 && index < getPageNumbers().length - 1 ? 'hidden sm:inline-flex' : ''}`}
                        >
                          {page}
                        </Button>
                      )
                    ))}
                  </div>
                  <Button variant="outline" size="icon" onClick={goToNextPage} disabled={currentPage === totalPages} className="h-8 w-8 sm:h-9 sm:w-9">
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" onClick={goToLastPage} disabled={currentPage === totalPages} className="h-8 w-8 sm:h-9 sm:w-9 hidden sm:flex">
                    <ChevronsRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* User Details Dialog */}
        <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
          <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto mx-auto">
            <DialogHeader>
              <DialogTitle className="text-base sm:text-lg">User Details</DialogTitle>
            </DialogHeader>
            {selectedUser && (
              <div className="space-y-6 py-4">
                <div className="flex flex-col items-center gap-4">
                  <UserAvatar user={selectedUser} size="xl" />
                  <div className="text-center">
                    <h2 className="text-xl font-bold">{selectedUser.prenom} {selectedUser.nom}</h2>
                    <p className="text-muted-foreground flex items-center justify-center gap-2 mt-1">
                      <Mail className="h-4 w-4" />
                      {selectedUser.email}
                    </p>
                    <div className="flex items-center justify-center gap-2 mt-2">
                      <Badge className={`${getRoleBadgeColor(selectedUser.role)}`}>
                        {getRoleLabel(selectedUser.role)}
                      </Badge>
                      <Badge className={selectedUser.Status ? 'bg-emerald-600' : 'bg-slate-600'}>
                        {selectedUser.Status ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2 text-center">
                      Gender: {selectedUser.sexe === 'Homme' ? 'Male' : 'Female'}
                    </p>
                  </div>
                </div>

                {selectedUser.role === 'etudiant' && (
                  <div className="space-y-4 border-t pt-4">
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                      <GraduationCap className="h-5 w-5" />
                      Student Information
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                      <div className="flex items-start gap-2">
                        <GraduationCap className="h-4 w-4 mt-0.5 text-muted-foreground" />
                        <div>
                          <p className="text-muted-foreground">Class</p>
                          <p className="font-medium">{selectedUser.classe ? getClassInfo(selectedUser.classe) : 'N/A'}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <Phone className="h-4 w-4 mt-0.5 text-muted-foreground" />
                        <div>
                          <p className="text-muted-foreground">Phone Number</p>
                          <p className="font-medium">{selectedUser.NumTel || 'N/A'}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
                        <div>
                          <p className="text-muted-foreground">Address</p>
                          <p className="font-medium">{selectedUser.Adresse || 'N/A'}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <Calendar className="h-4 w-4 mt-0.5 text-muted-foreground" />
                        <div>
                          <p className="text-muted-foreground">Date of Birth</p>
                          <p className="font-medium">{formatDate(selectedUser.datedeNaissance)}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2 col-span-full">
                        <Calendar className="h-4 w-4 mt-0.5 text-muted-foreground" />
                        <div>
                          <p className="text-muted-foreground">Enrollment Date</p>
                          <p className="font-medium">{formatDate(selectedUser.createdAt)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {selectedUser.role === 'enseignant' && (
                  <div className="space-y-4 border-t pt-4">
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                      <Briefcase className="h-5 w-5" />
                      Teacher Information
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                      <div className="flex items-start gap-2">
                        <Briefcase className="h-4 w-4 mt-0.5 text-muted-foreground" />
                        <div>
                          <p className="text-muted-foreground">Specialty</p>
                          <p className="font-medium">{selectedUser.specialite || 'N/A'}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <Phone className="h-4 w-4 mt-0.5 text-muted-foreground" />
                        <div>
                          <p className="text-muted-foreground">Phone Number</p>
                          <p className="font-medium">{selectedUser.NumTelEnseignant || 'N/A'}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2 col-span-full">
                        <Calendar className="h-4 w-4 mt-0.5 text-muted-foreground" />
                        <div>
                          <p className="text-muted-foreground">Hire Date</p>
                          <p className="font-medium">{formatDate(selectedUser.dateEmbauche)}</p>
                        </div>
                      </div>
                      {selectedUser.classes && selectedUser.classes.length > 0 && (
                        <div className="flex items-start gap-2 col-span-full">
                          <GraduationCap className="h-4 w-4 mt-0.5 text-muted-foreground" />
                          <div>
                            <p className="text-muted-foreground">Classes</p>
                            <div className="flex flex-wrap gap-2 mt-1">
                              {selectedUser.classes.map((classe, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs">
                                  {getClassInfo(classe)}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {selectedUser.role === 'admin' && (
                  <div className="space-y-4 border-t pt-4">
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                      <AlertCircle className="h-5 w-5" />
                      Admin Information
                    </h3>
                    <div className="text-sm text-muted-foreground">
                      <p>This user has administrator privileges and full system access.</p>
                      {selectedUser.adminCode && (
                        <p className="mt-2">Admin Code: <span className="font-medium text-foreground">{selectedUser.adminCode}</span></p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
            <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2">
              <Button variant="outline" onClick={() => setIsDetailsDialogOpen(false)} className="w-full sm:w-auto text-sm">
                Close
              </Button>
              <Button onClick={() => { setIsDetailsDialogOpen(false); openUpdateDialog(selectedUser); }} className="bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 hover:from-purple-500 hover:via-blue-500 hover:to-cyan-500 text-white w-full sm:w-auto text-sm">
                <Edit className="mr-2 h-4 w-4" />
                Edit User
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={(open) => { setIsDeleteDialogOpen(open); if (!open) setDeleteError(null); }}>
          <DialogContent className="max-w-[90vw] sm:max-w-md mx-auto">
            <DialogHeader>
              <DialogTitle className="text-base sm:text-lg">Delete User</DialogTitle>
              <DialogDescription className="text-xs sm:text-sm">
                Are you sure you want to delete {deletingUser?.prenom} {deletingUser?.nom}? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            {deleteError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-sm">{deleteError}</AlertDescription>
              </Alert>
            )}
            <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2">
              <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} disabled={actionLoading} className="w-full sm:w-auto text-sm" size="sm">
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDeleteUser} disabled={actionLoading} className="w-full sm:w-auto text-sm" size="sm">
                {actionLoading && <Loader2 className="mr-2 h-3 w-3 sm:h-4 sm:w-4 animate-spin" />}
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Create User Dialog */}
        <Dialog open={isCreateDialogOpen} onOpenChange={(open) => { setIsCreateDialogOpen(open); if (!open) resetCreateForm(); }}>
          <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto mx-auto">
            <DialogHeader>
              <DialogTitle className="text-base sm:text-lg">Create New User</DialogTitle>
              <DialogDescription className="text-xs sm:text-sm">
                Add a new user to the system
              </DialogDescription>
            </DialogHeader>
            {createError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-sm">{createError}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-4 py-2 sm:py-4">
              <div className="space-y-3 sm:space-y-4">
                <h3 className="text-xs sm:text-sm font-semibold text-muted-foreground">Basic Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="prenom" className="text-xs sm:text-sm">First Name *</Label>
                    <Input
                      id="prenom"
                      placeholder="John"
                      value={newUser.prenom}
                      onChange={(e) => { setNewUser({...newUser, prenom: e.target.value}); if (formErrors.prenom) setFormErrors({...formErrors, prenom: ''}); }}
                      className={`text-sm h-9 ${formErrors.prenom ? 'border-destructive' : ''}`}
                    />
                    {formErrors.prenom && <p className="text-xs text-destructive">{formErrors.prenom}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nom" className="text-xs sm:text-sm">Last Name *</Label>
                    <Input
                      id="nom"
                      placeholder="Doe"
                      value={newUser.nom}
                      onChange={(e) => { setNewUser({...newUser, nom: e.target.value}); if (formErrors.nom) setFormErrors({...formErrors, nom: ''}); }}
                      className={`text-sm h-9 ${formErrors.nom ? 'border-destructive' : ''}`}
                    />
                    {formErrors.nom && <p className="text-xs text-destructive">{formErrors.nom}</p>}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-xs sm:text-sm">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="john.doe@example.com"
                    value={newUser.email}
                    onChange={(e) => { setNewUser({...newUser, email: e.target.value}); if (formErrors.email) setFormErrors({...formErrors, email: ''}); }}
                    className={`text-sm h-9 ${formErrors.email ? 'border-destructive' : ''}`}
                  />
                  {formErrors.email && <p className="text-xs text-destructive">{formErrors.email}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-xs sm:text-sm">Password *</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={newUser.password}
                      onChange={(e) => { setNewUser({...newUser, password: e.target.value}); if (formErrors.password) setFormErrors({...formErrors, password: ''}); }}
                      className={`pr-10 text-sm h-9 ${formErrors.password ? 'border-destructive' : ''}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {formErrors.password && <p className="text-xs text-destructive">{formErrors.password}</p>}
                  <p className="text-xs text-muted-foreground">Must contain 8+ characters, uppercase, lowercase & number</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role" className="text-xs sm:text-sm">Role *</Label>
                  <Select value={newUser.role} onValueChange={(value) => handleRoleChange(value, false)}>
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="etudiant">Student</SelectItem>
                      <SelectItem value="enseignant">Teacher</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                  {formErrors.role && <p className="text-xs text-destructive">{formErrors.role}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sexe" className="text-xs sm:text-sm">Gender *</Label>
                  <Select value={newUser.sexe} onValueChange={(value) => { setNewUser({...newUser, sexe: value}); if (formErrors.sexe) setFormErrors({...formErrors, sexe: ''}); }}>
                    <SelectTrigger className={`h-9 text-sm ${formErrors.sexe ? 'border-destructive' : ''}`}>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Homme">Male</SelectItem>
                      <SelectItem value="Femme">Female</SelectItem>
                    </SelectContent>
                  </Select>
                  {formErrors.sexe && <p className="text-xs text-destructive">{formErrors.sexe}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="image_User" className="text-xs sm:text-sm">Profile Image</Label>
                  <Input
                    id="image_User"
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageChange(e, false)}
                    className="text-sm h-9 file:text-sm"
                  />
                </div>
              </div>

              {newUser.role === 'etudiant' && (
                <div className="space-y-3 sm:space-y-4 pt-3 sm:pt-4 border-t">
                  <h3 className="text-xs sm:text-sm font-semibold text-muted-foreground">Student Information</h3>
                  <div className="space-y-2">
                    <Label htmlFor="classe" className="text-xs sm:text-sm">Class *</Label>
                    <Select value={newUser.classe} onValueChange={(value) => { setNewUser({...newUser, classe: value}); if (formErrors.classe) setFormErrors({...formErrors, classe: ''}); }}>
                      <SelectTrigger className={`h-9 text-sm ${formErrors.classe ? 'border-destructive' : ''}`}>
                        <SelectValue placeholder="Select a class" />
                      </SelectTrigger>
                      <SelectContent>
                        {(Array.isArray(allClasses) ? allClasses : []).map((classe) => (
                          <SelectItem key={classe._id} value={classe._id} className="text-sm">
                            {classe.nom} - {classe.annee} {classe.specialisation}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {formErrors.classe && <p className="text-xs text-destructive">{formErrors.classe}</p>}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="NumTel" className="text-xs sm:text-sm">Phone Number</Label>
                      <Input
                        id="NumTel"
                        placeholder="+216 XX XXX XXX"
                        value={newUser.NumTel}
                        onChange={(e) => setNewUser({...newUser, NumTel: e.target.value})}
                        className="text-sm h-9"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="datedeNaissance" className="text-xs sm:text-sm">Date of Birth</Label>
                      <DatePicker
                        date={newUser.datedeNaissance ? new Date(newUser.datedeNaissance) : null}
                        setDate={(date) => setNewUser({...newUser, datedeNaissance: date ? date.toISOString().split('T')[0] : ''})}
                        placeholder="Select date of birth"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="Adresse" className="text-xs sm:text-sm">Address</Label>
                    <Input
                      id="Adresse"
                      placeholder="123 Main St, City"
                      value={newUser.Adresse}
                      onChange={(e) => setNewUser({...newUser, Adresse: e.target.value})}
                      className="text-sm h-9"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dateInscription" className="text-xs sm:text-sm">Enrollment Date</Label>
                    <DatePicker
                      date={newUser.dateInscription ? new Date(newUser.dateInscription) : null}
                      setDate={(date) => setNewUser({...newUser, dateInscription: date ? date.toISOString().split('T')[0] : ''})}
                      placeholder="Select enrollment date"
                    />
                  </div>
                </div>
              )}

              {newUser.role === 'enseignant' && (
                <div className="space-y-3 sm:space-y-4 pt-3 sm:pt-4 border-t">
                  <h3 className="text-xs sm:text-sm font-semibold text-muted-foreground">Teacher Information</h3>
                  <div className="space-y-2">
                    <Label htmlFor="specialite" className="text-xs sm:text-sm">Specialty *</Label>
                    <Input
                      id="specialite"
                      placeholder="Mathematics, Physics, etc."
                      value={newUser.specialite}
                      onChange={(e) => { setNewUser({...newUser, specialite: e.target.value}); if (formErrors.specialite) setFormErrors({...formErrors, specialite: ''}); }}
                      className={`text-sm h-9 ${formErrors.specialite ? 'border-destructive' : ''}`}
                    />
                    {formErrors.specialite && <p className="text-xs text-destructive">{formErrors.specialite}</p>}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="NumTelEnseignant" className="text-xs sm:text-sm">Phone Number</Label>
                      <Input
                        id="NumTelEnseignant"
                        placeholder="+216 XX XXX XXX"
                        value={newUser.NumTelEnseignant}
                        onChange={(e) => setNewUser({...newUser, NumTelEnseignant: e.target.value})}
                        className="text-sm h-9"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dateEmbauche" className="text-xs sm:text-sm">Hire Date</Label>
                      <DatePicker
                        date={newUser.dateEmbauche ? new Date(newUser.dateEmbauche) : null}
                        setDate={(date) => setNewUser({...newUser, dateEmbauche: date ? date.toISOString().split('T')[0] : ''})}
                        placeholder="Select hire date"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs sm:text-sm">Classes (Optional)</Label>
                    <div className="border rounded-md p-3 max-h-40 overflow-y-auto space-y-2">
                      {(Array.isArray(allClasses) ? allClasses : []).length === 0 ? (
                        <p className="text-xs sm:text-sm text-muted-foreground">No classes available</p>
                      ) : (
                        (Array.isArray(allClasses) ? allClasses : []).map((classe) => (
                          <div key={classe._id} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id={`class-${classe._id}`}
                              checked={(newUser.classes || []).includes(classe._id)}
                              onChange={() => handleClassesChange(classe._id, false)}
                              className="rounded"
                            />
                            <label htmlFor={`class-${classe._id}`} className="text-xs sm:text-sm cursor-pointer">
                              {classe.nom} - {classe.annee} {classe.specialisation}
                            </label>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}

              {newUser.role === 'admin' && (
                <div className="space-y-3 sm:space-y-4 pt-3 sm:pt-4 border-t">
                  <h3 className="text-xs sm:text-sm font-semibold text-muted-foreground">Admin Information</h3>
                  <div className="space-y-2">
                    <Label htmlFor="adminCode" className="text-xs sm:text-sm">Admin Code (Optional)</Label>
                    <Input
                      id="adminCode"
                      placeholder="Enter admin access code"
                      value={newUser.adminCode}
                      onChange={(e) => setNewUser({...newUser, adminCode: e.target.value})}
                      className="text-sm h-9"
                    />
                  </div>
                </div>
              )}
            </div>
            <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2">
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)} disabled={actionLoading} className="w-full sm:w-auto text-sm" size="sm">
                Cancel
              </Button>
              <Button onClick={handleCreateUser} disabled={actionLoading} className="bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 hover:from-purple-500 hover:via-blue-500 hover:to-cyan-500 text-white w-full sm:w-auto text-sm" size="sm">
                {actionLoading && <Loader2 className="mr-2 h-3 w-3 sm:h-4 sm:w-4 animate-spin" />}
                Create User
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Update User Dialog */}
        <Dialog open={isUpdateDialogOpen} onOpenChange={(open) => { setIsUpdateDialogOpen(open); if (!open) { setUpdatingUser(null); setUpdateError(null); } }}>
          <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto mx-auto">
            <DialogHeader>
              <DialogTitle className="text-base sm:text-lg">Update User</DialogTitle>
              <DialogDescription className="text-xs sm:text-sm">
                Modify user information
              </DialogDescription>
            </DialogHeader>
            {updateError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-sm">{updateError}</AlertDescription>
              </Alert>
            )}
            {updatingUser && (
              <div className="space-y-4 py-2 sm:py-4">
                <div className="space-y-3 sm:space-y-4">
                  <h3 className="text-xs sm:text-sm font-semibold text-muted-foreground">Basic Information</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="update-prenom" className="text-xs sm:text-sm">First Name *</Label>
                      <Input
                        id="update-prenom"
                        placeholder="John"
                        value={updatingUser.prenom}
                        onChange={(e) => { setUpdatingUser({...updatingUser, prenom: e.target.value}); if (formErrors.prenom) setFormErrors({...formErrors, prenom: ''}); }}
                        className={`text-sm h-9 ${formErrors.prenom ? 'border-destructive' : ''}`}
                      />
                      {formErrors.prenom && <p className="text-xs text-destructive">{formErrors.prenom}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="update-nom" className="text-xs sm:text-sm">Last Name *</Label>
                      <Input
                        id="update-nom"
                        placeholder="Doe"
                        value={updatingUser.nom}
                        onChange={(e) => { setUpdatingUser({...updatingUser, nom: e.target.value}); if (formErrors.nom) setFormErrors({...formErrors, nom: ''}); }}
                        className={`text-sm h-9 ${formErrors.nom ? 'border-destructive' : ''}`}
                      />
                      {formErrors.nom && <p className="text-xs text-destructive">{formErrors.nom}</p>}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="update-email" className="text-xs sm:text-sm">Email *</Label>
                    <Input
                      id="update-email"
                      type="email"
                      placeholder="john.doe@example.com"
                      value={updatingUser.email}
                      onChange={(e) => { setUpdatingUser({...updatingUser, email: e.target.value}); if (formErrors.email) setFormErrors({...formErrors, email: ''}); }}
                      className={`text-sm h-9 ${formErrors.email ? 'border-destructive' : ''}`}
                    />
                    {formErrors.email && <p className="text-xs text-destructive">{formErrors.email}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="update-password" className="text-xs sm:text-sm">Password (leave empty to keep current)</Label>
                    <div className="relative">
                      <Input
                        id="update-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={updatingUser.password}
                        onChange={(e) => { setUpdatingUser({...updatingUser, password: e.target.value}); if (formErrors.password) setFormErrors({...formErrors, password: ''}); }}
                        className={`pr-10 text-sm h-9 ${formErrors.password ? 'border-destructive' : ''}`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {formErrors.password && <p className="text-xs text-destructive">{formErrors.password}</p>}
                    <p className="text-xs text-muted-foreground">Must contain 8+ characters, uppercase, lowercase & number</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="update-role" className="text-xs sm:text-sm">Role *</Label>
                    <Select value={updatingUser.role} onValueChange={(value) => handleRoleChange(value, true)}>
                      <SelectTrigger className="h-9 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="etudiant">Student</SelectItem>
                        <SelectItem value="enseignant">Teacher</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                    {formErrors.role && <p className="text-xs text-destructive">{formErrors.role}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="update-sexe" className="text-xs sm:text-sm">Gender *</Label>
                    <Select value={updatingUser.sexe} onValueChange={(value) => { setUpdatingUser({...updatingUser, sexe: value}); if (formErrors.sexe) setFormErrors({...formErrors, sexe: ''}); }}>
                      <SelectTrigger className={`h-9 text-sm ${formErrors.sexe ? 'border-destructive' : ''}`}>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Homme">Male</SelectItem>
                        <SelectItem value="Femme">Female</SelectItem>
                      </SelectContent>
                    </Select>
                    {formErrors.sexe && <p className="text-xs text-destructive">{formErrors.sexe}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="update-image_User" className="text-xs sm:text-sm">Profile Image</Label>
                    <Input
                      id="update-image_User"
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageChange(e, true)}
                      className="text-sm h-9 file:text-sm"
                    />
                  </div>
                </div>

                {updatingUser.role === 'etudiant' && (
                  <div className="space-y-3 sm:space-y-4 pt-3 sm:pt-4 border-t">
                    <h3 className="text-xs sm:text-sm font-semibold text-muted-foreground">Student Information</h3>
                    <div className="space-y-2">
                      <Label htmlFor="update-classe" className="text-xs sm:text-sm">Class *</Label>
                      <Select value={updatingUser.classe} onValueChange={(value) => { setUpdatingUser({...updatingUser, classe: value}); if (formErrors.classe) setFormErrors({...formErrors, classe: ''}); }}>
                        <SelectTrigger className={`h-9 text-sm ${formErrors.classe ? 'border-destructive' : ''}`}>
                          <SelectValue placeholder="Select a class" />
                        </SelectTrigger>
                        <SelectContent>
                          {(Array.isArray(allClasses) ? allClasses : []).map((classe) => (
                            <SelectItem key={classe._id} value={classe._id} className="text-sm">
                              {classe.nom} - {classe.annee} {classe.specialisation}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {formErrors.classe && <p className="text-xs text-destructive">{formErrors.classe}</p>}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="update-NumTel" className="text-xs sm:text-sm">Phone Number</Label>
                        <Input
                          id="update-NumTel"
                          placeholder="+216 XX XXX XXX"
                          value={updatingUser.NumTel || ''}
                          onChange={(e) => setUpdatingUser({...updatingUser, NumTel: e.target.value})}
                          className="text-sm h-9"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="update-datedeNaissance" className="text-xs sm:text-sm">Date of Birth</Label>
                        <DatePicker
                          date={updatingUser.datedeNaissance ? new Date(updatingUser.datedeNaissance) : null}
                          setDate={(date) => setUpdatingUser({...updatingUser, datedeNaissance: date ? date.toISOString().split('T')[0] : ''})}
                          placeholder="Select date of birth"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="update-Adresse" className="text-xs sm:text-sm">Address</Label>
                      <Input
                        id="update-Adresse"
                        placeholder="123 Main St, City"
                        value={updatingUser.Adresse || ''}
                        onChange={(e) => setUpdatingUser({...updatingUser, Adresse: e.target.value})}
                        className="text-sm h-9"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="update-dateInscription" className="text-xs sm:text-sm">Enrollment Date</Label>
                      <DatePicker
                        date={updatingUser.dateInscription ? new Date(updatingUser.dateInscription) : null}
                        setDate={(date) => setUpdatingUser({...updatingUser, dateInscription: date ? date.toISOString().split('T')[0] : ''})}
                        placeholder="Select enrollment date"
                      />
                    </div>
                  </div>
                )}

                {updatingUser.role === 'enseignant' && (
                  <div className="space-y-3 sm:space-y-4 pt-3 sm:pt-4 border-t">
                    <h3 className="text-xs sm:text-sm font-semibold text-muted-foreground">Teacher Information</h3>
                    <div className="space-y-2">
                      <Label htmlFor="update-specialite" className="text-xs sm:text-sm">Specialty *</Label>
                      <Input
                        id="update-specialite"
                        placeholder="Mathematics, Physics, etc."
                        value={updatingUser.specialite || ''}
                        onChange={(e) => { setUpdatingUser({...updatingUser, specialite: e.target.value}); if (formErrors.specialite) setFormErrors({...formErrors, specialite: ''}); }}
                        className={`text-sm h-9 ${formErrors.specialite ? 'border-destructive' : ''}`}
                      />
                      {formErrors.specialite && <p className="text-xs text-destructive">{formErrors.specialite}</p>}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="update-NumTelEnseignant" className="text-xs sm:text-sm">Phone Number</Label>
                        <Input
                          id="update-NumTelEnseignant"
                          placeholder="+216 XX XXX XXX"
                          value={updatingUser.NumTelEnseignant || ''}
                          onChange={(e) => setUpdatingUser({...updatingUser, NumTelEnseignant: e.target.value})}
                          className="text-sm h-9"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="update-dateEmbauche" className="text-xs sm:text-sm">Hire Date</Label>
                        <DatePicker
                          date={updatingUser.dateEmbauche ? new Date(updatingUser.dateEmbauche) : null}
                          setDate={(date) => setUpdatingUser({...updatingUser, dateEmbauche: date ? date.toISOString().split('T')[0] : ''})}
                          placeholder="Select hire date"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs sm:text-sm">Classes (Optional)</Label>
                      <div className="border rounded-md p-3 max-h-40 overflow-y-auto space-y-2">
                        {(Array.isArray(allClasses) ? allClasses : []).length === 0 ? (
                          <p className="text-xs sm:text-sm text-muted-foreground">No classes available</p>
                        ) : (
                          (Array.isArray(allClasses) ? allClasses : []).map((classe) => (
                            <div key={classe._id} className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                id={`update-class-${classe._id}`}
                                checked={(updatingUser.classes || []).includes(classe._id)}
                                onChange={() => handleClassesChange(classe._id, true)}
                                className="rounded"
                              />
                              <label htmlFor={`update-class-${classe._id}`} className="text-xs sm:text-sm cursor-pointer">
                                {classe.nom} - {classe.annee} {classe.specialisation}
                              </label>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {updatingUser.role === 'admin' && (
                  <div className="space-y-3 sm:space-y-4 pt-3 sm:pt-4 border-t">
                    <h3 className="text-xs sm:text-sm font-semibold text-muted-foreground">Admin Information</h3>
                    <div className="space-y-2">
                      <Label htmlFor="update-adminCode" className="text-xs sm:text-sm">Admin Code (Optional)</Label>
                      <Input
                        id="update-adminCode"
                        placeholder="Enter admin access code"
                        value={updatingUser.adminCode || ''}
                        onChange={(e) => setUpdatingUser({...updatingUser, adminCode: e.target.value})}
                        className="text-sm h-9"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
            <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2">
              <Button variant="outline" onClick={() => setIsUpdateDialogOpen(false)} disabled={actionLoading} className="w-full sm:w-auto text-sm" size="sm">
                Cancel
              </Button>
              <Button onClick={handleUpdateUser} disabled={actionLoading} className="bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 hover:from-purple-500 hover:via-blue-500 hover:to-cyan-500 text-white w-full sm:w-auto text-sm" size="sm">
                {actionLoading && <Loader2 className="mr-2 h-3 w-3 sm:h-4 sm:w-4 animate-spin" />}
                Update User
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
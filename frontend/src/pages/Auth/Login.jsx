import { useState, useContext } from "react";
import { getDashboardStats } from "@/services/dashboardService";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  GraduationCap,
  Lock,
  Mail,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Eye,
  EyeOff,
} from "lucide-react";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
const API_URL = `${API_BASE_URL}/users`;

export default function Login() {
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState("");
  const [focusedField, setFocusedField] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  const validateForm = () => {
    const newErrors = {};
    if (!email.trim()) newErrors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      newErrors.email = "Invalid email address";

    if (!password) newErrors.password = "Password is required";
    else if (password.length < 6)
      newErrors.password = "Password must be at least 6 characters";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!validateForm()) return;
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Login failed");

      setSuccess("Login successful! Redirecting...");
      if (data.user) login(data.user);
      if (data.token) localStorage.setItem("token", data.token);

      setTimeout(async () => {
        const role = data.user?.role;
        switch (role) {
          case "admin": {
            try {
              const dashboardData = await getDashboardStats();
              navigate("/admin/", { replace: true, state: { dashboardData } });
            } catch {
              navigate("/admin/", { replace: true });
            }
            break;
          }
          case "enseignant":
            navigate("/teacher/", { replace: true });
            break;
          case "etudiant":
            navigate("/student/", { replace: true });
            break;
          default:
            navigate("/login", { replace: true });
        }
      }, 1000);
    } catch (err) {
      console.error("Login error:", err);
      if (
        err.message.includes("Invalid") ||
        err.message.includes("incorrect")
      ) {
        setError("Invalid email or password");
      } else if (err.message.includes("fetch")) {
        setError("Unable to connect to server.");
      } else {
        setError(err.message || "An error occurred during login");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-br from-purple-600/30 via-blue-600/30 to-cyan-600/30 rounded-full blur-3xl animate-pulse opacity-40"></div>
        <div
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-tr from-pink-600/30 via-purple-600/30 to-blue-600/30 rounded-full blur-3xl animate-pulse opacity-40"
          style={{ animationDelay: "1s" }}
        ></div>
        <div
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-cyan-600/20 to-blue-600/20 rounded-full blur-3xl animate-pulse opacity-30"
          style={{ animationDelay: "2s" }}
        ></div>
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.02)_1px,transparent_1px)] bg-[size:100px_100px]"></div>
      </div>

      <Card className="w-full max-w-md border border-slate-800/50 backdrop-blur-xl bg-slate-900/60 shadow-2xl shadow-purple-900/20 relative z-10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 via-transparent to-cyan-600/10 pointer-events-none"></div>

        <CardHeader className="space-y-4 text-center pb-8 relative">
          <div className="flex justify-center mb-2">
            <div className="relative group cursor-pointer">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500 via-blue-500 to-cyan-500 rounded-3xl blur-xl opacity-75 group-hover:opacity-100 transition-opacity duration-500 animate-pulse"></div>
              <div
                className="absolute inset-0 bg-gradient-to-br from-purple-500 via-blue-500 to-cyan-500 rounded-3xl blur-2xl opacity-50 animate-pulse"
                style={{ animationDelay: "1s" }}
              ></div>

              <div className="relative h-24 w-24 rounded-3xl bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-600 flex items-center justify-center shadow-2xl transform group-hover:scale-110 transition-all duration-500 border border-white/20">
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-3xl"></div>
                <GraduationCap className="h-12 w-12 text-white relative z-10 drop-shadow-lg" />
                <Sparkles className="absolute top-2 right-2 h-4 w-4 text-cyan-300 animate-pulse opacity-0 group-hover:opacity-100 transition-opacity" />
                <Sparkles
                  className="absolute bottom-2 left-2 h-3 w-3 text-purple-300 animate-pulse opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ animationDelay: "0.5s" }}
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <CardTitle className="text-4xl font-bold bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent drop-shadow-lg">
              Welcome Back
            </CardTitle>
            <CardDescription className="text-slate-400 text-base">
              Enter your credentials to access your portal
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6 relative">
          {error && (
            <Alert className="bg-red-950/50 text-red-300 border-red-800/50 backdrop-blur-sm">
              <AlertCircle className="h-4 w-4 text-red-400" />
              <AlertDescription className="text-red-200">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="bg-emerald-950/50 text-emerald-300 border-emerald-800/50 backdrop-blur-sm">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <AlertDescription className="font-medium text-emerald-200">
                {success}
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-5">
            {/* EMAIL */}
            <div className="space-y-2">
              <Label
                htmlFor="email"
                className="text-sm font-semibold text-white/30 bg-transparent"
              >
                Email Address
              </Label>

              <div className="relative group">
                <Mail
                  className={`absolute left-3 top-3.5 h-5 w-5 transition-all duration-300 ${
                    focusedField === "email"
                      ? "text-blue-400 scale-110"
                      : "text-white/70 group-hover:text-white/90"
                  }`}
                />

                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email) setErrors({ ...errors, email: "" });
                  }}
                  onFocus={() => setFocusedField("email")}
                  onBlur={() => setFocusedField(null)}
                  onKeyDown={(e) => e.key === "Enter" && handleSubmit(e)}
                  className="pl-10 h-12 text-base bg-slate-800/50 border-slate-700/50 text-slate-100"
                  disabled={loading}
                />
              </div>

              {errors.email && (
                <p className="text-sm text-red-400 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" /> {errors.email}
                </p>
              )}
            </div>

            {/* PASSWORD */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label
                  htmlFor="password"
                  className="text-sm font-semibold text-white/90"
                >
                  Password
                </Label>

                <button
                  type="button"
                  className="text-sm font-medium text-blue-400 hover:text-blue-300 hover:underline"
                  onClick={() => navigate("/Forget")}
                >
                  Forget password?
                </button>
              </div>

              <div className="relative group">
                <Lock
                  className={`absolute left-3 top-3.5 h-5 w-5 transition-all duration-300 ${
                    focusedField === "password"
                      ? "text-purple-400 scale-110"
                      : "text-purple/70 group-hover:text-purple/90"
                  }`}
                />

                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errors.password) setErrors({ ...errors, password: "" });
                  }}
                  onFocus={() => setFocusedField("password")}
                  onBlur={() => setFocusedField(null)}
                  onKeyDown={(e) => e.key === "Enter" && handleSubmit(e)}
                  className="pl-10 pr-10 h-12 text-base bg-slate-800/50 border-slate-700/50 text-slate-100"
                  disabled={loading}
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-200"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>

              {errors.password && (
                <p className="text-sm text-red-400 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" /> {errors.password}
                </p>
              )}
            </div>

            {/* BUTTON */}
            <div className="relative group">
              <Button
                onClick={handleSubmit}
                className="relative w-full h-13 text-base font-semibold bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 text-white"
                disabled={loading}
              >
                {loading ? "Signing in..." : "Sign In"}
              </Button>
            </div>
          </div>

          {/* Divider */}
          <div className="relative py-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-800"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-slate-900/60 px-3 text-slate-500 font-semibold tracking-wider">
                EduNex Portal
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

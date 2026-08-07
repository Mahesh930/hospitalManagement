"use client";

/**
 * Enterprise Login Page Component for MediCore ERP.
 * 
 * Security Architecture & Environment Scoping:
 * 1. Environment Flag Control: Quick-fill demo credentials helper is ONLY rendered when 
 *    `process.env.NEXT_PUBLIC_SHOW_DEMO_LOGIN === "true"`.
 * 2. Production Hardening: In Production (`NEXT_PUBLIC_SHOW_DEMO_LOGIN=false` or omitted), all demo UI blocks 
 *    and credential hints are completely omitted from the client bundle.
 * 3. JWT Authentication: Sends credentials to backend `/auth/login` REST endpoint, receives JWT bearer token, 
 *    and stores session in global Zustand store (`useAuthStore`).
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authApi } from "@medicore/api";
import { useAuthStore } from "@/store/auth-store";
import { toast } from "sonner";
import { Activity, Eye, EyeOff, Lock, User, ShieldCheck } from "lucide-react";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);

  // Security Gate: Demo quick-fill UI is strictly scoped to development/staging environments via environment flag
  const showDemoLogin = process.env.NEXT_PUBLIC_SHOW_DEMO_LOGIN === "true";

  /**
   * Handles submission of login credentials to backend Spring Boot server.
   */
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      toast.error("Please enter username and password");
      return;
    }
    setLoading(true);
    try {
      // Send login payload to backend authentication service
      const res = await authApi.login({ username, password });
      if (res.data && res.data.jwt) {
        const userRoles = res.data.roles && res.data.roles.length > 0 ? res.data.roles : ["ADMIN"];
        const userDisplayName = res.data.username || username;

        // Store JWT token & user principal details in Zustand auth store
        setAuth(res.data.jwt, res.data.userId, userDisplayName, userRoles);
        toast.success(`Welcome back, ${userDisplayName}!`);
        
        // Redirect to main ERP dashboard
        router.push("/dashboard");
      } else {
        toast.error("Invalid response from authentication server");
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: { message?: string }; message?: string } } };
      const msg =
        error?.response?.data?.error?.message ||
        error?.response?.data?.message ||
        "Login failed. Check server connection or credentials.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Development Quick-Fill Helper (Scoped exclusively to DEV mode).
   */
  const fillCredentials = (devUser: string, devPass: string) => {
    setUsername(devUser);
    setPassword(devPass);
    toast.info(`Filled dev credentials for '${devUser}'`);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 font-sans text-foreground antialiased">
      <div className="w-full max-w-md">
        <div className="bg-card border border-border rounded-2xl shadow-lg p-8">
          {/* Logo & Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-primary shadow-md mb-3">
              <Activity className="w-7 h-7 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">MediCore ERP</h1>
            <p className="text-sm text-muted-foreground mt-1">Enterprise Hospital Management System</p>
          </div>

          {/* Development Quick-Fill Block (Only rendered when NEXT_PUBLIC_SHOW_DEMO_LOGIN=true) */}
          {showDemoLogin && (
            <div className="mb-6 p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs space-y-2">
              <div className="flex items-center gap-1.5 font-semibold text-amber-600 dark:text-amber-400">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span>Development Quick-Fill Helpers:</span>
              </div>
              <div className="flex items-center justify-between bg-card/80 p-2 rounded-lg border border-border">
                <span className="font-medium text-foreground">Super Admin:</span>
                <button
                  type="button"
                  onClick={() => fillCredentials("superadmin@email.com", "Password@123")}
                  className="text-primary hover:bg-primary/10 px-2 py-1 rounded font-mono font-bold transition-colors text-[11px]"
                >
                  Quick Fill Super Admin
                </button>
              </div>
              <div className="flex items-center justify-between bg-card/80 p-2 rounded-lg border border-border">
                <span className="font-medium text-foreground">Hospital Admin:</span>
                <button
                  type="button"
                  onClick={() => fillCredentials("admin", "admin123")}
                  className="text-primary hover:bg-primary/10 px-2 py-1 rounded font-mono font-bold transition-colors text-[11px]"
                >
                  Quick Fill Hospital Admin
                </button>
              </div>
              <div className="flex items-center justify-between bg-card/80 p-2 rounded-lg border border-border">
                <span className="font-medium text-foreground">Receptionist:</span>
                <button
                  type="button"
                  onClick={() => fillCredentials("receptionist", "receptionist123")}
                  className="text-primary hover:bg-primary/10 px-2 py-1 rounded font-mono font-bold transition-colors text-[11px]"
                >
                  Quick Fill Receptionist
                </button>
              </div>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">
                Username / Email
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-background border border-input rounded-xl text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring text-sm transition-all"
                  placeholder="Enter username or email"
                  autoComplete="username"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-2.5 bg-background border border-input rounded-xl text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring text-sm transition-all"
                  placeholder="Enter password"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2.5 px-4 bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-sm rounded-xl shadow-sm transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99]"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  Authenticating...
                </span>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          {/* Footer */}
          <p className="text-center text-xs text-muted-foreground mt-6">
            © 2026 MediCore ERP · Healthcare Platform
          </p>
        </div>
      </div>
    </div>
  );
}

"use client";

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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      toast.error("Please enter username and password");
      return;
    }
    setLoading(true);
    try {
      const res = await authApi.login({ username, password });
      if (res.data && res.data.jwt) {
        const userRoles = res.data.roles && res.data.roles.length > 0 ? res.data.roles : ["ADMIN"];
        const userDisplayName = res.data.username || username;
        setAuth(res.data.jwt, res.data.userId, userDisplayName, userRoles);
        toast.success(`Welcome back, ${userDisplayName}!`);
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

          {/* Demo Credentials Hint */}
          <div className="mb-6 p-3 bg-muted border border-border rounded-xl text-xs space-y-1.5">
            <div className="flex items-center gap-1.5 font-semibold text-primary">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>Demo Login Accounts:</span>
            </div>
            <div className="text-foreground">
              Super Admin: <code className="text-primary bg-card px-1.5 py-0.5 rounded border border-border font-mono">superadmin</code> / <code className="text-primary bg-card px-1.5 py-0.5 rounded border border-border font-mono">superadmin123</code>
            </div>
            <div className="text-foreground">
              Admin: <code className="text-primary bg-card px-1.5 py-0.5 rounded border border-border font-mono">admin</code> / <code className="text-primary bg-card px-1.5 py-0.5 rounded border border-border font-mono">admin123</code>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">
                Username
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-background border border-input rounded-xl text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring text-sm transition-all"
                  placeholder="Enter username"
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

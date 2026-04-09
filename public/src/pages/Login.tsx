import * as React from "react";

import Button from "@/components/Button";
import { Card, CardContent, CardHeader } from "@/components/Card";
import Input from "@/components/Input";
import { getAccessToken } from "@/services/apiClient";
import { useAuthStore } from "@/stores/authStore";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  const token = getAccessToken();
  const login = useAuthStore((s) => s.login);
  const isLoading = useAuthStore((s) => s.isLoading);
  const error = useAuthStore((s) => s.error);

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [localError, setLocalError] = React.useState("");

  if (token) {
    return <Navigate to="/" replace />;
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError("");

    const nextEmail = email.trim();
    if (!nextEmail) {
      setLocalError("Email is required");
      return;
    }
    if (!password) {
      setLocalError("Password is required");
      return;
    }

    await login({ email: nextEmail, password });
    const nextToken = getAccessToken();
    if (nextToken) {
      const from = (location.state as any)?.from || "/";
      navigate(from, { replace: true });
    }
  };

  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <div className="text-lg font-semibold text-trackify-text">Log in</div>
        <div className="mt-2 text-sm text-trackify-muted">Access your dashboard and work history</div>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <div className="mb-2 text-xs text-trackify-muted">Email</div>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
          </div>
          <div>
            <div className="mb-2 text-xs text-trackify-muted">Password</div>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          {localError ? (
            <div className="rounded-control border border-trackify-border bg-trackify-bg px-4 py-3 text-sm text-trackify-muted">
              {localError}
            </div>
          ) : null}

          {error ? (
            <div className="rounded-control border border-trackify-border bg-trackify-bg px-4 py-3 text-sm text-trackify-muted">
              {error}
            </div>
          ) : null}

          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? "Logging in…" : "Log in"}
          </Button>

          <div className="flex items-center justify-between text-sm">
            <Link to="/register" className="text-trackify-muted hover:underline">
              Create account
            </Link>
            <Link to="/forgot-password" className="text-trackify-muted hover:underline">
              Forgot password
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}


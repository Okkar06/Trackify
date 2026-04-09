import * as React from "react";

import Button from "@/components/Button";
import { Card, CardContent, CardHeader } from "@/components/Card";
import Input from "@/components/Input";
import { getAccessToken } from "@/services/apiClient";
import { register as registerRequest } from "@/services/authService";
import { Link, Navigate, useNavigate } from "react-router-dom";

export default function Register() {
  const navigate = useNavigate();
  const token = getAccessToken();

  const [fullName, setFullName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");

  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [success, setSuccess] = React.useState("");

  if (token) {
    return <Navigate to="/" replace />;
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!fullName.trim()) {
      setError("Full name is required");
      return;
    }
    if (!email.trim()) {
      setError("Email is required");
      return;
    }
    if (!password) {
      setError("Password is required");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsLoading(true);
    try {
      await registerRequest({ email: email.trim(), password, fullName: fullName.trim() });
      setSuccess("Account created. You can now log in.");
      window.setTimeout(() => navigate("/login", { replace: true }), 800);
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || err?.message || "Registration failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <div className="text-lg font-semibold text-trackify-text">Create account</div>
        <div className="mt-2 text-sm text-trackify-muted">Set up Trackify in under a minute</div>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <div className="mb-2 text-xs text-trackify-muted">Full name</div>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Jane Doe" />
          </div>
          <div>
            <div className="mb-2 text-xs text-trackify-muted">Email</div>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="mb-2 text-xs text-trackify-muted">Password</div>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            <div>
              <div className="mb-2 text-xs text-trackify-muted">Confirm</div>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
          </div>

          {success ? (
            <div className="rounded-control border border-trackify-border bg-trackify-bg px-4 py-3 text-sm text-trackify-muted">
              {success}
            </div>
          ) : null}

          {error ? (
            <div className="rounded-control border border-trackify-border bg-trackify-bg px-4 py-3 text-sm text-trackify-muted">
              {error}
            </div>
          ) : null}

          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? "Creating…" : "Create account"}
          </Button>

          <div className="text-sm text-trackify-muted">
            Already have an account?{" "}
            <Link to="/login" className="hover:underline">
              Log in
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}


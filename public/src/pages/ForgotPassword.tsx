import * as React from "react";

import Button from "@/components/Button";
import { Card, CardContent, CardHeader } from "@/components/Card";
import Input from "@/components/Input";
import { getAccessToken } from "@/services/apiClient";
import { resetPassword } from "@/services/authService";
import { Link, Navigate } from "react-router-dom";

export default function ForgotPassword() {
  const token = getAccessToken();
  const [email, setEmail] = React.useState("");
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

    if (!email.trim()) {
      setError("Email is required");
      return;
    }

    setIsLoading(true);
    try {
      await resetPassword({ email: email.trim() });
      setSuccess("If an account exists for this email, a reset link has been sent.");
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || err?.message || "Failed to request reset");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <div className="text-xl font-semibold tracking-tight text-trackify-text">Reset password</div>
        <div className="mt-2 text-sm text-trackify-muted">We’ll email you a reset link</div>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <div className="mb-2 text-xs font-medium uppercase tracking-wide text-trackify-muted">Email</div>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
          </div>

          {success ? (
            <div className="rounded-control border border-white/15 bg-trackify-surface2 px-4 py-3 text-sm text-trackify-text">
              {success}
            </div>
          ) : null}

          {error ? (
            <div className="rounded-control border border-white/15 bg-trackify-surface2 px-4 py-3 text-sm text-trackify-text">
              {error}
            </div>
          ) : null}

          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? "Sending…" : "Send reset link"}
          </Button>

          <div className="text-sm text-trackify-muted">
            <Link to="/login" className="hover:underline">
              Back to login
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

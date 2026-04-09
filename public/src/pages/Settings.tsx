import * as React from "react";

import Button from "@/components/Button";
import { Card, CardContent, CardHeader } from "@/components/Card";
import Input from "@/components/Input";
import { fetchUserProfile, updateUserProfile } from "@/services/userService";

type Profile = {
  userId: string;
  fullName: string;
  email: string;
  profileImageUrl: string;
};

type FormState = {
  fullName: string;
  profileImageUrl: string;
};

const getDefaults = (): FormState => ({
  fullName: "",
  profileImageUrl: "",
});

export default function Settings() {
  const [profile, setProfile] = React.useState<Profile | null>(null);
  const [form, setForm] = React.useState<FormState>(getDefaults);

  const [isLoading, setIsLoading] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [error, setError] = React.useState<string>("");
  const [success, setSuccess] = React.useState<string>("");

  const load = React.useCallback(() => {
    const controller = new AbortController();
    setIsLoading(true);
    setError("");

    fetchUserProfile({ signal: controller.signal })
      .then((res) => {
        const nextProfile = res?.profile as Profile | null;
        setProfile(nextProfile);
        setForm({
          fullName: nextProfile?.fullName || "",
          profileImageUrl: nextProfile?.profileImageUrl || "",
        });
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        setError(err?.response?.data?.error?.message || err?.message || "Failed to load profile");
        setProfile(null);
      })
      .finally(() => {
        if (controller.signal.aborted) return;
        setIsLoading(false);
      });

    return () => controller.abort();
  }, []);

  React.useEffect(() => {
    const cleanup = load();
    return cleanup;
  }, [load]);

  React.useEffect(() => {
    if (!success) return;
    const t = window.setTimeout(() => setSuccess(""), 2500);
    return () => window.clearTimeout(t);
  }, [success]);

  const onChange = (key: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setForm((prev) => ({ ...prev, [key]: value }));
    setError("");
    setSuccess("");
  };

  const onReset = () => {
    setForm({
      fullName: profile?.fullName || "",
      profileImageUrl: profile?.profileImageUrl || "",
    });
    setError("");
    setSuccess("");
  };

  const canSave = form.fullName.trim().length > 0 && !isSaving;

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!form.fullName.trim()) {
      setError("Full name is required");
      return;
    }

    setIsSaving(true);
    try {
      const res = await updateUserProfile({
        payload: {
          fullName: form.fullName.trim(),
          profileImageUrl: form.profileImageUrl.trim() || undefined,
        },
      });

      const nextProfile = res?.profile as Profile | null;
      setProfile(nextProfile);
      setForm({
        fullName: nextProfile?.fullName || form.fullName.trim(),
        profileImageUrl: nextProfile?.profileImageUrl || form.profileImageUrl.trim(),
      });
      setSuccess("Saved");
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || err?.message || "Failed to save profile");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-trackify-text">Profile</div>
              <div className="mt-1 text-sm text-trackify-muted">Manage your account details</div>
            </div>
            <Button variant="secondary" onClick={() => load()} disabled={isLoading} type="button">
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="rounded-control border border-trackify-border bg-trackify-bg px-4 py-4 text-sm text-trackify-muted">
              Loading profile…
            </div>
          ) : null}

          {!isLoading ? (
            <form onSubmit={onSave} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="mb-2 text-xs text-trackify-muted">Full name</div>
                  <Input value={form.fullName} onChange={onChange("fullName")} placeholder="Your name" />
                </div>
                <div>
                  <div className="mb-2 text-xs text-trackify-muted">Email</div>
                  <Input value={profile?.email || ""} placeholder="Email" disabled />
                  <div className="mt-1 text-xs text-trackify-muted">Email updates will be added later</div>
                </div>
              </div>

              <div>
                <div className="mb-2 text-xs text-trackify-muted">Profile image URL (optional)</div>
                <Input
                  value={form.profileImageUrl}
                  onChange={onChange("profileImageUrl")}
                  placeholder="https://…"
                />
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

              <div className="flex items-center gap-3">
                <Button type="submit" disabled={!canSave}>
                  Save changes
                </Button>
                <Button type="button" variant="secondary" onClick={onReset} disabled={isSaving}>
                  Reset
                </Button>
              </div>
            </form>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div>
            <div className="text-sm font-medium text-trackify-text">Account info</div>
            <div className="mt-1 text-sm text-trackify-muted">Reference details and upcoming settings</div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-control border border-trackify-border bg-trackify-bg px-4 py-4">
              <div className="text-xs text-trackify-muted">User ID</div>
              <div className="mt-1 text-sm text-trackify-text">{profile?.userId || "—"}</div>
            </div>
            <div className="rounded-control border border-trackify-border bg-trackify-bg px-4 py-4">
              <div className="text-xs text-trackify-muted">Password reset</div>
              <div className="mt-1 text-sm text-trackify-muted">Coming soon</div>
            </div>
            <div className="rounded-control border border-trackify-border bg-trackify-bg px-4 py-4">
              <div className="text-xs text-trackify-muted">Pay & break settings</div>
              <div className="mt-1 text-sm text-trackify-muted">Coming soon</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


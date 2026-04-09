import * as React from "react";

import Button from "@/components/Button";
import { Card, CardContent, CardHeader } from "@/components/Card";
import Input from "@/components/Input";
import {
  fetchUserProfile,
  fetchWorkSettings,
  updateUserProfile,
  updateWorkSettings,
  uploadProfileImage,
} from "@/services/userService";

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

type WorkDefaults = {
  defaultPayRate: string;
  defaultWeekendPayRate: string;
  defaultBreakTime: string;
  defaultMealAllowance: string;
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
  const [isUploading, setIsUploading] = React.useState(false);
  const [error, setError] = React.useState<string>("");
  const [success, setSuccess] = React.useState<string>("");
  const [workDefaults, setWorkDefaults] = React.useState<WorkDefaults>({
    defaultPayRate: "0",
    defaultWeekendPayRate: "0",
    defaultBreakTime: "1",
    defaultMealAllowance: "0",
  });
  const [workSaving, setWorkSaving] = React.useState(false);
  const [workError, setWorkError] = React.useState("");
  const [workSuccess, setWorkSuccess] = React.useState("");

  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = React.useState<string>("");

  const load = React.useCallback(() => {
    const controller = new AbortController();
    setIsLoading(true);
    setError("");

    setWorkError("");

    Promise.all([
      fetchUserProfile({ signal: controller.signal }),
      fetchWorkSettings({ signal: controller.signal }),
    ])
      .then(([profileRes, workRes]) => {
        const nextProfile = profileRes?.profile as Profile | null;
        setProfile(nextProfile);
        setForm({
          fullName: nextProfile?.fullName || "",
          profileImageUrl: nextProfile?.profileImageUrl || "",
        });

        const ws = workRes?.workSettings;
        if (ws) {
          setWorkDefaults({
            defaultPayRate: String(ws.defaultPayRate ?? 0),
            defaultWeekendPayRate: String(ws.defaultWeekendPayRate ?? 0),
            defaultBreakTime: String(ws.defaultBreakTime ?? 1),
            defaultMealAllowance: String(ws.defaultMealAllowance ?? 0),
          });
        }
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

  React.useEffect(() => {
    if (!workSuccess) return;
    const t = window.setTimeout(() => setWorkSuccess(""), 2500);
    return () => window.clearTimeout(t);
  }, [workSuccess]);

  const onChange = (key: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setForm((prev) => ({ ...prev, [key]: value }));
    setError("");
    setSuccess("");
  };

  React.useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl("");
      return;
    }

    const url = URL.createObjectURL(selectedFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [selectedFile]);

  const validateImageFile = (file: File) => {
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowed.includes(file.type)) return "Only image files are allowed (jpg, png, webp, gif)";
    if (file.size > 2 * 1024 * 1024) return "Max file size is 2MB";
    return "";
  };

  const onSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError("");
    setSuccess("");
    const file = e.target.files?.[0] || null;
    if (!file) {
      setSelectedFile(null);
      return;
    }

    const message = validateImageFile(file);
    if (message) {
      setSelectedFile(null);
      setError(message);
      return;
    }

    setSelectedFile(file);
  };

  const onUpload = async () => {
    if (!selectedFile) return;
    setError("");
    setSuccess("");

    setIsUploading(true);
    try {
      const res = await uploadProfileImage({ file: selectedFile });
      const nextProfile = res?.profile as Profile | null;
      const nextUrl = String(res?.profileImageUrl || nextProfile?.profileImageUrl || "");

      if (nextProfile) {
        setProfile(nextProfile);
      }
      if (nextUrl) {
        setForm((prev) => ({ ...prev, profileImageUrl: nextUrl }));
      }
      setSelectedFile(null);
      setSuccess("Image uploaded");
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || err?.message || "Failed to upload image");
    } finally {
      setIsUploading(false);
    }
  };

  const onReset = () => {
    setForm({
      fullName: profile?.fullName || "",
      profileImageUrl: profile?.profileImageUrl || "",
    });
    setSelectedFile(null);
    setError("");
    setSuccess("");
  };

  const onWorkChange = (key: keyof WorkDefaults) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setWorkDefaults((prev) => ({ ...prev, [key]: value }));
    setWorkError("");
    setWorkSuccess("");
  };

  const onSaveWorkDefaults = async (e: React.FormEvent) => {
    e.preventDefault();
    setWorkError("");
    setWorkSuccess("");

    const payload = {
      defaultPayRate: Number(workDefaults.defaultPayRate),
      defaultWeekendPayRate: Number(workDefaults.defaultWeekendPayRate),
      defaultBreakTime: Number(workDefaults.defaultBreakTime),
      defaultMealAllowance: Number(workDefaults.defaultMealAllowance),
    };

    const bad = Object.values(payload).some((v) => !Number.isFinite(v) || v < 0);
    if (bad) {
      setWorkError("All defaults must be numbers ≥ 0");
      return;
    }

    setWorkSaving(true);
    try {
      const res = await updateWorkSettings({ payload });
      const ws = res?.workSettings;
      if (ws) {
        setWorkDefaults({
          defaultPayRate: String(ws.defaultPayRate ?? 0),
          defaultWeekendPayRate: String(ws.defaultWeekendPayRate ?? 0),
          defaultBreakTime: String(ws.defaultBreakTime ?? 1),
          defaultMealAllowance: String(ws.defaultMealAllowance ?? 0),
        });
      }
      setWorkSuccess("Work defaults saved");
    } catch (err: any) {
      setWorkError(err?.response?.data?.error?.message || err?.message || "Failed to save work defaults");
    } finally {
      setWorkSaving(false);
    }
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
              <div className="flex items-start gap-5">
                <div className="h-14 w-14 overflow-hidden rounded-control border border-trackify-border bg-trackify-bg">
                  {previewUrl || profile?.profileImageUrl || form.profileImageUrl ? (
                    <img
                      src={previewUrl || profile?.profileImageUrl || form.profileImageUrl}
                      alt="Profile"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs text-trackify-muted">
                      —
                    </div>
                  )}
                </div>

                <div className="flex-1">
                  <div className="mb-2 text-xs text-trackify-muted">Profile image</div>
                  <div className="flex items-center gap-3">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={onSelectFile}
                      className="block w-full text-sm text-trackify-muted file:mr-4 file:rounded-control file:border file:border-trackify-border file:bg-trackify-bg file:px-3 file:py-2 file:text-sm file:text-trackify-text hover:file:bg-white/5"
                    />
                    <Button type="button" variant="secondary" onClick={onUpload} disabled={!selectedFile || isUploading}>
                      {isUploading ? "Uploading…" : "Upload"}
                    </Button>
                  </div>
                  <div className="mt-1 text-xs text-trackify-muted">Optional • Max 2MB • JPG/PNG/WEBP/GIF</div>
                </div>
              </div>

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
            <div className="text-sm font-medium text-trackify-text">Work defaults</div>
            <div className="mt-1 text-sm text-trackify-muted">Auto-fill new work entries</div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSaveWorkDefaults} className="space-y-5">
            <div className="grid grid-cols-4 gap-4">
              <div>
                <div className="mb-2 text-xs text-trackify-muted">Default pay rate</div>
                <Input
                  type="number"
                  min={0}
                  step={0.01}
                  value={workDefaults.defaultPayRate}
                  onChange={onWorkChange("defaultPayRate")}
                />
              </div>
              <div>
                <div className="mb-2 text-xs text-trackify-muted">Weekend pay rate</div>
                <Input
                  type="number"
                  min={0}
                  step={0.01}
                  value={workDefaults.defaultWeekendPayRate}
                  onChange={onWorkChange("defaultWeekendPayRate")}
                />
              </div>
              <div>
                <div className="mb-2 text-xs text-trackify-muted">Break time (hours)</div>
                <Input
                  type="number"
                  min={0}
                  step={0.25}
                  value={workDefaults.defaultBreakTime}
                  onChange={onWorkChange("defaultBreakTime")}
                />
              </div>
              <div>
                <div className="mb-2 text-xs text-trackify-muted">Meal allowance</div>
                <Input
                  type="number"
                  min={0}
                  step={0.01}
                  value={workDefaults.defaultMealAllowance}
                  onChange={onWorkChange("defaultMealAllowance")}
                />
              </div>
            </div>

            {workSuccess ? (
              <div className="rounded-control border border-trackify-border bg-trackify-bg px-4 py-3 text-sm text-trackify-muted">
                {workSuccess}
              </div>
            ) : null}

            {workError ? (
              <div className="rounded-control border border-trackify-border bg-trackify-bg px-4 py-3 text-sm text-trackify-muted">
                {workError}
              </div>
            ) : null}

            <div className="flex items-center gap-3">
              <Button type="submit" disabled={workSaving}>
                {workSaving ? "Saving…" : "Save defaults"}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => load()}
                disabled={isLoading || workSaving}
              >
                Reset
              </Button>
            </div>
          </form>
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

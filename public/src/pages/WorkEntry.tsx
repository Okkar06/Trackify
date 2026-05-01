import * as React from "react";

import Button from "@/components/Button";
import { Card, CardContent, CardHeader } from "@/components/Card";
import Input from "@/components/Input";
import Textarea from "@/components/Textarea";
import WorkEntryForm from "@/components/WorkEntryForm";
import WorkEntryDraftCard from "@/components/WorkEntryDraftCard";
import { fetchWorkSettings } from "@/services/userService";
import { analyzeWorkImage } from "@/services/aiService";
import { cn } from "@/utils/cn";
import {
  createWorkEntry,
  deleteWorkEntry,
  fetchWorkEntry,
  listWorkEntries,
  updateWorkEntry,
} from "@/services/workService";

type FormState = {
  date: string;
  start_time: string;
  end_time: string;
  break_time: string;
  pay_rate: string;
  meal_allowance: string;
  notes: string;
};

type FieldErrors = Partial<Record<keyof FormState, string>>;

type WorkEntryRow = {
  id: string;
  date: string;
  start_time: string | null;
  end_time: string | null;
  break_time: number | null;
  pay_rate: number | null;
  weekend_pay_rate: number | null;
  meal_allowance: number | null;
  total_hours: number | null;
  payable_hours: number | null;
  total_pay: number | null;
  notes: string | null;
};

type AiExtract = {
  employee_name: string;
  entries: Array<{
    date: string;
    day: string;
    status: string;
    shift_text: string;
    start_time: string;
    end_time: string;
    total_hours: string;
    pay_rate: string;
    notes: string;
  }>;
  summary_notes: string;
};

const parseTimeToMinutes = (timeStr: string) => {
  const match = timeStr.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return NaN;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (!Number.isInteger(hours) || !Number.isInteger(minutes)) return NaN;
  if (hours < 0 || hours > 23) return NaN;
  if (minutes < 0 || minutes > 59) return NaN;
  return hours * 60 + minutes;
};

const isWeekendDate = (dateStr: string) => {
  if (!dateStr) return false;
  const date = new Date(`${dateStr}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return false;
  const day = date.getUTCDay();
  return day === 0 || day === 6;
};

const getAutoPayRate = (dateStr: string) => (isWeekendDate(dateStr) ? "15" : "13");

const getDefaultForm = (): FormState => ({
  date: "",
  start_time: "",
  end_time: "",
  break_time: "1",
  pay_rate: "",
  meal_allowance: "4.5",
  notes: "",
});

const validate = (form: FormState): FieldErrors => {
  const errors: FieldErrors = {};

  if (!form.date) errors.date = "Date is required";
  if (!form.start_time) errors.start_time = "Start time is required";
  if (!form.end_time) errors.end_time = "End time is required";

  if (form.start_time && form.end_time) {
    const start = parseTimeToMinutes(form.start_time);
    const end0 = parseTimeToMinutes(form.end_time);
    const end = Number.isFinite(start) && Number.isFinite(end0) && end0 < start ? end0 + 24 * 60 : end0;
    if (!Number.isFinite(start) || !Number.isFinite(end)) {
      errors.start_time = errors.start_time || "Invalid time";
      errors.end_time = errors.end_time || "Invalid time";
    } else if (end0 === start) {
      errors.end_time = "End time cannot be the same as start time";
    } else {
      const totalHours = (end - start) / 60;
      const breakHours = Number(form.break_time || 1);
      if (!Number.isFinite(breakHours) || breakHours < 0) {
        errors.break_time = "Break time must be a non-negative number";
      } else if (breakHours > totalHours) {
        errors.break_time = "Break time cannot exceed total hours";
      }
    }
  }

  const numericFields: Array<keyof Pick<FormState, "pay_rate" | "meal_allowance">> = ["pay_rate", "meal_allowance"];

  numericFields.forEach((key) => {
    if (!form[key] && key === "pay_rate") return;
    const val = Number(form[key]);
    if (!Number.isFinite(val) || val < 0) {
      errors[key] = "Must be a number ≥ 0";
    }
  });

  return errors;
};

const toPayload = (form: FormState) => {
  const breakHours = Number(form.break_time || 1);
  const includeMeal = Number.isFinite(breakHours) && breakHours > 0;
  return {
    date: form.date,
    start_time: form.start_time,
    end_time: form.end_time,
    break_time: Number(form.break_time || 1),
    ...(String(form.pay_rate || "").trim() ? { pay_rate: Number(form.pay_rate) } : {}),
    ...(includeMeal ? { meal_allowance: Number(form.meal_allowance || 4.5) } : {}),
    notes: form.notes || undefined,
  };
};

export default function WorkEntry() {
  const [form, setForm] = React.useState<FormState>(getDefaultForm);
  const [errors, setErrors] = React.useState<FieldErrors>({});
  const [submitError, setSubmitError] = React.useState<string>("");

  const [entryMode, setEntryMode] = React.useState<"single" | "multiple">("single");
  const [draftForms, setDraftForms] = React.useState<FormState[]>([getDefaultForm()]);
  const [draftErrors, setDraftErrors] = React.useState<FieldErrors[]>([{}]);
  const [multiSubmitError, setMultiSubmitError] = React.useState<string>("");

  const [entries, setEntries] = React.useState<WorkEntryRow[]>([]);
  const [isListLoading, setIsListLoading] = React.useState(false);
  const [listError, setListError] = React.useState<string>("");

  const [editingId, setEditingId] = React.useState<string>("");
  const [isSaving, setIsSaving] = React.useState(false);

  const [defaultsLoaded, setDefaultsLoaded] = React.useState(false);

  const [aiFile, setAiFile] = React.useState<File | null>(null);
  const [aiPreviewUrl, setAiPreviewUrl] = React.useState<string>("");
  const [aiEmployeeName, setAiEmployeeName] = React.useState<string>("");
  const [aiExtract, setAiExtract] = React.useState<AiExtract | null>(null);
  const [aiError, setAiError] = React.useState<string>("");
  const [aiLoading, setAiLoading] = React.useState(false);
  const [aiCooldown, setAiCooldown] = React.useState<number>(0);

  React.useEffect(() => {
    if (aiCooldown <= 0) return;
    const id = window.setInterval(() => {
      setAiCooldown((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => window.clearInterval(id);
  }, [aiCooldown]);

  const refreshList = React.useCallback(() => {
    const controller = new AbortController();

    setIsListLoading(true);
    setListError("");

    listWorkEntries({ signal: controller.signal })
      .then((res) => {
        setEntries(Array.isArray(res?.workEntries) ? res.workEntries : []);
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        setListError(err?.response?.data?.error?.message || err?.message || "Failed to load work entries");
      })
      .finally(() => {
        if (controller.signal.aborted) return;
        setIsListLoading(false);
      });

    return () => controller.abort();
  }, []);

  React.useEffect(() => {
    const cleanup = refreshList();
    return cleanup;
  }, [refreshList]);

  React.useEffect(() => {
    if (defaultsLoaded) return;
    const controller = new AbortController();

    fetchWorkSettings({ signal: controller.signal })
      .then((res) => {
        const ws = res?.workSettings;
        if (!ws) return;

        setForm((prev) => {
          if (editingId) return prev;

          const next = { ...prev };
          if (next.break_time === "1") next.break_time = String(ws.defaultBreakTime ?? 1);
          const breakHours = Number(next.break_time || 1);
          if (Number.isFinite(breakHours) && breakHours <= 0) {
            next.meal_allowance = "0";
          } else if (next.meal_allowance === "" || next.meal_allowance === "0") {
            next.meal_allowance = "4.5";
          }
          return next;
        });

        setDraftForms((prev) => {
          if (editingId) return prev;
          return prev.map((row) => {
            const next = { ...row };
            if (next.break_time === "1") next.break_time = String(ws.defaultBreakTime ?? 1);
            const breakHours = Number(next.break_time || 1);
            if (Number.isFinite(breakHours) && breakHours <= 0) {
              next.meal_allowance = "0";
            } else if (next.meal_allowance === "" || next.meal_allowance === "0") {
              next.meal_allowance = "4.5";
            }
            return next;
          });
        });
      })
      .finally(() => {
        if (controller.signal.aborted) return;
        setDefaultsLoaded(true);
      });

    return () => controller.abort();
  }, [defaultsLoaded, editingId]);

  React.useEffect(() => {
    if (!aiFile) {
      setAiPreviewUrl("");
      return;
    }
    const url = URL.createObjectURL(aiFile);
    setAiPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [aiFile]);

  const validateAiImage = (file: File) => {
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowed.includes(file.type)) return "Only image files are allowed (jpg, png, webp, gif)";
    if (file.size > 5 * 1024 * 1024) return "Max file size is 5MB";
    return "";
  };

  const onSelectAiFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAiError("");
    setAiExtract(null);
    const file = e.target.files?.[0] || null;
    if (!file) {
      setAiFile(null);
      return;
    }
    const message = validateAiImage(file);
    if (message) {
      setAiFile(null);
      setAiError(message);
      return;
    }
    setAiFile(file);
  };

  const runAi = async () => {
    if (!aiFile) return;
    const targetName = aiEmployeeName.trim();
    if (!targetName) {
      setAiError("Employee name is required");
      return;
    }
    if (aiCooldown > 0) return;
    setAiLoading(true);
    setAiError("");
    setAiExtract(null);

    try {
      const res = await analyzeWorkImage({ file: aiFile, employeeName: targetName });
      const entries = Array.isArray(res?.entries) ? res.entries : [];
      setAiExtract({
        employee_name: String(res?.employee_name || targetName),
        entries: entries.map((e: any) => ({
          date: String(e?.date || ""),
          day: String(e?.day || ""),
          status: String(e?.status || ""),
          shift_text: String(e?.shift_text || ""),
          start_time: String(e?.start_time || ""),
          end_time: String(e?.end_time || ""),
          total_hours: String(e?.total_hours || ""),
          pay_rate: String(form.pay_rate || ""),
          notes: String(e?.notes || ""),
        })),
        summary_notes: String(res?.summary_notes || ""),
      });
    } catch (err: any) {
      const msg = err?.response?.data?.error?.message || err?.message || "AI analysis failed";
      setAiError(msg);
      const status = Number(err?.response?.status || 0);
      if (status === 429 || /rate limited/i.test(String(msg))) {
        setAiCooldown(30);
      }
    } finally {
      setAiLoading(false);
    }
  };

  const applyAiToForm = () => {
    if (!aiExtract) return;
    if (editingId) return;

    const working = (aiExtract.entries || []).filter((e) => String(e.status || "").toLowerCase() === "working");
    if (working.length === 0) {
      setAiError("No working entries found to apply");
      return;
    }

    setEntryMode("multiple");
    setDraftForms(
      working.map((e) => ({
        ...getDefaultForm(),
        date: e.date || "",
        start_time: e.start_time || "",
        end_time: e.end_time || "",
        pay_rate: "",
        notes: [e.shift_text ? `Shift: ${e.shift_text}` : "", e.total_hours ? `Hours: ${e.total_hours}` : "", e.notes || ""]
          .filter(Boolean)
          .join(" • "),
      }))
    );
    setDraftErrors(working.map(() => ({})));
    setMultiSubmitError("");
    setAiError("");
    setAiExtract(null);
    setAiFile(null);
  };

  const onChange = (key: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const value = e.target.value;
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "date" && !String(prev.pay_rate || "").trim()) next.pay_rate = getAutoPayRate(value);
      if (key === "break_time") {
        const breakHours = Number(value);
        if (Number.isFinite(breakHours) && breakHours <= 0) {
          next.meal_allowance = "0";
        } else if (next.meal_allowance === "" || next.meal_allowance === "0") {
          next.meal_allowance = "4.5";
        }
      }
      return next;
    });
    setErrors((prev) => ({ ...prev, [key]: "" }));
  };

  const onDraftChange =
    (index: number, key: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value = e.target.value;
      setDraftForms((prev) =>
        prev.map((row, i) => {
          if (i !== index) return row;
          const next = { ...row, [key]: value };
          if (key === "date" && !String(row.pay_rate || "").trim()) next.pay_rate = getAutoPayRate(value);
          if (key === "break_time") {
            const breakHours = Number(value);
            if (Number.isFinite(breakHours) && breakHours <= 0) {
              next.meal_allowance = "0";
            } else if (next.meal_allowance === "" || next.meal_allowance === "0") {
              next.meal_allowance = "4.5";
            }
          }
          return next;
        })
      );
      setDraftErrors((prev) => prev.map((rowErr, i) => (i === index ? { ...rowErr, [key]: "" } : rowErr)));
    };

  const resetForm = () => {
    setEditingId("");
    setForm(getDefaultForm());
    setErrors({});
    setSubmitError("");
  };

  const resetMulti = () => {
    setDraftForms([getDefaultForm()]);
    setDraftErrors([{}]);
    setMultiSubmitError("");
  };

  const startEdit = async (id: string) => {
    setSubmitError("");
    setErrors({});
    setEditingId(id);
    setEntryMode("single");
    setIsSaving(true);

    try {
      const res = await fetchWorkEntry({ id });
      const entry = res?.workEntry as WorkEntryRow | undefined;
      if (!entry) {
        setSubmitError("Entry not found");
        setEditingId("");
        return;
      }

      setForm({
        date: entry.date || "",
        start_time: entry.start_time || "",
        end_time: entry.end_time || "",
        break_time: String(entry.break_time ?? 1),
        pay_rate: String(entry.pay_rate ?? getAutoPayRate(entry.date || "")),
        meal_allowance:
          Number(entry.break_time ?? 1) > 0 ? String(entry.meal_allowance ?? 4.5) : "0",
        notes: entry.notes || "",
      });
    } catch (err: any) {
      setSubmitError(err?.response?.data?.error?.message || err?.message || "Failed to load entry");
      setEditingId("");
    } finally {
      setIsSaving(false);
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");

    const nextErrors = validate(form);
    setErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) return;

    setIsSaving(true);
    try {
      const payload = toPayload(form);
      if (editingId) {
        await updateWorkEntry({ id: editingId, payload });
      } else {
        await createWorkEntry({ payload });
      }

      resetForm();
      refreshList();
    } catch (err: any) {
      setSubmitError(err?.response?.data?.error?.message || err?.message || "Failed to save work entry");
    } finally {
      setIsSaving(false);
    }
  };

  const addDraftRow = () => {
    setDraftForms((prev) => [...prev, getDefaultForm()]);
    setDraftErrors((prev) => [...prev, {}]);
    setMultiSubmitError("");
  };

  const removeDraftRow = (index: number) => {
    setDraftForms((prev) => prev.filter((_, i) => i !== index));
    setDraftErrors((prev) => prev.filter((_, i) => i !== index));
    setMultiSubmitError("");
  };

  const onSubmitMultiple = async (e: React.FormEvent) => {
    e.preventDefault();
    setMultiSubmitError("");

    const nextErrors = draftForms.map((row) => validate(row));
    setDraftErrors(nextErrors);
    if (nextErrors.some((errs) => Object.values(errs).some(Boolean))) return;

    setIsSaving(true);
    try {
      for (let i = 0; i < draftForms.length; i += 1) {
        const payload = toPayload(draftForms[i]);
        await createWorkEntry({ payload });
      }
      resetMulti();
      refreshList();
    } catch (err: any) {
      setMultiSubmitError(err?.response?.data?.error?.message || err?.message || "Failed to create entries");
    } finally {
      setIsSaving(false);
    }
  };

  const onDelete = async (id: string) => {
    setListError("");
    try {
      await deleteWorkEntry({ id });
      if (editingId === id) resetForm();
      refreshList();
    } catch (err: any) {
      setListError(err?.response?.data?.error?.message || err?.message || "Failed to delete entry");
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div>
            <div className="text-sm font-medium text-trackify-text">AI image analysis</div>
            <div className="mt-1 text-sm text-trackify-muted">Upload a weekly roster screenshot to extract entries</div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
              <div className="h-14 w-14 overflow-hidden rounded-control border border-trackify-border bg-trackify-bg">
                {aiPreviewUrl ? (
                  <img src={aiPreviewUrl} alt="Schedule" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs text-trackify-muted">—</div>
                )}
              </div>
              <div className="flex-1">
                <div className="mb-2 text-xs text-trackify-muted">Schedule image (optional)</div>
                <div className="mb-3">
                  <div className="mb-2 text-xs font-medium uppercase tracking-wide text-trackify-muted">
                    Target employee name
                  </div>
                  <Input
                    value={aiEmployeeName}
                    onChange={(e) => {
                      setAiEmployeeName(e.target.value);
                      setAiError("");
                    }}
                    placeholder="Enter employee name exactly as shown"
                  />
                </div>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={onSelectAiFile}
                    className="block w-full text-sm text-trackify-muted file:mr-4 file:rounded-control file:border file:border-trackify-border file:bg-trackify-surface file:px-4 file:py-3 file:text-[15px] file:text-trackify-text hover:file:bg-trackify-surface2"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={runAi}
                    disabled={!aiFile || aiLoading || !aiEmployeeName.trim() || aiCooldown > 0}
                    className="w-full sm:w-auto"
                  >
                    {aiLoading ? "Analyzing…" : aiCooldown > 0 ? `Try again in ${aiCooldown}s` : "Analyze"}
                  </Button>
                </div>
                <div className="mt-1 text-xs text-trackify-muted">Optional • Max 5MB • JPG/PNG/WEBP/GIF</div>
              </div>
            </div>

            {aiError ? (
              <div className="rounded-control border border-trackify-border bg-trackify-bg px-4 py-3 text-sm text-trackify-muted">
                {aiError}
              </div>
            ) : null}

            {aiExtract ? (
              <div className="rounded-control border border-trackify-border bg-trackify-surface px-4 py-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                  <div>
                    <div className="text-sm font-medium text-trackify-text">Extracted roster</div>
                    <div className="mt-1 text-sm text-trackify-muted">
                      Employee: {aiExtract.employee_name || aiEmployeeName.trim()}
                    </div>
                    {aiExtract.summary_notes ? (
                      <div className="mt-1 text-xs text-trackify-muted">{aiExtract.summary_notes}</div>
                    ) : null}
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <Button className="w-full sm:w-auto" type="button" onClick={applyAiToForm} disabled={editingId !== ""}>
                      Apply working entries
                    </Button>
                    <Button className="w-full sm:w-auto" type="button" variant="secondary" onClick={() => setAiExtract(null)}>
                      Dismiss
                    </Button>
                  </div>
                </div>

                <div className="mt-4 space-y-3 md:hidden">
                  {aiExtract.entries.map((row, idx) => (
                    <div key={idx} className="rounded-control border border-trackify-border bg-trackify-surface2 px-4 py-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-trackify-text">{row.date || "—"}</div>
                          <div className="mt-1 text-xs text-trackify-muted">{row.day || ""}</div>
                        </div>
                        <div className="shrink-0 rounded-full border border-trackify-border bg-trackify-surface px-2 py-1 text-[11px] text-trackify-muted">
                          {row.status === "no_work" ? "X" : row.status}
                        </div>
                      </div>

                      <div className="mt-3 grid grid-cols-1 gap-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <div className="mb-2 text-xs font-medium uppercase tracking-wide text-trackify-muted">Start</div>
                            <Input
                              value={row.start_time}
                              onChange={(e) =>
                                setAiExtract((prev) =>
                                  prev
                                    ? { ...prev, entries: prev.entries.map((r, i) => (i === idx ? { ...r, start_time: e.target.value } : r)) }
                                    : prev
                                )
                              }
                              placeholder="HH:MM"
                            />
                          </div>
                          <div>
                            <div className="mb-2 text-xs font-medium uppercase tracking-wide text-trackify-muted">End</div>
                            <Input
                              value={row.end_time}
                              onChange={(e) =>
                                setAiExtract((prev) =>
                                  prev
                                    ? { ...prev, entries: prev.entries.map((r, i) => (i === idx ? { ...r, end_time: e.target.value } : r)) }
                                    : prev
                                )
                              }
                              placeholder="HH:MM"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <div className="mb-2 text-xs font-medium uppercase tracking-wide text-trackify-muted">Pay rate</div>
                            <Input
                              type="number"
                              min={0}
                              step={0.01}
                              value={row.pay_rate}
                              onChange={(e) =>
                                setAiExtract((prev) =>
                                  prev
                                    ? { ...prev, entries: prev.entries.map((r, i) => (i === idx ? { ...r, pay_rate: e.target.value } : r)) }
                                    : prev
                                )
                              }
                              placeholder="0"
                            />
                          </div>
                          <div>
                            <div className="mb-2 text-xs font-medium uppercase tracking-wide text-trackify-muted">Hours</div>
                            <Input
                              value={row.total_hours}
                              onChange={(e) =>
                                setAiExtract((prev) =>
                                  prev
                                    ? { ...prev, entries: prev.entries.map((r, i) => (i === idx ? { ...r, total_hours: e.target.value } : r)) }
                                    : prev
                                )
                              }
                              placeholder="9.0"
                            />
                          </div>
                        </div>

                        <div>
                          <div className="mb-2 text-xs font-medium uppercase tracking-wide text-trackify-muted">Status</div>
                          <select
                            value={row.status}
                            onChange={(e) =>
                              setAiExtract((prev) =>
                                prev
                                  ? { ...prev, entries: prev.entries.map((r, i) => (i === idx ? { ...r, status: e.target.value } : r)) }
                                  : prev
                              )
                            }
                            className="h-11 w-full rounded-control border border-trackify-border bg-trackify-surface px-3 text-[15px] text-trackify-text"
                          >
                            <option value="working">working</option>
                            <option value="no_work">no_work</option>
                            <option value="unclear">unclear</option>
                          </select>
                        </div>

                        <div>
                          <div className="mb-2 text-xs font-medium uppercase tracking-wide text-trackify-muted">Notes</div>
                          <Input
                            value={row.notes}
                            onChange={(e) =>
                              setAiExtract((prev) =>
                                prev
                                  ? { ...prev, entries: prev.entries.map((r, i) => (i === idx ? { ...r, notes: e.target.value } : r)) }
                                  : prev
                              )
                            }
                            placeholder="Optional"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 hidden overflow-x-auto md:block">
                  <table className="w-full min-w-[980px] border-separate border-spacing-0">
                    <thead>
                      <tr className="text-left text-xs text-trackify-muted">
                        <th className="border-b border-trackify-border px-3 py-2">Date</th>
                        <th className="border-b border-trackify-border px-3 py-2">Day</th>
                        <th className="border-b border-trackify-border px-3 py-2">Status</th>
                        <th className="border-b border-trackify-border px-3 py-2">Shift</th>
                        <th className="border-b border-trackify-border px-3 py-2">Start</th>
                        <th className="border-b border-trackify-border px-3 py-2">End</th>
                        <th className="border-b border-trackify-border px-3 py-2">Pay rate</th>
                        <th className="border-b border-trackify-border px-3 py-2">Hours</th>
                        <th className="border-b border-trackify-border px-3 py-2">Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {aiExtract.entries.map((row, idx) => (
                        <tr key={idx} className="text-sm text-trackify-text">
                          <td className="border-b border-trackify-border px-3 py-2">
                            <Input
                              value={row.date}
                              onChange={(e) =>
                                setAiExtract((prev) =>
                                  prev
                                    ? {
                                        ...prev,
                                        entries: prev.entries.map((r, i) => (i === idx ? { ...r, date: e.target.value } : r)),
                                      }
                                    : prev
                                )
                              }
                            />
                          </td>
                          <td className="border-b border-trackify-border px-3 py-2">
                            <Input
                              value={row.day}
                              onChange={(e) =>
                                setAiExtract((prev) =>
                                  prev
                                    ? {
                                        ...prev,
                                        entries: prev.entries.map((r, i) => (i === idx ? { ...r, day: e.target.value } : r)),
                                      }
                                    : prev
                                )
                              }
                            />
                          </td>
                          <td className="border-b border-trackify-border px-3 py-2">
                            <select
                              value={row.status}
                              onChange={(e) =>
                                setAiExtract((prev) =>
                                  prev
                                    ? {
                                        ...prev,
                                        entries: prev.entries.map((r, i) => (i === idx ? { ...r, status: e.target.value } : r)),
                                      }
                                    : prev
                                )
                              }
                              className="h-11 w-full rounded-control border border-trackify-border bg-trackify-surface px-3 text-[15px] text-trackify-text"
                            >
                              <option value="working">working</option>
                              <option value="no_work">no_work</option>
                              <option value="unclear">unclear</option>
                            </select>
                          </td>
                          <td className="border-b border-trackify-border px-3 py-2">
                            <Input
                              value={row.shift_text}
                              onChange={(e) =>
                                setAiExtract((prev) =>
                                  prev
                                    ? {
                                        ...prev,
                                        entries: prev.entries.map((r, i) =>
                                          i === idx ? { ...r, shift_text: e.target.value } : r
                                        ),
                                      }
                                    : prev
                                )
                              }
                            />
                          </td>
                          <td className="border-b border-trackify-border px-3 py-2">
                            <Input
                              value={row.start_time}
                              onChange={(e) =>
                                setAiExtract((prev) =>
                                  prev
                                    ? {
                                        ...prev,
                                        entries: prev.entries.map((r, i) =>
                                          i === idx ? { ...r, start_time: e.target.value } : r
                                        ),
                                      }
                                    : prev
                                )
                              }
                              placeholder="HH:MM"
                            />
                          </td>
                          <td className="border-b border-trackify-border px-3 py-2">
                            <Input
                              value={row.end_time}
                              onChange={(e) =>
                                setAiExtract((prev) =>
                                  prev
                                    ? {
                                        ...prev,
                                        entries: prev.entries.map((r, i) =>
                                          i === idx ? { ...r, end_time: e.target.value } : r
                                        ),
                                      }
                                    : prev
                                )
                              }
                              placeholder="HH:MM"
                            />
                          </td>
                          <td className="border-b border-trackify-border px-3 py-2">
                            <Input
                              type="number"
                              min={0}
                              step={0.01}
                              value={row.pay_rate}
                              onChange={(e) =>
                                setAiExtract((prev) =>
                                  prev
                                    ? {
                                        ...prev,
                                        entries: prev.entries.map((r, i) =>
                                          i === idx ? { ...r, pay_rate: e.target.value } : r
                                        ),
                                      }
                                    : prev
                                )
                              }
                              placeholder="0"
                            />
                          </td>
                          <td className="border-b border-trackify-border px-3 py-2">
                            <Input
                              value={row.total_hours}
                              onChange={(e) =>
                                setAiExtract((prev) =>
                                  prev
                                    ? {
                                        ...prev,
                                        entries: prev.entries.map((r, i) =>
                                          i === idx ? { ...r, total_hours: e.target.value } : r
                                        ),
                                      }
                                    : prev
                                )
                              }
                              placeholder="9.0"
                            />
                          </td>
                          <td className="border-b border-trackify-border px-3 py-2">
                            <Input
                              value={row.notes}
                              onChange={(e) =>
                                setAiExtract((prev) =>
                                  prev
                                    ? {
                                        ...prev,
                                        entries: prev.entries.map((r, i) => (i === idx ? { ...r, notes: e.target.value } : r)),
                                      }
                                    : prev
                                )
                              }
                              placeholder="Optional"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-sm font-medium text-trackify-text">Work entry</div>
              <div className="mt-1 text-sm text-trackify-muted">
                Add a shift and Trackify will calculate payable hours and pay
              </div>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
              {!editingId ? (
                <>
                  <Button
                    type="button"
                    variant={entryMode === "single" ? "primary" : "secondary"}
                    onClick={() => {
                      setEntryMode("single");
                      setSubmitError("");
                      setErrors({});
                    }}
                    className="w-full sm:w-auto"
                  >
                    Single
                  </Button>
                  <Button
                    type="button"
                    variant={entryMode === "multiple" ? "primary" : "secondary"}
                    onClick={() => {
                      setEntryMode("multiple");
                      setMultiSubmitError("");
                    }}
                    className="w-full sm:w-auto"
                  >
                    Multiple
                  </Button>
                </>
              ) : null}
              <div className="text-sm text-trackify-muted">{editingId ? "Editing" : "New entry"}</div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {entryMode === "multiple" && !editingId ? (
            <form onSubmit={onSubmitMultiple} className="space-y-5">
              <div className="space-y-4">
                {draftForms.map((row, idx) => (
                  <WorkEntryDraftCard
                    key={idx}
                    index={idx}
                    value={row}
                    errors={draftErrors[idx] || {}}
                    disabled={isSaving}
                    onChange={(next) => {
                      setDraftForms((prev) => prev.map((r, i) => (i === idx ? next : r)));
                      setDraftErrors((prev) => prev.map((e, i) => (i === idx ? {} : e)));
                      setMultiSubmitError("");
                    }}
                    onRemove={draftForms.length > 1 ? () => removeDraftRow(idx) : undefined}
                  />
                ))}
              </div>

              {multiSubmitError ? (
                <div className="rounded-control border border-trackify-border bg-trackify-bg px-4 py-3 text-sm text-trackify-muted">
                  {multiSubmitError}
                </div>
              ) : null}

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                <Button className="w-full sm:w-auto" type="button" variant="secondary" onClick={addDraftRow} disabled={isSaving}>
                  Add another
                </Button>
                <Button className="w-full sm:w-auto" type="submit" disabled={isSaving}>
                  Create entries
                </Button>
                <Button className="w-full sm:w-auto" type="button" variant="secondary" onClick={resetMulti} disabled={isSaving}>
                  Reset
                </Button>
              </div>
            </form>
          ) : (
            editingId ? (
              <form onSubmit={onSubmit} className="space-y-5">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div>
                    <div className="mb-2 text-xs text-trackify-muted">Date</div>
                    <Input
                      type="date"
                      value={form.date}
                      onChange={onChange("date")}
                      state={errors.date ? "error" : "default"}
                    />
                    {errors.date ? <div className="mt-1 text-xs text-trackify-muted">{errors.date}</div> : null}
                  </div>
                  <div>
                    <div className="mb-2 text-xs text-trackify-muted">Start time</div>
                    <Input
                      type="time"
                      value={form.start_time}
                      onChange={onChange("start_time")}
                      state={errors.start_time ? "error" : "default"}
                    />
                    {errors.start_time ? (
                      <div className="mt-1 text-xs text-trackify-muted">{errors.start_time}</div>
                    ) : null}
                  </div>
                  <div>
                    <div className="mb-2 text-xs text-trackify-muted">End time</div>
                    <Input
                      type="time"
                      value={form.end_time}
                      onChange={onChange("end_time")}
                      state={errors.end_time ? "error" : "default"}
                    />
                    {errors.end_time ? <div className="mt-1 text-xs text-trackify-muted">{errors.end_time}</div> : null}
                  </div>
                </div>

                <div
                  className={cn(
                    "grid grid-cols-1 gap-4",
                    Number(form.break_time || 1) > 0 ? "sm:grid-cols-3" : "sm:grid-cols-2"
                  )}
                >
                  <div>
                    <div className="mb-2 text-xs text-trackify-muted">Break time (hours)</div>
                    <Input
                      type="number"
                      min={0}
                      step={1}
                      value={form.break_time}
                      onChange={onChange("break_time")}
                      state={errors.break_time ? "error" : "default"}
                    />
                    {errors.break_time ? (
                      <div className="mt-1 text-xs text-trackify-muted">{errors.break_time}</div>
                    ) : null}
                  </div>
                  <div>
                    <div className="mb-2 text-xs text-trackify-muted">Pay rate</div>
                    <Input
                      type="number"
                      min={0}
                      step={0.01}
                      value={form.pay_rate}
                      onChange={onChange("pay_rate")}
                      state={errors.pay_rate ? "error" : "default"}
                    />
                    {errors.pay_rate ? <div className="mt-1 text-xs text-trackify-muted">{errors.pay_rate}</div> : null}
                  </div>
                  {Number(form.break_time || 1) > 0 ? (
                    <div>
                      <div className="mb-2 text-xs text-trackify-muted">Meal allowance</div>
                      <Input
                        type="number"
                        min={0}
                        step={0.01}
                        value={form.meal_allowance}
                        onChange={onChange("meal_allowance")}
                        state={errors.meal_allowance ? "error" : "default"}
                      />
                      {errors.meal_allowance ? (
                        <div className="mt-1 text-xs text-trackify-muted">{errors.meal_allowance}</div>
                      ) : null}
                    </div>
                  ) : null}
                </div>

                <div>
                  <div className="mb-2 text-xs text-trackify-muted">Notes (optional)</div>
                  <Textarea value={form.notes} onChange={onChange("notes")} placeholder="Add notes for this shift" />
                </div>

                {submitError ? (
                  <div className="rounded-control border border-trackify-border bg-trackify-bg px-4 py-3 text-sm text-trackify-muted">
                    {submitError}
                  </div>
                ) : null}

                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                  <Button className="w-full sm:w-auto" type="submit" disabled={isSaving}>
                    Update entry
                  </Button>
                  <Button className="w-full sm:w-auto" type="button" variant="secondary" onClick={resetForm} disabled={isSaving}>
                    Reset
                  </Button>
                </div>
              </form>
            ) : (
              <div className="bg-trackify-bg">
                {submitError ? (
                  <div className="mb-4 rounded-control border border-trackify-border bg-trackify-bg px-4 py-3 text-sm text-trackify-muted">
                    {submitError}
                  </div>
                ) : null}
                <WorkEntryForm
                  isSaving={isSaving}
                  onSubmit={async (payload) => {
                    setSubmitError("");
                    setIsSaving(true);
                    try {
                      await createWorkEntry({ payload });
                      refreshList();
                    } catch (err: any) {
                      setSubmitError(err?.response?.data?.error?.message || err?.message || "Failed to save work entry");
                    } finally {
                      setIsSaving(false);
                    }
                  }}
                  onReset={() => setSubmitError("")}
                  onAddAnother={() => {
                    setEntryMode("multiple");
                    setDraftForms([getDefaultForm(), getDefaultForm()]);
                    setDraftErrors([{}, {}]);
                    setMultiSubmitError("");
                    setSubmitError("");
                  }}
                />
              </div>
            )
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-sm font-medium text-trackify-text">Work entries</div>
              <div className="mt-1 text-sm text-trackify-muted">Calculated values come from the backend</div>
            </div>
            <Button className="w-full sm:w-auto" variant="secondary" type="button" onClick={() => refreshList()} disabled={isListLoading}>
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {listError ? (
            <div className="mb-4 rounded-control border border-trackify-border bg-trackify-bg px-4 py-3 text-sm text-trackify-muted">
              {listError}
            </div>
          ) : null}

          {isListLoading ? (
            <div className="rounded-control border border-trackify-border bg-trackify-bg px-4 py-4 text-sm text-trackify-muted">
              Loading entries…
            </div>
          ) : null}

          {!isListLoading && entries.length === 0 ? (
            <div className="rounded-control border border-trackify-border bg-trackify-bg px-4 py-4">
              <div className="text-sm font-medium text-trackify-text">No entries yet</div>
              <div className="mt-1 text-sm text-trackify-muted">Create your first shift above.</div>
            </div>
          ) : null}

          {entries.length > 0 ? (
            <>
              <div className="space-y-3 md:hidden">
                {entries.map((entry) => (
                  <div key={entry.id} className="rounded-control border border-trackify-border bg-trackify-surface2 px-4 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-trackify-text">{entry.date}</div>
                        <div className="mt-1 text-sm text-trackify-muted">
                          {entry.start_time && entry.end_time ? `${entry.start_time} — ${entry.end_time}` : "—"}
                        </div>
                      </div>
                      <div className="shrink-0 text-sm text-trackify-muted tabular-nums">{entry.total_pay ?? "—"}</div>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-3">
                      <div className="rounded-control border border-trackify-border bg-trackify-surface px-3 py-3">
                        <div className="text-xs font-medium uppercase tracking-wide text-trackify-muted">Hours</div>
                        <div className="mt-1 text-sm text-trackify-text tabular-nums">{entry.total_hours ?? "—"}</div>
                      </div>
                      <div className="rounded-control border border-trackify-border bg-trackify-surface px-3 py-3">
                        <div className="text-xs font-medium uppercase tracking-wide text-trackify-muted">Notes</div>
                        <div className="mt-1 text-sm text-trackify-text">{entry.notes || "—"}</div>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
                      <Button className="w-full sm:w-auto" variant="secondary" type="button" onClick={() => startEdit(entry.id)} disabled={isSaving}>
                        Edit
                      </Button>
                      <Button className="w-full sm:w-auto" variant="secondary" type="button" onClick={() => onDelete(entry.id)} disabled={isSaving}>
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="hidden overflow-x-auto rounded-control border border-trackify-border md:block">
                <div className="min-w-[820px]">
                  <div className="grid grid-cols-[140px_160px_90px_120px_1fr_160px] gap-0 border-b border-trackify-border bg-trackify-surface2 px-4 py-3 text-xs font-medium text-trackify-muted">
                    <div>Date</div>
                    <div>Time</div>
                    <div className="text-right">Hours</div>
                    <div className="text-right">Pay</div>
                    <div>Notes</div>
                    <div className="text-right">Actions</div>
                  </div>
                  {entries.map((entry) => (
                    <div
                      key={entry.id}
                      className="grid grid-cols-[140px_160px_90px_120px_1fr_160px] items-center gap-0 border-b border-trackify-border px-4 py-3 text-sm last:border-b-0"
                    >
                      <div className="text-trackify-muted">{entry.date}</div>
                      <div className="text-trackify-text">
                        {entry.start_time && entry.end_time ? `${entry.start_time} — ${entry.end_time}` : "—"}
                      </div>
                      <div className="text-right text-trackify-muted">{entry.total_hours ?? "—"}</div>
                      <div className="text-right text-trackify-muted">{entry.total_pay ?? "—"}</div>
                      <div className="truncate text-trackify-muted">{entry.notes || "—"}</div>
                      <div className="flex justify-end gap-2">
                        <Button variant="secondary" type="button" onClick={() => startEdit(entry.id)} disabled={isSaving}>
                          Edit
                        </Button>
                        <Button variant="secondary" type="button" onClick={() => onDelete(entry.id)} disabled={isSaving}>
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}

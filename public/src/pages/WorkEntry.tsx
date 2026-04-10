import * as React from "react";

import Button from "@/components/Button";
import { Card, CardContent, CardHeader } from "@/components/Card";
import Input from "@/components/Input";
import Textarea from "@/components/Textarea";
import { fetchWorkSettings } from "@/services/userService";
import { analyzeWorkImage } from "@/services/aiService";
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
  date: string;
  start_time: string;
  end_time: string;
  notes: string;
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

const getDefaultForm = (): FormState => ({
  date: "",
  start_time: "",
  end_time: "",
  break_time: "1",
  pay_rate: "",
  meal_allowance: "0",
  notes: "",
});

const validate = (form: FormState): FieldErrors => {
  const errors: FieldErrors = {};

  if (!form.date) errors.date = "Date is required";
  if (!form.start_time) errors.start_time = "Start time is required";
  if (!form.end_time) errors.end_time = "End time is required";
  if (!form.pay_rate) errors.pay_rate = "Pay rate is required";

  if (form.start_time && form.end_time) {
    const start = parseTimeToMinutes(form.start_time);
    const end = parseTimeToMinutes(form.end_time);
    if (!Number.isFinite(start) || !Number.isFinite(end)) {
      errors.start_time = errors.start_time || "Invalid time";
      errors.end_time = errors.end_time || "Invalid time";
    } else if (end <= start) {
      errors.end_time = "End time must be after start time";
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
  return {
    date: form.date,
    start_time: form.start_time,
    end_time: form.end_time,
    break_time: Number(form.break_time || 1),
    pay_rate: Number(form.pay_rate),
    meal_allowance: Number(form.meal_allowance || 0),
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
  const [aiExtract, setAiExtract] = React.useState<AiExtract | null>(null);
  const [aiError, setAiError] = React.useState<string>("");
  const [aiLoading, setAiLoading] = React.useState(false);

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
          if (next.pay_rate === "") next.pay_rate = String(ws.defaultPayRate ?? "");
          if (next.break_time === "1") next.break_time = String(ws.defaultBreakTime ?? 1);
          if (next.meal_allowance === "0") next.meal_allowance = String(ws.defaultMealAllowance ?? 0);
          return next;
        });

        setDraftForms((prev) => {
          if (editingId) return prev;
          return prev.map((row) => {
            const next = { ...row };
            if (next.pay_rate === "") next.pay_rate = String(ws.defaultPayRate ?? "");
            if (next.break_time === "1") next.break_time = String(ws.defaultBreakTime ?? 1);
            if (next.meal_allowance === "0") next.meal_allowance = String(ws.defaultMealAllowance ?? 0);
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
    setAiLoading(true);
    setAiError("");
    setAiExtract(null);

    try {
      const res = await analyzeWorkImage({ file: aiFile });
      setAiExtract({
        date: String(res?.date || ""),
        start_time: String(res?.start_time || ""),
        end_time: String(res?.end_time || ""),
        notes: String(res?.notes || ""),
      });
    } catch (err: any) {
      setAiError(err?.response?.data?.error?.message || err?.message || "AI analysis failed");
    } finally {
      setAiLoading(false);
    }
  };

  const applyAiToForm = () => {
    if (!aiExtract) return;
    if (entryMode === "multiple" && !editingId) {
      setDraftForms((prev) => {
        if (prev.length === 0) return prev;
        const next = [...prev];
        next[0] = {
          ...next[0],
          date: aiExtract.date || next[0].date,
          start_time: aiExtract.start_time || next[0].start_time,
          end_time: aiExtract.end_time || next[0].end_time,
          notes: aiExtract.notes || next[0].notes,
        };
        return next;
      });
    } else {
      setForm((prev) => ({
        ...prev,
        date: aiExtract.date || prev.date,
        start_time: aiExtract.start_time || prev.start_time,
        end_time: aiExtract.end_time || prev.end_time,
        notes: aiExtract.notes || prev.notes,
      }));
    }
    setAiError("");
    setAiExtract(null);
    setAiFile(null);
  };

  const onChange = (key: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const value = e.target.value;
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: "" }));
  };

  const onDraftChange =
    (index: number, key: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value = e.target.value;
      setDraftForms((prev) => prev.map((row, i) => (i === index ? { ...row, [key]: value } : row)));
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
        pay_rate: String(entry.pay_rate ?? ""),
        meal_allowance: String(entry.meal_allowance ?? 0),
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
            <div className="mt-1 text-sm text-trackify-muted">Upload a schedule screenshot to extract shift times</div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-5">
              <div className="h-14 w-14 overflow-hidden rounded-control border border-trackify-border bg-trackify-bg">
                {aiPreviewUrl ? (
                  <img src={aiPreviewUrl} alt="Schedule" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs text-trackify-muted">—</div>
                )}
              </div>
              <div className="flex-1">
                <div className="mb-2 text-xs text-trackify-muted">Schedule image (optional)</div>
                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={onSelectAiFile}
                    className="block w-full text-sm text-trackify-muted file:mr-4 file:rounded-control file:border file:border-trackify-border file:bg-trackify-bg file:px-3 file:py-2 file:text-sm file:text-trackify-text hover:file:bg-white/5"
                  />
                  <Button type="button" variant="secondary" onClick={runAi} disabled={!aiFile || aiLoading}>
                    {aiLoading ? "Analyzing…" : "Analyze"}
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
              <div className="rounded-control border border-trackify-border bg-trackify-bg px-4 py-4">
                <div className="text-sm font-medium text-trackify-text">Extracted values</div>
                <div className="mt-3 grid grid-cols-3 gap-4">
                  <div>
                    <div className="mb-2 text-xs text-trackify-muted">Date</div>
                    <Input value={aiExtract.date} onChange={(e) => setAiExtract({ ...aiExtract, date: e.target.value })} />
                  </div>
                  <div>
                    <div className="mb-2 text-xs text-trackify-muted">Start</div>
                    <Input
                      value={aiExtract.start_time}
                      onChange={(e) => setAiExtract({ ...aiExtract, start_time: e.target.value })}
                      placeholder="HH:MM"
                    />
                  </div>
                  <div>
                    <div className="mb-2 text-xs text-trackify-muted">End</div>
                    <Input
                      value={aiExtract.end_time}
                      onChange={(e) => setAiExtract({ ...aiExtract, end_time: e.target.value })}
                      placeholder="HH:MM"
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <div className="mb-2 text-xs text-trackify-muted">Notes</div>
                  <Textarea
                    value={aiExtract.notes}
                    onChange={(e) => setAiExtract({ ...aiExtract, notes: e.target.value })}
                    placeholder="Optional notes"
                  />
                </div>
                <div className="mt-4 flex items-center gap-3">
                  <Button type="button" onClick={applyAiToForm}>
                    Apply to form
                  </Button>
                  <Button type="button" variant="secondary" onClick={() => setAiExtract(null)}>
                    Dismiss
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-trackify-text">Work entry</div>
              <div className="mt-1 text-sm text-trackify-muted">
                Add a shift and Trackify will calculate payable hours and pay
              </div>
            </div>
            <div className="flex items-center gap-2">
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
                {draftForms.map((row, idx) => {
                  const rowErrors = draftErrors[idx] || {};
                  return (
                    <div key={idx} className="rounded-control border border-trackify-border bg-trackify-bg px-4 py-4">
                      <div className="mb-4 flex items-center justify-between">
                        <div className="text-sm font-medium text-trackify-text">Entry {idx + 1}</div>
                        {draftForms.length > 1 ? (
                          <Button type="button" variant="secondary" onClick={() => removeDraftRow(idx)} disabled={isSaving}>
                            Remove
                          </Button>
                        ) : null}
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <div className="mb-2 text-xs text-trackify-muted">Date</div>
                          <Input
                            type="date"
                            value={row.date}
                            onChange={onDraftChange(idx, "date")}
                            state={rowErrors.date ? "error" : "default"}
                          />
                          {rowErrors.date ? <div className="mt-1 text-xs text-trackify-muted">{rowErrors.date}</div> : null}
                        </div>
                        <div>
                          <div className="mb-2 text-xs text-trackify-muted">Start time</div>
                          <Input
                            type="time"
                            value={row.start_time}
                            onChange={onDraftChange(idx, "start_time")}
                            state={rowErrors.start_time ? "error" : "default"}
                          />
                          {rowErrors.start_time ? (
                            <div className="mt-1 text-xs text-trackify-muted">{rowErrors.start_time}</div>
                          ) : null}
                        </div>
                        <div>
                          <div className="mb-2 text-xs text-trackify-muted">End time</div>
                          <Input
                            type="time"
                            value={row.end_time}
                            onChange={onDraftChange(idx, "end_time")}
                            state={rowErrors.end_time ? "error" : "default"}
                          />
                          {rowErrors.end_time ? <div className="mt-1 text-xs text-trackify-muted">{rowErrors.end_time}</div> : null}
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-3 gap-4">
                        <div>
                          <div className="mb-2 text-xs text-trackify-muted">Break time (hours)</div>
                          <Input
                            type="number"
                            min={0}
                            step={0.25}
                            value={row.break_time}
                            onChange={onDraftChange(idx, "break_time")}
                            state={rowErrors.break_time ? "error" : "default"}
                          />
                          {rowErrors.break_time ? (
                            <div className="mt-1 text-xs text-trackify-muted">{rowErrors.break_time}</div>
                          ) : null}
                        </div>
                        <div>
                          <div className="mb-2 text-xs text-trackify-muted">Pay rate</div>
                          <Input
                            type="number"
                            min={0}
                            step={0.01}
                            value={row.pay_rate}
                            onChange={onDraftChange(idx, "pay_rate")}
                            state={rowErrors.pay_rate ? "error" : "default"}
                          />
                          {rowErrors.pay_rate ? <div className="mt-1 text-xs text-trackify-muted">{rowErrors.pay_rate}</div> : null}
                        </div>
                        <div>
                          <div className="mb-2 text-xs text-trackify-muted">Meal allowance</div>
                          <Input
                            type="number"
                            min={0}
                            step={0.01}
                            value={row.meal_allowance}
                            onChange={onDraftChange(idx, "meal_allowance")}
                            state={rowErrors.meal_allowance ? "error" : "default"}
                          />
                          {rowErrors.meal_allowance ? (
                            <div className="mt-1 text-xs text-trackify-muted">{rowErrors.meal_allowance}</div>
                          ) : null}
                        </div>
                      </div>

                      <div className="mt-4">
                        <div className="mb-2 text-xs text-trackify-muted">Notes (optional)</div>
                        <Input value={row.notes} onChange={onDraftChange(idx, "notes")} placeholder="Optional" />
                      </div>
                    </div>
                  );
                })}
              </div>

              {multiSubmitError ? (
                <div className="rounded-control border border-trackify-border bg-trackify-bg px-4 py-3 text-sm text-trackify-muted">
                  {multiSubmitError}
                </div>
              ) : null}

              <div className="flex items-center gap-3">
                <Button type="button" variant="secondary" onClick={addDraftRow} disabled={isSaving}>
                  Add another
                </Button>
                <Button type="submit" disabled={isSaving}>
                  Create entries
                </Button>
                <Button type="button" variant="secondary" onClick={resetMulti} disabled={isSaving}>
                  Reset
                </Button>
              </div>
            </form>
          ) : (
            <form onSubmit={onSubmit} className="space-y-5">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <div className="mb-2 text-xs text-trackify-muted">Date</div>
                <Input type="date" value={form.date} onChange={onChange("date")} state={errors.date ? "error" : "default"} />
                {errors.date ? <div className="mt-1 text-xs text-trackify-muted">{errors.date}</div> : null}
              </div>
              <div>
                <div className="mb-2 text-xs text-trackify-muted">Start time</div>
                <Input type="time" value={form.start_time} onChange={onChange("start_time")} state={errors.start_time ? "error" : "default"} />
                {errors.start_time ? <div className="mt-1 text-xs text-trackify-muted">{errors.start_time}</div> : null}
              </div>
              <div>
                <div className="mb-2 text-xs text-trackify-muted">End time</div>
                <Input type="time" value={form.end_time} onChange={onChange("end_time")} state={errors.end_time ? "error" : "default"} />
                {errors.end_time ? <div className="mt-1 text-xs text-trackify-muted">{errors.end_time}</div> : null}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <div className="mb-2 text-xs text-trackify-muted">Break time (hours)</div>
                <Input
                  type="number"
                  min={0}
                  step={0.25}
                  value={form.break_time}
                  onChange={onChange("break_time")}
                  state={errors.break_time ? "error" : "default"}
                />
                {errors.break_time ? <div className="mt-1 text-xs text-trackify-muted">{errors.break_time}</div> : null}
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

            <div className="flex items-center gap-3">
              <Button type="submit" disabled={isSaving}>
                {editingId ? "Update entry" : "Create entry"}
              </Button>
              <Button type="button" variant="secondary" onClick={resetForm} disabled={isSaving}>
                Reset
              </Button>
            </div>
          </form>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-trackify-text">Work entries</div>
              <div className="mt-1 text-sm text-trackify-muted">Calculated values come from the backend</div>
            </div>
            <Button variant="secondary" type="button" onClick={() => refreshList()} disabled={isListLoading}>
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
            <div className="overflow-hidden rounded-control border border-trackify-border">
              <div className="grid grid-cols-[140px_160px_90px_120px_1fr_160px] gap-0 border-b border-trackify-border bg-trackify-bg px-4 py-3 text-xs font-medium text-trackify-muted">
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
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}

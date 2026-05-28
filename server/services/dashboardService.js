const { getSupabaseAdminClient } = require('../config/supabase');
const { HttpError } = require('../utils/httpError');

const asInt = (value) => {
  if (value === undefined || value === null || value === '') return NaN;
  const num = Number.parseInt(String(value), 10);
  return Number.isFinite(num) ? num : NaN;
};

const pad2 = (n) => String(n).padStart(2, '0');

const round2 = (num) => Math.round(num * 100) / 100;

const getMonthBounds = ({ month, year }) => {
  const m = month ?? new Date().getUTCMonth() + 1;
  const y = year ?? new Date().getUTCFullYear();

  if (!Number.isInteger(m) || m < 1 || m > 12) throw new HttpError('month must be 1-12', 400);
  if (!Number.isInteger(y) || y < 1970 || y > 2100) throw new HttpError('year must be 1970-2100', 400);

  const start = `${y}-${pad2(m)}-01`;
  const nextMonth = m === 12 ? 1 : m + 1;
  const nextYear = m === 12 ? y + 1 : y;
  const endExclusive = `${nextYear}-${pad2(nextMonth)}-01`;

  return { month: m, year: y, start, endExclusive };
};

const validateDateParam = (dateStr) => {
  const value = String(dateStr || '').trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new HttpError('date must be YYYY-MM-DD', 400);

  const parsed = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) {
    throw new HttpError('date must be a valid calendar date', 400);
  }

  return value;
};

const listEntriesInMonth = async ({ userId, month, year }) => {
  const { start, endExclusive } = getMonthBounds({ month, year });
  const supabase = getSupabaseAdminClient();

  const { data, error } = await supabase
    .from('work_entries')
    .select('id, date, total_hours, payable_hours, total_pay')
    .eq('user_id', userId)
    .gte('date', start)
    .lt('date', endExclusive);

  if (error) throw new HttpError(error.message, 400);
  return data || [];
};

const getMonthlySummary = async ({ userId, month, year }) => {
  const entries = await listEntriesInMonth({ userId, month, year });

  const summary = entries.reduce(
    (acc, row) => {
      acc.totalShifts += 1;
      acc.totalHours += Number(row.total_hours) || 0;
      acc.totalPayableHours += Number(row.payable_hours) || 0;
      acc.totalPay += Number(row.total_pay) || 0;
      return acc;
    },
    { totalShifts: 0, totalHours: 0, totalPayableHours: 0, totalPay: 0 }
  );

  return {
    totalShifts: summary.totalShifts,
    totalHours: round2(summary.totalHours),
    totalPayableHours: round2(summary.totalPayableHours),
    totalPay: round2(summary.totalPay),
  };
};

const getCalendarDates = async ({ userId, month, year }) => {
  const entries = await listEntriesInMonth({ userId, month, year });

  const byDate = new Map();
  for (const row of entries) {
    const date = row.date;
    const existing = byDate.get(date) || { date, shifts: 0 };
    existing.shifts += 1;
    byDate.set(date, existing);
  }

  return Array.from(byDate.values()).sort((a, b) => (a.date < b.date ? -1 : 1));
};

const getEntriesForDate = async ({ userId, date }) => {
  const validatedDate = validateDateParam(date);
  const supabase = getSupabaseAdminClient();

  const { data, error } = await supabase
    .from('work_entries')
    .select('id, date, start_time, end_time, total_hours, break_time, payable_hours, total_pay, meal_allowance, notes')
    .eq('user_id', userId)
    .eq('date', validatedDate)
    .order('start_time', { ascending: true });

  if (error) throw new HttpError(error.message, 400);
  return { date: validatedDate, workEntries: data || [] };
};

const parseMonthYearQuery = (query) => {
  const month = query.month !== undefined ? asInt(query.month) : undefined;
  const year = query.year !== undefined ? asInt(query.year) : undefined;
  return {
    month: month === undefined ? undefined : month,
    year: year === undefined ? undefined : year,
  };
};

module.exports = {
  getCalendarDates,
  getEntriesForDate,
  getMonthlySummary,
  parseMonthYearQuery,
};

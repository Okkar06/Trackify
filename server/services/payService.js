const { getSupabaseAdminClient } = require('../config/supabase');
const { HttpError } = require('../utils/httpError');

const asInt = (value) => {
  if (value === undefined || value === null || value === '') return NaN;
  const num = Number.parseInt(String(value), 10);
  return Number.isFinite(num) ? num : NaN;
};

const pad2 = (n) => String(n).padStart(2, '0');
const round2 = (num) => Math.round(num * 100) / 100;

const asString = (value) => {
  if (value === undefined || value === null) return '';
  return String(value).trim();
};

const validateMonthYear = ({ month, year }) => {
  if (!Number.isInteger(month) || month < 1 || month > 12) throw new HttpError('month must be 1-12', 400);
  if (!Number.isInteger(year) || year < 1970 || year > 2100) throw new HttpError('year must be 1970-2100', 400);
};

const validateYear = (year) => {
  if (!Number.isInteger(year) || year < 1970 || year > 2100) throw new HttpError('year must be 1970-2100', 400);
};

const validateDate = (value, label) => {
  const date = asString(value);
  if (!date) throw new HttpError(`${label} is required`, 400);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new HttpError(`${label} must be YYYY-MM-DD`, 400);
  return date;
};

const normalizeMonthlyRange = (value) => {
  const raw = String(value || '').trim().toLowerCase();
  if (!raw) return 'full';
  if (raw === 'first' || raw === '1-13' || raw === '1_13') return 'first';
  if (raw === 'second' || raw === '14-end' || raw === '14_end') return 'second';
  if (raw === 'full') return 'full';
  throw new HttpError('range must be one of: full, first, second', 400);
};

const getMonthBounds = ({ month, year, range }) => {
  validateMonthYear({ month, year });
  const normalizedRange = normalizeMonthlyRange(range);
  const start = `${year}-${pad2(month)}-01`;
  if (normalizedRange === 'first') {
    const endExclusive = `${year}-${pad2(month)}-14`;
    return { start, endExclusive };
  }
  if (normalizedRange === 'second') {
    const startSecond = `${year}-${pad2(month)}-14`;
    const nextMonth = month === 12 ? 1 : month + 1;
    const nextYear = month === 12 ? year + 1 : year;
    const endExclusive = `${nextYear}-${pad2(nextMonth)}-01`;
    return { start: startSecond, endExclusive };
  }
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  const endExclusive = `${nextYear}-${pad2(nextMonth)}-01`;
  return { start, endExclusive };
};

const getYearBounds = ({ year }) => {
  validateYear(year);
  const start = `${year}-01-01`;
  const endExclusive = `${year + 1}-01-01`;
  return { start, endExclusive };
};

const parseMonthlyQuery = (query) => {
  const month = asInt(query.month);
  const year = asInt(query.year);
  const range = query.range;
  const startDate = asString(query.startDate || query.start_date);
  const endDate = asString(query.endDate || query.end_date);
  return { month, year, range, startDate, endDate };
};

const parseYearlyQuery = (query) => {
  const year = asInt(query.year);
  return { year };
};

const aggregateTotals = (rows) => {
  return rows.reduce(
    (acc, row) => {
      acc.totalShifts += 1;
      acc.totalHours += Number(row.total_hours) || 0;
      acc.totalPayableHours += Number(row.payable_hours) || 0;
      acc.totalPay += Number(row.total_pay) || 0;
      return acc;
    },
    { totalShifts: 0, totalHours: 0, totalPayableHours: 0, totalPay: 0 }
  );
};

const getMonthlyPay = async ({ userId, month, year, range, startDate, endDate }) => {
  const supabase = getSupabaseAdminClient();

  const hasRange = Boolean(asString(startDate)) || Boolean(asString(endDate));
  if (hasRange) {
    const start = validateDate(startDate, 'startDate');
    const end = validateDate(endDate, 'endDate');
    if (end < start) throw new HttpError('endDate must be on or after startDate', 400);

    const { data, error } = await supabase
      .from('work_entries')
      .select('id, date, total_hours, payable_hours, total_pay')
      .eq('user_id', userId)
      .gte('date', start)
      .lte('date', end)
      .order('date', { ascending: true });

    if (error) throw new HttpError(error.message, 400);
    const rows = data || [];

    const totals = aggregateTotals(rows);

    const byDate = new Map();
    for (const row of rows) {
      const date = row.date;
      const existing = byDate.get(date) || {
        date,
        shifts: 0,
        totalHours: 0,
        totalPayableHours: 0,
        totalPay: 0,
      };
      existing.shifts += 1;
      existing.totalHours += Number(row.total_hours) || 0;
      existing.totalPayableHours += Number(row.payable_hours) || 0;
      existing.totalPay += Number(row.total_pay) || 0;
      byDate.set(date, existing);
    }

    const breakdown = Array.from(byDate.values())
      .sort((a, b) => (a.date < b.date ? -1 : 1))
      .map((d) => ({
        date: d.date,
        shifts: d.shifts,
        totalHours: round2(d.totalHours),
        totalPayableHours: round2(d.totalPayableHours),
        totalPay: round2(d.totalPay),
      }));

    return {
      period: { type: 'range', startDate: start, endDate: end },
      totals: {
        totalShifts: totals.totalShifts,
        totalHours: round2(totals.totalHours),
        totalPayableHours: round2(totals.totalPayableHours),
        totalPay: round2(totals.totalPay),
      },
      breakdown,
    };
  }

  const { start, endExclusive } = getMonthBounds({ month, year, range });
  const { data, error } = await supabase
    .from('work_entries')
    .select('id, date, total_hours, payable_hours, total_pay')
    .eq('user_id', userId)
    .gte('date', start)
    .lt('date', endExclusive)
    .order('date', { ascending: true });

  if (error) throw new HttpError(error.message, 400);
  const rows = data || [];

  const totals = aggregateTotals(rows);

  const byDate = new Map();
  for (const row of rows) {
    const date = row.date;
    const existing = byDate.get(date) || {
      date,
      shifts: 0,
      totalHours: 0,
      totalPayableHours: 0,
      totalPay: 0,
    };
    existing.shifts += 1;
    existing.totalHours += Number(row.total_hours) || 0;
    existing.totalPayableHours += Number(row.payable_hours) || 0;
    existing.totalPay += Number(row.total_pay) || 0;
    byDate.set(date, existing);
  }

  const breakdown = Array.from(byDate.values())
    .sort((a, b) => (a.date < b.date ? -1 : 1))
    .map((d) => ({
      date: d.date,
      shifts: d.shifts,
      totalHours: round2(d.totalHours),
      totalPayableHours: round2(d.totalPayableHours),
      totalPay: round2(d.totalPay),
    }));

  return {
    period: { type: 'month', month, year, range: normalizeMonthlyRange(range), startDate: start, endDateExclusive: endExclusive },
    totals: {
      totalShifts: totals.totalShifts,
      totalHours: round2(totals.totalHours),
      totalPayableHours: round2(totals.totalPayableHours),
      totalPay: round2(totals.totalPay),
    },
    breakdown,
  };
};

const getYearlyPay = async ({ userId, year }) => {
  const { start, endExclusive } = getYearBounds({ year });
  const supabase = getSupabaseAdminClient();

  const { data, error } = await supabase
    .from('work_entries')
    .select('id, date, total_hours, payable_hours, total_pay')
    .eq('user_id', userId)
    .gte('date', start)
    .lt('date', endExclusive)
    .order('date', { ascending: true });

  if (error) throw new HttpError(error.message, 400);
  const rows = data || [];

  const totals = aggregateTotals(rows);

  const byMonth = new Map();
  for (const row of rows) {
    const monthKey = String(row.date).slice(0, 7);
    const existing = byMonth.get(monthKey) || {
      month: monthKey,
      shifts: 0,
      totalHours: 0,
      totalPayableHours: 0,
      totalPay: 0,
    };
    existing.shifts += 1;
    existing.totalHours += Number(row.total_hours) || 0;
    existing.totalPayableHours += Number(row.payable_hours) || 0;
    existing.totalPay += Number(row.total_pay) || 0;
    byMonth.set(monthKey, existing);
  }

  const breakdown = Array.from(byMonth.values())
    .sort((a, b) => (a.month < b.month ? -1 : 1))
    .map((m) => ({
      month: m.month,
      shifts: m.shifts,
      totalHours: round2(m.totalHours),
      totalPayableHours: round2(m.totalPayableHours),
      totalPay: round2(m.totalPay),
    }));

  return {
    period: { type: 'year', year, startDate: start, endDateExclusive: endExclusive },
    totals: {
      totalShifts: totals.totalShifts,
      totalHours: round2(totals.totalHours),
      totalPayableHours: round2(totals.totalPayableHours),
      totalPay: round2(totals.totalPay),
    },
    breakdown,
  };
};

module.exports = {
  getMonthlyPay,
  getYearlyPay,
  parseMonthlyQuery,
  parseYearlyQuery,
};

const crypto = require('crypto');
const { requireEnv, openaiApiKey, openaiModel } = require('../config/env');
const { HttpError } = require('../utils/httpError');

const normalizeTime24 = (value) => {
  const text = String(value || '').trim();
  if (!text) return '';
  const match = text.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return '';
  const h = Number(match[1]);
  const m = Number(match[2]);
  if (!Number.isInteger(h) || !Number.isInteger(m)) return '';
  if (h < 0 || h > 23 || m < 0 || m > 59) return '';
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

const normalizeTime = (value) => {
  const text = String(value || '').trim();
  if (!text) return '';

  const direct = normalizeTime24(text);
  if (direct) return direct;

  const match = text.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)$/i);
  if (!match) return '';

  const rawH = Number(match[1]);
  const rawM = match[2] ? Number(match[2]) : 0;
  const meridiem = String(match[3] || '').toLowerCase();
  if (!Number.isInteger(rawH) || rawH < 1 || rawH > 12) return '';
  if (!Number.isInteger(rawM) || rawM < 0 || rawM > 59) return '';

  let h = rawH % 12;
  if (meridiem === 'pm') h += 12;
  return `${String(h).padStart(2, '0')}:${String(rawM).padStart(2, '0')}`;
};

const normalizeDate = (value) => {
  const text = String(value || '').trim();
  if (!text) return '';

  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    const parsed = new Date(`${text}T00:00:00Z`);
    if (Number.isNaN(parsed.getTime())) return '';
    if (parsed.toISOString().slice(0, 10) !== text) return '';
    return text;
  }

  const slash = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (slash) {
    const mm = Number(slash[1]);
    const dd = Number(slash[2]);
    let yyyy = Number(slash[3]);
    if (!Number.isInteger(mm) || !Number.isInteger(dd) || !Number.isInteger(yyyy)) return '';
    if (yyyy >= 0 && yyyy < 100) yyyy += 2000;
    if (mm < 1 || mm > 12) return '';
    if (dd < 1 || dd > 31) return '';
    const iso = `${String(yyyy).padStart(4, '0')}-${String(mm).padStart(2, '0')}-${String(dd).padStart(2, '0')}`;
    const parsed = new Date(`${iso}T00:00:00Z`);
    if (Number.isNaN(parsed.getTime())) return '';
    if (parsed.toISOString().slice(0, 10) !== iso) return '';
    return iso;
  }

  return '';
};

const parseModelJson = (text) => {
  const raw = String(text || '').trim();
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]);
    } catch {
      return null;
    }
  }
};

const normalizeStatus = (value) => {
  const text = String(value || '').trim().toLowerCase();
  if (text === 'working') return 'working';
  if (text === 'no_work') return 'no_work';
  return 'unclear';
};

const buildRosterPrompt = ({ employeeName }) => {
  return `You are reading a weekly work roster screenshot.

Extract schedule data only for this employee:
**${employeeName}**

## How the table works

* The target employee has one row in the table
* Each column corresponds to a date (there is usually a header with DAY like MON and a DATE like 4/6/2026)
* In the target employee row:

  * a shift like \`1PM-11PM\` means the employee works that day
  * the value like \`9.0\` beside that shift is the total work hours for that date
  * \`X\` means the employee does not work that day

## Your job

Find the target employee row and read across all visible date columns.

For each date column, return one entry:

* date
* day
* status
* shift_text
* start_time
* end_time
* total_hours
* notes

## Rules

* status = \"working\" if a shift exists
* status = \"no_work\" if the cell contains X
* status = \"unclear\" if the cell cannot be read confidently
* preserve the exact shift text
* normalize times into HH:MM if possible (24-hour)
* keep total_hours exactly as shown, such as \`9.0\` (leave blank for no_work)
* date must be YYYY-MM-DD if you can read the date header; if the header shows 4/6/2026 then convert it to 2026-04-06
* do not guess unclear values
* ignore all other employees

## Return JSON only

{
  \"employee_name\": \"${employeeName}\",
  \"entries\": [
    {
      \"date\": \"\",
      \"day\": \"\",
      \"status\": \"\",
      \"shift_text\": \"\",
      \"start_time\": \"\",
      \"end_time\": \"\",
      \"total_hours\": \"\",
      \"notes\": \"\"
    }
  ],
  \"summary_notes\": \"\"
}`;
};

// simple in-memory cache to reduce repeated calls when users retry the same image+name
const CACHE_TTL_MS = 2 * 60 * 1000; // 2 minutes
const rosterCache = new Map(); // key -> { ts, result }

const analyzeWorkImage = async ({ imageBuffer, mimeType, employeeName }) => {
  const apiKey = requireEnv('OPENAI_API_KEY', openaiApiKey);
  const model = openaiModel;

  // cache key based on image content + employee name + model
  let cacheKey = '';
  try {
    const hash = crypto.createHash('sha256').update(imageBuffer).digest('hex');
    cacheKey = `${hash}|${employeeName}|${model}`;
    const hit = rosterCache.get(cacheKey);
    if (hit && Date.now() - hit.ts < CACHE_TTL_MS) {
      return hit.result;
    }
  } catch {
    // ignore cache errors
  }

  const dataUrl = `data:${mimeType};base64,${imageBuffer.toString('base64')}`;

  const body = {
    model,
    temperature: 0,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content:
          'You extract weekly roster entries from a schedule table image. Output ONLY valid JSON that matches the requested schema. Do not include any extra text.',
      },
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: buildRosterPrompt({ employeeName }),
          },
          {
            type: 'image_url',
            image_url: { url: dataUrl },
          },
        ],
      },
    ],
  };

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const transient = new Set([408, 429, 500, 502, 503, 504, 524]);
  let res;
  for (let attempt = 1; attempt <= 5; attempt += 1) {
    res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(body),
    });
    if (res.ok) break;
    if (!transient.has(res.status) || attempt === 5) {
      if (res.status === 401 || res.status === 403) throw new HttpError('AI auth failed (invalid API key)', 502);
      if (res.status === 429) throw new HttpError('AI rate limited. Please wait and try again.', 429);
      throw new HttpError(`AI request failed (${res.status})`, 502);
    }
    const retryAfter = Number(res.headers.get('retry-after')) || 0;
    const baseDelay = retryAfter > 0 ? retryAfter * 1000 : 600 * attempt;
    const jitter = Math.floor(Math.random() * 200);
    await sleep(baseDelay + jitter);
  }

  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content;
  const parsed = parseModelJson(content);
  if (!parsed || typeof parsed !== 'object') {
    throw new HttpError('AI response was not valid JSON', 502);
  }

  const entriesRaw = Array.isArray(parsed.entries) ? parsed.entries : [];
  const entries = entriesRaw.map((e) => {
    const date = normalizeDate(e?.date);
    const day = String(e?.day || '').trim();
    const status = normalizeStatus(e?.status);
    const rawShiftText = String(e?.shift_text || '').trim();
    const rawTotalHours = String(e?.total_hours || '').trim();
    const notes = String(e?.notes || '').trim();

    if (status === 'no_work') {
      return {
        date,
        day,
        status,
        shift_text: rawShiftText || 'X',
        start_time: '',
        end_time: '',
        total_hours: '',
        notes,
      };
    }

    if (status === 'unclear') {
      return {
        date,
        day,
        status,
        shift_text: rawShiftText,
        start_time: '',
        end_time: '',
        total_hours: '',
        notes,
      };
    }

    const start_time = normalizeTime(e?.start_time);
    const end_time = normalizeTime(e?.end_time);
    return {
      date,
      day,
      status,
      shift_text: rawShiftText,
      start_time,
      end_time,
      total_hours: rawTotalHours,
      notes,
    };
  });

  const result = {
    employee_name: String(parsed.employee_name || employeeName || '').trim(),
    entries,
    summary_notes: String(parsed.summary_notes || '').trim(),
  };

  if (cacheKey) {
    rosterCache.set(cacheKey, { ts: Date.now(), result });
  }
  return result;
};

module.exports = {
  analyzeWorkImage,
};

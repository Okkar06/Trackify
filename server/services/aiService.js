const { requireEnv, openaiApiKey, openaiModel } = require('../config/env');
const { HttpError } = require('../utils/httpError');

const normalizeTime = (value) => {
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

const normalizeDate = (value) => {
  const text = String(value || '').trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return '';
  const parsed = new Date(`${text}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return '';
  if (parsed.toISOString().slice(0, 10) !== text) return '';
  return text;
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

const analyzeWorkImage = async ({ imageBuffer, mimeType }) => {
  const apiKey = requireEnv('OPENAI_API_KEY', openaiApiKey);
  const model = openaiModel;

  const dataUrl = `data:${mimeType};base64,${imageBuffer.toString('base64')}`;

  const body = {
    model,
    temperature: 0,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content:
          'You extract work shift details from a schedule image. Output ONLY valid JSON with keys: date, start_time, end_time, notes. date must be YYYY-MM-DD, times must be HH:MM in 24h. Use empty string for unknown values.',
      },
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text:
              'Extract the work shift details from this image. Return JSON with date, start_time, end_time, notes. If multiple shifts are present, choose the most prominent/first one.',
          },
          {
            type: 'image_url',
            image_url: { url: dataUrl },
          },
        ],
      },
    ],
  };

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new HttpError(`AI request failed (${res.status})`, 502);
  }

  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content;
  const parsed = parseModelJson(content);
  if (!parsed || typeof parsed !== 'object') {
    throw new HttpError('AI response was not valid JSON', 502);
  }

  return {
    date: normalizeDate(parsed.date),
    start_time: normalizeTime(parsed.start_time),
    end_time: normalizeTime(parsed.end_time),
    notes: String(parsed.notes || '').trim(),
  };
};

module.exports = {
  analyzeWorkImage,
};

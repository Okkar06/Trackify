const asString = (value) => {
  if (value === undefined || value === null) return '';
  return String(value).trim();
};

const nodeEnv = asString(process.env.NODE_ENV) || 'development';
const port = Number(process.env.PORT) || 4000;
const corsOrigin = asString(process.env.CORS_ORIGIN) || 'http://localhost:5173';

const supabaseUrl = asString(process.env.SUPABASE_URL);
const supabaseAnonKey = asString(process.env.SUPABASE_ANON_KEY);
const supabaseServiceRoleKey = asString(process.env.SUPABASE_SERVICE_ROLE_KEY);

const openaiApiKey = asString(process.env.OPENAI_API_KEY);
const openaiModel = asString(process.env.OPENAI_MODEL) || 'gpt-4o-mini';

const requireEnv = (name, value) => {
  if (!asString(value)) {
    const error = new Error(`Missing required environment variable: ${name}`);
    error.statusCode = 500;
    throw error;
  }

  return value;
};

module.exports = {
  corsOrigin,
  nodeEnv,
  openaiApiKey,
  openaiModel,
  port,
  requireEnv,
  supabaseAnonKey,
  supabaseServiceRoleKey,
  supabaseUrl,
};

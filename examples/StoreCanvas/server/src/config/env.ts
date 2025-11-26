import { z } from 'zod';

const envSchema = z.object({
  PORT: z.coerce.number().default(4000),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  AIWORKERS_BASE_URL: z.string().url(),
  AIWORKER_API_KEY: z.string(),
  BACKGROUND_MODEL_ID: z.string(),
  IMG2IMG_MODEL_ID: z.string(),
  INPAINT_MODEL_ID: z.string(),
  STYLE_LLM_MODEL_ID: z.string(),
  DB_PROVIDER: z.enum(['mongodb', 'postgres', 'supabase']),
  MONGODB_URI: z.string().optional(),
  DATABASE_URL: z.string().optional(),
  SUPABASE_DB_URL: z.string().optional(),
  STORAGE_PROVIDER: z.enum(['supabase', 'cloudflare_r2', 'aws_s3']),
  SUPABASE_STORAGE_BUCKET: z.string().optional(),
  SUPABASE_STORAGE_URL_BASE: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  R2_ACCOUNT_ID: z.string().optional(),
  R2_ACCESS_KEY_ID: z.string().optional(),
  R2_SECRET_ACCESS_KEY: z.string().optional(),
  R2_BUCKET: z.string().optional(),
  R2_PUBLIC_BASE_URL: z.string().optional(),
  AWS_REGION: z.string().optional(),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_S3_BUCKET: z.string().optional(),
  AWS_S3_PUBLIC_BASE_URL: z.string().optional(),
  SESSION_SECRET: z.string().min(8),
  RATE_LIMIT_MAX: z.coerce.number().default(100),
  RATE_LIMIT_WINDOW: z.coerce.number().default(60_000),
  JWT_SECRET: z.string().min(16),
  RESEND_API_KEY: z.string().optional(),
  RESEND_FROM_EMAIL: z.string().email().optional()
});

export type Env = z.infer<typeof envSchema>;

export const loadEnv = (): Env => {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    // surface first error for clarity
    const message = parsed.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join(', ');
    throw new Error(`Invalid environment configuration: ${message}`);
  }
  const env = parsed.data;

  if (env.DB_PROVIDER === 'mongodb' && !env.MONGODB_URI) {
    throw new Error('MONGODB_URI is required when DB_PROVIDER=mongodb');
  }
  if (env.DB_PROVIDER === 'postgres' && !env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required when DB_PROVIDER=postgres');
  }
  if (env.DB_PROVIDER === 'supabase' && !(env.SUPABASE_DB_URL || env.DATABASE_URL)) {
    throw new Error('SUPABASE_DB_URL or DATABASE_URL is required when DB_PROVIDER=supabase');
  }

  if (env.STORAGE_PROVIDER === 'cloudflare_r2') {
    if (!env.R2_ACCOUNT_ID || !env.R2_ACCESS_KEY_ID || !env.R2_SECRET_ACCESS_KEY || !env.R2_BUCKET) {
      throw new Error('R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, and R2_BUCKET are required for Cloudflare R2 storage');
    }
  }
  if (env.STORAGE_PROVIDER === 'aws_s3') {
    if (!env.AWS_REGION || !env.AWS_ACCESS_KEY_ID || !env.AWS_SECRET_ACCESS_KEY || !env.AWS_S3_BUCKET) {
      throw new Error('AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, and AWS_S3_BUCKET are required for AWS S3 storage');
    }
  }
  if (env.STORAGE_PROVIDER === 'supabase') {
    if (!env.SUPABASE_STORAGE_BUCKET || !env.SUPABASE_STORAGE_URL_BASE) {
      throw new Error('SUPABASE_STORAGE_BUCKET and SUPABASE_STORAGE_URL_BASE are required for Supabase storage');
    }
  }

  return env;
};

import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3001),
  JWT_SECRET: z.string().min(32).default('dev-jwt-secret-change-in-production-min-32-chars'),
  ENCRYPTION_KEY: z.string().min(32).default('dev-encryption-key-32-bytes-long!'),
  APP_URL: z.string().url().default('http://localhost:5000'),
  RESEND_API_KEY: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Environment validation failed:');
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;

// Warnings for optional services
if (!env.RESEND_API_KEY) {
  console.warn('⚠️  RESEND_API_KEY not configured - emails will be logged to console');
}

// Production safety checks
if (env.NODE_ENV === 'production') {
  if (env.JWT_SECRET.includes('dev-')) {
    throw new Error('JWT_SECRET must be changed in production');
  }
  if (env.ENCRYPTION_KEY.includes('dev-')) {
    throw new Error('ENCRYPTION_KEY must be changed in production');
  }
}

// Feature flags
export const features = {
  email: !!env.RESEND_API_KEY,
};

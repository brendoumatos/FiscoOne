export function requireEnv(name: string, fallback?: string): string {
  const value = process.env[name] || fallback;
  if (!value) {
    throw new Error(`Missing required env ${name}`);
  }
  return value;
}

export const E2E_API_URL = () => requireEnv('E2E_API_URL', 'http://localhost:3001');
export const E2E_COMPANY_ID = () => requireEnv('E2E_COMPANY_ID', 'e2e-company-id');
export const E2E_USER_TOKEN = () => requireEnv('E2E_USER_TOKEN', process.env.E2E_BYPASS_TOKEN || 'e2e-test-token');

export const PG_CONFIG = () => ({
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'password',
  host: process.env.POSTGRES_HOST || 'localhost',
  port: Number(process.env.POSTGRES_PORT || 5432),
  database: process.env.POSTGRES_DB || 'fiscoone_db',
  ssl: process.env.POSTGRES_SSL === 'true' ? { rejectUnauthorized: false } : false as any
});

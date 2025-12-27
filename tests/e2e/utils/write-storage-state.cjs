const fs = require('fs');
const path = require('path');

const baseURL = process.env.E2E_BASE_URL || 'http://localhost:5173';
const token = process.env.E2E_USER_TOKEN || process.env.E2E_BYPASS_TOKEN || 'e2e-test-token';
const companyId = process.env.E2E_COMPANY_ID || 'e2e-company-id';

const storage = {
  cookies: [],
  origins: [
    {
      origin: baseURL,
      localStorage: [
        { name: 'fiscoone_token', value: token },
        { name: 'fiscoone_user', value: JSON.stringify({ token, companyId, email: 'e2e@test' }) },
        { name: 'fiscoone_current_company_id', value: companyId }
      ]
    }
  ]
};

const outDir = path.join(process.cwd(), 'playwright', '.auth');
const outFile = path.join(outDir, 'user.json');

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(outFile, JSON.stringify(storage, null, 2));

console.log(`Storage state written to ${outFile}`);

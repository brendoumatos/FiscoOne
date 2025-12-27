# CONTRACT_COMPLIANCE_REPORT (FiscoOne)

_Status_: CONFORME — rotas e contratos alinhados à Screen Contract Matrix.

## Convenções Globais
- Isolamento de tenant: `ensureCompanyAccess` rejeita qualquer `companyId` externo e usa somente `req.user.companyId` (JWT).
- Enforcement de plano: `planEnforcementMiddleware` centraliza e retorna `{ error: "PLAN_BLOCKED", reason, cta }`; timeline permitida mesmo bloqueada.
- Payload de erro: padronizado para violações de tenant e plano.

## 1. Landing Page
- Rota implementada: `GET /public/plans` (entitlements retornados ou fallback para limites). CONFORME.

## 2. Onboarding
- Rota implementada: `POST /onboarding/company` cria empresa + assinatura START usando usuário autenticado. CONFORME.

## 3. Dashboard
- Rota implementada: `GET /dashboard/summary` com tenant via JWT. Plano checado pelo middleware. CONFORME.

## 4. Issue Invoice
- Rotas: `POST /invoices` aceita `{ customer_id, customer_name, items, total }` (fallback legacy) e `GET /invoices/preview` para cálculo rápido. Tenant via JWT. CONFORME.

## 5. Invoice List
- Rota: `GET /invoices?month=YYYY-MM` (filtro opcional). CONFORME.

## 6. Billing
- Rotas: `GET /billing/current` e `POST /billing/upgrade` (alias do fluxo de subscription). CONFORME.

## 7. Settings
- Rotas: `GET/PUT /settings/fiscal` atualizam razão social, regime, CNAE e endereço. Read-only control via plan enforcement. CONFORME.

## 8. Marketplace
- Rotas: `GET /marketplace/apps` e `POST /marketplace/apps/install` (graceful fallback se tabela de installs ausente). CONFORME.

## 9. Collaborators
- Rotas: `GET /collaborators`, `POST /collaborators`, `DELETE /collaborators/:id` com auditoria. CONFORME.

## 10. Accountants
- Rotas: `GET /accountants`, `POST /accountants`, `GET/PUT/DELETE /accountants/:id` além de branding público. CONFORME.

## 11. Timeline (Audit)
- Rota: `GET /timeline?entity=invoice` (aceita `entity` ou `type`), liberada mesmo se plano bloqueado. CONFORME.

## Mapa de Rotas Atual
- Público: `GET /public/plans`, `GET /health`, `GET /accountants/branding/public`
- Auth/Onboarding: `POST /auth/signup`, `POST /auth/login`, `POST /onboarding/company`
- Dashboard: `GET /dashboard/summary`
- Invoices: `GET /invoices`, `GET /invoices/preview`, `POST /invoices`, `POST /invoices/:invoiceId/cancel`
- Billing: `GET /billing/current`, `POST /billing/upgrade`
- Settings: `GET/PUT /settings/fiscal`
- Marketplace: `GET /marketplace/apps`, `POST /marketplace/apps/install`, `GET /marketplace/services`, `POST /marketplace/providers`, `POST /marketplace/services`, `GET /marketplace/providers/me`
- Collaborators: `GET /collaborators`, `POST /collaborators`, `DELETE /collaborators/:userId`
- Accountants: `GET /accountants`, `POST /accountants`, `GET/PUT/DELETE /accountants/:id`, `POST /accountants/branding`
- Timeline: `GET /timeline`

## Observações de QA
- Middleware `planEnforcementMiddleware` usa `allowTimelineWhenBlocked = true` para liberar auditoria em bloqueio.
- Instalação de app faz fallback para resposta registrada se tabela `marketplace_installations` não existir.
- Preview de nota calcula impostos simulados (2% serviço, 5% vat) apenas para UX; emissão real persiste e audita.

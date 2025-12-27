import { Router } from 'express';
import jwt from 'jsonwebtoken';

const DEMO_MODE = process.env.DEMO_MODE === 'true';
const DEMO_COMPANY_ID = process.env.DEMO_COMPANY_ID || 'demo-company-id';
const JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

const issueDemoToken = () => {
    return jwt.sign(
        {
            id: 'demo-user-id',
            name: 'Usuário Demonstração',
            role: 'CLIENT',
            companyId: DEMO_COMPANY_ID,
            demo: true
        },
        JWT_SECRET,
        { expiresIn: '2h' }
    );
};

const router = Router();

const demoPlanState = {
    companyId: DEMO_COMPANY_ID,
    plan: {
        code: 'ESSENTIAL',
        name: 'Essencial (Demo)',
        priceMonthly: 49,
        priceYearly: 499
    },
    status: 'ACTIVE',
    usage: {
        invoices: { used: 2, limit: 5 },
        seats: { used: 1, limit: 1 },
        accountants: { used: 0, limit: 1 }
    },
    expiration: null,
    reason: null,
    cta: 'UPGRADE',
    planCode: 'ESSENTIAL',
    limits: {
        invoices: 5,
        seats: 1,
        accountants: 1
    }
};

const demoInvoices = [
    { id: 'inv-demo-001', number: 'FIS-1001', amount: 1200.5, status: 'ISSUED', issueDate: '2025-01-02T10:00:00Z', borrower: 'Cliente Alpha' },
    { id: 'inv-demo-002', number: 'FIS-1002', amount: 890.0, status: 'ISSUED', issueDate: '2025-01-08T15:23:00Z', borrower: 'Cliente Beta' },
    { id: 'inv-demo-003', number: 'FIS-1003', amount: 420.75, status: 'PROCESSING', issueDate: '2025-01-12T09:10:00Z', borrower: 'Cliente Gama' }
];

const demoTimeline = [
    { id: 'evt-demo-001', type: 'INVOICE_ISSUED', title: 'Nota fiscal emitida', description: 'FIS-1001 emitida com sucesso.', createdAt: '2025-01-02T10:00:00Z' },
    { id: 'evt-demo-002', type: 'PLAN_USAGE', title: 'Uso de notas', description: 'Você usou 40% do limite de notas.', createdAt: '2025-01-08T15:30:00Z' },
    { id: 'evt-demo-003', type: 'ALERT', title: 'Validação fiscal preventiva', description: 'Detectamos divergência comum em CFOP; revise antes de enviar.', createdAt: '2025-01-12T09:15:00Z' }
];

router.use((req, res, next) => {
    if (!DEMO_MODE) {
        return res.status(404).json({ message: 'Demo mode desabilitado' });
    }
    if (req.method !== 'GET') {
        return res.status(403).json({ error: 'DEMO_READ_ONLY', message: 'Modo demo é somente leitura.' });
    }
    return next();
});

router.get('/status', (_req, res) => {
    res.json({ demo: true, message: 'Demo mode ativo', companyId: demoPlanState.companyId });
});

router.get('/session', (_req, res) => {
    const token = issueDemoToken();
    res.json({
        demo: true,
        user: { id: 'demo-user-id', name: 'Usuário Demonstração', role: 'CLIENT' },
        company: { id: demoPlanState.companyId, name: 'Demo Company', plan: demoPlanState.plan.code },
        planState: demoPlanState,
        token,
        resetHint: 'Dados de demonstração são reiniciados periodicamente.'
    });
});

router.get('/plan-state', (_req, res) => {
    res.json(demoPlanState);
});

router.get('/invoices', (_req, res) => {
    res.json(demoInvoices);
});

router.get('/timeline', (_req, res) => {
    res.json(demoTimeline);
});

export default router;

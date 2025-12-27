export const PLAN_COPY = {
    states: {
        ACTIVE: "Plano ativo",
        WARNING: "Aproximando do limite",
        GRACE: "Pagamento pendente",
        BLOCKED: "Plano bloqueado",
        EXPIRED: "Plano bloqueado",
    },
    warnings: {
        NEAR_LIMIT: "Atenção: próximo ao limite do plano.",
        GRACE: "Plano em carência: ações permitidas com cautela.",
    },
    blocked: {
        GENERIC: "Ação bloqueada pelo plano.",
        LIMIT: "Limite atingido. Operação desativada até regularizar.",
        PAYMENT: "Pagamento pendente. Regularize para liberar as ações.",
    },
    cta: {
        UPGRADE_PLAN: "Fazer upgrade",
        REGULARIZE_PAYMENT: "Regularizar pagamento",
        SEE_OPTIONS: "Ver opções",
        BILLING: "Ir para Billing",
    },
    banners: {
        DEMO: "Modo demonstração: ações não persistem e usam adaptadores locais.",
        GRACE: "Plano em carência ou próximo ao limite. Ações permitidas com cautela.",
    }
};

import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, Ban, Inbox, Info, ShieldAlert, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type ScreenStateType = "empty" | "first-use" | "near-limit" | "blocked" | "error" | "tenant";

export type ScreenStateAction = {
    label: string;
    onClick?: () => void;
    to?: string;
    disabled?: boolean;
    variant?: "default" | "outline" | "secondary";
};

const STATE_COPY: Record<ScreenStateType, { title: string; description: string; icon: any }> = {
    empty: {
        title: "Nada aqui ainda",
        description: "Sem registros para mostrar. Adicione um item para começar.",
        icon: Inbox,
    },
    "first-use": {
        title: "Primeira vez por aqui",
        description: "Vamos configurar e registrar o primeiro dado para liberar o fluxo.",
        icon: Sparkles,
    },
    "near-limit": {
        title: "Próximo ao limite",
        description: "Consumo acima de 80%. Reforce o plano para evitar bloqueio.",
        icon: AlertTriangle,
    },
    blocked: {
        title: "Plano bloqueado",
        description: "Ações estão em modo leitura até regularizar o plano ou pagamento.",
        icon: Ban,
    },
    error: {
        title: "Erro ao carregar",
        description: "Não conseguimos carregar os dados. Tente novamente ou contate o suporte.",
        icon: ShieldAlert,
    },
    tenant: {
        title: "Violação de tenant",
        description: "O contexto da empresa não está válido. Refaça a seleção da empresa ou faça login novamente.",
        icon: ShieldAlert,
    },
};

const STATE_TONE: Record<ScreenStateType, { bg: string; border: string; text: string; icon: string }> = {
    empty: { bg: "bg-slate-50", border: "border-slate-200", text: "text-slate-700", icon: "text-slate-500" },
    "first-use": { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-800", icon: "text-emerald-600" },
    "near-limit": { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-800", icon: "text-amber-700" },
    blocked: { bg: "bg-red-50", border: "border-red-200", text: "text-red-800", icon: "text-red-700" },
    error: { bg: "bg-red-50", border: "border-red-200", text: "text-red-800", icon: "text-red-700" },
    tenant: { bg: "bg-indigo-50", border: "border-indigo-200", text: "text-indigo-800", icon: "text-indigo-700" },
};

export function ScreenState({
    state,
    title,
    description,
    action,
    secondaryAction,
    inline = false,
    className,
    meta,
    children,
}: {
    state: ScreenStateType;
    title?: string;
    description?: string;
    action?: ScreenStateAction;
    secondaryAction?: ScreenStateAction;
    inline?: boolean;
    className?: string;
    meta?: ReactNode;
    children?: ReactNode;
}) {
    const defaults = STATE_COPY[state];
    const tone = STATE_TONE[state];
    const Icon = (state === "first-use" ? Sparkles : defaults.icon) || Info;

    const content = (
        <div className="flex flex-col sm:flex-row sm:items-start gap-3">
            <div className={cn("h-10 w-10 rounded-lg border flex items-center justify-center", tone.border, tone.bg)}>
                <Icon className={cn("h-5 w-5", tone.icon)} />
            </div>
            <div className="space-y-2 flex-1">
                <div>
                    <p className={cn("text-base font-semibold", tone.text)}>{title || defaults.title}</p>
                    <p className={cn("text-sm", tone.text)}>{description || defaults.description}</p>
                </div>
                {meta}
                {children}
                {(action || secondaryAction) && (
                    <div className="flex flex-wrap gap-2 pt-1">
                        {action && <StateActionButton action={action} />}
                        {secondaryAction && <StateActionButton action={secondaryAction} variantOverride="outline" />}
                    </div>
                )}
            </div>
        </div>
    );

    if (inline) {
        return (
            <div className={cn("rounded-lg border p-3", tone.bg, tone.border, className)}>
                {content}
            </div>
        );
    }

    return (
        <Card className={cn("border", tone.border, tone.bg, className)}>
            <CardContent className="py-4">{content}</CardContent>
        </Card>
    );
}

function StateActionButton({ action, variantOverride }: { action: ScreenStateAction; variantOverride?: "default" | "outline" | "secondary"; }) {
    const { label, onClick, to, disabled, variant } = action;
    const resolvedVariant = variantOverride || variant || "default";
    if (to) {
        return (
            <Link to={to} className={disabled ? "pointer-events-none opacity-60" : ""}>
                <Button size="sm" variant={resolvedVariant} onClick={onClick} disabled={disabled}>
                    {label}
                </Button>
            </Link>
        );
    }
    return (
        <Button size="sm" variant={resolvedVariant} onClick={onClick} disabled={disabled}>
            {label}
        </Button>
    );
}

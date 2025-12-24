import { Badge } from "@/components/ui/badge";

interface PlanBadgeProps {
    planCode?: string;
    planName?: string;
}

export function PlanBadge({ planCode, planName }: PlanBadgeProps) {
    if (!planCode) return null;

    let color = "bg-slate-100 text-slate-800";
    if (planCode === 'BASIC') color = "bg-blue-100 text-blue-800";
    if (planCode === 'PRO') color = "bg-purple-100 text-purple-800";
    if (planCode === 'ENTERPRISE') color = "bg-emerald-100 text-emerald-800";

    return (
        <Badge variant="secondary" className={`${color} hover:${color} transition-all`}>
            {planName || planCode}
        </Badge>
    );
}

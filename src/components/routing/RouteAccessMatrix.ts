export type RouteAccessRule = {
    pattern: RegExp;
    readOnlyOnBlocked?: boolean;
};

const RULES: RouteAccessRule[] = [
    { pattern: /^\/dashboard\/invoices\/issue/, readOnlyOnBlocked: false },
    { pattern: /^\/dashboard\/settings\/billing\/upgrade/, readOnlyOnBlocked: false },
    { pattern: /^\/dashboard\/settings\/team/, readOnlyOnBlocked: false },
    // default fallback rule handled in resolver
];

export function resolveRouteAccess(pathname: string): { readOnlyOnBlocked: boolean } {
    const match = RULES.find((rule) => rule.pattern.test(pathname));
    return { readOnlyOnBlocked: match?.readOnlyOnBlocked ?? true };
}

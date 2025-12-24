import React from 'react';
import { cn } from '@/lib/utils';

interface BrandEmblemProps {
    className?: string;
}

export const BrandEmblem: React.FC<BrandEmblemProps> = ({ className }) => {
    return (
        <div className={cn("fixed bottom-6 right-6 z-0 pointer-events-none select-none opacity-[0.03] dark:opacity-[0.05]", className)}>
            <svg width="400" height="100" viewBox="0 0 400 100" fill="currentColor" xmlns="http://www.w3.org/2000/svg" className="text-foreground">
                <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" fontSize="60" fontWeight="900" letterSpacing="0.1em" style={{ fontFamily: 'Inter, sans-serif' }}>
                    FISCOONE
                </text>
            </svg>
        </div>
    );
};

export const PoweredByBadge: React.FC<{ className?: string }> = ({ className }) => {
    return (
        <div className={cn("flex items-center justify-center gap-1.5 opacity-40 hover:opacity-80 transition-opacity", className)}>
            <span className="text-[10px] uppercase font-semibold tracking-widest text-muted-foreground">Powered by</span>
            <span className="text-xs font-black tracking-tighter text-foreground bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-teal-600">
                FISCOONE
            </span>
        </div>
    );
};

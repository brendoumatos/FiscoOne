import React from 'react';
import { cn } from '@/lib/utils';

interface BrandPendantProps {
    className?: string;
}

export const BrandPendant: React.FC<BrandPendantProps> = ({ className }) => {
    return (
        <div className={cn(
            "absolute top-0 left-1/2 -translate-x-1/2 z-50",
            "flex flex-col items-center",
            className
        )}>
            {/* The string/cord */}
            <div className="w-[2px] h-4 bg-gradient-to-b from-border to-emerald-500/50"></div>

            {/* The Pendant/Tag */}
            <div className={cn(
                "bg-card border border-emerald-500/20 shadow-[0_0_15px_-3px_rgba(16,185,129,0.15)]",
                "px-4 py-1.5 rounded-b-xl rounded-t-sm",
                "flex items-center gap-2",
                "backdrop-blur-md bg-opacity-90 dark:bg-opacity-90"
            )}>
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                <span className="text-[10px] font-black tracking-[0.2em] text-foreground uppercase bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-teal-500">
                    FISCOONE
                </span>
            </div>
        </div>
    );
};

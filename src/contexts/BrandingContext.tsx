import React, { createContext, useContext, useEffect, useState } from 'react';
import { accountantService, type BrandingSettings } from '@/services/accountant';

interface BrandingContextType {
    branding: BrandingSettings | null;
    isLoading: boolean;
}

const BrandingContext = createContext<BrandingContextType>({ branding: null, isLoading: true });

export const useBranding = () => useContext(BrandingContext);

export function BrandingProvider({ children }: { children: React.ReactNode }) {
    const [branding, setBranding] = useState<BrandingSettings | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadBranding = async () => {
            const domain = window.location.hostname; // e.g., 'portal.contabilidade.com'
            // For dev, we might mock or skip if 'localhost'
            if (domain.includes('localhost')) {
                // Determine if we want to simulate a tenant in dev
                // setBranding({ primary_color: '#EF4444', secondary_color: '#000', logo_url: '', company_name_display: 'Dev Tenant' });
                setIsLoading(false);
                return;
            }

            const data = await accountantService.getPublicBranding(domain);
            if (data && !data.isDefault) {
                setBranding(data);
                // Apply CSS Variables dynamically
                document.documentElement.style.setProperty('--primary', data.primary_color);
                // We might need to handle HSL conversion if using Tailwind's variable system fully
            }
            setIsLoading(false);
        };

        loadBranding();
    }, []);

    return (
        <BrandingContext.Provider value={{ branding, isLoading }}>
            {children}
        </BrandingContext.Provider>
    );
}

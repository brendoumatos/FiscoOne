import { createContext, useContext, useState, type ReactNode } from 'react';

interface CertificateData {
    name: string;
    expiry: string;
    issuer: string;
    file?: File; // Monitor the real file
    data?: ArrayBuffer; // The binary content
}

interface CertificateContextType {
    certificate: CertificateData | null;
    uploadCertificate: (file: File, pass: string) => Promise<void>;
    revokeCertificate: () => void;
    isLoading: boolean;
}

const CertificateContext = createContext<CertificateContextType | undefined>(undefined);

export function CertificateProvider({ children }: { children: ReactNode }) {
    const [certificate, setCertificate] = useState<CertificateData | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const uploadCertificate = async (file: File, _pass: string) => {
        setIsLoading(true);
        try {
            // Real file reading
            const buffer = await file.arrayBuffer();

            // TODO: In a real implementation with a backend or WebAssembly (forge),
            // we would validate the password and extract the CN / Expiry here.
            // For now, we simulate extraction but store the REAL file.

            // Mock extraction delay
            await new Promise(resolve => setTimeout(resolve, 1500));

            setCertificate({
                name: "EMPRESA REAL LTDA (Simulado)",
                expiry: "2025-12-31",
                issuer: "Certificado A1 (Browser Loaded)",
                file: file,
                data: buffer
            });
        } catch (error) {
            console.error("Erro ao ler certificado", error);
        } finally {
            setIsLoading(false);
        }
    };

    const revokeCertificate = () => {
        setCertificate(null);
    };

    return (
        <CertificateContext.Provider value={{ certificate, uploadCertificate, revokeCertificate, isLoading }}>
            {children}
        </CertificateContext.Provider>
    );
}

export function useCertificate() {
    const context = useContext(CertificateContext);
    if (context === undefined) {
        throw new Error('useCertificate must be used within a CertificateProvider');
    }
    return context;
}

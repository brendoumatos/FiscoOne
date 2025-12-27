import api from "./api";

export interface FiscalConfig {
    regime: string;
    cnae: string;
    stateInscription: string;
    municipalInscription: string;
    environment: string;
    updatedAt?: string;
    updatedBy?: string;
}

export const fiscalService = {
    async getConfig(): Promise<FiscalConfig> {
        const { data } = await api.get("/settings/fiscal");
        return data;
    },
    async updateConfig(payload: Partial<FiscalConfig>): Promise<FiscalConfig> {
        const { data } = await api.put("/settings/fiscal", payload);
        return data;
    }
};

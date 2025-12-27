import type { AxiosError } from "axios";

export type ApiError = {
    code?: string;
    message?: string;
    status?: number;
};

export function parseApiError(error: unknown): ApiError {
    const axiosErr = error as AxiosError<any>;
    const data = axiosErr?.response?.data as any;
    const code = data?.error || data?.code;
    const message = data?.reason || data?.message || axiosErr?.message;
    const status = axiosErr?.response?.status;
    return { code, message, status };
}

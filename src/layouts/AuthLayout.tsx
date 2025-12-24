
import { Outlet } from "react-router-dom";

export default function AuthLayout() {
    return (
        <div className="min-h-screen grid lg:grid-cols-2">
            <div className="flex items-center justify-center p-8 bg-background">
                <div className="mx-auto w-full max-w-sm space-y-6">
                    <Outlet />
                </div>
            </div>
            <div className="hidden lg:block bg-muted relative">
                <div className="absolute inset-0 bg-zinc-900 border-l border-white/10" />
                <div className="relative z-20 flex items-center h-full p-10 text-white">
                    <div>
                        <h2 className="text-3xl font-bold">FiscoOne Platform</h2>
                        <p className="mt-4 text-zinc-300">
                            Simplify your tax management and focus on your business growth.
                            Secure, fast, and compliant.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

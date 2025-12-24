
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from "react-router-dom"
import { AuthProvider, useAuth } from "@/contexts/AuthContext"
import { ThemeProvider } from "@/contexts/ThemeContext"
import { Toaster } from "@/components/ui/toaster"

import MainLayout from "@/layouts/MainLayout"
import { CertificateProvider } from "@/contexts/CertificateContext"

// Pages
import Login from "@/pages/auth/Login"
import Signup from "@/pages/auth/Signup"
import LandingPage from "@/pages/landing/LandingPage"
import Dashboard from "@/pages/dashboard"
import OnboardingWizard from "@/pages/onboarding/OnboardingWizard"
import InvoiceList from "@/pages/invoices/InvoiceList"
import IssueInvoice from "@/pages/invoices/IssueInvoice"
import TaxesMain from "@/pages/taxes/TaxesMain"
import DocumentLibrary from "@/pages/documents/DocumentLibrary"
import ClientsList from "@/pages/accountant/ClientsList"
import Chat from "@/pages/chat/Chat"
import RecurrenceList from "@/pages/recurrence/RecurrenceList"
import ExpenseList from "@/pages/expenses/ExpenseList"
import PartnerMarketplace from "@/pages/partners/PartnerMarketplace"
import Settings from "@/pages/settings/Settings"

const queryClient = new QueryClient()

function ProtectedRoute() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" replace />;
  }

  // Enforce Company Onboarding
  if (!user?.companyId && location.pathname !== "/onboarding") {
    return <Navigate to="/onboarding" replace />;
  }

  // Prevent accessing Onboarding if already has company
  if (user?.companyId && location.pathname === "/onboarding") {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}

import { BrandingProvider } from "@/contexts/BrandingContext"
import { SubscriptionProvider } from "@/contexts/SubscriptionContext"
import TimelinePage from "@/pages/dashboard/timeline/index"
import MarketplacePage from "@/pages/dashboard/marketplace/index"
import AccountantSettings from "@/pages/dashboard/accountant/Settings"
import ReferralDashboard from "@/pages/dashboard/referral/index"

// ...

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
          <BrandingProvider>
            <CertificateProvider>
              <AuthProvider>
                <SubscriptionProvider>
                  <Routes>
                    <Route path="/" element={<LandingPage />} />

                    <Route path="/auth/login" element={<Login />} />
                    <Route path="/auth/signup" element={<Signup />} />

                    <Route element={<ProtectedRoute />}>
                      {/* Onboarding - Standalone Page */}
                      <Route path="/onboarding" element={<OnboardingWizard />} />

                      {/* Main App - With Sidebar/Header */}
                      <Route path="/dashboard" element={<MainLayout />}>
                        <Route index element={<Dashboard />} />
                        <Route path="invoices" element={<InvoiceList />} />
                        <Route path="invoices/issue" element={<IssueInvoice />} />
                        <Route path="taxes" element={<TaxesMain />} />
                        <Route path="documents" element={<DocumentLibrary />} />
                        <Route path="accountant" element={<ClientsList />} />
                        <Route path="chat" element={<Chat />} />
                        <Route path="recurrence" element={<RecurrenceList />} />
                        <Route path="expenses" element={<ExpenseList />} />
                        <Route path="partners" element={<PartnerMarketplace />} />
                        <Route path="settings" element={<Settings />} />

                        {/* New Features */}
                        <Route path="marketplace" element={<MarketplacePage />} />
                        <Route path="timeline" element={<TimelinePage />} />
                        <Route path="referral" element={<ReferralDashboard />} />
                        <Route path="accountant/settings" element={<AccountantSettings />} />
                      </Route>
                    </Route>
                  </Routes>
                  <Toaster />
                </SubscriptionProvider>
              </AuthProvider>
            </CertificateProvider>
          </BrandingProvider>
        </ThemeProvider>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthForm } from "@/components/auth/AuthForm";
import { AuthProvider, useAuth } from "@/components/auth/AuthProvider";
import Dashboard from "@/pages/Dashboard";
import ScanResults from "@/pages/ScanResults";
import ScanHistory from "@/pages/ScanHistory";
import CustomScan from "@/pages/CustomScan";
import ScriptScan from "@/pages/ScriptScan";
import ScheduledScans from "@/pages/ScheduledScans";
import Landing from "@/pages/Landing";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { session, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!session) {
    return <Navigate to="/auth" replace state={{ from: location }} />;
  }

  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/auth" element={<AuthForm />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/custom"
              element={
                <ProtectedRoute>
                  <CustomScan />
                </ProtectedRoute>
              }
            />
            <Route
              path="/script"
              element={
                <ProtectedRoute>
                  <ScriptScan />
                </ProtectedRoute>
              }
            />
            <Route
              path="/scan/:scanId"
              element={
                <ProtectedRoute>
                  <ScanResults />
                </ProtectedRoute>
              }
            />
            <Route
              path="/history"
              element={
                <ProtectedRoute>
                  <ScanHistory />
                </ProtectedRoute>
              }
            />
            <Route
              path="/scheduled"
              element={
                <ProtectedRoute>
                  <ScheduledScans />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
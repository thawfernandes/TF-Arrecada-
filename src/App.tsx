// ============================================================
// TF Arrecada+ | App Router
// Configuração centralizada de rotas e guards do sistema
// ============================================================

import { Routes, Route } from 'react-router-dom';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { LicenseExpiredPage } from './pages/LicenseExpiredPage';
import { OnboardingPage } from './pages/OnboardingPage';
import { ClientDashboardPage } from './pages/ClientDashboardPage';
import { CampaignPublicPage } from './pages/CampaignPublicPage';
import { NotFoundPage } from './pages/NotFoundPage';

// Painel TF Hub
import { TFHubDashboardPage } from './pages/tfhub/TFHubDashboardPage';
import { TFHubClientsPage } from './pages/tfhub/TFHubClientsPage';
import { TFHubLicensesPage } from './pages/tfhub/TFHubLicensesPage';
import { TFHubCampaignsPage } from './pages/tfhub/TFHubCampaignsPage';

// Route Guards
import { ProtectedRoute } from './components/ProtectedRoute';
import { TFHubRoute } from './components/TFHubRoute';

export default function App() {
  return (
    <Routes>
      {/* ── Rotas Públicas ── */}
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/licenca-expirada" element={<LicenseExpiredPage />} />
      <Route path="/campanha/:shareCode" element={<CampaignPublicPage />} />

      {/* ── Rotas Protegidas do Cliente ── */}
      <Route
        path="/onboarding"
        element={
          <ProtectedRoute>
            <OnboardingPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <ClientDashboardPage />
          </ProtectedRoute>
        }
      />

      {/* ── Rotas Protegidas do TF Hub (Admin) ── */}
      <Route
        path="/tfhub"
        element={
          <TFHubRoute>
            <TFHubDashboardPage />
          </TFHubRoute>
        }
      />
      <Route
        path="/tfhub/clientes"
        element={
          <TFHubRoute>
            <TFHubClientsPage />
          </TFHubRoute>
        }
      />
      <Route
        path="/tfhub/licencas"
        element={
          <TFHubRoute>
            <TFHubLicensesPage />
          </TFHubRoute>
        }
      />
      <Route
        path="/tfhub/campanhas"
        element={
          <TFHubRoute>
            <TFHubCampaignsPage />
          </TFHubRoute>
        }
      />

      {/* ── 404 Not Found ── */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

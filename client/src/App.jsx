import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Navbar } from './components/layout/Navbar';
import { BottomNav } from './components/layout/BottomNav';
import { EmergencyModal } from './components/common/EmergencyModal';

// Pages
import { HomePage } from './modules/home/HomePage';
import { MonikaChatPage } from './modules/monika-ai/MonikaChatPage';
import { ReceptionPage } from './modules/reception/ReceptionPage';
import { BloodBankPage } from './modules/bloodbank/BloodBankPage';
import { CoordinationPage } from './modules/coordination/CoordinationPage';
import { DiagnosticsPage } from './modules/diagnostics/DiagnosticsPage';
import { InventoryPage } from './modules/inventory/InventoryPage';
import { ReferralPage } from './modules/referral/ReferralPage';
import { InsurancePage } from './modules/insurance/InsurancePage';
import { PatientHistoryPage } from './modules/patient-history/PatientHistoryPage';
import { RemindersPage } from './modules/reminders/RemindersPage';
import { LoginPage } from './modules/auth/LoginPage';
import { RegisterPage } from './modules/auth/RegisterPage';

export default function App() {
  const [isAmbulanceModalOpen, setIsAmbulanceModalOpen] = useState(false);
  const [ambulanceInitialReason, setAmbulanceInitialReason] = useState('');

  const handleOpenAmbulanceWithReason = (reason) => {
    setAmbulanceInitialReason(reason);
    setIsAmbulanceModalOpen(true);
  };

  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 pb-20 lg:pb-8">
          {/* Top Navbar */}
          <Navbar onOpenAmbulanceModal={() => {
            setAmbulanceInitialReason('');
            setIsAmbulanceModalOpen(true);
          }} />

          {/* Main Content Area */}
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
            <Routes>
              <Route path="/" element={<HomePage onOpenAmbulanceModal={() => {
                setAmbulanceInitialReason('');
                setIsAmbulanceModalOpen(true);
              }} />} />
              <Route
                path="/monika"
                element={
                  <MonikaChatPage
                    onOpenAmbulanceWithReason={handleOpenAmbulanceWithReason}
                  />
                }
              />
              <Route path="/reception" element={<ReceptionPage />} />
              <Route path="/bloodbank" element={<BloodBankPage />} />
              <Route
                path="/coordination"
                element={
                  <CoordinationPage
                    onOpenAmbulanceModal={() => {
                      setAmbulanceInitialReason('');
                      setIsAmbulanceModalOpen(true);
                    }}
                  />
                }
              />
              <Route path="/diagnostics" element={<DiagnosticsPage />} />
              <Route path="/inventory" element={<InventoryPage />} />
              <Route path="/referrals" element={<ReferralPage />} />
              <Route path="/insurance" element={<InsurancePage />} />
              <Route path="/history" element={<PatientHistoryPage />} />
              <Route path="/reminders" element={<RemindersPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>

          {/* Bottom Navigation for Mobile Devices */}
          <BottomNav />

          {/* Global Emergency 1-Tap Ambulance Modal */}
          <EmergencyModal
            isOpen={isAmbulanceModalOpen}
            onClose={() => setIsAmbulanceModalOpen(false)}
            initialReason={ambulanceInitialReason}
          />
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

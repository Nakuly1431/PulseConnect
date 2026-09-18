import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import EmergencyBanner from './components/EmergencyBanner';
import AcceptorPage from './components/AcceptorPage';
import DonorPage from './components/DonorPage';
import RequestStatusTracker from './components/RequestStatusTracker';
import AuthPage from './components/AuthPage';
import SOSModal from './components/SOSModal';
import ProfileDrawer from './components/ProfileDrawer';
import { api } from './services/api';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AlertCircle, CheckCircle2, Heart } from 'lucide-react';

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

function AppContent() {
  // Navigation View State: 'acceptor' | 'donor' | 'tracker' | 'login' | 'register'
  const [currentView, setCurrentView] = useState('acceptor');
  const { user, isAuthenticated } = useAuth();

  // State
  const [donors, setDonors] = useState([]);
  const [emergencies, setEmergencies] = useState([]);
  const [stats, setStats] = useState(null);
  const [isLiveServer, setIsLiveServer] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Search Filters for Acceptor Portal
  const [selectedBloodGroup, setSelectedBloodGroup] = useState('All');
  const [radiusKm, setRadiusKm] = useState(15);
  const [searchQuery, setSearchQuery] = useState('');
  const [onlyAvailable, setOnlyAvailable] = useState(true);

  // User / Donor State
  const [isAvailable, setIsAvailable] = useState(true);
  const [currentDonor, setCurrentDonor] = useState(null);

  // Modals & Drawers
  const [isSOSModalOpen, setIsSOSModalOpen] = useState(false);
  const [isProfileDrawerOpen, setIsProfileDrawerOpen] = useState(false);
  const [dismissedBanner, setDismissedBanner] = useState(false);

  // Toast Notifications
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  // Load Data
  const loadData = useCallback(async () => {
    try {
      // 1. Fetch Donors
      const { data: donorList, isLive } = await api.searchDonors({
        blood_group: selectedBloodGroup,
        radius_km: radiusKm,
        only_available: onlyAvailable,
        locality: searchQuery,
        lat: 12.9716,
        lng: 77.5946
      });
      const safeDonors = Array.isArray(donorList) ? donorList : [];
      setDonors(safeDonors);
      setIsLiveServer(isLive);

      // 2. Fetch Emergencies
      const { data: emergencyList } = await api.fetchActiveSOS(12.9716, 77.5946);
      const safeEmergencies = Array.isArray(emergencyList) ? emergencyList : [];
      setEmergencies(safeEmergencies);

      // 3. Fetch Stats
      const { data: statsData } = await api.fetchStats();
      setStats(statsData || null);
    } catch (err) {
      console.error('Data load error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedBloodGroup, radiusKm, onlyAvailable, searchQuery, currentDonor]);

  // Sync currentDonor with authenticated user
  useEffect(() => {
    if (user) {
      setCurrentDonor(user);
      setIsAvailable(user.is_available ?? true);
    } else {
      setCurrentDonor(null);
    }
  }, [user]);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 12000);
    return () => clearInterval(interval);
  }, [loadData]);

  // Handle Toggle Donor Availability
  const handleToggleAvailability = async () => {
    const nextState = !isAvailable;
    setIsAvailable(nextState); // Optimistic UI
    try {
      await api.toggleAvailability(nextState);
      addToast(
        nextState ? 'Status set to: Ready to Donate (On-Duty)' : 'Status set to: Off-Duty',
        nextState ? 'success' : 'info'
      );
      loadData();
    } catch {
      setIsAvailable(!nextState);
    }
  };

  // Handle One-Click Request Blood
  const handleRequestBlood = async (donorId) => {
    try {
      await api.requestBlood(donorId);
      addToast('Emergency match request dispatched to donor!', 'success');
    } catch {
      addToast('Failed to send request. Please try direct contact.', 'error');
    }
  };

  // Handle SOS Broadcast Submit
  const handleSOSSubmit = async (formData) => {
    try {
      const { data: newEmergency } = await api.createSOS(formData);
      addToast(
        `SOS Broadcast Activated! Matching ${newEmergency.blood_group} donors nearby.`,
        'success'
      );
      setDismissedBanner(false);
      loadData();
    } catch {
      addToast('Failed to broadcast SOS. Please check details.', 'error');
    }
  };

  // Handle Respond to Emergency
  const handleRespondToEmergency = async (emergency) => {
    // Optimistic UI: immediately remove from active board
    setEmergencies(prev => prev.filter(e => e.id !== emergency.id));
    
    try {
      await api.respondToSOS(emergency.id, {
        donor_id: currentDonor?.id,
        notes: 'Dispatched via PulseConnect quick responder'
      });
      addToast(
        `Dispatched! You are on mission for ${emergency.patient_name} at ${emergency.hospital_name}`,
        'success'
      );
      loadData();
    } catch {
      addToast('Failed to accept emergency.', 'error');
      loadData();
    }
  };

  const topEmergency = !dismissedBanner && Array.isArray(emergencies) && emergencies.find(e => e?.urgency_level === 'Immediate');

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#090D16] text-slate-900 dark:text-slate-100 flex flex-col selection:bg-red-500 selection:text-white transition-colors duration-200">
      
      {/* Sticky Top Emergency Banner for Critical Cases */}
      {topEmergency && (
        <EmergencyBanner
          emergency={topEmergency}
          onRespond={handleRespondToEmergency}
          onDismiss={() => setDismissedBanner(true)}
        />
      )}

      {/* Main Navbar */}
      <Navbar
        onOpenSOS={() => setIsSOSModalOpen(true)}
        onOpenProfile={() => setIsProfileDrawerOpen(true)}
        isAvailable={isAvailable}
        onToggleAvailability={handleToggleAvailability}
        isLiveServer={isLiveServer}
        activeSOSCount={emergencies.length}
        currentView={currentView}
        onNavigate={setCurrentView}
      />

      {/* Main Content Area with Bottom Clearance for Mobile App Bar */}
      <main className="flex-1 pb-20 md:pb-8">
        {currentView === 'acceptor' && (
          <AcceptorPage
            donors={donors}
            isLoading={isLoading}
            selectedBloodGroup={selectedBloodGroup}
            onSelectBloodGroup={setSelectedBloodGroup}
            radiusKm={radiusKm}
            onChangeRadius={setRadiusKm}
            searchQuery={searchQuery}
            onChangeSearchQuery={setSearchQuery}
            onlyAvailable={onlyAvailable}
            onToggleOnlyAvailable={setOnlyAvailable}
            onRequestBlood={handleRequestBlood}
            onOpenSOS={() => setIsSOSModalOpen(true)}
            onNavigateTracker={() => setCurrentView('tracker')}
            onNavigateDonor={() => setCurrentView('donor')}
            activeSOSCount={emergencies.length}
          />
        )}

        {currentView === 'donor' && (
          <DonorPage
            emergencies={emergencies}
            stats={stats}
            isAvailable={isAvailable}
            onToggleAvailability={handleToggleAvailability}
            currentDonor={currentDonor}
            onRespondToEmergency={handleRespondToEmergency}
            onOpenProfile={() => setIsProfileDrawerOpen(true)}
            onNavigateTracker={() => setCurrentView('tracker')}
            onNavigateAcceptor={() => setCurrentView('acceptor')}
          />
        )}

        {currentView === 'tracker' && (
          <RequestStatusTracker
            onNavigateDashboard={() => setCurrentView('acceptor')}
            onOpenSOS={() => setIsSOSModalOpen(true)}
          />
        )}

        {(currentView === 'login' || currentView === 'register') && (
          <AuthPage
            initialTab={currentView === 'register' ? 'register' : 'login'}
            onNavigate={setCurrentView}
            onSuccess={() => {
              addToast('Signed in successfully!', 'success');
              setCurrentView('donor');
            }}
          />
        )}
      </main>

      {/* Footer with mobile bottom clearance */}
      <footer className="mt-8 sm:mt-16 bg-white dark:bg-slate-900/90 border-t border-slate-200 dark:border-slate-800/80 pt-8 pb-24 md:pb-8 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <Heart className="w-4 h-4 text-red-600 fill-red-600" />
            <span className="font-bold text-slate-700 dark:text-slate-200">PulseConnect Platform</span>
            <span>• Powered by FastAPI & React</span>
          </div>
          <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs">
            <button
              onClick={() => setCurrentView('acceptor')}
              className={`hover:text-red-600 dark:hover:text-red-400 transition-colors ${currentView === 'acceptor' ? 'font-bold text-red-600 dark:text-red-400' : ''}`}
            >
              Need Blood (Acceptor)
            </button>
            <span>•</span>
            <button
              onClick={() => setCurrentView('donor')}
              className={`hover:text-red-600 dark:hover:text-red-400 transition-colors ${currentView === 'donor' ? 'font-bold text-red-600 dark:text-red-400' : ''}`}
            >
              Donate Blood (Donor)
            </button>
            <span>•</span>
            <button
              onClick={() => setCurrentView('tracker')}
              className={`hover:text-red-600 dark:hover:text-red-400 transition-colors ${currentView === 'tracker' ? 'font-bold text-red-600 dark:text-red-400' : ''}`}
            >
              Status Tracker
            </button>
            <span>•</span>
            <button
              onClick={() => setCurrentView(isAuthenticated ? 'donor' : 'login')}
              className={`hover:text-red-600 dark:hover:text-red-400 transition-colors ${currentView === 'login' || currentView === 'register' ? 'font-bold text-red-600 dark:text-red-400' : ''}`}
            >
              {isAuthenticated ? 'My Donor Account' : 'Sign In / Register'}
            </button>
          </div>
          <p>
            Emergency Golden Hour Blood Response Protocol. All medical records protected.
          </p>
        </div>
      </footer>

      {/* Modals & Drawers */}
      <SOSModal
        isOpen={isSOSModalOpen}
        onClose={() => setIsSOSModalOpen(false)}
        onSubmitSOS={handleSOSSubmit}
      />

      <ProfileDrawer
        isOpen={isProfileDrawerOpen}
        onClose={() => setIsProfileDrawerOpen(false)}
        donor={user || currentDonor}
        isAvailable={isAvailable}
        onToggleAvailability={handleToggleAvailability}
        onOpenAuth={(tab) => {
          setIsProfileDrawerOpen(false);
          setCurrentView(tab || 'login');
        }}
      />

      {/* Toast Notification Stack - clears mobile bottom navigation bar */}
      <div className="fixed bottom-20 sm:bottom-5 right-4 sm:right-5 z-50 flex flex-col gap-2 pointer-events-none max-w-sm w-[calc(100%-2rem)] sm:w-auto">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center gap-3 p-4 rounded-2xl shadow-xl text-white text-sm font-bold animate-slideUp ${
              toast.type === 'error'
                ? 'bg-red-600'
                : toast.type === 'info'
                ? 'bg-slate-800'
                : 'bg-emerald-600'
            }`}
          >
            {toast.type === 'error' ? (
              <AlertCircle className="w-5 h-5 shrink-0" />
            ) : (
              <CheckCircle2 className="w-5 h-5 shrink-0" />
            )}
            <span>{toast.message}</span>
          </div>
        ))}
      </div>

    </div>
  );
}

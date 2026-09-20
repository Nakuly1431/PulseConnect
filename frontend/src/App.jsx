import React, { useState, useEffect, useCallback, useRef } from 'react';
import Navbar from './components/Navbar';
import EmergencyBanner from './components/EmergencyBanner';
import AcceptorPage from './components/AcceptorPage';
import DonorPage from './components/DonorPage';
import RequestStatusTracker from './components/RequestStatusTracker';
import AuthPage from './components/AuthPage';
import SOSModal from './components/SOSModal';
import ProfileDrawer from './components/ProfileDrawer';
import ProfilePage from './components/ProfilePage';
import AdminPage from './components/AdminPage';
import DonorVerificationModal from './components/DonorVerificationModal';
import AnimatedBackground from './components/AnimatedBackground';
import { api } from './services/api';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AlertCircle, CheckCircle2, Heart } from 'lucide-react';
import { getCooldownInfo } from './utils/bloodCompatibility';

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
  const { user, isAuthenticated, logout } = useAuth();
  const prevAuthRef = useRef(isAuthenticated);

  // Automatically redirect to Sign In ('login') page whenever user logs out
  useEffect(() => {
    if (prevAuthRef.current && !isAuthenticated) {
      setCurrentView('login');
      addToast('Logged out successfully. Please sign in to continue.', 'info');
    }
    prevAuthRef.current = isAuthenticated;
  }, [isAuthenticated]);

  const handleLogout = async () => {
    try {
      await logout();
    } catch {
      // ignore
    }
    setCurrentView('login');
    addToast('Logged out successfully. Please sign in to continue.', 'info');
  };

  // State
  const [donors, setDonors] = useState([]);
  const [emergencies, setEmergencies] = useState([]);
  const [stats, setStats] = useState(null);
  const [isLiveServer, setIsLiveServer] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Search Filters for Acceptor Portal
  const [selectedBloodGroup, setSelectedBloodGroup] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [onlyAvailable, setOnlyAvailable] = useState(true);
  const [radiusKm, setRadiusKm] = useState(25); // default emergency search radius: 25 km
  const [searchCenter, setSearchCenter] = useState({ lat: 20.2961, lng: 85.8245, name: 'Bhubaneswar' });

  // User / Donor State
  const [isAvailable, setIsAvailable] = useState(true);
  const [currentDonor, setCurrentDonor] = useState(null);

  // Modals & Drawers
  const [isSOSModalOpen, setIsSOSModalOpen] = useState(false);
  const [editingEmergency, setEditingEmergency] = useState(null);
  const [isProfileDrawerOpen, setIsProfileDrawerOpen] = useState(false);
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);
  const [pendingEmergencyForDonation, setPendingEmergencyForDonation] = useState(null);
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
        only_available: onlyAvailable,
        locality: searchQuery,
        radius_km: radiusKm,
        lat: searchCenter?.lat,
        lng: searchCenter?.lng
      });
      const safeDonors = Array.isArray(donorList) ? donorList : [];
      setDonors(safeDonors);
      setIsLiveServer(isLive);

      // 2. Fetch Emergencies
      const { data: emergencyList } = await api.fetchActiveSOS();
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
  }, [selectedBloodGroup, onlyAvailable, searchQuery, radiusKm, searchCenter, currentDonor]);

  // Sync currentDonor with authenticated user
  useEffect(() => {
    if (user) {
      setCurrentDonor(user);
      const cooldown = getCooldownInfo(user);
      setIsAvailable(cooldown.isInCooldown ? false : (user.is_available ?? true));
    } else {
      setCurrentDonor(null);
    }
  }, [user]);

  const activeDonor = user || currentDonor;
  const cooldownInfo = getCooldownInfo(activeDonor);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 12000);
    return () => clearInterval(interval);
  }, [loadData]);

  // Handle Toggle Donor Availability
  const handleToggleAvailability = async () => {
    if (!isAuthenticated || !user) {
      addToast('Please sign in as a registered donor to set your duty status.', 'info');
      setCurrentView('login');
      return;
    }

    const active = user || currentDonor;
    const activeCooldown = getCooldownInfo(active);

    // If in cooldown, strictly block switching to On-Duty!
    if (activeCooldown.isInCooldown) {
      setIsAvailable(false);
      addToast(
        `Biological Cooldown Active: ${activeCooldown.daysRemaining} days left until ${activeCooldown.cooldownUntil}. You cannot go On-Duty during red cell replenishment.`,
        'error'
      );
      return;
    }

    const nextState = !isAvailable;
    setIsAvailable(nextState); // Optimistic UI
    try {
      await api.toggleAvailability(nextState);
      addToast(
        nextState ? 'Status set to: Ready to Donate (On-Duty)' : 'Status set to: Off-Duty',
        nextState ? 'success' : 'info'
      );
      loadData();
    } catch (err) {
      setIsAvailable(!nextState);
      addToast(err.message || 'Failed to update duty status', 'error');
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
      // Persist to localStorage for immediate and subsequent edits
      try {
        const existing = JSON.parse(localStorage.getItem('pulseconnect_my_sos_requests') || '[]');
        const updatedList = [newEmergency, ...existing.filter(e => e.id !== newEmergency.id)];
        localStorage.setItem('pulseconnect_my_sos_requests', JSON.stringify(updatedList));
      } catch (err) {
        console.warn('LocalStorage save error:', err);
      }
      setDismissedBanner(false);
      loadData();
      return newEmergency;
    } catch (err) {
      addToast(err.message || 'Failed to broadcast SOS. Please check details.', 'error');
      throw err;
    }
  };

  // Handle SOS Edit Submit (for stressed filers correcting typos)
  const handleSOSEditSubmit = async (requestId, updatedData, editToken) => {
    try {
      const payload = {
        ...updatedData,
        edit_token: editToken
      };
      const { data: updated } = await api.updateSOS(requestId, payload);
      addToast(
        `Emergency #${requestId} details corrected! Updated broadcast sent to matching donors.`,
        'success'
      );
      // Update in localStorage
      try {
        const existing = JSON.parse(localStorage.getItem('pulseconnect_my_sos_requests') || '[]');
        const updatedList = existing.map(e => (e.id === requestId ? { ...e, ...updated } : e));
        localStorage.setItem('pulseconnect_my_sos_requests', JSON.stringify(updatedList));
      } catch (err) {
        console.warn('LocalStorage update error:', err);
      }
      loadData();
      return updated;
    } catch (err) {
      addToast(err.message || 'Failed to update emergency.', 'error');
      throw err;
    }
  };

  // Handle Respond to Emergency - Enforces Registered Donor & Compulsory Pre-Donation Verification Alert
  const handleRespondToEmergency = (emergency) => {
    if (!isAuthenticated || !user) {
      addToast('Please sign in as a registered donor to accept emergency requests.', 'info');
      setCurrentView('login');
      return;
    }
    setPendingEmergencyForDonation(emergency);
    setIsVerificationModalOpen(true);
  };

  // Handle Confirmed Donation after 100% Compulsory Verification Passes
  const handleConfirmVerifiedDonation = async (verificationDetails) => {
    setIsVerificationModalOpen(false);
    const emergency = pendingEmergencyForDonation;
    setPendingEmergencyForDonation(null);
    if (!emergency) return;

    // Optimistic UI: immediately remove from active board
    setEmergencies(prev => prev.filter(e => e.id !== emergency.id));
    
    try {
      const verifiedNotes = `Verified Donor (${currentDonor?.full_name || 'Volunteer'}) - 6/6 Compulsory Pre-Donation Standards Verified at ${new Date().toLocaleTimeString()} [Phone: ${verificationDetails.verifiedPhone || currentDonor?.phone_number || 'Confirmed'}]`;
      await api.respondToSOS(emergency.id, {
        donor_id: currentDonor?.id,
        notes: verifiedNotes
      });
      addToast(
        `Verification Confirmed! You are dispatched for ${emergency.patient_name} at ${emergency.hospital_name}`,
        'success'
      );
      loadData();
    } catch {
      addToast('Failed to accept emergency mission.', 'error');
      loadData();
    }
  };

  const handleCancelVerification = () => {
    setIsVerificationModalOpen(false);
    setPendingEmergencyForDonation(null);
    addToast('Donation cancelled. Mandatory verification was not completed.', 'info');
  };

  const topEmergency = !dismissedBanner && Array.isArray(emergencies) && emergencies.find(e => e?.urgency_level === 'Immediate');

  return (
    <div className="relative min-h-screen bg-[#F8FAFC] dark:bg-[#090D16] text-slate-900 dark:text-slate-100 flex flex-col selection:bg-red-500 selection:text-white transition-colors duration-200 overflow-x-hidden">
      {/* Dynamic Animated Medical Vitality Background */}
      <AnimatedBackground />
      
      {/* Sticky Top Emergency Banner for Critical Cases */}
      {topEmergency && (
        <EmergencyBanner
          emergency={topEmergency}
          onRespond={handleRespondToEmergency}
          onDismiss={() => setDismissedBanner(true)}
          currentDonor={user || currentDonor}
        />
      )}

      {/* Main Navbar */}
      <Navbar
        onOpenSOS={() => setIsSOSModalOpen(true)}
        onOpenProfile={() => setCurrentView('profile')}
        isAvailable={isAvailable}
        onToggleAvailability={handleToggleAvailability}
        isInCooldown={cooldownInfo.isInCooldown}
        cooldownDaysRemaining={cooldownInfo.daysRemaining}
        isLiveServer={isLiveServer}
        activeSOSCount={emergencies.length}
        currentView={currentView}
        onNavigate={setCurrentView}
        onLogout={handleLogout}
      />

      {/* Main Content Area with Bottom Clearance for Mobile App Bar */}
      <main className="flex-1 pb-20 md:pb-8">
        {currentView === 'acceptor' && (
          <AcceptorPage
            donors={donors}
            isLoading={isLoading}
            selectedBloodGroup={selectedBloodGroup}
            onSelectBloodGroup={setSelectedBloodGroup}
            searchQuery={searchQuery}
            onChangeSearchQuery={setSearchQuery}
            onlyAvailable={onlyAvailable}
            onToggleOnlyAvailable={setOnlyAvailable}
            radiusKm={radiusKm}
            onChangeRadiusKm={setRadiusKm}
            searchCenter={searchCenter}
            onChangeSearchCenter={setSearchCenter}
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
            onOpenProfile={() => {
              if (isAuthenticated && user) {
                setCurrentView('profile');
              } else {
                setCurrentView('login');
                addToast('Please sign in to view your donor profile and card.', 'info');
              }
            }}
            onNavigateTracker={() => setCurrentView('tracker')}
            onNavigateAcceptor={() => setCurrentView('acceptor')}
            onNavigateLogin={() => setCurrentView('login')}
          />
        )}

        {currentView === 'tracker' && (
          <RequestStatusTracker
            onNavigateDashboard={() => setCurrentView('acceptor')}
            onOpenSOS={() => {
              setEditingEmergency(null);
              setIsSOSModalOpen(true);
            }}
            onOpenEditSOS={(emergency) => {
              setEditingEmergency(emergency);
              setIsSOSModalOpen(true);
            }}
          />
        )}

        {currentView === 'profile' && (
          isAuthenticated && user ? (
            <ProfilePage
              onNavigateBack={() => setCurrentView('donor')}
              onNavigateAuth={(tab) => setCurrentView(tab || 'login')}
              isAvailable={isAvailable}
              onToggleAvailability={handleToggleAvailability}
              addToast={addToast}
            />
          ) : (
            <AuthPage
              initialTab="login"
              onNavigate={setCurrentView}
              onSuccess={() => {
                addToast('Signed in successfully!', 'success');
                setCurrentView('profile');
              }}
            />
          )
        )}

        {currentView === 'admin' && (
          <AdminPage
            onNavigateBack={() => setCurrentView('acceptor')}
            addToast={addToast}
          />
        )}

        {(currentView === 'login' || currentView === 'register') && (
          <AuthPage
            initialTab={currentView === 'register' ? 'register' : 'login'}
            onNavigate={setCurrentView}
            onSuccess={() => {
              addToast('Signed in successfully!', 'success');
              setCurrentView('profile');
            }}
          />
        )}
      </main>

      {/* Footer with mobile bottom clearance */}
      <footer className="mt-8 sm:mt-16 bg-white dark:bg-slate-900/90 border-t border-slate-200 dark:border-slate-800/80 pt-8 pb-24 md:pb-8 transition-colors">
        <div className="max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-10 2xl:px-12 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
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
              onClick={() => {
                if (isAuthenticated && user) {
                  setCurrentView('profile');
                } else {
                  setCurrentView('login');
                  addToast('Please sign in to view your donor profile and card.', 'info');
                }
              }}
              className={`hover:text-red-600 dark:hover:text-red-400 transition-colors ${currentView === 'profile' ? 'font-bold text-red-600 dark:text-red-400' : ''}`}
            >
              User Profile
            </button>
            {user?.role === 'admin' && (
              <>
                <span>•</span>
                <button
                  onClick={() => setCurrentView('admin')}
                  className={`hover:text-purple-600 dark:hover:text-purple-400 transition-colors ${currentView === 'admin' ? 'font-bold text-purple-600 dark:text-purple-400' : 'text-purple-600 dark:text-purple-400'}`}
                >
                  Admin Portal
                </button>
              </>
            )}
            <span>•</span>
            <button
              onClick={() => setCurrentView(isAuthenticated ? 'profile' : 'login')}
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

      {/* SOS Broadcast Modal */}
      <SOSModal
        isOpen={isSOSModalOpen}
        onClose={() => {
          setIsSOSModalOpen(false);
          setEditingEmergency(null);
        }}
        onSubmitSOS={handleSOSSubmit}
        onUpdateSOS={handleSOSEditSubmit}
        mode={editingEmergency ? 'edit' : 'create'}
        initialData={editingEmergency}
        onNavigateTracker={() => {
          setIsSOSModalOpen(false);
          setEditingEmergency(null);
          setCurrentView('tracker');
        }}
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

      {/* Compulsory Pre-Donation Donor Verification Modal */}
      <DonorVerificationModal
        isOpen={isVerificationModalOpen}
        onClose={handleCancelVerification}
        emergency={pendingEmergencyForDonation}
        currentDonor={user || currentDonor}
        onConfirmDonation={handleConfirmVerifiedDonation}
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

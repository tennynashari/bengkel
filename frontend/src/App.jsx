import { useLanguage } from './context/LanguageContext';
import SettingsManager from './components/Admin/SettingsManager';
import OutletManager from './components/Admin/OutletManager';
import UserManager from './components/Admin/UserManager';
import { fetchServicesByOutlet , fetchUsers } from './services/api';
import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import HeroSection from './components/HeroSection';
import ServicePackages from './components/ServicePackages';
import BookingWizard from './components/BookingWizard';
import StatusTrackerModal from './components/StatusTrackerModal';
import AdminLoginModal from './components/Admin/AdminLoginModal';
import LiveBayBoard from './components/Admin/LiveBayBoard';
import BookingManager from './components/Admin/BookingManager';
import PaymentManager from './components/Admin/PaymentManager';
import BayManager from './components/Admin/BayManager';
import ServiceManager from './components/Admin/ServiceManager';
import MechanicManager from './components/Admin/MechanicManager';
import AssignBayModal from './components/Admin/AssignBayModal';
import DigitalInspectionModal from './components/Admin/DigitalInspectionModal';
import ProgressUpdateModal from './components/Admin/ProgressUpdateModal';
import InvoiceModal from './components/Admin/InvoiceModal';
import Sidebar from './components/Admin/Sidebar';
import WhatsAppWidget from './components/WhatsAppWidget';
import Footer from './components/Footer';
import { 
  fetchOutlets, 
  fetchServices, 
  fetchBays, 
  fetchAllBookings,
  fetchMechanics 
} from './services/api';
import { Menu, Wrench, RefreshCw, Eye } from 'lucide-react';

export default function App() {
  const { language, setLanguage, t } = useLanguage();
  const [outlets, setOutlets] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedOutletId, setSelectedOutletId] = useState(1);
  const [adminSelectedOutletId, setAdminSelectedOutletId] = useState('ALL');
  const [categories, setCategories] = useState([]);
  const [services, setServices] = useState([]);
  const [bays, setBays] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [mechanics, setMechanics] = useState([]);

  // Modals & UI States
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [preSelectedPkg, setPreSelectedPkg] = useState(null);
  const [isTrackerOpen, setIsTrackerOpen] = useState(false);
  const [trackerCode, setTrackerCode] = useState('');
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState(false);
  const [isSidebarMobileOpen, setIsSidebarMobileOpen] = useState(false);

  // Admin Session State
  const [adminUser, setAdminUser] = useState(() => {
    const saved = localStorage.getItem('bengkel_admin');
    return saved ? JSON.parse(saved) : null;
  });
  const [viewMode, setViewMode] = useState('admin'); // 'admin' or 'public'
  const [activeAdminTab, setActiveAdminTab] = useState('bays');

  // Sub-modals for admin
  const [selectedBookingInspection, setSelectedBookingInspection] = useState(null);
  const [selectedBookingProgress, setSelectedBookingProgress] = useState(null);
  const [selectedBookingAssignBay, setSelectedBookingAssignBay] = useState(null);
  const [selectedBookingInvoice, setSelectedBookingInvoice] = useState(null);

  const handleSelectOutlet = async (outletId) => {
    setSelectedOutletId(outletId);
    try {
      const data = await fetchServicesByOutlet(outletId);
      if (data && data.services) setServices(data.services);
      if (data && data.categories) setCategories(data.categories);
    } catch(err) {
      console.error('Error fetching services for outlet:', err);
    }
  };

  const loadData = async () => {
    try {
      const [outRes, srvRes, bayRes, bkRes, mechRes, userRes] = await Promise.all([
        fetchOutlets(),
        fetchServices(),
        fetchBays(),
        fetchAllBookings(),
        fetchMechanics(),
        fetchUsers()
      ]);
      setOutlets(outRes.data || []);
      setCategories(srvRes.data?.categories || []);
      setServices(srvRes.data?.services || []);
      setBays(bayRes.data?.bays || []);
      setBookings(bkRes.data || []);
      setMechanics(mechRes.data || []);
      setUsers(userRes.data || []);
    } catch (err) {
      console.error('Error loading initial data:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenBookingWithService = (pkg) => {
    setPreSelectedPkg(pkg);
    setIsBookingOpen(true);
  };

  const handleTrackSearch = (code) => {
    setTrackerCode(code);
    setIsTrackerOpen(true);
  };

  const handleAdminLoginSuccess = (user, token) => {
    if (user && user.role === 'BRANCH_ADMIN' && user.outlet_id) {
      setAdminSelectedOutletId(user.outlet_id);
    }
    setAdminUser(user);
    setViewMode('admin');
    const assignedOutletId = user?.outlet_id || user?.outletId;
    if (user?.role === 'BRANCH_ADMIN' && assignedOutletId) {
      setAdminSelectedOutletId(parseInt(assignedOutletId));
    }
    localStorage.setItem('bengkel_admin', JSON.stringify(user));
    localStorage.setItem('bengkel_token', token);
  };

  const handleLogout = () => {
    setAdminUser(null);
    setViewMode('public');
    localStorage.removeItem('bengkel_admin');
    localStorage.removeItem('bengkel_token');
  };

  const handleToggleViewMode = () => {
    setViewMode(prev => prev === 'admin' ? 'public' : 'admin');
  };

  const getPageTitle = () => {
    switch(activeAdminTab) {
      case 'bays': return { title: t('pt_bays'), sub: t('pt_baysSub') };
      case 'bookings': return { title: t('pt_bookings'), sub: t('pt_bookingsSub') };
      case 'payments': return { title: t('pt_payments'), sub: t('pt_paymentsSub') };
      case 'bay_mgr': return { title: t('pt_bayMgr'), sub: t('pt_bayMgrSub') };
      case 'service_mgr': return { title: t('pt_serviceMgr'), sub: t('pt_serviceMgrSub') };
      case 'mechanic_mgr': return { title: t('pt_mechanicMgr'), sub: t('pt_mechanicMgrSub') };
      case 'user_mgr': return { title: t('pt_userMgr'), sub: t('pt_userMgrSub') };
      case 'outlet_mgr': return { title: t('pt_outletMgr'), sub: t('pt_outletMgrSub') };
      case 'settings': return { title: t('pt_settings'), sub: t('pt_settingsSub') };
      default: return { title: t('dashboardTitle'), sub: t('dashboardSub') };
    }
  };


  const userAssignedOutlet = (adminUser && adminUser.role === 'BRANCH_ADMIN') 
    ? parseInt(adminUser.outlet_id || adminUser.outletId) 
    : null;

  const effectiveOutletId = (userAssignedOutlet !== null && !isNaN(userAssignedOutlet))
    ? userAssignedOutlet 
    : adminSelectedOutletId;

  const filteredBookings = effectiveOutletId === 'ALL' 
    ? bookings 
    : bookings.filter(b => parseInt(b.outlet_id) === parseInt(effectiveOutletId));

  const filteredBays = effectiveOutletId === 'ALL' 
    ? bays 
    : bays.filter(b => parseInt(b.outlet_id) === parseInt(effectiveOutletId));

  const filteredMechanics = effectiveOutletId === 'ALL' 
    ? mechanics 
    : mechanics.filter(m => parseInt(m.outlet_id) === parseInt(effectiveOutletId));

  const filteredServices = effectiveOutletId === 'ALL' 
    ? services 
    : services.filter(s => !s.outlet_id || parseInt(s.outlet_id) === parseInt(effectiveOutletId));

  
  /* BRANCH_ADMIN LOCK */
  useEffect(() => {
    if (adminUser && adminUser.role === 'BRANCH_ADMIN') {
      const assigned = adminUser.outlet_id || adminUser.outletId;
      if (assigned) {
        setAdminSelectedOutletId(parseInt(assigned));
      }
    }
  }, [adminUser]);
  
  
  /* SUPER_ADMIN TAB GUARD */
  useEffect(() => {
    if (adminUser && adminUser.role !== 'SUPER_ADMIN') {
      if (['user_mgr', 'outlet_mgr', 'settings'].includes(activeAdminTab)) {
        setActiveAdminTab('bays');
      }
    }
  }, [adminUser, activeAdminTab]);
  
  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      
      {/* If Admin is logged in and viewMode is 'admin', render Sidebar Layout */}
      {adminUser && viewMode === 'admin' ? (
        <div className="flex h-screen overflow-hidden bg-slate-950">
          
          {/* SIDEBAR NAVIGATION */}
          <Sidebar 
            activeTab={activeAdminTab}
            setActiveTab={setActiveAdminTab}
            adminUser={adminUser}
            onLogout={handleLogout}
            onToggleViewMode={handleToggleViewMode}
            counts={{
              bays: filteredBays.length,
              bookings: filteredBookings.length,
              payments: filteredBookings.filter(b => b.status === 'COMPLETED' || b.status === 'READY' || b.status === 'READY_TO_PICK').length,
              services: filteredServices.length,
              mechanics: filteredMechanics.length, 
              users: users.length,
              outlets: outlets.length
            }}
            isOpenMobile={isSidebarMobileOpen}
            onCloseMobile={() => setIsSidebarMobileOpen(false)}
          />

          {/* MAIN CONTENT WORKSPACE */}
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            
            {/* Top Bar Header */}
            <header className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-4 z-10 flex-shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <button
                  onClick={() => setIsSidebarMobileOpen(true)}
                  className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white lg:hidden flex-shrink-0"
                >
                  <Menu className="w-5 h-5" />
                </button>
                <div className="min-w-0">
                  <h1 className="text-base sm:text-lg font-bold text-white font-heading truncate">
                    {getPageTitle().title}
                  </h1>
                  <p className="text-[11px] text-slate-400 truncate hidden sm:block">
                    {getPageTitle().sub}
                  </p>
                {/* Admin Global Branch Switcher */}
                <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-amber-500/40 shadow-sm ml-2">
                  <span className="text-xs font-bold text-slate-400 hidden sm:inline">🏢 Switch Cabang:</span>
                  <select disabled={adminUser?.role === 'BRANCH_ADMIN'} title={adminUser?.role === 'BRANCH_ADMIN' ? 'Akses Anda terbatas pada cabang ini' : 'Pilih Cabang'}
                    value={effectiveOutletId}
                    onChange={(e) => setAdminSelectedOutletId(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
                    className="bg-transparent text-amber-400 font-black text-xs focus:outline-none cursor-pointer max-w-[180px] sm:max-w-[240px] truncate"
                  >
                    <option value="ALL" className="bg-slate-900 text-slate-200">🌐 Semua Cabang (HQ Global)</option>
                    {outlets.map(o => (
                      <option key={o.id} value={o.id} className="bg-slate-900 text-white">
                        📍 {o.name} ({o.city || 'Cabang'})
                      </option>
                    ))}
                  </select>
                </div>

                </div>
              </div>

              {/* Top Quick Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {/* Language Switcher */}
                <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1 text-xs">
                  <button
                    type="button"
                    onClick={() => setLanguage('id')}
                    className={`px-2 py-1 rounded-lg font-bold text-xs flex items-center gap-1 transition cursor-pointer ${
                      language === 'id' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    🇮🇩 ID
                  </button>
                  <button
                    type="button"
                    onClick={() => setLanguage('en')}
                    className={`px-2 py-1 rounded-lg font-bold text-xs flex items-center gap-1 transition cursor-pointer ${
                      language === 'en' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    🇬🇧 EN
                  </button>
                </div>

                <button
                  onClick={loadData}
                  className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition"
                  title="Refresh Data"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden sm:inline">Refresh</span>
                </button>

                <button
                  onClick={handleToggleViewMode}
                  className="px-3 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-bold flex items-center gap-1.5 transition shadow-sm"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Lihat Landing Page</span>
                  <span className="sm:hidden">Web</span>
                </button>
              </div>
            </header>

            {/* Scrollable Main Views */}
            <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 custom-scrollbar">
              <div className="max-w-7xl mx-auto space-y-6">
                {activeAdminTab === 'bays' && (
                  <LiveBayBoard bays={filteredBays} onAssignBay={() => setActiveAdminTab('bookings')} />
                )}
                {activeAdminTab === 'bookings' && (
                  <BookingManager 
                    bookings={filteredBookings}
                    onOpenBooking={() => setIsBookingOpen(true)}
                    onOpenInspection={(b) => setSelectedBookingInspection(b)}
                    onOpenProgress={(b) => setSelectedBookingProgress(b)}
                    onOpenAssignBay={(b) => setSelectedBookingAssignBay(b)}
                    onRefresh={loadData}
                  />
                )}
                {activeAdminTab === 'payments' && (
                  <PaymentManager 
                    bookings={filteredBookings}
                    onOpenInvoice={(b) => setSelectedBookingInvoice(b)}
                    onRefresh={loadData}
                  />
                )}
                {activeAdminTab === 'bay_mgr' && (
                  <BayManager bays={filteredBays} selectedOutletId={effectiveOutletId} outlets={outlets} onRefresh={loadData} />
                )}
                {activeAdminTab === 'service_mgr' && (
                  <ServiceManager services={filteredServices} categories={categories} selectedOutletId={effectiveOutletId} outlets={outlets} onRefresh={loadData} />
                )}
                {activeAdminTab === 'mechanic_mgr' && (
                  <MechanicManager mechanics={filteredMechanics} selectedOutletId={effectiveOutletId} outlets={outlets} onRefresh={loadData} />
                )}

              
                {adminUser?.role === 'SUPER_ADMIN' && activeAdminTab === 'user_mgr' && (
                  <UserManager 
                    users={users} 
                    outlets={outlets} 
                    currentUser={adminUser} 
                    onRefresh={loadData} 
                  />
                )}

               {adminUser?.role === 'SUPER_ADMIN' && activeAdminTab === 'outlet_mgr' && (
                  <OutletManager outlets={outlets} onRefresh={loadData} />
                )}
                {adminUser?.role === 'SUPER_ADMIN' && activeAdminTab === 'settings' && (
                <SettingsManager 
                  outlet={effectiveOutletId !== 'ALL' ? (outlets.find(o => Number(o.id) === Number(effectiveOutletId)) || outlets[0]) : outlets[0]}
                  onRefresh={loadData}
                />
              )}
              </div>
            </main>

          </div>

        </div>
      ) : (
        /* PUBLIC LANDING PAGE LAYOUT */
        <>
          <Navbar 
            onOpenBooking={() => setIsBookingOpen(true)}
            onOpenTracker={() => setIsTrackerOpen(true)}
            onOpenLogin={() => setIsAdminLoginOpen(true)}
            adminUser={adminUser}
            onLogout={handleLogout}
            viewMode={viewMode}
            onToggleViewMode={handleToggleViewMode}
            outlets={outlets}
            selectedOutletId={selectedOutletId}
            onSelectOutlet={handleSelectOutlet}
          />

          <main className="flex-1">
            <HeroSection 
              onOpenBooking={() => setIsBookingOpen(true)}
              onTrackSearch={handleTrackSearch}
              outlets={outlets}
              selectedOutletId={selectedOutletId}
              onSelectOutlet={handleSelectOutlet}
            />

            <ServicePackages 
              services={services}
              outlets={outlets}
              selectedOutletId={selectedOutletId}
              onSelectPackage={handleOpenBookingWithService}
            />
          </main>

          <WhatsAppWidget phone={outlets[0]?.phone || '081299887766'} />
          <Footer />
        </>
      )}

      {/* MODALS */}
      <BookingWizard
        selectedOutletId={effectiveOutletId !== 'ALL' ? effectiveOutletId : selectedOutletId} 
        userAssignedOutlet={viewMode === 'admin' ? userAssignedOutlet : null}
        currentUser={adminUser}
        isOpen={isBookingOpen}
        onClose={() => {
          setIsBookingOpen(false);
          loadData();
        }}
        onBookingSuccess={loadData}
        outlets={outlets}
        services={services}
        preSelectedService={preSelectedPkg}
      />

      <StatusTrackerModal 
        isOpen={isTrackerOpen}
        onClose={() => setIsTrackerOpen(false)}
        initialCode={trackerCode}
      />

      <AdminLoginModal 
        isOpen={isAdminLoginOpen}
        onClose={() => setIsAdminLoginOpen(false)}
        onLoginSuccess={handleAdminLoginSuccess}
      />

      {/* Admin Sub-modals */}
      <AssignBayModal 
        isOpen={!!selectedBookingAssignBay}
        onClose={() => setSelectedBookingAssignBay(null)}
        booking={selectedBookingAssignBay}
        bays={bays}
        mechanics={mechanics.length > 0 ? mechanics : [{ id: 1, name: 'Budi Santoso', role: 'HEAD_MECHANIC' }, { id: 2, name: 'Agus Pratama', role: 'DETAILER' }]}
        bookings={bookings}
        onRefresh={loadData}
      />

      <DigitalInspectionModal 
        isOpen={!!selectedBookingInspection}
        onClose={() => setSelectedBookingInspection(null)}
        booking={selectedBookingInspection}
        onRefresh={loadData}
      />

      <ProgressUpdateModal 
        isOpen={!!selectedBookingProgress}
        onClose={() => setSelectedBookingProgress(null)}
        booking={selectedBookingProgress}
        onRefresh={loadData}
      />

      {/* Printable Invoice Modal */}
      <InvoiceModal 
        isOpen={!!selectedBookingInvoice}
        onClose={() => setSelectedBookingInvoice(null)}
        booking={selectedBookingInvoice}
        outlet={outlets[0]}
      />

    </div>
  );
}

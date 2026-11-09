import React, { useState, useEffect } from 'react';
import { PackageItem, PackageCategory, InfinitePayConfig } from './types';
import { DEFAULT_PACKAGES } from './data/defaultPackages';
import { ToastProvider, useToast } from './components/Toast';
import { Header } from './components/Header';
import { HeroSection } from './components/HeroSection';
import { PackageShowcase } from './components/PackageShowcase';
import { CheckoutModal } from './components/CheckoutModal';
import { SocialProofAndTrust } from './components/SocialProofAndTrust';
import { FaqSection } from './components/FaqSection';
import { Footer } from './components/Footer';
import { AdminPanel } from './components/AdminPanel';
import { AdminLoginView } from './components/AdminLoginView';
import { SuccessPage } from './components/SuccessPage';
import { LayoutDashboard } from 'lucide-react';

const STORAGE_KEY = 'social_networks_packages_v3';
const INFINITEPAY_STORAGE_KEY = 'social_networks_infinitepay_v1';
const ADMIN_AUTH_SESSION_KEY = 'social_admin_auth_7782';

const DEFAULT_INFINITEPAY_CONFIG: InfinitePayConfig = {
  merchantName: 'Social Networks',
  handle: 'socialnetworks',
  pixKey: '45.123.456/0001-90',
  pixKeyType: 'cnpj',
  apiKey: 'inf_live_89a72b14c3e809df',
  webhookSecret: 'whsec_98214fa76bc1209e',
  paymentLinkUrl: 'https://link.infinitepay.io/socialnetworks',
  checkoutMode: 'modal_qr',
  autoVerifyEnabled: true,
  autoVerifySeconds: 12,
  enabled: true,
};

// Secret route identifiers
const SECRET_ADMIN_PATHS = ['/painel-privado-7782', '/admin-secret-key'];
const BLOCKED_ADMIN_PATHS = ['/adm', '/admin', '/painel', '/gerenciador', '/dashboard', '/painel-adm'];

function MainApp() {
  const { showToast } = useToast();

  // Initialize packages from LocalStorage or default fallback
  const [packages, setPackages] = useState<PackageItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // Fallback
    }
    return DEFAULT_PACKAGES;
  });

  // Save packages to LocalStorage on changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(packages));
    } catch {
      // Ignore storage errors
    }
  }, [packages]);

  // InfinitePay Gateway Config State
  const [infinitePayConfig, setInfinitePayConfig] = useState<InfinitePayConfig>(() => {
    try {
      const saved = localStorage.getItem(INFINITEPAY_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          const cleanH = String(parsed.handle || 'socialnetworks').replace(/[$@]/g, '').trim() || 'socialnetworks';
          return { ...DEFAULT_INFINITEPAY_CONFIG, ...parsed, handle: cleanH };
        }
      }
    } catch {
      // Fallback
    }
    return DEFAULT_INFINITEPAY_CONFIG;
  });

  // Save InfinitePay config to LocalStorage on changes
  useEffect(() => {
    try {
      localStorage.setItem(INFINITEPAY_STORAGE_KEY, JSON.stringify(infinitePayConfig));
    } catch {
      // Ignore
    }
  }, [infinitePayConfig]);

  // Customer Success Page Route Detection (/sucesso?order_id=...)
  const [isSuccessRoute, setIsSuccessRoute] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const p = window.location.pathname;
      const s = window.location.search;
      return p === '/sucesso' || p.startsWith('/sucesso') || s.includes('view=sucesso') || s.includes('order_id=');
    }
    return false;
  });

  // Admin Session Authentication (stored in sessionStorage so closing the tab expires it)
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      try {
        return sessionStorage.getItem(ADMIN_AUTH_SESSION_KEY) === 'auth_7782_ok';
      } catch {
        return false;
      }
    }
    return false;
  });

  // Secret Admin Route Detection (/painel-privado-7782 or /admin-secret-key or ?secret=7782)
  const [isSecretAdminRoute, setIsSecretAdminRoute] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname.toLowerCase().replace(/\/$/, '');
      const search = window.location.search;

      // Blocked common admin paths: immediate client-side redirection to '/'
      if (BLOCKED_ADMIN_PATHS.some((b) => path === b || path.startsWith(`${b}/`))) {
        window.history.replaceState({}, '', '/');
        return false;
      }

      const isSecretPath = SECRET_ADMIN_PATHS.includes(path);
      const isSecretParam = search.includes('secret=7782') || search.includes('admin=7782');
      return isSecretPath || isSecretParam;
    }
    return false;
  });

  // Route listener for popstate & client path updates
  useEffect(() => {
    const checkRoute = () => {
      const p = window.location.pathname.toLowerCase().replace(/\/$/, '');
      const s = window.location.search;

      // Immediate redirect for blocked paths
      if (BLOCKED_ADMIN_PATHS.some((b) => p === b || p.startsWith(`${b}/`))) {
        window.history.replaceState({}, '', '/');
        setIsSecretAdminRoute(false);
        setIsSuccessRoute(false);
        return;
      }

      const isSucc = p === '/sucesso' || p.startsWith('/sucesso') || s.includes('view=sucesso') || s.includes('order_id=');
      setIsSuccessRoute(isSucc);

      const isSec = SECRET_ADMIN_PATHS.includes(p) || s.includes('secret=7782') || s.includes('admin=7782');
      setIsSecretAdminRoute(isSec);
    };

    window.addEventListener('popstate', checkRoute);
    return () => window.removeEventListener('popstate', checkRoute);
  }, []);

  // Client view category filter: 'all' | 'seguidores' | 'curtidas' | 'views'
  const [selectedCategory, setSelectedCategory] = useState<PackageCategory | 'all'>('all');

  // Checkout Modal State
  const [checkoutPackage, setCheckoutPackage] = useState<PackageItem | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  // Package handlers for Admin
  const handleSavePackage = (newOrUpdatedPkg: PackageItem) => {
    setPackages((prev) => {
      const exists = prev.some((p) => p.id === newOrUpdatedPkg.id);
      if (exists) {
        return prev.map((p) => (p.id === newOrUpdatedPkg.id ? newOrUpdatedPkg : p));
      }
      return [newOrUpdatedPkg, ...prev];
    });
  };

  const handleDeletePackage = (id: string) => {
    setPackages((prev) => prev.filter((p) => p.id !== id));
  };

  const handleToggleActive = (id: string) => {
    setPackages((prev) =>
      prev.map((p) => (p.id === id ? { ...p, active: !p.active } : p))
    );
  };

  const handleResetDefaults = () => {
    setPackages(DEFAULT_PACKAGES);
    showToast('Pacotes restaurados para os padrões de Seguidores, Curtidas e Views!', 'info');
  };

  // Checkout handlers
  const handleBuyPackage = (item: PackageItem) => {
    setCheckoutPackage(item);
    setIsCheckoutOpen(true);
  };

  const handleCloseCheckout = () => {
    setIsCheckoutOpen(false);
    setCheckoutPackage(null);
  };

  // Admin authentication handlers
  const handleAdminLoginSuccess = () => {
    try {
      sessionStorage.setItem(ADMIN_AUTH_SESSION_KEY, 'auth_7782_ok');
    } catch {
      // storage fallback
    }
    setIsAdminAuthenticated(true);
    showToast('Bem-vindo ao Painel Administrativo!', 'success');
  };

  const handleAdminLogout = () => {
    try {
      sessionStorage.removeItem(ADMIN_AUTH_SESSION_KEY);
    } catch {
      // storage fallback
    }
    setIsAdminAuthenticated(false);
    setIsSecretAdminRoute(false);
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', '/');
    }
    showToast('Sessão encerrada com sucesso.', 'info');
  };

  const handleGoToStore = () => {
    setIsSecretAdminRoute(false);
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', '/');
    }
  };

  const handleGoToSecretAdmin = () => {
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', '/painel-privado-7782');
      setIsSecretAdminRoute(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const activeCount = packages.filter((p) => p.active).length;

  return (
    <div className="min-h-screen bg-[#090D16] text-slate-100 flex flex-col font-sans selection:bg-purple-500/30 selection:text-purple-200">
      
      {/* Global Header */}
      <Header
        currentView={isSecretAdminRoute && isAdminAuthenticated ? 'admin' : 'client'}
        onViewChange={(view) => {
          if (view === 'client') {
            handleGoToStore();
          }
        }}
        activePackagesCount={activeCount}
        totalPackagesCount={packages.length}
        onLogout={isSecretAdminRoute && isAdminAuthenticated ? handleAdminLogout : undefined}
        onGoToAdmin={handleGoToSecretAdmin}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {isSuccessRoute ? (
          /* ================= PÁGINA DE SUCESSO PÓS-PAGAMENTO (/sucesso) ================= */
          <div className="animate-in fade-in duration-300">
            <SuccessPage
              onGoHome={() => {
                if (typeof window !== 'undefined') {
                  window.history.pushState({}, '', '/');
                }
                setIsSuccessRoute(false);
                setIsSecretAdminRoute(false);
              }}
            />
          </div>
        ) : isSecretAdminRoute ? (
          /* ================= ROTA SECRETA ADMINISTRATIVA (/painel-privado-7782) ================= */
          !isAdminAuthenticated ? (
            <AdminLoginView
              onLoginSuccess={handleAdminLoginSuccess}
              onGoToStore={handleGoToStore}
            />
          ) : (
            <div className="animate-in fade-in duration-300">
              <AdminPanel
                packages={packages}
                onSavePackage={handleSavePackage}
                onDeletePackage={handleDeletePackage}
                onToggleActive={handleToggleActive}
                onResetDefaults={handleResetDefaults}
                onGoToStore={handleGoToStore}
                onLogout={handleAdminLogout}
                infinitePayConfig={infinitePayConfig}
                onUpdateInfinitePayConfig={setInfinitePayConfig}
              />
            </div>
          )
        ) : (
          /* ================= VISÃO DO CLIENTE (LANDING PAGE 100% LIMPA) ================= */
          <div className="animate-in fade-in duration-300">
            {/* Hero Section */}
            <HeroSection
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
            />

            {/* Vitrine de Pacotes Dinâmicos (Sem botões ADM) */}
            <PackageShowcase
              packages={packages}
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
              onBuyPackage={handleBuyPackage}
              onResetFilters={() => setSelectedCategory('all')}
            />

            {/* Prova Social, Estatísticas & Selos de Segurança */}
            <SocialProofAndTrust />

            {/* FAQ Accordion */}
            <FaqSection />
          </div>
        )}
      </main>

      {/* Global Footer (100% Limpo sem links de ADM) */}
      <Footer />

      {/* Checkout Modal with InfinitePay Pix */}
      <CheckoutModal
        packageItem={checkoutPackage}
        isOpen={isCheckoutOpen}
        onClose={handleCloseCheckout}
        infinitePayConfig={infinitePayConfig}
      />

      {/* Botão Temporário na Página Inicial: Ir para ADM */}
      {!isSecretAdminRoute && !isSuccessRoute && (
        <div className="fixed bottom-5 right-5 z-40">
          <button
            onClick={handleGoToSecretAdmin}
            className="flex items-center gap-2 px-4 py-2.5 rounded-full font-bold text-xs sm:text-sm text-white bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 shadow-xl shadow-purple-950/60 border border-purple-400/40 backdrop-blur-md transition-all transform hover:scale-105 active:scale-95 cursor-pointer"
            title="Redirecionar para /painel-privado-7782"
          >
            <LayoutDashboard className="w-4 h-4 text-purple-200" />
            <span>Ir para ADM</span>
          </button>
        </div>
      )}

    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <MainApp />
    </ToastProvider>
  );
}

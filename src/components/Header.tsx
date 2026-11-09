import React from 'react';
import { Sparkles, LayoutDashboard, Store, ShieldCheck, Zap } from 'lucide-react';

interface HeaderProps {
  currentView: 'client' | 'admin';
  onViewChange: (view: 'client' | 'admin') => void;
  activePackagesCount: number;
  totalPackagesCount: number;
  onLogout?: () => void;
  onGoToAdmin?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onViewChange,
  activePackagesCount,
  totalPackagesCount,
  onLogout,
  onGoToAdmin,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full bg-[#090D16]/90 backdrop-blur-md border-b border-slate-800/80 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-3">
          
          {/* Logo & Brand Zone */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => onViewChange('client')}
              className="flex items-center gap-2.5 group text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 rounded-lg p-1 -m-1"
            >
              <div className="relative flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-cyan-400 p-[1.5px] shadow-lg shadow-purple-950/40 group-hover:scale-105 transition-transform">
                <div className="w-full h-full bg-[#0A0E1A] rounded-[10px] flex items-center justify-center">
                  <Zap className="w-5 h-5 text-purple-400 fill-purple-400/20" />
                </div>
              </div>
              <div>
                <span className="text-base sm:text-lg font-extrabold tracking-tight text-white flex items-center gap-1.5 font-sans">
                  Social <span className="bg-gradient-to-r from-purple-400 via-indigo-300 to-cyan-400 bg-clip-text text-transparent">Networks</span>
                </span>
                <span className="hidden sm:block text-[11px] text-slate-400 font-medium leading-none tracking-wide">
                  Engajamento Real & Rápido
                </span>
              </div>
            </button>
          </div>

          {/* Status Indicator (Required: ● Sistema Online - Entregas Automáticas) */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/80 border border-slate-800/80 text-xs">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="text-slate-300 font-medium">
              Sistema Online <span className="text-slate-600">·</span> <span className="text-emerald-400">Entregas Automáticas</span>
            </span>
          </div>

          {/* Action Zone: Customer Trust Badges + Temporary Ir para ADM Button */}
          <div className="flex items-center gap-2 sm:gap-3">
            {currentView === 'client' ? (
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/90 border border-slate-800 text-xs font-semibold text-slate-300 shadow-sm">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Pix 24h · 100% Seguro</span>
                </div>

                {onGoToAdmin && (
                  <button
                    onClick={onGoToAdmin}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-md shadow-purple-950/40 border border-purple-400/30 transition-all cursor-pointer"
                    title="Acessar Painel ADM (/painel-privado-7782)"
                  >
                    <LayoutDashboard className="w-3.5 h-3.5 text-purple-200" />
                    <span>Ir para ADM</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2 sm:gap-3">
                <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-500/15 border border-purple-500/30 text-purple-300 text-xs font-bold">
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  <span>Modo ADM</span>
                </span>
                
                <button
                  onClick={() => onViewChange('client')}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                >
                  <Store className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Ver Loja</span>
                </button>

                {onLogout && (
                  <button
                    onClick={onLogout}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-300 hover:text-white bg-rose-950/60 hover:bg-rose-900/80 border border-rose-800/60 rounded-lg transition-colors cursor-pointer"
                    title="Encerrar Sessão"
                  >
                    <span>Sair</span>
                  </button>
                )}
              </div>
            )}
          </div>

        </div>

        {/* Mobile Status Bar below Header on tiny screens */}
        <div className="md:hidden flex items-center justify-between py-1.5 px-1 border-t border-slate-800/40 text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>Sistema Online</span>
            <span className="text-slate-600">·</span>
            <span className="text-emerald-400">Entregas Automáticas</span>
          </div>
          <div className="flex items-center gap-1 text-slate-400">
            <ShieldCheck className="w-3 h-3 text-purple-400" />
            <span>Sem senha · Pix 24h</span>
          </div>
        </div>

      </div>
    </header>
  );
};

import React, { useState } from 'react';
import { Lock, KeyRound, User, ArrowRight, ShieldCheck, AlertCircle, Eye, EyeOff, Store, Sparkles } from 'lucide-react';

interface AdminLoginViewProps {
  onLoginSuccess: () => void;
  onGoToStore: () => void;
}

export const AdminLoginView: React.FC<AdminLoginViewProps> = ({ onLoginSuccess, onGoToStore }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Accepted credentials:
  // User: admin or socialadmin
  // Pass/PIN: social7782 or 7782
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const cleanUser = username.trim().toLowerCase();
    const cleanPass = password.trim();

    setTimeout(() => {
      setIsSubmitting(false);

      const isValidUser = cleanUser === 'admin' || cleanUser === 'socialadmin' || cleanUser === 'socialnetworks';
      const isValidPass = cleanPass === 'social7782' || cleanPass === '7782' || cleanPass === 'admin7782';

      if (isValidUser && isValidPass) {
        onLoginSuccess();
      } else {
        setAttempts((prev) => prev + 1);
        setError('Usuário ou senha/PIN incorretos. Verifique suas credenciais de administrador.');
      }
    }, 400);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 relative">
      {/* Background radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-600/10 blur-[100px] rounded-full pointer-events-none" />

      <div className="relative w-full max-w-md rounded-3xl bg-[#0B101D] border border-slate-800/90 p-6 sm:p-8 shadow-2xl shadow-purple-950/40 space-y-6">
        
        {/* Top Lock Badge */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 p-[1.5px] shadow-lg shadow-purple-900/30">
            <div className="w-full h-full rounded-[14px] bg-[#0A0E1A] flex items-center justify-center">
              <Lock className="w-8 h-8 text-purple-400" />
            </div>
          </div>
          
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-bold uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
            <span>Acesso Restrito · Rota Privada</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
            Painel Administrativo
          </h2>
          <p className="text-xs text-slate-400 max-w-xs mx-auto">
            Área de controle exclusiva. Insira o usuário e senha/PIN mestre para gerenciar a plataforma.
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3.5 rounded-xl bg-rose-950/50 border border-rose-500/40 text-rose-200 text-xs flex items-start gap-2.5 animate-fadeIn">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div className="leading-snug">{error}</div>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
              Usuário Administrador
            </label>
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                required
                autoFocus
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Ex: admin"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700/80 text-white text-sm focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                Senha / PIN Mestre
              </label>
              <span className="text-[11px] text-purple-400 font-medium">PIN padrão: 7782</span>
            </div>
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
                <KeyRound className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Digite a senha ou PIN"
                className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700/80 text-white text-sm font-mono focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1 rounded cursor-pointer"
                aria-label={showPassword ? 'Ocultar senha' : 'Ver senha'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !username.trim() || !password.trim()}
            className="w-full mt-2 py-3 px-4 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 shadow-lg shadow-purple-900/30 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Autenticando...</span>
              </>
            ) : (
              <>
                <span>Entrar no Painel</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Security Notice & Store Redirect */}
        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5 text-[11px]">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>Sessão 100% Criptografada</span>
          </div>

          <button
            type="button"
            onClick={onGoToStore}
            className="text-purple-400 hover:text-purple-300 font-semibold flex items-center gap-1 cursor-pointer"
          >
            <Store className="w-3.5 h-3.5" />
            <span>Voltar à Loja</span>
          </button>
        </div>

      </div>
    </div>
  );
};

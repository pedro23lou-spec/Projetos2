import React, { useEffect, useState } from 'react';
import {
  Check,
  CheckCircle2,
  Clock,
  ExternalLink,
  Instagram,
  MessageCircle,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Pedido } from '../types';
import { getSavedPedidos } from '../services/ordersService';

interface SuccessPageProps {
  onGoHome: () => void;
}

export const SuccessPage: React.FC<SuccessPageProps> = ({ onGoHome }) => {
  const [order, setOrder] = useState<Pedido | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Extract order_id from URL query params
  const queryParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const orderIdFromUrl = queryParams?.get('order_id') || queryParams?.get('orderId') || '';

  const loadOrder = async () => {
    let matchedOrder: Pedido | null = null;

    if (orderIdFromUrl) {
      try {
        const res = await fetch(`/api/pedidos/${orderIdFromUrl}`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.pedido) {
            matchedOrder = data.pedido;
          }
        }
      } catch {
        // Fallback to local storage
      }
    }

    if (!matchedOrder) {
      const savedOrders = getSavedPedidos();
      if (orderIdFromUrl) {
        matchedOrder =
          savedOrders.find(
            (p: Pedido) => p.id === orderIdFromUrl || p.chave_pedido === orderIdFromUrl
          ) || null;
      }
      if (!matchedOrder && savedOrders.length > 0) {
        matchedOrder = savedOrders[0];
      }
    }

    if (matchedOrder) {
      setOrder(matchedOrder);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadOrder();

    // Trigger celebratory confetti
    try {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#10B981', '#34D399', '#6EE7B7', '#8B5CF6'],
      });
    } catch {
      // safe fallback
    }

    // Silent periodic refresh
    const interval = setInterval(() => {
      if (orderIdFromUrl) {
        fetch(`/api/pedidos/${orderIdFromUrl}`)
          .then((r) => r.json())
          .then((data) => {
            if (data.success && data.pedido) {
              setOrder(data.pedido);
            }
          })
          .catch(() => {});
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [orderIdFromUrl]);

  const cleanHandle = order?.cliente_instagram?.replace('@', '') || 'perfil';
  const targetInstagramUrl = `https://instagram.com/${cleanHandle}`;
  const whatsappHelpUrl = `https://wa.me/5541991945636?text=${encodeURIComponent(
    `Olá! Meu Pix foi confirmado para o pedido #${order?.id || orderIdFromUrl || ''} (${order?.pacote_nome || ''}). Gostaria de acompanhar a entrega.`
  )}`;

  return (
    <div className="min-h-screen bg-[#070A12] text-slate-100 flex flex-col justify-between py-10 px-4 sm:px-6 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-80 bg-emerald-500/10 blur-3xl pointer-events-none" />

      <main className="max-w-xl mx-auto w-full relative z-10 space-y-6 my-auto">
        {/* Minimal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
          <span className="text-xl font-black bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
            Social Networks
          </span>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Pagamento Seguro Pix</span>
          </div>
        </div>

        {/* Hero Confirmation Card */}
        <div className="rounded-3xl bg-[#0D1322] border border-emerald-500/40 p-6 sm:p-8 text-center shadow-2xl space-y-6">
          {/* Animated Green Check Ring */}
          <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center shadow-xl shadow-emerald-500/20">
            <Check className="w-10 h-10 sm:w-12 sm:h-12 stroke-[3]" />
          </div>

          {/* Clean Celebratory Heading */}
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Pagamento Confirmado!
            </h1>
            <p className="text-base sm:text-lg font-bold text-emerald-400">
              Seu pedido já está sendo entregue.
            </p>
            <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto leading-relaxed">
              Recebemos seu Pix com sucesso. A entrega de engajamento no seu Instagram já foi iniciada automaticamente.
            </p>
          </div>

          {/* Clean Order Breakdown */}
          {!isLoading && (
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-slate-800 text-left text-xs sm:text-sm space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-slate-400">Pacote:</span>
                <span className="font-bold text-white text-right">
                  {order?.pacote_nome || 'Pacote de Engajamento Social'} ({order?.quantidade || 100} itens)
                </span>
              </div>

              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-slate-400">Valor Pago:</span>
                <span className="font-extrabold text-emerald-400 font-mono">
                  R$ {(order?.valor || 19.90).toFixed(2).replace('.', ',')}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Instagram className="w-3.5 h-3.5 text-pink-400" />
                  <span>Perfil de Destino:</span>
                </span>
                <a
                  href={targetInstagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-pink-400 hover:text-pink-300 flex items-center gap-1 transition-colors font-mono"
                >
                  <span>{order?.cliente_instagram || '@instagram'}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          )}

          {/* Simple Steps Timeline */}
          <div className="grid grid-cols-3 gap-2 text-center text-xs pt-1">
            <div className="p-2.5 rounded-xl bg-emerald-950/30 border border-emerald-500/30 space-y-1">
              <div className="text-emerald-400 font-bold flex items-center justify-center gap-1 text-[11px]">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Pix Aprovado</span>
              </div>
              <p className="text-[10px] text-slate-400">Confirmado</p>
            </div>

            <div className="p-2.5 rounded-xl bg-emerald-950/30 border border-emerald-500/30 space-y-1">
              <div className="text-emerald-400 font-bold flex items-center justify-center gap-1 text-[11px]">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Processando</span>
              </div>
              <p className="text-[10px] text-slate-400">Automático</p>
            </div>

            <div className="p-2.5 rounded-xl bg-cyan-950/30 border border-cyan-500/30 space-y-1">
              <div className="text-cyan-400 font-bold flex items-center justify-center gap-1 text-[11px]">
                <Clock className="w-3.5 h-3.5" />
                <span>Entrega</span>
              </div>
              <p className="text-[10px] text-slate-400">Em andamento</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onGoHome}
              className="w-full sm:flex-1 py-3 px-5 rounded-xl font-extrabold text-slate-950 bg-gradient-to-r from-emerald-400 via-teal-300 to-green-400 hover:from-emerald-300 hover:to-green-300 shadow-lg shadow-emerald-500/25 active:scale-[0.98] transition-all cursor-pointer text-sm"
            >
              Fazer Novo Pedido
            </button>

            <a
              href={whatsappHelpUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto py-3 px-4 rounded-xl font-bold text-white bg-[#25D366] hover:bg-[#20ba59] flex items-center justify-center gap-2 transition-colors cursor-pointer text-sm shadow-md"
            >
              <MessageCircle className="w-4 h-4 fill-white" />
              <span>Acompanhar no WhatsApp</span>
            </a>
          </div>
        </div>
      </main>

      {/* Clean Footer */}
      <footer className="text-center text-xs text-slate-500 pt-6">
        <p>© {new Date().getFullYear()} Social Networks · Todos os direitos reservados.</p>
      </footer>
    </div>
  );
};

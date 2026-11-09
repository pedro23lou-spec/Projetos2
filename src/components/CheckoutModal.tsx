import React, { useState, useEffect, useRef } from 'react';
import { PackageItem, InfinitePayConfig, Pedido } from '../types';
import {
  X,
  Check,
  ArrowRight,
  ExternalLink,
  MessageCircle,
  Instagram,
  CheckCircle2,
  AlertTriangle,
  Eye,
  Heart,
  Film,
  Camera,
  RefreshCw,
  Search,
  Unlock,
  ShieldCheck,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  verifyInstagramProfile,
  verifyInstagramPost,
  InstagramProfile,
  InstagramPost,
} from '../services/instagramService';
import { savePedido, updatePedido } from '../services/supabaseService';
import { getSavedSmmConfig, sendOrderToSmm } from '../services/smmService';

interface CheckoutModalProps {
  packageItem: PackageItem | null;
  isOpen: boolean;
  onClose: () => void;
  infinitePayConfig?: InfinitePayConfig;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  packageItem,
  isOpen,
  onClose,
  infinitePayConfig,
}) => {
  const [step, setStep] = useState<'form' | 'redirecting' | 'success'>('form');
  const [hostedCheckoutUrl, setHostedCheckoutUrl] = useState('');
  const [profileOrUrl, setProfileOrUrl] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');

  // Instagram Verification States
  const [isVerifyingTarget, setIsVerifyingTarget] = useState(false);
  const [verifiedProfile, setVerifiedProfile] = useState<InstagramProfile | null>(null);
  const [verifiedPost, setVerifiedPost] = useState<InstagramPost | null>(null);
  const [isTargetConfirmed, setIsTargetConfirmed] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [formValidationError, setFormValidationError] = useState<string | null>(null);

  // Order Identifiers
  const [orderId, setOrderId] = useState('');
  const [orderKey, setOrderKey] = useState('');
  const [isCreatingCharge, setIsCreatingCharge] = useState(false);
  const verifiedRef = useRef(false);

  // Reset state on open
  useEffect(() => {
    if (isOpen) {
      setStep('form');
      setProfileOrUrl('');
      setWhatsapp('');
      setEmail('');
      setHostedCheckoutUrl('');
      setIsCreatingCharge(false);
      verifiedRef.current = false;

      setIsVerifyingTarget(false);
      setVerifiedProfile(null);
      setVerifiedPost(null);
      setIsTargetConfirmed(false);
      setVerificationError(null);
      setFormValidationError(null);

      const randomNum = Math.floor(100000 + Math.random() * 900000);
      const generatedOrderId = `INF-${randomNum}`;
      const generatedKey = `KEY-INF-${randomNum}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

      setOrderId(generatedOrderId);
      setOrderKey(generatedKey);
    }
  }, [isOpen]);

  // Silent real-time payment status polling (runs every 3s in background without toasts)
  useEffect(() => {
    if (step !== 'redirecting' || !orderId || verifiedRef.current) return;

    let isPolling = true;

    const pollPaymentStatus = async () => {
      if (!isPolling || verifiedRef.current) return;

      try {
        const queryParams = new URLSearchParams({
          order_id: orderId,
        });
        if (infinitePayConfig?.apiKey) {
          queryParams.append('apiKey', infinitePayConfig.apiKey);
        }

        const res = await fetch(`/api/infinitepay/check-status?${queryParams.toString()}`);
        if (!res.ok) return;

        const data = await res.json();
        const isPaid =
          data.paid === true ||
          data.status === 'PAID' ||
          data.status === 'APPROVED' ||
          data.status_pagamento === 'Aprovado' ||
          data.isPaid === true;

        if (isPaid && !verifiedRef.current) {
          verifiedRef.current = true;
          triggerPaymentSuccess();
        }
      } catch {
        // Silent background polling
      }
    };

    const pollInterval = setInterval(pollPaymentStatus, 3000);
    return () => {
      isPolling = false;
      clearInterval(pollInterval);
    };
  }, [step, orderId, infinitePayConfig]);

  // Verification Handler
  const handleVerifyInstagram = async (targetInput?: string) => {
    const rawInput = (targetInput !== undefined ? targetInput : profileOrUrl).trim();
    if (!rawInput || !packageItem) return;

    setIsVerifyingTarget(true);
    setVerificationError(null);
    setFormValidationError(null);
    setIsTargetConfirmed(false);

    try {
      if (packageItem.category === 'seguidores') {
        const profile = await verifyInstagramProfile(rawInput);
        setVerifiedProfile(profile);
        setVerifiedPost(null);

        if (profile.isPrivate) {
          setVerificationError(
            'Perfil privado ou não encontrado. Por favor, desbloqueie seu perfil para receber os seguidores/curtidas.'
          );
        }
      } else {
        const post = await verifyInstagramPost(rawInput);
        setVerifiedPost(post);
        setVerifiedProfile(null);

        if (post.isPrivate) {
          setVerificationError(
            'Perfil privado ou não encontrado. Por favor, desbloqueie seu perfil para receber os seguidores/curtidas.'
          );
        }
      }
    } catch (err: any) {
      const errMsg =
        err.message ||
        'Perfil privado ou não encontrado. Por favor, desbloqueie seu perfil para receber os seguidores/curtidas.';
      setVerificationError(errMsg);
      if (err.profileData) setVerifiedProfile(err.profileData);
      else if (err.postData) setVerifiedPost(err.postData);
    } finally {
      setIsVerifyingTarget(false);
    }
  };

  const handleTargetInputChange = (val: string) => {
    setProfileOrUrl(val);
    setIsTargetConfirmed(false);
    setVerificationError(null);
    setFormValidationError(null);
    setVerifiedProfile(null);
    setVerifiedPost(null);
  };

  if (!isOpen || !packageItem) return null;

  const handleWhatsappChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 11) value = value.slice(0, 11);

    if (value.length > 6) {
      value = `(${value.slice(0, 2)}) ${value.slice(2, 7)}-${value.slice(7)}`;
    } else if (value.length > 2) {
      value = `(${value.slice(0, 2)}) ${value.slice(2)}`;
    } else if (value.length > 0) {
      value = `(${value}`;
    }
    setWhatsapp(value);
    setFormValidationError(null);
  };

  const isFollowers = packageItem.category === 'seguidores';
  const targetIsPrivate = Boolean(
    (isFollowers ? verifiedProfile?.isPrivate : verifiedPost?.isPrivate) ||
      (verificationError && verificationError.includes('Perfil privado'))
  );

  const isTargetVerifiedAndPublic = isFollowers
    ? Boolean(verifiedProfile && !verifiedProfile.isPrivate)
    : Boolean(verifiedPost && !verifiedPost.isPrivate);

  const canProceedToBuy = Boolean(isTargetVerifiedAndPublic && isTargetConfirmed && !targetIsPrivate);

  // Form Submit: Creates checkout and opens payment page in a new tab
  const handleGeneratePix = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormValidationError(null);

    if (!profileOrUrl.trim()) {
      setFormValidationError('Por favor, informe seu @perfil ou o link do post.');
      return;
    }

    if (isFollowers) {
      if (!verifiedProfile) {
        setFormValidationError('Clique em "Verificar" antes de avançar para o pagamento.');
        handleVerifyInstagram();
        return;
      }
      if (verifiedProfile.isPrivate) {
        setVerificationError(
          'Perfil privado ou não encontrado. Por favor, desbloqueie seu perfil para receber os seguidores/curtidas.'
        );
        return;
      }
      if (!isTargetConfirmed) {
        setFormValidationError('Por favor, confirme que a foto e o @ são seus para continuar.');
        return;
      }
    } else {
      if (!verifiedPost) {
        setFormValidationError('Clique em "Verificar" antes de avançar para o pagamento.');
        handleVerifyInstagram();
        return;
      }
      if (verifiedPost.isPrivate) {
        setVerificationError(
          'Perfil privado ou não encontrado. Por favor, desbloqueie seu perfil para receber os seguidores/curtidas.'
        );
        return;
      }
      if (!isTargetConfirmed) {
        setFormValidationError('Por favor, confirme que a foto da publicação é a correta.');
        return;
      }
    }

    if (whatsapp.length < 14) {
      setFormValidationError('Por favor, informe um WhatsApp válido com DDD.');
      return;
    }

    setIsCreatingCharge(true);

    const targetHandle = verifiedProfile
      ? `@${verifiedProfile.username}`
      : verifiedPost
      ? `@${verifiedPost.author}`
      : profileOrUrl;
    const cleanHandle =
      String(infinitePayConfig?.handle || 'socialnetworks').replace(/[$@]/g, '').trim() ||
      'socialnetworks';
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const returnRedirectUrl = `${origin}/sucesso?order_id=${orderId}`;

    try {
      const chargeRes = await fetch('/api/infinitepay/create-charge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          handle: cleanHandle,
          amount: packageItem.price,
          order_id: orderId,
          external_id: orderId,
          redirect_url: returnRedirectUrl,
          service_id: packageItem.serviceId || '101',
          package_id: packageItem.id,
          package_name: packageItem.name,
          quantity: packageItem.quantity,
          customer: {
            name: verifiedProfile?.fullName || targetHandle,
            whatsapp: whatsapp.replace(/\D/g, ''),
            instagram: targetHandle,
            email,
          },
          apiKey: infinitePayConfig?.apiKey,
        }),
      });

      const chargeData = await chargeRes.json();
      const pixDirectQuery = 'payment_method=pix&default_payment_method=pix';
      let targetCheckoutUrl =
        chargeData.checkout_url ||
        chargeData.url ||
        chargeData.payment_url ||
        `https://link.infinitepay.io/${cleanHandle}?amount=${packageItem.price}&order_id=${orderId}&${pixDirectQuery}&redirect_url=${encodeURIComponent(
          returnRedirectUrl
        )}`;

      if (targetCheckoutUrl && !targetCheckoutUrl.includes('payment_method=')) {
        targetCheckoutUrl += (targetCheckoutUrl.includes('?') ? '&' : '?') + pixDirectQuery;
      }

      setHostedCheckoutUrl(targetCheckoutUrl);

      // Save initial pending order to database
      const initialPedido: Pedido = {
        id: orderId,
        chave_pedido: orderKey,
        cliente_whatsapp: whatsapp,
        cliente_instagram: targetHandle,
        pacote_id: packageItem.id,
        pacote_nome: packageItem.name,
        pacote_categoria: packageItem.category,
        quantidade: packageItem.quantity,
        valor: packageItem.price,
        status_pagamento: 'Pendente',
        status_smm: 'Pendente',
        checkout_id: chargeData.checkout_id || orderId,
        transaction_id: chargeData.transaction_id || orderId,
        checkout_url: targetCheckoutUrl,
        service_id: packageItem.serviceId || '101',
        data_hora: new Date().toLocaleString('pt-BR'),
      };
      savePedido(initialPedido);

      // Switch to clean monitoring modal
      setStep('redirecting');

      // Open checkout in new tab
      if (typeof window !== 'undefined') {
        window.open(targetCheckoutUrl, '_blank');
      }
    } catch {
      const fallbackCheckoutUrl = `https://link.infinitepay.io/${cleanHandle}?amount=${packageItem.price}&order_id=${orderId}&payment_method=pix&default_payment_method=pix&redirect_url=${encodeURIComponent(
        returnRedirectUrl
      )}`;
      setHostedCheckoutUrl(fallbackCheckoutUrl);
      setStep('redirecting');

      if (typeof window !== 'undefined') {
        window.open(fallbackCheckoutUrl, '_blank');
      }
    } finally {
      setIsCreatingCharge(false);
    }
  };

  // Payment Success Handler
  const triggerPaymentSuccess = async () => {
    setStep('success');

    try {
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    } catch {
      // safe fallback
    }

    const targetHandle = verifiedProfile
      ? `@${verifiedProfile.username}`
      : verifiedPost
      ? `@${verifiedPost.author}`
      : profileOrUrl;
    const targetLink = `https://instagram.com/${targetHandle.replace('@', '')}`;

    // Update order status in local/cloud storage
    await updatePedido(orderId, {
      status_pagamento: 'Aprovado',
    });

    // Automated SMM Dispatch
    const smmConfig = getSavedSmmConfig();
    if (smmConfig.enabled && smmConfig.apiUrl && smmConfig.apiKey && packageItem.serviceId) {
      try {
        const smmRes = await sendOrderToSmm({
          apiUrl: smmConfig.apiUrl,
          apiKey: smmConfig.apiKey,
          service: packageItem.serviceId,
          link: targetLink,
          quantity: packageItem.quantity,
        });

        if (smmRes.success && smmRes.orderId) {
          await updatePedido(orderId, {
            status_smm: 'Enviado',
            order_id_fornecedor: smmRes.orderId,
            smm_response_log: JSON.stringify(smmRes.raw),
          });
        }
      } catch {
        // silent fallback
      }
    }

    // Ping backend webhook
    try {
      await fetch('/api/webhook/infinitepay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'pix.received',
          order_id: orderId,
          orderKey,
          amount: packageItem.price,
          smmConfig,
        }),
      });
    } catch {
      // silent
    }
  };

  const targetHandleDisplay = verifiedProfile
    ? `@${verifiedProfile.username}`
    : verifiedPost
    ? `@${verifiedPost.author}`
    : profileOrUrl;

  const whatsappSupportUrl = `https://wa.me/5541991945636?text=${encodeURIComponent(
    `Olá! Meu Pix foi confirmado. Meu pedido é #${orderId} (${packageItem.name}) para ${targetHandleDisplay}.`
  )}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      {/* Modal Dialog Container */}
      <div className="relative w-full max-w-lg rounded-2xl bg-[#0A0E17] border border-slate-800 shadow-2xl overflow-hidden my-6">
        {/* Clean Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800/80 bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm sm:text-base font-bold text-white leading-tight">
              {step === 'form' && 'Finalizar Pedido'}
              {step === 'redirecting' && 'Pagamento em Andamento'}
              {step === 'success' && 'Pagamento Confirmado'}
            </h3>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 max-h-[82vh] overflow-y-auto">
          {/* ================= STEP 1: FORM (TARGET + WHATSAPP) ================= */}
          {step === 'form' && (
            <>
              {/* Package Summary Card */}
              <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 mb-5 flex items-center justify-between gap-3">
                <div>
                  <div className="text-xs text-purple-400 font-semibold uppercase">
                    {packageItem.category} · {packageItem.quantity.toLocaleString('pt-BR')} itens
                  </div>
                  <div className="text-sm font-bold text-white mt-0.5">{packageItem.name}</div>
                  <div className="text-xs text-slate-400">Entrega rápida e automática</div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-[11px] text-slate-400">Total</div>
                  <div className="text-lg sm:text-xl font-extrabold text-emerald-400 font-mono">
                    R$ {packageItem.price.toFixed(2).replace('.', ',')}
                  </div>
                </div>
              </div>

              <form onSubmit={handleGeneratePix} className="space-y-4">
                {/* Field 1: Instagram Target with Verification */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-200 uppercase tracking-wider">
                    {isFollowers ? 'Seu @Perfil no Instagram' : 'Link da Publicação / Post / Reel'}{' '}
                    <span className="text-emerald-400">*</span>
                  </label>

                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="relative flex-1">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 flex items-center pointer-events-none">
                        <Instagram className="w-4 h-4 text-pink-500" />
                      </div>
                      <input
                        type="text"
                        required
                        value={profileOrUrl}
                        onChange={(e) => handleTargetInputChange(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleVerifyInstagram(profileOrUrl);
                          }
                        }}
                        placeholder={
                          isFollowers
                            ? '@seu_perfil (ex: @anaclara.oficial)'
                            : 'https://www.instagram.com/p/...'
                        }
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700/80 text-white text-sm focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => handleVerifyInstagram(profileOrUrl)}
                      disabled={isVerifyingTarget || !profileOrUrl.trim()}
                      className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-purple-600 hover:bg-purple-500 text-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 shadow-md transition-all cursor-pointer shrink-0"
                    >
                      {isVerifyingTarget ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Verificando...</span>
                        </>
                      ) : (
                        <>
                          <Search className="w-3.5 h-3.5" />
                          <span>Verificar</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Red Alert For Private Profile */}
                  {verificationError && !isVerifyingTarget && (
                    <div className="p-3 rounded-xl bg-rose-950/70 border border-rose-500 text-rose-200 text-xs flex items-start gap-2.5">
                      <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold">{verificationError}</div>
                        <button
                          type="button"
                          onClick={() => handleVerifyInstagram(profileOrUrl)}
                          className="mt-1.5 px-2.5 py-1 rounded-lg bg-rose-500 hover:bg-rose-400 text-slate-950 font-bold text-[11px] flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <RefreshCw className="w-3 h-3" />
                          <span>Já deixei público · Testar Novamente</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Profile Confirmation Card */}
                  {isFollowers && verifiedProfile && !isVerifyingTarget && !verifiedProfile.isPrivate && (
                    <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full p-[2px] bg-gradient-to-tr from-amber-400 via-rose-500 to-purple-600 shrink-0 overflow-hidden">
                          <img
                            src={verifiedProfile.avatarUrl}
                            alt={verifiedProfile.username}
                            className="w-full h-full rounded-full object-cover bg-slate-800"
                            onError={(e) => {
                              const target = e.currentTarget;
                              if (target.src !== verifiedProfile.fallbackAvatarUrl) {
                                target.src = verifiedProfile.fallbackAvatarUrl;
                              }
                            }}
                          />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <h4 className="text-sm font-bold text-white truncate">
                              {verifiedProfile.fullName}
                            </h4>
                            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300">
                              <Unlock className="w-2.5 h-2.5" />
                              Público
                            </span>
                          </div>
                          <div className="text-xs text-purple-300 font-mono truncate">
                            @{verifiedProfile.username}
                          </div>
                        </div>
                      </div>

                      <div>
                        {!isTargetConfirmed ? (
                          <button
                            type="button"
                            onClick={() => setIsTargetConfirmed(true)}
                            className="w-full py-2.5 px-3 rounded-xl font-bold text-xs text-white bg-purple-600 hover:bg-purple-500 flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md"
                          >
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            <span>Confirmar: A foto e o @ são meus</span>
                          </button>
                        ) : (
                          <div className="p-2 rounded-xl bg-emerald-950/40 border border-emerald-500/40 flex items-center justify-between text-xs font-bold text-emerald-300">
                            <span className="flex items-center gap-1.5">
                              <Check className="w-4 h-4 text-emerald-400" />
                              Perfil confirmado para entrega!
                            </span>
                            <button
                              type="button"
                              onClick={() => setIsTargetConfirmed(false)}
                              className="text-[11px] text-slate-400 hover:text-white underline cursor-pointer"
                            >
                              Trocar
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Post Confirmation Card */}
                  {!isFollowers && verifiedPost && !isVerifyingTarget && !verifiedPost.isPrivate && (
                    <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-slate-800 shrink-0 border border-slate-700">
                          <img
                            src={verifiedPost.thumbnailUrl}
                            alt="Foto da publicação"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-black/70 text-[10px] font-bold text-white flex items-center gap-1">
                            {verifiedPost.type === 'reel' ? (
                              <Film className="w-3 h-3 text-pink-400" />
                            ) : (
                              <Camera className="w-3 h-3 text-cyan-400" />
                            )}
                          </div>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-bold text-purple-300 font-mono">
                            @{verifiedPost.author}
                          </div>
                          <p className="text-[11px] text-slate-300 line-clamp-2 mt-1">
                            {verifiedPost.caption}
                          </p>
                          <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1.5">
                            <span className="flex items-center gap-1 text-rose-300">
                              <Heart className="w-3 h-3 fill-rose-500/30 text-rose-400" />
                              {verifiedPost.likesCount}
                            </span>
                            {verifiedPost.viewsCount && (
                              <span className="flex items-center gap-1 text-cyan-300">
                                <Eye className="w-3 h-3 text-cyan-400" />
                                {verifiedPost.viewsCount.toLocaleString('pt-BR')}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div>
                        {!isTargetConfirmed ? (
                          <button
                            type="button"
                            onClick={() => setIsTargetConfirmed(true)}
                            className="w-full py-2.5 px-3 rounded-xl font-bold text-xs text-white bg-purple-600 hover:bg-purple-500 flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md"
                          >
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            <span>Confirmar: Esta é a publicação correta</span>
                          </button>
                        ) : (
                          <div className="p-2 rounded-xl bg-emerald-950/40 border border-emerald-500/40 flex items-center justify-between text-xs font-bold text-emerald-300">
                            <span className="flex items-center gap-1.5">
                              <Check className="w-4 h-4 text-emerald-400" />
                              Publicação confirmada para entrega!
                            </span>
                            <button
                              type="button"
                              onClick={() => setIsTargetConfirmed(false)}
                              className="text-[11px] text-slate-400 hover:text-white underline cursor-pointer"
                            >
                              Trocar
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Field 2: WhatsApp */}
                <div>
                  <label className="block text-xs font-bold text-slate-200 uppercase tracking-wider mb-1.5">
                    WhatsApp para Acompanhamento <span className="text-emerald-400">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={whatsapp}
                    onChange={handleWhatsappChange}
                    placeholder="(11) 98765-4321"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700/80 text-white text-sm font-mono focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                  />
                </div>

                {/* Inline Validation Error */}
                {formValidationError && (
                  <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-200 text-xs">
                    {formValidationError}
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={!canProceedToBuy || isCreatingCharge}
                  className={`w-full mt-3 flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl font-extrabold text-sm transition-all ${
                    !canProceedToBuy || isCreatingCharge
                      ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed opacity-80'
                      : 'text-slate-950 bg-gradient-to-r from-emerald-400 via-teal-300 to-green-400 hover:from-emerald-300 hover:to-green-300 shadow-lg shadow-emerald-500/25 active:scale-[0.98] cursor-pointer'
                  }`}
                >
                  {isCreatingCharge ? (
                    <>
                      <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                      <span>Abrindo pagamento...</span>
                    </>
                  ) : (
                    <>
                      <span>
                        {!isTargetVerifiedAndPublic
                          ? 'Clique em "Verificar" acima para validar'
                          : !isTargetConfirmed
                          ? 'Confirme o perfil acima para continuar'
                          : `Ir para o Pagamento · R$ ${packageItem.price.toFixed(2).replace('.', ',')}`}
                      </span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </>
          )}

          {/* ================= STEP 2: MODAL DE ACOMPANHAMENTO ULTRALIMPO ================= */}
          {step === 'redirecting' && (
            <div className="space-y-6 text-center py-4 px-2">
              {/* Resumo Direto do Pacote */}
              <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
                <div className="text-left">
                  <div className="text-xs text-slate-400 font-medium">Pacote Selecionado</div>
                  <div className="text-base font-bold text-white mt-0.5">{packageItem.name}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-400 font-medium">Valor</div>
                  <div className="text-xl font-extrabold text-emerald-400 font-mono">
                    R$ {packageItem.price.toFixed(2).replace('.', ',')}
                  </div>
                </div>
              </div>

              {/* Animated Spinner Icon */}
              <div className="w-14 h-14 mx-auto rounded-full bg-emerald-500/15 flex items-center justify-center">
                <div className="w-7 h-7 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
              </div>

              {/* Aviso Simples e Direto Requisitado */}
              <div className="space-y-1.5 max-w-sm mx-auto">
                <h4 className="text-base font-bold text-white">
                  Página de pagamento aberta em uma nova aba!
                </h4>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Assim que o Pix for concluído, seu pedido será enviado automaticamente.
                </p>
              </div>

              {/* Único Botão Limpo e Destacado */}
              <div className="pt-2 space-y-3">
                <a
                  href={hostedCheckoutUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3.5 px-5 rounded-xl font-bold text-sm sm:text-base text-slate-950 bg-gradient-to-r from-emerald-400 via-teal-300 to-green-400 hover:from-emerald-300 hover:to-green-300 shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <span>👉 Ir para a Tela de Pagamento</span>
                  <ExternalLink className="w-4 h-4 shrink-0" />
                </a>

                <button
                  type="button"
                  onClick={() => setStep('form')}
                  className="text-xs text-slate-500 hover:text-slate-300 underline cursor-pointer transition-colors"
                >
                  Voltar ou alterar dados
                </button>
              </div>
            </div>
          )}

          {/* ================= STEP 3: TELA DE SUCESSO MINIMALISTA ================= */}
          {step === 'success' && (
            <div className="space-y-6 text-center py-6 px-2">
              {/* Ícone de Check Verde */}
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
                <Check className="w-8 h-8 stroke-[3]" />
              </div>

              {/* Mensagem Limpa e Comemorativa Requisitada */}
              <div className="space-y-2">
                <h4 className="text-2xl font-extrabold text-white">Pagamento Confirmado!</h4>
                <p className="text-sm font-semibold text-emerald-400">
                  Seu pedido já está sendo entregue.
                </p>
              </div>

              {/* Resumo Direto */}
              <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 text-left text-xs sm:text-sm space-y-2.5">
                <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                  <span className="text-slate-400">Pacote:</span>
                  <span className="font-bold text-white">{packageItem.name}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                  <span className="text-slate-400">Valor Pago:</span>
                  <span className="font-extrabold text-emerald-400 font-mono">
                    R$ {packageItem.price.toFixed(2).replace('.', ',')}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Destino:</span>
                  <span className="font-bold text-purple-300 font-mono">{targetHandleDisplay}</span>
                </div>
              </div>

              {/* Botões Limpos */}
              <div className="pt-2 space-y-2.5">
                <a
                  href={whatsappSupportUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-xs sm:text-sm text-white bg-[#25D366] hover:bg-[#20ba59] shadow-md transition-all cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4 fill-white" />
                  <span>Acompanhar no WhatsApp</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>

                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-2.5 text-xs font-semibold text-slate-400 hover:text-white rounded-xl bg-slate-900 hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Concluir e Fechar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

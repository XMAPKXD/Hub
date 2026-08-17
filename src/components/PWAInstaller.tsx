import React, { useState, useEffect } from 'react';
import { 
  Download, 
  Smartphone, 
  CheckCircle2, 
  Bell, 
  Share, 
  Info, 
  Sparkles, 
  X, 
  Zap, 
  Wifi, 
  WifiOff, 
  ShieldCheck, 
  ChevronRight,
  Send
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface PWAInstallerProps {
  onAddXP?: (amount: number, reason: string) => void;
  triggerAudio?: (type: 'tap' | 'levelUp' | 'success') => void;
  forceOpenModal?: boolean;
  onCloseModal?: () => void;
}

export default function PWAInstaller({ onAddXP, triggerAudio, forceOpenModal, onCloseModal }: PWAInstallerProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [activeGuideTab, setActiveGuideTab] = useState<'auto' | 'android' | 'ios' | 'desktop'>('auto');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [bannerDismissed, setBannerDismissed] = useState(() => {
    try {
      return localStorage.getItem('pkxd_pwa_banner_dismissed') === 'true';
    } catch {
      return false;
    }
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  useEffect(() => {
    if (forceOpenModal) {
      setShowInstallModal(true);
    }
  }, [forceOpenModal]);

  useEffect(() => {
    // Check standalone / installed mode
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes('android-app://');
    setIsInstalled(isStandalone);

    // Detect Device Type
    const userAgent = window.navigator.userAgent.toLowerCase();
    const iosDevice = /iphone|ipad|ipod/.test(userAgent);
    const androidDevice = /android/.test(userAgent);
    setIsIOS(iosDevice);
    setIsAndroid(androidDevice);

    if (iosDevice) {
      setActiveGuideTab('ios');
    } else if (androidDevice) {
      setActiveGuideTab('android');
    } else {
      setActiveGuideTab('desktop');
    }

    // Listen for beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Track online/offline status
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check notification permission
    if ('Notification' in window) {
      setPushEnabled(Notification.permission === 'granted');
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleNativeInstall = async () => {
    if (triggerAudio) triggerAudio('tap');

    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
        setShowInstallModal(false);
        showToast('🎉 Aplicativo PKXD Central instalado com sucesso!');
        if (onAddXP) onAddXP(100, 'Instalou o aplicativo PKXD Central no Celular');
        if (triggerAudio) triggerAudio('levelUp');
      }
      setDeferredPrompt(null);
    } else {
      setShowInstallModal(true);
    }
  };

  const handleTogglePush = async () => {
    if (triggerAudio) triggerAudio('tap');
    if (!('Notification' in window)) {
      showToast('⚠️ Seu navegador não suporta notificações Push do sistema.');
      return;
    }

    if (Notification.permission === 'granted') {
      showToast('🔔 Notificações do PKXD Central já estão ativas!');
      setPushEnabled(true);
      return;
    }

    try {
      const perm = await Notification.requestPermission();
      if (perm === 'granted') {
        setPushEnabled(true);
        if (triggerAudio) triggerAudio('success');
        if (onAddXP) onAddXP(50, 'Ativou notificações de Spoilers e Eventos');
        showToast('✅ Notificações ativadas! Você receberá avisos de novos eventos e códigos.');

        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
          navigator.serviceWorker.ready.then((reg) => {
            reg.showNotification('PKXD Central 🔔', {
              body: 'Tudo pronto! Você receberá alertas de torneios, spoilers e códigos do jogo.',
              icon: '/favicon.png',
              badge: '/favicon.png'
            });
          });
        }
      } else {
        showToast('ℹ️ Permissão de notificação negada no navegador.');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const dismissBanner = () => {
    setBannerDismissed(true);
    try {
      localStorage.setItem('pkxd_pwa_banner_dismissed', 'true');
    } catch {}
  };

  return (
    <div className="w-full space-y-3 my-3" id="pwa-root-installer">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-purple-950/95 text-yellow-300 border-2 border-yellow-400 px-5 py-3 rounded-2xl shadow-2xl text-xs sm:text-sm font-black uppercase tracking-wider flex items-center gap-2 max-w-md text-center"
          >
            <Sparkles className="w-4 h-4 text-yellow-400 flex-shrink-0 animate-spin" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Offline Status Bar */}
      {!isOnline && (
        <div className="bg-amber-500/20 border-2 border-amber-500/50 p-3.5 rounded-2xl text-amber-200 text-xs font-bold flex items-center justify-between gap-3 shadow-lg animate-pulse">
          <div className="flex items-center gap-2.5">
            <WifiOff className="w-4 h-4 text-amber-400" />
            <span>Modo Offline Ativo — Você está navegando em dados salvos em cache no seu celular! 📱</span>
          </div>
          <span className="text-[10px] bg-amber-500/30 px-2 py-0.5 rounded-lg uppercase font-mono">Cache PWA</span>
        </div>
      )}

      {/* Main PWA Install & Notification Bar Banner */}
      {!bannerDismissed && (
        <div className="bg-gradient-to-r from-purple-950/90 via-zinc-900 to-indigo-950/90 border-2 border-purple-500/40 rounded-3xl p-4 sm:p-5 text-white shadow-[0_4px_25px_rgba(147,51,234,0.2)] relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Top light glow */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full filter blur-xl pointer-events-none" />

          {/* Left info area */}
          <div className="flex items-center gap-3.5 text-left w-full md:w-auto">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 via-pink-500 to-indigo-600 p-0.5 shadow-lg flex-shrink-0 flex items-center justify-center">
              <div className="w-full h-full bg-purple-950 rounded-[14px] flex items-center justify-center text-yellow-300">
                <Smartphone className="w-6 h-6 animate-bounce" />
              </div>
            </div>

            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <h4 className="font-sans font-black text-sm sm:text-base text-white uppercase tracking-wider flex items-center gap-1.5">
                  <span>Instalar PKXD Central no Celular</span>
                  <span className="text-yellow-300">📲</span>
                </h4>
                {isInstalled && (
                  <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-lg text-[9px] font-black uppercase flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Instalado
                  </span>
                )}
              </div>
              <p className="text-[11px] text-gray-300 leading-tight">
                Acesse o app direto da tela inicial do celular com carregamento instantâneo, tela cheia e notificações!
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
            <button
              onClick={handleNativeInstall}
              className="flex-1 md:flex-none px-4 py-2.5 bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 hover:from-pink-400 hover:to-indigo-500 text-white font-sans text-xs font-black uppercase tracking-wider rounded-xl shadow-lg border border-pink-400/40 cursor-pointer transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4 text-yellow-300 animate-pulse" />
              <span>{isInstalled ? 'Ver Guia do App 📱' : 'Instalar App (+100 XP) 🚀'}</span>
            </button>

            <button
              onClick={handleTogglePush}
              className={`flex-1 md:flex-none px-3.5 py-2.5 rounded-xl font-sans text-xs font-black uppercase tracking-wider border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                pushEnabled
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-purple-900/60 hover:bg-purple-800 text-yellow-300 border-purple-500/40'
              }`}
              title="Ativar Notificações Push de Eventos e Spoilers"
            >
              <Bell className={`w-3.5 h-3.5 ${pushEnabled ? 'text-emerald-400' : 'animate-bounce text-yellow-300'}`} />
              <span>{pushEnabled ? 'Alertas Ativos 🔔' : 'Notificações 🔔'}</span>
            </button>

            <button
              onClick={dismissBanner}
              className="p-2 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-xl transition-all cursor-pointer"
              title="Fechar Banner"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Comprehensive Install & PWA Guide Modal */}
      {showInstallModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fade-in">
          <div className="bg-zinc-900 border-2 border-purple-500/50 rounded-3xl p-6 w-full max-w-lg relative shadow-2xl text-left space-y-5 max-h-[90vh] overflow-y-auto">
            
            {/* Close button */}
            <button
              onClick={() => {
                setShowInstallModal(false);
                if (onCloseModal) onCloseModal();
              }}
              className="absolute top-4 right-4 p-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-full cursor-pointer transition-all"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-pink-500 to-purple-600 p-0.5 shadow-lg flex items-center justify-center">
                <div className="w-full h-full bg-zinc-900 rounded-[14px] flex items-center justify-center text-yellow-300">
                  <Smartphone className="w-6 h-6" />
                </div>
              </div>
              <div>
                <h3 className="font-sans font-black text-lg text-white uppercase tracking-wide">
                  Instalar PKXD Central 📲
                </h3>
                <p className="text-xs text-purple-300">
                  Tenha a Central PK XD direto no seu celular como aplicativo oficial!
                </p>
              </div>
            </div>

            {/* Direct Native Button if available */}
            {deferredPrompt && (
              <div className="p-4 bg-purple-950/80 border-2 border-purple-400 rounded-2xl space-y-2">
                <p className="text-xs text-white font-bold">
                  ✨ Seu navegador suporta instalação instantânea em 1 toque:
                </p>
                <button
                  onClick={handleNativeInstall}
                  className="w-full py-3 bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 hover:from-pink-400 hover:to-indigo-500 text-white font-sans text-xs font-black uppercase tracking-wider rounded-xl shadow-xl border border-white/20 cursor-pointer flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4 text-yellow-300" />
                  <span>Instalar Agora no Celular 🚀</span>
                </button>
              </div>
            )}

            {/* Guide Tabs for different operating systems */}
            <div className="space-y-3">
              <div className="flex items-center gap-1.5 p-1 bg-black/50 rounded-xl border border-white/10 text-xs">
                <button
                  onClick={() => setActiveGuideTab('android')}
                  className={`flex-1 py-2 px-2 rounded-lg font-black uppercase text-[11px] transition-all cursor-pointer ${
                    activeGuideTab === 'android'
                      ? 'bg-purple-600 text-white shadow-md'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  🤖 Android (Chrome)
                </button>
                <button
                  onClick={() => setActiveGuideTab('ios')}
                  className={`flex-1 py-2 px-2 rounded-lg font-black uppercase text-[11px] transition-all cursor-pointer ${
                    activeGuideTab === 'ios'
                      ? 'bg-pink-600 text-white shadow-md'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  🍎 iPhone / iPad (Safari)
                </button>
                <button
                  onClick={() => setActiveGuideTab('desktop')}
                  className={`flex-1 py-2 px-2 rounded-lg font-black uppercase text-[11px] transition-all cursor-pointer ${
                    activeGuideTab === 'desktop'
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  💻 PC / Mac
                </button>
              </div>

              {/* Android Guide */}
              {activeGuideTab === 'android' && (
                <div className="space-y-2.5 text-xs text-white">
                  <div className="flex items-start gap-2.5 p-3 bg-black/40 rounded-xl border border-white/10">
                    <span className="w-5 h-5 rounded-full bg-purple-500 text-white text-[10px] flex items-center justify-center flex-shrink-0 font-bold">1</span>
                    <span>Abra este site no <strong>Google Chrome</strong> ou <strong>Samsung Internet</strong> no seu celular.</span>
                  </div>
                  <div className="flex items-start gap-2.5 p-3 bg-black/40 rounded-xl border border-white/10">
                    <span className="w-5 h-5 rounded-full bg-purple-500 text-white text-[10px] flex items-center justify-center flex-shrink-0 font-bold">2</span>
                    <span>Toque no botão de <strong>menu (3 pontinhos ⋮)</strong> no canto superior direito.</span>
                  </div>
                  <div className="flex items-start gap-2.5 p-3 bg-black/40 rounded-xl border border-white/10">
                    <span className="w-5 h-5 rounded-full bg-purple-500 text-white text-[10px] flex items-center justify-center flex-shrink-0 font-bold">3</span>
                    <span>Selecione <strong>"Instalar aplicativo"</strong> ou <strong>"Adicionar à tela inicial" 📲</strong>.</span>
                  </div>
                </div>
              )}

              {/* iOS Safari Guide */}
              {activeGuideTab === 'ios' && (
                <div className="space-y-2.5 text-xs text-white">
                  <div className="flex items-start gap-2.5 p-3 bg-black/40 rounded-xl border border-white/10">
                    <span className="w-5 h-5 rounded-full bg-pink-500 text-white text-[10px] flex items-center justify-center flex-shrink-0 font-bold">1</span>
                    <span>Abra este site no <strong>Safari</strong> no seu iPhone ou iPad.</span>
                  </div>
                  <div className="flex items-start gap-2.5 p-3 bg-black/40 rounded-xl border border-white/10">
                    <span className="w-5 h-5 rounded-full bg-pink-500 text-white text-[10px] flex items-center justify-center flex-shrink-0 font-bold">2</span>
                    <span>Toque no botão de <strong>Compartilhar <Share className="w-3.5 h-3.5 inline text-pink-400 mx-1" /></strong> na barra inferior do Safari.</span>
                  </div>
                  <div className="flex items-start gap-2.5 p-3 bg-black/40 rounded-xl border border-white/10">
                    <span className="w-5 h-5 rounded-full bg-pink-500 text-white text-[10px] flex items-center justify-center flex-shrink-0 font-bold">3</span>
                    <span>Role para baixo e toque em <strong>"Adicionar à Tela de Início ➕"</strong>, depois confirme em <strong>"Adicionar"</strong>.</span>
                  </div>
                </div>
              )}

              {/* Desktop Guide */}
              {activeGuideTab === 'desktop' && (
                <div className="space-y-2.5 text-xs text-white">
                  <div className="flex items-start gap-2.5 p-3 bg-black/40 rounded-xl border border-white/10">
                    <span className="w-5 h-5 rounded-full bg-indigo-500 text-white text-[10px] flex items-center justify-center flex-shrink-0 font-bold">1</span>
                    <span>No <strong>Google Chrome</strong> ou <strong>Microsoft Edge</strong> no computador.</span>
                  </div>
                  <div className="flex items-start gap-2.5 p-3 bg-black/40 rounded-xl border border-white/10">
                    <span className="w-5 h-5 rounded-full bg-indigo-500 text-white text-[10px] flex items-center justify-center flex-shrink-0 font-bold">2</span>
                    <span>Clique no ícone de <strong>Instalar Aplicativo (ícone de monitor com seta ou +)</strong> na barra de endereços URL.</span>
                  </div>
                </div>
              )}
            </div>

            {/* Benefits List */}
            <div className="bg-black/30 p-3.5 rounded-2xl border border-white/5 space-y-2">
              <h5 className="text-[11px] font-black uppercase text-yellow-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> Vantagens do App Instalado:
              </h5>
              <div className="grid grid-cols-2 gap-2 text-[10px] text-gray-300 font-bold">
                <div className="flex items-center gap-1.5">
                  <Zap className="w-3 h-3 text-yellow-400" /> Abertura Instantânea
                </div>
                <div className="flex items-center gap-1.5">
                  <Wifi className="w-3 h-3 text-emerald-400" /> Acesso Offline
                </div>
                <div className="flex items-center gap-1.5">
                  <Bell className="w-3 h-3 text-pink-400" /> Alertas de Spoilers
                </div>
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3 h-3 text-cyan-400" /> Tela Cheia sem Abas
                </div>
              </div>
            </div>

            {/* Bottom Button */}
            <button
              onClick={() => {
                setShowInstallModal(false);
                if (onCloseModal) onCloseModal();
              }}
              className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-sans text-xs font-black uppercase rounded-xl cursor-pointer shadow-lg transition-all"
            >
              Entendido! Fechar Guia 👍
            </button>
          </div>
        </div>
      )}
    </div>
  );
}


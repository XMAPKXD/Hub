import React, { useState, useEffect } from 'react';
import { Download, Smartphone, CheckCircle2, Bell, Share, Info, Sparkles, X } from 'lucide-react';

interface PWAInstallerProps {
  onAddXP?: (amount: number, reason: string) => void;
  triggerAudio?: (type: 'tap' | 'levelUp' | 'success') => void;
}

export default function PWAInstaller({ onAddXP, triggerAudio }: PWAInstallerProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(() => {
    try {
      return localStorage.getItem('pkxd_pwa_banner_dismissed') === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    // Check standalone / installed mode
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    setIsInstalled(isStandalone);

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const iosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(iosDevice);

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

  const handleInstallClick = async () => {
    if (triggerAudio) triggerAudio('tap');

    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
        if (onAddXP) onAddXP(100, 'Instalou o aplicativo PKXD Central');
        if (triggerAudio) triggerAudio('levelUp');
      }
      setDeferredPrompt(null);
    } else if (isIOS) {
      setShowIOSInstructions(true);
    } else {
      alert('Seu navegador já possui o atalho do aplicativo ou está em modo app!');
    }
  };

  const handleTogglePush = async () => {
    if (triggerAudio) triggerAudio('tap');
    if (!('Notification' in window)) {
      alert('Seu dispositivo ou navegador não suporta notificações de sistema.');
      return;
    }

    if (Notification.permission === 'granted') {
      alert('As notificações Push do PKXD Central já estão ativas no seu celular!');
      setPushEnabled(true);
      return;
    }

    try {
      const perm = await Notification.requestPermission();
      if (perm === 'granted') {
        setPushEnabled(true);
        if (triggerAudio) triggerAudio('success');
        if (onAddXP) onAddXP(50, 'Ativou notificações Push');

        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
          navigator.serviceWorker.ready.then((reg) => {
            reg.showNotification('PKXD Central 🔔', {
              body: 'Notificações Push ativadas com sucesso! Você receberá alertas de eventos e spoilers.',
              icon: '/favicon.png',
              badge: '/favicon.png'
            });
          });
        }
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
    <div className="w-full space-y-3 my-4">
      {/* Offline Status Bar */}
      {!isOnline && (
        <div className="bg-amber-500/20 border-2 border-amber-500/50 p-3 rounded-2xl text-amber-200 text-xs font-bold flex items-center justify-between gap-2 shadow-lg animate-pulse">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
            <span>Modo Offline Ativo - Você está navegando em dados salvos em cache! 📱</span>
          </div>
          <span className="text-[10px] bg-amber-500/30 px-2 py-0.5 rounded-lg uppercase">PWA Offline</span>
        </div>
      )}

      {/* Main PWA Install & Notification Bar */}
      {!bannerDismissed && (
        <div className="bg-gradient-to-r from-purple-950/90 via-zinc-900 to-indigo-950/90 border-2 border-purple-500/40 rounded-3xl p-4 sm:p-5 text-white shadow-[0_4px_25px_rgba(147,51,234,0.2)] relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Top light glow */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full filter blur-xl pointer-events-none" />

          {/* Left info area */}
          <div className="flex items-center gap-3.5 text-left w-full md:w-auto">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 p-0.5 shadow-lg flex-shrink-0 flex items-center justify-center">
              <div className="w-full h-full bg-purple-950 rounded-[14px] flex items-center justify-center text-yellow-300">
                <Smartphone className="w-6 h-6 animate-bounce" />
              </div>
            </div>

            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <h4 className="font-sans font-black text-sm sm:text-base text-white uppercase tracking-wider">
                  Instalar PKXD Central 📲
                </h4>
                {isInstalled && (
                  <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-lg text-[9px] font-black uppercase flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Instalado
                  </span>
                )}
              </div>
              <p className="text-[11px] text-gray-300 leading-tight">
                Acesse o app direto da tela do celular sem precisar abrir o navegador, com carregamento ultrarrápido!
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
            {!isInstalled && (
              <button
                onClick={handleInstallClick}
                className="flex-1 md:flex-none px-4 py-2.5 bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 hover:from-pink-400 hover:to-indigo-500 text-white font-sans text-xs font-black uppercase tracking-wider rounded-xl shadow-lg border border-pink-400/40 cursor-pointer transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4 text-yellow-300" />
                <span>Instalar App 🚀</span>
              </button>
            )}

            <button
              onClick={handleTogglePush}
              className={`flex-1 md:flex-none px-3.5 py-2.5 rounded-xl font-sans text-xs font-black uppercase tracking-wider border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                pushEnabled
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-purple-900/60 hover:bg-purple-800 text-yellow-300 border-purple-500/40'
              }`}
              title="Ativar Notificações Push"
            >
              <Bell className={`w-3.5 h-3.5 ${pushEnabled ? 'text-emerald-400' : 'animate-swing text-yellow-300'}`} />
              <span>{pushEnabled ? 'Alertas Ativos 🔔' : 'Notificações 🔔'}</span>
            </button>

            <button
              onClick={dismissBanner}
              className="p-2 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-xl transition-all cursor-pointer"
              title="Fechar Aviso"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Modal for iOS Installation instructions */}
      {showIOSInstructions && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-zinc-900 border-2 border-purple-500/50 rounded-3xl p-6 w-full max-w-md relative shadow-2xl text-left space-y-4">
            <button
              onClick={() => setShowIOSInstructions(false)}
              className="absolute top-4 right-4 p-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-full cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 text-purple-300">
              <Share className="w-6 h-6 text-pink-400" />
              <h3 className="font-sans font-black text-base uppercase">Instalar no iPhone / iPad</h3>
            </div>

            <p className="text-xs text-gray-300 leading-relaxed">
              No Safari do iPhone ou iPad, siga os 2 passos abaixo para adicionar o app à sua tela de início:
            </p>

            <ol className="space-y-3 text-xs text-white font-bold">
              <li className="flex items-start gap-2.5 p-3 bg-black/40 rounded-xl border border-white/10">
                <span className="w-5 h-5 rounded-full bg-pink-500 text-white text-[10px] flex items-center justify-center flex-shrink-0">1</span>
                <span>Toque no botão <strong>Compartilhar <Share className="w-3.5 h-3.5 inline text-pink-400" /></strong> na barra inferior do Safari.</span>
              </li>
              <li className="flex items-start gap-2.5 p-3 bg-black/40 rounded-xl border border-white/10">
                <span className="w-5 h-5 rounded-full bg-purple-500 text-white text-[10px] flex items-center justify-center flex-shrink-0">2</span>
                <span>Role para baixo e selecione <strong>"Adicionar à Tela de Início ➕"</strong>.</span>
              </li>
            </ol>

            <button
              onClick={() => setShowIOSInstructions(false)}
              className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-sans text-xs font-black uppercase rounded-xl cursor-pointer"
            >
              Entendido! 👍
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

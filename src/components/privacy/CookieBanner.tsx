import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Cookie, Settings, Check, X } from 'lucide-react';
import { 
  getStoredCookieConsent, 
  acceptAllCookies, 
  rejectNonEssentialCookies 
} from '../../utils/cookieConsent';

interface CookieBannerProps {
  onOpenPreferences: () => void;
  triggerAudio?: (sound: 'tap' | 'success') => void;
}

export default function CookieBanner({ onOpenPreferences, triggerAudio }: CookieBannerProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if consent has already been registered
    const consent = getStoredCookieConsent();
    if (!consent) {
      // Small delay to prevent layout flicker on initial render
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 700);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAcceptAll = () => {
    if (triggerAudio) triggerAudio('success');
    acceptAllCookies();
    setIsVisible(false);
  };

  const handleRejectNonEssential = () => {
    if (triggerAudio) triggerAudio('tap');
    rejectNonEssentialCookies();
    setIsVisible(false);
  };

  const handleOpenConfig = () => {
    if (triggerAudio) triggerAudio('tap');
    onOpenPreferences();
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <div 
        id="cookie-consent-banner"
        className="fixed bottom-3 sm:bottom-5 inset-x-0 z-40 px-3 sm:px-6 pointer-events-none"
      >
        <motion.div
          initial={{ y: 80, opacity: 0, scale: 0.96 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 80, opacity: 0, scale: 0.96 }}
          transition={{ duration: 0.28, ease: 'easeOut' }}
          className="max-w-4xl mx-auto pointer-events-auto bg-zinc-950/95 backdrop-blur-xl border border-purple-500/30 rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.7)] p-4 sm:p-5 text-white"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            
            {/* Header & Explanation */}
            <div className="flex items-start gap-3 sm:gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center shrink-0 text-purple-300">
                <Cookie className="w-5 h-5" />
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-sans font-black text-sm text-white tracking-wide flex items-center gap-1.5">
                    <span>Nós usamos cookies</span>
                    <span role="img" aria-label="cookie">🍪</span>
                  </h3>
                  <span className="hidden sm:inline-block text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-purple-950/80 border border-purple-500/30 text-purple-300">
                    Privacidade
                  </span>
                </div>
                <p className="text-xs text-zinc-300 leading-relaxed font-sans max-w-2xl">
                  Utilizamos cookies e tecnologias semelhantes para manter o site funcionando, melhorar sua experiência e entender como nossos recursos são utilizados.
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 pt-1 md:pt-0 shrink-0">
              {/* Configurar cookies */}
              <button
                id="cookie-banner-configure-btn"
                onClick={handleOpenConfig}
                className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl text-xs font-bold text-zinc-300 hover:text-white bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-700/80 transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 whitespace-nowrap"
              >
                <Settings className="w-3.5 h-3.5 text-zinc-400" />
                <span>Configurar cookies</span>
              </button>

              {/* Recusar não essenciais */}
              <button
                id="cookie-banner-reject-btn"
                onClick={handleRejectNonEssential}
                className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl text-xs font-bold text-zinc-300 hover:text-white bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-700/80 transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 whitespace-nowrap"
              >
                <X className="w-3.5 h-3.5 text-zinc-400" />
                <span>Recusar não essenciais</span>
              </button>

              {/* Aceitar todos */}
              <button
                id="cookie-banner-accept-all-btn"
                onClick={handleAcceptAll}
                className="w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-black text-white bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 hover:brightness-110 shadow-lg shadow-purple-600/30 transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 whitespace-nowrap"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Aceitar todos</span>
              </button>
            </div>

          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

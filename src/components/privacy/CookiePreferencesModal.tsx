import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Cookie, 
  ShieldCheck, 
  Sliders, 
  BarChart3, 
  Megaphone, 
  Check, 
  X, 
  Lock, 
  Info,
  Calendar
} from 'lucide-react';
import { 
  CookieCategoriesConsent, 
  CookieConsentRecord 
} from '../../types/privacy';
import { 
  getStoredCookieConsent, 
  saveCookieConsent, 
  acceptAllCookies, 
  rejectNonEssentialCookies 
} from '../../utils/cookieConsent';

interface CookiePreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
  triggerAudio?: (sound: 'tap' | 'success') => void;
}

export default function CookiePreferencesModal({ 
  isOpen, 
  onClose, 
  triggerAudio 
}: CookiePreferencesModalProps) {
  const [preferences, setPreferences] = useState<CookieCategoriesConsent>({
    necessary: true,
    preferences: false,
    analytics: false,
    marketing: false,
  });
  const [consentRecord, setConsentRecord] = useState<CookieConsentRecord | null>(null);

  useEffect(() => {
    if (isOpen) {
      const stored = getStoredCookieConsent();
      if (stored) {
        setPreferences(stored.categories);
        setConsentRecord(stored);
      } else {
        setPreferences({
          necessary: true,
          preferences: false,
          analytics: false,
          marketing: false,
        });
        setConsentRecord(null);
      }
    }
  }, [isOpen]);

  const handleToggle = (category: keyof CookieCategoriesConsent) => {
    if (category === 'necessary') return; // Locked
    if (triggerAudio) triggerAudio('tap');
    setPreferences(prev => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  const handleSaveCustom = () => {
    if (triggerAudio) triggerAudio('success');
    const updated = saveCookieConsent(preferences, true);
    setConsentRecord(updated);
    onClose();
  };

  const handleAcceptAll = () => {
    if (triggerAudio) triggerAudio('success');
    const updated = acceptAllCookies();
    setPreferences(updated.categories);
    setConsentRecord(updated);
    onClose();
  };

  const handleRejectAll = () => {
    if (triggerAudio) triggerAudio('tap');
    const updated = rejectNonEssentialCookies();
    setPreferences(updated.categories);
    setConsentRecord(updated);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div 
        id="cookie-preferences-modal"
        className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5"
      >
        {/* Backdrop */}
        <div 
          className="fixed inset-0"
          onClick={() => {
            if (triggerAudio) triggerAudio('tap');
            onClose();
          }}
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 15 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          className="relative w-full max-w-2xl bg-zinc-950 border border-purple-500/30 rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.8)] text-white overflow-hidden my-auto max-h-[90vh] flex flex-col"
        >
          {/* Header */}
          <div className="px-5 sm:px-6 py-4 border-b border-zinc-800/80 bg-zinc-900/60 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-300">
                <Cookie className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-sans font-black text-base sm:text-lg text-white">
                  Central de Preferências de Cookies
                </h2>
                <p className="text-xs text-zinc-400">
                  Personalize suas preferências de privacidade e navegação
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                if (triggerAudio) triggerAudio('tap');
                onClose();
              }}
              className="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              title="Fechar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body Content */}
          <div className="px-5 sm:px-6 py-5 overflow-y-auto space-y-4 text-xs font-sans">
            
            {/* Overview Intro Banner */}
            <div className="p-3.5 rounded-2xl bg-purple-950/30 border border-purple-500/20 flex items-start gap-3">
              <Info className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
              <div className="space-y-1 text-zinc-300 leading-relaxed text-[11px] sm:text-xs">
                <p>
                  Cookies e tecnologias similares são usados para reconhecer você, lembrar suas preferências e otimizar seu uso do portal. Você tem total controle sobre quais categorias deseja autorizar, com exceção dos cookies estritamente necessários para o funcionamento técnico do site.
                </p>
                {consentRecord && (
                  <p className="text-[10px] text-zinc-400 flex items-center gap-1.5 pt-1">
                    <Calendar className="w-3 h-3 text-purple-400" />
                    <span>Última atualização registrada: {new Date(consentRecord.timestamp).toLocaleDateString('pt-BR')} às {new Date(consentRecord.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} (Versão {consentRecord.policyVersion})</span>
                  </p>
                )}
              </div>
            </div>

            {/* 1. Necessary Cookies */}
            <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-2.5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white flex items-center gap-2">
                      <span>Cookies necessários</span>
                    </h3>
                    <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">
                      Sempre Ativos
                    </span>
                  </div>
                </div>

                {/* Locked toggle indicator */}
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-[11px] font-bold text-emerald-300">
                  <Lock className="w-3 h-3" />
                  <span>Obrigatório</span>
                </div>
              </div>

              <p className="text-zinc-300 leading-relaxed text-[11px] sm:text-xs">
                Essenciais para o funcionamento básico e seguro do site. Sem eles, recursos fundamentais não funcionam.
              </p>

              <div className="bg-black/30 p-2.5 rounded-xl text-[11px] text-zinc-400 space-y-1 border border-zinc-800/60">
                <strong className="text-zinc-300 block text-[10px] uppercase tracking-wider font-bold">
                  Finalidades:
                </strong>
                <ul className="list-disc list-inside space-y-0.5">
                  <li>Funcionamento básico do site e navegação fluida;</li>
                  <li>Segurança e prevenção de fraudes ou ataques;</li>
                  <li>Autenticação e identificação de conta (quando aplicável);</li>
                  <li>Manutenção de sessão do usuário;</li>
                  <li>Armazenamento das preferências essenciais de consentimento.</li>
                </ul>
              </div>
            </div>

            {/* 2. Preference Cookies */}
            <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-2.5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                    <Sliders className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white">
                      Cookies de preferência
                    </h3>
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${
                      preferences.preferences ? 'text-indigo-400' : 'text-zinc-500'
                    }`}>
                      {preferences.preferences ? 'Ativo' : 'Inativo (Opcional)'}
                    </span>
                  </div>
                </div>

                {/* Toggle Switch */}
                <button
                  type="button"
                  onClick={() => handleToggle('preferences')}
                  className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-200 focus:outline-none ${
                    preferences.preferences ? 'bg-indigo-600 justify-end' : 'bg-zinc-800 justify-start'
                  }`}
                  aria-label="Ativar ou desativar cookies de preferência"
                >
                  <motion.div
                    layout
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    className="w-4 h-4 rounded-full bg-white shadow-md"
                  />
                </button>
              </div>

              <p className="text-zinc-300 leading-relaxed text-[11px] sm:text-xs">
                Permitem que o portal lembre de escolhas feitas por você para oferecer uma experiência personalizada e fluida.
              </p>

              <div className="bg-black/30 p-2.5 rounded-xl text-[11px] text-zinc-400 space-y-1 border border-zinc-800/60">
                <strong className="text-zinc-300 block text-[10px] uppercase tracking-wider font-bold">
                  Finalidades:
                </strong>
                <ul className="list-disc list-inside space-y-0.5">
                  <li>Lembrar configurações de áudio (efeitos sonoros ligados ou desligados);</li>
                  <li>Preferências de idioma e região;</li>
                  <li>Aparência visual e temas selecionados;</li>
                  <li>Preferências de exibição e filtros personalizados pelo usuário.</li>
                </ul>
              </div>
            </div>

            {/* 3. Analytics Cookies */}
            <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-2.5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
                    <BarChart3 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white">
                      Cookies de análise
                    </h3>
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${
                      preferences.analytics ? 'text-cyan-400' : 'text-zinc-500'
                    }`}>
                      {preferences.analytics ? 'Ativo' : 'Inativo (Opcional)'}
                    </span>
                  </div>
                </div>

                {/* Toggle Switch */}
                <button
                  type="button"
                  onClick={() => handleToggle('analytics')}
                  className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-200 focus:outline-none ${
                    preferences.analytics ? 'bg-cyan-600 justify-end' : 'bg-zinc-800 justify-start'
                  }`}
                  aria-label="Ativar ou desativar cookies de análise"
                >
                  <motion.div
                    layout
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    className="w-4 h-4 rounded-full bg-white shadow-md"
                  />
                </button>
              </div>

              <p className="text-zinc-300 leading-relaxed text-[11px] sm:text-xs">
                Ajudam a entender como os visitantes interagem com o portal de forma agregada, sem identificar indivíduos diretamente.
              </p>

              <div className="bg-black/30 p-2.5 rounded-xl text-[11px] text-zinc-400 space-y-1 border border-zinc-800/60">
                <strong className="text-zinc-300 block text-[10px] uppercase tracking-wider font-bold">
                  Finalidades:
                </strong>
                <ul className="list-disc list-inside space-y-0.5">
                  <li>Medir a quantidade de acessos e tráfego geral;</li>
                  <li>Identificar quais páginas e seções são mais populares;</li>
                  <li>Entender a utilização das funcionalidades para melhorias contínuas;</li>
                  <li>Avaliar a velocidade e estabilidade técnica de carregamento do site.</li>
                </ul>
              </div>
            </div>

            {/* 4. Marketing Cookies */}
            <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-2.5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-pink-500/10 text-pink-400">
                    <Megaphone className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white">
                      Cookies de marketing
                    </h3>
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${
                      preferences.marketing ? 'text-pink-400' : 'text-zinc-500'
                    }`}>
                      {preferences.marketing ? 'Ativo' : 'Inativo (Opcional)'}
                    </span>
                  </div>
                </div>

                {/* Toggle Switch */}
                <button
                  type="button"
                  onClick={() => handleToggle('marketing')}
                  className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-200 focus:outline-none ${
                    preferences.marketing ? 'bg-pink-600 justify-end' : 'bg-zinc-800 justify-start'
                  }`}
                  aria-label="Ativar ou desativar cookies de marketing"
                >
                  <motion.div
                    layout
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    className="w-4 h-4 rounded-full bg-white shadow-md"
                  />
                </button>
              </div>

              <p className="text-zinc-300 leading-relaxed text-[11px] sm:text-xs">
                Utilizados somente caso o site implemente integrações promocionais ou publicidade contextual que necessitem dessa categoria.
              </p>

              <div className="bg-black/30 p-2.5 rounded-xl text-[11px] text-zinc-400 space-y-1 border border-zinc-800/60">
                <strong className="text-zinc-300 block text-[10px] uppercase tracking-wider font-bold">
                  Finalidades:
                </strong>
                <ul className="list-disc list-inside space-y-0.5">
                  <li>Medir eficácia de campanhas ou parcerias institucionais;</li>
                  <li>Evitar repetição excessiva de avisos promocionais;</li>
                  <li>Exibir conteúdos publicitários alinhados ao tema do portal caso venham a ser inseridos.</li>
                </ul>
              </div>
            </div>

          </div>

          {/* Footer Controls */}
          <div className="px-5 sm:px-6 py-4 border-t border-zinc-800/80 bg-zinc-900/80 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
            <button
              onClick={handleRejectAll}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-bold text-zinc-300 hover:text-white bg-zinc-800 hover:bg-zinc-700 transition-colors cursor-pointer flex items-center justify-center gap-1.5 active:scale-95"
            >
              <X className="w-3.5 h-3.5" />
              <span>Recusar não essenciais</span>
            </button>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={handleAcceptAll}
                className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-xs font-bold text-zinc-300 hover:text-white bg-zinc-800 hover:bg-zinc-700 transition-colors cursor-pointer flex items-center justify-center gap-1.5 active:scale-95"
              >
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Aceitar todos</span>
              </button>

              <button
                onClick={handleSaveCustom}
                className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl text-xs font-black text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:brightness-110 shadow-lg shadow-purple-600/30 transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95"
              >
                <span>Salvar preferências</span>
              </button>
            </div>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
}

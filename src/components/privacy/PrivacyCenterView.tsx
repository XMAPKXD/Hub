import React from 'react';
import { 
  ShieldCheck, 
  Lock, 
  Cookie, 
  FileText, 
  Trash2, 
  ScrollText, 
  ArrowLeft, 
  ArrowRight,
  Sparkles,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';
import { motion } from 'motion/react';

interface PrivacyCenterViewProps {
  onBack: () => void;
  onNavigateToPolicy: () => void;
  onNavigateToTerms: () => void;
  onOpenCookiePreferences: () => void;
  onOpenDataRequest: () => void;
  onOpenDataDeletion: () => void;
  triggerAudio?: (sound: 'tap' | 'success') => void;
}

export default function PrivacyCenterView({
  onBack,
  onNavigateToPolicy,
  onNavigateToTerms,
  onOpenCookiePreferences,
  onOpenDataRequest,
  onOpenDataDeletion,
  triggerAudio,
}: PrivacyCenterViewProps) {
  const handleBack = () => {
    if (triggerAudio) triggerAudio('tap');
    onBack();
  };

  const cards = [
    {
      id: 'privacy-policy-card',
      icon: Lock,
      color: 'from-purple-500/20 to-indigo-500/20 border-purple-500/30 text-purple-300',
      badge: 'Transparência',
      title: 'Privacidade',
      subtitle: 'Entenda como seus dados são utilizados.',
      actionLabel: 'Ver Política Completa',
      onClick: () => {
        if (triggerAudio) triggerAudio('tap');
        onNavigateToPolicy();
      },
    },
    {
      id: 'cookies-card',
      icon: Cookie,
      color: 'from-pink-500/20 to-purple-500/20 border-pink-500/30 text-pink-300',
      badge: 'Preferências',
      title: 'Cookies',
      subtitle: 'Gerencie suas preferências de cookies.',
      actionLabel: 'Configurar Cookies',
      onClick: () => {
        if (triggerAudio) triggerAudio('tap');
        onOpenCookiePreferences();
      },
    },
    {
      id: 'user-data-card',
      icon: FileText,
      color: 'from-cyan-500/20 to-blue-500/20 border-cyan-500/30 text-cyan-300',
      badge: 'Acesso & Relatório',
      title: 'Seus dados',
      subtitle: 'Solicite informações relacionadas aos seus dados.',
      actionLabel: 'Solicitar Meus Dados',
      onClick: () => {
        if (triggerAudio) triggerAudio('tap');
        onOpenDataRequest();
      },
    },
    {
      id: 'delete-data-card',
      icon: Trash2,
      color: 'from-rose-500/20 to-red-500/20 border-rose-500/30 text-rose-300',
      badge: 'Direito ao Esquecimento',
      title: 'Excluir dados',
      subtitle: 'Solicite a exclusão dos dados quando aplicável.',
      actionLabel: 'Solicitar Exclusão',
      onClick: () => {
        if (triggerAudio) triggerAudio('tap');
        onOpenDataDeletion();
      },
    },
    {
      id: 'terms-of-use-card',
      icon: ScrollText,
      color: 'from-indigo-500/20 to-purple-500/20 border-indigo-500/30 text-indigo-300',
      badge: 'Regras de Uso',
      title: 'Termos de Uso',
      subtitle: 'Leia as regras de utilização do site.',
      actionLabel: 'Ler Termos de Uso',
      onClick: () => {
        if (triggerAudio) triggerAudio('tap');
        onNavigateToTerms();
      },
    },
  ];

  return (
    <div id="privacy-center-view" className="max-w-5xl mx-auto px-4 sm:px-6 py-8 text-white">
      {/* Top Bar Back */}
      <div className="flex items-center justify-between gap-4 mb-8 pb-4 border-b border-zinc-800">
        <button
          onClick={handleBack}
          className="px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/70 text-xs font-bold text-zinc-300 hover:text-white flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar ao Portal</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="text-[11px] text-emerald-400 font-bold bg-emerald-950/40 border border-emerald-500/30 px-2.5 py-1 rounded-full flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>LGPD Compliant</span>
          </span>
        </div>
      </div>

      {/* Hero Banner */}
      <div className="relative rounded-3xl overflow-hidden p-6 sm:p-8 bg-gradient-to-br from-purple-950/40 via-zinc-950 to-indigo-950/30 border border-purple-500/30 mb-8 shadow-xl">
        <div className="max-w-2xl space-y-3 relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-300 text-xs font-black uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4" />
            <span>Centro de Transparência</span>
          </div>

          <h1 className="font-sans font-black text-2xl sm:text-3xl lg:text-4xl text-white tracking-tight">
            Privacidade e Direitos
          </h1>

          <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed font-sans">
            Sua privacidade e o controle sobre seus dados são prioridades absolutas no PKXD Central. Gerencie suas escolhas, consulte nossos termos e exerça seus direitos de forma clara e descomplicada.
          </p>
        </div>

        {/* Subtle background glow */}
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* The 5 Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
        {cards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.id}
              whileHover={{ y: -3 }}
              transition={{ duration: 0.18 }}
              className={`rounded-2xl p-5 bg-gradient-to-br ${card.color} backdrop-blur-sm border flex flex-col justify-between transition-all group shadow-lg`}
            >
              <div className="space-y-3 mb-4">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-black/40 border border-white/10 flex items-center justify-center">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-black/50 border border-white/10 text-zinc-300">
                    {card.badge}
                  </span>
                </div>

                <div>
                  <h3 className="font-sans font-black text-lg text-white group-hover:text-purple-200 transition-colors">
                    {card.title}
                  </h3>
                  <p className="text-xs text-zinc-300 leading-relaxed mt-1 font-sans">
                    {card.subtitle}
                  </p>
                </div>
              </div>

              <button
                id={card.id}
                onClick={card.onClick}
                className="w-full py-2.5 px-3.5 rounded-xl bg-black/50 hover:bg-black/80 border border-white/15 text-xs font-bold text-white flex items-center justify-between transition-all cursor-pointer group-hover:border-purple-400 active:scale-95"
              >
                <span>{card.actionLabel}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </motion.div>
          );
        })}
      </div>

      {/* Direct Quick Contact Footer */}
      <div className="p-5 rounded-2xl bg-zinc-900/50 border border-zinc-800 text-xs text-zinc-400 flex flex-col sm:flex-row items-center justify-between gap-4 font-sans">
        <div className="space-y-0.5 text-center sm:text-left">
          <strong className="text-zinc-200 block">Dúvidas ou Requisições Especiais?</strong>
          <span>Entre em contato com o responsável: <strong className="text-white">[NOME DO RESPONSÁVEL]</strong> • <span className="font-mono text-purple-300">[E-MAIL DE PRIVACIDADE]</span></span>
        </div>

        <button
          onClick={() => {
            if (triggerAudio) triggerAudio('tap');
            onOpenDataRequest();
          }}
          className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs cursor-pointer transition-colors shrink-0 active:scale-95 shadow"
        >
          Abrir Solicitação
        </button>
      </div>

    </div>
  );
}

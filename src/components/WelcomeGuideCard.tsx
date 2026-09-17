import React from 'react';
import { Sparkles, Compass, Trophy, Star, ChevronRight, X, Flame, Gamepad2 } from 'lucide-react';

interface WelcomeGuideCardProps {
  onNavigateToPassport: () => void;
  onNavigateToSpoilers: () => void;
  onNavigateToCreator: () => void;
  triggerAudio?: (sound: any) => void;
  isCompactMode: boolean;
  onToggleCompactMode: () => void;
  onDismiss: () => void;
}

export default function WelcomeGuideCard({
  onNavigateToPassport,
  onNavigateToSpoilers,
  onNavigateToCreator,
  triggerAudio,
  isCompactMode,
  onToggleCompactMode,
  onDismiss
}: WelcomeGuideCardProps) {
  return (
    <div 
      id="first-access-welcome-guide"
      className="relative overflow-hidden bg-[#1D1638]/72 backdrop-blur-xl border border-white/[0.09] rounded-[20px] p-5 sm:p-7 shadow-[0_8px_32px_rgba(0,0,0,0.38)] text-left select-none animate-fade-in"
    >
      {/* Header bar with dismiss and compact mode selector */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-white/[0.08] relative z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-[12px] bg-[#251B46]/80 backdrop-blur-md border border-[#7C3AED]/40 flex items-center justify-center text-[#7C3AED] shadow-sm">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-mono font-bold uppercase px-2.5 py-0.5 rounded-full bg-[#15102A]/80 backdrop-blur-sm text-[#22D3EE] border border-[#22D3EE]/30">
                Guia Rápido
              </span>
              <h3 className="font-sans font-black text-sm sm:text-base text-[#F8F7FF] uppercase tracking-tight">
                Novo por aqui? Bem-vindo à Central PK XD! 👋
              </h3>
            </div>
            <p className="text-xs text-[#B8B2CC] mt-0.5">
              Reunimos tudo o que você precisa em 3 passos simples:
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* View Filter Toggle */}
          <button
            onClick={() => {
              if (triggerAudio) triggerAudio('tap');
              onToggleCompactMode();
            }}
            className={`px-3 py-1.5 rounded-[12px] text-[11px] font-sans font-bold uppercase transition-all flex items-center gap-1.5 cursor-pointer border ${
              isCompactMode
                ? 'bg-[#7C3AED] text-white border-white/20'
                : 'bg-[#15102A]/80 backdrop-blur-sm text-[#B8B2CC] border-white/10 hover:text-[#F8F7FF]'
            }`}
            title="Alternar entre visualização focada e completa"
          >
            <span>{isCompactMode ? '🎯 Modo Focado' : '🌐 Todas as Seções'}</span>
          </button>

          <button
            onClick={() => {
              if (triggerAudio) triggerAudio('tap');
              onDismiss();
            }}
            className="p-1.5 rounded-[12px] bg-[#15102A]/80 hover:bg-[#251B46] text-[#716A83] hover:text-[#F8F7FF] border border-white/10 transition-colors cursor-pointer"
            title="Fechar guia"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 3 Clear Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-4 relative z-10">
        {/* Action 1: PKXD ID */}
        <div 
          onClick={() => {
            if (triggerAudio) triggerAudio('tap');
            onNavigateToPassport();
          }}
          className="group p-4 bg-[#15102A]/75 hover:bg-[#251B46]/80 backdrop-blur-md border border-white/[0.08] hover:border-[#F5C542]/50 rounded-[16px] transition-all cursor-pointer shadow-sm flex flex-col justify-between space-y-3"
        >
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-[12px] bg-[#251B46] border border-[#F5C542]/30 text-[#F5C542] flex items-center justify-center font-bold">
              <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
            </div>
            <div>
              <h4 className="font-sans font-black text-sm text-[#F8F7FF] uppercase flex items-center justify-between">
                <span>1. Criar Meu PKXD ID</span>
                <span className="text-[10px] font-mono text-[#F5C542] font-bold">Popular 🔥</span>
              </h4>
              <p className="text-xs text-[#B8B2CC] mt-1 leading-relaxed">
                Crie seu cartão oficial com seu Nick, Nível, Conquistas e baixe em imagem para compartilhar com amigos!
              </p>
            </div>
          </div>
          <div className="flex items-center text-xs font-bold text-[#F5C542] group-hover:translate-x-1 transition-transform">
            <span>Acessar PKXD ID</span>
            <ChevronRight className="w-4 h-4 ml-1" />
          </div>
        </div>

        {/* Action 2: Spoilers Countdown */}
        <div 
          onClick={() => {
            if (triggerAudio) triggerAudio('tap');
            onNavigateToSpoilers();
          }}
          className="group p-4 bg-[#15102A]/75 hover:bg-[#251B46]/80 backdrop-blur-md border border-white/[0.08] hover:border-[#E83EBC]/50 rounded-[16px] transition-all cursor-pointer shadow-sm flex flex-col justify-between space-y-3"
        >
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-[12px] bg-[#3A1947] border border-[#E83EBC]/30 text-[#E83EBC] flex items-center justify-center font-bold">
              <Flame className="w-5 h-5 group-hover:scale-110 transition-transform" />
            </div>
            <div>
              <h4 className="font-sans font-black text-sm text-[#F8F7FF] uppercase flex items-center justify-between">
                <span>2. Spoilers & Novidades</span>
                <span className="text-[10px] font-mono text-[#E83EBC] font-bold">Ao Vivo</span>
              </h4>
              <p className="text-xs text-[#B8B2CC] mt-1 leading-relaxed">
                Acompanhe o cronômetro para os novos spoilers semanais e veja o que vai chegar na próxima atualização.
              </p>
            </div>
          </div>
          <div className="flex items-center text-xs font-bold text-[#E83EBC] group-hover:translate-x-1 transition-transform">
            <span>Ver Contagem Regressiva</span>
            <ChevronRight className="w-4 h-4 ml-1" />
          </div>
        </div>

        {/* Action 3: Creator Program */}
        <div 
          onClick={() => {
            if (triggerAudio) triggerAudio('tap');
            onNavigateToCreator();
          }}
          className="group p-4 bg-[#15102A]/75 hover:bg-[#251B46]/80 backdrop-blur-md border border-white/[0.08] hover:border-[#7C3AED]/50 rounded-[16px] transition-all cursor-pointer shadow-sm flex flex-col justify-between space-y-3"
        >
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-[12px] bg-[#251B46] border border-[#7C3AED]/40 text-[#7C3AED] flex items-center justify-center font-bold">
              <Trophy className="w-5 h-5 group-hover:rotate-6 transition-transform" />
            </div>
            <div>
              <h4 className="font-sans font-black text-sm text-[#F8F7FF] uppercase flex items-center justify-between">
                <span>3. Programa Creator</span>
                <span className="text-[10px] font-mono text-[#7C3AED] font-bold">Stardust / Star</span>
              </h4>
              <p className="text-xs text-[#B8B2CC] mt-1 leading-relaxed">
                Descubra os requisitos oficiais e teste sua elegibilidade para se tornar um Creator reconhecido do PK XD.
              </p>
            </div>
          </div>
          <div className="flex items-center text-xs font-bold text-[#7C3AED] group-hover:translate-x-1 transition-transform">
            <span>Calcular Requisitos</span>
            <ChevronRight className="w-4 h-4 ml-1" />
          </div>
        </div>
      </div>
    </div>
  );
}

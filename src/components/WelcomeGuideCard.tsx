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
      className="relative overflow-hidden bg-gradient-to-br from-purple-950/90 via-zinc-950 to-slate-900 border-2 border-purple-500/40 rounded-3xl p-5 sm:p-7 shadow-[0_10px_35px_rgba(147,51,234,0.2)] text-left animate-fade-in"
    >
      {/* Decorative Glows */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-pink-500/10 rounded-full filter blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-cyan-500/10 rounded-full filter blur-3xl pointer-events-none" />

      {/* Header bar with dismiss and compact mode selector */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-white/10 relative z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-white shadow-md">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-mono font-black uppercase px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                Guia Rápido
              </span>
              <h3 className="font-sans font-black text-sm sm:text-base text-white uppercase tracking-tight">
                Novo por aqui? Bem-vindo à Central PK XD! 👋
              </h3>
            </div>
            <p className="text-xs text-zinc-300 mt-0.5">
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
            className={`px-3 py-1.5 rounded-xl text-[11px] font-sans font-bold uppercase transition-all flex items-center gap-1.5 cursor-pointer border ${
              isCompactMode
                ? 'bg-purple-600/40 text-purple-200 border-purple-400/50'
                : 'bg-zinc-800 text-zinc-300 border-white/10 hover:bg-zinc-700'
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
            className="p-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors cursor-pointer"
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
          className="group p-4 bg-black/40 hover:bg-black/60 border border-yellow-500/30 hover:border-yellow-400/70 rounded-2xl transition-all cursor-pointer shadow-md hover:shadow-yellow-500/10 flex flex-col justify-between space-y-3"
        >
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-yellow-500/20 text-yellow-400 flex items-center justify-center font-bold">
              <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
            </div>
            <div>
              <h4 className="font-sans font-black text-sm text-white uppercase flex items-center justify-between">
                <span>1. Criar Meu PKXD ID</span>
                <span className="text-[10px] font-mono text-yellow-400 font-bold">Popular 🔥</span>
              </h4>
              <p className="text-xs text-zinc-300 mt-1 leading-relaxed">
                Crie seu cartão oficial com seu Nick, Nível, Conquistas e baixe em imagem para compartilhar com amigos!
              </p>
            </div>
          </div>
          <div className="flex items-center text-xs font-black text-yellow-300 group-hover:translate-x-1 transition-transform">
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
          className="group p-4 bg-black/40 hover:bg-black/60 border border-pink-500/30 hover:border-pink-400/70 rounded-2xl transition-all cursor-pointer shadow-md hover:shadow-pink-500/10 flex flex-col justify-between space-y-3"
        >
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-pink-500/20 text-pink-400 flex items-center justify-center font-bold">
              <Flame className="w-5 h-5 group-hover:scale-110 transition-transform" />
            </div>
            <div>
              <h4 className="font-sans font-black text-sm text-white uppercase flex items-center justify-between">
                <span>2. Spoilers & Novidades</span>
                <span className="text-[10px] font-mono text-pink-400 font-bold">Ao Vivo</span>
              </h4>
              <p className="text-xs text-zinc-300 mt-1 leading-relaxed">
                Acompanhe o cronômetro para os novos spoilers semanais e veja o que vai chegar na próxima atualização.
              </p>
            </div>
          </div>
          <div className="flex items-center text-xs font-black text-pink-300 group-hover:translate-x-1 transition-transform">
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
          className="group p-4 bg-black/40 hover:bg-black/60 border border-purple-500/30 hover:border-purple-400/70 rounded-2xl transition-all cursor-pointer shadow-md hover:shadow-purple-500/10 flex flex-col justify-between space-y-3"
        >
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold">
              <Trophy className="w-5 h-5 group-hover:rotate-6 transition-transform" />
            </div>
            <div>
              <h4 className="font-sans font-black text-sm text-white uppercase flex items-center justify-between">
                <span>3. Programa Creator</span>
                <span className="text-[10px] font-mono text-purple-400 font-bold">Stardust / Star</span>
              </h4>
              <p className="text-xs text-zinc-300 mt-1 leading-relaxed">
                Descubra os requisitos oficiais e teste sua elegibilidade para se tornar um Creator reconhecido do PK XD.
              </p>
            </div>
          </div>
          <div className="flex items-center text-xs font-black text-purple-300 group-hover:translate-x-1 transition-transform">
            <span>Calcular Requisitos</span>
            <ChevronRight className="w-4 h-4 ml-1" />
          </div>
        </div>
      </div>
    </div>
  );
}

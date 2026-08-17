import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, Flame, Star, Sparkles, CheckCircle2, 
  HelpCircle, ChevronRight, Gift, Compass, RotateCw 
} from 'lucide-react';
import { DailyMission } from '../types';

interface MissionsSectionProps {
  fanLevel: number;
  fanXP: number;
  onAddXP: (amount: number, reason: string) => void;
  triggerAudio: (type: 'tap' | 'success' | 'levelUp') => void;
  soundEnabled: boolean;
}

export default function MissionsSection({
  fanLevel,
  fanXP,
  onAddXP,
  triggerAudio,
  soundEnabled
}: MissionsSectionProps) {
  const [missions, setMissions] = useState<DailyMission[]>([]);
  const [notif, setNotif] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setNotif(msg);
    setTimeout(() => setNotif(null), 3000);
  };

  // Default initial daily missions list
  const defaultMissions: DailyMission[] = [
    {
      id: 'm1',
      title: '🔥 Aquecer os Motores',
      description: 'Resgate seu Foguinho Diário na aba de Nível de Fã para garantir sua sequência de fogos!',
      xpReward: 150,
      completed: false,
      claimed: false,
      type: 'visit_whatsapp'
    },
    {
      id: 'm2',
      title: '🎡 Girar a Roleta da Sorte',
      description: 'Gire a Roleta da Sorte Cósmica para ganhar bônus instantâneos de XP!',
      xpReward: 100,
      completed: false,
      claimed: false,
      type: 'spin'
    },
    {
      id: 'm3',
      title: '🎁 Abrir o Baú Secreto',
      description: 'Encontre e quebre o Baú Secreto de Gravidade Zero para descobrir recompensas misteriosas!',
      xpReward: 120,
      completed: false,
      claimed: false,
      type: 'chest'
    },
    {
      id: 'm4',
      title: '💬 Voz da Comunidade',
      description: 'Faça uma publicação no Mural da Rede Social para compartilhar suas opiniões com outros fás!',
      xpReward: 200,
      completed: false,
      claimed: false,
      type: 'post'
    },
    {
      id: 'm5',
      title: '💖 Apreciação Lendária',
      description: 'Curta pelo menos uma postagem no mural ou teoria de fãs para dar apoio à comunidade!',
      xpReward: 80,
      completed: false,
      claimed: false,
      type: 'like'
    }
  ];

  // Load daily missions from LocalStorage to persist completion state
  useEffect(() => {
    try {
      const today = new Date().toDateString();
      const lastCheck = localStorage.getItem('pkxd_missions_last_check_date');
      const savedMissions = localStorage.getItem('pkxd_daily_missions_state');

      if (lastCheck === today && savedMissions) {
        setMissions(JSON.parse(savedMissions));
      } else {
        // Reset/init new missions for a new day
        localStorage.setItem('pkxd_missions_last_check_date', today);
        localStorage.setItem('pkxd_daily_missions_state', JSON.stringify(defaultMissions));
        setMissions(defaultMissions);
      }
    } catch (e) {
      setMissions(defaultMissions);
    }
  }, []);

  // Monitor external completion events synced in LocalStorage (like Wheel, Chest, Post, Likes)
  useEffect(() => {
    const checkCompletionChanges = () => {
      try {
        const savedMissions = localStorage.getItem('pkxd_daily_missions_state');
        if (savedMissions) {
          const parsed = JSON.parse(savedMissions) as DailyMission[];
          
          // Let's check if they claimed foguinho
          const lastClaim = localStorage.getItem('pkxd_last_claim_date');
          const today = new Date().toDateString();
          const hasClaimedFoguinho = lastClaim === today;

          let changed = false;
          const updated = parsed.map(m => {
            if (m.id === 'm1' && hasClaimedFoguinho && !m.completed) {
              m.completed = true;
              changed = true;
            }
            return m;
          });

          if (changed) {
            localStorage.setItem('pkxd_daily_missions_state', JSON.stringify(updated));
            setMissions(updated);
          }
        }
      } catch (e) {
        console.warn(e);
      }
    };

    // Run initially and set an interval
    checkCompletionChanges();
    const interval = setInterval(checkCompletionChanges, 3000);
    return () => clearInterval(interval);
  }, []);

  // Claim mission rewards
  const handleClaimMission = (id: string, xpReward: number) => {
    triggerAudio('levelUp');
    
    const updated = missions.map(m => {
      if (m.id === id) {
        return { ...m, claimed: true };
      }
      return m;
    });

    setMissions(updated);
    try {
      localStorage.setItem('pkxd_daily_missions_state', JSON.stringify(updated));
    } catch (e) {}

    onAddXP(xpReward, `Recompensa de Missão Coletada! 🎁`);
    showNotification(`🎉 Coletado com sucesso! +${xpReward} XP adicionados!`);
  };

  // Reset missions manually for testing/playability
  const handleResetMissions = () => {
    triggerAudio('tap');
    const reset = defaultMissions.map(m => ({ ...m, completed: false, claimed: false }));
    setMissions(reset);
    try {
      localStorage.setItem('pkxd_daily_missions_state', JSON.stringify(reset));
      localStorage.setItem('pkxd_missions_last_check_date', new Date().toDateString());
    } catch (e) {}
    showNotification("🔄 Missões diárias reiniciadas para você completar!");
  };

  // Calculate completion percentage
  const completedCount = missions.filter(m => m.completed).length;
  const progressPercent = missions.length > 0 ? Math.round((completedCount / missions.length) * 100) : 0;

  return (
    <div id="missions-section-container" className="space-y-8">
      {/* Local Alert Box */}
      <AnimatePresence>
        {notif && (
          <motion.div 
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className="fixed top-24 right-6 z-50 bg-gradient-to-r from-orange-500 to-yellow-400 text-black font-black px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-2 border-2 border-white text-xs sm:text-sm font-sans"
          >
            <Sparkles className="w-4 h-4 text-indigo-950 animate-pulse" />
            <span>{notif}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Missions Summary Header Banner */}
      <div className="bg-gradient-to-br from-indigo-950/40 via-purple-950/40 to-black/30 border border-white/5 rounded-3xl p-6 sm:p-8 space-y-4 text-left relative overflow-hidden">
        <div className="absolute top-0 right-1/4 w-32 h-32 bg-cyan-500/10 blur-3xl rounded-full pointer-events-none" />
        <div className="absolute bottom-0 left-10 w-32 h-32 bg-yellow-500/5 blur-3xl rounded-full pointer-events-none" />
        
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2 text-yellow-300 font-extrabold text-xs uppercase tracking-widest font-mono">
            <Trophy className="w-4 h-4 text-yellow-400 fill-yellow-400/20" />
            <span>PKXD Central • Centro de Desafios</span>
          </div>

          <button
            onClick={handleResetMissions}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 border border-white/10 hover:bg-white/10 text-white hover:text-cyan-400 font-mono text-[10px] uppercase tracking-wider rounded-xl transition-all cursor-pointer"
            title="Clique para reiniciar as missões se quiser jogá-las novamente!"
          >
            <RotateCw className="w-3 h-3" />
            <span>Reiniciar Missões</span>
          </button>
        </div>

        <h3 className="font-sans font-black text-2xl sm:text-3xl text-white uppercase tracking-tight flex items-center gap-2">
          <span>🎯 Painel de Missões Diárias</span>
        </h3>
        
        <p className="font-sans text-xs sm:text-sm text-gray-300 leading-relaxed max-w-4xl">
          Complete as missões interativas diárias listadas abaixo para receber bônus empolgantes de XP! Ao subir de nível de fã, você escala no ranking oficial e desbloqueia molduras, insígnias brilhantes e destaque no fã-clube oficial do PKXD Central!
        </p>

        {/* Global Progress Bar */}
        <div className="pt-4 space-y-2">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-gray-400">PROGRESSO DE HOJE:</span>
            <span className="text-yellow-300 font-bold">{completedCount} de {missions.length} COMPLETADAS ({progressPercent}%)</span>
          </div>
          <div className="w-full h-3 bg-zinc-950 rounded-full p-0.5 border border-white/5 overflow-hidden">
            <motion.div 
              className="h-full bg-gradient-to-r from-orange-500 via-yellow-400 to-emerald-400 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.6 }}
            />
          </div>
        </div>
      </div>

      {/* Main Grid: Missions checklist on left, Minigames on right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Missions Checklist */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-sans font-black text-base text-white uppercase tracking-wider flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <span>Lista de Objetivos</span>
            </h4>
          </div>

          <div className="max-h-[500px] overflow-y-auto pr-1.5 sm:pr-2 space-y-3 scrollbar-thin scrollbar-thumb-emerald-500/40 scrollbar-track-black/30">
            {missions.map((mission) => {
              let stateBadge = 'bg-zinc-800 text-zinc-400 border-zinc-700/50';
              let badgeText = 'Pendente ⏱️';
              
              if (mission.completed) {
                if (mission.claimed) {
                  stateBadge = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
                  badgeText = 'Reivindicado 🎉';
                } else {
                  stateBadge = 'bg-yellow-500/10 text-yellow-300 border-yellow-500/30 animate-pulse';
                  badgeText = 'Completo! ✨';
                }
              }

              return (
                <motion.div
                  key={mission.id}
                  whileHover={{ scale: 1.01 }}
                  className={`p-4 bg-zinc-900/50 border rounded-2xl text-left flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all duration-200 ${
                    mission.completed 
                      ? mission.claimed ? 'border-emerald-500/20 bg-emerald-950/5' : 'border-yellow-500/40 bg-yellow-950/5 shadow-[0_0_15px_rgba(234,179,8,0.05)]' 
                      : 'border-white/5'
                  }`}
                >
                  <div className="space-y-1.5 flex-1 pr-4">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h5 className={`font-sans font-black text-xs sm:text-sm ${mission.completed ? 'text-gray-150' : 'text-white'}`}>
                        {mission.title}
                      </h5>
                      <span className={`text-[8.5px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${stateBadge}`}>
                        {badgeText}
                      </span>
                    </div>
                    <p className="font-sans text-xs text-gray-400 leading-relaxed">
                      {mission.description}
                    </p>
                  </div>

                  {/* Actions column */}
                  <div className="flex items-center gap-3 self-stretch sm:self-auto justify-between border-t sm:border-t-0 border-white/5 pt-2 sm:pt-0">
                    <span className="font-mono text-xs font-black text-yellow-300">
                      +{mission.xpReward} XP
                    </span>

                    {mission.completed && !mission.claimed ? (
                      <button
                        onClick={() => handleClaimMission(mission.id, mission.xpReward)}
                        className="px-4 py-2 bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-300 hover:to-orange-400 text-black font-sans font-black text-[10px] sm:text-xs uppercase tracking-wider rounded-xl cursor-pointer shadow-lg active:scale-95 transition-all flex items-center gap-1"
                      >
                        <Gift className="w-3.5 h-3.5 fill-black" />
                        <span>Resgatar</span>
                      </button>
                    ) : mission.claimed ? (
                      <div className="text-[10px] font-bold text-emerald-400 font-mono uppercase bg-emerald-500/10 px-2.5 py-1.5 rounded-xl border border-emerald-500/20">
                        ✓ Pronto
                      </div>
                    ) : (
                      <div className="text-[10px] font-bold text-gray-500 font-mono uppercase bg-zinc-950 px-2.5 py-1.5 rounded-xl border border-white/5">
                        Fazer Missão
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Right column: Helpful Explanations */}
        <div className="space-y-6">
          <div className="bg-zinc-900/60 border border-white/5 rounded-3xl p-5 text-left space-y-4">
            <h4 className="font-sans font-black text-sm text-cyan-400 uppercase tracking-wider flex items-center gap-2">
              <Compass className="w-4 h-4 text-cyan-400" />
              <span>Como subir no Ranking? 👑</span>
            </h4>
            <p className="text-[11px] font-sans text-gray-300 leading-relaxed">
              Toda vez que você completa uma missão diária ou interage nas roletas e baús de fã, seu nível de fã é atualizado em tempo real na nuvem Firestore de PKXD Central.
            </p>
            <div className="space-y-2 border-t border-white/5 pt-3">
              <div className="flex justify-between items-center text-[10.5px] font-mono">
                <span className="text-gray-400">Nível Atual:</span>
                <span className="text-white font-bold">Lvl {fanLevel}</span>
              </div>
              <div className="flex justify-between items-center text-[10.5px] font-mono">
                <span className="text-gray-400">Progresso do Nível:</span>
                <span className="text-yellow-300 font-bold">{fanXP}/100 XP</span>
              </div>
              <div className="flex justify-between items-center text-[10.5px] font-mono">
                <span className="text-gray-400">Total de Fogos:</span>
                <span className="text-orange-400 font-bold">🔥 {localStorage.getItem('pkxd_fire_streak') || 1}</span>
              </div>
            </div>
            <p className="text-[10px] text-gray-500 font-sans leading-normal">
              Dica: Resgatar o bônus de XP das missões garante saltos muito maiores no placar geral de líderes!
            </p>
          </div>

          {/* Tips card */}
          <div className="bg-zinc-900/60 border border-white/5 rounded-3xl p-5 text-left space-y-3">
            <h4 className="font-sans font-black text-sm text-pink-400 uppercase tracking-wider">
              🎁 Novidades da Nova Fase
            </h4>
            <p className="text-[11px] text-gray-300 leading-relaxed font-sans">
              Chegamos à nova fase do PKXD Central! Agora as conquistas não são só para você. Todos os fãs conectados no site podem competir saudavelmente, ver quem joga mais e se destacar como Creator ou Fã de Carteirinha do Portal!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

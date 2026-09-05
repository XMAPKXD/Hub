import React, { useState, useEffect } from 'react';
import { 
  Youtube, 
  Video, 
  Smartphone, 
  Eye, 
  Trophy, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  Clock, 
  Coins, 
  Share2, 
  ExternalLink, 
  ShieldCheck, 
  Star, 
  Flame, 
  TrendingUp, 
  Mail, 
  MessageSquare, 
  Calculator, 
  Zap, 
  ChevronDown, 
  ChevronUp, 
  Lock, 
  Unlock, 
  Copy, 
  Check,
  UserCheck,
  Crown,
  Play,
  ArrowRight,
  Gift
} from 'lucide-react';
import { db, auth, googleProvider } from '../firebase';
import { signInWithPopup } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

interface CreatorMetasTrackerProps {
  user: any;
  onAddXP: (amount: number, reason: string) => void;
  triggerAudio: (type: 'tap' | 'success' | 'levelUp') => void;
  soundEnabled: boolean;
}

export type CreatorFormat = 'youtube_long' | 'youtube_shorts' | 'tiktok';

export interface CreatorStats {
  format: CreatorFormat;
  channelName: string;
  channelHandle: string;
  subscribers: number;
  longVideosCount: number;
  shortsCount: number;
  viewsLast3Months: number;
  averageViews: number;
  monthlyUploads: number;
  acceptedTerms: boolean;
  compliantRules: boolean;
  revenueShare3Months: number;
}

export default function CreatorMetasTracker({
  user,
  onAddXP,
  triggerAudio,
  soundEnabled
}: CreatorMetasTrackerProps) {
  // Creator Stats State
  const [stats, setStats] = useState<CreatorStats>(() => {
    const defaultStats: CreatorStats = {
      format: 'youtube_long',
      channelName: '',
      channelHandle: '',
      subscribers: 0,
      longVideosCount: 0,
      shortsCount: 0,
      viewsLast3Months: 0,
      averageViews: 0,
      monthlyUploads: 0,
      acceptedTerms: true,
      compliantRules: true,
      revenueShare3Months: 0
    };
    try {
      const saved = localStorage.getItem('pkxd_creator_stats');
      if (saved) {
        return { ...defaultStats, ...JSON.parse(saved) };
      }
    } catch (e) {}
    return defaultStats;
  });

  const [activeTierTab, setActiveTierTab] = useState<'stardust' | 'rising_star' | 'supernova' | 'galaxy'>('stardust');
  const [showZetaLetter, setShowZetaLetter] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [copiedTemplate, setCopiedTemplate] = useState(false);
  const [isLoggingInYT, setIsLoggingInYT] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState(false);

  // Sync from Firestore if user logged in
  useEffect(() => {
    if (!user?.uid) return;
    const loadCloudStats = async () => {
      try {
        const docRef = doc(db, 'creator_goals', user.uid);
        const snapshot = await getDoc(docRef);
        if (snapshot.exists()) {
          const data = snapshot.data() as CreatorStats;
          setStats(prev => ({ ...prev, ...data }));
        }
      } catch (err) {
        console.warn('Erro ao carregar metas da nuvem:', err);
      }
    };
    loadCloudStats();
  }, [user?.uid]);

  // Persist local changes
  const updateStats = (partial: Partial<CreatorStats>) => {
    setStats(prev => {
      const updated = { ...prev, ...partial };
      try {
        localStorage.setItem('pkxd_creator_stats', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  const handleSaveToCloud = async () => {
    triggerAudio('success');
    try {
      localStorage.setItem('pkxd_creator_stats', JSON.stringify(stats));
      if (user?.uid) {
        const docRef = doc(db, 'creator_goals', user.uid);
        await setDoc(docRef, {
          ...stats,
          userId: user.uid,
          updatedAt: Date.now()
        }, { merge: true });
      }
      onAddXP(100, 'Atualização de Metas Creator 🌟');
      setSaveSuccessMsg(true);
      setTimeout(() => setSaveSuccessMsg(false), 3500);
    } catch (err) {
      console.error(err);
    }
  };

  // Login with Google / YouTube
  const handleLoginWithYouTube = async () => {
    triggerAudio('tap');
    setIsLoggingInYT(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user) {
        const name = result.user.displayName || 'Criador PK XD';
        const email = result.user.email || '';
        const suggestedHandle = '@' + (name.toLowerCase().replace(/[^a-z0-9]/g, ''));
        
        updateStats({
          channelName: name,
          channelHandle: suggestedHandle
        });
        onAddXP(150, 'Canal do YouTube Vinculado ⚡');
        triggerAudio('levelUp');
      }
    } catch (err: any) {
      console.warn('YouTube login popup dismissed or failed:', err);
    } finally {
      setIsLoggingInYT(false);
    }
  };

  // Requisitos Mínimos Oficiais para Inscrição (Afterverse Creators / Zeta)
  // 1. Ter pelo menos 10 vídeos longos (+5 minutos) de PK XD já publicados OU 30 Shorts/TikToks
  // 2. Ter acumulado ao menos 10.000 views de PK XD nos últimos 3 meses.
  // 3. Estar em conformidade com as regras da comunidade e do programa.
  // 4. Aceitar os Termos do Creator Code.

  const reqVideosNeeded = stats.format === 'youtube_long' ? 10 : 30;
  const currentVideosCount = stats.format === 'youtube_long' ? stats.longVideosCount : stats.shortsCount;
  const videosProgress = Math.min(100, Math.round((currentVideosCount / reqVideosNeeded) * 100));
  const videosRemaining = Math.max(0, reqVideosNeeded - currentVideosCount);

  const reqViewsNeeded = 10000;
  const viewsProgress = Math.min(100, Math.round((stats.viewsLast3Months / reqViewsNeeded) * 100));
  const viewsRemaining = Math.max(0, reqViewsNeeded - stats.viewsLast3Months);

  // Overall readiness score (0 - 100%)
  const checksPassedCount = 
    (currentVideosCount >= reqVideosNeeded ? 1 : 0) +
    (stats.viewsLast3Months >= reqViewsNeeded ? 1 : 0) +
    (stats.acceptedTerms ? 1 : 0) +
    (stats.compliantRules ? 1 : 0);
  
  const readinessPercent = Math.round((checksPassedCount / 4) * 100);
  const isFullyEligibleToApply = readinessPercent === 100;

  // Simulator values for Creator Code revenue
  const [simBuyers1st, setSimBuyers1st] = useState(25);
  const [simBuyersRec, setSimBuyersRec] = useState(60);
  const [simAvgOrder, setSimAvgOrder] = useState(30); // R$ 30 média por pacote

  // Commission table per tier (From Zeta's letter)
  const tierCommissions = {
    stardust: { first: 0.05, recurring: 0.007, name: 'Stardust', coins: '30.000', gems: 150 },
    rising_star: { first: 0.05, recurring: 0.01, name: 'Rising Star', coins: '150.000', gems: 1500 },
    supernova: { first: 0.08, recurring: 0.015, name: 'Supernova', coins: '200.000', gems: 2000 },
    galaxy: { first: 0.10, recurring: 0.03, name: 'Galaxy', coins: '300.000', gems: 3000 }
  };

  const simRev1st = simBuyers1st * simAvgOrder * tierCommissions[activeTierTab].first;
  const simRevRec = simBuyersRec * simAvgOrder * tierCommissions[activeTierTab].recurring;
  const simRevTotal = simRev1st + simRevRec;

  const emailApplicationTemplate = `Olá equipe Afterverse Creators e Zeta!

Gostaria de me candidatar ao Programa Oficial de Creators do PK XD.

Dados do meu Canal:
- Nome do Canal: ${stats.channelName || '[Nome do seu Canal]'}
- Link / Handle: ${stats.channelHandle || 'youtube.com/@seucanal'}
- Formato Principal: ${stats.format === 'youtube_long' ? 'Vídeos Longos (+5 min)' : stats.format === 'youtube_shorts' ? 'YouTube Shorts' : 'TikTok'}
- Quantidade de Vídeos/Shorts de PK XD publicados: ${currentVideosCount}
- Visualizações totais nos últimos 3 meses: ${stats.viewsLast3Months.toLocaleString('pt-BR')} views
- Seguidores/Inscritos Atuais: ${stats.subscribers.toLocaleString('pt-BR')}
- Média de views por vídeo: ${stats.averageViews}
- Aceito os Termos do Creator Code e estou em conformidade com as diretrizes da comunidade.

Aguardo ansiosamente a avaliação de vocês para receber meu Creator Code e fazer parte do time!

Atenciosamente,
${stats.channelName || user?.displayName || 'Criador da Comunidade PK XD'}`;

  const copyToClipboard = (text: string, isTemplate = false) => {
    triggerAudio('tap');
    navigator.clipboard.writeText(text);
    if (isTemplate) {
      setCopiedTemplate(true);
      setTimeout(() => setCopiedTemplate(false), 2500);
    } else {
      setCopiedEmail(true);
      setTimeout(() => setCopiedEmail(false), 2500);
    }
  };

  return (
    <div id="creator-metas-tracker-root" className="space-y-8 animate-fade-in select-none text-left">
      
      {/* Header Banner - Program of Creators PK XD with Zeta Branding */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1b0a38] via-[#0d061f] to-[#070314] border border-purple-500/30 p-6 sm:p-8 shadow-[0_16px_50px_rgba(124,58,237,0.25)]">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-pink-500/20 via-purple-600/15 to-transparent rounded-full filter blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-cyan-500/10 rounded-full filter blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-500/20 border border-purple-400/40 text-purple-200 font-mono text-xs font-bold uppercase tracking-wider">
              <Crown className="w-4 h-4 text-yellow-300 fill-yellow-300" />
              <span>Afterverse Creators • Programa Oficial 2026</span>
            </div>

            <button
              onClick={() => {
                triggerAudio('tap');
                setShowZetaLetter(!showZetaLetter);
              }}
              className="inline-flex items-center gap-2 text-xs font-sans font-bold text-pink-300 hover:text-white bg-pink-500/10 hover:bg-pink-500/20 border border-pink-500/30 px-3 py-1.5 rounded-xl transition-all cursor-pointer"
            >
              <Mail className="w-3.5 h-3.5 text-pink-400" />
              <span>{showZetaLetter ? 'Ocultar Carta da Zeta' : 'Ler Comunicado da Zeta (Afterverse)'}</span>
              {showZetaLetter ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>

          <div className="max-w-3xl space-y-2">
            <h2 className="font-sans font-black text-2xl sm:text-4xl text-white uppercase tracking-tight leading-tight">
              Quanto Falta Para Você Ser <br />
              <span className="bg-gradient-to-r from-yellow-300 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
                Creator Oficial do PK XD?
              </span>
            </h2>
            <p className="font-sans text-xs sm:text-sm text-gray-300 leading-relaxed max-w-2xl">
              Acompanhe suas métricas em tempo real, descubra quantos vídeos e visualizações faltam para você se inscrever, simule suas comissões de Creator Code e prepare sua candidatura com base nas novas regras da Afterverse!
            </p>
          </div>

          {/* Quick Connect YouTube / Channel Banner */}
          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              onClick={handleLoginWithYouTube}
              disabled={isLoggingInYT}
              className="inline-flex items-center gap-2.5 bg-red-600 hover:bg-red-500 active:scale-95 text-white font-sans font-black text-xs sm:text-sm py-2.5 px-5 rounded-2xl transition-all shadow-[0_4px_20px_rgba(220,38,38,0.4)] cursor-pointer"
            >
              <Youtube className="w-4 h-4 fill-white" />
              <span>{isLoggingInYT ? 'Conectando...' : user ? 'Reconectar YouTube' : 'Fazer Login com YouTube'}</span>
            </button>

            {stats.channelHandle && (
              <div className="inline-flex items-center gap-2 bg-white/[0.06] border border-white/10 px-3.5 py-2 rounded-xl text-xs font-mono text-gray-300">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Canal: <strong className="text-yellow-300">{stats.channelHandle}</strong></span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Accordion: Carta Oficial da Zeta (Afterverse Creators Influencer Relations Manager) */}
      {showZetaLetter && (
        <div className="p-6 rounded-3xl bg-[#12082b]/95 border border-purple-500/40 backdrop-blur-xl shadow-2xl space-y-4 text-xs sm:text-sm text-gray-200 leading-relaxed font-sans">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center font-bold text-white shadow-md">
                Z
              </div>
              <div>
                <h4 className="font-bold text-white text-base">Zeta da Afterverse Creators</h4>
                <p className="text-[11px] text-pink-300 font-mono">Influencer Relations Manager • Afterverse</p>
              </div>
            </div>
            <span className="text-[10px] font-mono text-gray-400 bg-white/[0.05] px-2.5 py-1 rounded-md border border-white/10">
              COMUNICADO OFICIAL
            </span>
          </div>

          <div className="space-y-3 bg-black/30 p-4 rounded-2xl border border-white/5 max-h-96 overflow-y-auto custom-scrollbar text-gray-300">
            <p className="font-semibold text-white">
              Olá, Creators! Sou Zeta, da Afterverse Creators!
            </p>
            <p>
              Estou escrevendo para compartilhar uma novidade muito importante sobre o <strong>Programa de Creators PK XD</strong>. Com o compromisso de valorizar o impacto de vocês na comunidade, implementamos melhorias significativas nas porcentagens do <strong>Creator Code</strong>.
            </p>
            <p>
              <strong className="text-yellow-300">O que mudou?</strong> A partir de agora, <strong>todos os Creators monetizam tanto na primeira compra quanto em compras recorrentes</strong> — ninguém terá 0% de comissão! As comissões na primeira compra começam em <strong>5%</strong> e podem chegar até <strong>10%</strong> no tier Galaxy.
            </p>
            <div className="p-3 bg-purple-900/30 rounded-xl border border-purple-500/30 space-y-1 text-xs">
              <p className="font-bold text-purple-200 uppercase tracking-wider">Critérios Mínimos para se Inscrever:</p>
              <ul className="list-disc list-inside space-y-1 text-gray-300">
                <li>Ter pelo menos 10 vídeos longos (+5 minutos) de PK XD publicados OU 30 Shorts/TikToks</li>
                <li>Ter acumulado ao menos 10.000 views de PK XD nos últimos 3 meses</li>
                <li>Estar em conformidade com as regras da comunidade e do programa</li>
                <li>Aceitar os Termos do Creator Code</li>
              </ul>
            </div>
            <p>
              Os criadores serão categorizados como: <strong>Criador de Shorts</strong>, <strong>Criador de YouTube Longo</strong> ou <strong>Criador de TikTok</strong>.
            </p>
            <p className="text-gray-400 text-xs">
              Contato oficial de dúvidas e inscrições: <strong className="text-pink-300">creators@playpkxd.com</strong> ou pelo Discord via ModMail.
            </p>
          </div>
        </div>
      )}

      {/* Main Readiness Gauge & Diagnosis Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Eligibility Checklist & Live Progress Bars */}
        <div className="lg:col-span-2 space-y-6">
          
          <div className="p-6 rounded-3xl bg-[#0e0724]/90 border border-white/[0.08] backdrop-blur-xl shadow-xl space-y-6">
            
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] pb-4">
              <div>
                <h3 className="font-sans font-black text-lg sm:text-xl text-white uppercase flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-yellow-300" />
                  <span>Seu Progresso de Inscrição</span>
                </h3>
                <p className="text-xs text-gray-400 font-sans">
                  Atingimento dos critérios mínimos estabelecidos pela Afterverse
                </p>
              </div>

              {/* Status Badge */}
              <div className={`px-3.5 py-1.5 rounded-xl border font-sans text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                isFullyEligibleToApply 
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                  : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
              }`}>
                {isFullyEligibleToApply ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Elegível para Inscrição!</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4 text-amber-400" />
                    <span>Em Progresso ({readinessPercent}%)</span>
                  </>
                )}
              </div>
            </div>

            {/* Selector: Choose Primary Content Format */}
            <div className="space-y-2">
              <label className="text-xs font-mono font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                <span>1. Formato Principal do seu Canal:</span>
                <span className="text-[10px] text-purple-300 font-normal">(Classificação Afterverse)</span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    triggerAudio('tap');
                    updateStats({ format: 'youtube_long' });
                  }}
                  className={`p-3 rounded-2xl border text-left flex items-center gap-3 transition-all cursor-pointer active:scale-95 ${
                    stats.format === 'youtube_long'
                      ? 'bg-purple-600/25 border-purple-400 text-white shadow-[0_0_20px_rgba(168,85,247,0.3)]'
                      : 'bg-white/[0.03] border-white/10 text-gray-400 hover:text-white hover:bg-white/[0.06]'
                  }`}
                >
                  <div className="w-8 h-8 rounded-xl bg-red-600/20 text-red-400 flex items-center justify-center shrink-0">
                    <Video className="w-4 h-4" />
                  </div>
                  <div>
                    <strong className="block text-xs text-white">YouTube Longo</strong>
                    <span className="text-[10px] text-gray-400">Meta: 10 vídeos (+5m)</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    triggerAudio('tap');
                    updateStats({ format: 'youtube_shorts' });
                  }}
                  className={`p-3 rounded-2xl border text-left flex items-center gap-3 transition-all cursor-pointer active:scale-95 ${
                    stats.format === 'youtube_shorts'
                      ? 'bg-purple-600/25 border-purple-400 text-white shadow-[0_0_20px_rgba(168,85,247,0.3)]'
                      : 'bg-white/[0.03] border-white/10 text-gray-400 hover:text-white hover:bg-white/[0.06]'
                  }`}
                >
                  <div className="w-8 h-8 rounded-xl bg-pink-600/20 text-pink-400 flex items-center justify-center shrink-0">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <strong className="block text-xs text-white">YouTube Shorts</strong>
                    <span className="text-[10px] text-gray-400">Meta: 30 Shorts</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    triggerAudio('tap');
                    updateStats({ format: 'tiktok' });
                  }}
                  className={`p-3 rounded-2xl border text-left flex items-center gap-3 transition-all cursor-pointer active:scale-95 ${
                    stats.format === 'tiktok'
                      ? 'bg-purple-600/25 border-purple-400 text-white shadow-[0_0_20px_rgba(168,85,247,0.3)]'
                      : 'bg-white/[0.03] border-white/10 text-gray-400 hover:text-white hover:bg-white/[0.06]'
                  }`}
                >
                  <div className="w-8 h-8 rounded-xl bg-cyan-600/20 text-cyan-400 flex items-center justify-center shrink-0">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <div>
                    <strong className="block text-xs text-white">TikTok</strong>
                    <span className="text-[10px] text-gray-400">Meta: 30 TikToks</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Requirement 1: Videos Progress */}
            <div className="space-y-2 p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
              <div className="flex items-center justify-between text-xs font-sans">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <Play className="w-3.5 h-3.5 text-purple-400" />
                  <span>Vídeos Publicados de PK XD:</span>
                </span>
                <span className="font-mono text-xs font-bold text-yellow-300">
                  {currentVideosCount} / {reqVideosNeeded} ({videosProgress}%)
                </span>
              </div>

              {/* Visual Progress Bar */}
              <div className="w-full h-3 rounded-full bg-white/10 overflow-hidden relative">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    currentVideosCount >= reqVideosNeeded 
                      ? 'bg-gradient-to-r from-emerald-400 to-teal-400 shadow-[0_0_12px_#34d399]' 
                      : 'bg-gradient-to-r from-purple-500 to-pink-500'
                  }`}
                  style={{ width: `${videosProgress}%` }}
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <p className="text-[11px] text-gray-400">
                  {currentVideosCount >= reqVideosNeeded ? (
                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Meta de vídeos atingida!
                    </span>
                  ) : (
                    <span>Faltam <strong>{videosRemaining}</strong> {stats.format === 'youtube_long' ? 'vídeos longos (+5min)' : 'shorts/tiktoks'} de PK XD</span>
                  )}
                </p>

                {/* Counter buttons */}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      triggerAudio('tap');
                      if (stats.format === 'youtube_long') {
                        updateStats({ longVideosCount: Math.max(0, stats.longVideosCount - 1) });
                      } else {
                        updateStats({ shortsCount: Math.max(0, stats.shortsCount - 1) });
                      }
                    }}
                    className="w-6 h-6 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold flex items-center justify-center cursor-pointer text-xs"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="0"
                    max="999"
                    value={currentVideosCount}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 0;
                      if (stats.format === 'youtube_long') {
                        updateStats({ longVideosCount: val });
                      } else {
                        updateStats({ shortsCount: val });
                      }
                    }}
                    className="w-14 text-center py-1 rounded-lg bg-black/40 border border-white/10 text-white font-mono text-xs font-bold"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      triggerAudio('tap');
                      if (stats.format === 'youtube_long') {
                        updateStats({ longVideosCount: stats.longVideosCount + 1 });
                      } else {
                        updateStats({ shortsCount: stats.shortsCount + 1 });
                      }
                    }}
                    className="w-6 h-6 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold flex items-center justify-center cursor-pointer text-xs"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* Requirement 2: Views Last 3 Months */}
            <div className="space-y-2 p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
              <div className="flex items-center justify-between text-xs font-sans">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Visualizações nos Últimos 3 Meses:</span>
                </span>
                <span className="font-mono text-xs font-bold text-cyan-300">
                  {stats.viewsLast3Months.toLocaleString('pt-BR')} / 10.000 ({viewsProgress}%)
                </span>
              </div>

              <div className="w-full h-3 rounded-full bg-white/10 overflow-hidden relative">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    stats.viewsLast3Months >= reqViewsNeeded 
                      ? 'bg-gradient-to-r from-emerald-400 to-teal-400 shadow-[0_0_12px_#34d399]' 
                      : 'bg-gradient-to-r from-cyan-500 to-blue-500'
                  }`}
                  style={{ width: `${viewsProgress}%` }}
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <p className="text-[11px] text-gray-400">
                  {stats.viewsLast3Months >= reqViewsNeeded ? (
                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Meta de 10.000 views atingida!
                    </span>
                  ) : (
                    <span>Faltam <strong>{viewsRemaining.toLocaleString('pt-BR')}</strong> visualizações de PK XD</span>
                  )}
                </p>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-gray-400 font-mono">Suas views:</span>
                  <input
                    type="number"
                    min="0"
                    step="500"
                    value={stats.viewsLast3Months}
                    onChange={(e) => updateStats({ viewsLast3Months: Math.max(0, parseInt(e.target.value) || 0) })}
                    className="w-24 text-right px-2 py-1 rounded-lg bg-black/40 border border-white/10 text-white font-mono text-xs font-bold"
                  />
                </div>
              </div>
            </div>

            {/* Requirement 3 & 4: Legal & Community Compliance */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <label className="flex items-start gap-2.5 p-3 rounded-2xl bg-white/[0.02] border border-white/[0.06] cursor-pointer hover:bg-white/[0.04] transition-all">
                <input
                  type="checkbox"
                  checked={stats.compliantRules}
                  onChange={(e) => updateStats({ compliantRules: e.target.checked })}
                  className="mt-0.5 rounded text-purple-600 focus:ring-0 cursor-pointer"
                />
                <div>
                  <span className="text-xs font-bold text-white block">Regras da Comunidade</span>
                  <p className="text-[10.5px] text-gray-400 leading-snug">
                    Canal seguro, sem hacks, cheats ou conteúdo ofensivo.
                  </p>
                </div>
              </label>

              <label className="flex items-start gap-2.5 p-3 rounded-2xl bg-white/[0.02] border border-white/[0.06] cursor-pointer hover:bg-white/[0.04] transition-all">
                <input
                  type="checkbox"
                  checked={stats.acceptedTerms}
                  onChange={(e) => updateStats({ acceptedTerms: e.target.checked })}
                  className="mt-0.5 rounded text-purple-600 focus:ring-0 cursor-pointer"
                />
                <div>
                  <span className="text-xs font-bold text-white block">Termos do Creator Code</span>
                  <p className="text-[10.5px] text-gray-400 leading-snug">
                    Aceito os termos de comissão e política de parcerias.
                  </p>
                </div>
              </label>
            </div>

            {/* Save Button */}
            <div className="pt-2 flex items-center justify-between border-t border-white/[0.08]">
              <p className="text-[11px] text-gray-400 font-mono">
                {saveSuccessMsg ? '✅ Metas salvas na nuvem com sucesso!' : 'Mantenha suas métricas atualizadas semanalmente.'}
              </p>
              <button
                type="button"
                onClick={handleSaveToCloud}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-sans font-bold text-xs shadow-md transition-all cursor-pointer active:scale-95"
              >
                Salvar Minhas Metas (+100 XP)
              </button>
            </div>

          </div>

        </div>

        {/* Right 1 Col: Overall Score & Direct Application Card */}
        <div className="space-y-6">
          
          <div className="p-6 rounded-3xl bg-gradient-to-b from-[#160b33] to-[#0a0518] border border-purple-500/30 backdrop-blur-xl shadow-2xl space-y-5 text-center">
            
            <div className="w-16 h-16 mx-auto rounded-3xl bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 p-0.5 shadow-[0_0_30px_rgba(251,191,36,0.3)]">
              <div className="w-full h-full bg-[#0a0518] rounded-[22px] flex items-center justify-center">
                <Trophy className="w-8 h-8 text-yellow-300" />
              </div>
            </div>

            <div>
              <span className="text-[11px] font-mono uppercase tracking-widest text-purple-300 font-bold">
                Índice de Prontidão
              </span>
              <div className="font-sans font-black text-4xl text-white pt-1">
                {readinessPercent}%
              </div>
            </div>

            {/* Diagnostic Message */}
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] text-xs text-gray-300 leading-relaxed text-left space-y-1.5">
              <span className="font-bold text-white block flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                Diagnóstico Oficial:
              </span>
              {isFullyEligibleToApply ? (
                <p className="text-emerald-300 font-medium">
                  🎉 <strong>Parabéns!</strong> Você atende a todos os critérios mínimos para se candidatar ao Programa de Creators do PK XD! Copie o modelo abaixo e envie seu e-mail para a equipe.
                </p>
              ) : (
                <p>
                  {videosRemaining > 0 && (
                    <span>• Publique mais <strong>{videosRemaining}</strong> {stats.format === 'youtube_long' ? 'vídeos longos (+5min)' : 'shorts'} de PK XD.<br /></span>
                  )}
                  {viewsRemaining > 0 && (
                    <span>• Alcance mais <strong>{viewsRemaining.toLocaleString('pt-BR')}</strong> visualizações.<br /></span>
                  )}
                  <span className="text-yellow-300/90 block pt-1">Mantenha a constância e divulgue seus vídeos!</span>
                </p>
              )}
            </div>

            {/* Send Application CTA */}
            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={() => copyToClipboard(emailApplicationTemplate, true)}
                className={`w-full py-3 px-4 rounded-2xl font-sans font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg active:scale-95 ${
                  isFullyEligibleToApply 
                    ? 'bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-purple-950 shadow-[0_0_20px_rgba(251,191,36,0.4)]'
                    : 'bg-white/[0.06] hover:bg-white/[0.12] text-white border border-white/10'
                }`}
              >
                {copiedTemplate ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                <span>{copiedTemplate ? 'Modelo Copiado!' : 'Copiar E-mail de Inscrição'}</span>
              </button>

              <a
                href={`mailto:creators@playpkxd.com?subject=Inscrição%20Programa%20de%20Creators%20PK%20XD%20-%20${encodeURIComponent(stats.channelName || 'Canal')}&body=${encodeURIComponent(emailApplicationTemplate)}`}
                className="w-full py-2.5 px-4 rounded-2xl bg-purple-600/30 hover:bg-purple-600/50 border border-purple-400/30 text-purple-200 font-sans font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Mail className="w-3.5 h-3.5 text-pink-300" />
                <span>Enviar para creators@playpkxd.com</span>
              </a>
            </div>

          </div>

        </div>

      </div>

      {/* Official Tiers Breakdown by Zeta (Stardust, Rising Star, Supernova, Galaxy) */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[#0e0724]/90 border border-white/[0.08] backdrop-blur-xl shadow-xl space-y-6">
        
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] pb-4">
          <div>
            <h3 className="font-sans font-black text-xl sm:text-2xl text-white uppercase flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-300 fill-yellow-300" />
              <span>Tiers, Benefícios e Comissões Oficiais</span>
            </h3>
            <p className="text-xs text-gray-400 font-sans">
              Estrutura atualizada pela Zeta em 01/12/2025: Ninguém recebe 0% de comissão!
            </p>
          </div>

          {/* Tier Selector Pills */}
          <div className="flex flex-wrap items-center gap-1.5 bg-black/40 p-1.5 rounded-2xl border border-white/10">
            <button
              onClick={() => { triggerAudio('tap'); setActiveTierTab('stardust'); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold font-sans uppercase transition-all cursor-pointer ${
                activeTierTab === 'stardust' 
                  ? 'bg-purple-600 text-white shadow-md' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              ⭐ Stardust
            </button>
            <button
              onClick={() => { triggerAudio('tap'); setActiveTierTab('rising_star'); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold font-sans uppercase transition-all cursor-pointer ${
                activeTierTab === 'rising_star' 
                  ? 'bg-pink-600 text-white shadow-md' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              🌟 Rising Star
            </button>
            <button
              onClick={() => { triggerAudio('tap'); setActiveTierTab('supernova'); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold font-sans uppercase transition-all cursor-pointer ${
                activeTierTab === 'supernova' 
                  ? 'bg-amber-500 text-purple-950 font-black shadow-md' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              💥 Supernova
            </button>
            <button
              onClick={() => { triggerAudio('tap'); setActiveTierTab('galaxy'); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold font-sans uppercase transition-all cursor-pointer ${
                activeTierTab === 'galaxy' 
                  ? 'bg-cyan-500 text-slate-950 font-black shadow-md' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              🌌 Galaxy
            </button>
          </div>
        </div>

        {/* Tier Details Card */}
        {activeTierTab === 'stardust' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
            <div className="p-5 rounded-2xl bg-purple-900/15 border border-purple-500/30 space-y-3">
              <div className="flex items-center gap-2 text-purple-300 font-mono text-xs font-bold uppercase">
                <ShieldCheck className="w-4 h-4 text-purple-400" />
                <span>Critérios para Entrar no Tier Stardust</span>
              </div>
              <ul className="space-y-2 text-xs text-gray-300">
                <li className="flex items-start gap-2">
                  <span className="text-yellow-300 font-bold">•</span>
                  <span>Mínimo de <strong>1.000 seguidores</strong> no canal.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-300 font-bold">•</span>
                  <span><strong>YouTube Shorts:</strong> 16 Shorts por mês + Média de 1.000 views/vídeo.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-300 font-bold">•</span>
                  <span><strong>YouTube Longo:</strong> 8 vídeos por mês + Média de 700 views.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-300 font-bold">•</span>
                  <span><strong>TikTok:</strong> 16 TikToks por mês + Média de 1.000 views/vídeo.</span>
                </li>
              </ul>
            </div>

            <div className="p-5 rounded-2xl bg-purple-900/15 border border-purple-500/30 space-y-3">
              <div className="flex items-center gap-2 text-yellow-300 font-mono text-xs font-bold uppercase">
                <Gift className="w-4 h-4 text-yellow-400" />
                <span>Benefícios & Recompensas Stardust</span>
              </div>
              <ul className="space-y-2 text-xs text-gray-300">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span><strong>5% de comissão</strong> sobre a 1ª compra de cada jogador.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span><strong>0,7% de comissão recorrente</strong> sobre compras subsequentes.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span><strong>Mesada mensal:</strong> 30.000 moedas + 150 gemas no PK XD!</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span>E-mails exclusivos (Gossip Girl & Jenny Content), Discord VIP e área de destaques.</span>
                </li>
              </ul>
            </div>
          </div>
        )}

        {activeTierTab === 'rising_star' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
            <div className="p-5 rounded-2xl bg-pink-900/15 border border-pink-500/30 space-y-3">
              <div className="flex items-center gap-2 text-pink-300 font-mono text-xs font-bold uppercase">
                <ShieldCheck className="w-4 h-4 text-pink-400" />
                <span>Critérios para o Tier Rising Star</span>
              </div>
              <ul className="space-y-2 text-xs text-gray-300">
                <li className="flex items-start gap-2">
                  <span className="text-yellow-300 font-bold">•</span>
                  <span><strong>Shorts:</strong> 10.000 seguidores + 16 Shorts/mês + Média 10.000 views.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-300 font-bold">•</span>
                  <span><strong>YouTube Longo:</strong> 5.000 seguidores + 8 vídeos/mês + Média 1.000 views.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-300 font-bold">•</span>
                  <span><strong>TikTok:</strong> 10.000 seguidores + 16 TikToks/mês + Média 10.000 views.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-pink-300 font-bold">OU:</span>
                  <span>Creators que atingiram pelo menos <strong>$10 de revenue share</strong> nos últimos 3 meses.</span>
                </li>
              </ul>
            </div>

            <div className="p-5 rounded-2xl bg-pink-900/15 border border-pink-500/30 space-y-3">
              <div className="flex items-center gap-2 text-yellow-300 font-mono text-xs font-bold uppercase">
                <Gift className="w-4 h-4 text-yellow-400" />
                <span>Benefícios & Recompensas Rising Star</span>
              </div>
              <ul className="space-y-2 text-xs text-gray-300">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span><strong>5% 1ª compra</strong> + <strong>1% de comissão recorrente</strong>.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span><strong>Mesada mensal:</strong> 150.000 moedas + 1.500 gemas!</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span><strong>Código de 30 gemas</strong> com até 50 resgates mensalmente!</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span><strong>Fake purchase habilitada:</strong> Comprar pacotes de dinheiro real 1x sem custo.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span>[Em breve] Nova identificação in-game de Creator Oficial!</span>
                </li>
              </ul>
            </div>
          </div>
        )}

        {activeTierTab === 'supernova' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
            <div className="p-5 rounded-2xl bg-amber-900/15 border border-amber-500/30 space-y-3">
              <div className="flex items-center gap-2 text-amber-300 font-mono text-xs font-bold uppercase">
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <span>Critérios para o Tier Supernova</span>
              </div>
              <ul className="space-y-2 text-xs text-gray-300">
                <li className="flex items-start gap-2">
                  <span className="text-yellow-300 font-bold">•</span>
                  <span>Atingir pelo menos <strong>$50 de revenue share</strong> somado nos últimos 3 meses.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-300 font-bold">•</span>
                  <span>Estar ativo no último trimestre em total conformidade com os termos.</span>
                </li>
              </ul>
            </div>

            <div className="p-5 rounded-2xl bg-amber-900/15 border border-amber-500/30 space-y-3">
              <div className="flex items-center gap-2 text-yellow-300 font-mono text-xs font-bold uppercase">
                <Gift className="w-4 h-4 text-yellow-400" />
                <span>Benefícios & Recompensas Supernova</span>
              </div>
              <ul className="space-y-2 text-xs text-gray-300">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span><strong>8% 1ª compra</strong> + <strong>1,5% de comissão recorrente</strong>.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span><strong>Mesada mensal:</strong> 200.000 moedas + 2.000 gemas!</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span><strong>Código de 30 gemas</strong> com 150 resgates mensais.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span>Criação de <strong>UMA conta secundária/parceiro</strong> com benefícios de creator.</span>
                </li>
              </ul>
            </div>
          </div>
        )}

        {activeTierTab === 'galaxy' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
            <div className="p-5 rounded-2xl bg-cyan-900/15 border border-cyan-500/30 space-y-3">
              <div className="flex items-center gap-2 text-cyan-300 font-mono text-xs font-bold uppercase">
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
                <span>Critérios para o Tier Máximo: Galaxy</span>
              </div>
              <ul className="space-y-2 text-xs text-gray-300">
                <li className="flex items-start gap-2">
                  <span className="text-yellow-300 font-bold">•</span>
                  <span>Atingir pelo menos <strong>$300 de revenue share</strong> somado nos últimos 3 meses.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-300 font-bold">•</span>
                  <span>Constância comprovada e impacto estelar na comunidade do PK XD.</span>
                </li>
              </ul>
            </div>

            <div className="p-5 rounded-2xl bg-cyan-900/15 border border-cyan-500/30 space-y-3">
              <div className="flex items-center gap-2 text-yellow-300 font-mono text-xs font-bold uppercase">
                <Gift className="w-4 h-4 text-yellow-400" />
                <span>Benefícios Exclusivos Galaxy (Nível Supremo)</span>
              </div>
              <ul className="space-y-2 text-xs text-gray-300">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span><strong>10% 1ª compra</strong> + <strong>3% de comissão recorrente</strong>.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span><strong>Mesada máxima:</strong> 300.000 moedas + 3.000 gemas mensais!</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span><strong>Código de 30 gemas</strong> com 350 resgates para seus seguidores!</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span><strong>Fake purchase irrestrita:</strong> Comprar múltiplos pacotes de móveis e pet pods sem custo.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span><strong>Acesso antecipado</strong> em atualizações + <strong>Lives no canal oficial do PK XD</strong>!</span>
                </li>
              </ul>
            </div>
          </div>
        )}

        {/* Interactive Creator Code Revenue Simulator */}
        <div className="p-6 rounded-2xl bg-black/40 border border-white/10 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h4 className="font-sans font-bold text-sm text-white flex items-center gap-2">
              <Calculator className="w-4 h-4 text-emerald-400" />
              <span>Simulador de Ganhos no Tier {tierCommissions[activeTierTab].name}</span>
            </h4>
            <span className="text-[11px] font-mono text-gray-400">
              Comissão 1ª Compra: {(tierCommissions[activeTierTab].first * 100)}% • Recorrente: {(tierCommissions[activeTierTab].recurring * 100).toFixed(1)}%
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-[11px] font-mono text-gray-400 block mb-1">
                1ª Compras usando seu código:
              </label>
              <input
                type="number"
                min="0"
                value={simBuyers1st}
                onChange={(e) => setSimBuyers1st(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full px-3 py-2 rounded-xl bg-white/[0.05] border border-white/10 text-white font-mono text-xs font-bold"
              />
            </div>

            <div>
              <label className="text-[11px] font-mono text-gray-400 block mb-1">
                Compras Recorrentes:
              </label>
              <input
                type="number"
                min="0"
                value={simBuyersRec}
                onChange={(e) => setSimBuyersRec(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full px-3 py-2 rounded-xl bg-white/[0.05] border border-white/10 text-white font-mono text-xs font-bold"
              />
            </div>

            <div>
              <label className="text-[11px] font-mono text-gray-400 block mb-1">
                Valor Médio do Pacote (R$):
              </label>
              <input
                type="number"
                min="5"
                value={simAvgOrder}
                onChange={(e) => setSimAvgOrder(Math.max(5, parseInt(e.target.value) || 30))}
                className="w-full px-3 py-2 rounded-xl bg-white/[0.05] border border-white/10 text-white font-mono text-xs font-bold"
              />
            </div>
          </div>

          {/* Revenue Result Pill */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/30">
            <div>
              <span className="text-[11px] text-gray-300 font-sans block">Estimativa de Rendimento com Creator Code:</span>
              <strong className="text-xl sm:text-2xl text-emerald-400 font-mono font-black">
                R$ {simRevTotal.toFixed(2)}
              </strong>
            </div>
            <div className="text-right text-xs text-gray-300 font-mono">
              <div>1ª Compra: <span className="text-emerald-300 font-bold">R$ {simRev1st.toFixed(2)}</span></div>
              <div>Recorrente: <span className="text-emerald-300 font-bold">R$ {simRevRec.toFixed(2)}</span></div>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}

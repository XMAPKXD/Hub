import React, { useState, useEffect } from 'react';
import { 
  Youtube, 
  Video, 
  Smartphone, 
  Eye, 
  CheckCircle2, 
  AlertCircle, 
  TrendingUp, 
  Zap, 
  Crown, 
  Play,
  ShieldCheck,
  RefreshCw,
  ExternalLink,
  ThumbsUp,
  Users,
  Search,
  Sparkles,
  Lock
} from 'lucide-react';
import { db, auth } from '../firebase';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
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
  channelAvatar?: string;
  channelUrl?: string;
  subscribers: number;
  totalLifetimeVideos: number;
  longVideosCount: number;
  shortsCount: number;
  viewsLast3Months: number;
  totalLifetimeViews: number;
  totalLikes: number;
  averageViews: number;
  acceptedTerms: boolean;
  compliantRules: boolean;
  lastSyncedAt?: number;
  syncMethod?: 'youtube_api' | 'manual';
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
      channelAvatar: '',
      channelUrl: '',
      subscribers: 0,
      totalLifetimeVideos: 0,
      longVideosCount: 0,
      shortsCount: 0,
      viewsLast3Months: 0,
      totalLifetimeViews: 0,
      totalLikes: 0,
      averageViews: 0,
      acceptedTerms: true,
      compliantRules: true,
      syncMethod: 'manual'
    };
    try {
      const saved = localStorage.getItem('pkxd_creator_stats');
      if (saved) {
        return { ...defaultStats, ...JSON.parse(saved) };
      }
    } catch (e) {}
    return defaultStats;
  });

  const [handleInput, setHandleInput] = useState('');
  const [isLoggingInYT, setIsLoggingInYT] = useState(false);
  const [isSearchingChannel, setIsSearchingChannel] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState(false);

  // Sync from Firestore if user is logged in
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
      onAddXP(100, 'Metas de Creator Salvas 🎯');
      setSaveSuccessMsg(true);
      setTimeout(() => setSaveSuccessMsg(false), 3500);
    } catch (err) {
      console.error(err);
    }
  };

  // Dedicated direct YouTube Channel Lookup & Sync
  const fetchAndSyncYouTubeChannel = async (query: string) => {
    const cleanQuery = query.trim();
    if (!cleanQuery) {
      setSyncFeedback({
        type: 'error',
        message: 'Por favor, digite o @ do seu canal (ex: @kawanyuri).'
      });
      return;
    }

    setIsSearchingChannel(true);
    setSyncFeedback(null);

    try {
      const res = await fetch(`/api/youtube-channel?q=${encodeURIComponent(cleanQuery)}`);
      const data = await res.json();

      if (!res.ok || !data.success || !data.channel) {
        throw new Error(data.error || `Canal "${cleanQuery}" não encontrado no YouTube.`);
      }

      const ch = data.channel;
      const updatedStats: CreatorStats = {
        ...stats,
        channelName: ch.title || cleanQuery,
        channelHandle: ch.handle || (cleanQuery.startsWith('@') ? cleanQuery : `@${cleanQuery}`),
        channelAvatar: ch.avatar || stats.channelAvatar,
        channelUrl: ch.channelUrl || `https://www.youtube.com/${ch.handle}`,
        subscribers: ch.subscribers || stats.subscribers,
        totalLifetimeVideos: ch.totalVideos || stats.totalLifetimeVideos,
        lastSyncedAt: Date.now(),
        syncMethod: 'youtube_api'
      };

      setStats(updatedStats);
      try {
        localStorage.setItem('pkxd_creator_stats', JSON.stringify(updatedStats));
        if (user?.uid) {
          const docRef = doc(db, 'creator_goals', user.uid);
          setDoc(docRef, { ...updatedStats, userId: user.uid, updatedAt: Date.now() }, { merge: true });
        }
      } catch (e) {}

      setSyncFeedback({
        type: 'success',
        message: `Canal "${ch.title}" (${ch.handle}) sincronizado com sucesso! ${ch.subscribers ? ch.subscribers.toLocaleString('pt-BR') + ' inscritos' : ''} ${ch.totalVideos ? '• ' + ch.totalVideos + ' vídeos no YouTube' : ''}`
      });

      onAddXP(200, 'Canal do YouTube Sincronizado ⚡');
      triggerAudio('levelUp');
    } catch (err: any) {
      console.warn('Erro ao sincronizar canal:', err);
      setSyncFeedback({
        type: 'error',
        message: err.message || 'Falha ao buscar canal no YouTube. Verifique o @ digitado.'
      });
    } finally {
      setIsSearchingChannel(false);
    }
  };

  // Connect Google account and auto-discover the YouTube channel
  const handleConnectYouTube = async () => {
    triggerAudio('tap');
    setIsLoggingInYT(true);
    setSyncFeedback(null);

    try {
      const provider = new GoogleAuthProvider();
      provider.addScope('https://www.googleapis.com/auth/youtube.readonly');
      provider.setCustomParameters({ prompt: 'select_account' });

      const result = await signInWithPopup(auth, provider);
      const googleUser = result.user;
      
      const displayName = googleUser?.displayName || '';
      const email = googleUser?.email || '';
      const photoURL = googleUser?.photoURL || '';

      const emailPrefix = email.split('@')[0] || '';
      const cleanEmailPrefixNoDigits = emailPrefix.replace(/\d+$/, '');
      const cleanDisplayName = displayName.replace(/\s+/g, '');

      // Candidates to automatically test
      const candidatesToTry = [
        stats.channelHandle,
        cleanEmailPrefixNoDigits ? `@${cleanEmailPrefixNoDigits}` : '',
        emailPrefix ? `@${emailPrefix}` : '',
        cleanDisplayName ? `@${cleanDisplayName}` : ''
      ].filter(Boolean);

      let channelDetected = false;

      for (const candidate of candidatesToTry) {
        if (!candidate) continue;
        try {
          const checkRes = await fetch(`/api/youtube-channel?q=${encodeURIComponent(candidate)}`);
          if (checkRes.ok) {
            const checkData = await checkRes.json();
            if (checkData.success && checkData.channel) {
              const ch = checkData.channel;
              const updatedStats: CreatorStats = {
                ...stats,
                channelName: ch.title,
                channelHandle: ch.handle,
                channelAvatar: ch.avatar || photoURL,
                channelUrl: ch.channelUrl || `https://www.youtube.com/${ch.handle}`,
                subscribers: ch.subscribers || stats.subscribers,
                totalLifetimeVideos: ch.totalVideos || stats.totalLifetimeVideos,
                lastSyncedAt: Date.now(),
                syncMethod: 'youtube_api'
              };
              setStats(updatedStats);
              try {
                localStorage.setItem('pkxd_creator_stats', JSON.stringify(updatedStats));
                if (user?.uid) {
                  const docRef = doc(db, 'creator_goals', user.uid);
                  setDoc(docRef, { ...updatedStats, userId: user.uid, updatedAt: Date.now() }, { merge: true });
                }
              } catch (e) {}

              setSyncFeedback({
                type: 'success',
                message: `Conta conectada e canal ${ch.title} (${ch.handle}) detectado com sucesso!`
              });
              channelDetected = true;
              onAddXP(200, 'Canal do YouTube Sincronizado ⚡');
              triggerAudio('levelUp');
              break;
            }
          }
        } catch (e) {}
      }

      if (!channelDetected) {
        const suggestedHandle = `@${cleanEmailPrefixNoDigits || emailPrefix || 'seucanal'}`;
        updateStats({
          channelName: displayName || 'Criador PK XD',
          channelAvatar: photoURL || stats.channelAvatar,
          channelHandle: stats.channelHandle || suggestedHandle
        });
        setHandleInput(suggestedHandle);
        setSyncFeedback({
          type: 'info',
          message: `Conta Google de ${displayName || email} conectada! Se o @ do seu canal for diferente de "${stats.channelHandle || suggestedHandle}", digite-o no campo abaixo e clique em Sincronizar.`
        });
      }
    } catch (err: any) {
      console.warn('Erro ao conectar Google:', err);
      if (err.code !== 'auth/popup-closed-by-user') {
        setSyncFeedback({
          type: 'info',
          message: 'Você pode digitar diretamente o @ ou link do seu canal no campo abaixo para sincronizar suas métricas!'
        });
      }
    } finally {
      setIsLoggingInYT(false);
    }
  };

  // Official Requirements
  // 1. 10 long-form videos (+5 min) OR 30 Shorts/TikToks
  // 2. 10,000 views in the last 3 months
  // 3. Community guidelines compliance
  // 4. Terms acceptance
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

  return (
    <div id="creator-metas-tracker-root" className="space-y-6 animate-fade-in select-none text-left font-sans">
      
      {/* Header Banner - Sleek Dark Cosmic Card */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-[#0e0a24]/90 border border-purple-500/25 p-6 sm:p-8 shadow-[0_12px_40px_rgba(0,0,0,0.6)] backdrop-blur-xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-pink-600/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 space-y-5">
          
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-950/80 border border-purple-500/40 text-purple-300 text-xs font-bold shadow-sm">
              <Crown className="w-3.5 h-3.5 text-yellow-400" />
              <span>Afterverse Creators • Metas de Qualificação</span>
            </div>

            {stats.lastSyncedAt && (
              <span className="text-[11px] font-mono text-zinc-400 bg-purple-950/60 px-3 py-1 rounded-lg border border-purple-500/20">
                Última sincronização: {new Date(stats.lastSyncedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </div>

          <div className="max-w-3xl space-y-2">
            <h2 className="text-xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5 flex-wrap">
              <span>Metas para o Programa de Creators PK XD</span>
              <span className="text-xs font-mono font-bold bg-gradient-to-r from-yellow-400 to-amber-500 text-purple-950 px-2.5 py-0.5 rounded-md shadow-sm">
                OFICIAL
              </span>
            </h2>
            <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed max-w-2xl">
              Conecte seu canal ou busque diretamente pelo <strong className="text-purple-300">@ do YouTube</strong> para acompanhar seus vídeos, inscritos e calcular exatamente quanto falta para atingir todos os critérios de inscrição.
            </p>
          </div>

          {/* Direct Search & Sync Bar */}
          <div className="pt-1 flex flex-col md:flex-row items-stretch md:items-center gap-3">
            
            {/* Google / YouTube OAuth Login Button */}
            <button
              onClick={handleConnectYouTube}
              disabled={isLoggingInYT || isSearchingChannel}
              className="inline-flex items-center justify-center gap-2 bg-[#cc0000] hover:bg-[#b00000] active:scale-95 text-white text-xs sm:text-sm font-bold py-2.5 px-4 rounded-xl transition-all cursor-pointer shadow-[0_0_15px_rgba(204,0,0,0.35)] disabled:opacity-50 shrink-0"
            >
              <Youtube className="w-4 h-4 fill-white" />
              <span>
                {isLoggingInYT ? 'Conectando ao Google...' : stats.channelHandle ? 'Reconectar Google' : 'Conectar Conta Google'}
              </span>
            </button>

            {/* Direct Handle Search & Sync Form */}
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                fetchAndSyncYouTubeChannel(handleInput || stats.channelHandle);
              }}
              className="flex-1 flex items-center gap-2"
            >
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-purple-400" />
                <input
                  type="text"
                  value={handleInput}
                  onChange={(e) => setHandleInput(e.target.value)}
                  placeholder={stats.channelHandle || "Digite o @ ou link do canal (ex: @kawanyuri)"}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-purple-950/60 border border-purple-500/35 text-white placeholder:text-zinc-500 text-xs sm:text-sm font-medium focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400 transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={isSearchingChannel}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 via-fuchsia-600 to-indigo-600 hover:brightness-110 active:scale-95 text-white text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-[0_0_15px_rgba(168,85,247,0.4)] disabled:opacity-50 cursor-pointer shrink-0 border border-white/20 transition-all"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSearchingChannel ? 'animate-spin' : ''}`} />
                <span>{isSearchingChannel ? 'Buscando...' : 'Sincronizar Canal'}</span>
              </button>
            </form>
          </div>

          {/* Active Identified Channel Card */}
          {stats.channelHandle && (
            <div className="p-3.5 rounded-2xl bg-purple-950/70 border border-purple-500/40 flex flex-wrap items-center justify-between gap-3 shadow-inner">
              <div className="flex items-center gap-3">
                {stats.channelAvatar ? (
                  <img 
                    src={stats.channelAvatar} 
                    alt={stats.channelName} 
                    className="w-10 h-10 rounded-full object-cover border-2 border-purple-400 shadow-md"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center text-white font-bold text-sm">
                    {stats.channelName?.charAt(0) || 'YT'}
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <strong className="text-white text-sm font-bold">
                      {stats.channelName || stats.channelHandle}
                    </strong>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Canal Reconhecido
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-zinc-400 pt-0.5">
                    <span className="text-purple-300 font-mono font-semibold">{stats.channelHandle}</span>
                    <span>•</span>
                    <a 
                      href={stats.channelUrl || `https://www.youtube.com/${stats.channelHandle}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-pink-400 hover:text-pink-300 flex items-center gap-1 hover:underline"
                    >
                      <span>Abrir no YouTube</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 text-xs text-zinc-300">
                {stats.subscribers > 0 && (
                  <span className="px-3 py-1 rounded-xl bg-black/40 border border-white/10 font-mono">
                    <strong className="text-white">{stats.subscribers.toLocaleString('pt-BR')}</strong> inscritos
                  </span>
                )}
                {stats.totalLifetimeVideos > 0 && (
                  <span className="px-3 py-1 rounded-xl bg-black/40 border border-white/10 font-mono">
                    <strong className="text-white">{stats.totalLifetimeVideos}</strong> vídeos
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Feedback Message */}
          {syncFeedback && (
            <div className={`p-3.5 rounded-2xl border text-xs flex items-start gap-2.5 animate-slide-up ${
              syncFeedback.type === 'success' 
                ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-200' 
                : syncFeedback.type === 'error'
                ? 'bg-red-950/60 border-red-500/40 text-red-200'
                : 'bg-purple-950/70 border-purple-500/40 text-purple-200'
            }`}>
              {syncFeedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 text-purple-400 mt-0.5" />
              )}
              <span className="leading-relaxed">{syncFeedback.message}</span>
            </div>
          )}

        </div>
      </div>

      {/* Security & Read-Only Guarantee Box */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[#0e0a24]/90 border border-emerald-500/30 text-xs text-zinc-300 space-y-2 shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
        <div className="flex items-center gap-2 text-emerald-400 font-bold">
          <ShieldCheck className="w-4 h-4 shrink-0" />
          <span>Segurança & Acesso Somente Leitura (Read-Only)</span>
        </div>
        <p className="text-zinc-300 leading-relaxed text-[11.5px]">
          O acesso é 100% oficial e seguro. 
          <strong className="text-white"> NÃO publicamos nada</strong>, 
          <strong className="text-white"> NÃO alteramos seu canal</strong> e 
          <strong className="text-white"> NÃO temos acesso a senhas ou dados privados</strong>. 
          Consultamos apenas dados estatísticos públicos (nome do canal, vídeos publicados, inscritos e visualizações) para você acompanhar com total precisão o que falta para suas metas de Creator Afterverse.
        </p>
      </div>

      {/* Channel Key Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-[#0e0a24]/90 border border-purple-500/25 space-y-1 shadow-md">
          <span className="text-[11px] text-zinc-400 block flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-purple-400" />
            <span>Inscritos</span>
          </span>
          <strong className="text-base sm:text-xl text-white font-black block">
            {stats.subscribers > 0 ? stats.subscribers.toLocaleString('pt-BR') : '—'}
          </strong>
        </div>

        <div className="p-4 rounded-2xl bg-[#0e0a24]/90 border border-purple-500/25 space-y-1 shadow-md">
          <span className="text-[11px] text-zinc-400 block flex items-center gap-1.5">
            <Play className="w-3.5 h-3.5 text-purple-400" />
            <span>Vídeos no Canal</span>
          </span>
          <strong className="text-base sm:text-xl text-white font-black block">
            {stats.totalLifetimeVideos > 0 ? stats.totalLifetimeVideos : (currentVideosCount || '—')}
          </strong>
        </div>

        <div className="p-4 rounded-2xl bg-[#0e0a24]/90 border border-purple-500/25 space-y-1 shadow-md">
          <span className="text-[11px] text-zinc-400 block flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5 text-purple-400" />
            <span>Views (3 Meses)</span>
          </span>
          <strong className="text-base sm:text-xl text-white font-black block">
            {stats.viewsLast3Months.toLocaleString('pt-BR')}
          </strong>
        </div>

        <div className="p-4 rounded-2xl bg-[#0e0a24]/90 border border-purple-500/25 space-y-1 shadow-md">
          <span className="text-[11px] text-zinc-400 block flex items-center gap-1.5">
            <ThumbsUp className="w-3.5 h-3.5 text-purple-400" />
            <span>Curtidas Computadas</span>
          </span>
          <strong className="text-base sm:text-xl text-white font-black block">
            {stats.totalLikes > 0 ? stats.totalLikes.toLocaleString('pt-BR') : '—'}
          </strong>
        </div>
      </div>

      {/* Main Requirements & Live Goals Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Requirements and Progress Bars */}
        <div className="lg:col-span-2 space-y-5">
          
          <div className="p-5 sm:p-6 rounded-2xl sm:rounded-3xl bg-[#0e0a24]/90 border border-purple-500/25 space-y-5 shadow-[0_12px_40px_rgba(0,0,0,0.6)]">
            
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-purple-500/20 pb-4">
              <div>
                <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-pink-400" />
                  <span>Critérios Mínimos de Inscrição</span>
                </h3>
                <p className="text-xs text-zinc-400">
                  Parâmetros oficiais de qualificação exigidos pela Afterverse
                </p>
              </div>

              {/* Status Badge */}
              <div className={`px-3 py-1 rounded-full border text-xs font-bold flex items-center gap-1.5 ${
                isFullyEligibleToApply 
                  ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                  : 'bg-purple-950/80 text-purple-300 border-purple-500/40'
              }`}>
                {isFullyEligibleToApply ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Qualificado para Inscrição!</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-3.5 h-3.5 text-yellow-400" />
                    <span>Progresso Geral: {readinessPercent}%</span>
                  </>
                )}
              </div>
            </div>

            {/* Selector: Choose Primary Content Format */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-300 block uppercase tracking-wider">
                Formato Principal de Conteúdo:
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    triggerAudio('tap');
                    updateStats({ format: 'youtube_long' });
                  }}
                  className={`p-3 rounded-2xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                    stats.format === 'youtube_long'
                      ? 'bg-purple-950/80 border-purple-400 text-white shadow-[0_0_15px_rgba(168,85,247,0.3)]'
                      : 'bg-[#0a051c]/60 border-white/10 text-zinc-400 hover:text-white hover:bg-white/[0.05]'
                  }`}
                >
                  <div className="w-8 h-8 rounded-xl bg-red-600/20 border border-red-500/30 text-red-400 flex items-center justify-center shrink-0">
                    <Video className="w-4 h-4" />
                  </div>
                  <div>
                    <strong className="block text-xs font-bold text-white">YouTube Longo</strong>
                    <span className="text-[11px] text-zinc-400">Meta: 10 vídeos (+5m)</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    triggerAudio('tap');
                    updateStats({ format: 'youtube_shorts' });
                  }}
                  className={`p-3 rounded-2xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                    stats.format === 'youtube_shorts'
                      ? 'bg-purple-950/80 border-purple-400 text-white shadow-[0_0_15px_rgba(168,85,247,0.3)]'
                      : 'bg-[#0a051c]/60 border-white/10 text-zinc-400 hover:text-white hover:bg-white/[0.05]'
                  }`}
                >
                  <div className="w-8 h-8 rounded-xl bg-pink-600/20 border border-pink-500/30 text-pink-400 flex items-center justify-center shrink-0">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <strong className="block text-xs font-bold text-white">YouTube Shorts</strong>
                    <span className="text-[11px] text-zinc-400">Meta: 30 Shorts</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    triggerAudio('tap');
                    updateStats({ format: 'tiktok' });
                  }}
                  className={`p-3 rounded-2xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                    stats.format === 'tiktok'
                      ? 'bg-purple-950/80 border-purple-400 text-white shadow-[0_0_15px_rgba(168,85,247,0.3)]'
                      : 'bg-[#0a051c]/60 border-white/10 text-zinc-400 hover:text-white hover:bg-white/[0.05]'
                  }`}
                >
                  <div className="w-8 h-8 rounded-xl bg-cyan-600/20 border border-cyan-500/30 text-cyan-400 flex items-center justify-center shrink-0">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <div>
                    <strong className="block text-xs font-bold text-white">TikTok</strong>
                    <span className="text-[11px] text-zinc-400">Meta: 30 TikToks</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Requirement 1: Videos Progress */}
            <div className="space-y-2.5 p-4 sm:p-5 rounded-2xl bg-purple-950/40 border border-purple-500/20">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-zinc-200 flex items-center gap-1.5">
                  <Play className="w-3.5 h-3.5 text-pink-400" />
                  <span>Vídeos Publicados de PK XD:</span>
                </span>
                <span className="font-mono text-xs font-bold text-purple-300">
                  {currentVideosCount} / {reqVideosNeeded} ({videosProgress}%)
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-2.5 rounded-full bg-purple-950/80 overflow-hidden relative border border-purple-500/20">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    currentVideosCount >= reqVideosNeeded 
                      ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' 
                      : 'bg-gradient-to-r from-purple-500 to-pink-500 shadow-[0_0_10px_rgba(236,72,153,0.5)]'
                  }`}
                  style={{ width: `${videosProgress}%` }}
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <p className="text-[11px] text-zinc-300">
                  {currentVideosCount >= reqVideosNeeded ? (
                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Meta de vídeos atingida!
                    </span>
                  ) : (
                    <span>Faltam <strong className="text-yellow-300">{videosRemaining}</strong> {stats.format === 'youtube_long' ? 'vídeos longos (+5min)' : 'shorts'} de PK XD</span>
                  )}
                </p>

                {/* Manual adjuster */}
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
                    className="w-7 h-7 rounded-lg bg-purple-950/80 border border-purple-500/40 hover:bg-purple-900 text-white font-bold flex items-center justify-center cursor-pointer text-xs transition-colors"
                    title="Diminuir"
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
                    className="w-14 text-center py-1 rounded-lg bg-purple-950/90 border border-purple-500/40 text-white font-mono text-xs font-bold focus:outline-none focus:border-purple-400"
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
                    className="w-7 h-7 rounded-lg bg-purple-950/80 border border-purple-500/40 hover:bg-purple-900 text-white font-bold flex items-center justify-center cursor-pointer text-xs transition-colors"
                    title="Aumentar"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* Requirement 2: Views Last 3 Months */}
            <div className="space-y-2.5 p-4 sm:p-5 rounded-2xl bg-purple-950/40 border border-purple-500/20">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-zinc-200 flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-pink-400" />
                  <span>Visualizações nos Últimos 3 Meses:</span>
                </span>
                <span className="font-mono text-xs font-bold text-purple-300">
                  {stats.viewsLast3Months.toLocaleString('pt-BR')} / 10.000 ({viewsProgress}%)
                </span>
              </div>

              <div className="w-full h-2.5 rounded-full bg-purple-950/80 overflow-hidden relative border border-purple-500/20">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    stats.viewsLast3Months >= reqViewsNeeded 
                      ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' 
                      : 'bg-gradient-to-r from-purple-500 to-pink-500 shadow-[0_0_10px_rgba(236,72,153,0.5)]'
                  }`}
                  style={{ width: `${viewsProgress}%` }}
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <p className="text-[11px] text-zinc-300">
                  {stats.viewsLast3Months >= reqViewsNeeded ? (
                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Meta de 10.000 views atingida!
                    </span>
                  ) : (
                    <span>Faltam <strong className="text-yellow-300">{viewsRemaining.toLocaleString('pt-BR')}</strong> visualizações</span>
                  )}
                </p>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-zinc-400">Ajustar views:</span>
                  <input
                    type="number"
                    min="0"
                    step="500"
                    value={stats.viewsLast3Months}
                    onChange={(e) => updateStats({ viewsLast3Months: Math.max(0, parseInt(e.target.value) || 0) })}
                    className="w-28 text-right px-2.5 py-1 rounded-lg bg-purple-950/90 border border-purple-500/40 text-white font-mono text-xs font-bold focus:outline-none focus:border-purple-400"
                  />
                </div>
              </div>
            </div>

            {/* Requirement 3 & 4: Compliance checkboxes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <label className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-purple-950/40 border border-purple-500/20 cursor-pointer hover:bg-purple-950/60 transition-colors">
                <input
                  type="checkbox"
                  checked={stats.compliantRules}
                  onChange={(e) => updateStats({ compliantRules: e.target.checked })}
                  className="mt-0.5 rounded border-purple-400 text-purple-600 focus:ring-0 cursor-pointer"
                />
                <div>
                  <span className="text-xs font-bold text-white block">Diretrizes da Comunidade</span>
                  <p className="text-[11px] text-zinc-400 leading-snug">
                    Conteúdo seguro para todas as idades, sem mods ilegais, bugs abusivos ou cheats.
                  </p>
                </div>
              </label>

              <label className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-purple-950/40 border border-purple-500/20 cursor-pointer hover:bg-purple-950/60 transition-colors">
                <input
                  type="checkbox"
                  checked={stats.acceptedTerms}
                  onChange={(e) => updateStats({ acceptedTerms: e.target.checked })}
                  className="mt-0.5 rounded border-purple-400 text-purple-600 focus:ring-0 cursor-pointer"
                />
                <div>
                  <span className="text-xs font-bold text-white block">Termos do Creator Code</span>
                  <p className="text-[11px] text-zinc-400 leading-snug">
                    Concordância com as regras e diretrizes de parceria oficial da Afterverse.
                  </p>
                </div>
              </label>
            </div>

            {/* Save Button */}
            <div className="pt-3 flex items-center justify-between border-t border-purple-500/20">
              <p className="text-[11px] text-zinc-400">
                {saveSuccessMsg ? '✅ Metas salvas com sucesso!' : 'Mantenha suas métricas sincronizadas para acompanhar seu progresso.'}
              </p>
              <button
                type="button"
                onClick={handleSaveToCloud}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 via-fuchsia-600 to-indigo-600 hover:brightness-110 active:scale-95 text-white text-xs font-bold transition-all cursor-pointer shadow-[0_0_15px_rgba(168,85,247,0.35)] border border-white/20"
              >
                Salvar Metas
              </button>
            </div>

          </div>

        </div>

        {/* Right 1 Col: Overall Score & Diagnostic Card */}
        <div className="space-y-5">
          
          <div className="p-5 sm:p-6 rounded-2xl sm:rounded-3xl bg-[#0e0a24]/90 border border-purple-500/25 space-y-4 text-center shadow-[0_12px_40px_rgba(0,0,0,0.6)]">
            
            <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-purple-600 to-pink-500 border border-white/20 flex items-center justify-center shadow-[0_0_20px_rgba(168,85,247,0.4)]">
              <Crown className="w-7 h-7 text-white" />
            </div>

            <div>
              <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-bold">
                Índice de Qualificação
              </span>
              <div className="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-pink-400 to-purple-400 pt-1">
                {readinessPercent}%
              </div>
            </div>

            {/* Diagnostic Message */}
            <div className="p-3.5 rounded-2xl bg-purple-950/60 border border-purple-500/30 text-xs text-zinc-200 leading-relaxed text-left space-y-1.5">
              <span className="font-bold text-white block">
                Diagnóstico de Elegibilidade:
              </span>
              {isFullyEligibleToApply ? (
                <p className="text-emerald-300 font-bold">
                  Parabéns! Seu canal atingiu todos os requisitos mínimos estabelecidos para a inscrição no programa de Creators PK XD.
                </p>
              ) : (
                <div className="space-y-1 text-zinc-300">
                  {videosRemaining > 0 && (
                    <p>• Publique mais <strong className="text-yellow-300">{videosRemaining}</strong> {stats.format === 'youtube_long' ? 'vídeos longos (+5min)' : 'shorts'} de PK XD.</p>
                  )}
                  {viewsRemaining > 0 && (
                    <p>• Acumule mais <strong className="text-yellow-300">{viewsRemaining.toLocaleString('pt-BR')}</strong> visualizações nos últimos 3 meses.</p>
                  )}
                  {(!stats.compliantRules || !stats.acceptedTerms) && (
                    <p>• Marque a aceitação dos termos e diretrizes da comunidade.</p>
                  )}
                </div>
              )}
            </div>

            {/* Checklist */}
            <div className="space-y-2 pt-1 text-left text-xs">
              <div className={`p-2.5 rounded-xl border flex items-center gap-2 ${currentVideosCount >= reqVideosNeeded ? 'bg-emerald-950/50 border-emerald-500/40 text-emerald-300' : 'bg-purple-950/30 border-purple-500/20 text-zinc-400'}`}>
                <CheckCircle2 className={`w-4 h-4 shrink-0 ${currentVideosCount >= reqVideosNeeded ? 'text-emerald-400' : 'text-zinc-500'}`} />
                <span>Mínimo de vídeos ({currentVideosCount}/{reqVideosNeeded})</span>
              </div>

              <div className={`p-2.5 rounded-xl border flex items-center gap-2 ${stats.viewsLast3Months >= reqViewsNeeded ? 'bg-emerald-950/50 border-emerald-500/40 text-emerald-300' : 'bg-purple-950/30 border-purple-500/20 text-zinc-400'}`}>
                <CheckCircle2 className={`w-4 h-4 shrink-0 ${stats.viewsLast3Months >= reqViewsNeeded ? 'text-emerald-400' : 'text-zinc-500'}`} />
                <span>10.000 views em 3 meses ({stats.viewsLast3Months.toLocaleString('pt-BR')}/10.000)</span>
              </div>

              <div className={`p-2.5 rounded-xl border flex items-center gap-2 ${stats.compliantRules ? 'bg-emerald-950/50 border-emerald-500/40 text-emerald-300' : 'bg-purple-950/30 border-purple-500/20 text-zinc-400'}`}>
                <CheckCircle2 className={`w-4 h-4 shrink-0 ${stats.compliantRules ? 'text-emerald-400' : 'text-zinc-500'}`} />
                <span>Diretrizes da comunidade</span>
              </div>

              <div className={`p-2.5 rounded-xl border flex items-center gap-2 ${stats.acceptedTerms ? 'bg-emerald-950/50 border-emerald-500/40 text-emerald-300' : 'bg-purple-950/30 border-purple-500/20 text-zinc-400'}`}>
                <CheckCircle2 className={`w-4 h-4 shrink-0 ${stats.acceptedTerms ? 'text-emerald-400' : 'text-zinc-500'}`} />
                <span>Termos de parceria</span>
              </div>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}

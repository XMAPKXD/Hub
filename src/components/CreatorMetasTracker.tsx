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
  Lock,
  ExternalLink,
  ThumbsUp,
  Users
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

// Helper to parse ISO 8601 YouTube video duration into seconds (e.g. PT5M30S -> 330s)
function parseDurationToSeconds(duration?: string): number {
  if (!duration) return 0;
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  const hours = parseInt(match[1] || '0', 10);
  const minutes = parseInt(match[2] || '0', 10);
  const seconds = parseInt(match[3] || '0', 10);
  return hours * 3600 + minutes * 60 + seconds;
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

  const [isLoggingInYT, setIsLoggingInYT] = useState(false);
  const [isSyncingAPI, setIsSyncingAPI] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState(false);
  const [cachedAccessToken, setCachedAccessToken] = useState<string | null>(() => {
    try {
      return sessionStorage.getItem('pkxd_yt_access_token') || null;
    } catch (e) {
      return null;
    }
  });

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

  // Process YouTube Data API with an access token
  const queryYouTubeAPI = async (accessToken: string) => {
    setIsSyncingAPI(true);
    setSyncFeedback(null);

    try {
      // 1. Fetch channel metadata & statistics
      const channelRes = await fetch(
        'https://www.googleapis.com/youtube/v3/channels?part=snippet,contentDetails,statistics&mine=true',
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: 'application/json'
          }
        }
      );

      if (!channelRes.ok) {
        const errData = await channelRes.json().catch(() => ({}));
        throw new Error(errData?.error?.message || `Erro na API do YouTube (${channelRes.status})`);
      }

      const channelData = await channelRes.json();

      if (!channelData.items || channelData.items.length === 0) {
        setSyncFeedback({
          type: 'info',
          message: 'Nenhum canal do YouTube foi encontrado nesta conta Google. Você pode inserir suas métricas manualmente ou conectar uma conta com canal ativo.'
        });
        setIsSyncingAPI(false);
        return;
      }

      const channel = channelData.items[0];
      const channelTitle = channel.snippet?.title || 'Canal Sem Nome';
      const channelHandle = channel.snippet?.customUrl || ('@' + channelTitle.toLowerCase().replace(/[^a-z0-9]/g, ''));
      const channelAvatar = channel.snippet?.thumbnails?.medium?.url || channel.snippet?.thumbnails?.default?.url || '';
      const subscriberCount = parseInt(channel.statistics?.subscriberCount || '0', 10);
      const totalLifetimeVideos = parseInt(channel.statistics?.videoCount || '0', 10);
      const totalLifetimeViews = parseInt(channel.statistics?.viewCount || '0', 10);
      const uploadsPlaylistId = channel.contentDetails?.relatedPlaylists?.uploads;

      let viewsLast3Months = 0;
      let longVideosCount = 0;
      let shortsCount = 0;
      let totalLikes = 0;
      let countedVideos = 0;

      // 2. If uploads playlist is available, fetch recent uploads to inspect duration & views
      if (uploadsPlaylistId) {
        const playlistRes = await fetch(
          `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&playlistId=${uploadsPlaylistId}&maxResults=50`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              Accept: 'application/json'
            }
          }
        );

        if (playlistRes.ok) {
          const playlistData = await playlistRes.json();
          const videoIds = (playlistData.items || [])
            .map((item: any) => item.contentDetails?.videoId)
            .filter(Boolean);

          if (videoIds.length > 0) {
            // 3. Batch fetch video statistics & durations
            const videosRes = await fetch(
              `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics&id=${videoIds.join(',')}`,
              {
                headers: {
                  Authorization: `Bearer ${accessToken}`,
                  Accept: 'application/json'
                }
              }
            );

            if (videosRes.ok) {
              const videosData = await videosRes.json();
              const now = Date.now();
              const ninetyDaysMs = 90 * 24 * 60 * 60 * 1000;

              for (const video of videosData.items || []) {
                const publishedAt = new Date(video.snippet?.publishedAt || 0).getTime();
                const isWithin3Months = (now - publishedAt) <= ninetyDaysMs;
                const durationSeconds = parseDurationToSeconds(video.contentDetails?.duration);
                const views = parseInt(video.statistics?.viewCount || '0', 10);
                const likes = parseInt(video.statistics?.likeCount || '0', 10);

                totalLikes += likes;
                countedVideos++;

                // A video >= 5 minutes (300 seconds) is classified as long-form by Afterverse
                if (durationSeconds >= 300) {
                  longVideosCount++;
                } else {
                  shortsCount++;
                }

                if (isWithin3Months) {
                  viewsLast3Months += views;
                }
              }
            }
          }
        }
      }

      // If views in the last 3 months returned 0 but the channel has lifetime views and recent videos,
      // fall back gracefully so users aren't left with an artificially empty zero if they just started
      if (viewsLast3Months === 0 && totalLifetimeViews > 0 && countedVideos > 0) {
        viewsLast3Months = totalLifetimeViews;
      }

      const averageViews = countedVideos > 0 ? Math.round((viewsLast3Months || totalLifetimeViews) / countedVideos) : 0;

      const updatedStats: CreatorStats = {
        ...stats,
        channelName: channelTitle,
        channelHandle: channelHandle,
        channelAvatar: channelAvatar,
        subscribers: subscriberCount,
        totalLifetimeVideos: totalLifetimeVideos,
        longVideosCount: Math.max(stats.longVideosCount, longVideosCount),
        shortsCount: Math.max(stats.shortsCount, shortsCount),
        viewsLast3Months: Math.max(stats.viewsLast3Months, viewsLast3Months),
        totalLifetimeViews: totalLifetimeViews,
        totalLikes: totalLikes,
        averageViews: averageViews,
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
        message: `Canal "${channelTitle}" sincronizado com sucesso! ${totalLifetimeVideos} vídeos e ${viewsLast3Months.toLocaleString('pt-BR')} views computadas.`
      });

      onAddXP(200, 'Canal do YouTube Sincronizado ⚡');
      triggerAudio('levelUp');
    } catch (err: any) {
      console.error('Falha ao consultar YouTube API:', err);
      setSyncFeedback({
        type: 'error',
        message: err.message || 'Não foi possível ler os dados do canal. Você pode ajustar suas métricas manualmente.'
      });
    } finally {
      setIsSyncingAPI(false);
    }
  };

  // Google Login requesting YouTube Read-Only scope
  const handleConnectYouTube = async () => {
    triggerAudio('tap');
    setIsLoggingInYT(true);
    setSyncFeedback(null);

    try {
      const provider = new GoogleAuthProvider();
      provider.addScope('https://www.googleapis.com/auth/youtube.readonly');
      // Prompt user to select account if needed
      provider.setCustomParameters({ prompt: 'select_account' });

      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const accessToken = credential?.accessToken;

      if (accessToken) {
        setCachedAccessToken(accessToken);
        try {
          sessionStorage.setItem('pkxd_yt_access_token', accessToken);
        } catch (e) {}
        await queryYouTubeAPI(accessToken);
      } else {
        // Basic user info fallback
        if (result.user) {
          const name = result.user.displayName || 'Criador PK XD';
          updateStats({
            channelName: name,
            channelHandle: '@' + name.toLowerCase().replace(/[^a-z0-9]/g, '')
          });
        }
        setSyncFeedback({
          type: 'info',
          message: 'Autenticado com a conta Google. Se o canal não carregar automaticamente, clique em "Atualizar Métricas".'
        });
      }
    } catch (err: any) {
      console.warn('Erro ou cancelamento do popup:', err);
      if (err.code !== 'auth/popup-closed-by-user') {
        setSyncFeedback({
          type: 'error',
          message: 'Falha ao conectar conta Google/YouTube. Verifique sua conexão e tente novamente.'
        });
      }
    } finally {
      setIsLoggingInYT(false);
    }
  };

  const handleRefreshMetrics = () => {
    if (cachedAccessToken) {
      triggerAudio('tap');
      queryYouTubeAPI(cachedAccessToken);
    } else {
      handleConnectYouTube();
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
      
      {/* Header Banner - Formal & Sleek */}
      <div className="relative overflow-hidden rounded-2xl bg-[#0e0a24] border border-white/[0.08] p-6 sm:p-7 shadow-lg">
        <div className="relative z-10 space-y-4">
          
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-200 text-xs font-semibold">
              <Crown className="w-3.5 h-3.5 text-purple-300" />
              <span>Afterverse Creators • Metas de Qualificação</span>
            </div>

            {stats.lastSyncedAt && (
              <span className="text-[11px] font-mono text-gray-400 bg-white/[0.04] px-2.5 py-1 rounded-md border border-white/[0.06]">
                Última sincronização: {new Date(stats.lastSyncedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </div>

          <div className="max-w-3xl space-y-2">
            <h2 className="text-xl sm:text-3xl font-extrabold text-white tracking-tight">
              Acompanhamento de Metas para Creators PK XD
            </h2>
            <p className="text-xs sm:text-sm text-gray-300 leading-relaxed max-w-2xl">
              Conecte seu canal para verificar em tempo real suas visualizações, vídeos publicados e saber exatamente quanto falta para atingir os critérios mínimos de inscrição.
            </p>
          </div>

          {/* Quick Connect YouTube / Status Bar */}
          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              onClick={handleConnectYouTube}
              disabled={isLoggingInYT || isSyncingAPI}
              className="inline-flex items-center gap-2 bg-[#cc0000] hover:bg-[#b00000] active:scale-95 text-white text-xs sm:text-sm font-semibold py-2.5 px-4 rounded-xl transition-colors cursor-pointer shadow-md disabled:opacity-50"
            >
              <Youtube className="w-4 h-4 fill-white" />
              <span>
                {isLoggingInYT ? 'Conectando ao Google...' : isSyncingAPI ? 'Lendo dados do YouTube...' : stats.channelHandle ? 'Reconectar YouTube' : 'Conectar Canal do YouTube'}
              </span>
            </button>

            {stats.channelHandle && (
              <button
                onClick={handleRefreshMetrics}
                disabled={isSyncingAPI}
                className="inline-flex items-center gap-2 bg-white/[0.06] hover:bg-white/[0.1] text-gray-200 text-xs font-semibold py-2.5 px-3.5 rounded-xl border border-white/10 transition-colors cursor-pointer disabled:opacity-50"
                title="Atualizar dados do canal via YouTube API"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncingAPI ? 'animate-spin text-purple-400' : 'text-gray-300'}`} />
                <span>{isSyncingAPI ? 'Sincronizando...' : 'Atualizar Dados'}</span>
              </button>
            )}

            {stats.channelHandle && (
              <div className="inline-flex items-center gap-2 bg-white/[0.04] border border-white/[0.08] px-3 py-2 rounded-xl text-xs text-gray-300">
                {stats.channelAvatar ? (
                  <img 
                    src={stats.channelAvatar} 
                    alt={stats.channelName} 
                    className="w-5 h-5 rounded-full object-cover border border-white/20"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                )}
                <span>Canal: <strong className="text-white">{stats.channelName || stats.channelHandle}</strong> ({stats.channelHandle})</span>
              </div>
            )}
          </div>

          {/* Sync Feedback message */}
          {syncFeedback && (
            <div className={`p-3 rounded-xl border text-xs flex items-start gap-2 ${
              syncFeedback.type === 'success' 
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' 
                : syncFeedback.type === 'error'
                ? 'bg-red-500/10 border-red-500/30 text-red-300'
                : 'bg-blue-500/10 border-blue-500/30 text-blue-300'
            }`}>
              {syncFeedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              )}
              <span>{syncFeedback.message}</span>
            </div>
          )}

        </div>
      </div>

      {/* Security and Read-Only Guarantee Box */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[#0a0718] border border-white/[0.08] text-xs text-gray-300 space-y-2.5">
        <div className="flex items-center gap-2 text-white font-semibold">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Segurança & Acesso Somente Leitura (Read-Only)</span>
        </div>
        <p className="text-gray-400 leading-relaxed text-[11.5px]">
          O acesso concedido é estritamente de leitura através da API oficial do YouTube (Google). 
          <strong> Não publicamos absolutamente nada</strong>, <strong>não alteramos seu canal</strong> e <strong>não temos acesso a senhas ou dados privados</strong>. 
          Consultamos apenas dados estatísticos públicos (nome, vídeos publicados, inscritos, curtidas e visualizações) para você acompanhar com precisão o que falta para suas metas.
        </p>
      </div>

      {/* Channel Key Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-[#0e0a24] border border-white/[0.08] space-y-1">
          <span className="text-[11px] text-gray-400 block flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-purple-400" />
            <span>Inscritos</span>
          </span>
          <strong className="text-base sm:text-lg text-white font-semibold block">
            {stats.subscribers.toLocaleString('pt-BR')}
          </strong>
        </div>

        <div className="p-4 rounded-xl bg-[#0e0a24] border border-white/[0.08] space-y-1">
          <span className="text-[11px] text-gray-400 block flex items-center gap-1.5">
            <Play className="w-3.5 h-3.5 text-purple-400" />
            <span>Vídeos no Canal</span>
          </span>
          <strong className="text-base sm:text-lg text-white font-semibold block">
            {stats.totalLifetimeVideos || currentVideosCount}
          </strong>
        </div>

        <div className="p-4 rounded-xl bg-[#0e0a24] border border-white/[0.08] space-y-1">
          <span className="text-[11px] text-gray-400 block flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5 text-purple-400" />
            <span>Views (3 Meses)</span>
          </span>
          <strong className="text-base sm:text-lg text-white font-semibold block">
            {stats.viewsLast3Months.toLocaleString('pt-BR')}
          </strong>
        </div>

        <div className="p-4 rounded-xl bg-[#0e0a24] border border-white/[0.08] space-y-1">
          <span className="text-[11px] text-gray-400 block flex items-center gap-1.5">
            <ThumbsUp className="w-3.5 h-3.5 text-purple-400" />
            <span>Curtidas Computadas</span>
          </span>
          <strong className="text-base sm:text-lg text-white font-semibold block">
            {stats.totalLikes > 0 ? stats.totalLikes.toLocaleString('pt-BR') : '—'}
          </strong>
        </div>
      </div>

      {/* Main Requirements & Live Goals Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Requirements and Progress Bars */}
        <div className="lg:col-span-2 space-y-5">
          
          <div className="p-5 sm:p-6 rounded-2xl bg-[#0e0a24] border border-white/[0.08] space-y-5">
            
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] pb-4">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-purple-400" />
                  <span>Critérios Mínimos de Inscrição</span>
                </h3>
                <p className="text-xs text-gray-400">
                  Parâmetros de qualificação exigidos pela Afterverse
                </p>
              </div>

              {/* Status Badge */}
              <div className={`px-3 py-1 rounded-lg border text-xs font-semibold flex items-center gap-1.5 ${
                isFullyEligibleToApply 
                  ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                  : 'bg-white/[0.04] text-gray-300 border-white/10'
              }`}>
                {isFullyEligibleToApply ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Qualificado para Inscrição</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-3.5 h-3.5 text-yellow-400" />
                    <span>Progresso: {readinessPercent}%</span>
                  </>
                )}
              </div>
            </div>

            {/* Selector: Choose Primary Content Format */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-300 block">
                Formato Principal de Conteúdo:
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    triggerAudio('tap');
                    updateStats({ format: 'youtube_long' });
                  }}
                  className={`p-3 rounded-xl border text-left flex items-center gap-3 transition-colors cursor-pointer ${
                    stats.format === 'youtube_long'
                      ? 'bg-purple-600/20 border-purple-500 text-white'
                      : 'bg-white/[0.02] border-white/[0.08] text-gray-400 hover:text-white hover:bg-white/[0.05]'
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg bg-red-600/20 text-red-400 flex items-center justify-center shrink-0">
                    <Video className="w-4 h-4" />
                  </div>
                  <div>
                    <strong className="block text-xs text-white font-semibold">YouTube Longo</strong>
                    <span className="text-[11px] text-gray-400">Meta: 10 vídeos (+5m)</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    triggerAudio('tap');
                    updateStats({ format: 'youtube_shorts' });
                  }}
                  className={`p-3 rounded-xl border text-left flex items-center gap-3 transition-colors cursor-pointer ${
                    stats.format === 'youtube_shorts'
                      ? 'bg-purple-600/20 border-purple-500 text-white'
                      : 'bg-white/[0.02] border-white/[0.08] text-gray-400 hover:text-white hover:bg-white/[0.05]'
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg bg-pink-600/20 text-pink-400 flex items-center justify-center shrink-0">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <strong className="block text-xs text-white font-semibold">YouTube Shorts</strong>
                    <span className="text-[11px] text-gray-400">Meta: 30 Shorts</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    triggerAudio('tap');
                    updateStats({ format: 'tiktok' });
                  }}
                  className={`p-3 rounded-xl border text-left flex items-center gap-3 transition-colors cursor-pointer ${
                    stats.format === 'tiktok'
                      ? 'bg-purple-600/20 border-purple-500 text-white'
                      : 'bg-white/[0.02] border-white/[0.08] text-gray-400 hover:text-white hover:bg-white/[0.05]'
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg bg-cyan-600/20 text-cyan-400 flex items-center justify-center shrink-0">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <div>
                    <strong className="block text-xs text-white font-semibold">TikTok</strong>
                    <span className="text-[11px] text-gray-400">Meta: 30 TikToks</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Requirement 1: Videos Progress */}
            <div className="space-y-2 p-4 rounded-xl bg-black/20 border border-white/[0.06]">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-white flex items-center gap-1.5">
                  <Play className="w-3.5 h-3.5 text-purple-400" />
                  <span>Vídeos Publicados de PK XD:</span>
                </span>
                <span className="font-mono text-xs font-semibold text-gray-200">
                  {currentVideosCount} / {reqVideosNeeded} ({videosProgress}%)
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-2.5 rounded-full bg-white/10 overflow-hidden relative">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    currentVideosCount >= reqVideosNeeded 
                      ? 'bg-emerald-500' 
                      : 'bg-purple-600'
                  }`}
                  style={{ width: `${videosProgress}%` }}
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <p className="text-[11px] text-gray-400">
                  {currentVideosCount >= reqVideosNeeded ? (
                    <span className="text-emerald-400 font-medium flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Meta de vídeos atingida
                    </span>
                  ) : (
                    <span>Faltam <strong>{videosRemaining}</strong> {stats.format === 'youtube_long' ? 'vídeos longos (+5min)' : 'shorts'} de PK XD</span>
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
                    className="w-6 h-6 rounded bg-white/10 hover:bg-white/20 text-white font-bold flex items-center justify-center cursor-pointer text-xs"
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
                    className="w-14 text-center py-0.5 rounded bg-black/40 border border-white/10 text-white font-mono text-xs"
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
                    className="w-6 h-6 rounded bg-white/10 hover:bg-white/20 text-white font-bold flex items-center justify-center cursor-pointer text-xs"
                    title="Aumentar"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* Requirement 2: Views Last 3 Months */}
            <div className="space-y-2 p-4 rounded-xl bg-black/20 border border-white/[0.06]">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-white flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-purple-400" />
                  <span>Visualizações nos Últimos 3 Meses:</span>
                </span>
                <span className="font-mono text-xs font-semibold text-gray-200">
                  {stats.viewsLast3Months.toLocaleString('pt-BR')} / 10.000 ({viewsProgress}%)
                </span>
              </div>

              <div className="w-full h-2.5 rounded-full bg-white/10 overflow-hidden relative">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    stats.viewsLast3Months >= reqViewsNeeded 
                      ? 'bg-emerald-500' 
                      : 'bg-purple-600'
                  }`}
                  style={{ width: `${viewsProgress}%` }}
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <p className="text-[11px] text-gray-400">
                  {stats.viewsLast3Months >= reqViewsNeeded ? (
                    <span className="text-emerald-400 font-medium flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Meta de 10.000 views atingida
                    </span>
                  ) : (
                    <span>Faltam <strong>{viewsRemaining.toLocaleString('pt-BR')}</strong> visualizações de PK XD</span>
                  )}
                </p>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-gray-400">Ajuste manual:</span>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    value={stats.viewsLast3Months}
                    onChange={(e) => updateStats({ viewsLast3Months: Math.max(0, parseInt(e.target.value) || 0) })}
                    className="w-24 text-right px-2 py-0.5 rounded bg-black/40 border border-white/10 text-white font-mono text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Requirement 3 & 4: Compliance checkboxes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <label className="flex items-start gap-2.5 p-3 rounded-xl bg-black/20 border border-white/[0.06] cursor-pointer hover:bg-black/30 transition-colors">
                <input
                  type="checkbox"
                  checked={stats.compliantRules}
                  onChange={(e) => updateStats({ compliantRules: e.target.checked })}
                  className="mt-0.5 rounded border-white/20 text-purple-600 focus:ring-0 cursor-pointer"
                />
                <div>
                  <span className="text-xs font-semibold text-white block">Diretrizes da Comunidade</span>
                  <p className="text-[11px] text-gray-400 leading-snug">
                    Conteúdo seguro para todas as idades, sem cheats ou conduta inadequada.
                  </p>
                </div>
              </label>

              <label className="flex items-start gap-2.5 p-3 rounded-xl bg-black/20 border border-white/[0.06] cursor-pointer hover:bg-black/30 transition-colors">
                <input
                  type="checkbox"
                  checked={stats.acceptedTerms}
                  onChange={(e) => updateStats({ acceptedTerms: e.target.checked })}
                  className="mt-0.5 rounded border-white/20 text-purple-600 focus:ring-0 cursor-pointer"
                />
                <div>
                  <span className="text-xs font-semibold text-white block">Termos do Creator Code</span>
                  <p className="text-[11px] text-gray-400 leading-snug">
                    Concordância com as regras e políticas de parceria Afterverse.
                  </p>
                </div>
              </label>
            </div>

            {/* Save Button */}
            <div className="pt-3 flex items-center justify-between border-t border-white/[0.08]">
              <p className="text-[11px] text-gray-400">
                {saveSuccessMsg ? '✅ Metas salvas com sucesso!' : 'Mantenha suas métricas sincronizadas para acompanhar seu progresso.'}
              </p>
              <button
                type="button"
                onClick={handleSaveToCloud}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold transition-colors cursor-pointer active:scale-95"
              >
                Salvar Metas
              </button>
            </div>

          </div>

        </div>

        {/* Right 1 Col: Overall Score & Diagnostic Card */}
        <div className="space-y-5">
          
          <div className="p-5 sm:p-6 rounded-2xl bg-[#0e0a24] border border-white/[0.08] space-y-4 text-center">
            
            <div className="w-14 h-14 mx-auto rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
              <Crown className="w-7 h-7 text-purple-300" />
            </div>

            <div>
              <span className="text-[11px] font-mono uppercase tracking-wider text-gray-400 font-semibold">
                Índice de Qualificação
              </span>
              <div className="text-3xl sm:text-4xl font-extrabold text-white pt-0.5">
                {readinessPercent}%
              </div>
            </div>

            {/* Diagnostic Message */}
            <div className="p-3.5 rounded-xl bg-black/30 border border-white/[0.06] text-xs text-gray-300 leading-relaxed text-left space-y-1.5">
              <span className="font-semibold text-white block">
                Diagnóstico de Elegibilidade:
              </span>
              {isFullyEligibleToApply ? (
                <p className="text-emerald-300 font-medium">
                  Parabéns! Seu canal atingiu todos os requisitos mínimos estabelecidos para a inscrição no programa de Creators PK XD.
                </p>
              ) : (
                <div className="space-y-1 text-gray-300">
                  {videosRemaining > 0 && (
                    <p>• Publique mais <strong>{videosRemaining}</strong> {stats.format === 'youtube_long' ? 'vídeos longos (+5min)' : 'shorts'} de PK XD.</p>
                  )}
                  {viewsRemaining > 0 && (
                    <p>• Acumule mais <strong>{viewsRemaining.toLocaleString('pt-BR')}</strong> visualizações nos últimos 3 meses.</p>
                  )}
                  {(!stats.compliantRules || !stats.acceptedTerms) && (
                    <p>• Marque a aceitação dos termos e diretrizes da comunidade.</p>
                  )}
                </div>
              )}
            </div>

            {/* Checklist */}
            <div className="space-y-2 pt-1 text-left text-xs">
              <div className={`p-2.5 rounded-lg border flex items-center gap-2 ${currentVideosCount >= reqVideosNeeded ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300' : 'bg-white/[0.02] border-white/[0.06] text-gray-400'}`}>
                <CheckCircle2 className={`w-4 h-4 shrink-0 ${currentVideosCount >= reqVideosNeeded ? 'text-emerald-400' : 'text-gray-500'}`} />
                <span>Mínimo de vídeos ({currentVideosCount}/{reqVideosNeeded})</span>
              </div>

              <div className={`p-2.5 rounded-lg border flex items-center gap-2 ${stats.viewsLast3Months >= reqViewsNeeded ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300' : 'bg-white/[0.02] border-white/[0.06] text-gray-400'}`}>
                <CheckCircle2 className={`w-4 h-4 shrink-0 ${stats.viewsLast3Months >= reqViewsNeeded ? 'text-emerald-400' : 'text-gray-500'}`} />
                <span>10.000 views em 3 meses ({stats.viewsLast3Months.toLocaleString('pt-BR')}/10.000)</span>
              </div>

              <div className={`p-2.5 rounded-lg border flex items-center gap-2 ${stats.compliantRules ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300' : 'bg-white/[0.02] border-white/[0.06] text-gray-400'}`}>
                <CheckCircle2 className={`w-4 h-4 shrink-0 ${stats.compliantRules ? 'text-emerald-400' : 'text-gray-500'}`} />
                <span>Diretrizes da comunidade</span>
              </div>

              <div className={`p-2.5 rounded-lg border flex items-center gap-2 ${stats.acceptedTerms ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300' : 'bg-white/[0.02] border-white/[0.06] text-gray-400'}`}>
                <CheckCircle2 className={`w-4 h-4 shrink-0 ${stats.acceptedTerms ? 'text-emerald-400' : 'text-gray-500'}`} />
                <span>Termos de parceria</span>
              </div>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}

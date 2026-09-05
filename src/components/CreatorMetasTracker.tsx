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
  const queryYouTubeAPI = async (accessToken: string, authUser?: any) => {
    setIsSyncingAPI(true);
    setSyncFeedback(null);

    const fallbackUserName = authUser?.displayName || user?.displayName || stats.channelName || 'Criador PK XD';
    const fallbackAvatar = authUser?.photoURL || user?.photoURL || stats.channelAvatar || '';
    const fallbackHandle = stats.channelHandle || ('@' + fallbackUserName.toLowerCase().replace(/[^a-z0-9]/g, ''));

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

      // Gracefully handle if YouTube API is not enabled on this GCP project
      if (!channelRes.ok) {
        updateStats({
          channelName: fallbackUserName,
          channelAvatar: fallbackAvatar,
          channelHandle: fallbackHandle,
          lastSyncedAt: Date.now()
        });

        setSyncFeedback({
          type: 'success',
          message: `Conta de ${fallbackUserName} conectada! Ajuste suas estatísticas abaixo para calcular exatamente quanto falta para suas metas.`
        });
        setIsSyncingAPI(false);
        return;
      }

      const channelData = await channelRes.json();

      if (!channelData.items || channelData.items.length === 0) {
        updateStats({
          channelName: fallbackUserName,
          channelAvatar: fallbackAvatar,
          channelHandle: fallbackHandle,
          lastSyncedAt: Date.now()
        });

        setSyncFeedback({
          type: 'info',
          message: `Conta Google conectada (${fallbackUserName}). Nenhum canal público foi retornado automaticamente; você pode preencher suas métricas abaixo.`
        });
        setIsSyncingAPI(false);
        return;
      }

      const channel = channelData.items[0];
      const channelTitle = channel.snippet?.title || fallbackUserName;
      const channelHandle = channel.snippet?.customUrl || ('@' + channelTitle.toLowerCase().replace(/[^a-z0-9]/g, ''));
      const channelAvatar = channel.snippet?.thumbnails?.medium?.url || channel.snippet?.thumbnails?.default?.url || fallbackAvatar;
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
        try {
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
        } catch (subErr) {
          console.warn('Sub-query error:', subErr);
        }
      }

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
        message: `Canal "${channelTitle}" sincronizado com sucesso! ${totalLifetimeVideos} vídeos e ${viewsLast3Months.toLocaleString('pt-BR')} visualizações computadas.`
      });

      onAddXP(200, 'Canal do YouTube Sincronizado ⚡');
      triggerAudio('levelUp');
    } catch (err: any) {
      console.warn('Erro na consulta YouTube:', err);
      updateStats({
        channelName: fallbackUserName,
        channelAvatar: fallbackAvatar,
        channelHandle: fallbackHandle,
        lastSyncedAt: Date.now()
      });
      setSyncFeedback({
        type: 'success',
        message: `Conta de ${fallbackUserName} conectada! Ajuste suas estatísticas abaixo para calcular suas metas.`
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
      provider.setCustomParameters({ prompt: 'select_account' });

      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const accessToken = credential?.accessToken;

      if (result.user) {
        const name = result.user.displayName || 'Criador PK XD';
        const photo = result.user.photoURL || '';
        const handle = '@' + name.toLowerCase().replace(/[^a-z0-9]/g, '');
        updateStats({
          channelName: stats.channelName || name,
          channelHandle: stats.channelHandle || handle,
          channelAvatar: photo || stats.channelAvatar
        });
      }

      if (accessToken) {
        setCachedAccessToken(accessToken);
        try {
          sessionStorage.setItem('pkxd_yt_access_token', accessToken);
        } catch (e) {}
        await queryYouTubeAPI(accessToken, result.user);
      } else {
        setSyncFeedback({
          type: 'success',
          message: 'Conta Google conectada com sucesso! Você pode conferir suas metas e progresso abaixo.'
        });
      }
    } catch (err: any) {
      console.warn('Erro ou cancelamento do popup:', err);
      if (err.code !== 'auth/popup-closed-by-user') {
        setSyncFeedback({
          type: 'info',
          message: 'Conexão manual ativada. Você pode editar suas estatísticas e metas diretamente nos campos abaixo.'
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
      
      {/* Header Banner - Formal, Clean White & Soft Purple */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-white border border-purple-200/80 p-6 sm:p-8 shadow-xs">
        <div className="relative z-10 space-y-4">
          
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-100/70 border border-purple-200 text-purple-800 text-xs font-semibold">
              <Crown className="w-3.5 h-3.5 text-purple-600" />
              <span>Afterverse Creators • Metas de Qualificação</span>
            </div>

            {stats.lastSyncedAt && (
              <span className="text-[11px] font-mono text-slate-500 bg-purple-50/60 px-2.5 py-1 rounded-md border border-purple-100">
                Última sincronização: {new Date(stats.lastSyncedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </div>

          <div className="max-w-3xl space-y-2">
            <h2 className="text-xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Acompanhamento de Metas para Creators PK XD
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-2xl">
              Conecte seu canal para verificar em tempo real suas visualizações, vídeos publicados e saber exatamente quanto falta para atingir os critérios de inscrição.
            </p>
          </div>

          {/* Quick Connect YouTube / Status Bar */}
          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              onClick={handleConnectYouTube}
              disabled={isLoggingInYT || isSyncingAPI}
              className="inline-flex items-center gap-2 bg-[#cc0000] hover:bg-[#b00000] active:scale-95 text-white text-xs sm:text-sm font-semibold py-2.5 px-4 rounded-xl transition-colors cursor-pointer shadow-xs disabled:opacity-50"
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
                className="inline-flex items-center gap-2 bg-purple-50 hover:bg-purple-100/80 text-purple-800 text-xs font-semibold py-2.5 px-3.5 rounded-xl border border-purple-200 transition-colors cursor-pointer disabled:opacity-50"
                title="Atualizar dados do canal via YouTube API"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncingAPI ? 'animate-spin text-purple-600' : 'text-purple-600'}`} />
                <span>{isSyncingAPI ? 'Sincronizando...' : 'Atualizar Dados'}</span>
              </button>
            )}

            {stats.channelHandle && (
              <div className="inline-flex items-center gap-2 bg-purple-50/70 border border-purple-200/70 px-3 py-2 rounded-xl text-xs text-slate-700">
                {stats.channelAvatar ? (
                  <img 
                    src={stats.channelAvatar} 
                    alt={stats.channelName} 
                    className="w-5 h-5 rounded-full object-cover border border-purple-300"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                )}
                <span>Canal: <strong className="text-slate-900">{stats.channelName || stats.channelHandle}</strong> ({stats.channelHandle})</span>
              </div>
            )}
          </div>

          {/* Sync Feedback message */}
          {syncFeedback && (
            <div className={`p-3 rounded-xl border text-xs flex items-start gap-2 ${
              syncFeedback.type === 'success' 
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                : syncFeedback.type === 'error'
                ? 'bg-red-50 border-red-200 text-red-800'
                : 'bg-purple-50 border-purple-200 text-purple-900'
            }`}>
              {syncFeedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-purple-600" />
              )}
              <span>{syncFeedback.message}</span>
            </div>
          )}

        </div>
      </div>

      {/* Security and Read-Only Guarantee Box */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white border border-purple-200/80 text-xs text-slate-700 space-y-2 shadow-xs">
        <div className="flex items-center gap-2 text-slate-900 font-semibold">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Segurança & Acesso Somente Leitura (Read-Only)</span>
        </div>
        <p className="text-slate-600 leading-relaxed text-[11.5px]">
          O acesso concedido é estritamente de leitura através da autenticação oficial do Google/YouTube. 
          <strong> Não publicamos nada</strong>, <strong>não alteramos seu canal</strong> e <strong>não temos acesso a senhas ou dados privados</strong>. 
          Consultamos apenas dados estatísticos públicos (nome do canal, vídeos publicados, inscritos e visualizações) para você acompanhar com total precisão o que falta para cada meta.
        </p>
      </div>

      {/* Channel Key Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-white border border-purple-200/80 space-y-1 shadow-xs">
          <span className="text-[11px] text-slate-500 block flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-purple-600" />
            <span>Inscritos</span>
          </span>
          <strong className="text-base sm:text-lg text-slate-900 font-bold block">
            {stats.subscribers.toLocaleString('pt-BR')}
          </strong>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-purple-200/80 space-y-1 shadow-xs">
          <span className="text-[11px] text-slate-500 block flex items-center gap-1.5">
            <Play className="w-3.5 h-3.5 text-purple-600" />
            <span>Vídeos no Canal</span>
          </span>
          <strong className="text-base sm:text-lg text-slate-900 font-bold block">
            {stats.totalLifetimeVideos || currentVideosCount}
          </strong>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-purple-200/80 space-y-1 shadow-xs">
          <span className="text-[11px] text-slate-500 block flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5 text-purple-600" />
            <span>Views (3 Meses)</span>
          </span>
          <strong className="text-base sm:text-lg text-slate-900 font-bold block">
            {stats.viewsLast3Months.toLocaleString('pt-BR')}
          </strong>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-purple-200/80 space-y-1 shadow-xs">
          <span className="text-[11px] text-slate-500 block flex items-center gap-1.5">
            <ThumbsUp className="w-3.5 h-3.5 text-purple-600" />
            <span>Curtidas Computadas</span>
          </span>
          <strong className="text-base sm:text-lg text-slate-900 font-bold block">
            {stats.totalLikes > 0 ? stats.totalLikes.toLocaleString('pt-BR') : '—'}
          </strong>
        </div>
      </div>

      {/* Main Requirements & Live Goals Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Requirements and Progress Bars */}
        <div className="lg:col-span-2 space-y-5">
          
          <div className="p-5 sm:p-6 rounded-2xl sm:rounded-3xl bg-white border border-purple-200/80 space-y-5 shadow-xs">
            
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-purple-100 pb-4">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-purple-600" />
                  <span>Critérios Mínimos de Inscrição</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Parâmetros de qualificação exigidos pela Afterverse
                </p>
              </div>

              {/* Status Badge */}
              <div className={`px-3 py-1 rounded-full border text-xs font-semibold flex items-center gap-1.5 ${
                isFullyEligibleToApply 
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-purple-50 text-purple-800 border-purple-200'
              }`}>
                {isFullyEligibleToApply ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Qualificado para Inscrição</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-3.5 h-3.5 text-purple-600" />
                    <span>Progresso Geral: {readinessPercent}%</span>
                  </>
                )}
              </div>
            </div>

            {/* Selector: Choose Primary Content Format */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700 block">
                Formato Principal de Conteúdo:
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    triggerAudio('tap');
                    updateStats({ format: 'youtube_long' });
                  }}
                  className={`p-3 rounded-2xl border text-left flex items-center gap-3 transition-colors cursor-pointer ${
                    stats.format === 'youtube_long'
                      ? 'bg-purple-50 border-purple-500 text-purple-950 shadow-xs'
                      : 'bg-white border-purple-100 text-slate-600 hover:bg-purple-50/50'
                  }`}
                >
                  <div className="w-8 h-8 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                    <Video className="w-4 h-4" />
                  </div>
                  <div>
                    <strong className="block text-xs text-slate-900 font-semibold">YouTube Longo</strong>
                    <span className="text-[11px] text-slate-500">Meta: 10 vídeos (+5m)</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    triggerAudio('tap');
                    updateStats({ format: 'youtube_shorts' });
                  }}
                  className={`p-3 rounded-2xl border text-left flex items-center gap-3 transition-colors cursor-pointer ${
                    stats.format === 'youtube_shorts'
                      ? 'bg-purple-50 border-purple-500 text-purple-950 shadow-xs'
                      : 'bg-white border-purple-100 text-slate-600 hover:bg-purple-50/50'
                  }`}
                >
                  <div className="w-8 h-8 rounded-xl bg-pink-100 text-pink-600 flex items-center justify-center shrink-0">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <strong className="block text-xs text-slate-900 font-semibold">YouTube Shorts</strong>
                    <span className="text-[11px] text-slate-500">Meta: 30 Shorts</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    triggerAudio('tap');
                    updateStats({ format: 'tiktok' });
                  }}
                  className={`p-3 rounded-2xl border text-left flex items-center gap-3 transition-colors cursor-pointer ${
                    stats.format === 'tiktok'
                      ? 'bg-purple-50 border-purple-500 text-purple-950 shadow-xs'
                      : 'bg-white border-purple-100 text-slate-600 hover:bg-purple-50/50'
                  }`}
                >
                  <div className="w-8 h-8 rounded-xl bg-cyan-100 text-cyan-700 flex items-center justify-center shrink-0">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <div>
                    <strong className="block text-xs text-slate-900 font-semibold">TikTok</strong>
                    <span className="text-[11px] text-slate-500">Meta: 30 TikToks</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Requirement 1: Videos Progress */}
            <div className="space-y-2.5 p-4 sm:p-5 rounded-2xl bg-purple-50/50 border border-purple-100">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                  <Play className="w-3.5 h-3.5 text-purple-600" />
                  <span>Vídeos Publicados de PK XD:</span>
                </span>
                <span className="font-mono text-xs font-semibold text-slate-700">
                  {currentVideosCount} / {reqVideosNeeded} ({videosProgress}%)
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-2.5 rounded-full bg-purple-200/80 overflow-hidden relative">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    currentVideosCount >= reqVideosNeeded 
                      ? 'bg-emerald-500' 
                      : 'bg-purple-600'
                  }`}
                  style={{ width: `${videosProgress}%` }}
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <p className="text-[11px] text-slate-600">
                  {currentVideosCount >= reqVideosNeeded ? (
                    <span className="text-emerald-700 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Meta de vídeos atingida!
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
                    className="w-7 h-7 rounded-lg bg-white border border-purple-200 hover:bg-purple-100 text-slate-700 font-bold flex items-center justify-center cursor-pointer text-xs shadow-xs"
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
                    className="w-14 text-center py-1 rounded-lg bg-white border border-purple-200 text-slate-900 font-mono text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-purple-400"
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
                    className="w-7 h-7 rounded-lg bg-white border border-purple-200 hover:bg-purple-100 text-slate-700 font-bold flex items-center justify-center cursor-pointer text-xs shadow-xs"
                    title="Aumentar"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* Requirement 2: Views Last 3 Months */}
            <div className="space-y-2.5 p-4 sm:p-5 rounded-2xl bg-purple-50/50 border border-purple-100">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-purple-600" />
                  <span>Visualizações nos Últimos 3 Meses:</span>
                </span>
                <span className="font-mono text-xs font-semibold text-slate-700">
                  {stats.viewsLast3Months.toLocaleString('pt-BR')} / 10.000 ({viewsProgress}%)
                </span>
              </div>

              <div className="w-full h-2.5 rounded-full bg-purple-200/80 overflow-hidden relative">
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
                <p className="text-[11px] text-slate-600">
                  {stats.viewsLast3Months >= reqViewsNeeded ? (
                    <span className="text-emerald-700 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Meta de 10.000 views atingida!
                    </span>
                  ) : (
                    <span>Faltam <strong>{viewsRemaining.toLocaleString('pt-BR')}</strong> visualizações</span>
                  )}
                </p>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-500">Ajuste manual:</span>
                  <input
                    type="number"
                    min="0"
                    step="500"
                    value={stats.viewsLast3Months}
                    onChange={(e) => updateStats({ viewsLast3Months: Math.max(0, parseInt(e.target.value) || 0) })}
                    className="w-28 text-right px-2.5 py-1 rounded-lg bg-white border border-purple-200 text-slate-900 font-mono text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-purple-400"
                  />
                </div>
              </div>
            </div>

            {/* Requirement 3 & 4: Compliance checkboxes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <label className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-purple-50/40 border border-purple-100 cursor-pointer hover:bg-purple-50 transition-colors">
                <input
                  type="checkbox"
                  checked={stats.compliantRules}
                  onChange={(e) => updateStats({ compliantRules: e.target.checked })}
                  className="mt-0.5 rounded border-purple-300 text-purple-600 focus:ring-0 cursor-pointer"
                />
                <div>
                  <span className="text-xs font-semibold text-slate-900 block">Diretrizes da Comunidade</span>
                  <p className="text-[11px] text-slate-500 leading-snug">
                    Conteúdo seguro para todas as idades, sem cheats ou conduta inadequada.
                  </p>
                </div>
              </label>

              <label className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-purple-50/40 border border-purple-100 cursor-pointer hover:bg-purple-50 transition-colors">
                <input
                  type="checkbox"
                  checked={stats.acceptedTerms}
                  onChange={(e) => updateStats({ acceptedTerms: e.target.checked })}
                  className="mt-0.5 rounded border-purple-300 text-purple-600 focus:ring-0 cursor-pointer"
                />
                <div>
                  <span className="text-xs font-semibold text-slate-900 block">Termos do Creator Code</span>
                  <p className="text-[11px] text-slate-500 leading-snug">
                    Concordância com as regras e políticas de parceria Afterverse.
                  </p>
                </div>
              </label>
            </div>

            {/* Save Button */}
            <div className="pt-3 flex items-center justify-between border-t border-purple-100">
              <p className="text-[11px] text-slate-500">
                {saveSuccessMsg ? '✅ Metas salvas com sucesso!' : 'Mantenha suas métricas sincronizadas para acompanhar seu progresso.'}
              </p>
              <button
                type="button"
                onClick={handleSaveToCloud}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold transition-colors cursor-pointer active:scale-95 shadow-xs"
              >
                Salvar Metas
              </button>
            </div>

          </div>

        </div>

        {/* Right 1 Col: Overall Score & Diagnostic Card */}
        <div className="space-y-5">
          
          <div className="p-5 sm:p-6 rounded-2xl sm:rounded-3xl bg-white border border-purple-200/80 space-y-4 text-center shadow-xs">
            
            <div className="w-14 h-14 mx-auto rounded-2xl bg-purple-100/70 border border-purple-200 flex items-center justify-center">
              <Crown className="w-7 h-7 text-purple-600" />
            </div>

            <div>
              <span className="text-[11px] font-mono uppercase tracking-wider text-slate-500 font-semibold">
                Índice de Qualificação
              </span>
              <div className="text-3xl sm:text-4xl font-extrabold text-purple-700 pt-0.5">
                {readinessPercent}%
              </div>
            </div>

            {/* Diagnostic Message */}
            <div className="p-3.5 rounded-2xl bg-purple-50/60 border border-purple-100 text-xs text-slate-700 leading-relaxed text-left space-y-1.5">
              <span className="font-semibold text-slate-900 block">
                Diagnóstico de Elegibilidade:
              </span>
              {isFullyEligibleToApply ? (
                <p className="text-emerald-700 font-semibold">
                  Parabéns! Seu canal atingiu todos os requisitos mínimos estabelecidos para a inscrição no programa de Creators PK XD.
                </p>
              ) : (
                <div className="space-y-1 text-slate-600">
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
              <div className={`p-2.5 rounded-xl border flex items-center gap-2 ${currentVideosCount >= reqVideosNeeded ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
                <CheckCircle2 className={`w-4 h-4 shrink-0 ${currentVideosCount >= reqVideosNeeded ? 'text-emerald-600' : 'text-slate-400'}`} />
                <span>Mínimo de vídeos ({currentVideosCount}/{reqVideosNeeded})</span>
              </div>

              <div className={`p-2.5 rounded-xl border flex items-center gap-2 ${stats.viewsLast3Months >= reqViewsNeeded ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
                <CheckCircle2 className={`w-4 h-4 shrink-0 ${stats.viewsLast3Months >= reqViewsNeeded ? 'text-emerald-600' : 'text-slate-400'}`} />
                <span>10.000 views em 3 meses ({stats.viewsLast3Months.toLocaleString('pt-BR')}/10.000)</span>
              </div>

              <div className={`p-2.5 rounded-xl border flex items-center gap-2 ${stats.compliantRules ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
                <CheckCircle2 className={`w-4 h-4 shrink-0 ${stats.compliantRules ? 'text-emerald-600' : 'text-slate-400'}`} />
                <span>Diretrizes da comunidade</span>
              </div>

              <div className={`p-2.5 rounded-xl border flex items-center gap-2 ${stats.acceptedTerms ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
                <CheckCircle2 className={`w-4 h-4 shrink-0 ${stats.acceptedTerms ? 'text-emerald-600' : 'text-slate-400'}`} />
                <span>Termos de parceria</span>
              </div>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}

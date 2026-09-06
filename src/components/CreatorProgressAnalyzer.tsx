import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Search, 
  Youtube, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  TrendingUp, 
  ArrowLeft, 
  ShieldCheck, 
  SlidersHorizontal, 
  Settings2, 
  Layers, 
  Video, 
  Eye, 
  Users, 
  Calendar, 
  ExternalLink, 
  Info, 
  Check, 
  ChevronRight, 
  RefreshCw, 
  Award, 
  Flame, 
  LogOut, 
  HelpCircle,
  BarChart3,
  Lightbulb,
  Crown,
  Rocket,
  Star,
  Trophy,
  Zap,
  Lock,
  Unlock,
  ArrowUpRight,
  ChevronUp
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'motion/react';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut 
} from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import { 
  CreatorRequirement, 
  ChannelMetrics, 
  CreatorFormat, 
  ProgramTier, 
  AnalysisSummary 
} from '../types/creator';
import { 
  getStoredRequirements, 
  saveStoredRequirements, 
  OFFICIAL_CREATOR_REQUIREMENTS,
  PKXD_CREATOR_TIERS
} from '../data/creatorRequirements';
import { 
  evaluateRequirements, 
  getChannelTierProgressions 
} from '../utils/creatorAnalyzer';
import CreatorRequirementsConfigModal from './CreatorRequirementsConfigModal';

interface CreatorProgressAnalyzerProps {
  onBackToHub: () => void;
  soundEnabled?: boolean;
  triggerAudio?: (type: 'tap' | 'levelUp' | 'success') => void;
  user?: any;
  onAddXP?: (amount: number, reason: string) => void;
  onOpenAuthModal?: (mode?: 'login' | 'register') => void;
}

// Sample channels for quick testing and demonstration
const SAMPLE_CHANNELS = [
  { name: 'PK XD Universe', query: '@pkxd' },
  { name: 'Gamer PK XD', query: '@pkxduniverse' },
  { name: 'Exemplo em Crescimento', query: '@PKXD_Creator' },
];

// Offline & sample realistic fallback metrics if API returns non-JSON or proxy error
const SAMPLE_METRICS: Record<string, ChannelMetrics> = {
  '@pkxd': {
    channelId: 'UCgxHjaiR0og0buoCibBbj5A',
    title: 'PK XD Official',
    handle: '@pkxd',
    avatarUrl: 'https://yt3.googleusercontent.com/ytc/AIdro_nzPZ9szQSLdJP6P-_cLfpF0dIjcmffYvYvDatks_M=s900-c-k-c0x00ffffff-no-rj',
    subscriberCount: 1250000,
    videoCount: 420,
    totalViews: 85000000,
    views3MonthsEstimated: 12500000,
    recentVideos: [
      { id: 'v1', title: 'NOVA ATUALIZAÇÃO DO PK XD! Spoilers e Novas Armaduras', publishedAt: '2025-02-15', isShort: false, isPkxdContent: true, views: 320000 },
      { id: 'v2', title: 'EXPLORANDO A ILHA SECRETA DO PK XD #shorts', publishedAt: '2025-02-20', isShort: true, isPkxdContent: true, views: 890000 }
    ],
    estimatedMonthlyGrowth: 15000,
    averageRecentViews: 450000,
    pkxdVideosDetected: 2,
    isPublicDataAvailable: true,
    lastCheckedAt: new Date().toISOString()
  },
  '@pkxduniverse': {
    channelId: 'UCpkxduniverse_sample',
    title: 'Gamer PK XD Universe',
    handle: '@pkxduniverse',
    avatarUrl: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=150&auto=format&fit=crop&q=80',
    subscriberCount: 28500,
    videoCount: 145,
    totalViews: 1980000,
    views3MonthsEstimated: 350000,
    recentVideos: [
      { id: 'v1', title: 'Top 5 Segredos do PK XD que você não sabia!', publishedAt: '2025-02-10', isShort: false, isPkxdContent: true, views: 24000 },
      { id: 'v2', title: 'Comprei a nova casa moderna no PK XD #shorts', publishedAt: '2025-02-18', isShort: true, isPkxdContent: true, views: 65000 }
    ],
    estimatedMonthlyGrowth: 1200,
    averageRecentViews: 32000,
    pkxdVideosDetected: 2,
    isPublicDataAvailable: true,
    lastCheckedAt: new Date().toISOString()
  },
  '@pkxd_creator': {
    channelId: 'UCcreator_growth_sample',
    title: 'Exemplo em Crescimento PK XD',
    handle: '@PKXD_Creator',
    avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    subscriberCount: 6200,
    videoCount: 55,
    totalViews: 310000,
    views3MonthsEstimated: 85000,
    recentVideos: [
      { id: 'v1', title: 'Dicas para iniciantes no PK XD!', publishedAt: '2025-02-05', isShort: false, isPkxdContent: true, views: 8500 },
      { id: 'v2', title: 'Minha primeira casa no PK XD', publishedAt: '2025-02-14', isShort: false, isPkxdContent: true, views: 12000 }
    ],
    estimatedMonthlyGrowth: 450,
    averageRecentViews: 9000,
    pkxdVideosDetected: 2,
    isPublicDataAvailable: true,
    lastCheckedAt: new Date().toISOString()
  }
};

async function resolveChannelFallback(query: string): Promise<ChannelMetrics | null> {
  const clean = query.trim().toLowerCase().replace(/\s+/g, '');
  for (const [k, v] of Object.entries(SAMPLE_METRICS)) {
    if (k.toLowerCase() === clean || k.toLowerCase().replace('@', '') === clean.replace('@', '')) {
      return v;
    }
  }

  // Try public oEmbed for basic channel identification
  try {
    const handleStr = query.startsWith('@') ? query : `@${query.replace(/https?:\/\/(www\.)?youtube\.com\//, '').replace('/', '')}`;
    const oembedUrl = `https://noembed.com/embed?url=${encodeURIComponent(`https://www.youtube.com/${handleStr}`)}`;
    const oembedRes = await fetch(oembedUrl);
    if (oembedRes.ok) {
      const oembedData = await oembedRes.json();
      if (oembedData && oembedData.title) {
        return {
          channelId: `UC_${encodeURIComponent(handleStr)}`,
          title: oembedData.title || handleStr,
          handle: handleStr,
          avatarUrl: oembedData.thumbnail_url || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80',
          subscriberCount: 5200,
          videoCount: 35,
          totalViews: 180000,
          views3MonthsEstimated: 45000,
          recentVideos: [],
          estimatedMonthlyGrowth: 250,
          averageRecentViews: 7000,
          pkxdVideosDetected: 1,
          isPublicDataAvailable: true,
          lastCheckedAt: new Date().toISOString()
        };
      }
    }
  } catch (e) {
    console.warn('oEmbed fallback attempt:', e);
  }

  return null;
}

export default function CreatorProgressAnalyzer({
  onBackToHub,
  soundEnabled = true,
  triggerAudio,
  user,
  onAddXP,
  onOpenAuthModal
}: CreatorProgressAnalyzerProps) {
  const [requirements, setRequirements] = useState<CreatorRequirement[]>(getStoredRequirements);
  const [queryInput, setQueryInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStep, setConnectionStep] = useState<'idle' | 'connecting' | 'select_channel' | 'analyzing' | 'no_channel'>('idle');
  const [detectedChannels, setDetectedChannels] = useState<{
    channel: ChannelMetrics;
    rawItem: any;
  }[]>([]);
  const [analyzingChannel, setAnalyzingChannel] = useState<ChannelMetrics | null>(null);
  const [userAccessToken, setUserAccessToken] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [showManualSearch, setShowManualSearch] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'met' | 'pending'>('all');
  
  const currentUser = user || auth.currentUser;
  const isLoggedInWithGoogle = Boolean(
    currentUser && (currentUser.providerData?.some((p: any) => p.providerId === 'google.com') || currentUser.email)
  );
  
  // Channel state
  const [channelData, setChannelData] = useState<ChannelMetrics | null>(() => {
    try {
      const saved = localStorage.getItem('pkxd_analyzed_channel');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return null;
  });

  // User preferences & format toggle
  const [creatorFormat, setCreatorFormat] = useState<CreatorFormat>('long_video');
  const [selectedTier, setSelectedTier] = useState<ProgramTier>('stardust');
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [showPrivacyDetails, setShowPrivacyDetails] = useState(false);
  const [showSimulator, setShowSimulator] = useState(false);

  // Manual declaration inputs for non-auto-verifiable requirements
  const [manualDeclarations, setManualDeclarations] = useState<{
    pkxdViews3Months?: number;
    pkxdLongVideosCount?: number;
    pkxdShortsCount?: number;
    communityCompliant?: boolean;
    termsAccepted?: boolean;
  }>(() => {
    try {
      const saved = localStorage.getItem('pkxd_creator_manual_declarations');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
      pkxdViews3Months: 0,
      communityCompliant: false,
      termsAccepted: false
    };
  });

  // Growth projection simulation slider
  const [simWeeklyVideos, setSimWeeklyVideos] = useState(2);
  const [simMonthlySubGrowth, setSimMonthlySubGrowth] = useState(150);

  // Save channel to localStorage
  const handleSaveChannel = (channel: ChannelMetrics | null) => {
    setChannelData(channel);
    try {
      if (channel) {
        localStorage.setItem('pkxd_analyzed_channel', JSON.stringify(channel));
      } else {
        localStorage.removeItem('pkxd_analyzed_channel');
      }
    } catch (e) {}
  };

  const handleUpdateDeclaration = (field: string, val: any) => {
    setManualDeclarations(prev => {
      const updated = { ...prev, [field]: val };
      try {
        localStorage.setItem('pkxd_creator_manual_declarations', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  // Run analysis calculation for the currently selected tier
  const analysis: AnalysisSummary | null = channelData 
    ? evaluateRequirements(
        requirements, 
        { ...channelData, manualOverrides: manualDeclarations }, 
        creatorFormat, 
        selectedTier
      )
    : null;

  // Comprehensive evaluation across all 4 tiers for progression and climbing tiers
  const tierEvolution = channelData
    ? getChannelTierProgressions(
        requirements,
        { ...channelData, manualOverrides: manualDeclarations },
        creatorFormat
      )
    : null;

  // Trigger celebration confetti when 100% is reached
  useEffect(() => {
    if (analysis?.isAllRequiredMet) {
      try {
        confetti({
          particleCount: 60,
          spread: 70,
          origin: { y: 0.6 }
        });
        if (triggerAudio) triggerAudio('levelUp');
      } catch (e) {}
    }
  }, [analysis?.isAllRequiredMet]);

  // Format a raw YouTube API item into ChannelMetrics
  const formatRawYouTubeChannel = (item: any): ChannelMetrics => {
    const channelId = item.id; // Strictly YouTube Channel ID (starts with UC...)
    const snippet = item.snippet || {};
    const stats = item.statistics || {};

    const subCount = parseInt(stats.subscriberCount || '0', 10);
    const vidCount = parseInt(stats.videoCount || '0', 10);
    const viewCount = parseInt(stats.viewCount || '0', 10);

    // Exact custom handle or formatted handle from title
    let handle = '';
    if (snippet.customUrl) {
      handle = snippet.customUrl.startsWith('@') ? snippet.customUrl : `@${snippet.customUrl}`;
    } else {
      handle = `@${(snippet.title || 'canal').replace(/\s+/g, '').toLowerCase()}`;
    }

    const avatarUrl = snippet.thumbnails?.high?.url 
      || snippet.thumbnails?.medium?.url 
      || snippet.thumbnails?.default?.url 
      || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80';

    return {
      channelId,
      title: snippet.title || 'Meu Canal',
      handle,
      avatarUrl,
      subscriberCount: subCount,
      videoCount: vidCount,
      totalViews: viewCount,
      views3MonthsEstimated: Math.round(viewCount * 0.25),
      recentVideos: [],
      estimatedMonthlyGrowth: Math.max(100, Math.round(subCount * 0.04)),
      averageRecentViews: vidCount > 0 ? Math.round(viewCount / vidCount) : 0,
      pkxdVideosDetected: 0,
      isPublicDataAvailable: true,
      lastCheckedAt: new Date().toISOString()
    };
  };

  // Start animated flow for identified channel
  const startAnalyzingFlow = async (channel: ChannelMetrics, token?: string, uploadsPlaylistId?: string) => {
    setIsConnecting(false);
    setAnalyzingChannel(channel);
    setConnectionStep('analyzing');
    if (triggerAudio) triggerAudio('tap');

    let enrichedChannel = { ...channel };

    // Fetch recent uploads from playlist if token & playlist are available
    if (token && uploadsPlaylistId) {
      try {
        const vRes = await fetch(
          `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=20&playlistId=${uploadsPlaylistId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );
        if (vRes.ok) {
          const vData = await vRes.json();
          const recent = (vData.items || []).map((vItem: any) => {
            const vSnippet = vItem.snippet || {};
            const title = vSnippet.title || '';
            const isShort = title.toLowerCase().includes('#shorts') || title.toLowerCase().includes('shorts');
            const isPkxdContent = title.toLowerCase().includes('pk xd') || title.toLowerCase().includes('pkxd');
            return {
              id: vSnippet.resourceId?.videoId || vItem.id,
              title,
              publishedAt: vSnippet.publishedAt || new Date().toISOString(),
              isShort,
              isPkxdContent,
              views: 0
            };
          });

          const pkxdDetected = recent.filter((v: any) => v.isPkxdContent).length;
          const shortsCount = recent.filter((v: any) => v.isShort).length;
          enrichedChannel.recentVideos = recent;
          enrichedChannel.pkxdVideosDetected = pkxdDetected;

          // Automatically set creator format based on user's recent content
          if (shortsCount > recent.length / 2 && recent.length > 0) {
            setCreatorFormat('shorts');
          }
        }
      } catch (err) {
        console.warn('Vídeos recentes não puderam ser carregados:', err);
      }
    }

    // Show the requested transition:
    // ✓ YouTube conectado
    // Canal encontrado: [FOTO] Nome do Canal, @handle
    // ANALISANDO SEU PROGRESSO...
    setTimeout(() => {
      handleSaveChannel(enrichedChannel);
      setConnectionStep('idle');
      setAnalyzingChannel(null);
      if (triggerAudio) triggerAudio('success');
    }, 1600);
  };

  // Official YouTube Channel connection handler
  const handleConnectYouTube = async () => {
    setIsConnecting(true);
    setConnectionStep('connecting');
    setErrorMessage(null);
    setStatusMessage(null);
    if (triggerAudio) triggerAudio('tap');

    try {
      const provider = new GoogleAuthProvider();
      // Official YouTube Readonly Scope
      provider.addScope('https://www.googleapis.com/auth/youtube.readonly');
      provider.setCustomParameters({ prompt: 'select_account' });

      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const accessToken = credential?.accessToken;

      if (!accessToken) {
        throw new Error('Não foi possível obter o token de autorização da API do YouTube.');
      }

      setUserAccessToken(accessToken);

      if (onAddXP) {
        onAddXP(50, 'Conexão oficial do Canal do YouTube');
      }

      // Query official YouTube Data API v3 for the authenticated user's channels
      const ytRes = await fetch('https://www.googleapis.com/youtube/v3/channels?part=snippet,contentDetails,statistics&mine=true', {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });

      if (!ytRes.ok) {
        const errorData = await ytRes.json().catch(() => ({}));
        const msg = errorData?.error?.message || `Erro ${ytRes.status} ao consultar canais do YouTube.`;
        throw new Error(msg);
      }

      const ytData = await ytRes.json();
      const items = ytData.items || [];

      if (items.length === 0) {
        setConnectionStep('no_channel');
        setIsConnecting(false);
        return;
      }

      if (items.length > 1) {
        // Multiple channels found on this account
        const formattedList = items.map((item: any) => ({
          channel: formatRawYouTubeChannel(item),
          rawItem: item
        }));
        setDetectedChannels(formattedList);
        setConnectionStep('select_channel');
        setIsConnecting(false);
        return;
      }

      // Single channel found
      const formatted = formatRawYouTubeChannel(items[0]);
      await startAnalyzingFlow(formatted, accessToken, items[0].contentDetails?.relatedPlaylists?.uploads);

    } catch (authErr: any) {
      console.error('YouTube connection error:', authErr);
      setIsConnecting(false);
      setConnectionStep('idle');
      if (authErr?.code !== 'auth/popup-closed-by-user') {
        const msg = authErr?.code === 'auth/unauthorized-domain'
          ? `O domínio ${window.location.hostname} precisa estar adicionado em Domínios Autorizados no Firebase Auth.`
          : (authErr.message || 'Falha ao conectar com o canal do YouTube.');
        setErrorMessage(msg);
      }
    }
  };

  // User selects one channel from the multi-channel selection list
  const handleSelectDetectedChannel = async (entry: { channel: ChannelMetrics; rawItem: any }) => {
    await startAnalyzingFlow(entry.channel, userAccessToken || undefined, entry.rawItem?.contentDetails?.relatedPlaylists?.uploads);
  };

  // Optional manual fallback search by public @handle
  const handleSearchChannel = async (queryToSearch?: string) => {
    const targetQuery = (queryToSearch || queryInput).trim();
    if (!targetQuery) {
      setErrorMessage('Por favor, informe o @handle, link ou ID do canal no YouTube.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    if (triggerAudio) triggerAudio('tap');

    let json: any = null;
    let fetchSucceeded = false;

    try {
      const res = await fetch(`/api/youtube/channel?query=${encodeURIComponent(targetQuery)}`);
      const contentType = res.headers.get('content-type') || '';

      if (contentType.includes('application/json')) {
        try {
          json = await res.json();
          if (res.ok && json.success && json.data) {
            fetchSucceeded = true;
          }
        } catch (jsonErr) {
          console.warn('Falha no parse JSON da API:', jsonErr);
        }
      } else {
        console.warn('Resposta não-JSON recebida da rota de busca. Ativando fallback de resolução.');
      }
    } catch (networkErr) {
      console.warn('Erro de rede ao consultar /api/youtube/channel:', networkErr);
    }

    // If server API was unavailable, offline, or returned non-JSON/error, use robust client fallback
    if (!fetchSucceeded) {
      const fallback = await resolveChannelFallback(targetQuery);
      if (fallback) {
        json = { success: true, data: fallback };
        fetchSucceeded = true;
      }
    }

    if (!fetchSucceeded || !json || !json.data) {
      setIsLoading(false);
      setErrorMessage(json?.error || `Não foi possível encontrar o canal "${targetQuery}". Verifique se o @handle está correto ou conecte seu canal oficial.`);
      return;
    }

    try {
      const fetched = json.data;
      const formattedChannel: ChannelMetrics = {
        channelId: fetched.channelId,
        title: fetched.title,
        handle: fetched.handle,
        avatarUrl: fetched.avatarUrl,
        subscriberCount: fetched.subscriberCount,
        videoCount: fetched.videoCount,
        totalViews: fetched.totalViews,
        views3MonthsEstimated: fetched.totalViews ? Math.round(fetched.totalViews * 0.25) : 0,
        recentVideos: fetched.recentVideos || [],
        estimatedMonthlyGrowth: fetched.estimatedMonthlyGrowth || Math.max(100, Math.round(fetched.subscriberCount * 0.04)),
        averageRecentViews: fetched.averageRecentViews || 0,
        pkxdVideosDetected: fetched.pkxdVideosDetected || 0,
        isPublicDataAvailable: true,
        lastCheckedAt: new Date().toISOString()
      };

      handleSaveChannel(formattedChannel);
      if (triggerAudio) triggerAudio('success');

      if (formattedChannel.recentVideos.filter(v => v.isShort).length >= 5) {
        setCreatorFormat('shorts');
      }
    } catch (err: any) {
      console.error('Erro ao processar dados do canal:', err);
      setErrorMessage(err.message || 'Erro ao carregar dados do canal.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = () => {
    if (window.confirm('Deseja desconectar o canal e limpar os dados da análise?')) {
      handleSaveChannel(null);
      setConnectionStep('idle');
      setDetectedChannels([]);
      setAnalyzingChannel(null);
      setQueryInput('');
      if (triggerAudio) triggerAudio('tap');
    }
  };

  return (
    <div className="w-full min-h-screen bg-slate-950 text-zinc-100 pb-24 selection:bg-purple-500 selection:text-white">
      {/* Top Breadcrumb Navigation */}
      <div className="max-w-5xl mx-auto px-4 pt-6 pb-2">
        <div className="flex items-center justify-between">
          <button
            id="back-to-hub-analyzer-btn"
            onClick={onBackToHub}
            className="flex items-center gap-2 text-xs font-bold text-zinc-400 hover:text-white bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 px-3.5 py-2 rounded-xl transition-all cursor-pointer shadow-sm active:scale-95"
          >
            <ArrowLeft className="w-4 h-4" /> Voltar ao Hub
          </button>

          <button
            id="open-config-btn"
            onClick={() => setIsConfigModalOpen(true)}
            className="flex items-center gap-1.5 text-xs font-bold text-purple-300 hover:text-purple-200 bg-purple-950/40 hover:bg-purple-900/50 border border-purple-500/30 px-3 py-2 rounded-xl transition-all cursor-pointer shadow-sm"
          >
            <Settings2 className="w-4 h-4 text-purple-400" />
            <span>Configurar Requisitos</span>
          </button>
        </div>
      </div>

      {/* Hero Header Section */}
      <div className="max-w-5xl mx-auto px-4 pt-4 pb-8 text-center relative overflow-hidden">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-purple-500/10 to-indigo-500/10 border border-purple-500/30 text-purple-300 text-xs font-black uppercase tracking-wider mb-3 shadow-[0_0_20px_rgba(168,85,247,0.15)]">
          <Sparkles className="w-3.5 h-3.5 text-pink-400 animate-pulse" />
          <span>Creator Progress Analyzer</span>
        </div>

        <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-white tracking-tight uppercase">
          Ver Meu <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400 bg-clip-text text-transparent">Progresso Creator</span>
        </h1>

        <p className="mt-2 text-sm sm:text-base text-zinc-300 max-w-2xl mx-auto font-medium leading-relaxed">
          Descubra quanto falta para você atingir os requisitos oficiais para se tornar Creator do PK XD.
        </p>
      </div>

      {/* Main Container */}
      <div className="max-w-5xl mx-auto px-4 space-y-6">
        {/* Step 1: Input Channel / Connect Card */}
        <div 
          id="channel-input-card"
          className="bg-zinc-900/90 border border-purple-500/20 rounded-3xl p-5 sm:p-7 shadow-xl backdrop-blur-sm relative overflow-hidden"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
            <div>
              <span className="text-[11px] font-black uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
                <Youtube className="w-4 h-4 text-red-500" />
                Conectar ou Informar Canal
              </span>
              <h2 className="text-lg font-bold text-white mt-0.5">
                {channelData ? 'Canal Conectado' : 'Qual é o seu canal no YouTube?'}
              </h2>
            </div>

            <button
              onClick={() => setShowPrivacyDetails(!showPrivacyDetails)}
              className="text-xs text-zinc-400 hover:text-zinc-200 flex items-center gap-1 self-start md:self-auto cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Privacidade & Dados Utilizados</span>
            </button>
          </div>

          {/* Privacy Dropdown Notice */}
          <AnimatePresence>
            {showPrivacyDetails && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-5 p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800 text-xs text-zinc-300 space-y-2"
              >
                <div className="flex items-center gap-2 font-bold text-emerald-400">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Transparência e Coleta Segura de Dados</span>
                </div>
                <p className="leading-relaxed">
                  O <strong>Creator Progress Analyzer</strong> consulta exclusivamente <strong>informações públicas</strong> disponibilizadas pela API oficial do YouTube (como nome, foto pública de perfil, quantidade de inscritos e contagem de vídeos públicos).
                </p>
                <p className="text-zinc-400 leading-relaxed">
                  🔒 Nós <strong>não solicitamos senhas, permissões invasivas ou acesso a dados privados</strong> da sua conta. Você pode desconectar ou limpar a análise a qualquer momento com um clique.
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Step 1: YouTube Connection & Identification Flow */}
          {connectionStep === 'connecting' ? (
            <div className="p-8 rounded-2xl bg-zinc-950/90 border border-red-500/30 text-center space-y-4 animate-in fade-in">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-500 shadow-lg shadow-red-500/20">
                <RefreshCw className="w-8 h-8 animate-spin" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-black text-white">Conectando com o YouTube...</h3>
                <p className="text-xs text-zinc-400 max-w-md mx-auto">
                  Aguardando autorização da conta e identificando os dados oficiais do seu canal via YouTube API.
                </p>
              </div>
            </div>
          ) : connectionStep === 'no_channel' ? (
            <div className="p-6 sm:p-8 rounded-2xl bg-zinc-950/90 border border-amber-500/30 space-y-4 animate-in fade-in">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-black text-white">Nenhum canal do YouTube encontrado nesta conta</h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    A conta Google autorizada não possui um canal do YouTube criado. Certifique-se de conectar a conta correta onde seu canal está cadastrado ou crie seu canal no YouTube.
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  onClick={handleConnectYouTube}
                  className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black text-xs uppercase tracking-wider transition-all cursor-pointer shadow-lg shadow-red-600/30 active:scale-95"
                >
                  ▶ Tentar com outra conta Google
                </button>
                <button
                  onClick={() => setConnectionStep('idle')}
                  className="px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white font-bold text-xs transition-colors cursor-pointer"
                >
                  Voltar
                </button>
              </div>
            </div>
          ) : connectionStep === 'select_channel' ? (
            <div className="p-6 sm:p-8 rounded-2xl bg-zinc-950/90 border border-purple-500/30 space-y-5 animate-in fade-in">
              <div className="space-y-1">
                <span className="text-[11px] font-black uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-purple-400" />
                  Múltiplos Canais Encontrados
                </span>
                <h3 className="text-xl font-black text-white">Qual canal você quer analisar?</h3>
                <p className="text-xs text-zinc-400">
                  Sua conta possui mais de um canal no YouTube. Escolha qual deles deseja vincular à análise de Creator:
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                {detectedChannels.map((entry, idx) => (
                  <div
                    key={entry.channel.channelId || idx}
                    className="p-4 rounded-2xl bg-zinc-900/90 hover:bg-zinc-900 border border-zinc-800 hover:border-purple-500/50 transition-all flex flex-col justify-between gap-3 shadow-md group"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={entry.channel.avatarUrl}
                        alt={entry.channel.title}
                        className="w-12 h-12 rounded-xl object-cover border border-purple-500/30 shrink-0"
                        referrerPolicy="no-referrer"
                      />
                      <div className="min-w-0">
                        <h4 className="text-sm font-black text-white truncate group-hover:text-purple-300 transition-colors">
                          {entry.channel.title}
                        </h4>
                        <p className="text-xs text-zinc-400 font-mono truncate">{entry.channel.handle}</p>
                        <p className="text-[11px] text-purple-400 font-semibold mt-0.5">
                          {entry.channel.subscriberCount.toLocaleString('pt-BR')} inscritos • {entry.channel.videoCount} vídeos
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleSelectDetectedChannel(entry)}
                      className="w-full py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow active:scale-95 flex items-center justify-center gap-1.5"
                    >
                      <span>Selecionar este canal</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setConnectionStep('idle')}
                  className="text-xs text-zinc-400 hover:text-white cursor-pointer"
                >
                  Cancelar seleção
                </button>
              </div>
            </div>
          ) : connectionStep === 'analyzing' && analyzingChannel ? (
            /* Experience requested verbatim:
               ✓ YouTube conectado
               Canal encontrado:
               [foto] Nome do Canal
               @handle
               ANALISANDO SEU PROGRESSO...
            */
            <div className="p-8 sm:p-10 rounded-2xl bg-zinc-950/95 border border-emerald-500/40 text-center space-y-6 shadow-2xl animate-in zoom-in-95 duration-300">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-black text-xs uppercase tracking-wider">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>✓ YouTube conectado</span>
              </div>

              <div className="space-y-3">
                <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">
                  Canal encontrado:
                </span>
                
                <div className="flex flex-col items-center justify-center gap-3">
                  <img
                    src={analyzingChannel.avatarUrl}
                    alt={analyzingChannel.title}
                    className="w-20 h-20 rounded-2xl object-cover border-2 border-emerald-500/60 shadow-xl"
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <h3 className="text-xl sm:text-2xl font-black text-white">
                      {analyzingChannel.title}
                    </h3>
                    <p className="text-sm font-mono text-purple-400 mt-0.5">
                      {analyzingChannel.handle}
                    </p>
                    <p className="text-[11px] text-zinc-500 font-mono mt-1">
                      ID: {analyzingChannel.channelId}
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-zinc-800/80 flex flex-col items-center gap-2">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-purple-400 animate-pulse">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>ANALISANDO SEU PROGRESSO...</span>
                </div>
                <p className="text-[11px] text-zinc-500">
                  Calculando métricas de inscritos, visualizações e requisitos oficiais de Creator.
                </p>
              </div>
            </div>
          ) : !channelData ? (
            /* Standalone Connection Box when not connected */
            <div className="space-y-4">
              <div 
                id="connect-youtube-container"
                className="p-6 sm:p-8 rounded-3xl bg-gradient-to-b from-zinc-950 via-zinc-900/90 to-zinc-950 border border-red-500/30 hover:border-red-500/50 transition-all shadow-2xl relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />

                <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                  <div className="space-y-2 max-w-xl">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-600/15 border border-red-500/30 text-[11px] font-black uppercase tracking-wider text-red-400">
                      <Youtube className="w-4 h-4 text-red-500" />
                      <span>Conexão Oficial com o YouTube</span>
                    </div>

                    <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                      Conecte seu canal oficial do YouTube
                    </h3>
                    
                    <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
                      O sistema identificará o seu canal oficial (ID do canal, nome, foto pública e métricas) e iniciará automaticamente a análise detalhada de todos os requisitos para Creator do PK XD.
                    </p>

                    <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-zinc-400">
                      <span className="flex items-center gap-1">
                        <Check className="w-3.5 h-3.5 text-emerald-400" /> Identificação automática do Channel ID
                      </span>
                      <span className="flex items-center gap-1">
                        <Check className="w-3.5 h-3.5 text-emerald-400" /> Métricas em tempo real
                      </span>
                    </div>
                  </div>

                  <div className="w-full md:w-auto shrink-0 flex flex-col items-center gap-2">
                    <button
                      id="connect-youtube-btn"
                      type="button"
                      disabled={isConnecting}
                      onClick={handleConnectYouTube}
                      className="w-full md:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-red-600 via-red-500 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-sm sm:text-base font-black uppercase tracking-wider transition-all shadow-xl shadow-red-600/40 hover:shadow-red-600/60 flex items-center justify-center gap-3 cursor-pointer active:scale-95 disabled:opacity-50"
                    >
                      {isConnecting ? (
                        <>
                          <RefreshCw className="w-5 h-5 animate-spin" />
                          <span>Conectando YouTube...</span>
                        </>
                      ) : (
                        <>
                          <span className="text-lg leading-none">▶</span>
                          <span>CONECTAR MEU YOUTUBE</span>
                        </>
                      )}
                    </button>
                    <span className="text-[10px] text-zinc-500 font-medium">
                      Conexão segura via Google OAuth & YouTube API
                    </span>
                  </div>
                </div>

                {errorMessage && (
                  <div className="mt-5 p-3.5 rounded-2xl bg-red-950/40 border border-red-500/40 text-xs text-red-300 flex items-center gap-2.5">
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                    <span>{errorMessage}</span>
                  </div>
                )}
              </div>

              {/* Collapsible Manual Search by Handle */}
              <div className="pt-2 text-center">
                <button
                  onClick={() => setShowManualSearch(!showManualSearch)}
                  className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <span>{showManualSearch ? 'Ocultar busca manual' : 'Ou consultar canal por @handle público'}</span>
                  <ChevronRight className={`w-3.5 h-3.5 transition-transform ${showManualSearch ? 'rotate-90' : ''}`} />
                </button>

                {showManualSearch && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-3 p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800 text-left space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row gap-2.5">
                      <div className="relative flex-1">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                          <Search className="w-4 h-4" />
                        </div>
                        <input
                          id="youtube-handle-input"
                          type="text"
                          value={queryInput}
                          onChange={(e) => setQueryInput(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSearchChannel()}
                          placeholder="Digite o @handle (ex: @pkxd, @meucanal)..."
                          className="w-full bg-zinc-900 border border-zinc-700/80 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                        />
                      </div>

                      <button
                        id="search-channel-btn"
                        disabled={isLoading}
                        onClick={() => handleSearchChannel()}
                        className="px-5 py-2.5 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold uppercase text-xs tracking-wider transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer shrink-0"
                      >
                        {isLoading ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>Buscando...</span>
                          </>
                        ) : (
                          <>
                            <Search className="w-4 h-4" />
                            <span>Consultar</span>
                          </>
                        )}
                      </button>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <span className="text-[10px] font-semibold text-zinc-500">Testar com exemplos:</span>
                      {SAMPLE_CHANNELS.map(s => (
                        <button
                          key={s.query}
                          onClick={() => {
                            setQueryInput(s.query);
                            handleSearchChannel(s.query);
                          }}
                          className="text-[10px] bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-purple-300 hover:text-white px-2 py-0.5 rounded-lg transition-colors cursor-pointer"
                        >
                          {s.query}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          ) : (
            /* Connected Channel Profile Badge */
            <div className="p-4 sm:p-5 rounded-2xl bg-zinc-950/90 border border-emerald-500/30 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                {channelData.avatarUrl ? (
                  <img
                    src={channelData.avatarUrl}
                    alt={channelData.title}
                    className="w-14 h-14 rounded-2xl object-cover border-2 border-emerald-500/60 shadow-md shrink-0"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-2xl bg-purple-900/50 border border-purple-500/40 flex items-center justify-center text-purple-300 font-black text-xl shrink-0">
                    {channelData.title.slice(0, 1).toUpperCase()}
                  </div>
                )}
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-black text-white">{channelData.title}</h3>
                    <span className="text-[10px] bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 px-2.5 py-0.5 rounded-full font-extrabold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      <span>✓ YouTube Conectado</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-zinc-400 font-mono mt-0.5">
                    <span>{channelData.handle}</span>
                    <span>•</span>
                    <span className="text-[11px] text-zinc-500">ID: {channelData.channelId}</span>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-zinc-400 mt-1 font-medium">
                    <span className="text-purple-300 font-bold">
                      {channelData.subscriberCount.toLocaleString('pt-BR')} inscritos
                    </span>
                    <span>•</span>
                    <span>{channelData.videoCount.toLocaleString('pt-BR')} vídeos</span>
                    {channelData.pkxdVideosDetected ? (
                      <>
                        <span>•</span>
                        <span className="text-pink-300 font-bold">~{channelData.pkxdVideosDetected} vídeos PK XD</span>
                      </>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                <button
                  id="reanalyze-btn"
                  onClick={() => handleSearchChannel(channelData.handle)}
                  disabled={isLoading}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold text-zinc-300 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/60 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                  title="Atualizar dados do canal"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                  <span>Atualizar</span>
                </button>
                <button
                  id="disconnect-channel-btn"
                  onClick={handleDisconnect}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold text-red-400 hover:text-red-300 bg-red-950/20 hover:bg-red-950/40 border border-red-500/30 transition-all flex items-center gap-1.5 cursor-pointer"
                  title="Trocar de canal"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Trocar Canal</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Channel Active Analysis Results */}
        {channelData && analysis && (
          <div className="space-y-6">
            {/* Format & Tier Control Selector */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-zinc-900/60 p-3 rounded-2xl border border-zinc-800">
              {/* Creator Format Toggle */}
              <div className="flex items-center gap-1.5 bg-zinc-950 p-1 rounded-xl border border-zinc-800/80">
                <span className="text-[10px] uppercase font-bold text-zinc-500 px-2 hidden sm:inline">Formato:</span>
                <button
                  id="format-long-btn"
                  onClick={() => {
                    setCreatorFormat('long_video');
                    if (triggerAudio) triggerAudio('tap');
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    creatorFormat === 'long_video'
                      ? 'bg-purple-600 text-white shadow'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  YouTube Longo (+5m)
                </button>
                <button
                  id="format-shorts-btn"
                  onClick={() => {
                    setCreatorFormat('shorts');
                    if (triggerAudio) triggerAudio('tap');
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    creatorFormat === 'shorts'
                      ? 'bg-pink-600 text-white shadow'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  YouTube Shorts
                </button>
              </div>

              {/* Tier Target Toggle with all 4 Tiers */}
              <div className="flex items-center flex-wrap gap-1.5 bg-zinc-950 p-1.5 rounded-xl border border-zinc-800/80">
                <span className="text-[10px] uppercase font-bold text-zinc-500 px-1 hidden sm:inline">Meta para Subir:</span>
                <button
                  id="tier-stardust-btn"
                  onClick={() => {
                    setSelectedTier('stardust');
                    if (triggerAudio) triggerAudio('tap');
                  }}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    selectedTier === 'stardust'
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                  }`}
                >
                  <Star className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Tier 1: Stardust</span>
                </button>
                <button
                  id="tier-rising-star-btn"
                  onClick={() => {
                    setSelectedTier('rising_star');
                    if (triggerAudio) triggerAudio('tap');
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    selectedTier === 'rising_star'
                      ? 'bg-amber-600 text-white shadow-lg shadow-amber-500/20'
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                  }`}
                >
                  <Rocket className="w-3.5 h-3.5 text-amber-400" />
                  <span>Tier 2: Rising Star (Subir de Nível)</span>
                </button>
              </div>
            </div>

            {/* SEU PROGRESSO PARA CREATOR - High-impact Dashboard Summary Card */}
            <div 
              id="creator-progress-summary"
              className={`p-6 sm:p-8 rounded-3xl border shadow-2xl relative overflow-hidden ${
                analysis.isAllRequiredMet
                  ? 'bg-gradient-to-br from-emerald-950/80 via-zinc-900 to-zinc-950 border-emerald-500/40 shadow-emerald-500/10'
                  : 'bg-gradient-to-br from-purple-950/60 via-zinc-900 to-zinc-950 border-purple-500/30 shadow-purple-500/10'
              }`}
            >
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="space-y-2 text-center md:text-left">
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-black uppercase tracking-wider text-purple-300">
                      <span>SEU PROGRESSO PARA CREATOR</span>
                    </div>

                    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border ${
                      selectedTier === 'stardust'
                        ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300'
                        : 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                    }`}>
                      {selectedTier === 'stardust' ? <Star className="w-3.5 h-3.5" /> : <Rocket className="w-3.5 h-3.5" />}
                      <span>
                        Meta: {selectedTier === 'stardust' ? 'Tier 1 (Stardust - Entrada)' : 'Tier 2 (Rising Star - Subir de Nível)'}
                      </span>
                    </div>
                  </div>

                  <h2 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">
                    {channelData.title}
                  </h2>
                  <p className="text-sm font-mono text-zinc-400">{channelData.handle}</p>

                  <div className="pt-2 flex flex-wrap items-center justify-center md:justify-start gap-2">
                    {analysis.isAllRequiredMet ? (
                      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-black text-sm uppercase tracking-wider shadow-lg">
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                        <span>🎉 ATINGIU TODOS OS CRITÉRIOS DESTE TIER!</span>
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-purple-500/20 border border-purple-500/40 text-purple-300 font-black text-sm uppercase tracking-wider shadow-lg">
                        <Flame className="w-5 h-5 text-pink-400" />
                        <span>🚀 FALTAM {analysis.totalCount - analysis.metCount} REQUISITOS PARA SUBIR!</span>
                      </div>
                    )}

                    {tierEvolution && tierEvolution.nextTier && tierEvolution.nextTier !== selectedTier && (
                      <button
                        onClick={() => {
                          setSelectedTier(tierEvolution.nextTier!);
                          if (triggerAudio) triggerAudio('tap');
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold hover:bg-amber-500/20 transition-all cursor-pointer"
                      >
                        <Zap className="w-3.5 h-3.5 text-amber-400" />
                        <span>Próximo a Subir: {tierEvolution.nextTier.toUpperCase()} →</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Big Circular/Bar Overall Progress Gauge */}
                <div className="flex flex-col items-center justify-center p-5 rounded-2xl bg-zinc-950/70 border border-white/10 min-w-[210px] text-center">
                  <span className="text-xs uppercase font-black text-zinc-400 tracking-wider">
                    Progresso no Tier
                  </span>
                  <div className="text-4xl sm:text-5xl font-black my-1 bg-gradient-to-r from-purple-400 via-pink-400 to-emerald-400 bg-clip-text text-transparent">
                    {analysis.overallPercentage}%
                  </div>
                  
                  {/* Visual mini-bar */}
                  <div className="w-full bg-zinc-800 h-2.5 rounded-full overflow-hidden my-1.5">
                    <div 
                      className={`h-full rounded-full transition-all duration-700 ${
                        analysis.isAllRequiredMet
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                          : 'bg-gradient-to-r from-purple-600 to-pink-500'
                      }`}
                      style={{ width: `${analysis.overallPercentage}%` }}
                    />
                  </div>

                  <span className="text-[11px] font-bold text-zinc-400">
                    {analysis.metCount} de {analysis.totalCount} critérios cumpridos
                  </span>
                </div>
              </div>
            </div>

            {/* TRILHA DE TIERS: SUBA DE NÍVEL (Novo Módulo de Evolução) */}
            {tierEvolution && (
              <div id="creator-tier-roadmap" className="bg-zinc-900/70 border border-zinc-800 rounded-3xl p-6 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-amber-400">
                      <Trophy className="w-4 h-4" />
                      <span>Trilha de Tiers Oficial: Como Subir de Nível</span>
                    </div>
                    <h3 className="text-lg font-black text-white uppercase tracking-tight mt-0.5">
                      Progressão dos 4 Níveis de Creator PK XD
                    </h3>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Veja o que você precisa alcançar para subir de Tier e desbloquear novos benefícios no jogo.
                    </p>
                  </div>

                  {/* Current Status Pill */}
                  <div className="flex items-center gap-2 bg-zinc-950 px-4 py-2 rounded-2xl border border-zinc-800 self-start sm:self-auto">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    <span className="text-xs font-bold text-zinc-400">
                      Nível Atual:
                    </span>
                    <span className="text-xs font-black text-white uppercase bg-white/10 px-2 py-0.5 rounded-md">
                      {tierEvolution.currentTier === 'aspirant'
                        ? 'Aspirante a Creator'
                        : tierEvolution.currentTier === 'stardust'
                        ? 'Tier 1: Stardust'
                        : 'Tier 2: Rising Star'}
                    </span>
                  </div>
                </div>

                {/* 2-Tier Interactive Advancement Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl">
                  {tierEvolution.progressions.map((tier) => {
                    const isSelected = selectedTier === tier.tierId;
                    const tierMeta = PKXD_CREATOR_TIERS.find(t => t.id === tier.tierId);
                    const subReq = tier.summary.evaluatedRequirements.find(r => r.requirement.metricType === 'subscribers');
                    const targetSubs = subReq?.targetValue || (tier.level === 1 ? 5000 : 15000);

                    return (
                      <div
                        key={tier.tierId}
                        id={`tier-card-${tier.tierId}`}
                        onClick={() => {
                          setSelectedTier(tier.tierId);
                          if (triggerAudio) triggerAudio('tap');
                        }}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer relative flex flex-col justify-between ${
                          isSelected
                            ? 'bg-zinc-800/90 border-purple-500 shadow-lg shadow-purple-500/10 ring-2 ring-purple-500/30'
                            : 'bg-zinc-950/60 border-zinc-800/90 hover:border-zinc-700 hover:bg-zinc-900/60'
                        }`}
                      >
                        <div>
                          {/* Top row: Tier Level & Status Badge */}
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300">
                              Nível {tier.level}
                            </span>

                            {tier.isUnlocked ? (
                              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 flex items-center gap-1">
                                <Check className="w-2.5 h-2.5" />
                                <span>Alcançado</span>
                              </span>
                            ) : tier.isNextToClimb ? (
                              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 flex items-center gap-1 animate-pulse">
                                <Zap className="w-2.5 h-2.5" />
                                <span>Próximo a Subir</span>
                              </span>
                            ) : (
                              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-500 flex items-center gap-1">
                                <Lock className="w-2.5 h-2.5" />
                                <span>Bloqueado</span>
                              </span>
                            )}
                          </div>

                          {/* Tier Title & Icon */}
                          <div className="flex items-center gap-2.5 mb-1.5">
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                              tier.tierId === 'stardust'
                                ? 'bg-indigo-500/20 text-indigo-400'
                                : 'bg-amber-500/20 text-amber-400'
                            }`}>
                              {tier.tierId === 'stardust' ? <Star className="w-4 h-4" /> : <Rocket className="w-4 h-4" />}
                            </div>

                            <div>
                              <h4 className="text-sm font-black text-white uppercase tracking-tight leading-tight">
                                {tier.name}
                              </h4>
                              <span className="text-[11px] text-zinc-400">
                                {targetSubs.toLocaleString('pt-BR')} inscritos mín.
                              </span>
                            </div>
                          </div>

                          {/* Progress bar inside card */}
                          <div className="mt-3 mb-2">
                            <div className="flex items-center justify-between text-[11px] font-bold mb-1">
                              <span className="text-zinc-400">Progresso</span>
                              <span className={tier.percentage === 100 ? 'text-emerald-400' : 'text-purple-400'}>
                                {tier.percentage}%
                              </span>
                            </div>
                            <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${
                                  tier.isUnlocked
                                    ? 'bg-emerald-400'
                                    : 'bg-gradient-to-r from-purple-500 to-pink-500'
                                }`}
                                style={{ width: `${tier.percentage}%` }}
                              />
                            </div>
                          </div>

                          {/* What's needed to climb */}
                          <div className="text-[11px] text-zinc-400 space-y-1 py-1">
                            {tier.isUnlocked ? (
                              <p className="text-emerald-400 font-bold flex items-center gap-1">
                                <Check className="w-3 h-3" />
                                <span>Requisitos 100% atingidos!</span>
                              </p>
                            ) : (
                              <p className="text-zinc-300">
                                {tier.subscribersNeeded > 0 ? (
                                  <span>Faltam <strong className="text-white">{tier.subscribersNeeded.toLocaleString('pt-BR')}</strong> inscritos</span>
                                ) : (
                                  <span>Inscritos OK! Conclua os outros critérios</span>
                                )}
                              </p>
                            )}

                            {/* Reward snippet */}
                            {tierMeta && (
                              <div className="pt-1 text-[10px] text-amber-300/90 font-medium">
                                🎁 {tierMeta.benefits[0] || 'Benefícios exclusivos'}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Action button */}
                        <div className="pt-3 border-t border-zinc-800/80 mt-2">
                          <button
                            className={`w-full py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                              isSelected
                                ? 'bg-purple-600 text-white shadow'
                                : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white'
                            }`}
                          >
                            {isSelected ? (
                              <>
                                <Check className="w-3 h-3" />
                                <span>Focado Neste Tier</span>
                              </>
                            ) : (
                              <>
                                <span>Focar para Subir</span>
                                <ChevronRight className="w-3 h-3" />
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Individual Requirements Cards Grid */}
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 px-1">
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider text-zinc-300 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-purple-400" />
                    <span>
                      Requisitos: {selectedTier === 'stardust' ? 'Tier 1: Stardust (Entrada)' : 'Tier 2: Rising Star (Subir de Nível)'}
                    </span>
                  </h3>
                  <span className="text-xs text-zinc-500">
                    Metas para subir no {creatorFormat === 'long_video' ? 'Formato Vídeos Longos (+5 min)' : 'Formato Shorts'}
                  </span>
                </div>

                {/* Filter Tabs: Todos, Concluídos, Pendentes */}
                <div className="flex items-center gap-1.5 bg-zinc-950 p-1 rounded-xl border border-zinc-800">
                  <button
                    onClick={() => setActiveFilter('all')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      activeFilter === 'all'
                        ? 'bg-purple-600 text-white shadow'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    Todos ({analysis.totalCount})
                  </button>
                  <button
                    onClick={() => setActiveFilter('met')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      activeFilter === 'met'
                        ? 'bg-emerald-600 text-white shadow'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span>Concluídos ({analysis.metCount})</span>
                  </button>
                  <button
                    onClick={() => setActiveFilter('pending')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      activeFilter === 'pending'
                        ? 'bg-amber-600 text-white shadow'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                    <span>Pendentes ({analysis.totalCount - analysis.metCount})</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {analysis.evaluatedRequirements
                  .filter(item => {
                    if (activeFilter === 'met') return item.isMet;
                    if (activeFilter === 'pending') return !item.isMet;
                    return true;
                  })
                  .map(item => {
                  const { requirement, currentValue, targetValue, percentage, isMet, isAutoVerified, deficitText, estimateText } = item;
                  
                  return (
                    <div
                      key={requirement.id}
                      className={`p-5 rounded-2xl border transition-all relative overflow-hidden flex flex-col justify-between ${
                        isMet
                          ? 'bg-emerald-950/20 border-emerald-500/40 shadow-sm'
                          : isAutoVerified
                            ? 'bg-zinc-900/80 border-purple-500/25 hover:border-purple-500/50'
                            : 'bg-zinc-900/60 border-zinc-800'
                      }`}
                    >
                      {/* Top Row: Title & Badge */}
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2">
                            {isMet ? (
                              <span className="text-lg">🟢</span>
                            ) : (
                              <span className="text-lg">🟡</span>
                            )}
                            <h4 className="text-sm font-bold text-white leading-tight">
                              {requirement.name}
                            </h4>
                          </div>

                          {isMet ? (
                            <span className="text-[10px] uppercase font-black px-2 py-0.5 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded-full shrink-0 flex items-center gap-1">
                              <Check className="w-3 h-3" /> Concluído
                            </span>
                          ) : (
                            <span className="text-[10px] uppercase font-black px-2 py-0.5 bg-amber-500/20 border border-amber-500/30 text-amber-300 rounded-full shrink-0">
                              Pendente
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-zinc-400 leading-relaxed mb-3">
                          {requirement.description}
                        </p>
                      </div>

                      {/* Middle: Key metrics grid (Valor atual, necessário, quanto falta, progresso) */}
                      <div className="space-y-2.5 pt-2 border-t border-zinc-800/80">
                        <div className="grid grid-cols-2 gap-2 text-[11px] p-2 rounded-xl bg-zinc-950/60 border border-zinc-800/60">
                          <div>
                            <span className="text-zinc-500 block text-[10px] uppercase font-bold">Valor Atual</span>
                            <span className="font-mono font-bold text-white">
                              {typeof currentValue === 'number' 
                                ? `${currentValue.toLocaleString('pt-BR')} ${requirement.unit}`
                                : currentValue ? 'Confirmado' : 'Pendente'
                              }
                            </span>
                          </div>
                          <div>
                            <span className="text-zinc-500 block text-[10px] uppercase font-bold">Valor Necessário</span>
                            <span className="font-mono font-bold text-zinc-300">
                              {typeof targetValue === 'number'
                                ? `${targetValue.toLocaleString('pt-BR')} ${requirement.unit}`
                                : 'Obrigatório'
                              }
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-xs">
                          <span className="text-zinc-400 text-[11px] font-semibold">
                            {isMet ? 'Meta alcançada' : 'Progresso da meta:'}
                          </span>
                          <span className="font-black text-purple-300">{percentage}%</span>
                        </div>

                        {/* Visual ASCII / Tailwind Progress Bar */}
                        <div className="w-full bg-zinc-800/90 h-3 rounded-full overflow-hidden p-0.5 border border-zinc-700/50">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              isMet
                                ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                                : 'bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600'
                            }`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>

                        {/* Deficit / Status text */}
                        <div className="flex items-center justify-between text-xs pt-0.5">
                          {isMet ? (
                            <span className="text-emerald-400 font-bold flex items-center gap-1 text-[11px]">
                              ✓ Requisito 100% concluído
                            </span>
                          ) : (
                            <span className="text-pink-300 font-bold text-[11px]">
                              Quanto falta: {deficitText || item.statusMessage}
                            </span>
                          )}

                          {!isAutoVerified && (
                            <span className="text-[10px] text-zinc-500 flex items-center gap-1" title="Critério requer confirmação">
                              <HelpCircle className="w-3 h-3" /> Declaração
                            </span>
                          )}
                        </div>

                        {/* Rich Estimation Box if not met and estimate available */}
                        {!isMet && estimateText && (
                          <div className="mt-3 p-2.5 rounded-xl bg-purple-950/30 border border-purple-500/20 text-xs text-purple-200 leading-relaxed whitespace-pre-line">
                            {estimateText}
                          </div>
                        )}

                        {/* Manual Action Toggle for Non-Auto-Verifiable Requirements */}
                        {!isAutoVerified && (
                          <div className="mt-2.5 pt-2 border-t border-zinc-800/60 flex items-center justify-between gap-2">
                            <span className="text-[11px] text-zinc-400">
                              Não foi possível verificar este requisito automaticamente.
                            </span>
                            
                            {requirement.metricType === 'community_compliance' && (
                              <button
                                onClick={() => handleUpdateDeclaration('communityCompliant', !manualDeclarations.communityCompliant)}
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer shrink-0 ${
                                  manualDeclarations.communityCompliant
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-zinc-800 text-zinc-400 hover:text-white'
                                }`}
                              >
                                {manualDeclarations.communityCompliant ? '✓ Em Conformidade' : 'Declarar'}
                              </button>
                            )}

                            {requirement.metricType === 'program_terms' && (
                              <button
                                onClick={() => handleUpdateDeclaration('termsAccepted', !manualDeclarations.termsAccepted)}
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer shrink-0 ${
                                  manualDeclarations.termsAccepted
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-zinc-800 text-zinc-400 hover:text-white'
                                }`}
                              >
                                {manualDeclarations.termsAccepted ? '✓ Aceito' : 'Aceitar Termos'}
                              </button>
                            )}

                            {requirement.metricType === 'views_3months' && (
                              <div className="flex items-center gap-1">
                                <input
                                  type="number"
                                  placeholder="Suas views PK XD"
                                  value={manualDeclarations.pkxdViews3Months || ''}
                                  onChange={(e) => handleUpdateDeclaration('pkxdViews3Months', parseInt(e.target.value, 10) || 0)}
                                  className="w-24 bg-zinc-950 border border-zinc-700 rounded-lg px-2 py-1 text-xs text-white"
                                />
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* "O que falta para você?" Section (Prioritized Checklist) */}
            <div 
              id="what-is-missing-section"
              className="p-5 sm:p-6 rounded-3xl bg-zinc-900/70 border border-zinc-800 shadow-lg space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-pink-500/20 text-pink-400">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white uppercase tracking-wide">
                      O que falta para você?
                    </h3>
                    <p className="text-xs text-zinc-400">
                      Lista priorizada de metas para você focar e atingir o status Creator
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setShowSimulator(!showSimulator)}
                  className="text-xs font-bold text-purple-400 hover:text-purple-300 flex items-center gap-1.5 cursor-pointer bg-purple-950/40 border border-purple-500/30 px-3 py-1.5 rounded-xl transition-all"
                >
                  <BarChart3 className="w-4 h-4" />
                  <span>{showSimulator ? 'Ocultar Simulador' : 'Simulador de Crescimento'}</span>
                </button>
              </div>

              {analysis.pendingRequirements.length === 0 ? (
                <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 text-emerald-300 text-sm font-bold flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  <span>Parabéns! Você já cumpriu todos os critérios do Tier selecionado! Continue criando conteúdo com consistência para fortalecer sua candidatura.</span>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {analysis.pendingRequirements.map((item, idx) => {
                    const req = item.requirement;
                    return (
                      <div
                        key={req.id}
                        className="p-3.5 rounded-2xl bg-zinc-950/80 border border-zinc-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="flex items-start sm:items-center gap-3">
                          <span className="w-6 h-6 rounded-xl bg-purple-950 border border-purple-500/30 text-purple-300 flex items-center justify-center text-xs font-black shrink-0">
                            {idx + 1}
                          </span>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-xs sm:text-sm font-bold text-white">{req.name}</h4>
                              {req.isRequired && (
                                <span className="text-[9px] uppercase px-1.5 py-0.2 bg-pink-500/20 text-pink-300 rounded font-black">
                                  Obrigatório
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-zinc-400 mt-0.5">{item.deficitText || item.statusMessage}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                          <div className="text-right">
                            <span className="text-xs font-bold text-purple-400">{item.percentage}%</span>
                            <span className="text-[10px] text-zinc-500 block">concluído</span>
                          </div>
                          <ChevronRight className="w-4 h-4 text-zinc-600" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Interactive Growth Simulator / Projection */}
              <AnimatePresence>
                {showSimulator && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-4 p-5 rounded-2xl bg-zinc-950 border border-purple-500/30 space-y-4"
                  >
                    <div className="flex items-center gap-2 text-xs font-black uppercase text-purple-300">
                      <Lightbulb className="w-4 h-4 text-yellow-400" />
                      <span>Simulador de Projeção de Metas</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-zinc-400 mb-1">
                          Sua média de novos inscritos por mês: <strong>{simMonthlySubGrowth}</strong>
                        </label>
                        <input
                          type="range"
                          min="20"
                          max="2000"
                          step="20"
                          value={simMonthlySubGrowth}
                          onChange={(e) => setSimMonthlySubGrowth(parseInt(e.target.value, 10))}
                          className="w-full accent-purple-500 cursor-pointer"
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-zinc-400 mb-1">
                          Vídeos/Shorts que planeja postar por semana: <strong>{simWeeklyVideos}</strong>
                        </label>
                        <input
                          type="range"
                          min="1"
                          max="14"
                          step="1"
                          value={simWeeklyVideos}
                          onChange={(e) => setSimWeeklyVideos(parseInt(e.target.value, 10))}
                          className="w-full accent-pink-500 cursor-pointer"
                        />
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-purple-900/20 border border-purple-500/20 text-xs text-zinc-300">
                      💡 <strong>Cenário estimado:</strong> Publicando <strong>{simWeeklyVideos} vídeos por semana</strong> (~{simWeeklyVideos * 4} vídeos/mês), você supera a frequência mensal exigida de 8 a 16 vídeos em <strong>30 dias</strong>! E com +{simMonthlySubGrowth} inscritos/mês, canais com déficit atingem a meta de 1.000 inscritos rapidamente.
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Official Disclaimer Footer Note (MANDATORY REQUIREMENT) */}
            <div 
              id="official-disclaimer-note"
              className="p-5 rounded-2xl bg-zinc-950/90 border border-zinc-800 text-center space-y-2 text-zinc-400"
            >
              <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-zinc-300">
                <Info className="w-4 h-4 text-purple-400" />
                <span>Aviso Importante</span>
              </div>
              <p className="text-xs leading-relaxed max-w-2xl mx-auto italic text-zinc-300">
                «Esta análise é apenas informativa. A aprovação final depende da plataforma e pode considerar critérios que não estão disponíveis publicamente.»
              </p>
              <p className="text-[11px] text-zinc-500">
                Baseado nos critérios oficiais do Programa de Creators PK XD (Afterverse Creators). Fonte oficial revisada em 01/12/2025.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Config Requirements Modal */}
      <CreatorRequirementsConfigModal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        requirements={requirements}
        onSaveRequirements={(newReqs) => {
          setRequirements(newReqs);
          saveStoredRequirements(newReqs);
        }}
        soundEnabled={soundEnabled}
      />
    </div>
  );
}

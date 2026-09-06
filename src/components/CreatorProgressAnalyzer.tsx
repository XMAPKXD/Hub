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
  Lightbulb
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'motion/react';
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
  OFFICIAL_CREATOR_REQUIREMENTS 
} from '../data/creatorRequirements';
import { evaluateRequirements } from '../utils/creatorAnalyzer';
import CreatorRequirementsConfigModal from './CreatorRequirementsConfigModal';

interface CreatorProgressAnalyzerProps {
  onBackToHub: () => void;
  soundEnabled?: boolean;
  triggerAudio?: (type: 'tap' | 'levelUp' | 'success') => void;
}

// Sample channels for quick testing and demonstration
const SAMPLE_CHANNELS = [
  { name: 'PK XD Universe', query: '@pkxd' },
  { name: 'Gamer PK XD', query: '@pkxduniverse' },
  { name: 'Exemplo em Crescimento', query: '@PKXD_Creator' },
];

export default function CreatorProgressAnalyzer({
  onBackToHub,
  soundEnabled = true,
  triggerAudio
}: CreatorProgressAnalyzerProps) {
  const [requirements, setRequirements] = useState<CreatorRequirement[]>(getStoredRequirements);
  const [queryInput, setQueryInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
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

  // Run analysis calculation
  const analysis: AnalysisSummary | null = channelData 
    ? evaluateRequirements(
        requirements, 
        { ...channelData, manualOverrides: manualDeclarations }, 
        creatorFormat, 
        selectedTier
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

  // Fetch channel data from YouTube public lookup API
  const handleSearchChannel = async (queryToSearch?: string) => {
    const targetQuery = (queryToSearch || queryInput).trim();
    if (!targetQuery) {
      setErrorMessage('Por favor, informe o @handle, link ou ID do canal no YouTube.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    if (triggerAudio) triggerAudio('tap');

    try {
      const res = await fetch(`/api/youtube/channel?query=${encodeURIComponent(targetQuery)}`);
      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Não foi possível identificar este canal. Verifique a grafia e tente novamente.');
      }

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

      // Auto-detect format if channel has clear indicator
      if (formattedChannel.recentVideos.filter(v => v.isShort).length >= 5) {
        setCreatorFormat('shorts');
      }
    } catch (err: any) {
      console.error('Erro na busca do canal:', err);
      setErrorMessage(err.message || 'Erro ao conectar com os dados públicos do canal.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = () => {
    if (window.confirm('Deseja desconectar o canal e limpar os dados da análise?')) {
      handleSaveChannel(null);
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

          {/* Input or Connected Channel Bar */}
          {!channelData ? (
            <div className="space-y-4">
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
                    placeholder="Digite seu @handle (ex: @pkxd, @meucanal), link do canal ou ID..."
                    className="w-full bg-zinc-950 border border-zinc-700/80 rounded-2xl pl-10 pr-4 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all shadow-inner"
                  />
                </div>

                <button
                  id="search-channel-btn"
                  disabled={isLoading}
                  onClick={() => handleSearchChannel()}
                  className="px-6 py-3 rounded-2xl bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black uppercase text-xs tracking-wider transition-all shadow-lg shadow-purple-600/30 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer active:scale-95 shrink-0"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Analisando...</span>
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4" />
                      <span>Analisar Canal</span>
                    </>
                  )}
                </button>
              </div>

              {/* Quick sample chips */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="text-[11px] font-semibold text-zinc-500">Testar com canais de exemplo:</span>
                {SAMPLE_CHANNELS.map(s => (
                  <button
                    key={s.query}
                    onClick={() => {
                      setQueryInput(s.query);
                      handleSearchChannel(s.query);
                    }}
                    className="text-[11px] font-medium bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-purple-300 hover:text-white px-2.5 py-1 rounded-xl transition-colors cursor-pointer"
                  >
                    {s.query}
                  </button>
                ))}
              </div>

              {errorMessage && (
                <div className="p-3.5 rounded-2xl bg-red-950/40 border border-red-500/40 text-xs text-red-300 flex items-center gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                  <span>{errorMessage}</span>
                </div>
              )}
            </div>
          ) : (
            /* Connected Channel Profile Badge */
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800">
              <div className="flex items-center gap-3.5">
                {channelData.avatarUrl ? (
                  <img
                    src={channelData.avatarUrl}
                    alt={channelData.title}
                    className="w-14 h-14 rounded-2xl object-cover border-2 border-purple-500/50 shadow-md"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-2xl bg-purple-900/50 border border-purple-500/40 flex items-center justify-center text-purple-300 font-black text-xl">
                    {channelData.title.slice(0, 1).toUpperCase()}
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-black text-white">{channelData.title}</h3>
                    <span className="text-[10px] bg-purple-500/20 border border-purple-500/30 text-purple-300 px-2 py-0.5 rounded-full font-bold">
                      Canal Verificado
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 font-mono mt-0.5">{channelData.handle}</p>
                  <div className="flex items-center gap-3 text-[11px] text-zinc-400 mt-1 font-medium">
                    <span className="text-purple-300 font-bold">
                      {channelData.subscriberCount.toLocaleString('pt-BR')} inscritos
                    </span>
                    <span>•</span>
                    <span>{channelData.videoCount.toLocaleString('pt-BR')} vídeos</span>
                    {channelData.pkxdVideosDetected ? (
                      <>
                        <span>•</span>
                        <span className="text-pink-300">~{channelData.pkxdVideosDetected} vídeos de PK XD identificados</span>
                      </>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center">
                <button
                  id="reanalyze-btn"
                  onClick={() => handleSearchChannel(channelData.handle)}
                  disabled={isLoading}
                  className="px-3 py-2 rounded-xl text-xs font-bold text-zinc-300 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/60 transition-all flex items-center gap-1.5 cursor-pointer"
                  title="Atualizar dados do canal"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                  <span>Atualizar</span>
                </button>
                <button
                  id="disconnect-channel-btn"
                  onClick={handleDisconnect}
                  className="px-3 py-2 rounded-xl text-xs font-bold text-red-400 hover:text-red-300 bg-red-950/20 hover:bg-red-950/40 border border-red-500/30 transition-all flex items-center gap-1.5 cursor-pointer"
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

              {/* Tier Target Toggle */}
              <div className="flex items-center gap-1.5 bg-zinc-950 p-1 rounded-xl border border-zinc-800/80">
                <span className="text-[10px] uppercase font-bold text-zinc-500 px-2 hidden sm:inline">Meta:</span>
                <button
                  id="tier-stardust-btn"
                  onClick={() => {
                    setSelectedTier('stardust');
                    if (triggerAudio) triggerAudio('tap');
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    selectedTier === 'stardust'
                      ? 'bg-indigo-600 text-white shadow'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Tier Stardust (Entrada)
                </button>
                <button
                  id="tier-rising-star-btn"
                  onClick={() => {
                    setSelectedTier('rising_star');
                    if (triggerAudio) triggerAudio('tap');
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    selectedTier === 'rising_star'
                      ? 'bg-amber-600 text-white shadow'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Tier Rising Star (Avançado)
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
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-black uppercase tracking-wider text-purple-300">
                    <span>SEU PROGRESSO PARA CREATOR</span>
                  </div>

                  <h2 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">
                    {channelData.title}
                  </h2>
                  <p className="text-sm font-mono text-zinc-400">{channelData.handle}</p>

                  <div className="pt-2">
                    {analysis.isAllRequiredMet ? (
                      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-black text-sm uppercase tracking-wider shadow-lg">
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                        <span>🎉 VOCÊ ATINGIU TODOS OS REQUISITOS!</span>
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-purple-500/20 border border-purple-500/40 text-purple-300 font-black text-sm uppercase tracking-wider shadow-lg">
                        <Flame className="w-5 h-5 text-pink-400" />
                        <span>🚀 VOCÊ ESTÁ NO CAMINHO!</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Big Circular/Bar Overall Progress Gauge */}
                <div className="flex flex-col items-center justify-center p-5 rounded-2xl bg-zinc-950/70 border border-white/10 min-w-[210px] text-center">
                  <span className="text-xs uppercase font-black text-zinc-400 tracking-wider">
                    Progresso Geral
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

            {/* Individual Requirements Cards Grid */}
            <div>
              <div className="flex items-center justify-between mb-3 px-1">
                <h3 className="text-sm font-black uppercase tracking-wider text-zinc-300 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-purple-400" />
                  <span>Detalhamento dos Requisitos</span>
                </h3>
                <span className="text-xs text-zinc-500">
                  {creatorFormat === 'long_video' ? 'Formato Vídeos Longos' : 'Formato Shorts'}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {analysis.evaluatedRequirements.map(item => {
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
                            ) : isAutoVerified ? (
                              <span className="text-lg">🟡</span>
                            ) : (
                              <span className="text-lg">⚪</span>
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

                      {/* Middle: Progress Numbers & Bar */}
                      <div className="space-y-2 pt-2 border-t border-zinc-800/80">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-mono text-zinc-300">
                            {typeof currentValue === 'number' 
                              ? `${currentValue.toLocaleString('pt-BR')} / ${targetValue.toLocaleString('pt-BR')} ${requirement.unit}`
                              : currentValue ? 'Confirmado' : 'Pendente'
                            }
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
                        <div className="flex items-center justify-between text-xs pt-1">
                          {isMet ? (
                            <span className="text-emerald-400 font-bold flex items-center gap-1">
                              ✓ Requisito atingido
                            </span>
                          ) : (
                            <span className="text-pink-300 font-semibold">
                              “{deficitText || item.statusMessage}”
                            </span>
                          )}

                          {!isAutoVerified && (
                            <span className="text-[10px] text-zinc-500 flex items-center gap-1" title="Critério requer confirmação">
                              <HelpCircle className="w-3 h-3" /> Manual
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

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Radio, 
  Flame, 
  Clock, 
  Calendar, 
  ExternalLink, 
  Bell, 
  BellRing, 
  Sparkles, 
  Share2, 
  Check, 
  PlusCircle, 
  Trash2, 
  Edit3, 
  Gift, 
  Eye, 
  Video, 
  Info, 
  AlertCircle,
  Tv,
  CalendarPlus,
  Play
} from 'lucide-react';
import { UpcomingStreamItem } from '../types';
import { playTapSound, playSuccessSound } from '../utils/audio';
import { db } from '../firebase';
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  orderBy 
} from 'firebase/firestore';

interface UpcomingStreamsSectionProps {
  isAdmin: boolean;
  currentUser?: any;
  onAddXP?: (amount: number, reason?: string) => void;
  triggerAudio?: (sound: 'tap' | 'success' | 'levelUp' | 'spin') => void;
}

// Curated default scheduled streams if database is starting fresh
const DEFAULT_UPCOMING_STREAMS: UpcomingStreamItem[] = [];

export default function UpcomingStreamsSection({
  isAdmin,
  currentUser,
  onAddXP,
  triggerAudio
}: UpcomingStreamsSectionProps) {
  const [streams, setStreams] = useState<UpcomingStreamItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'live' | 'gems' | 'spoilers'>('all');
  const [activeReminders, setActiveReminders] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('pkxd_stream_reminders');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Admin Form Modal State
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [editingStreamId, setEditingStreamId] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formCreator, setFormCreator] = useState('');
  const [formStreamType, setFormStreamType] = useState<UpcomingStreamItem['streamType']>('live_codes');
  const [formPlatform, setFormPlatform] = useState<UpcomingStreamItem['platform']>('youtube');
  const [formDate, setFormDate] = useState('');
  const [formUrl, setFormUrl] = useState('');
  const [formRewards, setFormRewards] = useState('');
  const [formHints, setFormHints] = useState('');
  const [formBanner, setFormBanner] = useState('');
  const [formStatus, setFormStatus] = useState<UpcomingStreamItem['status']>('scheduled');
  const [isSaving, setIsSaving] = useState(false);

  // Real-time Firestore sync
  useEffect(() => {
    try {
      const q = query(collection(db, 'upcoming_streams'), orderBy('scheduledDate', 'asc'));
      const unsub = onSnapshot(q, (snapshot) => {
        if (!snapshot.empty) {
          const list: UpcomingStreamItem[] = snapshot.docs.map(d => ({
            id: d.id,
            ...(d.data() as Omit<UpcomingStreamItem, 'id'>)
          }));
          setStreams(list);
        } else {
          setStreams([]);
        }
        setLoading(false);
      }, (err) => {
        console.warn('Upcoming streams snapshot error:', err);
        setStreams([]);
        setLoading(false);
      });

      return () => unsub();
    } catch (err) {
      setStreams([]);
      setLoading(false);
    }
  }, []);

  // Format relative time or live countdown
  const getTimeRemaining = (scheduledDateStr: string) => {
    const target = new Date(scheduledDateStr).getTime();
    const now = Date.now();
    const diff = target - now;

    if (diff <= 0) {
      return { isLive: true, text: 'AO VIVO AGORA!' };
    }

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const days = Math.floor(hours / 24);

    if (days > 1) {
      return { isLive: false, text: `Em ${days} dias (${new Date(scheduledDateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })})` };
    } else if (days === 1) {
      return { isLive: false, text: `Amanhã às ${new Date(scheduledDateStr).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}` };
    } else if (hours >= 1) {
      return { isLive: false, text: `Em ${hours}h ${minutes}m` };
    } else {
      return { isLive: false, text: `Em ${minutes} minutos` };
    }
  };

  const handleToggleReminder = async (stream: UpcomingStreamItem) => {
    const isSet = activeReminders.includes(stream.id);
    let nextReminders: string[];

    if (isSet) {
      nextReminders = activeReminders.filter(id => id !== stream.id);
      playTapSound();
    } else {
      nextReminders = [...activeReminders, stream.id];
      if (triggerAudio) triggerAudio('success');
      else playSuccessSound();

      // Ask for browser notification permission if available
      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
      }

      // Award fan XP
      if (onAddXP) {
        onAddXP(15, 'Lembrete de Live com Código ativado');
      }

      // Increment Firestore reminder count if doc exists
      try {
        if (!stream.id.startsWith('default_')) {
          const docRef = doc(db, 'upcoming_streams', stream.id);
          await updateDoc(docRef, {
            remindersCount: (stream.remindersCount || 0) + 1
          });
        }
      } catch (e) {}
    }

    setActiveReminders(nextReminders);
    try {
      localStorage.setItem('pkxd_stream_reminders', JSON.stringify(nextReminders));
    } catch (e) {}
  };

  const handleCopyStreamLink = (e: React.MouseEvent, url: string, id: string) => {
    e.stopPropagation();
    playTapSound();
    try {
      navigator.clipboard.writeText(url);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2500);
    } catch (e) {}
  };

  const handleGenerateGoogleCalendarUrl = (stream: UpcomingStreamItem) => {
    try {
      const startDate = new Date(stream.scheduledDate);
      const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // 1 hour duration

      const formatGCalDate = (d: Date) => {
        return d.toISOString().replace(/-|:|\.\d\d\d/g, '');
      };

      const title = encodeURIComponent(`⚡ PK XD Live com Códigos: ${stream.title}`);
      const details = encodeURIComponent(
        `Acompanhe a transmissão e garanta seus códigos do PK XD!\n\nRecompensas: ${stream.rewardsSummary}\n\nDicas: ${stream.hintsOrInstructions || 'Preste atenção nos códigos!'}\n\nLink: ${stream.targetUrl}`
      );
      const dates = `${formatGCalDate(startDate)}/${formatGCalDate(endDate)}`;

      const gcalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}&details=${details}&location=${encodeURIComponent(stream.targetUrl)}`;
      window.open(gcalUrl, '_blank', 'noreferrer');
    } catch (e) {
      window.open(stream.targetUrl, '_blank', 'noreferrer');
    }
  };

  // Open Admin Form Modal for adding or editing
  const handleOpenAdminModal = (streamToEdit?: UpcomingStreamItem) => {
    playTapSound();
    if (streamToEdit) {
      setEditingStreamId(streamToEdit.id);
      setFormTitle(streamToEdit.title);
      setFormCreator(streamToEdit.creatorOrChannel);
      setFormStreamType(streamToEdit.streamType);
      setFormPlatform(streamToEdit.platform);
      setFormDate(new Date(streamToEdit.scheduledDate).toISOString().slice(0, 16));
      setFormUrl(streamToEdit.targetUrl);
      setFormRewards(streamToEdit.rewardsSummary);
      setFormHints(streamToEdit.hintsOrInstructions || '');
      setFormBanner(streamToEdit.bannerUrl || '');
      setFormStatus(streamToEdit.status || 'scheduled');
    } else {
      setEditingStreamId(null);
      setFormTitle('');
      setFormCreator('PKXD Central Oficial');
      setFormStreamType('live_codes');
      setFormPlatform('youtube');
      // Set default to tomorrow at 18:30
      const tomorrow = new Date(Date.now() + 24 * 3600 * 1000);
      tomorrow.setHours(18, 30, 0, 0);
      setFormDate(tomorrow.toISOString().slice(0, 16));
      setFormUrl('https://youtube.com');
      setFormRewards('💎 50 Gemas + 🪙 15.000 Moedas');
      setFormHints('Códigos liberados durante a live no chat e na tela!');
      setFormBanner('');
      setFormStatus('scheduled');
    }
    setShowAdminModal(true);
  };

  const handleSaveStream = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formUrl.trim() || !formDate) return;

    setIsSaving(true);
    try {
      const streamPayload: Omit<UpcomingStreamItem, 'id'> = {
        title: formTitle.trim(),
        creatorOrChannel: formCreator.trim() || 'PKXD Central',
        streamType: formStreamType,
        platform: formPlatform,
        scheduledDate: new Date(formDate).toISOString(),
        targetUrl: formUrl.trim(),
        rewardsSummary: formRewards.trim() || 'Códigos e Recompensas Especiais',
        hintsOrInstructions: formHints.trim(),
        bannerUrl: formBanner.trim() || '',
        status: formStatus,
        remindersCount: 0,
        createdAt: Date.now()
      };

      if (editingStreamId && !editingStreamId.startsWith('default_')) {
        await updateDoc(doc(db, 'upcoming_streams', editingStreamId), streamPayload as any);
      } else {
        await addDoc(collection(db, 'upcoming_streams'), streamPayload);
      }

      if (triggerAudio) triggerAudio('success');
      setShowAdminModal(false);
    } catch (err) {
      console.error('Error saving upcoming stream:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteStream = async (id: string) => {
    if (!confirm('Deseja realmente remover esta transmissão agendada?')) return;
    playTapSound();
    try {
      if (!id.startsWith('default_')) {
        await deleteDoc(doc(db, 'upcoming_streams', id));
      } else {
        setStreams(prev => prev.filter(s => s.id !== id));
      }
    } catch (err) {
      console.error('Error deleting stream:', err);
    }
  };

  // Filtered streams list
  const filteredStreams = useMemo(() => {
    return streams.filter(stream => {
      if (selectedFilter === 'live') {
        const remaining = getTimeRemaining(stream.scheduledDate);
        return remaining.isLive || stream.status === 'live_now';
      }
      if (selectedFilter === 'gems') {
        return stream.streamType === 'live_codes' || stream.streamType === 'gem_giveaway';
      }
      if (selectedFilter === 'spoilers') {
        return stream.streamType === 'spoiler_premiere';
      }
      return true;
    });
  }, [streams, selectedFilter]);

  const getStreamTypeLabel = (type: UpcomingStreamItem['streamType']) => {
    switch (type) {
      case 'live_codes':
        return { label: '🔴 LIVE COM CÓDIGOS', color: 'bg-red-500/20 text-red-300 border-red-500/40' };
      case 'spoiler_premiere':
        return { label: '🎬 ESTREIA COM SPOILERS & CÓDIGOS', color: 'bg-purple-500/20 text-purple-300 border-purple-500/40' };
      case 'gem_giveaway':
        return { label: '💎 SORTEIO DE GEMAS & ITENS', color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' };
      case 'special_event':
        return { label: '⚡ EVENTO ESPECIAL DA CENTRAL', color: 'bg-amber-500/20 text-amber-300 border-amber-500/40' };
      default:
        return { label: '⚡ TRANSMISSÃO COM CÓDIGOS', color: 'bg-pink-500/20 text-pink-300 border-pink-500/40' };
    }
  };

  return (
    <section 
      id="upcoming-streams-section" 
      className="bg-zinc-900/60 border-2 border-yellow-500/30 rounded-3xl p-5 sm:p-7 space-y-6 text-left relative overflow-hidden shadow-2xl backdrop-blur-md"
    >
      {/* Background ambient lighting */}
      <div className="absolute top-0 right-1/4 w-64 h-64 bg-yellow-500/10 rounded-full filter blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-64 h-64 bg-red-500/10 rounded-full filter blur-3xl pointer-events-none" />

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-5 relative z-10">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-yellow-500/20 via-red-500/20 to-pink-500/20 text-yellow-300 border border-yellow-400/40 rounded-2xl shadow-inner flex-shrink-0 animate-pulse">
            <Radio className="w-6 h-6 text-yellow-300" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-sans font-black text-xl sm:text-2xl tracking-tight text-white uppercase flex items-center gap-1.5">
                <span>PRÓXIMOS VÍDEOS/LIVES COM CÓDIGOS</span>
                <span className="text-yellow-300 animate-bounce">⚡</span>
              </h3>
              <span className="font-black text-[9px] uppercase font-mono px-2.5 py-0.5 bg-gradient-to-r from-red-500/30 via-yellow-500/30 to-amber-500/30 text-yellow-200 rounded-full border border-yellow-400/40 shadow-sm flex items-center gap-1">
                <Flame className="w-2.5 h-2.5 text-yellow-400 fill-yellow-400" />
                <span>Radares de Cupons</span>
              </span>
            </div>
            <p className="font-sans text-xs sm:text-sm text-yellow-150/80 mt-0.5">
              Acompanhe os próximos vídeos e transmissões para garantir seus <strong className="text-yellow-300">cupons oficiais</strong> e <strong className="text-cyan-300">novos códigos</strong>!
            </p>
          </div>
        </div>

        {/* Admin Action Button */}
        {isAdmin && (
          <button
            onClick={() => handleOpenAdminModal()}
            className="px-4 py-2.5 bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-500 hover:brightness-110 text-zinc-950 rounded-xl font-sans font-black text-xs uppercase tracking-wider transition-all duration-150 cursor-pointer shadow-lg flex items-center gap-1.5 self-start md:self-center flex-shrink-0 active:scale-95"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Agendar Nova Live/Vídeo</span>
          </button>
        )}
      </div>

      {/* Filter Tabs & Live Badge Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 relative z-10">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1 no-scrollbar">
          <button
            onClick={() => { playTapSound(); setSelectedFilter('all'); }}
            className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
              selectedFilter === 'all'
                ? 'bg-yellow-400 text-zinc-950 shadow-md font-bold'
                : 'bg-zinc-800/60 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-white/5'
            }`}
          >
            Todos ({streams.length})
          </button>

          <button
            onClick={() => { playTapSound(); setSelectedFilter('gems'); }}
            className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 ${
              selectedFilter === 'gems'
                ? 'bg-cyan-400 text-zinc-950 shadow-md font-bold'
                : 'bg-zinc-800/60 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-white/5'
            }`}
          >
            <Sparkles className="w-3 h-3 text-cyan-300" />
            <span>Com Gemas 💎</span>
          </button>

          <button
            onClick={() => { playTapSound(); setSelectedFilter('spoilers'); }}
            className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 ${
              selectedFilter === 'spoilers'
                ? 'bg-purple-500 text-white shadow-md font-bold'
                : 'bg-zinc-800/60 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-white/5'
            }`}
          >
            <Video className="w-3 h-3 text-purple-300" />
            <span>Estreias de Spoilers 🎬</span>
          </button>

          <button
            onClick={() => { playTapSound(); setSelectedFilter('live'); }}
            className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 ${
              selectedFilter === 'live'
                ? 'bg-red-500 text-white shadow-md font-bold'
                : 'bg-zinc-800/60 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-white/5'
            }`}
          >
            <Radio className="w-3 h-3 text-red-300 animate-pulse" />
            <span>Ao Vivo / Iminente 🔴</span>
          </button>
        </div>

        {/* Tip Badge */}
        <div className="text-[11px] font-mono text-zinc-400 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
          <span>Ative o lembrete para ganhar <strong className="text-yellow-300">+15 XP</strong></span>
        </div>
      </div>

      {/* STREAMS GRID */}
      {filteredStreams.length > 0 && (
        <div className="max-h-[520px] overflow-y-auto pr-1.5 sm:pr-2 scrollbar-thin scrollbar-thumb-yellow-500/40 scrollbar-track-black/30">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 relative z-10">
            {filteredStreams.map((stream) => {
          const typeInfo = getStreamTypeLabel(stream.streamType);
          const timeInfo = getTimeRemaining(stream.scheduledDate);
          const isReminderSet = activeReminders.includes(stream.id);
          const dateObj = new Date(stream.scheduledDate);

          return (
            <div
              key={stream.id}
              className={`bg-zinc-950/90 border-2 rounded-2xl overflow-hidden flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 relative shadow-xl group ${
                timeInfo.isLive || stream.status === 'live_now'
                  ? 'border-red-500 shadow-[0_0_25px_rgba(239,68,68,0.3)]'
                  : 'border-white/10 hover:border-yellow-400/50 hover:shadow-[0_8px_25px_rgba(234,179,8,0.2)]'
              }`}
            >
              {/* TOP BANNER / COVER WITH COUNTDOWN OVERLAY */}
              <div className="relative aspect-[16/9] w-full bg-gradient-to-br from-zinc-900 via-zinc-950 to-black overflow-hidden">
                {stream.bannerUrl ? (
                  <img
                    src={stream.bannerUrl}
                    alt={stream.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-70 group-hover:opacity-90"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-gradient-to-br from-purple-950/40 via-zinc-950 to-black text-center">
                    <div className="w-12 h-12 rounded-2xl bg-yellow-400/10 border border-yellow-400/30 text-yellow-300 flex items-center justify-center mb-2 shadow-inner">
                      <Radio className="w-6 h-6 animate-pulse" />
                    </div>
                    <span className="text-[11px] font-mono uppercase text-zinc-400 font-bold">
                      {stream.creatorOrChannel}
                    </span>
                  </div>
                )}

                {/* Status & Countdown Pill */}
                <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between gap-2 z-10">
                  <span className={`text-[10px] font-black font-mono px-2.5 py-1 rounded-lg border uppercase shadow-lg flex items-center gap-1.5 backdrop-blur-md ${
                    timeInfo.isLive || stream.status === 'live_now'
                      ? 'bg-red-600/90 text-white border-red-400 animate-pulse'
                      : 'bg-zinc-950/90 text-yellow-300 border-yellow-400/50'
                  }`}>
                    {timeInfo.isLive || stream.status === 'live_now' ? (
                      <>
                        <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                        <span>AO VIVO AGORA!</span>
                      </>
                    ) : (
                      <>
                        <Clock className="w-3 h-3 text-yellow-400" />
                        <span>{timeInfo.text}</span>
                      </>
                    )}
                  </span>

                  {/* Share button */}
                  <button
                    onClick={(e) => handleCopyStreamLink(e, stream.targetUrl, stream.id)}
                    className="p-1.5 bg-black/80 hover:bg-zinc-800 text-white rounded-lg border border-white/20 transition-all cursor-pointer shadow-md active:scale-90"
                    title="Copiar link da transmissão"
                  >
                    {copiedId === stream.id ? (
                      <Check className="w-3.5 h-3.5 text-green-400" />
                    ) : (
                      <Share2 className="w-3.5 h-3.5 text-zinc-300 hover:text-yellow-300" />
                    )}
                  </button>
                </div>

                {/* Creator Badge at Bottom of Banner */}
                <div className="absolute bottom-2 left-2.5 right-2.5 z-10 flex items-center justify-between text-[11px] font-mono text-white/90 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10">
                  <span className="font-bold truncate text-yellow-300 flex items-center gap-1">
                    <Tv className="w-3 h-3 text-yellow-400" />
                    <span>{stream.creatorOrChannel}</span>
                  </span>
                  <span className="text-[10px] text-zinc-300 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-cyan-300" />
                    <span>{dateObj.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} • {dateObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                  </span>
                </div>
              </div>

              {/* CARD DETAILS */}
              <div className="p-4 space-y-3.5 flex-1 flex flex-col justify-between">
                <div className="space-y-2">
                  {/* Category Pill */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-[9px] font-mono font-black uppercase px-2 py-0.5 rounded-md border ${typeInfo.color}`}>
                      {typeInfo.label}
                    </span>
                  </div>

                  {/* Title */}
                  <h4 
                    title={stream.title}
                    className="font-sans font-black text-sm sm:text-base text-white group-hover:text-yellow-300 transition-colors line-clamp-2 leading-snug"
                  >
                    {stream.title}
                  </h4>
                </div>

                {/* Guaranteed Rewards Box */}
                <div className="bg-gradient-to-r from-yellow-500/10 via-amber-500/10 to-orange-500/10 border border-yellow-500/30 rounded-xl p-2.5 space-y-1">
                  <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-yellow-300 uppercase tracking-wider">
                    <Gift className="w-3.5 h-3.5 text-yellow-400 animate-bounce" />
                    <span>Recompensas & Cupons:</span>
                  </div>
                  <p className="text-xs font-sans font-black text-white">
                    {stream.rewardsSummary}
                  </p>
                </div>

                {/* Secret Tip / Instructions */}
                {stream.hintsOrInstructions && (
                  <div className="flex items-start gap-1.5 text-[11px] text-zinc-300 font-sans bg-white/5 p-2 rounded-lg border border-white/5 leading-relaxed">
                    <Info className="w-3.5 h-3.5 text-cyan-300 flex-shrink-0 mt-0.5" />
                    <span><strong>Dica:</strong> {stream.hintsOrInstructions}</span>
                  </div>
                )}

                {/* ACTION BUTTONS */}
                <div className="pt-2 border-t border-white/10 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    {/* Reminder Button */}
                    <button
                      onClick={() => handleToggleReminder(stream)}
                      className={`py-2 px-2.5 rounded-xl font-sans font-black text-xs uppercase tracking-wider transition-all duration-150 cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 ${
                        isReminderSet
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                          : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-white/10 hover:border-yellow-400/40'
                      }`}
                      title={isReminderSet ? 'Lembrete ativado!' : 'Ativar lembrete no dispositivo'}
                    >
                      {isReminderSet ? (
                        <>
                          <BellRing className="w-3.5 h-3.5 text-emerald-400 animate-swing" />
                          <span className="truncate">Lembrando 🔔</span>
                        </>
                      ) : (
                        <>
                          <Bell className="w-3.5 h-3.5 text-yellow-400" />
                          <span className="truncate">Lembrar ⏰</span>
                        </>
                      )}
                    </button>

                    {/* Google Calendar Link */}
                    <button
                      onClick={() => handleGenerateGoogleCalendarUrl(stream)}
                      className="py-2 px-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white border border-white/10 rounded-xl font-sans font-black text-xs uppercase tracking-wider transition-all duration-150 cursor-pointer flex items-center justify-center gap-1.5 active:scale-95"
                      title="Salvar na Google Agenda"
                    >
                      <CalendarPlus className="w-3.5 h-3.5 text-cyan-400" />
                      <span className="truncate">Agenda 📅</span>
                    </button>
                  </div>

                  {/* Primary Link: Watch Live or Go to Stream */}
                  <a
                    href={stream.targetUrl}
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => {
                      if (triggerAudio) triggerAudio('tap');
                      else playTapSound();
                    }}
                    className={`w-full py-2.5 rounded-xl font-sans font-black text-xs uppercase tracking-wider transition-all duration-150 cursor-pointer flex items-center justify-center gap-2 shadow-lg hover:scale-[1.01] active:scale-95 ${
                      timeInfo.isLive || stream.status === 'live_now'
                        ? 'bg-gradient-to-r from-red-600 via-rose-600 to-pink-600 text-white animate-pulse'
                        : 'bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-500 text-zinc-950 hover:brightness-110'
                    }`}
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>{timeInfo.isLive || stream.status === 'live_now' ? 'Entrar na Live Agora!' : 'Acessar Canal / Live ⚡'}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>

                  {/* Admin controls */}
                  {isAdmin && (
                    <div className="flex items-center justify-end gap-2 pt-1 border-t border-white/5">
                      <button
                        onClick={() => handleOpenAdminModal(stream)}
                        className="p-1.5 text-zinc-400 hover:text-yellow-300 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                        title="Editar transmissão"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>Editar</span>
                      </button>

                      <button
                        onClick={() => handleDeleteStream(stream.id)}
                        className="p-1.5 text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                        title="Excluir transmissão"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Excluir</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
          </div>
        </div>
      )}

      {filteredStreams.length === 0 && (
        <div className="text-center py-12 bg-zinc-950/60 rounded-2xl border border-white/5 space-y-3 px-4">
          <div className="w-12 h-12 rounded-full bg-yellow-500/10 text-yellow-400 flex items-center justify-center mx-auto">
            <Radio className="w-6 h-6" />
          </div>
          <h4 className="font-sans font-black text-sm text-white uppercase">
            {streams.length === 0 ? 'Nenhuma Live ou Transmissão Agendada' : 'Nenhuma transmissão encontrada neste filtro'}
          </h4>
          <p className="text-xs text-zinc-400 max-w-md mx-auto">
            {streams.length === 0
              ? 'Assim que uma nova transmissão ou vídeo oficial com códigos e cupons for agendado pelo administrador, ele aparecerá aqui!'
              : 'Selecione a aba "Todos" para visualizar todos os próximos vídeos e eventos agendados com cupons.'}
          </p>
          {isAdmin && streams.length === 0 && (
            <button
              onClick={() => handleOpenAdminModal()}
              className="mt-2 px-4 py-2 bg-gradient-to-r from-yellow-400 to-amber-500 hover:brightness-110 text-zinc-950 rounded-xl font-sans font-black text-xs uppercase tracking-wider transition-all duration-150 cursor-pointer shadow-lg inline-flex items-center gap-1.5 active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Agendar Transmissão Oficial</span>
            </button>
          )}
        </div>
      )}

      {/* ADMIN MODAL: ADD / EDIT STREAM */}
      {showAdminModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="bg-zinc-900 border-2 border-yellow-500/50 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl relative text-left max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2 text-yellow-300">
                <Radio className="w-5 h-5" />
                <h4 className="font-sans font-black text-lg text-white uppercase">
                  {editingStreamId ? 'Editar Transmissão Agendada' : 'Agendar Live/Vídeo com Códigos'}
                </h4>
              </div>
              <button
                onClick={() => setShowAdminModal(false)}
                className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-white/10"
              >
                ✕
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveStream} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-black text-yellow-300 uppercase mb-1">
                  Título do Vídeo ou Live *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: MEGA LIVE DE SEXTA: 5 CÓDIGOS DE GEMAS AO VIVO! 💎"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full bg-zinc-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-yellow-400"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-black text-yellow-300 uppercase mb-1">
                    Canal / Criador *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: PKXD Central Oficial"
                    value={formCreator}
                    onChange={(e) => setFormCreator(e.target.value)}
                    className="w-full bg-zinc-950 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-yellow-400"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-black text-yellow-300 uppercase mb-1">
                    Tipo de Evento
                  </label>
                  <select
                    value={formStreamType}
                    onChange={(e) => setFormStreamType(e.target.value as any)}
                    className="w-full bg-zinc-950 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-yellow-400"
                  >
                    <option value="live_codes">🔴 Live com Códigos ao Vivo</option>
                    <option value="spoiler_premiere">🎬 Estreia com Spoilers & Códigos</option>
                    <option value="gem_giveaway">💎 Sorteio de Gemas & Itens</option>
                    <option value="special_event">⚡ Evento Especial da Central</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-black text-yellow-300 uppercase mb-1">
                    Data e Horário Previsto *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full bg-zinc-950 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-yellow-400"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-black text-yellow-300 uppercase mb-1">
                    Status Atual
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    className="w-full bg-zinc-950 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-yellow-400"
                  >
                    <option value="scheduled">⏳ Agendado</option>
                    <option value="live_now">🔴 Ao Vivo Agora</option>
                    <option value="completed">✅ Concluído</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-black text-yellow-300 uppercase mb-1">
                  Link do Vídeo / Live (YouTube) *
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://youtube.com/live/... ou https://youtube.com/watch?v=..."
                  value={formUrl}
                  onChange={(e) => setFormUrl(e.target.value)}
                  className="w-full bg-zinc-950 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-yellow-400"
                />
              </div>

              <div>
                <label className="block text-[11px] font-black text-yellow-300 uppercase mb-1">
                  Recompensas & Cupons Prometidos *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: 💎 50 a 100 Gemas + 🪙 20.000 Moedas"
                  value={formRewards}
                  onChange={(e) => setFormRewards(e.target.value)}
                  className="w-full bg-zinc-950 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-yellow-400"
                />
              </div>

              <div>
                <label className="block text-[11px] font-black text-yellow-300 uppercase mb-1">
                  Dica / Instruções para Resgate
                </label>
                <input
                  type="text"
                  placeholder="Ex: Os códigos aparecem na tela durante o Crazy Run e no chat fixado!"
                  value={formHints}
                  onChange={(e) => setFormHints(e.target.value)}
                  className="w-full bg-zinc-950 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-yellow-400"
                />
              </div>

              <div>
                <label className="block text-[11px] font-black text-yellow-300 uppercase mb-1">
                  URL da Imagem de Capa (Opcional)
                </label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={formBanner}
                  onChange={(e) => setFormBanner(e.target.value)}
                  className="w-full bg-zinc-950 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-yellow-400"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowAdminModal(false)}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-black uppercase cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 bg-gradient-to-r from-yellow-400 to-amber-500 hover:brightness-110 text-zinc-950 rounded-xl text-xs font-black uppercase cursor-pointer shadow-lg active:scale-95 flex items-center gap-1.5"
                >
                  {isSaving ? 'Salvando...' : 'Salvar Transmissão ⚡'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}

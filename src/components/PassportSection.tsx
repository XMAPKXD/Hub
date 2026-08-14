import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import confetti from 'canvas-confetti';
import { 
  PKXDPassport, 
  PassportBadge, 
  PassportStamp, 
  PassportFriend, 
  PassportEventHistory, 
  CommunityEvent 
} from '../types';
import { 
  User, 
  QrCode, 
  Award, 
  BookmarkCheck, 
  Users, 
  Calendar, 
  Share2, 
  Edit3, 
  Sparkles, 
  Copy, 
  Check, 
  Gamepad2, 
  Clock, 
  Trophy, 
  Plus, 
  Trash2, 
  X, 
  CheckCircle2, 
  ExternalLink, 
  Flame, 
  Camera, 
  UploadCloud, 
  ShieldCheck, 
  Star,
  Zap,
  Info
} from 'lucide-react';
import { db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

interface PassportSectionProps {
  currentUser?: any;
  isAdmin: boolean;
  fanXP: number;
  onAddXP?: (amount: number, reason: string) => void;
  triggerAudio?: (type: 'tap' | 'levelUp' | 'spin' | 'success') => void;
  events?: CommunityEvent[];
}

const DEFAULT_BADGES: PassportBadge[] = [
  {
    id: 'badge_pioneer',
    title: 'Pioneiro da Central',
    description: 'Acessou e explorou a plataforma PKC Central.',
    icon: '🌟',
    category: 'community',
    unlocked: true,
    unlockedAt: Date.now() - 30 * 24 * 3600 * 1000,
    rarity: 'Comum'
  },
  {
    id: 'badge_spoiler_hunter',
    title: 'Caçador de Spoilers',
    description: 'Acompanhou os spoilers semanais e reagiu às novidades.',
    icon: '🔮',
    category: 'spoilers',
    unlocked: true,
    unlockedAt: Date.now() - 10 * 24 * 3600 * 1000,
    rarity: 'Raro'
  },
  {
    id: 'badge_active_voter',
    title: 'Cidadão Eleitor',
    description: 'Votou em enquetes e decisões da comunidade.',
    icon: '🗳️',
    category: 'social',
    unlocked: false,
    rarity: 'Comum'
  },
  {
    id: 'badge_event_master',
    title: 'Estrela dos Eventos',
    description: 'Participou ou criou eventos oficiais na Central.',
    icon: '🏆',
    category: 'events',
    unlocked: false,
    rarity: 'Épico'
  },
  {
    id: 'badge_pwa_pro',
    title: 'Aplicativo Instalado',
    description: 'Instalou o PKC Central como aplicativo no celular ou PC.',
    icon: '📱',
    category: 'special',
    unlocked: false,
    rarity: 'Raro'
  },
  {
    id: 'badge_theorist',
    title: 'Teórico da Ilha',
    description: 'Enviou teorias e descobertas sobre o universo de PK XD.',
    icon: '📝',
    category: 'community',
    unlocked: false,
    rarity: 'Épico'
  },
  {
    id: 'badge_code_hunter',
    title: 'Colecionador VIP',
    description: 'Resgatou códigos promocionais de gemas e moedas.',
    icon: '💎',
    category: 'special',
    unlocked: false,
    rarity: 'Raro'
  },
  {
    id: 'badge_friendly',
    title: 'Amigo da Ilha',
    description: 'Conectou amigos ao seu Passaporte PKXD.',
    icon: '🤝',
    category: 'social',
    unlocked: false,
    rarity: 'Comum'
  },
  {
    id: 'badge_legend',
    title: 'Lenda do PK XD',
    description: 'Alcançou o Nível 10+ de fã e conquistou respeito na Ilha.',
    icon: '👑',
    category: 'special',
    unlocked: false,
    rarity: 'Lendário'
  }
];

const DEFAULT_STAMPS: PassportStamp[] = [
  {
    id: 'stamp_central_launch',
    title: 'Abertura PKC Central',
    eventOrSeason: 'Inauguração Oficial',
    location: 'Central Plaza',
    date: 'Agosto 2024',
    icon: '🚀',
    color: '#8b5cf6',
    acquiredAt: Date.now() - 60 * 24 * 3600 * 1000
  },
  {
    id: 'stamp_summer_fest',
    title: 'Festa de Verão & Piscina',
    eventOrSeason: 'Temporada Tropical',
    location: 'Parque Aquático',
    date: '2024',
    icon: '🏖️',
    color: '#06b6d4',
    acquiredAt: Date.now() - 40 * 24 * 3600 * 1000
  },
  {
    id: 'stamp_crazy_run',
    title: 'Campeão Crazy Run',
    eventOrSeason: 'Torneio de Velocidade',
    location: 'Circuito dos Robôs',
    date: '2024',
    icon: '⚡',
    color: '#ec4899',
    acquiredAt: Date.now() - 15 * 24 * 3600 * 1000
  }
];

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1566492031773-4f4e44671857?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=300&q=80'
];

export default function PassportSection({
  currentUser,
  isAdmin,
  fanXP,
  onAddXP,
  triggerAudio,
  events = []
}: PassportSectionProps) {
  // Current user's calculated level
  const userLevel = Math.max(1, Math.floor(fanXP / 100) + 1);
  const currentLevelProgress = fanXP % 100;

  // Active tab inside Passport
  const [activeTab, setActiveTab] = useState<'card' | 'badges' | 'stamps' | 'friends' | 'events'>('card');
  
  // Modals
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddFriendModalOpen, setIsAddFriendModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [selectedBadge, setSelectedBadge] = useState<PassportBadge | null>(null);
  
  // Notifications & Copy state
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedTag, setCopiedTag] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');

  // Friend input form
  const [newFriendTag, setNewFriendTag] = useState('');
  const [newFriendNick, setNewFriendNick] = useState('');
  const [newFriendGame, setNewFriendGame] = useState('Crazy Run');
  const [friendError, setFriendError] = useState('');

  // Loaded passport data
  const [passport, setPassport] = useState<PKXDPassport>(() => {
    const saved = localStorage.getItem('pkxd_passport_data');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          ...parsed,
          level: userLevel,
          xp: fanXP
        };
      } catch (e) {}
    }

    const savedTag = localStorage.getItem('pkxd_player_tag') || 'JOGADOR#000';
    const savedNick = localStorage.getItem('pkxd_nickname') || 'Explorador';

    return {
      id: currentUser?.uid || 'passport_' + Date.now(),
      userId: currentUser?.uid || 'guest_user',
      playerTag: savedTag,
      nickname: savedNick,
      avatarUrl: currentUser?.photoURL || 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?auto=format&fit=crop&w=300&q=80',
      bio: 'Apaixonado por PK XD! Adoro disputar no Crazy Run, personalizar minha casa e curtir eventos com a galera!',
      title: isAdmin ? 'Lorde da Moderação' : 'Explorador da Ilha',
      level: userLevel,
      xp: fanXP,
      joinedAt: Date.now() - 45 * 24 * 3600 * 1000,
      timeInCommunity: 'Membro Ativo (6 meses)',
      favoriteMinigame: 'Crazy Run',
      houseTheme: 'Mansão Gamer',
      cardTheme: 'neon-purple',
      badges: DEFAULT_BADGES,
      stamps: DEFAULT_STAMPS,
      friends: [
        {
          id: 'friend_1',
          playerTag: 'LUNA#245',
          nickname: 'LunaStar',
          avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
          level: 8,
          addedAt: Date.now() - 20 * 24 * 3600 * 1000,
          favoriteMinigame: 'Desfile da Ilha'
        },
        {
          id: 'friend_2',
          playerTag: 'NINJA#999',
          nickname: 'NinjaPro',
          avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
          level: 12,
          addedAt: Date.now() - 10 * 24 * 3600 * 1000,
          favoriteMinigame: 'Crazy Run'
        }
      ],
      eventHistory: [
        {
          id: 'hist_1',
          eventId: 'event_launch',
          eventName: 'Mega Encontro de Criadores',
          role: 'participante',
          date: '10/08/2024',
          category: 'Festas'
        }
      ],
      isPublic: true,
      updatedAt: Date.now()
    };
  });

  // Edit form states
  const [editNick, setEditNick] = useState(passport.nickname);
  const [editTag, setEditTag] = useState(passport.playerTag);
  const [editBio, setEditBio] = useState(passport.bio);
  const [editTitle, setEditTitle] = useState(passport.title);
  const [editMinigame, setEditMinigame] = useState(passport.favoriteMinigame);
  const [editHouse, setEditHouse] = useState(passport.houseTheme);
  const [editTheme, setEditTheme] = useState(passport.cardTheme);
  const [editAvatar, setEditAvatar] = useState(passport.avatarUrl);

  // Sync with Firestore & localStorage
  const savePassport = async (updated: PKXDPassport) => {
    setPassport(updated);
    try {
      localStorage.setItem('pkxd_passport_data', JSON.stringify(updated));
      localStorage.setItem('pkxd_player_tag', updated.playerTag);
      localStorage.setItem('pkxd_nickname', updated.nickname);
    } catch (e) {}

    try {
      if (db && currentUser?.uid) {
        await setDoc(doc(db, 'user_passports', currentUser.uid), updated);
      }
    } catch (err) {
      console.warn('Could not sync passport to Firestore:', err);
    }
  };

  // Generate QR Code on load and when tag changes
  useEffect(() => {
    const passportUrl = `${window.location.origin}/?passaporte=${encodeURIComponent(passport.playerTag || passport.nickname)}`;
    QRCode.toDataURL(passportUrl, {
      width: 280,
      margin: 2,
      color: {
        dark: '#7c3aed',
        light: '#ffffff'
      }
    })
      .then(url => {
        setQrCodeDataUrl(url);
      })
      .catch(err => {
        console.error('Error generating QR code:', err);
      });
  }, [passport.playerTag, passport.nickname]);

  // Sync Level with FanXP updates
  useEffect(() => {
    if (passport.level !== userLevel || passport.xp !== fanXP) {
      setPassport(prev => {
        const nextBadges = [...prev.badges];
        if (userLevel >= 10) {
          const legendBadge = nextBadges.find(b => b.id === 'badge_legend');
          if (legendBadge && !legendBadge.unlocked) {
            legendBadge.unlocked = true;
            legendBadge.unlockedAt = Date.now();
          }
        }
        return {
          ...prev,
          level: userLevel,
          xp: fanXP,
          badges: nextBadges
        };
      });
    }
  }, [fanXP, userLevel]);

  // Check badges for PWA installation or other triggers
  useEffect(() => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    if (isStandalone) {
      setPassport(prev => {
        const nextBadges = prev.badges.map(b => {
          if (b.id === 'badge_pwa_pro' && !b.unlocked) {
            return { ...b, unlocked: true, unlockedAt: Date.now() };
          }
          return b;
        });
        return { ...prev, badges: nextBadges };
      });
    }
  }, []);

  // Handle Edit form submission
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (triggerAudio) triggerAudio('tap');

    const updated: PKXDPassport = {
      ...passport,
      nickname: editNick.trim() || passport.nickname,
      playerTag: editTag.trim().toUpperCase() || passport.playerTag,
      bio: editBio.trim() || passport.bio,
      title: editTitle.trim() || passport.title,
      favoriteMinigame: editMinigame,
      houseTheme: editHouse.trim() || passport.houseTheme,
      cardTheme: editTheme,
      avatarUrl: editAvatar,
      updatedAt: Date.now()
    };

    savePassport(updated);
    setIsEditModalOpen(false);

    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.6 }
    });

    if (onAddXP) onAddXP(20, 'Atualizou o Passaporte PKXD');
  };

  // Handle Image Upload for avatar
  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('A imagem deve ter no máximo 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        setEditAvatar(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  // Add friend
  const handleAddFriend = (e: React.FormEvent) => {
    e.preventDefault();
    if (triggerAudio) triggerAudio('tap');

    const cleanTag = newFriendTag.trim().toUpperCase();
    if (!cleanTag || !cleanTag.includes('#')) {
      setFriendError('Digite a Tag completa com # (ex: LUNA#123)');
      return;
    }

    if (passport.friends.some(f => f.playerTag.toUpperCase() === cleanTag)) {
      setFriendError('Esse amigo já está na sua lista!');
      return;
    }

    const newFriend: PassportFriend = {
      id: 'friend_' + Date.now(),
      playerTag: cleanTag,
      nickname: newFriendNick.trim() || cleanTag.split('#')[0],
      avatarUrl: PRESET_AVATARS[Math.floor(Math.random() * PRESET_AVATARS.length)],
      level: Math.floor(Math.random() * 15) + 1,
      addedAt: Date.now(),
      favoriteMinigame: newFriendGame
    };

    const updatedFriends = [newFriend, ...passport.friends];
    
    // Unlock friendly badge if 3+ friends
    const updatedBadges = passport.badges.map(b => {
      if (b.id === 'badge_friendly' && updatedFriends.length >= 3 && !b.unlocked) {
        return { ...b, unlocked: true, unlockedAt: Date.now() };
      }
      return b;
    });

    const updated: PKXDPassport = {
      ...passport,
      friends: updatedFriends,
      badges: updatedBadges,
      updatedAt: Date.now()
    };

    savePassport(updated);
    setNewFriendTag('');
    setNewFriendNick('');
    setFriendError('');
    setIsAddFriendModalOpen(false);

    confetti({
      particleCount: 40,
      spread: 50,
      origin: { y: 0.7 }
    });

    if (onAddXP) onAddXP(15, 'Adicionou amigo ao Passaporte');
  };

  // Remove friend
  const handleRemoveFriend = (friendId: string) => {
    if (confirm('Deseja remover este amigo da sua lista do passaporte?')) {
      const updatedFriends = passport.friends.filter(f => f.id !== friendId);
      const updated = {
        ...passport,
        friends: updatedFriends,
        updatedAt: Date.now()
      };
      savePassport(updated);
    }
  };

  // Copy Profile Link
  const handleCopyLink = () => {
    const passportUrl = `${window.location.origin}/?passaporte=${encodeURIComponent(passport.playerTag)}`;
    navigator.clipboard.writeText(passportUrl).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
      if (triggerAudio) triggerAudio('tap');
    });
  };

  // Copy Player Tag
  const handleCopyTag = () => {
    navigator.clipboard.writeText(passport.playerTag).then(() => {
      setCopiedTag(true);
      setTimeout(() => setCopiedTag(false), 2500);
      if (triggerAudio) triggerAudio('tap');
    });
  };

  // Get theme card gradients
  const getThemeGradients = (theme: PKXDPassport['cardTheme']) => {
    switch (theme) {
      case 'cyber-blue':
        return 'from-blue-600 via-indigo-900 to-cyan-900 border-cyan-400/50 shadow-cyan-500/20';
      case 'golden-vip':
        return 'from-amber-600 via-yellow-900 to-zinc-950 border-yellow-400/60 shadow-yellow-500/25';
      case 'sunset-pink':
        return 'from-pink-600 via-purple-900 to-rose-950 border-pink-400/50 shadow-pink-500/20';
      case 'emerald-gamer':
        return 'from-emerald-600 via-teal-900 to-zinc-950 border-emerald-400/50 shadow-emerald-500/20';
      case 'neon-purple':
      default:
        return 'from-purple-700 via-indigo-950 to-pink-950 border-purple-500/50 shadow-purple-500/25';
    }
  };

  return (
    <div className="space-y-6 text-left animate-fade-in">
      {/* Top Banner & Title */}
      <div className="bg-gradient-to-r from-purple-950 via-zinc-900 to-indigo-950 border-2 border-purple-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-purple-500/15 rounded-full filter blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-36 h-36 bg-pink-500/10 rounded-full filter blur-2xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-pink-500/20 to-purple-500/20 border border-pink-500/30 px-3.5 py-1 rounded-full text-pink-300 font-mono text-[10px] font-black uppercase tracking-widest">
              <Sparkles className="w-3.5 h-3.5 text-yellow-300 animate-spin-slow" />
              Identidade Digital da Comunidade
            </div>
            <h2 className="font-sans font-black text-2xl sm:text-4xl text-white uppercase tracking-tight leading-tight">
              PASSAPORTE <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-purple-300 to-cyan-400">PK XD</span> 🛂
            </h2>
            <p className="font-sans text-xs sm:text-sm text-gray-300 max-w-xl leading-relaxed">
              Seu registro oficial na Ilha! Colecione medalhas, selos de eventos, adicione amigos, suba de nível com suas atividades e gere seu QR Code exclusivo para compartilhar!
            </p>
          </div>

          {/* Quick Action Controls */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 flex-shrink-0">
            <button
              onClick={() => {
                if (triggerAudio) triggerAudio('tap');
                setEditNick(passport.nickname);
                setEditTag(passport.playerTag);
                setEditBio(passport.bio);
                setEditTitle(passport.title);
                setEditMinigame(passport.favoriteMinigame);
                setEditHouse(passport.houseTheme);
                setEditTheme(passport.cardTheme);
                setEditAvatar(passport.avatarUrl);
                setIsEditModalOpen(true);
              }}
              className="px-4 py-2.5 bg-purple-600/30 hover:bg-purple-600/50 border border-purple-400/30 hover:border-purple-400 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center gap-2 cursor-pointer active:scale-95 shadow-md"
            >
              <Edit3 className="w-4 h-4 text-purple-300" />
              <span>Editar Perfil</span>
            </button>

            <button
              onClick={() => {
                if (triggerAudio) triggerAudio('tap');
                setIsShareModalOpen(true);
              }}
              className="px-4 py-2.5 bg-gradient-to-r from-pink-500 to-purple-600 hover:brightness-110 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all flex items-center gap-2 cursor-pointer active:scale-95 shadow-lg"
            >
              <QrCode className="w-4 h-4" />
              <span>QR Code & Link</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 select-none">
        <button
          onClick={() => {
            if (triggerAudio) triggerAudio('tap');
            setActiveTab('card');
          }}
          className={`py-3 px-3 rounded-2xl border-2 font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md ${
            activeTab === 'card'
              ? 'bg-purple-600 text-white border-purple-400 shadow-[0_4px_15px_rgba(147,51,234,0.3)] scale-[1.02]'
              : 'bg-zinc-900/80 text-gray-400 border-white/5 hover:border-purple-500/30 hover:text-white'
          }`}
        >
          <User className="w-4 h-4" />
          <span>Cartão ID</span>
        </button>

        <button
          onClick={() => {
            if (triggerAudio) triggerAudio('tap');
            setActiveTab('badges');
          }}
          className={`py-3 px-3 rounded-2xl border-2 font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md ${
            activeTab === 'badges'
              ? 'bg-purple-600 text-white border-purple-400 shadow-[0_4px_15px_rgba(147,51,234,0.3)] scale-[1.02]'
              : 'bg-zinc-900/80 text-gray-400 border-white/5 hover:border-purple-500/30 hover:text-white'
          }`}
        >
          <Award className="w-4 h-4 text-yellow-300" />
          <span>Medalhas ({passport.badges.filter(b => b.unlocked).length}/{passport.badges.length})</span>
        </button>

        <button
          onClick={() => {
            if (triggerAudio) triggerAudio('tap');
            setActiveTab('stamps');
          }}
          className={`py-3 px-3 rounded-2xl border-2 font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md ${
            activeTab === 'stamps'
              ? 'bg-purple-600 text-white border-purple-400 shadow-[0_4px_15px_rgba(147,51,234,0.3)] scale-[1.02]'
              : 'bg-zinc-900/80 text-gray-400 border-white/5 hover:border-purple-500/30 hover:text-white'
          }`}
        >
          <BookmarkCheck className="w-4 h-4 text-cyan-300" />
          <span>Selos ({passport.stamps.length})</span>
        </button>

        <button
          onClick={() => {
            if (triggerAudio) triggerAudio('tap');
            setActiveTab('friends');
          }}
          className={`py-3 px-3 rounded-2xl border-2 font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md ${
            activeTab === 'friends'
              ? 'bg-purple-600 text-white border-purple-400 shadow-[0_4px_15px_rgba(147,51,234,0.3)] scale-[1.02]'
              : 'bg-zinc-900/80 text-gray-400 border-white/5 hover:border-purple-500/30 hover:text-white'
          }`}
        >
          <Users className="w-4 h-4 text-pink-300" />
          <span>Amigos ({passport.friends.length})</span>
        </button>

        <button
          onClick={() => {
            if (triggerAudio) triggerAudio('tap');
            setActiveTab('events');
          }}
          className={`py-3 px-3 rounded-2xl border-2 font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md col-span-2 sm:col-span-1 ${
            activeTab === 'events'
              ? 'bg-purple-600 text-white border-purple-400 shadow-[0_4px_15px_rgba(147,51,234,0.3)] scale-[1.02]'
              : 'bg-zinc-900/80 text-gray-400 border-white/5 hover:border-purple-500/30 hover:text-white'
          }`}
        >
          <Calendar className="w-4 h-4 text-emerald-300" />
          <span>Eventos</span>
        </button>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: VISUAL PASSPORT CARD (HOLOGRAPHIC OFFICIAL CARD) */}
      {/* ========================================================= */}
      {activeTab === 'card' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Main Holographic Card */}
          <div className="lg:col-span-7">
            <div className={`bg-gradient-to-br ${getThemeGradients(passport.cardTheme)} border-2 rounded-3xl p-6 sm:p-8 text-white shadow-2xl relative overflow-hidden transition-all duration-300`}>
              {/* Card Holographic Watermark & Noise */}
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full filter blur-xl pointer-events-none" />
              <div className="absolute top-1/2 left-0 w-32 h-32 bg-purple-500/20 rounded-full filter blur-2xl pointer-events-none" />
              <div className="absolute bottom-2 right-4 font-mono text-[9px] text-white/30 uppercase tracking-widest select-none">
                PKXD CITIZENSHIP CARD • ID #{passport.playerTag.replace('#', '')}
              </div>

              {/* Card Top Header */}
              <div className="flex items-center justify-between border-b border-white/15 pb-4 mb-5">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30">
                    <ShieldCheck className="w-5 h-5 text-yellow-300" />
                  </div>
                  <div>
                    <h3 className="font-sans font-black text-sm tracking-wider uppercase">
                      REPÚBLICA DE PK XD
                    </h3>
                    <p className="font-mono text-[9px] text-white/70 uppercase tracking-widest">
                      PASSAPORTE OFICIAL DA COMUNIDADE
                    </p>
                  </div>
                </div>

                <div className="px-3 py-1 bg-black/40 backdrop-blur-md border border-white/20 rounded-full font-mono font-bold text-xs text-yellow-300 flex items-center gap-1.5 shadow-sm">
                  <Flame className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                  <span>NÍVEL {passport.level}</span>
                </div>
              </div>

              {/* Card Main Body */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
                {/* Avatar with Ring */}
                <div className="relative group flex-shrink-0">
                  <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden border-2 border-white/40 shadow-xl bg-black/60 p-1">
                    <img 
                      src={passport.avatarUrl} 
                      alt={passport.nickname} 
                      className="w-full h-full object-cover rounded-xl"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        (e.target as any).src = 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?auto=format&fit=crop&w=300&q=80';
                      }}
                    />
                  </div>
                  <div className="absolute -bottom-2 -right-2 bg-yellow-400 text-black font-black text-[10px] px-2 py-0.5 rounded-md shadow uppercase">
                    LVL {passport.level}
                  </div>
                </div>

                {/* Info and Tags */}
                <div className="flex-1 text-center sm:text-left space-y-2">
                  <div className="space-y-0.5">
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                      <h4 className="font-sans font-black text-xl sm:text-2xl tracking-tight uppercase text-white drop-shadow-sm">
                        {passport.nickname}
                      </h4>
                      <button
                        onClick={handleCopyTag}
                        className="px-2 py-0.5 bg-black/40 hover:bg-black/60 border border-white/20 rounded-md font-mono text-xs font-bold text-cyan-300 flex items-center gap-1 cursor-pointer transition-all active:scale-95"
                        title="Clique para copiar a Tag"
                      >
                        <span>{passport.playerTag}</span>
                        {copiedTag ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                    
                    <p className="font-sans font-extrabold text-xs text-yellow-300 uppercase tracking-wide flex items-center justify-center sm:justify-start gap-1">
                      <Sparkles className="w-3 h-3 text-yellow-300" />
                      <span>{passport.title}</span>
                    </p>
                  </div>

                  <p className="font-sans text-xs text-white/85 leading-relaxed italic bg-black/20 p-2.5 rounded-xl border border-white/10">
                    "{passport.bio}"
                  </p>

                  {/* Level Progress Bar */}
                  <div className="space-y-1 pt-1">
                    <div className="flex justify-between text-[10px] font-mono text-white/80">
                      <span>Progresso Nível {passport.level}</span>
                      <span>{fanXP} XP Total ({currentLevelProgress}/100 para Lv.{passport.level + 1})</span>
                    </div>
                    <div className="w-full h-2.5 bg-black/40 rounded-full overflow-hidden p-0.5 border border-white/20">
                      <div 
                        className="h-full bg-gradient-to-r from-yellow-300 via-pink-400 to-cyan-300 rounded-full transition-all duration-500"
                        style={{ width: `${currentLevelProgress}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Card Meta Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mt-6 pt-4 border-t border-white/15 text-xs font-sans">
                <div className="bg-black/30 p-2.5 rounded-xl border border-white/10 space-y-0.5">
                  <span className="text-[10px] uppercase font-mono font-bold text-white/60 block">🎮 Minigame Favorito</span>
                  <strong className="text-white text-xs truncate block">{passport.favoriteMinigame}</strong>
                </div>

                <div className="bg-black/30 p-2.5 rounded-xl border border-white/10 space-y-0.5">
                  <span className="text-[10px] uppercase font-mono font-bold text-white/60 block">🏠 Estilo de Casa</span>
                  <strong className="text-white text-xs truncate block">{passport.houseTheme}</strong>
                </div>

                <div className="bg-black/30 p-2.5 rounded-xl border border-white/10 space-y-0.5 col-span-2 sm:col-span-1">
                  <span className="text-[10px] uppercase font-mono font-bold text-white/60 block">⏱️ Na Comunidade</span>
                  <strong className="text-white text-xs truncate block">{passport.timeInCommunity}</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Side Info: QR Code + Quick Stats & Badges Highlight */}
          <div className="lg:col-span-5 space-y-5">
            {/* QR Code Card */}
            <div className="bg-zinc-900/90 border border-purple-500/30 rounded-3xl p-5 sm:p-6 text-center space-y-4 shadow-xl relative overflow-hidden">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2 text-purple-300 font-black text-xs uppercase tracking-wider">
                  <QrCode className="w-4 h-4" />
                  <span>QR Code do Passaporte</span>
                </div>
                <span className="text-[9px] font-mono text-gray-400">Escaneie para ver perfil</span>
              </div>

              {qrCodeDataUrl ? (
                <div className="w-44 h-44 mx-auto bg-white p-2.5 rounded-2xl shadow-xl border-2 border-purple-500/30 hover:scale-105 transition-transform duration-300 flex items-center justify-center">
                  <img src={qrCodeDataUrl} alt="Passport QR Code" className="w-full h-full object-contain" />
                </div>
              ) : (
                <div className="w-44 h-44 mx-auto bg-neutral-800 rounded-2xl flex items-center justify-center text-xs text-gray-400 animate-pulse">
                  Gerando QR Code...
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={handleCopyLink}
                  className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs uppercase rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 shadow-md"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedLink ? 'Link Copiado!' : 'Copiar Link'}</span>
                </button>

                <button
                  onClick={() => setIsShareModalOpen(true)}
                  className="py-2.5 px-4 bg-zinc-800 hover:bg-zinc-700 text-purple-300 border border-purple-500/30 font-bold text-xs uppercase rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer active:scale-95"
                >
                  <Share2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Quick Badges Highlights */}
            <div className="bg-zinc-900/70 border border-white/10 rounded-3xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-sans font-black text-xs text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Trophy className="w-4 h-4 text-yellow-400" />
                  <span>Destaques de Medalhas</span>
                </h4>
                <button
                  onClick={() => setActiveTab('badges')}
                  className="text-[10px] font-mono text-pink-400 hover:text-pink-300 hover:underline cursor-pointer uppercase"
                >
                  Ver Todas →
                </button>
              </div>

              <div className="grid grid-cols-4 gap-2">
                {passport.badges.slice(0, 4).map((badge) => (
                  <div
                    key={badge.id}
                    onClick={() => setSelectedBadge(badge)}
                    className={`p-2.5 rounded-2xl border flex flex-col items-center justify-center text-center cursor-pointer transition-all hover:scale-105 ${
                      badge.unlocked
                        ? 'bg-purple-950/40 border-purple-500/40 shadow-sm'
                        : 'bg-black/40 border-white/5 opacity-40 grayscale'
                    }`}
                  >
                    <span className="text-2xl mb-1">{badge.icon}</span>
                    <span className="text-[9px] font-bold text-white truncate max-w-full">{badge.title}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: MEDALHAS & CONQUISTAS (BADGES) */}
      {/* ========================================================= */}
      {activeTab === 'badges' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-zinc-900/60 p-4 rounded-2xl border border-white/10">
            <div>
              <h3 className="font-sans font-black text-base text-white uppercase tracking-wider flex items-center gap-2">
                <Award className="w-5 h-5 text-yellow-400" />
                Mural de Medalhas & Conquistas
              </h3>
              <p className="text-xs text-gray-400">
                Ganhe XP, participe de enquetes, adicione amigos e explore a Central para desbloquear todas as medalhas!
              </p>
            </div>
            <div className="px-3 py-1.5 bg-yellow-500/10 border border-yellow-500/30 rounded-xl font-mono text-xs font-bold text-yellow-300 self-start sm:self-center">
              Desbloqueadas: {passport.badges.filter(b => b.unlocked).length} / {passport.badges.length}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {passport.badges.map((badge) => (
              <div
                key={badge.id}
                onClick={() => setSelectedBadge(badge)}
                className={`p-5 rounded-2xl border-2 transition-all flex items-start gap-4 cursor-pointer relative overflow-hidden ${
                  badge.unlocked
                    ? 'bg-zinc-900/90 border-purple-500/40 hover:border-purple-400 shadow-lg hover:shadow-purple-500/10'
                    : 'bg-zinc-950/60 border-white/5 opacity-55 hover:opacity-75'
                }`}
              >
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0 border ${
                  badge.unlocked 
                    ? 'bg-gradient-to-br from-purple-800 to-indigo-900 border-purple-400/40 shadow-inner' 
                    : 'bg-zinc-900 border-white/10 grayscale'
                }`}>
                  {badge.icon}
                </div>

                <div className="space-y-1 flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-sans font-black text-sm text-white uppercase">
                      {badge.title}
                    </h4>
                    <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full uppercase font-bold ${
                      badge.rarity === 'Lendário'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : badge.rarity === 'Épico'
                          ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                          : badge.rarity === 'Raro'
                            ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                            : 'bg-neutral-800 text-gray-400'
                    }`}>
                      {badge.rarity || 'Comum'}
                    </span>
                  </div>

                  <p className="text-xs text-gray-300 leading-relaxed">
                    {badge.description}
                  </p>

                  <div className="pt-2 flex items-center justify-between text-[10px] font-mono">
                    {badge.unlocked ? (
                      <span className="text-emerald-400 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Desbloqueada
                      </span>
                    ) : (
                      <span className="text-gray-500 font-bold">
                        🔒 Bloqueada
                      </span>
                    )}
                    <span className="text-purple-300 hover:underline">Ver detalhes →</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: SELOS ESPECIAIS & CARIMBOS (STAMPS) */}
      {/* ========================================================= */}
      {activeTab === 'stamps' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-zinc-900/60 p-4 rounded-2xl border border-white/10">
            <div>
              <h3 className="font-sans font-black text-base text-white uppercase tracking-wider flex items-center gap-2">
                <BookmarkCheck className="w-5 h-5 text-cyan-400" />
                Caderno de Carimbos & Selos da Ilha
              </h3>
              <p className="text-xs text-gray-400">
                Colecione os carimbos oficiais emitidos em temporadas comemorativas e grandes eventos de PK XD!
              </p>
            </div>
            <div className="px-3 py-1.5 bg-cyan-500/10 border border-cyan-500/30 rounded-xl font-mono text-xs font-bold text-cyan-300 self-start sm:self-center">
              Selos Colecionados: {passport.stamps.length}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {passport.stamps.map((stamp) => (
              <div
                key={stamp.id}
                className="bg-zinc-900/80 border-2 border-white/10 hover:border-cyan-500/40 rounded-3xl p-5 relative overflow-hidden transition-all shadow-lg group"
              >
                {/* Stamp visual decorative border */}
                <div className="border-2 border-dashed border-cyan-500/30 rounded-2xl p-4 bg-black/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-4xl filter drop-shadow">{stamp.icon}</span>
                    <span className="text-[10px] font-mono bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 px-2 py-0.5 rounded-full font-bold uppercase">
                      {stamp.date}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <h4 className="font-sans font-black text-sm text-white uppercase tracking-wide">
                      {stamp.title}
                    </h4>
                    <p className="text-[11px] text-gray-400">
                      Temporada: <strong className="text-cyan-300">{stamp.eventOrSeason}</strong>
                    </p>
                    <p className="text-[10px] text-gray-500 font-mono">
                      📍 Local: {stamp.location}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[10px] font-mono text-gray-400">
                    <span>CARIMBO AUTÊNTICO</span>
                    <span className="text-emerald-400 font-bold">✓ VÁLIDO</span>
                  </div>
                </div>
              </div>
            ))}

            {/* Claim New Stamp Card */}
            <div className="border-2 border-dashed border-purple-500/30 bg-purple-950/10 rounded-3xl p-6 flex flex-col items-center justify-center text-center space-y-3 hover:bg-purple-950/20 transition-all">
              <div className="w-12 h-12 rounded-full bg-purple-500/20 text-purple-300 flex items-center justify-center">
                <Sparkles className="w-6 h-6 animate-pulse" />
              </div>
              <h4 className="font-sans font-black text-sm text-white uppercase">Novo Carimbo em Breve!</h4>
              <p className="text-xs text-gray-400 max-w-xs">
                Participe dos eventos ao vivo na Central de Eventos para receber novos carimbos de temporada!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 4: AMIGOS DA ILHA (FRIENDS LIST) */}
      {/* ========================================================= */}
      {activeTab === 'friends' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-900/60 p-4 rounded-2xl border border-white/10">
            <div>
              <h3 className="font-sans font-black text-base text-white uppercase tracking-wider flex items-center gap-2">
                <Users className="w-5 h-5 text-pink-400" />
                Amigos Conectados no Passaporte
              </h3>
              <p className="text-xs text-gray-400">
                Adicione as Tags de PK XD dos seus amigos para acompanhar seus níveis e minigames favoritos!
              </p>
            </div>
            <button
              onClick={() => {
                if (triggerAudio) triggerAudio('tap');
                setFriendError('');
                setIsAddFriendModalOpen(true);
              }}
              className="px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600 hover:brightness-110 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center gap-2 cursor-pointer active:scale-95 shadow-md self-start sm:self-center"
            >
              <Plus className="w-4 h-4" />
              <span>Adicionar Amigo</span>
            </button>
          </div>

          {passport.friends.length === 0 ? (
            <div className="text-center py-12 bg-zinc-900/40 rounded-3xl border border-dashed border-white/10 space-y-3">
              <Users className="w-12 h-12 text-gray-500 mx-auto" />
              <h4 className="font-sans font-bold text-white text-sm">Nenhum amigo adicionado ainda</h4>
              <p className="text-xs text-gray-400 max-w-sm mx-auto">
                Clique no botão "Adicionar Amigo" acima e insira a Tag de PK XD dos seus colegas de jogo!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {passport.friends.map((friend) => (
                <div
                  key={friend.id}
                  className="bg-zinc-900/80 border border-white/10 hover:border-pink-500/40 rounded-2xl p-4 flex items-center justify-between gap-3 shadow-md transition-all group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-12 h-12 rounded-xl overflow-hidden bg-black/60 border border-white/20 flex-shrink-0">
                      <img 
                        src={friend.avatarUrl || PRESET_AVATARS[0]} 
                        alt={friend.nickname} 
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>

                    <div className="min-w-0 space-y-0.5">
                      <h4 className="font-sans font-black text-sm text-white truncate">
                        {friend.nickname}
                      </h4>
                      <p className="font-mono text-xs text-cyan-300 font-bold">
                        {friend.playerTag}
                      </p>
                      <p className="text-[10px] text-gray-400 truncate">
                        🎮 {friend.favoriteMinigame || 'Crazy Run'} • Nível {friend.level || 5}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleRemoveFriend(friend.id)}
                    className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all cursor-pointer flex-shrink-0"
                    title="Remover Amigo"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 5: HISTÓRICO DE EVENTOS */}
      {/* ========================================================= */}
      {activeTab === 'events' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-zinc-900/60 p-4 rounded-2xl border border-white/10">
            <div>
              <h3 className="font-sans font-black text-base text-white uppercase tracking-wider flex items-center gap-2">
                <Calendar className="w-5 h-5 text-emerald-400" />
                Histórico de Participação em Eventos
              </h3>
              <p className="text-xs text-gray-400">
                Veja o histórico de eventos que você organizou ou confirmou presença na plataforma!
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {passport.eventHistory.map((hist) => (
              <div
                key={hist.id}
                className="bg-zinc-900/80 border border-white/10 hover:border-emerald-500/40 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold flex-shrink-0">
                    <Trophy className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-sans font-bold text-sm text-white">
                      {hist.eventName}
                    </h4>
                    <p className="text-xs text-gray-400">
                      Função: <span className="text-emerald-400 font-bold uppercase">{hist.role}</span> • Categoria: {hist.category}
                    </p>
                  </div>
                </div>

                <span className="font-mono text-xs text-gray-400 bg-black/40 px-3 py-1 rounded-xl border border-white/5 self-start sm:self-auto">
                  📅 {hist.date}
                </span>
              </div>
            ))}

            {events.length > 0 && (
              <div className="p-4 bg-purple-950/20 border border-purple-500/20 rounded-2xl flex items-center justify-between">
                <div className="text-xs text-gray-300">
                  <span>Há <strong>{events.length} eventos comunitários</strong> disponíveis na Central de Eventos!</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: EDITAR PERFIL DO PASSAPORTE */}
      {/* ========================================================= */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in overflow-y-auto">
          <div className="bg-zinc-900 border-2 border-purple-500/50 rounded-3xl p-6 sm:p-8 w-full max-w-lg relative shadow-2xl space-y-5 my-8 text-left">
            <button
              onClick={() => setIsEditModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-full cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 text-purple-400">
              <Edit3 className="w-5 h-5" />
              <h3 className="font-sans font-black text-lg text-white uppercase tracking-wider">
                Editar Passaporte PKXD ✏️
              </h3>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold uppercase text-neutral-400">Nickname no PK XD *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Koosh"
                    value={editNick}
                    onChange={(e) => setEditNick(e.target.value)}
                    className="w-full px-3 py-2 bg-black/50 border border-white/15 rounded-xl text-xs text-white font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold uppercase text-neutral-400">Identificador / Tag *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: KOOSH#000"
                    value={editTag}
                    onChange={(e) => setEditTag(e.target.value)}
                    className="w-full px-3 py-2 bg-black/50 border border-white/15 rounded-xl text-xs text-white font-mono font-bold uppercase"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-extrabold uppercase text-neutral-400">Título de Cidadão</label>
                <select
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-800 border border-white/15 rounded-xl text-xs text-white font-bold cursor-pointer"
                >
                  <option value="Explorador da Ilha">🌟 Explorador da Ilha</option>
                  <option value="Caçador de Spoilers">🔮 Caçador de Spoilers</option>
                  <option value="Mestre dos Mini-Games">🏆 Mestre dos Mini-Games</option>
                  <option value="Lenda do PK XD">👑 Lenda do PK XD</option>
                  <option value="Creator Estrela">⭐ Creator Estrela</option>
                  <option value="Arquiteto de Casas">🏠 Arquiteto de Casas</option>
                  <option value="Piloto do Crazy Run">⚡ Piloto do Crazy Run</option>
                  {isAdmin && <option value="Lorde da Moderação">🛡️ Lorde da Moderação</option>}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-extrabold uppercase text-neutral-400">Bio do Perfil</label>
                <textarea
                  rows={2}
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  placeholder="Conte um pouco sobre suas aventuras no PK XD..."
                  className="w-full px-3 py-2 bg-black/50 border border-white/15 rounded-xl text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold uppercase text-neutral-400">Minigame Favorito</label>
                  <select
                    value={editMinigame}
                    onChange={(e) => setEditMinigame(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-800 border border-white/15 rounded-xl text-xs text-white font-bold cursor-pointer"
                  >
                    <option value="Crazy Run">⚡ Crazy Run</option>
                    <option value="Corrida de Pets">🐾 Corrida de Pets</option>
                    <option value="Desfile da Ilha">👗 Desfile da Ilha</option>
                    <option value="Entrega de Pizza">🍕 Entrega de Pizza</option>
                    <option value="Robô Gigante">🤖 Robô Gigante</option>
                    <option value="Glider Voador">🪂 Glider Voador</option>
                    <option value="Juice Bar">🍹 Juice Bar</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold uppercase text-neutral-400">Estilo de Casa</label>
                  <input
                    type="text"
                    value={editHouse}
                    onChange={(e) => setEditHouse(e.target.value)}
                    placeholder="Ex: Mansão Gamer, Castelo Mágico"
                    className="w-full px-3 py-2 bg-black/50 border border-white/15 rounded-xl text-xs text-white font-bold"
                  />
                </div>
              </div>

              {/* Card Theme Selection */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold uppercase text-neutral-400">Tema Visual do Cartão</label>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                  {[
                    { id: 'neon-purple', label: 'Neon Purple', color: 'bg-purple-600' },
                    { id: 'cyber-blue', label: 'Cyber Blue', color: 'bg-cyan-600' },
                    { id: 'golden-vip', label: 'Golden VIP', color: 'bg-yellow-600' },
                    { id: 'sunset-pink', label: 'Sunset Pink', color: 'bg-pink-600' },
                    { id: 'emerald-gamer', label: 'Emerald', color: 'bg-emerald-600' }
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setEditTheme(t.id as any)}
                      className={`p-2 rounded-xl border text-[10px] font-bold text-white flex flex-col items-center gap-1 cursor-pointer transition-all ${
                        editTheme === t.id ? 'border-white scale-105 shadow-md' : 'border-white/10 opacity-60'
                      }`}
                    >
                      <span className={`w-4 h-4 rounded-full ${t.color}`} />
                      <span className="truncate max-w-full">{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Avatar Upload */}
              <div className="space-y-2 border border-white/10 bg-black/30 p-3 rounded-2xl">
                <label className="block text-[10px] font-extrabold uppercase text-neutral-400">Foto do Avatar</label>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl overflow-hidden border border-white/20 bg-black flex-shrink-0">
                    <img src={editAvatar} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                  <label className="flex-1 flex items-center justify-center gap-2 border border-dashed border-purple-500/40 bg-purple-500/10 hover:bg-purple-500/20 py-2.5 px-3 rounded-xl text-xs font-bold text-purple-300 cursor-pointer transition-all">
                    <UploadCloud className="w-4 h-4" />
                    <span>Enviar Foto do Celular / PC</span>
                    <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                  </label>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="flex-1 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-bold uppercase rounded-xl transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 hover:brightness-110 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-md"
                >
                  Salvar Alterações ✨
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: ADICIONAR AMIGO */}
      {/* ========================================================= */}
      {isAddFriendModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-zinc-900 border-2 border-pink-500/50 rounded-3xl p-6 sm:p-8 w-full max-w-md relative shadow-2xl space-y-4 text-left">
            <button
              onClick={() => setIsAddFriendModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-full cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 text-pink-400">
              <Users className="w-5 h-5" />
              <h3 className="font-sans font-black text-lg text-white uppercase tracking-wider">
                Adicionar Amigo PKXD 🤝
              </h3>
            </div>

            <form onSubmit={handleAddFriend} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold uppercase text-neutral-400">Tag de PK XD do Amigo *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: LUNA#245 ou GABRIEL#000"
                  value={newFriendTag}
                  onChange={(e) => setNewFriendTag(e.target.value)}
                  className="w-full px-3 py-2.5 bg-black/60 border border-white/15 rounded-xl text-sm text-white font-mono font-bold uppercase"
                />
                <p className="text-[10px] text-neutral-400">Digite exatamente com o # e os números.</p>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-extrabold uppercase text-neutral-400">Nome / Apelido (Opcional)</label>
                <input
                  type="text"
                  placeholder="Ex: Luna"
                  value={newFriendNick}
                  onChange={(e) => setNewFriendNick(e.target.value)}
                  className="w-full px-3 py-2 bg-black/60 border border-white/15 rounded-xl text-xs text-white font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-extrabold uppercase text-neutral-400">Minigame que jogam juntos</label>
                <select
                  value={newFriendGame}
                  onChange={(e) => setNewFriendGame(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-800 border border-white/15 rounded-xl text-xs text-white font-bold cursor-pointer"
                >
                  <option value="Crazy Run">⚡ Crazy Run</option>
                  <option value="Corrida de Pets">🐾 Corrida de Pets</option>
                  <option value="Desfile da Ilha">👗 Desfile da Ilha</option>
                  <option value="Robô Gigante">🤖 Robô Gigante</option>
                  <option value="Entrega de Pizza">🍕 Entrega de Pizza</option>
                </select>
              </div>

              {friendError && (
                <div className="p-2.5 bg-red-500/20 border border-red-500/30 rounded-xl text-xs text-red-300 font-bold">
                  ⚠️ {friendError}
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddFriendModalOpen(false)}
                  className="flex-1 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-bold uppercase rounded-xl transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-gradient-to-r from-pink-500 to-purple-600 hover:brightness-110 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-md"
                >
                  Adicionar Amigo 🎉
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: QR CODE & COMPARTILHAMENTO */}
      {/* ========================================================= */}
      {isShareModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-zinc-900 border-2 border-purple-500/50 rounded-3xl p-6 sm:p-8 w-full max-w-md relative shadow-2xl space-y-5 text-center">
            <button
              onClick={() => setIsShareModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-full cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="space-y-1">
              <div className="w-12 h-12 rounded-full bg-purple-500/20 text-purple-300 flex items-center justify-center mx-auto mb-2">
                <QrCode className="w-6 h-6" />
              </div>
              <h3 className="font-sans font-black text-xl text-white uppercase tracking-wider">
                Compartilhar Passaporte
              </h3>
              <p className="text-xs text-gray-300">
                Mostre suas conquistas e medalhas para seus amigos de PK XD!
              </p>
            </div>

            {qrCodeDataUrl && (
              <div className="w-48 h-48 mx-auto bg-white p-3 rounded-2xl shadow-xl border-2 border-purple-500/30 flex items-center justify-center">
                <img src={qrCodeDataUrl} alt="Passport QR" className="w-full h-full object-contain" />
              </div>
            )}

            <div className="space-y-2">
              <button
                onClick={handleCopyLink}
                className="w-full py-3 bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 hover:brightness-110 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-95"
              >
                {copiedLink ? <Check className="w-4 h-4 text-emerald-300" /> : <Share2 className="w-4 h-4" />}
                <span>{copiedLink ? 'Link do Passaporte Copiado!' : 'Copiar Link para Compartilhar'}</span>
              </button>

              <button
                onClick={handleCopyTag}
                className="w-full py-2.5 bg-neutral-800 hover:bg-neutral-700 text-cyan-300 font-mono font-bold text-xs uppercase rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copiedTag ? 'Tag Copiada!' : `Copiar Tag: ${passport.playerTag}`}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: DETALHES DA MEDALHA SELECIONADA */}
      {/* ========================================================= */}
      {selectedBadge && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-zinc-900 border-2 border-purple-500/50 rounded-3xl p-6 sm:p-8 w-full max-w-sm relative shadow-2xl space-y-4 text-center">
            <button
              onClick={() => setSelectedBadge(null)}
              className="absolute top-4 right-4 p-1.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-full cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className={`w-20 h-20 rounded-3xl mx-auto flex items-center justify-center text-4xl border-2 ${
              selectedBadge.unlocked
                ? 'bg-gradient-to-br from-purple-800 to-indigo-900 border-purple-400 shadow-xl'
                : 'bg-neutral-800 border-white/10 grayscale opacity-60'
            }`}>
              {selectedBadge.icon}
            </div>

            <div className="space-y-1">
              <span className={`text-[10px] font-mono px-2.5 py-0.5 rounded-full uppercase font-bold ${
                selectedBadge.rarity === 'Lendário'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : selectedBadge.rarity === 'Épico'
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                    : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
              }`}>
                Raridade: {selectedBadge.rarity || 'Comum'}
              </span>
              <h3 className="font-sans font-black text-lg text-white uppercase pt-1">
                {selectedBadge.title}
              </h3>
              <p className="text-xs text-gray-300 leading-relaxed">
                {selectedBadge.description}
              </p>
            </div>

            <div className="p-3 bg-black/40 rounded-xl border border-white/10 text-xs font-mono">
              {selectedBadge.unlocked ? (
                <span className="text-emerald-400 font-bold flex items-center justify-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> Conquista Desbloqueada!
                </span>
              ) : (
                <span className="text-amber-400 font-bold">
                  🔒 Bloqueada — Conclua os objetivos para liberar!
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

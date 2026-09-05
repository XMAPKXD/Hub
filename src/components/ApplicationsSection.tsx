import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Smartphone, 
  Video, 
  UserCheck, 
  Compass, 
  Send, 
  Check, 
  ExternalLink, 
  FileText, 
  AlertCircle,
  Trophy,
  Flame,
  ArrowLeft,
  Lock,
  Unlock,
  RefreshCw,
  Trash2,
  CheckCircle,
  Eye,
  Star,
  Settings,
  Upload,
  Image as ImageIcon,
  Instagram,
  Youtube,
  Crown,
  Link2,
  X
} from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, doc, setDoc, getDocs, deleteDoc } from 'firebase/firestore';
import { playTapSound, playSuccessSound, playLevelUpSound } from '../utils/audio';

interface ApplicationsSectionProps {
  onBackToHub: () => void;
  onAddXP: (amount: number, reason: string) => void;
  soundEnabled: boolean;
  user: any;
  isAdmin?: boolean;
  onAddNews?: (news: any) => void;
  onAddShort?: (short: any) => void;
  onAddTheory?: (theory: any) => void;
  onAddFeaturedVideo?: (video: any) => void;
}

export default function ApplicationsSection({ 
  onBackToHub, 
  onAddXP, 
  soundEnabled,
  user,
  isAdmin = false,
  onAddNews,
  onAddShort,
  onAddTheory,
  onAddFeaturedVideo
}: ApplicationsSectionProps) {
  const [activeTab, setActiveTab] = useState<'panel' | 'shorts' | 'theory' | 'admin'>(() => {
    try {
      const hash = window.location.hash.toLowerCase();
      const search = window.location.search.toLowerCase();
      if (hash.includes('admin') || search.includes('admin')) {
        return 'admin';
      }
      if (hash.includes('shorts') || search.includes('shorts')) {
        return 'shorts';
      }
      if (hash.includes('theory') || search.includes('theory') || hash.includes('teoria') || search.includes('teoria')) {
        return 'theory';
      }
      if (hash.includes('panel') || search.includes('panel') || hash.includes('destaque') || search.includes('destaque')) {
        return 'panel';
      }
    } catch (e) {}
    return 'panel';
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    const checkHash = () => {
      try {
        const hash = window.location.hash.toLowerCase();
        const search = window.location.search.toLowerCase();
        if (hash.includes('admin') || search.includes('admin')) {
          setActiveTab('admin');
        } else if (hash.includes('shorts') || search.includes('shorts')) {
          setActiveTab('shorts');
        } else if (hash.includes('theory') || search.includes('theory') || hash.includes('teoria') || search.includes('teoria')) {
          setActiveTab('theory');
        } else if (hash.includes('panel') || search.includes('panel') || hash.includes('destaque') || search.includes('destaque')) {
          setActiveTab('panel');
        }
      } catch (e) {}
    };
    checkHash();
    window.addEventListener('hashchange', checkHash);
    return () => window.removeEventListener('hashchange', checkHash);
  }, []);

  // Admin Dashboard States
  const [showAdminDashboard, setShowAdminDashboard] = useState(false);
  const [isComponentAdmin, setIsComponentAdmin] = useState(isAdmin);
  const [inputPasscode, setInputPasscode] = useState('');
  const [passcodeError, setPasscodeError] = useState('');
  
  const [appsPanel, setAppsPanel] = useState<any[]>([]);
  const [appsShorts, setAppsShorts] = useState<any[]>([]);
  const [appsTheories, setAppsTheories] = useState<any[]>([]);
  const [appsAdmin, setAppsAdmin] = useState<any[]>([]);
  const [isAppsLoading, setIsAppsLoading] = useState(false);
  const [adminActiveSubTab, setAdminActiveSubTab] = useState<'panel' | 'shorts' | 'theory' | 'admin'>('panel');

  const fetchAllApplications = async () => {
    setIsAppsLoading(true);
    try {
      try {
        const panelSnap = await getDocs(collection(db, 'applications_panel'));
        setAppsPanel(panelSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (e) {
        handleFirestoreError(e, OperationType.GET, 'applications_panel');
      }

      try {
        const shortsSnap = await getDocs(collection(db, 'applications_shorts'));
        setAppsShorts(shortsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (e) {
        handleFirestoreError(e, OperationType.GET, 'applications_shorts');
      }

      try {
        const theoriesSnap = await getDocs(collection(db, 'applications_theories'));
        setAppsTheories(theoriesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (e) {
        handleFirestoreError(e, OperationType.GET, 'applications_theories');
      }

      try {
        const adminSnap = await getDocs(collection(db, 'applications_admin'));
        setAppsAdmin(adminSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (e) {
        handleFirestoreError(e, OperationType.GET, 'applications_admin');
      }
    } catch (err) {
      console.error("Erro ao buscar inscrições:", err);
    } finally {
      setIsAppsLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      setIsComponentAdmin(true);
    }
  }, [isAdmin]);

  useEffect(() => {
    if (showAdminDashboard && isComponentAdmin) {
      fetchAllApplications();
    }
  }, [showAdminDashboard, isComponentAdmin]);

  const handlePasscodeUnlock = () => {
    triggerAudio('tap');
    const validPasscodes = ['pkxdcentral2026_portal_admin', 'kawanyuri_adm_seguro_99', 'central_pkxd_super_acesso_real', 'bela12@!'];
    if (validPasscodes.includes(inputPasscode.trim())) {
      setIsComponentAdmin(true);
      setPasscodeError('');
      setInputPasscode('');
      triggerAudio('success');
    } else {
      setPasscodeError('Código de acesso incorreto. Tente novamente!');
    }
  };

  // Form states - Tab 1: Panel Highlight & Sugestão de Criador
  const [panelCreator, setPanelCreator] = useState('');
  const [panelUrl, setPanelUrl] = useState('');
  const [panelDescription, setPanelDescription] = useState('');
  const [panelCreatorPhoto, setPanelCreatorPhoto] = useState('');
  const [panelPhotoInputType, setPanelPhotoInputType] = useState<'upload' | 'url'>('upload');
  const [panelInstagram, setPanelInstagram] = useState('');
  const [panelTikTok, setPanelTikTok] = useState('');
  const [panelYouTube, setPanelYouTube] = useState('');

  // Form states - Tab 2: Shorts Highlight
  const [shortsCreator, setShortsCreator] = useState('');
  const [shortsUrl, setShortsUrl] = useState('');
  const [shortsTitle, setShortsTitle] = useState('');
  const [shortsCreatorPhoto, setShortsCreatorPhoto] = useState('');
  const [shortsPhotoInputType, setShortsPhotoInputType] = useState<'upload' | 'url'>('upload');
  const [shortsInstagram, setShortsInstagram] = useState('');
  const [shortsTikTok, setShortsTikTok] = useState('');
  const [shortsYouTube, setShortsYouTube] = useState('');

  // Form states - Tab 3: Submit Theory
  const [theoryTitle, setTheoryTitle] = useState('');
  const [theoryContent, setTheoryContent] = useState('');
  const [theoryAuthor, setTheoryAuthor] = useState('');

  // Form states - Tab 4: Admin Application
  const [adminName, setAdminName] = useState('');
  const [adminContact, setAdminContact] = useState('');
  const [adminAge, setAdminAge] = useState('');
  const [adminReason, setAdminReason] = useState('');
  const [adminHours, setAdminHours] = useState('');

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>, setter: (val: string) => void) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('⚠️ A foto é muito pesada (limite de 5MB). Por favor, escolha outra imagem.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setter(result);
    };
    reader.readAsDataURL(file);
  };

  const triggerAudio = (type: 'tap' | 'success' | 'levelUp') => {
    if (!soundEnabled) return;
    if (type === 'tap') playTapSound();
    if (type === 'success') playSuccessSound();
    if (type === 'levelUp') playLevelUpSound();
  };

  const handleTabChange = (tab: 'panel' | 'shorts' | 'theory' | 'admin') => {
    triggerAudio('tap');
    setActiveTab(tab);
    setSubmitStatus(null);
  };

  const resetForms = () => {
    setPanelCreator('');
    setPanelUrl('');
    setPanelDescription('');
    setPanelCreatorPhoto('');
    setPanelInstagram('');
    setPanelTikTok('');
    setPanelYouTube('');

    setShortsCreator('');
    setShortsUrl('');
    setShortsTitle('');
    setShortsCreatorPhoto('');
    setShortsInstagram('');
    setShortsTikTok('');
    setShortsYouTube('');

    setTheoryTitle('');
    setTheoryContent('');
    setTheoryAuthor('');

    setAdminName('');
    setAdminContact('');
    setAdminAge('');
    setAdminReason('');
    setAdminHours('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    triggerAudio('tap');
    setIsSubmitting(true);
    setSubmitStatus(null);

    const id = 'app_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    let collectionName = '';
    let payload: any = {
      id,
      submittedBy: user?.uid || 'anonymous',
      submittedByEmail: user?.email || 'convidado@pkxdcentral.com',
      createdAt: Date.now(),
      status: 'pending' // pending, approved, rejected
    };

    try {
      if (activeTab === 'panel') {
        if (!panelCreator.trim() || !panelUrl.trim() || !panelDescription.trim()) {
          throw new Error('Por favor, preencha todos os campos obrigatórios (Nome, Link do Conteúdo e Descrição).');
        }

        // Validate that at least ONE social media network is provided
        const hasSocial = Boolean(panelInstagram.trim() || panelTikTok.trim() || panelYouTube.trim());
        if (!hasSocial) {
          throw new Error('Por favor, informe pelo menos UMA rede social do indicado (Instagram, TikTok ou YouTube)!');
        }

        const socialParts: string[] = [];
        if (panelInstagram.trim()) socialParts.push(`Instagram: ${panelInstagram.trim()}`);
        if (panelTikTok.trim()) socialParts.push(`TikTok: ${panelTikTok.trim()}`);
        if (panelYouTube.trim()) socialParts.push(`YouTube: ${panelYouTube.trim()}`);

        collectionName = 'applications_panel';
        payload = {
          ...payload,
          creator: panelCreator.trim(),
          url: panelUrl.trim(),
          description: panelDescription.trim(),
          creatorPhoto: panelCreatorPhoto.trim() || null,
          instagram: panelInstagram.trim() || null,
          tiktok: panelTikTok.trim() || null,
          youtube: panelYouTube.trim() || null,
          social: socialParts.join(' • ')
        };
      } else if (activeTab === 'shorts') {
        if (!shortsCreator.trim() || !shortsUrl.trim() || !shortsTitle.trim()) {
          throw new Error('Por favor, preencha todos os campos obrigatórios (Canal, Link do Short e Título).');
        }

        // Validate that at least ONE social media network is provided
        const hasSocial = Boolean(shortsInstagram.trim() || shortsTikTok.trim() || shortsYouTube.trim());
        if (!hasSocial) {
          throw new Error('Por favor, informe pelo menos UMA rede social do indicado (Instagram, TikTok ou YouTube)!');
        }

        const socialParts: string[] = [];
        if (shortsInstagram.trim()) socialParts.push(`Instagram: ${shortsInstagram.trim()}`);
        if (shortsTikTok.trim()) socialParts.push(`TikTok: ${shortsTikTok.trim()}`);
        if (shortsYouTube.trim()) socialParts.push(`YouTube: ${shortsYouTube.trim()}`);

        collectionName = 'applications_shorts';
        payload = {
          ...payload,
          creator: shortsCreator.trim(),
          url: shortsUrl.trim(),
          title: shortsTitle.trim(),
          creatorPhoto: shortsCreatorPhoto.trim() || null,
          instagram: shortsInstagram.trim() || null,
          tiktok: shortsTikTok.trim() || null,
          youtube: shortsYouTube.trim() || null,
          social: socialParts.join(' • ')
        };
      } else if (activeTab === 'theory') {
        if (!theoryTitle.trim() || !theoryContent.trim() || !theoryAuthor.trim()) {
          throw new Error('Por favor, preencha todos os campos obrigatórios.');
        }
        collectionName = 'applications_theories';
        payload = {
          ...payload,
          title: theoryTitle.trim(),
          content: theoryContent.trim(),
          author: theoryAuthor.trim()
        };
      } else if (activeTab === 'admin') {
        if (!adminName.trim() || !adminContact.trim() || !adminAge || !adminReason.trim() || !adminHours.trim()) {
          throw new Error('Por favor, preencha todos os campos obrigatórios.');
        }
        collectionName = 'applications_admin';
        payload = {
          ...payload,
          name: adminName.trim(),
          contact: adminContact.trim(),
          age: adminAge,
          reason: adminReason.trim(),
          hours: adminHours.trim()
        };
      }

      try {
        await setDoc(doc(db, collectionName, id), payload);
      } catch (dbErr: any) {
        console.warn("Erro no Firestore, verificando código do erro:", dbErr);
        if (dbErr?.code === 'permission-denied') {
          throw new Error('Permissão Negada de Nuvem (Firestore): A gravação foi rejeitada pelas regras de segurança. Entre em contato com um administrador!');
        } else {
          handleFirestoreError(dbErr, OperationType.WRITE, collectionName);
        }
      }
      
      triggerAudio('levelUp');
      setSubmitStatus({
        success: true,
        message: 'Sugestão / Inscrição enviada com sucesso! Guardada na nuvem do PKXD Central para análise da equipe! 🌟'
      });
      
      // Award XP
      const xpReward = 150;
      onAddXP(xpReward, `Inscrição: ${activeTab === 'panel' ? 'Destaque de Vídeo' : activeTab === 'shorts' ? 'Destaque de Shorts' : activeTab === 'theory' ? 'Envio de Teoria' : 'Candidatura ADM'}! 📝`);

      resetForms();
    } catch (err: any) {
      console.error(err);
      let errMsg = 'Erro ao processar inscrição. Verifique as informações e tente novamente.';
      try {
        if (err.message && err.message.startsWith('{')) {
          const parsed = JSON.parse(err.message);
          if (parsed.error && (parsed.error.includes('permission-denied') || parsed.error.includes('Missing or insufficient permissions'))) {
            errMsg = 'A gravação foi rejeitada devido a regras de segurança do banco de dados (Firestore). Verifique sua autenticação.';
          } else {
            errMsg = parsed.error || errMsg;
          }
        } else if (err.message) {
          errMsg = err.message;
        }
      } catch (e) {}

      setSubmitStatus({
        success: false,
        message: errMsg
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 px-4 py-8 relative" id="applications-area-wrapper">
      
      {/* Upper navigation row */}
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <button
          onClick={() => {
            triggerAudio('tap');
            onBackToHub();
          }}
          className="px-3 sm:px-4 py-2 sm:py-2.5 bg-zinc-900/85 hover:bg-purple-950 text-purple-300 hover:text-white rounded-xl border border-purple-500/30 transition-all duration-150 cursor-pointer flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs font-black uppercase tracking-wider shadow-md"
        >
          <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span>Voltar <span className="hidden xs:inline">à Central</span></span>
        </button>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 sm:gap-1.5 bg-purple-900/40 p-1.5 px-2.5 sm:px-3 rounded-full border border-purple-500/20">
            <Trophy className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-yellow-300" />
            <span className="text-[9px] sm:text-[10px] text-gray-300 font-bold uppercase tracking-wider">
              <span className="hidden sm:inline">Inscrição = </span>
              <strong className="text-yellow-300">+150 XP</strong>
            </span>
          </div>

          <button
            onClick={() => {
              triggerAudio('tap');
              setShowAdminDashboard(!showAdminDashboard);
              setSubmitStatus(null);
            }}
            className={`px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r rounded-xl border font-sans text-[10px] sm:text-[11px] font-black uppercase tracking-wider transition-all duration-150 cursor-pointer flex items-center gap-1.5 shadow-md ${
              showAdminDashboard
                ? 'from-rose-600 to-red-600 text-white border-rose-500 hover:brightness-110'
                : 'from-amber-450 to-yellow-500 text-black border-yellow-400 hover:brightness-110'
            }`}
          >
            {showAdminDashboard ? (
              <>
                <Eye className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                <span><span className="hidden xs:inline">Enviar </span>Inscrição</span>
              </>
            ) : (
              <>
                <Lock className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                <span><span className="hidden xs:inline">Área do </span>Admin 🔑</span>
              </>
            )}
          </button>
        </div>
      </div>

      {showAdminDashboard ? (
        <>
          {/* Header card for Admin */}
          <div className="bg-gradient-to-r from-slate-900 via-zinc-950 to-indigo-950 border-2 border-yellow-500/40 rounded-3xl p-6 sm:p-8 text-left shadow-[0_12px_30px_rgba(234,179,8,0.15)] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/10 rounded-full filter blur-2xl pointer-events-none" />
            <div className="absolute bottom-0 left-1/4 w-32 h-32 bg-indigo-500/5 rounded-full filter blur-2xl pointer-events-none" />
            
            <div className="relative z-10 space-y-3">
              <div className="inline-flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/30 px-3.5 py-1 rounded-full text-yellow-300 font-mono text-[10px] font-black uppercase tracking-widest animate-pulse">
                <Lock className="w-3.5 h-3.5" />
                Painel do Administrador (Inscrições)
              </div>
              <h2 className="font-sans font-black text-2xl sm:text-4xl tracking-tight text-white uppercase leading-none">
                CURADORIA DE <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-amber-400 to-orange-400">INSCRIÇÕES</span>
              </h2>
              <p className="font-sans text-xs sm:text-sm text-gray-300 leading-relaxed max-w-2xl">
                Gerencie todas as solicitações enviadas pelos fás do fã-clube. Aprove posts direto para o portal ou entre em contato com novos candidatos a moderador!
              </p>
            </div>
          </div>

          {!isComponentAdmin ? (
            /* Passcode Entry Form */
            <div className="bg-zinc-900/60 border border-white/5 rounded-3xl p-6 sm:p-8 text-center relative overflow-hidden">
              <div className="max-w-md mx-auto py-8 space-y-5">
                <div className="mx-auto w-14 h-14 rounded-2xl bg-zinc-950 border border-white/10 flex items-center justify-center text-yellow-400 shadow-inner">
                  <Lock className="w-7 h-7 animate-pulse" />
                </div>

                <div className="space-y-1">
                  <h3 className="font-sans font-black text-lg text-white uppercase tracking-wider">
                    🔐 ACESSO RESTRITO (CÓDIGO ADMIN)
                  </h3>
                  <p className="font-sans text-xs text-gray-400 leading-relaxed">
                    Insira uma senha de acesso autorizada para visualizar os dados de contato e inscrições feitas na central.
                  </p>
                </div>

                <div className="space-y-3">
                  <input
                    type="password"
                    placeholder="Senha de Admin ou PIN"
                    value={inputPasscode}
                    onChange={(e) => setInputPasscode(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handlePasscodeUnlock();
                    }}
                    className="bg-zinc-950 text-white placeholder-zinc-600 text-xs px-4 py-3 rounded-xl border border-white/10 focus:outline-none focus:border-yellow-500 w-full font-mono text-center"
                  />
                  <button
                    onClick={handlePasscodeUnlock}
                    className="bg-yellow-400 hover:bg-yellow-350 text-black py-3 rounded-xl text-xs font-black font-sans tracking-wide cursor-pointer w-full uppercase shadow-md transition-all"
                  >
                    Desbloquear Painel 🔓
                  </button>
                  {passcodeError && (
                    <p className="text-red-400 text-xs font-sans font-bold pt-1">{passcodeError}</p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* Unlocked Admin Dashboard */
            <div className="space-y-6">
              {/* Admin Subtabs Row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                <button
                  onClick={() => { triggerAudio('tap'); setAdminActiveSubTab('panel'); }}
                  className={`p-3.5 rounded-2xl border-2 font-sans font-black text-[11px] uppercase tracking-wider transition-all duration-150 cursor-pointer flex flex-col items-center justify-center gap-1.5 shadow-md ${
                    adminActiveSubTab === 'panel'
                      ? 'bg-gradient-to-b from-purple-800 to-purple-950 text-white border-purple-500'
                      : 'bg-zinc-900/70 text-gray-400 border-white/5 hover:text-gray-250'
                  }`}
                >
                  <Video className="w-4 h-4" />
                  <span>Vídeo Destaque ({appsPanel.length})</span>
                </button>

                <button
                  onClick={() => { triggerAudio('tap'); setAdminActiveSubTab('shorts'); }}
                  className={`p-3.5 rounded-2xl border-2 font-sans font-black text-[11px] uppercase tracking-wider transition-all duration-150 cursor-pointer flex flex-col items-center justify-center gap-1.5 shadow-md ${
                    adminActiveSubTab === 'shorts'
                      ? 'bg-gradient-to-b from-cyan-800 to-cyan-950 text-white border-cyan-500'
                      : 'bg-zinc-900/70 text-gray-400 border-white/5 hover:text-gray-250'
                  }`}
                >
                  <Smartphone className="w-4 h-4" />
                  <span>Shorts ({appsShorts.length})</span>
                </button>

                <button
                  onClick={() => { triggerAudio('tap'); setAdminActiveSubTab('theory'); }}
                  className={`p-3.5 rounded-2xl border-2 font-sans font-black text-[11px] uppercase tracking-wider transition-all duration-150 cursor-pointer flex flex-col items-center justify-center gap-1.5 shadow-md ${
                    adminActiveSubTab === 'theory'
                      ? 'bg-gradient-to-b from-pink-850 to-pink-950 text-white border-pink-500'
                      : 'bg-zinc-900/70 text-gray-400 border-white/5 hover:text-gray-250'
                  }`}
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Teorias ({appsTheories.length})</span>
                </button>

                <button
                  onClick={() => { triggerAudio('tap'); setAdminActiveSubTab('admin'); }}
                  className={`p-3.5 rounded-2xl border-2 font-sans font-black text-[11px] uppercase tracking-wider transition-all duration-150 cursor-pointer flex flex-col items-center justify-center gap-1.5 shadow-md ${
                    adminActiveSubTab === 'admin'
                      ? 'bg-gradient-to-b from-yellow-800 to-yellow-950 text-white border-yellow-500'
                      : 'bg-zinc-900/70 text-gray-400 border-white/5 hover:text-gray-250'
                  }`}
                >
                  <UserCheck className="w-4 h-4" />
                  <span>Candidatos ADM ({appsAdmin.length})</span>
                </button>
              </div>

              {/* Data Content Box */}
              <div className="bg-zinc-900/60 border border-white/5 rounded-3xl p-6 sm:p-8 text-left relative overflow-hidden">
                
                {/* Refresh Trigger */}
                <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-4">
                  <h3 className="font-sans font-black text-xs sm:text-sm uppercase tracking-wider text-yellow-400 flex items-center gap-2">
                    <span>📥 LISTA DE SOLICITAÇÕES: {
                      adminActiveSubTab === 'panel' ? 'DESTAQUE DE VÍDEOS' :
                      adminActiveSubTab === 'shorts' ? 'DESTAQUE DE SHORTS' :
                      adminActiveSubTab === 'theory' ? 'TEORIAS ENVIADAS' :
                      'CANDIDATURAS PARA ADMINISTRADOR'
                    }</span>
                  </h3>
                  <button
                    onClick={() => { triggerAudio('tap'); fetchAllApplications(); }}
                    disabled={isAppsLoading}
                    className="p-2 px-3 bg-zinc-850 hover:bg-zinc-800 text-gray-300 hover:text-white rounded-xl text-xs font-bold font-sans flex items-center gap-1.5 cursor-pointer border border-white/5"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isAppsLoading ? 'animate-spin' : ''}`} />
                    <span>{isAppsLoading ? 'Atualizando...' : 'Atualizar'}</span>
                  </button>
                </div>

                {isAppsLoading ? (
                  <div className="py-12 text-center text-gray-500">
                    <RefreshCw className="w-8 h-8 animate-spin mx-auto text-yellow-400 mb-3" />
                    <p className="font-sans text-xs">Acessando banco de dados...</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Render Category List */}
                    {adminActiveSubTab === 'panel' && (
                      appsPanel.length === 0 ? (
                        <p className="py-8 text-center text-gray-500 text-xs">Nenhum pedido de destaque de vídeo pendente.</p>
                      ) : (
                        appsPanel.map((item) => (
                          <div key={item.id} className="p-4 bg-zinc-950/70 border border-white/5 rounded-2xl space-y-3 relative">
                            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-white/5 pb-3">
                              <div className="flex items-center gap-3">
                                {item.creatorPhoto ? (
                                  <img 
                                    src={item.creatorPhoto} 
                                    alt={item.creator} 
                                    className="w-12 h-12 rounded-2xl object-cover border border-purple-500/40 shadow-md bg-zinc-900 flex-shrink-0"
                                    onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                                  />
                                ) : (
                                  <div className="w-12 h-12 rounded-2xl bg-purple-950/50 border border-purple-500/30 flex items-center justify-center text-purple-300 font-black text-sm flex-shrink-0">
                                    {item.creator?.charAt(0)?.toUpperCase() || '👤'}
                                  </div>
                                )}
                                <div>
                                  <span className="text-[10px] text-purple-400 font-bold uppercase block">CRIADOR INDICADO</span>
                                  <h4 className="font-sans font-black text-sm text-white">{item.creator}</h4>
                                  <span className="text-[9px] font-mono text-gray-500">{new Date(item.createdAt).toLocaleString()}</span>
                                </div>
                              </div>

                              {/* Social Badges */}
                              <div className="flex flex-wrap items-center gap-1.5">
                                {item.instagram && (
                                  <a
                                    href={item.instagram.startsWith('http') ? item.instagram : `https://instagram.com/${item.instagram.replace('@', '')}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-pink-500/15 border border-pink-500/30 text-pink-300 text-[10px] font-bold hover:bg-pink-500/25 transition-colors"
                                  >
                                    <Instagram className="w-3 h-3" />
                                    <span>{item.instagram.startsWith('@') ? item.instagram : `@${item.instagram.replace('https://instagram.com/', '')}`}</span>
                                  </a>
                                )}
                                {item.tiktok && (
                                  <a
                                    href={item.tiktok.startsWith('http') ? item.tiktok : `https://tiktok.com/@${item.tiktok.replace('@', '')}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-[10px] font-bold hover:bg-cyan-500/25 transition-colors"
                                  >
                                    <span className="font-black text-[10px]">TikTok:</span>
                                    <span>{item.tiktok.startsWith('@') ? item.tiktok : `@${item.tiktok.replace('https://tiktok.com/@', '')}`}</span>
                                  </a>
                                )}
                                {item.youtube && (
                                  <a
                                    href={item.youtube.startsWith('http') ? item.youtube : `https://youtube.com/@${item.youtube.replace('@', '')}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-500/15 border border-red-500/30 text-red-300 text-[10px] font-bold hover:bg-red-500/25 transition-colors"
                                  >
                                    <Youtube className="w-3 h-3" />
                                    <span>{item.youtube.startsWith('@') ? item.youtube : item.youtube.replace('https://youtube.com/@', '')}</span>
                                  </a>
                                )}
                              </div>
                            </div>

                            <div className="space-y-1.5 text-xs">
                              <p className="text-gray-300 leading-normal font-sans"><span className="text-purple-300 font-semibold">Descrição:</span> {item.description}</p>
                              <p className="font-mono text-[10px] text-cyan-400 break-all select-all bg-black/40 p-2 rounded-lg flex items-center justify-between gap-2">
                                <span>{item.url}</span>
                                <a href={item.url} target="_blank" rel="noreferrer" className="text-white hover:text-cyan-300 flex-shrink-0">
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                              </p>
                            </div>

                            <div className="flex flex-wrap gap-2 pt-2">
                              <button
                                onClick={async () => {
                                  triggerAudio('tap');
                                  if (!onAddFeaturedVideo) {
                                    alert('Erro: onAddFeaturedVideo não está disponível.');
                                    return;
                                  }
                                  try {
                                    onAddFeaturedVideo({
                                      title: item.description || `Destaque de ${item.creator}! 🎬`,
                                      youtubeUrl: item.url,
                                      type: 'game_highlight',
                                      author: item.creator
                                    });
                                    await deleteDoc(doc(db, 'applications_panel', item.id));
                                    triggerAudio('success');
                                    fetchAllApplications();
                                  } catch (err: any) {
                                    alert('Erro ao aprovar no Painel: ' + err.message);
                                  }
                                }}
                                className="px-3 py-2 bg-amber-500 hover:bg-amber-400 text-black rounded-xl text-xs font-black font-sans cursor-pointer flex items-center gap-1 shadow-lg transition-all active:scale-95"
                              >
                                <Star className="w-3.5 h-3.5 fill-current text-black" />
                                <span>Aprovar no PAINEL 🌟</span>
                              </button>

                              <button
                                onClick={async () => {
                                  triggerAudio('tap');
                                  if (!onAddFeaturedVideo) {
                                    alert('Erro: onAddFeaturedVideo não está disponível.');
                                    return;
                                  }
                                  try {
                                    onAddFeaturedVideo({
                                      title: item.description || `Vídeo de ${item.creator}! 🎬`,
                                      youtubeUrl: item.url,
                                      type: 'panel_video',
                                      author: item.creator
                                    });
                                    await deleteDoc(doc(db, 'applications_panel', item.id));
                                    triggerAudio('success');
                                    fetchAllApplications();
                                  } catch (err: any) {
                                    alert('Erro ao aprovar na Comunidade: ' + err.message);
                                  }
                                }}
                                className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black font-sans cursor-pointer flex items-center gap-1 shadow transition-all active:scale-95"
                              >
                                <CheckCircle className="w-3.5 h-3.5 text-white" />
                                <span>Aprovar na COMUNIDADE 👥</span>
                              </button>

                              <button
                                onClick={async () => {
                                  triggerAudio('tap');
                                  if (confirm('Deseja excluir esta inscrição permanentemente?')) {
                                    try {
                                      await deleteDoc(doc(db, 'applications_panel', item.id));
                                      fetchAllApplications();
                                    } catch (err: any) {
                                      alert(err.message);
                                    }
                                  }
                                }}
                                className="px-3 py-2 bg-red-650 hover:bg-red-600 text-white rounded-xl text-xs font-bold font-sans cursor-pointer flex items-center gap-1 transition-all active:scale-95 ml-auto"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Excluir</span>
                              </button>
                            </div>
                          </div>
                        ))
                      )
                    )}

                    {adminActiveSubTab === 'shorts' && (
                      appsShorts.length === 0 ? (
                        <p className="py-8 text-center text-gray-500 text-xs">Nenhum pedido de destaque de shorts pendente.</p>
                      ) : (
                        appsShorts.map((item) => (
                          <div key={item.id} className="p-4 bg-zinc-950/70 border border-white/5 rounded-2xl space-y-3">
                            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-white/5 pb-3">
                              <div className="flex items-center gap-3">
                                {item.creatorPhoto ? (
                                  <img 
                                    src={item.creatorPhoto} 
                                    alt={item.creator} 
                                    className="w-12 h-12 rounded-2xl object-cover border border-cyan-500/40 shadow-md bg-zinc-900 flex-shrink-0"
                                    onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                                  />
                                ) : (
                                  <div className="w-12 h-12 rounded-2xl bg-cyan-950/50 border border-cyan-500/30 flex items-center justify-center text-cyan-300 font-black text-sm flex-shrink-0">
                                    {item.creator?.charAt(0)?.toUpperCase() || '📱'}
                                  </div>
                                )}
                                <div>
                                  <span className="text-[10px] text-cyan-400 font-bold uppercase block">CANAL / CRIADOR</span>
                                  <h4 className="font-sans font-black text-sm text-white">{item.creator}</h4>
                                  <span className="text-[9px] font-mono text-gray-500">{new Date(item.createdAt).toLocaleString()}</span>
                                </div>
                              </div>

                              {/* Social Badges */}
                              <div className="flex flex-wrap items-center gap-1.5">
                                {item.instagram && (
                                  <a
                                    href={item.instagram.startsWith('http') ? item.instagram : `https://instagram.com/${item.instagram.replace('@', '')}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-pink-500/15 border border-pink-500/30 text-pink-300 text-[10px] font-bold hover:bg-pink-500/25 transition-colors"
                                  >
                                    <Instagram className="w-3 h-3" />
                                    <span>{item.instagram.startsWith('@') ? item.instagram : `@${item.instagram.replace('https://instagram.com/', '')}`}</span>
                                  </a>
                                )}
                                {item.tiktok && (
                                  <a
                                    href={item.tiktok.startsWith('http') ? item.tiktok : `https://tiktok.com/@${item.tiktok.replace('@', '')}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-[10px] font-bold hover:bg-cyan-500/25 transition-colors"
                                  >
                                    <span className="font-black text-[10px]">TikTok:</span>
                                    <span>{item.tiktok.startsWith('@') ? item.tiktok : `@${item.tiktok.replace('https://tiktok.com/@', '')}`}</span>
                                  </a>
                                )}
                                {item.youtube && (
                                  <a
                                    href={item.youtube.startsWith('http') ? item.youtube : `https://youtube.com/@${item.youtube.replace('@', '')}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-500/15 border border-red-500/30 text-red-300 text-[10px] font-bold hover:bg-red-500/25 transition-colors"
                                  >
                                    <Youtube className="w-3 h-3" />
                                    <span>{item.youtube.startsWith('@') ? item.youtube : item.youtube.replace('https://youtube.com/@', '')}</span>
                                  </a>
                                )}
                              </div>
                            </div>

                            <div className="space-y-1.5 text-xs">
                              <p className="text-gray-300 font-sans"><span className="text-cyan-300 font-semibold">Título do Short:</span> {item.title}</p>
                              <p className="font-mono text-[10px] text-cyan-400 break-all select-all bg-black/40 p-2 rounded-lg flex items-center justify-between gap-2">
                                <span>{item.url}</span>
                                <a href={item.url} target="_blank" rel="noreferrer" className="text-white hover:text-cyan-300 flex-shrink-0">
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                              </p>
                            </div>

                            <div className="flex gap-2 pt-2">
                              <button
                                onClick={async () => {
                                  triggerAudio('tap');
                                  if (!onAddShort) return;
                                  try {
                                    onAddShort({
                                      title: item.title,
                                      youtubeUrl: item.url
                                    });
                                    await deleteDoc(doc(db, 'applications_shorts', item.id));
                                    triggerAudio('success');
                                    fetchAllApplications();
                                  } catch (err: any) {
                                    alert('Erro ao aprovar: ' + err.message);
                                  }
                                }}
                                className="px-3.5 py-2 bg-cyan-600 hover:bg-cyan-500 text-black font-black rounded-xl text-xs font-sans cursor-pointer flex items-center gap-1.5 shadow transition-all active:scale-95"
                              >
                                <CheckCircle className="w-3.5 h-3.5" />
                                <span>Aprovar Shorts</span>
                              </button>
                              <button
                                onClick={async () => {
                                  triggerAudio('tap');
                                  if (confirm('Deseja excluir esta inscrição permanentemente?')) {
                                    try {
                                      await deleteDoc(doc(db, 'applications_shorts', item.id));
                                      fetchAllApplications();
                                    } catch (err: any) {
                                      alert(err.message);
                                    }
                                  }
                                }}
                                className="px-3 py-2 bg-red-650 hover:bg-red-600 text-white rounded-xl text-xs font-bold font-sans cursor-pointer flex items-center gap-1 transition-all active:scale-95"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Excluir</span>
                              </button>
                            </div>
                          </div>
                        ))
                      )
                    )}

                    {adminActiveSubTab === 'theory' && (
                      appsTheories.length === 0 ? (
                        <p className="py-8 text-center text-gray-500 text-xs">Nenhuma teoria enviada pendente.</p>
                      ) : (
                        appsTheories.map((item) => (
                          <div key={item.id} className="p-4 bg-zinc-950/70 border border-white/5 rounded-2xl space-y-3">
                            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 pb-2">
                              <div>
                                <span className="text-[10px] text-pink-400 font-bold uppercase block">AUTOR / TÍTULO</span>
                                <h4 className="font-sans font-black text-xs text-white">{item.title}</h4>
                                <p className="text-[10px] text-gray-400">Por: {item.author}</p>
                              </div>
                              <span className="text-[9px] font-mono text-gray-500">{new Date(item.createdAt).toLocaleString()}</span>
                            </div>

                            <div className="text-xs bg-black/30 p-3 rounded-xl border border-white/5 max-h-40 overflow-y-auto">
                              <p className="text-gray-300 leading-relaxed whitespace-pre-wrap font-sans">{item.content}</p>
                            </div>

                            <div className="flex gap-2 pt-2">
                              <button
                                onClick={async () => {
                                  triggerAudio('tap');
                                  if (!onAddTheory) return;
                                  try {
                                    onAddTheory({
                                      title: item.title,
                                      content: item.content,
                                      author: item.author
                                    });
                                    await deleteDoc(doc(db, 'applications_theories', item.id));
                                    triggerAudio('success');
                                    fetchAllApplications();
                                  } catch (err: any) {
                                    alert('Erro ao aprovar: ' + err.message);
                                  }
                                }}
                                className="px-3.5 py-2 bg-pink-600 hover:bg-pink-500 text-white rounded-xl text-xs font-bold font-sans cursor-pointer flex items-center gap-1.5 shadow transition-all active:scale-95"
                              >
                                <CheckCircle className="w-3.5 h-3.5" />
                                <span>Aprovar Teoria</span>
                              </button>
                              <button
                                onClick={async () => {
                                  triggerAudio('tap');
                                  if (confirm('Deseja excluir esta teoria permanentemente?')) {
                                    try {
                                      await deleteDoc(doc(db, 'applications_theories', item.id));
                                      fetchAllApplications();
                                    } catch (err: any) {
                                      alert(err.message);
                                    }
                                  }
                                }}
                                className="px-3 py-2 bg-red-650 hover:bg-red-600 text-white rounded-xl text-xs font-bold font-sans cursor-pointer flex items-center gap-1 transition-all active:scale-95"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Excluir</span>
                              </button>
                            </div>
                          </div>
                        ))
                      )
                    )}

                    {adminActiveSubTab === 'admin' && (
                      appsAdmin.length === 0 ? (
                        <p className="py-8 text-center text-gray-500 text-xs">Nenhuma candidatura de administrador pendente.</p>
                      ) : (
                        appsAdmin.map((item) => (
                          <div key={item.id} className="p-4 bg-zinc-950/70 border border-white/5 rounded-2xl space-y-3">
                            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 pb-2">
                              <div>
                                <span className="text-[10px] text-yellow-400 font-bold uppercase block">CANDIDATO</span>
                                <h4 className="font-sans font-black text-xs text-white">{item.name} ({item.age} anos)</h4>
                                <p className="text-[10px] text-gray-400">Contato: <strong className="text-white select-all">{item.contact}</strong></p>
                              </div>
                              <span className="text-[9px] font-mono text-gray-500">{new Date(item.createdAt).toLocaleString()}</span>
                            </div>

                            <div className="space-y-2 text-xs">
                              <p className="text-gray-300 font-sans"><span className="text-yellow-300 font-semibold">Disponibilidade:</span> {item.hours}</p>
                              <div className="text-gray-300 leading-relaxed font-sans bg-black/30 p-3 rounded-xl border border-white/5">
                                <span className="text-yellow-300 font-semibold block mb-1">Por que quer ser Admin?</span>
                                {item.reason}
                              </div>
                            </div>

                            <div className="flex flex-wrap gap-2 pt-2">
                              <a
                                href={`https://api.whatsapp.com/send?phone=${encodeURIComponent(item.contact)}`}
                                target="_blank"
                                rel="noreferrer"
                                onClick={() => triggerAudio('tap')}
                                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold font-sans cursor-pointer flex items-center gap-1.5 shadow transition-all active:scale-95"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                                <span>Contatar via WhatsApp</span>
                              </a>
                              <button
                                onClick={async () => {
                                  triggerAudio('tap');
                                  if (confirm('Deseja excluir esta candidatura permanentemente?')) {
                                    try {
                                      await deleteDoc(doc(db, 'applications_admin', item.id));
                                      fetchAllApplications();
                                    } catch (err: any) {
                                      alert(err.message);
                                    }
                                  }
                                }}
                                className="px-3 py-2 bg-red-650 hover:bg-red-600 text-white rounded-xl text-xs font-bold font-sans cursor-pointer flex items-center gap-1 transition-all active:scale-95"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Excluir Candidatura</span>
                              </button>
                            </div>
                          </div>
                        ))
                      )
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      ) : (
        <>
          {/* Header card */}
          <div className="bg-gradient-to-r from-purple-900/80 via-zinc-950/95 to-slate-900 border-2 border-purple-500/40 rounded-3xl p-6 sm:p-8 text-left shadow-[0_12px_30px_rgba(147,51,234,0.15)] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full filter blur-2xl pointer-events-none" />
            <div className="absolute bottom-0 left-1/4 w-32 h-32 bg-cyan-500/5 rounded-full filter blur-2xl pointer-events-none" />
            
            <div className="relative z-10 space-y-3">
              <div className="inline-flex items-center gap-2 bg-purple-500/10 border border-purple-500/30 px-3.5 py-1 rounded-full text-purple-300 font-mono text-[10px] font-black uppercase tracking-widest animate-pulse">
                <Compass className="w-3.5 h-3.5 animate-spin-slow" />
                Portal de Recrutamento & Destaques
              </div>
              <h2 className="font-sans font-black text-2xl sm:text-4xl tracking-tight text-white uppercase leading-none">
                ÁREA DE <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-purple-400 to-cyan-400">INSCRIÇÕES</span> DO SITE
              </h2>
              <p className="font-sans text-xs sm:text-sm text-gray-300 leading-relaxed max-w-2xl">
                Bem-vindo à central do site! Aqui você pode se inscrever para aparecer em destaque nas seções do site, enviar suas teorias exclusivas de PK XD ou se candidatar para fazer parte da nossa equipe oficial de administradores!
              </p>
            </div>
          </div>

          {/* Special Creator Goals Banner */}
          <div className="bg-[#0e0a24] border border-white/[0.08] rounded-2xl p-6 shadow-md hover:border-purple-500/30 transition-colors flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
            <div className="space-y-2 text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-purple-500/10 text-purple-200 border border-purple-500/20 text-xs font-semibold">
                <Crown className="w-3.5 h-3.5 text-purple-300" />
                <span>Programa de Creators PK XD</span>
              </div>
              <h3 className="font-sans font-bold text-lg text-white tracking-tight">
                Painel de Metas para Creators
              </h3>
              <p className="font-sans text-xs text-gray-300 max-w-xl leading-relaxed">
                Conecte seu canal do YouTube com acesso seguro e somente leitura para checar suas visualizações, vídeos publicados e verificar sua elegibilidade aos critérios oficiais da Afterverse.
              </p>
            </div>
            <button
              onClick={() => {
                if (soundEnabled) playTapSound();
                window.history.pushState({}, '', '/creators');
                window.dispatchEvent(new PopStateEvent('popstate'));
              }}
              className="w-full md:w-auto px-5 py-2.5 bg-purple-600 hover:bg-purple-500 active:scale-[0.98] text-white font-sans font-semibold text-xs rounded-xl shadow-sm cursor-pointer flex items-center justify-center gap-2 transition-colors flex-shrink-0"
            >
              <span>Ver Minhas Metas</span>
            </button>
          </div>

          {/* Tabs list (Beautiful solid visual blocks) */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
            <button
              onClick={() => handleTabChange('panel')}
              className={`p-3.5 rounded-2xl border-2 font-sans font-black text-[11px] uppercase tracking-wider transition-all duration-150 cursor-pointer flex flex-col items-center justify-center gap-2 shadow-md ${
                activeTab === 'panel'
                  ? 'bg-gradient-to-b from-purple-800 to-purple-950 text-white border-purple-500 shadow-[0_4px_15px_rgba(168,85,247,0.25)]'
                  : 'bg-zinc-900/70 text-gray-400 border-white/5 hover:border-purple-500/30 hover:text-gray-205'
              }`}
            >
              <Video className="w-5 h-5" />
              <span className="text-center">Destaque de Vídeo</span>
            </button>

            <button
              onClick={() => handleTabChange('shorts')}
              className={`p-3.5 rounded-2xl border-2 font-sans font-black text-[11px] uppercase tracking-wider transition-all duration-150 cursor-pointer flex flex-col items-center justify-center gap-2 shadow-md ${
                activeTab === 'shorts'
                  ? 'bg-gradient-to-b from-cyan-800 to-cyan-950 text-white border-cyan-500 shadow-[0_4px_15px_rgba(6,182,212,0.25)]'
                  : 'bg-zinc-900/70 text-gray-400 border-white/5 hover:border-cyan-500/30 hover:text-gray-205'
              }`}
            >
              <Smartphone className="w-5 h-5" />
              <span className="text-center">Destaque de Shorts</span>
            </button>

            <button
              onClick={() => handleTabChange('theory')}
              className={`p-3.5 rounded-2xl border-2 font-sans font-black text-[11px] uppercase tracking-wider transition-all duration-150 cursor-pointer flex flex-col items-center justify-center gap-2 shadow-md ${
                activeTab === 'theory'
                  ? 'bg-gradient-to-b from-pink-850 to-pink-950 text-white border-pink-500 shadow-[0_4px_15px_rgba(236,72,153,0.25)]'
                  : 'bg-zinc-900/70 text-gray-400 border-white/5 hover:border-pink-500/30 hover:text-gray-205'
              }`}
            >
              <Sparkles className="w-5 h-5" />
              <span className="text-center">Enviar Teoria</span>
            </button>

            <button
              onClick={() => handleTabChange('admin')}
              className={`p-3.5 rounded-2xl border-2 font-sans font-black text-[11px] uppercase tracking-wider transition-all duration-150 cursor-pointer flex flex-col items-center justify-center gap-2 shadow-md ${
                activeTab === 'admin'
                  ? 'bg-gradient-to-b from-yellow-800 to-yellow-950 text-white border-yellow-500 shadow-[0_4px_15px_rgba(234,179,8,0.25)]'
                  : 'bg-zinc-900/70 text-gray-400 border-white/5 hover:border-yellow-500/30 hover:text-gray-205'
              }`}
            >
              <UserCheck className="w-5 h-5" />
              <span className="text-center">Ser Administrador</span>
            </button>
          </div>

          {/* Form area */}
          <div className="bg-zinc-900/60 border border-white/5 rounded-3xl p-6 sm:p-8 text-left relative overflow-hidden">
            
            {/* Status Messages */}
            {submitStatus && (
              <div className={`p-4 rounded-2xl mb-6 flex items-start gap-3 border ${
                submitStatus.success 
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                  : 'bg-red-500/10 text-red-400 border-red-500/30'
              }`}>
                {submitStatus.success ? <Check className="w-5 h-5 flex-shrink-0 mt-0.5" /> : <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />}
                <span className="font-sans text-xs leading-relaxed">{submitStatus.message}</span>
              </div>
            )}

            {!user?.email && (
              <div className="p-4 rounded-2xl mb-6 flex items-start gap-3 border bg-amber-500/10 text-amber-400 border-amber-500/20">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-amber-400" />
                <div className="space-y-1">
                  <p className="font-sans text-xs font-bold leading-normal">Você está enviando como Visitante</p>
                  <p className="font-sans text-[11px] text-gray-400 leading-normal">
                    Para que seu e-mail fique salvo na nuvem e você receba os bônus de XP diretamente na sua conta de Fã, por favor faça login na aba <strong className="text-amber-300 font-bold">Nível de Fã 👑</strong> antes de enviar sua inscrição!
                  </p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              
              {activeTab === 'panel' && (
                <div className="space-y-5">
                  <div className="border-b border-white/5 pb-2">
                    <h3 className="font-sans font-black text-base uppercase text-purple-300">
                      🎥 Sugestão & Indicação de Criador / Destaque de Vídeo
                    </h3>
                    <p className="text-[11px] text-gray-400 font-sans leading-normal">
                      Indique seu canal ou sugira um criador talentoso de PK XD para entrar nos destaques oficiais da nossa Central!
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-300 uppercase tracking-wider font-mono">Nome do Indicado / Criador *</label>
                      <input
                        type="text"
                        required
                        value={panelCreator}
                        onChange={(e) => setPanelCreator(e.target.value)}
                        placeholder="Ex: JogadorEstrela_PKXD"
                        className="w-full bg-black/40 border border-zinc-800 focus:border-purple-500 rounded-xl p-3 text-xs text-white placeholder-gray-500 outline-none transition-all"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-300 uppercase tracking-wider font-mono">Link do Vídeo / Live / Canal *</label>
                      <input
                        type="url"
                        required
                        value={panelUrl}
                        onChange={(e) => setPanelUrl(e.target.value)}
                        placeholder="https://www.youtube.com/watch?v=..."
                        className="w-full bg-black/40 border border-zinc-800 focus:border-purple-500 rounded-xl p-3 text-xs text-white placeholder-gray-500 outline-none transition-all"
                      />
                    </div>
                  </div>

                  {/* Real Photo of Nominee */}
                  <div className="p-4 rounded-2xl bg-zinc-950/60 border border-purple-500/20 space-y-3">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div>
                        <label className="text-[11px] font-bold text-purple-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
                          <ImageIcon className="w-3.5 h-3.5 text-purple-400" />
                          <span>Foto Real do Indicado (Opcional - Sem fotos falsas!)</span>
                        </label>
                        <p className="text-[10px] text-gray-400 font-sans">
                          Envie uma foto real do avatar ou canal do indicado do seu aparelho ou cole o link direto da imagem.
                        </p>
                      </div>

                      {/* Input type switch */}
                      <div className="flex items-center bg-black/50 p-1 rounded-xl border border-white/5 text-[10px] font-bold font-mono">
                        <button
                          type="button"
                          onClick={() => setPanelPhotoInputType('upload')}
                          className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                            panelPhotoInputType === 'upload' ? 'bg-purple-600 text-white shadow' : 'text-gray-400 hover:text-white'
                          }`}
                        >
                          Upload Foto
                        </button>
                        <button
                          type="button"
                          onClick={() => setPanelPhotoInputType('url')}
                          className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                            panelPhotoInputType === 'url' ? 'bg-purple-600 text-white shadow' : 'text-gray-400 hover:text-white'
                          }`}
                        >
                          Colar Link
                        </button>
                      </div>
                    </div>

                    {panelPhotoInputType === 'upload' ? (
                      <div>
                        <label className="flex flex-col items-center justify-center p-3.5 border-2 border-dashed border-zinc-800 hover:border-purple-500/50 rounded-xl bg-black/30 cursor-pointer transition-all">
                          <Upload className="w-5 h-5 text-purple-400 mb-1" />
                          <span className="text-xs font-bold text-gray-300">Clique para selecionar foto do celular / PC</span>
                          <span className="text-[10px] text-gray-500 font-mono">PNG, JPG, WEBP (Max 5MB)</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleImageFileChange(e, setPanelCreatorPhoto)}
                            className="hidden"
                          />
                        </label>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <input
                          type="url"
                          value={panelCreatorPhoto}
                          onChange={(e) => setPanelCreatorPhoto(e.target.value)}
                          placeholder="https://exemplo.com/foto_do_indicado.png"
                          className="w-full bg-black/40 border border-zinc-800 focus:border-purple-500 rounded-xl p-2.5 text-xs text-white placeholder-gray-500 outline-none transition-all"
                        />
                      </div>
                    )}

                    {/* Preview real photo */}
                    {panelCreatorPhoto && (
                      <div className="flex items-center gap-3 bg-black/40 p-2.5 rounded-xl border border-purple-500/30">
                        <img
                          src={panelCreatorPhoto}
                          alt="Foto do Indicado"
                          className="w-12 h-12 rounded-xl object-cover border border-purple-500/50 bg-zinc-900 flex-shrink-0"
                          onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-white truncate">Foto do indicado anexada com sucesso!</p>
                          <p className="text-[10px] text-purple-300 font-mono">Foto real selecionada</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setPanelCreatorPhoto('')}
                          className="p-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg cursor-pointer transition-colors"
                          title="Remover foto"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Social Networks of Nominee - At least 1 mandatory */}
                  <div className="p-4 rounded-2xl bg-zinc-950/60 border border-white/5 space-y-3">
                    <div className="border-b border-white/5 pb-2 flex items-center justify-between flex-wrap gap-2">
                      <div>
                        <label className="text-[11px] font-bold text-purple-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
                          <Link2 className="w-3.5 h-3.5 text-purple-400" />
                          <span>Redes Sociais do Indicado *</span>
                        </label>
                        <p className="text-[10px] text-gray-400 font-sans">
                          Você pode preencher as três, mas <strong className="text-purple-300">pelo menos uma (Instagram, TikTok ou YouTube) é obrigatória!</strong>
                        </p>
                      </div>
                      <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30 font-mono">
                        Pelo menos 1 obrigatório
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {/* Instagram */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-pink-400 uppercase tracking-wider font-mono flex items-center gap-1">
                          <Instagram className="w-3 h-3 text-pink-400" />
                          <span>Instagram</span>
                        </label>
                        <input
                          type="text"
                          value={panelInstagram}
                          onChange={(e) => setPanelInstagram(e.target.value)}
                          placeholder="@usuario ou link"
                          className="w-full bg-black/40 border border-zinc-800 focus:border-pink-500 rounded-xl p-2.5 text-xs text-white placeholder-gray-500 outline-none transition-all"
                        />
                      </div>

                      {/* TikTok */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider font-mono flex items-center gap-1">
                          <Smartphone className="w-3 h-3 text-cyan-400" />
                          <span>TikTok</span>
                        </label>
                        <input
                          type="text"
                          value={panelTikTok}
                          onChange={(e) => setPanelTikTok(e.target.value)}
                          placeholder="@usuario ou link"
                          className="w-full bg-black/40 border border-zinc-800 focus:border-cyan-500 rounded-xl p-2.5 text-xs text-white placeholder-gray-500 outline-none transition-all"
                        />
                      </div>

                      {/* YouTube */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-red-400 uppercase tracking-wider font-mono flex items-center gap-1">
                          <Youtube className="w-3 h-3 text-red-400" />
                          <span>YouTube</span>
                        </label>
                        <input
                          type="text"
                          value={panelYouTube}
                          onChange={(e) => setPanelYouTube(e.target.value)}
                          placeholder="@canal ou link"
                          className="w-full bg-black/40 border border-zinc-800 focus:border-red-500 rounded-xl p-2.5 text-xs text-white placeholder-gray-500 outline-none transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-300 uppercase tracking-wider font-mono">Descrição / Motivo da Indicação *</label>
                    <textarea
                      required
                      rows={3}
                      value={panelDescription}
                      onChange={(e) => setPanelDescription(e.target.value)}
                      placeholder="Conte um pouco sobre o criador/vídeo, por que merece destaque no PKXD Central..."
                      className="w-full bg-black/40 border border-zinc-800 focus:border-purple-500 rounded-xl p-3 text-xs text-white placeholder-gray-500 outline-none transition-all resize-none"
                    />
                  </div>
                </div>
              )}

              {activeTab === 'shorts' && (
                <div className="space-y-5">
                  <div className="border-b border-white/5 pb-2">
                    <h3 className="font-sans font-black text-base uppercase text-cyan-300">
                      📱 Sugestão & Indicação de Shorts
                    </h3>
                    <p className="text-[11px] text-gray-400 font-sans leading-normal">
                      Indique seus curtas ou os vídeos curtos mais legais de PK XD para entrar no nosso feed rotativo!
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-300 uppercase tracking-wider font-mono">Nome do Canal / Indicado *</label>
                      <input
                        type="text"
                        required
                        value={shortsCreator}
                        onChange={(e) => setShortsCreator(e.target.value)}
                        placeholder="Nome do Criador ou Canal"
                        className="w-full bg-black/40 border border-zinc-800 focus:border-cyan-500 rounded-xl p-3 text-xs text-white placeholder-gray-500 outline-none transition-all"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-300 uppercase tracking-wider font-mono">URL do Short (YouTube ou TikTok) *</label>
                      <input
                        type="url"
                        required
                        value={shortsUrl}
                        onChange={(e) => setShortsUrl(e.target.value)}
                        placeholder="https://www.youtube.com/shorts/..."
                        className="w-full bg-black/40 border border-zinc-800 focus:border-cyan-500 rounded-xl p-3 text-xs text-white placeholder-gray-500 outline-none transition-all"
                      />
                    </div>
                  </div>

                  {/* Real Photo of Shorts Nominee */}
                  <div className="p-4 rounded-2xl bg-zinc-950/60 border border-cyan-500/20 space-y-3">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div>
                        <label className="text-[11px] font-bold text-cyan-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
                          <ImageIcon className="w-3.5 h-3.5 text-cyan-400" />
                          <span>Foto Real do Indicado (Opcional - Sem fotos falsas!)</span>
                        </label>
                        <p className="text-[10px] text-gray-400 font-sans">
                          Envie uma foto real do avatar ou canal do indicado do seu aparelho ou cole o link direto da imagem.
                        </p>
                      </div>

                      {/* Input type switch */}
                      <div className="flex items-center bg-black/50 p-1 rounded-xl border border-white/5 text-[10px] font-bold font-mono">
                        <button
                          type="button"
                          onClick={() => setShortsPhotoInputType('upload')}
                          className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                            shortsPhotoInputType === 'upload' ? 'bg-cyan-600 text-black font-black shadow' : 'text-gray-400 hover:text-white'
                          }`}
                        >
                          Upload Foto
                        </button>
                        <button
                          type="button"
                          onClick={() => setShortsPhotoInputType('url')}
                          className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                            shortsPhotoInputType === 'url' ? 'bg-cyan-600 text-black font-black shadow' : 'text-gray-400 hover:text-white'
                          }`}
                        >
                          Colar Link
                        </button>
                      </div>
                    </div>

                    {shortsPhotoInputType === 'upload' ? (
                      <div>
                        <label className="flex flex-col items-center justify-center p-3.5 border-2 border-dashed border-zinc-800 hover:border-cyan-500/50 rounded-xl bg-black/30 cursor-pointer transition-all">
                          <Upload className="w-5 h-5 text-cyan-400 mb-1" />
                          <span className="text-xs font-bold text-gray-300">Clique para selecionar foto do celular / PC</span>
                          <span className="text-[10px] text-gray-500 font-mono">PNG, JPG, WEBP (Max 5MB)</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleImageFileChange(e, setShortsCreatorPhoto)}
                            className="hidden"
                          />
                        </label>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <input
                          type="url"
                          value={shortsCreatorPhoto}
                          onChange={(e) => setShortsCreatorPhoto(e.target.value)}
                          placeholder="https://exemplo.com/foto_do_indicado.png"
                          className="w-full bg-black/40 border border-zinc-800 focus:border-cyan-500 rounded-xl p-2.5 text-xs text-white placeholder-gray-500 outline-none transition-all"
                        />
                      </div>
                    )}

                    {/* Preview real photo */}
                    {shortsCreatorPhoto && (
                      <div className="flex items-center gap-3 bg-black/40 p-2.5 rounded-xl border border-cyan-500/30">
                        <img
                          src={shortsCreatorPhoto}
                          alt="Foto do Indicado"
                          className="w-12 h-12 rounded-xl object-cover border border-cyan-500/50 bg-zinc-900 flex-shrink-0"
                          onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-white truncate">Foto do indicado anexada com sucesso!</p>
                          <p className="text-[10px] text-cyan-300 font-mono">Foto real selecionada</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShortsCreatorPhoto('')}
                          className="p-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg cursor-pointer transition-colors"
                          title="Remover foto"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Social Networks of Nominee - At least 1 mandatory */}
                  <div className="p-4 rounded-2xl bg-zinc-950/60 border border-white/5 space-y-3">
                    <div className="border-b border-white/5 pb-2 flex items-center justify-between flex-wrap gap-2">
                      <div>
                        <label className="text-[11px] font-bold text-cyan-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
                          <Link2 className="w-3.5 h-3.5 text-cyan-400" />
                          <span>Redes Sociais do Indicado *</span>
                        </label>
                        <p className="text-[10px] text-gray-400 font-sans">
                          Você pode preencher as três, mas <strong className="text-cyan-300">pelo menos uma (Instagram, TikTok ou YouTube) é obrigatória!</strong>
                        </p>
                      </div>
                      <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-mono">
                        Pelo menos 1 obrigatório
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {/* Instagram */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-pink-400 uppercase tracking-wider font-mono flex items-center gap-1">
                          <Instagram className="w-3 h-3 text-pink-400" />
                          <span>Instagram</span>
                        </label>
                        <input
                          type="text"
                          value={shortsInstagram}
                          onChange={(e) => setShortsInstagram(e.target.value)}
                          placeholder="@usuario ou link"
                          className="w-full bg-black/40 border border-zinc-800 focus:border-pink-500 rounded-xl p-2.5 text-xs text-white placeholder-gray-500 outline-none transition-all"
                        />
                      </div>

                      {/* TikTok */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider font-mono flex items-center gap-1">
                          <Smartphone className="w-3 h-3 text-cyan-400" />
                          <span>TikTok</span>
                        </label>
                        <input
                          type="text"
                          value={shortsTikTok}
                          onChange={(e) => setShortsTikTok(e.target.value)}
                          placeholder="@usuario ou link"
                          className="w-full bg-black/40 border border-zinc-800 focus:border-cyan-500 rounded-xl p-2.5 text-xs text-white placeholder-gray-500 outline-none transition-all"
                        />
                      </div>

                      {/* YouTube */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-red-400 uppercase tracking-wider font-mono flex items-center gap-1">
                          <Youtube className="w-3 h-3 text-red-400" />
                          <span>YouTube</span>
                        </label>
                        <input
                          type="text"
                          value={shortsYouTube}
                          onChange={(e) => setShortsYouTube(e.target.value)}
                          placeholder="@canal ou link"
                          className="w-full bg-black/40 border border-zinc-800 focus:border-red-500 rounded-xl p-2.5 text-xs text-white placeholder-gray-500 outline-none transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-300 uppercase tracking-wider font-mono">Frase de Efeito ou Título do Short *</label>
                    <input
                      type="text"
                      required
                      value={shortsTitle}
                      onChange={(e) => setShortsTitle(e.target.value)}
                      placeholder="Ex: MINHA NOVA ARMADURA DO PK XD SURPRESA! 🤖"
                      className="w-full bg-black/40 border border-zinc-800 focus:border-cyan-500 rounded-xl p-3 text-xs text-white placeholder-gray-500 outline-none transition-all"
                    />
                  </div>
                </div>
              )}

              {activeTab === 'theory' && (
                <div className="space-y-4">
                  <div className="border-b border-white/5 pb-2">
                    <h3 className="font-sans font-black text-base uppercase text-pink-300">
                      🔮 Enviar Nova Teoria ao Mural do Site
                    </h3>
                    <p className="text-[11px] text-gray-400 font-sans leading-normal">
                      Compartilhe suas ideias mais insanas e detalhadas sobre as próximas atualizações, mistérios e segredos do Admin!
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider font-mono">Nome de Autor / Nickname *</label>
                      <input
                        type="text"
                        required
                        value={theoryAuthor}
                        onChange={(e) => setTheoryAuthor(e.target.value)}
                        placeholder="Seu nome de fã"
                        className="w-full bg-black/40 border border-zinc-800 focus:border-pink-550 rounded-xl p-3 text-xs text-white placeholder-gray-500 outline-none transition-all"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider font-mono">Título da Teoria *</label>
                      <input
                        type="text"
                        required
                        value={theoryTitle}
                        onChange={(e) => setTheoryTitle(e.target.value)}
                        placeholder="Ex: O Retorno Secreto da Nave Alienígena!"
                        className="w-full bg-black/40 border border-zinc-800 focus:border-pink-550 rounded-xl p-3 text-xs text-white placeholder-gray-500 outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider font-mono">Sua Teoria Completa *</label>
                    <textarea
                      required
                      rows={5}
                      value={theoryContent}
                      onChange={(e) => setTheoryContent(e.target.value)}
                      placeholder="Descreva em detalhes a sua teoria aqui..."
                      className="w-full bg-black/40 border border-zinc-800 focus:border-pink-550 rounded-xl p-3 text-xs text-white placeholder-gray-500 outline-none transition-all resize-none"
                    />
                  </div>
                </div>
              )}

              {activeTab === 'admin' && (
                <div className="space-y-4">
                  <div className="border-b border-white/5 pb-2">
                    <h3 className="font-sans font-black text-base uppercase text-yellow-300">
                      🔐 Candidatura para Administrador (ADM)
                    </h3>
                    <p className="text-[11px] text-gray-400 font-sans leading-normal">
                      Faça parte do time PKXD Central! Ajude a registrar spoilers, organizar publicações e moderar nossa vibrante comunidade de fã-clube!
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1 col-span-1 md:col-span-2">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider font-mono">Nome Completo / Nickname *</label>
                      <input
                        type="text"
                        required
                        value={adminName}
                        onChange={(e) => setAdminName(e.target.value)}
                        placeholder="Seu nome"
                        className="w-full bg-black/40 border border-zinc-800 focus:border-yellow-500 rounded-xl p-3 text-xs text-white placeholder-gray-500 outline-none transition-all"
                      />
                    </div>

                    <div className="space-y-1 col-span-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider font-mono">Sua Idade *</label>
                      <input
                        type="number"
                        required
                        value={adminAge}
                        onChange={(e) => setAdminAge(e.target.value)}
                        placeholder="Ex: 14"
                        className="w-full bg-black/40 border border-zinc-800 focus:border-yellow-500 rounded-xl p-3 text-xs text-white placeholder-gray-500 outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider font-mono">Contato (Discord, WhatsApp, E-mail) *</label>
                      <input
                        type="text"
                        required
                        value={adminContact}
                        onChange={(e) => setAdminContact(e.target.value)}
                        placeholder="Seu ID do Discord ou número do WhatsApp"
                        className="w-full bg-black/40 border border-zinc-800 focus:border-yellow-500 rounded-xl p-3 text-xs text-white placeholder-gray-500 outline-none transition-all"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider font-mono">Horas Disponíveis por Semana *</label>
                      <input
                        type="text"
                        required
                        value={adminHours}
                        onChange={(e) => setAdminHours(e.target.value)}
                        placeholder="Ex: 5 horas, 10 horas por semana..."
                        className="w-full bg-black/40 border border-zinc-800 focus:border-yellow-500 rounded-xl p-3 text-xs text-white placeholder-gray-500 outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider font-mono">Por que você quer ser Admin do PKXD Central? *</label>
                    <textarea
                      required
                      rows={4}
                      value={adminReason}
                      onChange={(e) => setAdminReason(e.target.value)}
                      placeholder="Escreva seus motivos, se você tem experiência prévia moderando outros grupos ou sites, e o que pode acrescentar ao nosso portal..."
                      className="w-full bg-black/40 border border-zinc-800 focus:border-yellow-500 rounded-xl p-3 text-xs text-white placeholder-gray-500 outline-none transition-all resize-none"
                    />
                  </div>
                </div>
              )}

              {/* Action button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full py-3 px-6 rounded-2xl font-sans font-black text-xs uppercase tracking-wider transition-all duration-150 flex items-center justify-center gap-2 border shadow-lg cursor-pointer ${
                  isSubmitting 
                    ? 'bg-zinc-800 text-zinc-500 border-zinc-850 cursor-not-allowed'
                    : activeTab === 'panel'
                    ? 'bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-550 border-purple-400/40 text-white'
                    : activeTab === 'shorts'
                    ? 'bg-gradient-to-r from-cyan-500 to-teal-600 hover:from-cyan-400 hover:to-teal-550 border-cyan-400/40 text-black font-black'
                    : activeTab === 'theory'
                    ? 'bg-gradient-to-r from-pink-500 to-purple-650 hover:from-pink-400 hover:to-purple-550 border-pink-400/40 text-white'
                    : 'bg-gradient-to-r from-yellow-450 to-amber-500 hover:from-yellow-400 hover:to-amber-450 border-yellow-400/40 text-black font-black'
                }`}
              >
                <Send className="w-4 h-4" />
                <span>{isSubmitting ? 'Enviando Dados...' : 'Enviar Inscrição Oficial 🚀'}</span>
              </button>

            </form>

          </div>
        </>
      )}

    </div>
  );
}

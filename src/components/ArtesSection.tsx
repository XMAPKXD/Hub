import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, addDoc, deleteDoc, doc, query, orderBy, updateDoc } from 'firebase/firestore';
import { ArtAsset } from '../types';
import { 
  Download, 
  Copy, 
  Plus, 
  Trash2, 
  Image as ImageIcon, 
  Video as VideoIcon,
  Film,
  Tag, 
  Check, 
  Heart, 
  Sparkles, 
  ExternalLink,
  UploadCloud,
  X,
  ArrowUp,
  ArrowDown,
  Search,
  Maximize2,
  Share2,
  Filter,
  Flame,
  Grid,
  Eye,
  Layers,
  Sparkle
} from 'lucide-react';
import { loadFromCache, saveToCache } from '../utils/cache';

interface ArtesSectionProps {
  isAdmin: boolean;
  triggerAudio: (sound: string) => void;
  soundEnabled: boolean;
}

interface BatchUploadItem {
  id: string;
  title: string;
  desc: string;
  imageUrl: string;
  category: string;
  isVideo: boolean;
  fileName: string;
}

export default function ArtesSection({ isAdmin, triggerAudio, soundEnabled }: ArtesSectionProps) {
  // Instant Cache initialization with real site assets: loads in 0ms!
  const [artes, setArtes] = useState<ArtAsset[]>(() => {
    return loadFromCache<ArtAsset[]>('pkxd_cache_artes', []);
  });
  const [loading, setLoading] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>("Todas");
  const [searchQuery, setSearchQuery] = useState("");
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  
  // Local liked IDs for instant heart reaction feedback
  const [likedIds, setLikedIds] = useState<string[]>(() => {
    return loadFromCache<string[]>('pkxd_artes_liked', []);
  });

  // Modal states
  const [selectedAsset, setSelectedAsset] = useState<ArtAsset | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [uploadMode, setUploadMode] = useState<'single' | 'batch'>('single');

  // Single form upload states
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newImgUrl, setNewImgUrl] = useState("");
  const [newDownloadUrl, setNewDownloadUrl] = useState("");
  const [newCategory, setNewCategory] = useState("Renders");
  const [isCustomCat, setIsCustomCat] = useState(false);
  const [customCategory, setCustomCategory] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [isVideo, setIsVideo] = useState(false);

  // Batch Upload States
  const [batchItems, setBatchItems] = useState<BatchUploadItem[]>([]);
  const [globalBatchCategory, setGlobalBatchCategory] = useState<string>("Renders");
  const [isUploadingBatch, setIsUploadingBatch] = useState(false);

  // Notification & Feedback states
  const [notif, setNotif] = useState<string | null>(null);
  const [notifType, setNotifType] = useState<'success' | 'info'>('success');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const showToast = (msg: string, type: 'success' | 'info' = 'success') => {
    setNotif(msg);
    setNotifType(type);
    setTimeout(() => {
      setNotif(null);
    }, 3500);
  };

  // Helper for YouTube embed
  const getYouTubeEmbedUrl = (url: string) => {
    if (!url) return '';
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\/shorts\/|shorts\?v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11)
      ? `https://www.youtube.com/embed/${match[2]}`
      : url;
  };

  // Listen to Firestore real-time updates for art_assets
  useEffect(() => {
    const q = query(collection(db, 'art_assets'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: ArtAsset[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        list.push({
          id: docSnap.id,
          title: data.title || '',
          description: data.description || '',
          imageUrl: data.imageUrl || '',
          downloadUrl: data.downloadUrl || '',
          category: data.category || 'Outros',
          isVideo: data.isVideo || false,
          order: typeof data.order === 'number' ? data.order : undefined,
          createdAt: data.createdAt || Date.now()
        });
      });

      if (list.length > 0) {
        setArtes(list);
        saveToCache('pkxd_cache_artes', list);
      }
      setLoading(false);
    }, (error) => {
      console.warn("Could not fetch real-time art_assets from Firestore, using cache:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Toggle favorite / like on asset
  const handleToggleLike = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    triggerAudio('tap');
    
    let newLikes: string[];
    if (likedIds.includes(id)) {
      newLikes = likedIds.filter(item => item !== id);
      showToast("💔 Removido dos favoritos", "info");
    } else {
      newLikes = [...likedIds, id];
      showToast("❤️ Adicionado aos seus favoritos! 🎉", "success");
      triggerAudio('success');
    }
    setLikedIds(newLikes);
    saveToCache('pkxd_artes_liked', newLikes);
  };

  // File Upload (Images & Videos)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isVid = file.type.startsWith('video/');
    const isImg = file.type.startsWith('image/');

    if (!isVid && !isImg) {
      showToast('⚠️ Selecione uma foto ou vídeo válido!', 'info');
      return;
    }

    setUploadingImage(true);
    triggerAudio('tap');

    if (isVid) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setNewImgUrl(result);
        if (!newDownloadUrl) {
          setNewDownloadUrl(result);
        }
        setIsVideo(true);
        if (newCategory === "Renders") {
          setNewCategory("Vídeos");
        }
        showToast("🎬 Vídeo carregado com sucesso!", "success");
        triggerAudio('success');
        setUploadingImage(false);
      };
      reader.onerror = () => {
        showToast('⚠️ Erro ao ler o arquivo de vídeo.', 'info');
        setUploadingImage(false);
      };
      reader.readAsDataURL(file);
    } else {
      setIsVideo(false);
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const maxDim = 1200;

          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.clearRect(0, 0, width, height);
            ctx.drawImage(img, 0, 0, width, height);
            const compressedBase64 = canvas.toDataURL('image/png');
            setNewImgUrl(compressedBase64);
            if (!newDownloadUrl) {
              setNewDownloadUrl(compressedBase64);
            }
            showToast("📸 Foto carregada em alta qualidade!", "success");
            triggerAudio('success');
          }
          setUploadingImage(false);
        };
        img.onerror = () => {
          showToast('⚠️ Falha ao processar a imagem.', 'info');
          setUploadingImage(false);
        };
        img.src = event.target?.result as string;
      };
      reader.onerror = () => {
        showToast('⚠️ Erro ao ler arquivo do dispositivo.', 'info');
        setUploadingImage(false);
      };
      reader.readAsDataURL(file);
    }
  };

  // Add a new art asset or video to Firestore & Cache
  const handleAddArt = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newTitle.trim() || !newImgUrl.trim()) {
      showToast("⚠️ Título e link ou imagem/vídeo são obrigatórios!", "info");
      triggerAudio('tap');
      return;
    }

    const finalCat = isCustomCat ? (customCategory.trim() || "Outros") : newCategory;
    const isVidFinal = isVideo || 
      finalCat === "Vídeos" || 
      newImgUrl.startsWith('data:video/') || 
      newImgUrl.endsWith('.mp4') || 
      newImgUrl.endsWith('.webm') || 
      newImgUrl.includes('youtube.com') || 
      newImgUrl.includes('youtu.be');

    const minOrder = artes.reduce((min, item) => {
      const o = item.order !== undefined ? item.order : 0;
      return Math.min(min, o);
    }, 0);

    const newItem: Omit<ArtAsset, 'id'> = {
      title: newTitle.trim(),
      description: newDesc.trim() || "Use livremente nos seus vídeos do YouTube e redes sociais! 🎬✨",
      imageUrl: newImgUrl.trim(),
      downloadUrl: newDownloadUrl.trim() || newImgUrl.trim(),
      category: finalCat,
      isVideo: isVidFinal,
      order: minOrder - 1,
      createdAt: Date.now()
    };

    try {
      triggerAudio('tap');
      const docRef = await addDoc(collection(db, 'art_assets'), {
        ...newItem,
        admin_secret: "pkxd2026_super_secret_admin_key"
      });

      const updatedList = [{ id: docRef.id, ...newItem }, ...artes];
      setArtes(updatedList);
      saveToCache('pkxd_cache_artes', updatedList);

      // Clear fields
      setNewTitle("");
      setNewDesc("");
      setNewImgUrl("");
      setNewDownloadUrl("");
      setNewCategory("Renders");
      setCustomCategory("");
      setIsCustomCat(false);
      setIsVideo(false);
      setShowAddModal(false);

      showToast(isVidFinal ? "🎬 Vídeo publicado na galeria com sucesso!" : "📸 Foto/Arte publicada com sucesso! 🌟", "success");
      triggerAudio('success');
    } catch (err) {
      console.error("Erro ao adicionar arte/vídeo:", err);
      // Even if firestore errors, update locally for immediate UX
      const tempId = 'local_' + Date.now();
      const updatedList = [{ id: tempId, ...newItem }, ...artes];
      setArtes(updatedList);
      saveToCache('pkxd_cache_artes', updatedList);
      setShowAddModal(false);
      showToast("✨ Mídia salva no dispositivo!", "success");
    }
  };

  // Delete an art asset
  const handleDeleteArt = async (id: string, title: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!isAdmin) return;
    if (!window.confirm(`Tem certeza que deseja excluir "${title}"?`)) return;

    try {
      triggerAudio('tap');
      await deleteDoc(doc(db, 'art_assets', id));
      const updated = artes.filter(a => a.id !== id);
      setArtes(updated);
      saveToCache('pkxd_cache_artes', updated);
      if (selectedAsset?.id === id) {
        setSelectedAsset(null);
      }
      showToast(`🗑️ "${title}" excluído com sucesso!`, "success");
      triggerAudio('success');
    } catch (err) {
      console.error("Erro ao remover arte:", err);
      const updated = artes.filter(a => a.id !== id);
      setArtes(updated);
      saveToCache('pkxd_cache_artes', updated);
      if (selectedAsset?.id === id) setSelectedAsset(null);
      showToast("🗑️ Removido da galeria local", "success");
    }
  };

  // Download media item
  const handleDownload = async (url: string, title: string, isVid: boolean, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    triggerAudio('tap');
    showToast(`⬇️ Iniciando download de "${title}"...`, 'info');

    try {
      if (url.startsWith('data:')) {
        const a = document.createElement('a');
        a.href = url;
        a.download = `${title.toLowerCase().replace(/[^a-z0-9]/gi, '_')}.${isVid ? 'mp4' : 'png'}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        showToast('🎉 Download concluído com sucesso!', 'success');
        triggerAudio('success');
        return;
      }

      if (url.includes('youtube.com') || url.includes('youtu.be')) {
        window.open(url, '_blank', 'noreferrer');
        showToast('🎬 Abrindo vídeo no YouTube...', 'info');
        return;
      }

      const res = await fetch(url);
      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `${title.toLowerCase().replace(/[^a-z0-9]/gi, '_')}.${isVid ? 'mp4' : 'png'}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(blobUrl);

      showToast('🎉 Download salvo no seu dispositivo!', 'success');
      triggerAudio('success');
    } catch (err) {
      window.open(url, '_blank', 'noreferrer');
      showToast('Abrindo link em nova aba para salvar...', 'info');
    }
  };

  // Share Asset
  const handleShareAsset = async (asset: ArtAsset, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    triggerAudio('tap');
    const shareUrl = `${window.location.origin}${window.location.pathname}?arte=${asset.id}#artes`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `PKXD Central - ${asset.title}`,
          text: `Confira essa mídia no PKXD Central: ${asset.title}`,
          url: shareUrl
        });
        showToast("Compartilhado com sucesso!", "success");
        return;
      } catch (err) {}
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedId(asset.id);
      showToast("🔗 Link copiado para a área de transferência!", "success");
      setTimeout(() => setCopiedId(null), 2500);
    } catch (err) {
      showToast("Erro ao copiar link", "info");
    }
  };

  // Copy Direct Link
  const handleCopyLink = (url: string, id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    triggerAudio('tap');
    try {
      navigator.clipboard.writeText(url);
      setCopiedId(id);
      showToast("🔗 Link copiado!", "success");
      setTimeout(() => setCopiedId(null), 2500);
    } catch (err) {}
  };

  // Categories list for tabs
  const categories = useMemo(() => {
    const base = ["Todas", "Vídeos", "Renders", "Logos", "Fundos", "Overlays", "Outros"];
    const uniqueFromDb = Array.from(new Set(artes.map(a => a.category).filter(Boolean))) as string[];
    const extra = uniqueFromDb.filter(c => !base.includes(c) && c !== "Todas" && c !== "CUSTOM");
    return [...base, ...extra];
  }, [artes]);

  // Filtered & Searched assets
  const filteredArtes = useMemo(() => {
    let list = [...artes];

    if (onlyFavorites) {
      list = list.filter(a => likedIds.includes(a.id));
    } else if (categoryFilter !== "Todas") {
      list = list.filter(a => a.category?.toLowerCase() === categoryFilter.toLowerCase());
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(a => 
        a.title.toLowerCase().includes(q) || 
        a.description?.toLowerCase().includes(q) ||
        a.category?.toLowerCase().includes(q)
      );
    }

    return list.sort((a, b) => {
      const orderA = a.order !== undefined ? a.order : Infinity;
      const orderB = b.order !== undefined ? b.order : Infinity;
      if (orderA !== orderB) return orderA - orderB;
      return (b.createdAt || 0) - (a.createdAt || 0);
    });
  }, [artes, categoryFilter, searchQuery, onlyFavorites, likedIds]);

  return (
    <div className="w-full bg-zinc-950/80 backdrop-blur-md rounded-3xl p-4 sm:p-7 border-2 border-pink-500/20 shadow-2xl relative overflow-hidden text-left" id="artes-section-main">
      
      {/* Decorative neon ambient lights */}
      <div className="absolute -top-10 -right-10 w-48 h-48 bg-pink-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Floating Toast Notification */}
      {notif && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-2xl border text-xs font-black uppercase tracking-wider animate-bounce ${
          notifType === 'success' 
            ? 'bg-emerald-950/95 text-emerald-300 border-emerald-500/40' 
            : 'bg-purple-950/95 text-purple-300 border-purple-500/40'
        }`}>
          <Sparkles className="w-4 h-4 text-amber-400 flex-shrink-0 animate-pulse" />
          <span>{notif}</span>
        </div>
      )}

      {/* Main Header & Actions */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6 pb-4 border-b border-white/10">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="p-2 bg-gradient-to-tr from-pink-500/20 to-purple-500/20 text-pink-300 border border-pink-400/30 rounded-xl shadow-inner flex items-center justify-center">
              <Film className="w-5 h-5 text-pink-400 animate-pulse" />
            </div>
            <h2 className="text-xl sm:text-2xl font-black font-sans bg-gradient-to-r from-pink-400 via-purple-300 to-cyan-400 bg-clip-text text-transparent uppercase tracking-tight">
              Área de Fotos, Renders & Vídeos
            </h2>
            <span className="bg-pink-500/20 text-pink-300 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border border-pink-500/40 shadow-sm flex items-center gap-1">
              <Flame className="w-3 h-3 fill-pink-400 text-pink-400" />
              <span>Alta Definição</span>
            </span>
          </div>
          <p className="text-xs text-neutral-300 max-w-xl leading-relaxed">
            Galeria oficial para criadores e fãs de PK XD! Baixe fotos, renders 3D sem fundo, vídeos, overlays e molduras gratuitas para seus vídeos e edits! 🎨✨
          </p>
        </div>

        {/* Header Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <button
            onClick={() => {
              triggerAudio('tap');
              setShowAddModal(true);
            }}
            className="flex-1 md:flex-none px-4 py-2.5 bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 hover:brightness-110 active:scale-95 text-white font-sans text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer border border-pink-400/40"
          >
            <Plus className="w-4 h-4" />
            <span>Enviar Foto ou Vídeo</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="space-y-3 mb-6">
        <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
          {/* Quick Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar foto, render, vídeo ou categoria..."
              className="w-full pl-9 pr-8 py-2 bg-zinc-900/80 border border-white/10 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-pink-500/50 transition-colors"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white p-0.5 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Favorites Pill */}
          <button
            onClick={() => {
              triggerAudio('tap');
              setOnlyFavorites(!onlyFavorites);
            }}
            className={`px-3 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer border ${
              onlyFavorites 
                ? 'bg-pink-500 text-white border-pink-400 shadow-md shadow-pink-500/20' 
                : 'bg-zinc-900/80 text-zinc-300 border-white/10 hover:border-pink-500/30'
            }`}
          >
            <Heart className={`w-3.5 h-3.5 ${onlyFavorites ? 'fill-white text-white' : 'text-pink-400'}`} />
            <span>Favoritos ({likedIds.length})</span>
          </button>
        </div>

        {/* Category Pills Tabs */}
        {!onlyFavorites && (
          <div className="flex flex-wrap gap-1.5 items-center bg-zinc-900/50 p-1.5 rounded-2xl border border-white/5 overflow-x-auto no-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  triggerAudio('tap');
                  setCategoryFilter(cat);
                }}
                className={`px-3 py-1.5 rounded-xl font-sans text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 flex-shrink-0 ${
                  categoryFilter === cat
                    ? 'bg-gradient-to-r from-pink-500/30 to-purple-500/30 text-pink-200 border border-pink-400/50 shadow-sm'
                    : 'text-zinc-400 hover:text-white hover:bg-white/5 border border-transparent'
                }`}
              >
                {cat === "Vídeos" && <VideoIcon className="w-3 h-3 text-cyan-400" />}
                {cat === "Renders" && <Sparkles className="w-3 h-3 text-amber-400" />}
                {cat === "Todas" && <Grid className="w-3 h-3 text-pink-400" />}
                <span>{cat}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Grid of Media Assets */}
      {filteredArtes.length === 0 ? (
        <div className="py-16 text-center border-2 border-dashed border-white/10 rounded-3xl bg-zinc-900/30 space-y-3">
          <Film className="w-12 h-12 text-zinc-600 mx-auto" />
          <h3 className="text-sm font-bold text-zinc-300 uppercase tracking-wider">
            Nenhuma mídia encontrada
          </h3>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto leading-relaxed">
            {searchQuery 
              ? `Nenhum resultado para "${searchQuery}". Tente outros termos.` 
              : onlyFavorites 
                ? 'Você ainda não favoritou nenhuma foto ou vídeo. Clique no coração das mídias para salvar aqui!' 
                : 'Nenhuma mídia cadastrada nesta categoria ainda.'}
          </p>
          <button
            onClick={() => {
              triggerAudio('tap');
              setShowAddModal(true);
            }}
            className="px-4 py-2 bg-pink-500/20 hover:bg-pink-500/30 text-pink-300 border border-pink-500/40 text-xs font-black uppercase tracking-wider rounded-xl transition-all inline-flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Enviar Primeira Mídia</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredArtes.map((art, idx) => {
            const isArtVid = art.isVideo || 
              art.category === "Vídeos" || 
              (art.imageUrl && (
                art.imageUrl.startsWith('data:video/') || 
                art.imageUrl.endsWith('.mp4') || 
                art.imageUrl.endsWith('.webm') || 
                art.imageUrl.endsWith('.mov') ||
                art.imageUrl.includes('youtube.com') ||
                art.imageUrl.includes('youtu.be')
              ));

            const isLiked = likedIds.includes(art.id);

            return (
              <div 
                key={art.id}
                onClick={() => {
                  triggerAudio('tap');
                  setSelectedAsset(art);
                }}
                className="group bg-zinc-900/70 border border-white/10 hover:border-pink-500/50 rounded-2xl overflow-hidden transition-all duration-300 shadow-lg hover:shadow-2xl hover:shadow-pink-950/20 flex flex-col justify-between relative cursor-pointer"
              >
                {/* Category Pill Tag */}
                <div className="absolute top-2.5 left-2.5 z-10 flex items-center gap-1.5 pointer-events-none">
                  <span className="bg-black/80 backdrop-blur-md text-pink-300 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-lg border border-pink-500/40 flex items-center gap-1 shadow-md">
                    {isArtVid ? <VideoIcon className="w-3 h-3 text-cyan-400" /> : <ImageIcon className="w-3 h-3 text-pink-400" />}
                    <span>{art.category}</span>
                  </span>
                </div>

                {/* Floating Heart & Share Actions */}
                <div className="absolute top-2.5 right-2.5 z-10 flex items-center gap-1.5">
                  <button
                    onClick={(e) => handleToggleLike(art.id, e)}
                    className={`p-1.5 rounded-xl border backdrop-blur-md transition-all shadow-md active:scale-90 cursor-pointer ${
                      isLiked 
                        ? 'bg-pink-600 text-white border-pink-400' 
                        : 'bg-black/70 hover:bg-zinc-800 text-zinc-300 border-white/20 hover:text-pink-400'
                    }`}
                    title={isLiked ? "Remover dos favoritos" : "Favoritar"}
                  >
                    <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-white' : ''}`} />
                  </button>

                  <button
                    onClick={(e) => handleShareAsset(art, e)}
                    className="p-1.5 bg-black/70 hover:bg-zinc-800 text-zinc-300 hover:text-cyan-300 rounded-xl border border-white/20 transition-all shadow-md active:scale-90 cursor-pointer"
                    title="Compartilhar link"
                  >
                    {copiedId === art.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
                  </button>

                  {isAdmin && (
                    <button
                      onClick={(e) => handleDeleteArt(art.id, art.title, e)}
                      className="p-1.5 bg-red-950/80 hover:bg-red-900 text-red-300 rounded-xl border border-red-500/40 transition-all shadow-md active:scale-90 cursor-pointer"
                      title="Excluir Mídia"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Media Preview Box */}
                <div 
                  className="relative aspect-video w-full overflow-hidden flex items-center justify-center border-b border-white/10 bg-zinc-950"
                  style={!isArtVid ? {
                    backgroundColor: '#18181b',
                    backgroundImage: `
                      linear-gradient(45deg, #27272a 25%, transparent 25%), 
                      linear-gradient(-45deg, #27272a 25%, transparent 25%), 
                      linear-gradient(45deg, transparent 75%, #27272a 75%), 
                      linear-gradient(-45deg, transparent 75%, #27272a 75%)
                    `,
                    backgroundSize: '16px 16px',
                    backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px'
                  } : {}}
                >
                  {isArtVid ? (
                    (art.imageUrl.includes('youtube.com') || art.imageUrl.includes('youtu.be')) ? (
                      <iframe
                        src={getYouTubeEmbedUrl(art.imageUrl)}
                        title={art.title}
                        className="w-full h-full border-0 pointer-events-auto"
                        allowFullScreen
                      />
                    ) : (
                      <video 
                        src={art.imageUrl} 
                        playsInline
                        preload="metadata"
                        className="w-full h-full object-contain bg-black"
                      />
                    )
                  ) : (
                    <img 
                      src={art.imageUrl} 
                      alt={art.title} 
                      className="max-w-full max-h-full object-contain p-2 transition-transform duration-300 group-hover:scale-105"
                      onError={(e) => {
                        (e.target as any).style.display = 'none';
                      }}
                      referrerPolicy="no-referrer"
                      loading="lazy"
                    />
                  )}

                  {/* Hover visual cue */}
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                    <div className="p-2 bg-pink-500/30 backdrop-blur-md rounded-full border border-pink-400/50 text-white flex items-center gap-1.5 text-xs font-black uppercase shadow-lg">
                      <Maximize2 className="w-4 h-4" />
                      <span>Ver Completo</span>
                    </div>
                  </div>
                </div>

                {/* Details & Actions Footer */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3 bg-gradient-to-b from-zinc-900/60 to-zinc-950/80">
                  <div className="space-y-1">
                    <h3 className="font-sans font-black text-xs sm:text-sm text-white leading-tight uppercase tracking-wide group-hover:text-pink-300 transition-colors flex items-center gap-1.5">
                      {isArtVid && <VideoIcon className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />}
                      <span className="line-clamp-1">{art.title}</span>
                    </h3>
                    <p className="text-[11px] text-zinc-400 line-clamp-2 leading-relaxed">
                      {art.description}
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-2 border-t border-white/5">
                    <button
                      onClick={(e) => handleDownload(art.downloadUrl || art.imageUrl, art.title, isArtVid, e)}
                      className="flex-1 py-2 px-3 bg-gradient-to-r from-pink-500/20 to-purple-500/20 hover:from-pink-500/30 hover:to-purple-500/30 border border-pink-400/30 hover:border-pink-400/60 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-wider text-pink-200 hover:text-white text-center flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-sm"
                    >
                      <Download className="w-3.5 h-3.5 text-pink-300" />
                      <span>{isArtVid ? 'Baixar Vídeo' : 'Baixar Foto'}</span>
                    </button>

                    <button
                      onClick={(e) => handleCopyLink(art.downloadUrl || art.imageUrl, art.id, e)}
                      className="p-2 bg-zinc-800/80 hover:bg-zinc-700 border border-white/10 rounded-xl transition-all cursor-pointer text-zinc-400 hover:text-white"
                      title="Copiar link direto"
                    >
                      {copiedId === art.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* FULLSCREEN LIGHTBOX / ASSET PREVIEW MODAL */}
      {selectedAsset && (
        <div 
          onClick={() => setSelectedAsset(null)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex items-center justify-center p-3 sm:p-6 animate-fade-in"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-zinc-950 border-2 border-pink-500/30 rounded-3xl max-w-4xl w-full max-h-[92vh] overflow-hidden flex flex-col shadow-2xl relative"
          >
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between gap-3 bg-zinc-900/80">
              <div className="flex items-center gap-2 overflow-hidden">
                <span className="bg-pink-500/20 text-pink-300 px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase border border-pink-500/40 flex-shrink-0">
                  {selectedAsset.category}
                </span>
                <h3 className="font-sans font-black text-sm sm:text-base text-white truncate uppercase">
                  {selectedAsset.title}
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleToggleLike(selectedAsset.id)}
                  className={`p-2 rounded-xl border transition-all cursor-pointer ${
                    likedIds.includes(selectedAsset.id)
                      ? 'bg-pink-600 text-white border-pink-400'
                      : 'bg-zinc-800 text-zinc-300 border-white/10 hover:text-pink-400'
                  }`}
                  title="Favoritar"
                >
                  <Heart className={`w-4 h-4 ${likedIds.includes(selectedAsset.id) ? 'fill-white' : ''}`} />
                </button>

                <button
                  onClick={() => setSelectedAsset(null)}
                  className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-xl border border-white/10 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Media Canvas */}
            <div 
              className="relative flex-1 min-h-[300px] max-h-[55vh] sm:max-h-[60vh] bg-black flex items-center justify-center overflow-hidden p-2"
              style={!selectedAsset.isVideo ? {
                backgroundColor: '#18181b',
                backgroundImage: `
                  linear-gradient(45deg, #27272a 25%, transparent 25%), 
                  linear-gradient(-45deg, #27272a 25%, transparent 25%), 
                  linear-gradient(45deg, transparent 75%, #27272a 75%), 
                  linear-gradient(-45deg, transparent 75%, #27272a 75%)
                `,
                backgroundSize: '16px 16px',
                backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px'
              } : {}}
            >
              {selectedAsset.isVideo || selectedAsset.category === 'Vídeos' ? (
                (selectedAsset.imageUrl.includes('youtube.com') || selectedAsset.imageUrl.includes('youtu.be')) ? (
                  <iframe
                    src={getYouTubeEmbedUrl(selectedAsset.imageUrl)}
                    title={selectedAsset.title}
                    className="w-full h-full aspect-video border-0"
                    allowFullScreen
                  />
                ) : (
                  <video 
                    src={selectedAsset.imageUrl} 
                    controls
                    autoPlay
                    playsInline
                    className="max-w-full max-h-full object-contain"
                  />
                )
              ) : (
                <img 
                  src={selectedAsset.imageUrl} 
                  alt={selectedAsset.title}
                  className="max-w-full max-h-full object-contain"
                  referrerPolicy="no-referrer"
                />
              )}
            </div>

            {/* Modal Footer & Actions */}
            <div className="p-4 sm:p-5 bg-zinc-900/90 border-t border-white/10 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="space-y-0.5">
                <p className="text-xs text-zinc-300 font-sans">
                  {selectedAsset.description}
                </p>
                <p className="text-[10px] text-zinc-500 font-mono">
                  {new Date(selectedAsset.createdAt).toLocaleDateString('pt-BR')} • 100% Gratuito para Edits e Vídeos
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => handleShareAsset(selectedAsset)}
                  className="px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 border border-white/10 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Compartilhar</span>
                </button>

                <button
                  onClick={() => handleDownload(selectedAsset.downloadUrl || selectedAsset.imageUrl, selectedAsset.title, !!selectedAsset.isVideo)}
                  className="px-5 py-2 bg-gradient-to-r from-pink-500 to-purple-600 hover:brightness-110 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 cursor-pointer shadow-lg shadow-pink-500/20 active:scale-95 transition-all"
                >
                  <Download className="w-4 h-4" />
                  <span>Baixar Arquivo HD</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ADD / UPLOAD ASSET MODAL */}
      {showAddModal && (
        <div 
          onClick={() => setShowAddModal(false)}
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-zinc-950 border-2 border-pink-500/40 rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-5 sm:p-6 shadow-2xl space-y-5 relative"
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <UploadCloud className="w-5 h-5 text-pink-400" />
                <h3 className="font-sans font-black text-base sm:text-lg text-white uppercase">
                  Enviar Foto ou Vídeo
                </h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-xl border border-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddArt} className="space-y-4">
              {/* File Upload from Device */}
              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase text-pink-300 tracking-wider flex items-center gap-1.5">
                  <UploadCloud className="w-3.5 h-3.5" />
                  <span>1. Enviar do seu Dispositivo (Celular/PC)</span>
                </label>
                <input
                  type="file"
                  accept="image/*,video/*"
                  onChange={handleFileUpload}
                  className="w-full text-xs text-zinc-400 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-black file:uppercase file:bg-pink-500/20 file:text-pink-300 hover:file:bg-pink-500/30 file:cursor-pointer cursor-pointer bg-zinc-900 p-2 rounded-xl border border-white/10"
                />
              </div>

              {/* URL Alternative */}
              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase text-zinc-300 tracking-wider">
                  Ou Cole o Link da Imagem / YouTube
                </label>
                <input
                  type="text"
                  value={newImgUrl}
                  onChange={(e) => setNewImgUrl(e.target.value)}
                  placeholder="https://... ou link do YouTube"
                  className="w-full px-3 py-2 bg-zinc-900 border border-white/10 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-pink-500/50"
                />
              </div>

              {/* Title */}
              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase text-zinc-300 tracking-wider">
                  Título da Mídia *
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Ex: Novo Render 3D Koosh Astronauta"
                  required
                  className="w-full px-3 py-2 bg-zinc-900 border border-white/10 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-pink-500/50"
                />
              </div>

              {/* Category */}
              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase text-zinc-300 tracking-wider">
                  Categoria
                </label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-900 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-pink-500/50"
                >
                  <option value="Renders">Renders 3D (Sem Fundo)</option>
                  <option value="Vídeos">Vídeos & Edits</option>
                  <option value="Logos">Logos & Ícones</option>
                  <option value="Fundos">Fundos & Wallpapers</option>
                  <option value="Overlays">Molduras & Overlays</option>
                  <option value="Outros">Outros</option>
                </select>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase text-zinc-300 tracking-wider">
                  Descrição (Opcional)
                </label>
                <textarea
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Ex: Ideal para thumb do YouTube..."
                  rows={2}
                  className="w-full px-3 py-2 bg-zinc-900 border border-white/10 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-pink-500/50"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-2 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-bold uppercase rounded-xl border border-white/10 transition-colors"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={uploadingImage}
                  className="flex-1 py-2.5 bg-gradient-to-r from-pink-500 to-purple-600 hover:brightness-110 active:scale-95 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-pink-500/20 disabled:opacity-50"
                >
                  {uploadingImage ? 'Processando...' : 'Publicar Mídia 🎉'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

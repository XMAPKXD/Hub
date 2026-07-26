import React, { useState, useEffect } from 'react';
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
  Layers,
  FolderPlus
} from 'lucide-react';

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
  customCategory?: string;
  isCustomCat?: boolean;
  isVideo: boolean;
  fileName: string;
}

const DEFAULT_ARTES: Omit<ArtAsset, 'id'>[] = [
  {
    title: "Logo Oficial PK XD Central",
    description: "Logo oficial do canal com fundo transparente em alta definição. Perfeito para capas de vídeo e overlays!",
    imageUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=600",
    downloadUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=1200",
    category: "Logos",
    createdAt: Date.now() - 50000
  },
  {
    title: "Koosh Render 3D - Gamer",
    description: "Koosh fofo com fone de ouvido gamer e pose de vitória! Render oficial transparente de alta qualidade.",
    imageUrl: "https://images.unsplash.com/photo-1566577134770-3d85bb3a9cc4?auto=format&fit=crop&q=80&w=600",
    downloadUrl: "https://images.unsplash.com/photo-1566577134770-3d85bb3a9cc4?auto=format&fit=crop&q=80&w=1200",
    category: "Renders",
    createdAt: Date.now() - 40000
  },
  {
    title: "Background Espacial Fofo (Pastel)",
    description: "Fundo espacial estelar com nuvens lilás, planetas e foguinhos fofos. Lindo para usar atrás de sua webcam!",
    imageUrl: "https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?auto=format&fit=crop&q=80&w=600",
    downloadUrl: "https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?auto=format&fit=crop&q=80&w=1200",
    category: "Fundos",
    createdAt: Date.now() - 30000
  },
  {
    title: "Borda de Câmera PKXD Fofa",
    description: "Moldura de webcam temática rosa e roxa com detalhes de patinhas e corações animados. Transparente!",
    imageUrl: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&q=80&w=600",
    downloadUrl: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&q=80&w=1200",
    category: "Overlays",
    createdAt: Date.now() - 20000
  },
  {
    title: "Adesivo 'Inscreva-se' Estilo PKXD",
    description: "Botão fofo de se inscrever e deixar o like decorado com os emoticons icônicos do PK XD. Pronto para usar!",
    imageUrl: "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=600",
    downloadUrl: "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=1200",
    category: "Overlays",
    createdAt: Date.now() - 10000
  }
];

export default function ArtesSection({ isAdmin, triggerAudio, soundEnabled }: ArtesSectionProps) {
  const [artes, setArtes] = useState<ArtAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<string>("Todas");
  
  // Notification alert within section
  const [notif, setNotif] = useState<string | null>(null);
  const [notifType, setNotifType] = useState<'success' | 'info'>('success');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Admin / User upload states
  const [showAddModal, setShowAddModal] = useState(false);
  const [uploadMode, setUploadMode] = useState<'single' | 'batch'>('single');
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
  const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0 });

  // Show a temporal alert toast inside this section
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
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11)
      ? `https://www.youtube.com/embed/${match[2]}`
      : url;
  };

  // Process and upload file (Images or Videos) directly from device
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isVid = file.type.startsWith('video/');
    const isImg = file.type.startsWith('image/');

    if (!isVid && !isImg) {
      alert('⚠️ Por favor, selecione um arquivo de imagem ou vídeo válido!');
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
        showToast("🎬 Vídeo do seu aparelho carregado com sucesso!", "success");
        triggerAudio('success');
        setUploadingImage(false);
      };
      reader.onerror = () => {
        alert('⚠️ Erro ao ler o arquivo de vídeo do seu aparelho.');
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
          const maxDim = 900;

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
            showToast("📸 Imagem do seu celular carregada e compactada com sucesso!", "success");
            triggerAudio('success');
          }
          setUploadingImage(false);
        };
        img.onerror = () => {
          alert('⚠️ Falha ao processar a imagem do aparelho.');
          setUploadingImage(false);
        };
        img.src = event.target?.result as string;
      };
      reader.onerror = () => {
        alert('⚠️ Erro ao ler arquivo do celular.');
        setUploadingImage(false);
      };
      reader.readAsDataURL(file);
    }
  };

  // Listen to Firestore real-time updates for art_assets
  useEffect(() => {
    const q = query(collection(db, 'art_assets'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: ArtAsset[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        list.push({
          id: doc.id,
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
      setArtes(list);
      setLoading(false);
    }, (error) => {
      console.error("Erro ao escutar artes:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Quick seed function for the administrator
  const handleSeedDefaultArtes = async () => {
    if (!isAdmin) return;
    try {
      triggerAudio('tap');
      setLoading(true);
      for (const item of DEFAULT_ARTES) {
        await addDoc(collection(db, 'art_assets'), {
          ...item,
          admin_secret: "pkxd2026_super_secret_admin_key"
        });
      }
      showToast("✨ Pacote de artes iniciais restaurado com sucesso! 🎨", "success");
      triggerAudio('success');
    } catch (err) {
      console.error("Erro ao restaurar artes:", err);
      showToast("❌ Erro ao restaurar artes", "info");
    } finally {
      setLoading(false);
    }
  };

  // Add a new art asset or video
  const handleAddArt = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newTitle.trim() || !newImgUrl.trim()) {
      showToast("⚠️ Título e Link ou Arquivo de Imagem/Vídeo são obrigatórios!", "info");
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

    try {
      triggerAudio('tap');
      await addDoc(collection(db, 'art_assets'), {
        title: newTitle.trim(),
        description: newDesc.trim() || "Use livremente nos seus vídeos do YouTube e redes sociais! 🎬✨",
        imageUrl: newImgUrl.trim(),
        downloadUrl: newDownloadUrl.trim() || newImgUrl.trim(),
        category: finalCat,
        isVideo: isVidFinal,
        order: minOrder - 1,
        createdAt: Date.now(),
        admin_secret: "pkxd2026_super_secret_admin_key"
      });

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

      showToast(isVidFinal ? "🎉 Novo vídeo publicado com sucesso! 🎬" : "🎉 Nova arte adicionada com sucesso! 🌟", "success");
      triggerAudio('success');
    } catch (err) {
      console.error("Erro ao adicionar arte/vídeo:", err);
      showToast("❌ Erro ao salvar mídia no banco de dados", "info");
    }
  };

  // Delete an art asset
  const handleDeleteArt = async (id: string, title: string) => {
    if (!isAdmin) return;
    if (!window.confirm(`Tem certeza que deseja excluir "${title}" permanentemente?`)) {
      return;
    }

    try {
      triggerAudio('tap');
      await deleteDoc(doc(db, 'art_assets', id));
      showToast(`🗑️ "${title}" removido com sucesso!`, "success");
      triggerAudio('success');
    } catch (err) {
      console.error("Erro ao remover arte:", err);
      showToast("❌ Erro ao excluir mídia", "info");
    }
  };

  // Delete an entire section / category
  const handleDeleteSection = async (categoryToDelete: string) => {
    if (!isAdmin || !categoryToDelete || categoryToDelete === "Todas") return;

    const affectedItems = artes.filter(a => a.category?.toLowerCase() === categoryToDelete.toLowerCase());
    const count = affectedItems.length;

    if (!window.confirm(`Tem certeza que deseja excluir a seção "${categoryToDelete}"?\n\nExistem ${count} mídia(s) nesta seção. Todas as mídias desta seção serão movidas para "Outros".`)) {
      return;
    }

    try {
      triggerAudio('tap');
      if (count > 0) {
        await Promise.all(
          affectedItems.map(item => 
            updateDoc(doc(db, 'art_assets', item.id), { category: "Outros" })
          )
        );
      }
      setCategoryFilter("Todas");
      showToast(`🗑️ Seção "${categoryToDelete}" excluída com sucesso! ${count > 0 ? `(${count} mídia(s) movida(s) para Outros)` : ''}`, "success");
      triggerAudio('success');
    } catch (err) {
      console.error("Erro ao excluir seção:", err);
      showToast("❌ Erro ao excluir a seção", "info");
    }
  };

  // Process batch files select
  const handleBatchFilesSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingImage(true);
    triggerAudio('tap');

    const fileArray = Array.from(files) as File[];
    const newBatchList: BatchUploadItem[] = [];
    let processedCount = 0;

    fileArray.forEach((file) => {
      const isVid = file.type.startsWith('video/');
      const cleanName = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
      const defaultCat = isVid ? "Vídeos" : (globalBatchCategory !== "CUSTOM" ? globalBatchCategory : "Renders");

      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;

        if (isVid) {
          newBatchList.push({
            id: Math.random().toString(36).substring(2) + Date.now(),
            title: cleanName,
            desc: "Use livremente nos seus vídeos do YouTube e redes sociais! 🎬✨",
            imageUrl: result,
            category: defaultCat,
            isVideo: true,
            fileName: file.name
          });
          processedCount++;
          if (processedCount === fileArray.length) {
            setBatchItems(prev => [...prev, ...newBatchList]);
            setUploadingImage(false);
            showToast(`📦 ${fileArray.length} arquivo(s) adicionado(s) ao lote!`, 'success');
            triggerAudio('success');
          }
        } else {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;
            const maxDim = 900;

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
              newBatchList.push({
                id: Math.random().toString(36).substring(2) + Date.now(),
                title: cleanName,
                desc: "Use livremente nos seus vídeos do YouTube e redes sociais! 🎬✨",
                imageUrl: compressedBase64,
                category: defaultCat,
                isVideo: false,
                fileName: file.name
              });
            }
            processedCount++;
            if (processedCount === fileArray.length) {
              setBatchItems(prev => [...prev, ...newBatchList]);
              setUploadingImage(false);
              showToast(`📦 ${fileArray.length} foto(s) adicionada(s) ao lote!`, 'success');
              triggerAudio('success');
            }
          };
          img.onerror = () => {
            processedCount++;
            if (processedCount === fileArray.length) {
              setBatchItems(prev => [...prev, ...newBatchList]);
              setUploadingImage(false);
            }
          };
          img.src = result;
        }
      };
      reader.readAsDataURL(file);
    });
  };

  // Apply category to all batch items
  const handleApplyGlobalCategory = (cat: string) => {
    if (!cat || cat === "CUSTOM") return;
    setBatchItems(prev => prev.map(item => ({
      ...item,
      category: cat,
      isCustomCat: false
    })));
    showToast(`🏷️ Categoria "${cat}" aplicada a todas as mídias do lote!`, 'success');
  };

  // Submit batch upload
  const handleBatchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (batchItems.length === 0) {
      showToast("⚠️ Adicione pelo menos uma mídia ao lote!", "info");
      return;
    }

    setIsUploadingBatch(true);
    setBatchProgress({ current: 0, total: batchItems.length });
    triggerAudio('tap');

    let currentMinOrder = artes.reduce((min, item) => {
      const o = item.order !== undefined ? item.order : 0;
      return Math.min(min, o);
    }, 0);

    try {
      for (let i = 0; i < batchItems.length; i++) {
        const item = batchItems[i];
        const finalCat = item.isCustomCat ? (item.customCategory?.trim() || "Outros") : item.category;
        
        currentMinOrder -= 1;

        await addDoc(collection(db, 'art_assets'), {
          title: item.title.trim() || `Mídia ${i + 1}`,
          description: item.desc.trim() || "Use livremente nos seus vídeos e artes!",
          imageUrl: item.imageUrl,
          downloadUrl: item.imageUrl,
          category: finalCat,
          isVideo: item.isVideo,
          order: currentMinOrder,
          createdAt: Date.now() + i,
          admin_secret: "pkxd2026_super_secret_admin_key"
        });

        setBatchProgress({ current: i + 1, total: batchItems.length });
      }

      showToast(`🎉 ${batchItems.length} mídia(s) publicada(s) em lote com sucesso! 🚀`, 'success');
      triggerAudio('success');

      setBatchItems([]);
      setShowAddModal(false);
      setUploadMode('single');
    } catch (err) {
      console.error("Erro no envio em lote:", err);
      showToast("❌ Ocorreu um erro ao enviar lote de mídias.", "info");
    } finally {
      setIsUploadingBatch(false);
    }
  };

  // Safe high-performance download handler
  const handleDownload = (url: string, title: string, isVid?: boolean) => {
    triggerAudio('tap');
    if (!url) return;

    const safeTitle = title.toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
    
    const ext = isVid || url.startsWith('data:video/') || url.endsWith('.mp4') ? 'mp4' : 'png';
    const filename = `${safeTitle || 'media'}_pkxd.${ext}`;

    try {
      if (url.startsWith('data:')) {
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast("📥 Download iniciado com sucesso!", "success");
      } else {
        fetch(url, { mode: 'cors' })
          .then(res => {
            if (!res.ok) throw new Error("Network error");
            return res.blob();
          })
          .then(blob => {
            const blobUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);
            showToast("📥 Download concluído!", "success");
          })
          .catch(() => {
            const win = window.open(url, '_blank');
            if (win) {
              showToast("🔗 Arquivo aberto em nova aba para salvar!", "success");
            } else {
              showToast("⚠️ Bloqueador de popups impediu abertura da aba.", "info");
            }
          });
      }
    } catch (error) {
      console.error("Erro no download:", error);
      window.open(url, '_blank');
    }
  };

  // Copy link handler
  const handleCopyLink = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    triggerAudio('tap');
    setCopiedId(id);
    showToast("📋 Link copiado para a área de transferência!", "success");
    setTimeout(() => {
      setCopiedId(null);
    }, 2000);
  };

  // Reorder art assets (move up/down)
  const handleMoveArt = async (artId: string, direction: 'up' | 'down') => {
    if (!isAdmin) return;
    const index = filteredArtes.findIndex(a => a.id === artId);
    if (index === -1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= filteredArtes.length) return;

    try {
      triggerAudio('tap');
      const currentArt = filteredArtes[index];
      const targetArt = filteredArtes[targetIndex];

      const currentOrder = currentArt.order !== undefined ? currentArt.order : index;
      const targetOrder = targetArt.order !== undefined ? targetArt.order : targetIndex;

      let newOrderForCurrent = targetOrder;
      let newOrderForTarget = currentOrder;

      if (newOrderForCurrent === newOrderForTarget) {
        newOrderForCurrent = targetIndex;
        newOrderForTarget = index;
      }

      await Promise.all([
        updateDoc(doc(db, 'art_assets', currentArt.id), { order: newOrderForCurrent }),
        updateDoc(doc(db, 'art_assets', targetArt.id), { order: newOrderForTarget })
      ]);

      showToast("↕️ Ordem da mídia atualizada!", "success");
      triggerAudio('success');
    } catch (err) {
      console.error("Erro ao reordenar mídia:", err);
      showToast("❌ Erro ao salvar nova ordem", "info");
    }
  };

  // Categories list for filter tabs
  const categories = React.useMemo(() => {
    const base = ["Todas", "Vídeos", "Renders", "Logos", "Fundos", "Overlays", "Outros"];
    const uniqueFromDb = Array.from(new Set(artes.map(a => a.category).filter(Boolean))) as string[];
    const extra = uniqueFromDb.filter(c => !base.includes(c) && c !== "Todas" && c !== "CUSTOM");
    return [...base, ...extra];
  }, [artes]);

  // Categories list for options dropdowns
  const availableCategories = React.useMemo(() => {
    const base = ["Renders", "Vídeos", "Logos", "Fundos", "Overlays", "Outros"];
    const uniqueFromDb = Array.from(new Set(artes.map(a => a.category).filter(Boolean))) as string[];
    const extra = uniqueFromDb.filter(c => !base.includes(c) && c !== "Todas" && c !== "CUSTOM");
    return [...base, ...extra];
  }, [artes]);

  // Sorted list based on order index, fallback to createdAt descending
  const sortedArtes = React.useMemo(() => {
    return [...artes].sort((a, b) => {
      const orderA = a.order !== undefined ? a.order : Infinity;
      const orderB = b.order !== undefined ? b.order : Infinity;
      if (orderA !== orderB) {
        return orderA - orderB;
      }
      return b.createdAt - a.createdAt;
    });
  }, [artes]);

  // Filtered list
  const filteredArtes = React.useMemo(() => {
    if (categoryFilter === "Todas") return sortedArtes;
    return sortedArtes.filter(a => a.category.toLowerCase() === categoryFilter.toLowerCase());
  }, [sortedArtes, categoryFilter]);

  return (
    <div className="w-full bg-zinc-950/80 backdrop-blur-md rounded-3xl p-5 sm:p-7 border border-pink-500/20 shadow-2xl relative overflow-hidden" id="artes-section-main">
      
      {/* Decorative fofa pastel blobs */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Internal floating alert notification */}
      {notif && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-2xl border text-xs font-black uppercase tracking-wider animate-bounce ${
          notifType === 'success' 
            ? 'bg-emerald-950/90 text-emerald-300 border-emerald-500/30' 
            : 'bg-purple-950/90 text-purple-300 border-purple-500/30'
        }`}>
          <Sparkles className="w-4 h-4 text-amber-400 flex-shrink-0 animate-pulse" />
          <span>{notif}</span>
        </div>
      )}

      {/* Header Area */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-7 pb-4 border-b border-white/5">
        <div className="text-center md:text-left space-y-1">
          <div className="flex items-center justify-center md:justify-start gap-2">
            <h2 className="text-xl sm:text-2xl font-black font-sans bg-gradient-to-r from-pink-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent uppercase tracking-wider">
              🎨 Central de Artes e Vídeos
            </h2>
            <span className="bg-pink-500/20 text-pink-300 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border border-pink-500/30">
              Youtubers & Criadores 🎬
            </span>
          </div>
          <p className="text-xs text-neutral-400 max-w-xl leading-relaxed">
            Área oficial de criadores! Baixe e envie fotos, renders transparentes, vídeos fofos, molduras e logos do PK XD Central para seus projetos! 🌟🚀
          </p>
        </div>

        {/* Upload Controls in the Header */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          <button
            onClick={() => {
              triggerAudio('tap');
              setShowAddModal(true);
            }}
            className="px-4 py-2.5 bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 hover:brightness-110 text-white font-sans text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-lg active:scale-95 flex items-center gap-2 cursor-pointer border border-pink-400/30"
          >
            <Plus className="w-4 h-4" />
            <span>Adicionar Arte ou Vídeo 🎬</span>
          </button>

          {isAdmin && artes.length === 0 && (
            <button
              onClick={handleSeedDefaultArtes}
              className="px-3 py-2 bg-zinc-900 border border-white/10 text-gray-300 hover:text-white hover:bg-zinc-800 text-[10px] font-bold uppercase rounded-xl transition-all flex items-center gap-1 cursor-pointer"
              title="Restaurar artes padrões recomendadas"
            >
              <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
              <span>Restaurar Iniciais</span>
            </button>
          )}
        </div>
      </div>

      {/* Category Tabs / Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex flex-wrap gap-1.5 justify-center sm:justify-start bg-neutral-900/40 p-1.5 rounded-2xl border border-white/5">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => {
                triggerAudio('tap');
                setCategoryFilter(cat);
              }}
              className={`px-3 py-1.5 rounded-xl font-sans text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                categoryFilter === cat
                  ? 'bg-pink-500/20 text-pink-300 border border-pink-500/40 shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-white/5 border border-transparent'
              }`}
            >
              {cat === "Vídeos" && <VideoIcon className="w-3 h-3 text-cyan-400" />}
              <span>{cat}</span>
            </button>
          ))}
        </div>

        {/* Delete category section button for Admin */}
        {isAdmin && categoryFilter !== "Todas" && (
          <button
            onClick={() => handleDeleteSection(categoryFilter)}
            className="px-3.5 py-1.5 bg-red-950/70 hover:bg-red-900 text-red-300 hover:text-white border border-red-500/30 rounded-xl text-xs font-black uppercase transition-all cursor-pointer flex items-center gap-1.5 shadow-md active:scale-95"
            title={`Excluir a seção "${categoryFilter}" e mover suas mídias para Outros`}
          >
            <Trash2 className="w-3.5 h-3.5 text-red-400" />
            <span>Excluir Seção "{categoryFilter}" 🗑️</span>
          </button>
        )}
      </div>

      {/* Content Area */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <div className="w-10 h-10 border-4 border-pink-500/20 border-t-pink-500 rounded-full animate-spin" />
          <p className="text-xs text-neutral-400 font-mono">Carregando catálogo de mídias...</p>
        </div>
      ) : filteredArtes.length === 0 ? (
        <div className="py-16 text-center border-2 border-dashed border-white/5 rounded-3xl bg-neutral-900/20 space-y-3">
          <Film className="w-12 h-12 text-neutral-600 mx-auto" />
          <h3 className="text-sm font-bold text-neutral-300 uppercase tracking-wider">
            Nenhuma mídia encontrada
          </h3>
          <p className="text-xs text-neutral-500 max-w-sm mx-auto leading-relaxed">
            {categoryFilter === "Todas" 
              ? "Nenhum arquivo cadastrado ainda. Clique no botão acima para upar suas fotos ou vídeos!" 
              : `Não existem mídias na categoria "${categoryFilter}" no momento.`}
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
        /* Bento Grid of assets & videos */
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

            return (
              <div 
                key={art.id}
                className="group bg-neutral-900/50 border border-white/5 hover:border-pink-500/30 rounded-2xl overflow-hidden transition-all duration-300 shadow-md hover:shadow-xl hover:shadow-pink-950/10 flex flex-col relative"
              >
                {/* Category Pill Tag */}
                <span className="absolute top-2.5 left-2.5 z-10 bg-neutral-950/80 backdrop-blur-md text-pink-300 text-[9px] font-black uppercase px-2 py-0.5 rounded-lg border border-pink-500/30 flex items-center gap-1 shadow-sm">
                  {isArtVid ? <VideoIcon className="w-2.5 h-2.5 text-cyan-400" /> : <Tag className="w-2.5 h-2.5" />}
                  <span>{art.category}</span>
                </span>

                {/* Admin controls: Reorder & Delete */}
                {isAdmin && (
                  <div className="absolute top-2.5 right-2.5 z-10 flex items-center gap-1 bg-neutral-950/85 backdrop-blur-md p-1 rounded-xl border border-white/10 shadow-md">
                    <button
                      onClick={() => handleMoveArt(art.id, 'up')}
                      disabled={idx === 0}
                      className="p-1 text-neutral-300 hover:text-pink-300 disabled:opacity-25 disabled:hover:text-neutral-300 transition-all cursor-pointer disabled:cursor-not-allowed"
                      title="Mover para cima / antes"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleMoveArt(art.id, 'down')}
                      disabled={idx === filteredArtes.length - 1}
                      className="p-1 text-neutral-300 hover:text-pink-300 disabled:opacity-25 disabled:hover:text-neutral-300 transition-all cursor-pointer disabled:cursor-not-allowed"
                      title="Mover para baixo / depois"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    <div className="w-[1px] h-3 bg-white/20 mx-0.5" />
                    <button
                      onClick={() => handleDeleteArt(art.id, art.title)}
                      className="p-1 text-neutral-300 hover:text-red-400 transition-all cursor-pointer"
                      title="Excluir Mídia"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* Media Container: Image or Video */}
                <div 
                  className="relative aspect-video w-full overflow-hidden flex items-center justify-center border-b border-white/5 bg-zinc-900"
                  style={!isArtVid ? {
                    backgroundColor: '#27272a',
                    backgroundImage: `
                      linear-gradient(45deg, #3f3f46 25%, transparent 25%), 
                      linear-gradient(-45deg, #3f3f46 25%, transparent 25%), 
                      linear-gradient(45deg, transparent 75%, #3f3f46 75%), 
                      linear-gradient(-45deg, transparent 75%, #3f3f46 75%)
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
                        className="w-full h-full border-0"
                        allowFullScreen
                      />
                    ) : (
                      <video 
                        src={art.imageUrl} 
                        controls
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
                        (e.target as any).src = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=400";
                      }}
                      referrerPolicy="no-referrer"
                    />
                  )}
                  
                  {/* Decorative icon on image hover */}
                  {!isArtVid && (
                    <div className="absolute inset-0 bg-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                      <Heart className="w-8 h-8 text-pink-400/30 animate-pulse fill-pink-400/10" />
                    </div>
                  )}
                </div>

                {/* Content area */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3.5">
                  <div className="space-y-1">
                    <h3 className="font-sans font-black text-xs sm:text-sm text-white leading-tight uppercase tracking-wide group-hover:text-pink-300 transition-colors flex items-center gap-1.5">
                      {isArtVid && <VideoIcon className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />}
                      <span>{art.title}</span>
                    </h3>
                    <p className="text-[11px] text-neutral-400 line-clamp-2 leading-relaxed">
                      {art.description}
                    </p>
                  </div>

                  {/* Bottom interactive buttons */}
                  <div className="flex gap-2 pt-1 border-t border-white/5">
                    {/* Download button */}
                    <button
                      onClick={() => handleDownload(art.downloadUrl || art.imageUrl, art.title, isArtVid)}
                      className="flex-1 py-1.5 px-3 bg-pink-500/15 hover:bg-pink-500/25 border border-pink-500/30 hover:border-pink-500/50 rounded-xl text-[10px] font-extrabold uppercase tracking-wider text-pink-300 hover:text-white text-center flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>{isArtVid ? 'Baixar Vídeo' : 'Download'}</span>
                    </button>

                    {/* Copy Link Button */}
                    <button
                      onClick={() => handleCopyLink(art.downloadUrl || art.imageUrl, art.id)}
                      className="p-2 bg-neutral-800/60 hover:bg-neutral-800 border border-white/5 rounded-xl transition-all cursor-pointer text-gray-400 hover:text-white"
                      title="Copiar Link de Download Direto"
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

      {/* Info footer block */}
      <div className="mt-8 p-4 bg-purple-950/15 border border-purple-500/10 rounded-2xl flex flex-col sm:flex-row items-center gap-3">
        <div className="p-2 bg-purple-500/10 rounded-xl">
          <Sparkles className="w-5 h-5 text-purple-300 animate-pulse" />
        </div>
        <div className="text-center sm:text-left space-y-0.5">
          <h4 className="text-xs font-black uppercase text-purple-300 tracking-wider">
            💜 Dica de Criação:
          </h4>
          <p className="text-[10px] text-neutral-400 leading-relaxed max-w-2xl">
            Sempre que for usar fotos, renders ou vídeos do canal, baixe em alta qualidade clicando em Download. Adicione créditos do <strong>PK XD Central</strong> no seu canal!
          </p>
        </div>
      </div>

      {/* Dialog modal for Adding assets / videos */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-4 animate-fade-in">
          <div className="bg-zinc-900 border border-pink-500/30 rounded-3xl w-full max-w-xl max-h-[92vh] flex flex-col relative shadow-2xl animate-scale-up overflow-hidden">
            
            {/* Close button */}
            <button
              onClick={() => {
                triggerAudio('tap');
                setShowAddModal(false);
              }}
              className="absolute top-4 right-4 z-10 p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-all cursor-pointer bg-zinc-900/60"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header */}
            <div className="p-5 pb-3 border-b border-white/5 flex items-center gap-2">
              <div className="p-1.5 bg-pink-500/15 rounded-xl border border-pink-500/20">
                <Film className="w-5 h-5 text-pink-400" />
              </div>
              <h3 className="text-sm font-black font-sans text-white uppercase tracking-wider">
                Adicionar Mídias 🎬
              </h3>
            </div>

            {/* Mode selector tab */}
            <div className="px-5 pt-3">
              <div className="flex bg-black/50 p-1 rounded-2xl border border-white/10">
                <button
                  type="button"
                  onClick={() => {
                    triggerAudio('tap');
                    setUploadMode('single');
                  }}
                  className={`flex-1 py-2 text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    uploadMode === 'single'
                      ? 'bg-pink-500/20 text-pink-300 border border-pink-500/30 shadow-md'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  <Film className="w-3.5 h-3.5" />
                  <span>1 Mídia Única</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    triggerAudio('tap');
                    setUploadMode('batch');
                  }}
                  className={`flex-1 py-2 text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    uploadMode === 'batch'
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30 shadow-md'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Envio em Lote 📚 ({batchItems.length})</span>
                </button>
              </div>
            </div>

            {uploadMode === 'single' ? (
              /* Single item form */
              <form onSubmit={handleAddArt} className="flex flex-col flex-1 overflow-hidden">
                <div className="p-5 space-y-4 overflow-y-auto max-h-[58vh] scrollbar-thin text-left">
                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold uppercase text-neutral-400">Título</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Animação Fofa do PK XD / Render"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-pink-500 font-bold"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold uppercase text-neutral-400">Descrição</label>
                    <textarea
                      rows={2}
                      placeholder="Explique do que se trata e como os criadores podem utilizar..."
                      value={newDesc}
                      onChange={(e) => setNewDesc(e.target.value)}
                      className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-pink-500"
                    />
                  </div>

                  {/* Media File Upload choice */}
                  <div className="space-y-2 border border-white/5 bg-black/20 p-3 rounded-2xl text-left">
                    <label className="block text-[10px] font-extrabold uppercase text-neutral-400">
                      Enviar Foto ou Vídeo do Aparelho 📱
                    </label>
                    
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <label className={`flex-1 flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-4 cursor-pointer hover:bg-white/5 hover:border-pink-500/50 transition-all ${newImgUrl.startsWith('data:') ? 'border-emerald-500/40 bg-emerald-500/5' : 'border-white/10'}`}>
                          <UploadCloud className={`w-6 h-6 mb-1 ${newImgUrl.startsWith('data:') ? 'text-emerald-400' : 'text-pink-400'}`} />
                          <span className={`text-[11px] font-black uppercase text-center ${newImgUrl.startsWith('data:') ? 'text-emerald-400' : 'text-pink-400'}`}>
                            {newImgUrl.startsWith('data:') ? (isVideo ? '✓ Vídeo Selecionado!' : '✓ Foto Selecionada!') : '📱 Escolher Foto ou Vídeo'}
                          </span>
                          <span className="text-[9px] text-gray-400 text-center mt-0.5">
                            Aceita .PNG, .JPG, .MP4, .WEBM, .MOV do celular
                          </span>
                          <input 
                            type="file" 
                            accept="image/*,video/*" 
                            onChange={handleFileUpload} 
                            className="hidden" 
                          />
                        </label>
                      </div>

                      {uploadingImage && (
                        <div className="flex items-center justify-center gap-2 py-1">
                          <div className="w-4 h-4 border-2 border-pink-400 border-t-transparent rounded-full animate-spin" />
                          <span className="text-[10px] font-mono text-pink-400 uppercase tracking-widest animate-pulse">Carregando arquivo...</span>
                        </div>
                      )}

                      {/* Preview Thumbnail if selected */}
                      {newImgUrl && (
                        <div className="relative rounded-xl overflow-hidden border border-white/10 h-32 w-full max-w-[240px] mx-auto flex items-center justify-center bg-black shadow-inner">
                          {isVideo || newImgUrl.startsWith('data:video/') ? (
                            <video src={newImgUrl} controls playsInline className="max-h-full max-w-full rounded-lg object-contain" />
                          ) : (
                            <img src={newImgUrl} alt="Preview" className="max-h-full max-w-full rounded-lg object-contain" />
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              triggerAudio('tap');
                              setNewImgUrl("");
                              setIsVideo(false);
                              if (newDownloadUrl.startsWith('data:')) {
                                setNewDownloadUrl("");
                              }
                            }}
                            className="absolute top-1 right-1 p-1 bg-red-600 hover:bg-red-700 text-white rounded-full transition-all cursor-pointer shadow-md z-10"
                            title="Remover"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      )}

                      {/* Manual URL input */}
                      <div className="relative pt-1">
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <span className="text-[9px] text-zinc-500 font-bold uppercase">Ou usar link da internet (imagem ou vídeo MP4/YouTube)</span>
                        </div>
                        <input
                          type="text"
                          placeholder="https://exemplo.com/video.mp4 ou link do YouTube"
                          value={newImgUrl.startsWith('data:') ? '[Arquivo do Aparelho]' : newImgUrl}
                          disabled={newImgUrl.startsWith('data:')}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val !== '[Arquivo do Aparelho]') {
                              setNewImgUrl(val);
                              if (val.includes('.mp4') || val.includes('.webm') || val.includes('youtube.com') || val.includes('youtu.be')) {
                                setIsVideo(true);
                                setNewCategory("Vídeos");
                              }
                            }
                          }}
                          className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-pink-500 font-semibold disabled:opacity-45"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold uppercase text-neutral-400">Seção / Categoria</label>
                    <select
                      value={isCustomCat ? "CUSTOM" : newCategory}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === "CUSTOM") {
                          setIsCustomCat(true);
                        } else {
                          setIsCustomCat(false);
                          setNewCategory(val);
                          if (val === "Vídeos") {
                            setIsVideo(true);
                          }
                        }
                      }}
                      className="w-full px-3 py-2 bg-neutral-800 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-pink-500 font-bold cursor-pointer"
                    >
                      {availableCategories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat === "Vídeos" ? "🎬 " : cat === "Renders" ? "🎨 " : cat === "Logos" ? "🏷️ " : cat === "Fundos" ? "🌌 " : cat === "Overlays" ? "📸 " : "📁 "}
                          {cat}
                        </option>
                      ))}
                      <option value="CUSTOM">➕ Criar Nova Categoria...</option>
                    </select>
                  </div>

                  {isCustomCat && (
                    <div className="space-y-1 animate-scale-up">
                      <label className="text-[10px] font-extrabold uppercase text-pink-400">Nome da Nova Categoria</label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: Editais, Curtas..."
                        value={customCategory}
                        onChange={(e) => setCustomCategory(e.target.value)}
                        className="w-full px-3 py-2 bg-black/40 border border-pink-500/30 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-pink-500 font-bold"
                      />
                    </div>
                  )}
                </div>

                {/* Fixed Footer */}
                <div className="p-5 border-t border-white/5 bg-zinc-950/60 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 py-2 bg-neutral-800 hover:bg-neutral-750 text-neutral-300 font-sans text-xs font-bold uppercase rounded-xl transition-all cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-sans text-xs font-black uppercase tracking-wider rounded-xl hover:from-pink-600 hover:to-purple-700 transition-all shadow-md active:scale-95 cursor-pointer"
                  >
                    Salvar Mídia
                  </button>
                </div>
              </form>
            ) : (
              /* Batch upload mode */
              <div className="flex flex-col flex-1 overflow-hidden p-5 space-y-4">
                {/* File picker for multiple files */}
                <div className="space-y-2">
                  <label className="flex flex-col items-center justify-center border-2 border-dashed border-purple-500/40 bg-purple-500/5 hover:bg-purple-500/10 rounded-2xl p-4 cursor-pointer transition-all">
                    <UploadCloud className="w-8 h-8 text-purple-400 mb-1" />
                    <span className="text-xs font-black uppercase text-purple-300 text-center">
                      📱 Selecionar Múltiplas Fotos e Vídeos do Celular
                    </span>
                    <span className="text-[10px] text-neutral-400 text-center mt-0.5">
                      Segure para escolher vários arquivos (.png, .jpg, .mp4) de uma só vez!
                    </span>
                    <input
                      type="file"
                      multiple
                      accept="image/*,video/*"
                      onChange={handleBatchFilesSelect}
                      className="hidden"
                    />
                  </label>

                  {uploadingImage && (
                    <div className="flex items-center justify-center gap-2 py-2">
                      <div className="w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
                      <span className="text-[10px] font-mono text-purple-300 uppercase tracking-widest animate-pulse">
                        Processando fotos/vídeos selecionados...
                      </span>
                    </div>
                  )}
                </div>

                {/* Master applicator toolbar */}
                {batchItems.length > 0 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-2 p-3 bg-neutral-950/80 rounded-2xl border border-white/10 text-left">
                    <span className="text-[10px] font-extrabold uppercase text-neutral-400 flex items-center gap-1">
                      <Tag className="w-3 h-3 text-pink-400" /> Categoria padrão para este lote:
                    </span>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <select
                        value={globalBatchCategory}
                        onChange={(e) => {
                          const cat = e.target.value;
                          setGlobalBatchCategory(cat);
                          if (cat !== "CUSTOM") {
                            handleApplyGlobalCategory(cat);
                          }
                        }}
                        className="w-full sm:w-auto px-3 py-1 bg-neutral-800 border border-white/10 rounded-xl text-xs text-white font-bold cursor-pointer"
                      >
                        {availableCategories.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {/* Batch list of selected files */}
                <div className="flex-1 overflow-y-auto max-h-[45vh] space-y-3 pr-1 scrollbar-thin text-left">
                  {batchItems.length === 0 ? (
                    <div className="py-12 text-center border border-dashed border-white/10 rounded-2xl bg-black/20 space-y-2">
                      <Layers className="w-8 h-8 text-neutral-600 mx-auto" />
                      <p className="text-xs font-bold text-neutral-400">
                        Nenhum arquivo adicionado ao lote ainda.
                      </p>
                      <p className="text-[10px] text-neutral-500">
                        Clique na caixa pontilhada acima para selecionar várias fotos de uma vez!
                      </p>
                    </div>
                  ) : (
                    batchItems.map((item, index) => (
                      <div key={item.id} className="p-3 bg-black/50 border border-white/10 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center gap-3 relative group">
                        {/* Thumbnail */}
                        <div className="w-full sm:w-24 h-20 bg-black rounded-xl border border-white/10 overflow-hidden flex-shrink-0 flex items-center justify-center relative">
                          {item.isVideo ? (
                            <video src={item.imageUrl} className="max-h-full max-w-full object-contain" />
                          ) : (
                            <img src={item.imageUrl} alt={item.title} className="max-h-full max-w-full object-contain" />
                          )}
                          <span className="absolute bottom-1 right-1 px-1 py-0.5 bg-black/80 text-[8px] font-black uppercase text-purple-300 rounded">
                            {item.isVideo ? 'Vídeo' : 'Foto'}
                          </span>
                        </div>

                        {/* Title and Category Controls */}
                        <div className="flex-1 space-y-2 w-full">
                          <div className="flex items-center justify-between gap-2">
                            <input
                              type="text"
                              value={item.title}
                              onChange={(e) => {
                                const val = e.target.value;
                                setBatchItems(prev => prev.map((b, i) => i === index ? { ...b, title: val } : b));
                              }}
                              placeholder="Título da mídia"
                              className="w-full px-2.5 py-1.5 bg-neutral-900 border border-white/10 rounded-xl text-xs text-white font-bold focus:ring-1 focus:ring-pink-500"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                triggerAudio('tap');
                                setBatchItems(prev => prev.filter((_, i) => i !== index));
                              }}
                              className="p-1.5 text-neutral-400 hover:text-red-400 bg-neutral-800 hover:bg-neutral-750 rounded-xl cursor-pointer transition-all"
                              title="Remover do lote"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <div className="flex flex-col sm:flex-row gap-2">
                            <div className="flex-1">
                              <select
                                value={item.isCustomCat ? "CUSTOM" : item.category}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setBatchItems(prev => prev.map((b, i) => {
                                    if (i === index) {
                                      if (val === "CUSTOM") {
                                        return { ...b, isCustomCat: true };
                                      } else {
                                        return { ...b, category: val, isCustomCat: false };
                                      }
                                    }
                                    return b;
                                  }));
                                }}
                                className="w-full px-2 py-1.5 bg-neutral-800 border border-white/10 rounded-xl text-[11px] text-white font-bold cursor-pointer"
                              >
                                {availableCategories.map(cat => (
                                  <option key={cat} value={cat}>{cat}</option>
                                ))}
                                <option value="CUSTOM">➕ Nova Categoria...</option>
                              </select>

                              {item.isCustomCat && (
                                <input
                                  type="text"
                                  placeholder="Nome da categoria"
                                  value={item.customCategory || ""}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setBatchItems(prev => prev.map((b, i) => i === index ? { ...b, customCategory: val } : b));
                                  }}
                                  className="w-full mt-1.5 px-2 py-1 bg-black/60 border border-pink-500/30 rounded-lg text-[11px] text-white font-bold"
                                />
                              )}
                            </div>

                            <input
                              type="text"
                              value={item.desc}
                              onChange={(e) => {
                                const val = e.target.value;
                                setBatchItems(prev => prev.map((b, i) => i === index ? { ...b, desc: val } : b));
                              }}
                              placeholder="Descrição rápida (opcional)"
                              className="flex-1 px-2.5 py-1.5 bg-neutral-900 border border-white/10 rounded-xl text-[11px] text-neutral-300"
                            />
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Batch Submit Footer */}
                <div className="pt-3 border-t border-white/5 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="py-2.5 px-4 bg-neutral-800 hover:bg-neutral-750 text-neutral-300 font-sans text-xs font-bold uppercase rounded-xl transition-all cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleBatchSubmit}
                    disabled={isUploadingBatch || batchItems.length === 0}
                    className="flex-1 py-2.5 bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 text-white font-sans text-xs font-black uppercase tracking-wider rounded-xl hover:brightness-110 transition-all shadow-md active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isUploadingBatch ? (
                      `Publicando (${batchProgress.current}/${batchProgress.total})...`
                    ) : (
                      `🚀 Publicar ${batchItems.length} Mídia(s) no Canal`
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}

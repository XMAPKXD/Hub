import React, { useState } from 'react';
import { Download, Copy, Check, X, Share2, Sparkles, AlertCircle } from 'lucide-react';

interface CardDownloadPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  blob?: Blob;
  filename: string;
  nickname: string;
  playerTag: string;
  triggerAudio?: (sound: 'tap' | 'levelUp' | 'pop') => void;
}

export default function CardDownloadPreviewModal({
  isOpen,
  onClose,
  imageUrl,
  blob,
  filename,
  nickname,
  playerTag,
  triggerAudio
}: CardDownloadPreviewModalProps) {
  const [copied, setCopied] = useState(false);
  const [downloadedAgain, setDownloadedAgain] = useState(false);

  if (!isOpen || !imageUrl) return null;

  const handleDownloadAgain = () => {
    try {
      const link = document.createElement('a');
      link.download = filename;
      link.href = imageUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setDownloadedAgain(true);
      if (triggerAudio) triggerAudio('tap');
      setTimeout(() => setDownloadedAgain(false), 2500);
    } catch (e) {
      console.warn('Erro ao disparar download novamente:', e);
    }
  };

  const handleCopyImage = async () => {
    if (!blob) return;
    try {
      if (navigator.clipboard && (window as any).ClipboardItem) {
        const item = new (window as any).ClipboardItem({ 'image/png': blob });
        await navigator.clipboard.write([item]);
        setCopied(true);
        if (triggerAudio) triggerAudio('levelUp');
        setTimeout(() => setCopied(false), 2500);
      }
    } catch (err) {
      console.warn('Clipboard image write not permitted:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fade-in">
      <div className="bg-zinc-900 border-2 border-emerald-500/50 rounded-3xl p-5 sm:p-7 w-full max-w-lg relative shadow-2xl space-y-4 text-center max-h-[95vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-full cursor-pointer transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="space-y-1">
          <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-2">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="font-sans font-black text-xl text-white uppercase tracking-wider">
            Seu PKXD ID está Pronto! 📸✨
          </h3>
          <p className="text-xs text-zinc-300">
            Cartão gerado em alta definição para <strong>{nickname}</strong> ({playerTag})
          </p>
        </div>

        {/* Card Image Preview */}
        <div className="relative rounded-2xl overflow-hidden border-2 border-white/20 bg-black shadow-inner max-w-md mx-auto group">
          <img
            src={imageUrl}
            alt={`PKXD ID ${nickname}`}
            className="w-full h-auto object-contain rounded-xl"
          />
        </div>

        {/* Mobile touch tip */}
        <p className="text-[11px] text-zinc-400 font-sans flex items-center justify-center gap-1.5 bg-black/40 py-2 px-3 rounded-xl border border-white/5">
          <span>💡 <strong>Dica no Celular:</strong> Pressione e segure a imagem acima para salvar direto na sua Galeria!</span>
        </p>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
          <button
            onClick={handleDownloadAgain}
            className="w-full py-3 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:brightness-110 active:scale-95 text-zinc-950 font-sans font-black text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg"
          >
            {downloadedAgain ? <Check className="w-4 h-4" /> : <Download className="w-4 h-4" />}
            <span>{downloadedAgain ? 'Baixando...' : 'Baixar Imagem (PNG)'}</span>
          </button>

          {blob && typeof window !== 'undefined' && (window as any).ClipboardItem && (
            <button
              onClick={handleCopyImage}
              className="w-full py-3 bg-purple-600 hover:bg-purple-500 active:scale-95 text-white font-sans font-black text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Imagem Copiada!' : 'Copiar Imagem'}</span>
            </button>
          )}

          <a
            href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`✨ Olha meu PKXD ID Oficial no PK XD Central!\n🎮 Meu Nick: ${nickname} (${playerTag})\n🪪 Confira: ${typeof window !== 'undefined' ? window.location.origin : 'https://pkxdcentral.site'}/?passaporte=${encodeURIComponent(playerTag)}`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3 bg-emerald-700 hover:bg-emerald-600 active:scale-95 text-white font-sans font-black text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md sm:col-span-2"
          >
            <Share2 className="w-4 h-4" />
            <span>Compartilhar no WhatsApp</span>
          </a>
        </div>
      </div>
    </div>
  );
}

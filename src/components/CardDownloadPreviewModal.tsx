import React, { useState } from 'react';
import { Download, Copy, Check, X, Share2, Sparkles, Smartphone, ExternalLink, Image as ImageIcon } from 'lucide-react';

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
  const [copiedImage, setCopiedImage] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [downloadStatus, setDownloadStatus] = useState<'idle' | 'downloading' | 'done'>('idle');
  const [sharedNative, setSharedNative] = useState(false);

  if (!isOpen || !imageUrl) return null;

  // Compact clean share URL
  const cleanTag = encodeURIComponent(playerTag || 'Explorador');
  const shortShareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/?id=${cleanTag}`
    : `https://pkxdcentral.site/?id=${cleanTag}`;

  const cleanShortDomainUrl = `https://pkxdcentral.site/?id=${cleanTag}`;

  // Robust Direct Download Handler
  const handleDownload = () => {
    setDownloadStatus('downloading');
    try {
      const link = document.createElement('a');
      link.download = filename;
      link.href = imageUrl;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setDownloadStatus('done');
      if (triggerAudio) triggerAudio('tap');
      setTimeout(() => setDownloadStatus('idle'), 3000);
    } catch (e) {
      console.warn('Erro ao disparar download:', e);
      // Fallback: open image in new window/tab so user can save
      try {
        window.open(imageUrl, '_blank');
      } catch (err2) {
        console.warn('Fallback window.open falhou:', err2);
      }
      setDownloadStatus('done');
    }
  };

  // Native Mobile Share / Save to Gallery API
  const handleSaveToGalleryOrShare = async () => {
    if (!blob) {
      handleDownload();
      return;
    }

    try {
      const file = new File([blob], filename, { type: 'image/png' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `PKXD ID - ${nickname}`,
          text: `Meu PKXD ID Oficial no PK XD Central!`
        });
        setSharedNative(true);
        if (triggerAudio) triggerAudio('levelUp');
        setTimeout(() => setSharedNative(false), 2500);
        return;
      }
    } catch (err) {
      console.warn('Native share cancelled or failed:', err);
    }

    // If native share not supported or cancelled, trigger direct download
    handleDownload();
  };

  // Copy Image to Clipboard
  const handleCopyImage = async () => {
    if (!blob) return;
    try {
      if (navigator.clipboard && (window as any).ClipboardItem) {
        const item = new (window as any).ClipboardItem({ 'image/png': blob });
        await navigator.clipboard.write([item]);
        setCopiedImage(true);
        if (triggerAudio) triggerAudio('levelUp');
        setTimeout(() => setCopiedImage(false), 2500);
      }
    } catch (err) {
      console.warn('Clipboard image write not permitted:', err);
    }
  };

  // Copy Short Clean Link
  const handleCopyShortLink = async () => {
    try {
      await navigator.clipboard.writeText(shortShareUrl);
      setCopiedLink(true);
      if (triggerAudio) triggerAudio('tap');
      setTimeout(() => setCopiedLink(false), 2500);
    } catch (err) {
      console.warn('Erro ao copiar link:', err);
    }
  };

  const whatsappMessage = `✨ Olha meu PKXD ID Oficial no PK XD Central!\n🎮 Meu Nick: ${nickname} (${playerTag})\n🪪 Ver perfil: ${cleanShortDomainUrl}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-4 animate-fade-in text-left">
      <div className="bg-[#15102A] border border-[#34275A] rounded-[24px] p-5 sm:p-7 w-full max-w-lg relative shadow-2xl space-y-4 max-h-[95vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 bg-[#1D1638] hover:bg-[#251B46] text-[#B8B2CC] hover:text-[#F8F7FF] rounded-full cursor-pointer transition-colors border border-[#34275A]"
          title="Fechar"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="text-center space-y-1">
          <div className="w-12 h-12 rounded-[16px] bg-[#251B46] border border-[#7C3AED]/40 text-[#F5C542] flex items-center justify-center mx-auto mb-2 shadow-inner">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="font-sans font-black text-xl text-[#F8F7FF] uppercase tracking-wider">
            Seu PKXD ID Está Pronto! 📸
          </h3>
          <p className="text-xs text-[#B8B2CC]">
            Cartão oficial em alta definição gerado para <strong className="text-[#F8F7FF]">{nickname}</strong> ({playerTag})
          </p>
        </div>

        {/* Card Image Preview with zoom border */}
        <div className="relative rounded-[18px] overflow-hidden border border-[#34275A] bg-[#0B0817] shadow-inner max-w-md mx-auto group">
          <img
            src={imageUrl}
            alt={`PKXD ID ${nickname}`}
            className="w-full h-auto object-contain rounded-[16px]"
          />
        </div>

        {/* Clear Touch / Mobile Guidance */}
        <div className="p-3 bg-[#1D1638] rounded-[16px] border border-[#34275A] text-[11px] text-[#B8B2CC] space-y-1">
          <p className="flex items-center gap-1.5 font-bold text-[#F8F7FF]">
            <Smartphone className="w-4 h-4 text-[#22D3EE] shrink-0" />
            <span>Como Salvar no Celular ou Computador:</span>
          </p>
          <p className="text-[#B8B2CC] pl-5 leading-relaxed">
            • <strong>No Celular:</strong> Clique em <span className="text-[#22D3EE] font-bold">"Salvar na Galeria"</span> ou segure o dedo na imagem acima e escolha <em>"Fazer download da imagem"</em>.
          </p>
          <p className="text-[#B8B2CC] pl-5 leading-relaxed">
            • <strong>No Computador:</strong> Clique em <span className="text-[#F5C542] font-bold">"Baixar Imagem (PNG)"</span> para salvar direto nos seus arquivos.
          </p>
        </div>

        {/* Main Action Buttons Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
          {/* 1. Primary Download / Save Button */}
          <button
            onClick={handleDownload}
            className="w-full py-3 px-3 bg-gradient-to-r from-[#7C3AED] to-[#9B5CFF] hover:brightness-110 active:scale-95 text-[#FFFFFF] font-sans font-black text-xs uppercase tracking-wider rounded-[14px] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md border border-[#9B5CFF]/30"
          >
            {downloadStatus === 'done' ? <Check className="w-4 h-4 text-[#22D3EE]" /> : <Download className="w-4 h-4" />}
            <span>{downloadStatus === 'downloading' ? 'Salvando...' : downloadStatus === 'done' ? 'Arquivo Baixado!' : 'Baixar Imagem (PNG)'}</span>
          </button>

          {/* 2. Mobile Native Save / Share Sheet */}
          <button
            onClick={handleSaveToGalleryOrShare}
            className="w-full py-3 px-3 bg-[#1D1638] hover:bg-[#251B46] active:scale-95 text-[#F8F7FF] font-sans font-bold text-xs uppercase tracking-wider rounded-[14px] transition-all flex items-center justify-center gap-2 cursor-pointer border border-[#34275A]"
          >
            {sharedNative ? <Check className="w-4 h-4 text-[#22D3EE]" /> : <Smartphone className="w-4 h-4 text-[#22D3EE]" />}
            <span>{sharedNative ? 'Compartilhado!' : 'Salvar na Galeria'}</span>
          </button>

          {/* 3. Copy Image to Clipboard if supported */}
          {blob && typeof window !== 'undefined' && (window as any).ClipboardItem && (
            <button
              onClick={handleCopyImage}
              className="w-full py-2.5 px-3 bg-[#1D1638] hover:bg-[#251B46] active:scale-95 text-[#B8B2CC] hover:text-[#F8F7FF] font-sans font-bold text-xs uppercase tracking-wider rounded-[14px] transition-all flex items-center justify-center gap-2 cursor-pointer border border-[#34275A]"
            >
              {copiedImage ? <Check className="w-4 h-4 text-[#22D3EE]" /> : <Copy className="w-4 h-4 text-[#9B5CFF]" />}
              <span>{copiedImage ? 'Imagem Copiada!' : 'Copiar Imagem'}</span>
            </button>
          )}

          {/* 4. Open in New Tab fallback */}
          <button
            onClick={() => window.open(imageUrl, '_blank')}
            className={`w-full py-2.5 px-3 bg-[#1D1638] hover:bg-[#251B46] active:scale-95 text-[#B8B2CC] hover:text-[#F8F7FF] font-sans font-bold text-xs uppercase tracking-wider rounded-[14px] transition-all flex items-center justify-center gap-2 cursor-pointer border border-[#34275A] ${
              blob && typeof window !== 'undefined' && (window as any).ClipboardItem ? '' : 'sm:col-span-2'
            }`}
          >
            <ExternalLink className="w-4 h-4 text-[#F5C542]" />
            <span>Abrir Imagem Completa</span>
          </button>

          {/* 5. Short Link WhatsApp Share */}
          <a
            href={`https://api.whatsapp.com/send?text=${encodeURIComponent(whatsappMessage)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3 bg-[#123225] hover:bg-[#184232] active:scale-95 text-[#25D366] font-sans font-black text-xs uppercase tracking-wider rounded-[14px] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md sm:col-span-2 border border-[#25D366]/40"
          >
            <Share2 className="w-4 h-4" />
            <span>Compartilhar no WhatsApp (Link Curto)</span>
          </a>
        </div>

        {/* Clean Link Bar */}
        <div className="pt-2 border-t border-[#34275A] flex items-center justify-between gap-2 text-xs">
          <div className="min-w-0 flex-1">
            <span className="text-[10px] font-mono text-[#716A83] uppercase block font-bold">Link Direto Curto:</span>
            <span className="font-mono text-[11px] text-[#22D3EE] truncate block font-bold">
              {cleanShortDomainUrl}
            </span>
          </div>
          <button
            onClick={handleCopyShortLink}
            className="px-3 py-1.5 bg-[#251B46] hover:bg-[#34275A] text-[#F8F7FF] rounded-[10px] font-bold text-xs uppercase transition-all flex items-center gap-1.5 shrink-0 cursor-pointer border border-[#7C3AED]/30 active:scale-95"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-[#22D3EE]" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedLink ? 'Copiado!' : 'Copiar'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

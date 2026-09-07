import html2canvas from 'html2canvas';
import { PKXDPassport } from '../types';

export interface CardExportResult {
  success: boolean;
  blob?: Blob;
  objectUrl?: string;
  dataUrl?: string;
  error?: string;
}

/**
 * Loads an image safely, attempting CORS anonymous first.
 * If it fails with CORS, falls back to a dummy canvas/clean representation.
 */
export async function loadImageSafely(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.referrerPolicy = 'no-referrer';

    img.onload = () => resolve(img);
    img.onerror = () => {
      // Create a fallback avatar canvas
      const fallbackCanvas = document.createElement('canvas');
      fallbackCanvas.width = 120;
      fallbackCanvas.height = 120;
      const ctx = fallbackCanvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#6366f1';
        ctx.fillRect(0, 0, 120, 120);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 48px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🎮', 60, 60);
      }
      const fallbackImg = new Image();
      fallbackImg.onload = () => resolve(fallbackImg);
      fallbackImg.src = fallbackCanvas.toDataURL('image/png');
    };

    img.src = src;
  });
}

/**
 * Renders a crisp, high-resolution PKXD ID card natively on HTML5 Canvas 2D.
 * This guarantees 100% reliable generation even when html2canvas is restricted,
 * sandboxed inside iframes, or hits CSS rendering bugs.
 */
export async function renderNativeCanvasCard(passport: PKXDPassport): Promise<HTMLCanvasElement> {
  const width = 1200;
  const height = 700;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context unavailable');

  // 1. Theme Color Palettes
  type ThemePalette = {
    bg1: string;
    bg2: string;
    bg3: string;
    border: string;
    accent: string;
    chipBg: string;
    chipBorder: string;
    barColor1: string;
    barColor2: string;
  };

  const palettes: Record<string, ThemePalette> = {
    'neon-purple': {
      bg1: '#1e0836',
      bg2: '#0b0416',
      bg3: '#2a084e',
      border: '#a855f7',
      accent: '#c084fc',
      chipBg: '#e9d5ff',
      chipBorder: '#c084fc',
      barColor1: '#ec4899',
      barColor2: '#a855f7'
    },
    'cyber-blue': {
      bg1: '#041f38',
      bg2: '#020c1b',
      bg3: '#083344',
      border: '#22d3ee',
      accent: '#38bdf8',
      chipBg: '#cffafe',
      chipBorder: '#22d3ee',
      barColor1: '#06b6d4',
      barColor2: '#3b82f6'
    },
    'golden-vip': {
      bg1: '#2e1c03',
      bg2: '#120b02',
      bg3: '#452a05',
      border: '#facc15',
      accent: '#fde047',
      chipBg: '#fef08a',
      chipBorder: '#eab308',
      barColor1: '#f59e0b',
      barColor2: '#eab308'
    },
    'sunset-pink': {
      bg1: '#350a24',
      bg2: '#14040e',
      bg3: '#4a0b2c',
      border: '#f43f5e',
      accent: '#fb7185',
      chipBg: '#ffe4e6',
      chipBorder: '#f43f5e',
      barColor1: '#ec4899',
      barColor2: '#f43f5e'
    },
    'emerald-gamer': {
      bg1: '#042718',
      bg2: '#02120b',
      bg3: '#063f25',
      border: '#10b981',
      accent: '#34d399',
      chipBg: '#d1fae5',
      chipBorder: '#10b981',
      barColor1: '#10b981',
      barColor2: '#059669'
    },
    'volcano-red': {
      bg1: '#310909',
      bg2: '#150303',
      bg3: '#4c0d0d',
      border: '#ef4444',
      accent: '#f87171',
      chipBg: '#fee2e2',
      chipBorder: '#ef4444',
      barColor1: '#f97316',
      barColor2: '#dc2626'
    },
    'frost-diamond': {
      bg1: '#08253a',
      bg2: '#03111b',
      bg3: '#0b3552',
      border: '#38bdf8',
      accent: '#7dd3fc',
      chipBg: '#e0f2fe',
      chipBorder: '#38bdf8',
      barColor1: '#38bdf8',
      barColor2: '#818cf8'
    },
    'galaxy-space': {
      bg1: '#0f051d',
      bg2: '#030008',
      bg3: '#1f0938',
      border: '#d946ef',
      accent: '#f0abfc',
      chipBg: '#fae8ff',
      chipBorder: '#d946ef',
      barColor1: '#d946ef',
      barColor2: '#8b5cf6'
    },
    'candy-pop': {
      bg1: '#260a2b',
      bg2: '#0a030d',
      bg3: '#1a2238',
      border: '#f472b6',
      accent: '#38bdf8',
      chipBg: '#fce7f3',
      chipBorder: '#f472b6',
      barColor1: '#f472b6',
      barColor2: '#38bdf8'
    },
    'retro-arcade': {
      bg1: '#170b28',
      bg2: '#06030c',
      bg3: '#1f0e38',
      border: '#4ade80',
      accent: '#a855f7',
      chipBg: '#dcfce7',
      chipBorder: '#4ade80',
      barColor1: '#a855f7',
      barColor2: '#22c55e'
    },
    'aurora-nordic': {
      bg1: '#042226',
      bg2: '#021012',
      bg3: '#063438',
      border: '#2dd4bf',
      accent: '#5eead4',
      chipBg: '#ccfbf1',
      chipBorder: '#2dd4bf',
      barColor1: '#2dd4bf',
      barColor2: '#0ea5e9'
    },
    'lava-core': {
      bg1: '#2b0b00',
      bg2: '#0d0300',
      bg3: '#451200',
      border: '#f97316',
      accent: '#fb923c',
      chipBg: '#ffedd5',
      chipBorder: '#f97316',
      barColor1: '#f97316',
      barColor2: '#ef4444'
    }
  };

  const themeKey = passport.cardTheme || 'neon-purple';
  const palette = palettes[themeKey] || palettes['neon-purple'];

  // Rounded card rectangle helper
  const drawRoundRect = (x: number, y: number, w: number, h: number, r: number) => {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  };

  // Card Outer Shadow & Background
  ctx.save();
  drawRoundRect(20, 20, width - 40, height - 40, 36);
  ctx.clip();

  // Background Gradient
  const bgGrad = ctx.createLinearGradient(20, 20, width - 40, height - 40);
  bgGrad.addColorStop(0, palette.bg1);
  bgGrad.addColorStop(0.5, palette.bg2);
  bgGrad.addColorStop(1, palette.bg3);
  ctx.fillStyle = bgGrad;
  ctx.fillRect(20, 20, width - 40, height - 40);

  // Subtle Sci-Fi grid lines
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
  ctx.lineWidth = 1;
  for (let x = 40; x < width; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, 20);
    ctx.lineTo(x, height - 20);
    ctx.stroke();
  }
  for (let y = 40; y < height; y += 40) {
    ctx.beginPath();
    ctx.moveTo(20, y);
    ctx.lineTo(width - 20, y);
    ctx.stroke();
  }

  // Decorative ambient circles
  const ambGrad = ctx.createRadialGradient(width - 150, 150, 10, width - 150, 150, 300);
  ambGrad.addColorStop(0, `${palette.accent}25`);
  ambGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = ambGrad;
  ctx.fillRect(0, 0, width, height);

  ctx.restore();

  // Draw Card Outer Border with Neon Glow
  ctx.save();
  ctx.strokeStyle = palette.border;
  ctx.lineWidth = 4;
  ctx.shadowColor = palette.border;
  ctx.shadowBlur = 18;
  drawRoundRect(20, 20, width - 40, height - 40, 36);
  ctx.stroke();
  ctx.restore();

  // ==========================================
  // HEADER AREA: PK XD CENTRAL + CHIP + LEVEL
  // ==========================================
  // Logo Title
  ctx.font = '900 24px "Arial Black", Impact, sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.fillText('PK XD CENTRAL', 60, 75);

  ctx.font = 'bold 12px monospace';
  ctx.fillStyle = palette.accent;
  ctx.fillText('IDENTIDADE DIGITAL OFICIAL • PASSAPORTE', 60, 95);

  // Gold Security Chip Simulation
  const chipX = width - 360;
  const chipY = 48;
  const chipW = 76;
  const chipH = 54;
  ctx.save();
  const chipGrad = ctx.createLinearGradient(chipX, chipY, chipX + chipW, chipY + chipH);
  chipGrad.addColorStop(0, '#fef08a');
  chipGrad.addColorStop(0.5, '#eab308');
  chipGrad.addColorStop(1, '#a16207');
  ctx.fillStyle = chipGrad;
  drawRoundRect(chipX, chipY, chipW, chipH, 10);
  ctx.fill();
  ctx.strokeStyle = '#713f12';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Chip circuit lines
  ctx.strokeStyle = '#713f12';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(chipX + 24, chipY);
  ctx.lineTo(chipX + 24, chipY + chipH);
  ctx.moveTo(chipX + 52, chipY);
  ctx.lineTo(chipX + 52, chipY + chipH);
  ctx.moveTo(chipX, chipY + 27);
  ctx.lineTo(chipX + chipW, chipY + 27);
  ctx.stroke();
  ctx.restore();

  // Level Badge in Top-Right
  const levelNum = passport.level || 1;
  const lvlBadgeX = width - 240;
  const lvlBadgeY = 52;
  const lvlBadgeW = 180;
  const lvlBadgeH = 46;
  ctx.save();
  ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
  ctx.lineWidth = 1.5;
  drawRoundRect(lvlBadgeX, lvlBadgeY, lvlBadgeW, lvlBadgeH, 16);
  ctx.fill();
  ctx.stroke();

  ctx.font = 'bold 12px sans-serif';
  ctx.fillStyle = '#facc15';
  ctx.fillText('🔥 NÍVEL', lvlBadgeX + 24, lvlBadgeY + 28);
  ctx.font = '900 20px "Arial Black", sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(String(levelNum), lvlBadgeX + 110, lvlBadgeY + 30);
  ctx.restore();

  // Divider line below header
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(60, 125);
  ctx.lineTo(width - 60, 125);
  ctx.stroke();

  // ==========================================
  // PROFILE AREA: AVATAR + INFO
  // ==========================================
  const avatarX = 60;
  const avatarY = 155;
  const avatarSize = 170;

  // Avatar Border Frame according to frame type
  ctx.save();
  drawRoundRect(avatarX, avatarY, avatarSize, avatarSize, 28);
  ctx.clip();
  ctx.fillStyle = '#000000';
  ctx.fillRect(avatarX, avatarY, avatarSize, avatarSize);

  // Load and render avatar image safely
  try {
    const avatarImg = await loadImageSafely(passport.avatarUrl || 'https://api.dicebear.com/7.x/bottts/svg?seed=PKXD_Gamer');
    ctx.drawImage(avatarImg, avatarX, avatarY, avatarSize, avatarSize);
  } catch (e) {
    ctx.fillStyle = '#6366f1';
    ctx.fillRect(avatarX, avatarY, avatarSize, avatarSize);
  }
  ctx.restore();

  // Avatar frame border
  ctx.save();
  ctx.strokeStyle = palette.border;
  ctx.lineWidth = 4;
  ctx.shadowColor = palette.border;
  ctx.shadowBlur = 12;
  drawRoundRect(avatarX, avatarY, avatarSize, avatarSize, 28);
  ctx.stroke();
  ctx.restore();

  // Small LVL badge on avatar bottom
  ctx.save();
  ctx.fillStyle = '#facc15';
  drawRoundRect(avatarX + avatarSize - 40, avatarY + avatarSize - 22, 50, 26, 8);
  ctx.fill();
  ctx.fillStyle = '#000000';
  ctx.font = '900 13px monospace';
  ctx.fillText(`L${levelNum}`, avatarX + avatarSize - 30, avatarY + avatarSize - 5);
  ctx.restore();

  // Profile text cluster
  const textX = avatarX + avatarSize + 35;
  
  // Nickname with optional prefix
  const prefix = passport.nicknamePrefix ? `${passport.nicknamePrefix} ` : '';
  const fullName = `${prefix}${passport.nickname || 'EXPLORADOR'}`.toUpperCase();
  ctx.font = '900 36px "Arial Black", Impact, sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
  ctx.shadowBlur = 10;
  ctx.fillText(fullName.slice(0, 22), textX, 195);
  ctx.shadowBlur = 0;

  // Tag Badge
  const tagStr = passport.playerTag || '#000';
  ctx.font = 'bold 16px monospace';
  const tagMetrics = ctx.measureText(tagStr);
  const tagW = tagMetrics.width + 30;
  const tagH = 32;
  ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
  ctx.lineWidth = 1;
  drawRoundRect(textX, 215, tagW, tagH, 10);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#67e8f9';
  ctx.fillText(tagStr, textX + 15, 237);

  // Official Title
  const titleStr = `✨ ${passport.title || 'Explorador da Ilha'}`;
  ctx.font = '900 16px sans-serif';
  ctx.fillStyle = palette.accent;
  ctx.fillText(titleStr, textX + tagW + 20, 237);

  // Status / Current Activity phrase
  if (passport.statusPhrase) {
    ctx.font = 'bold 13px sans-serif';
    ctx.fillStyle = '#fde047';
    ctx.fillText(`📍 ${passport.statusPhrase}`, textX, 275);
  }

  // Bio Quote Box
  const bioY = passport.statusPhrase ? 295 : 270;
  const bioW = width - textX - 60;
  const bioH = 68;
  ctx.save();
  ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.lineWidth = 1;
  drawRoundRect(textX, bioY, bioW, bioH, 14);
  ctx.fill();
  ctx.stroke();

  ctx.font = 'italic 14px sans-serif';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  const cleanBio = passport.bio || 'Explorador dedicado da Ilha PK XD!';
  ctx.fillText(`"${cleanBio.slice(0, 85)}${cleanBio.length > 85 ? '...' : ''}"`, textX + 18, bioY + 38);
  ctx.restore();

  // Level XP Progress Bar
  const barY = bioY + bioH + 20;
  const barW = width - textX - 60;
  const barH = 14;
  const currentXP = passport.xp || 0;
  const xpInLevel = currentXP % 100;
  const xpPct = Math.min(100, Math.max(0, xpInLevel)) / 100;

  ctx.font = 'bold 11px monospace';
  ctx.fillStyle = '#fef08a';
  ctx.fillText(`PROGRESSO XP: ${xpInLevel}/100 XP (${currentXP} XP Total)`, textX, barY - 6);

  // Bar container
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.lineWidth = 1;
  drawRoundRect(textX, barY, barW, barH, 7);
  ctx.fill();
  ctx.stroke();

  // Bar fill
  if (xpPct > 0) {
    const fillGrad = ctx.createLinearGradient(textX, barY, textX + barW * xpPct, barY);
    fillGrad.addColorStop(0, palette.barColor1);
    fillGrad.addColorStop(1, palette.barColor2);
    ctx.fillStyle = fillGrad;
    drawRoundRect(textX, barY, Math.max(14, barW * xpPct), barH, 7);
    ctx.fill();
  }

  // ==========================================
  // FOOTER METRICS TILES (4 TILES)
  // ==========================================
  const tileY = 480;
  const tileH = 88;
  const tileGap = 16;
  const tileCount = 4;
  const tileW = (width - 120 - tileGap * (tileCount - 1)) / tileCount;

  const tiles = [
    { label: '🎮 JOGO FAVORITO', value: passport.favoriteMinigame || 'Crazy Run' },
    { label: '🏠 ESTILO DE CASA', value: passport.houseTheme || 'Mansão Gamer' },
    { label: '🐾 PET COMPANHEIRO', value: passport.favoritePet || 'Unicórnio Mágico' },
    { 
      label: '🏆 CONQUISTAS', 
      value: `${(passport.badges || []).filter(b => b.unlocked).length} Desbloqueadas` 
    }
  ];

  tiles.forEach((t, i) => {
    const tx = 60 + i * (tileW + tileGap);
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = 1;
    drawRoundRect(tx, tileY, tileW, tileH, 16);
    ctx.fill();
    ctx.stroke();

    ctx.font = 'bold 11px monospace';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
    ctx.fillText(t.label, tx + 14, tileY + 28);

    ctx.font = '900 15px sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(t.value.slice(0, 20), tx + 14, tileY + 60);
    ctx.restore();
  });

  // ==========================================
  // BARCODE & AUTHENTICITY STAMP (BOTTOM LINE)
  // ==========================================
  const bcodeY = 605;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(60, bcodeY);
  ctx.lineTo(width - 60, bcodeY);
  ctx.stroke();

  // Simulated Barcode graphic
  const bcStartX = 60;
  const bcY = bcodeY + 15;
  const barPattern = [3, 1, 4, 1, 2, 1, 3, 2, 1, 4, 2, 1, 3, 1, 2, 3, 1, 4, 1, 2, 2, 1, 3, 1, 4, 2, 1, 3, 2, 1];
  let curBx = bcStartX;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
  barPattern.forEach((barW) => {
    ctx.fillRect(curBx, bcY, barW, 26);
    curBx += barW + 2;
  });

  ctx.font = 'bold 12px monospace';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.fillText(`ID #${(passport.playerTag || '000').replace('#', '')}`, curBx + 16, bcY + 18);

  ctx.font = 'bold 12px monospace';
  ctx.fillStyle = palette.accent;
  ctx.textAlign = 'right';
  ctx.fillText('VERIFICADO • PK XD CENTRAL OFICIAL 2026', width - 60, bcY + 18);
  ctx.textAlign = 'left';

  return canvas;
}

/**
 * Downloads a card as PNG with multi-stage fallback:
 * 1. Tries html2canvas with safe configuration (allowTaint: false, useCORS: true)
 * 2. If it fails or is blocked, falls back to native 2D Canvas rendering
 * 3. Creates a Blob object and triggers native download link
 * 4. Returns the result with Blob and ObjectURL for previewing in UI modal
 */
export async function exportPKXDCardImage(
  cardElement: HTMLElement | null,
  passport: PKXDPassport
): Promise<CardExportResult> {
  let canvas: HTMLCanvasElement | null = null;

  // Stage 1: Attempt html2canvas capture with safe CORS settings
  if (cardElement) {
    try {
      canvas = await html2canvas(cardElement, {
        scale: 2, // crisp Retina 2x without excessive memory footprint
        useCORS: true,
        allowTaint: false, // Critical: prevent canvas tainted exception!
        backgroundColor: null,
        logging: false,
        imageTimeout: 5000
      });
    } catch (html2canvasErr) {
      console.warn('html2canvas capture had issues, using 2D Canvas fallback:', html2canvasErr);
      canvas = null;
    }
  }

  // Stage 2: 2D Canvas Fallback (100% reliable, zero CORS/tainted issues)
  if (!canvas) {
    try {
      canvas = await renderNativeCanvasCard(passport);
    } catch (nativeErr) {
      console.error('2D Canvas generator failed:', nativeErr);
      return { success: false, error: 'Falha ao renderizar cartão' };
    }
  }

  // Stage 3: Convert to Blob safely
  return new Promise((resolve) => {
    canvas!.toBlob(
      (blob) => {
        if (!blob) {
          resolve({ success: false, error: 'Falha ao converter canvas em arquivo de imagem' });
          return;
        }

        const objectUrl = URL.createObjectURL(blob);
        let dataUrl: string | undefined;
        try {
          dataUrl = canvas!.toDataURL('image/png');
        } catch (e) {
          // dataUrl might fail if tainted, objectUrl is the reliable one
        }

        const cleanNick = (passport.nickname || 'PKXD').replace(/[^a-zA-Z0-9_]/g, '_');
        const cleanTag = (passport.playerTag || '000').replace(/[^a-zA-Z0-9_]/g, '_');
        const filename = `PKXD_ID_${cleanNick}_${cleanTag}.png`;

        // Attempt direct download
        try {
          const downloadLink = document.createElement('a');
          downloadLink.download = filename;
          downloadLink.href = objectUrl;
          document.body.appendChild(downloadLink);
          downloadLink.click();
          document.body.removeChild(downloadLink);
        } catch (downloadErr) {
          console.warn('Direct link click triggered warning, modal preview will be shown:', downloadErr);
        }

        resolve({
          success: true,
          blob,
          objectUrl,
          dataUrl
        });
      },
      'image/png',
      0.95
    );
  });
}

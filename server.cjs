var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_vite = require("vite");
var import_genai = require("@google/genai");
var import_dotenv = __toESM(require("dotenv"), 1);
var import_web_push = __toESM(require("web-push"), 1);
var import_crypto = __toESM(require("crypto"), 1);

// src/lib/firebase-admin.ts
var import_app = require("firebase-admin/app");
var import_auth = require("firebase-admin/auth");
var import_firestore = require("firebase-admin/firestore");

// firebase-applet-config.json
var firebase_applet_config_default = {
  projectId: "pkxd-e817c",
  appId: "1:932539609984:web:74c5cc5650c7807e6c4765",
  apiKey: "AIzaSyBFIEDUk1UMeiNU_yv0VscVUwVyFuSffi0",
  authDomain: "pkxd-e817c.firebaseapp.com",
  storageBucket: "pkxd-e817c.firebasestorage.app",
  messagingSenderId: "932539609984",
  measurementId: "G-FSFT099FH4"
};

// src/lib/firebase-admin.ts
if (!(0, import_app.getApps)().length) {
  (0, import_app.initializeApp)({
    projectId: firebase_applet_config_default.projectId
  });
}
var adminAuth = (0, import_auth.getAuth)();
var adminDb = (0, import_firestore.getFirestore)();

// src/lib/youtubeService.ts
function parseSubscriberCount(text) {
  if (!text) return 0;
  const clean = text.toLowerCase().trim();
  const miMatch = clean.match(/([\d.,]+)\s*(?:mi|milh|m\b|million)/i);
  if (miMatch) {
    const num = parseFloat(miMatch[1].replace(",", "."));
    return Math.round(num * 1e6);
  }
  const kMatch = clean.match(/([\d.,]+)\s*(?:mil|k\b|thousand)/i);
  if (kMatch) {
    const num = parseFloat(kMatch[1].replace(",", "."));
    return Math.round(num * 1e3);
  }
  const plainMatch = clean.match(/([\d.,]+)/);
  if (plainMatch) {
    const digitsOnly = plainMatch[1].replace(/[.,]/g, "");
    const num = parseInt(digitsOnly, 10);
    return isNaN(num) ? 0 : num;
  }
  return 0;
}
function parseVideoCount(text) {
  if (!text) return 0;
  const clean = text.toLowerCase().trim();
  const match = clean.match(/([\d.,]+)\s*(?:vídeo|video|vid)/i);
  if (match) {
    const digitsOnly = match[1].replace(/[.,]/g, "");
    const num = parseInt(digitsOnly, 10);
    return isNaN(num) ? 0 : num;
  }
  return 0;
}
function cleanChannelQuery(query) {
  const trimmed = query.trim();
  try {
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
      const url = new URL(trimmed);
      const pathname = url.pathname;
      if (pathname.includes("/@")) {
        const handle = pathname.split("/@")[1].split("/")[0];
        return { handle: `@${handle}`, originalQuery: trimmed };
      }
      if (pathname.includes("/channel/")) {
        const channelId = pathname.split("/channel/")[1].split("/")[0];
        return { channelId, originalQuery: trimmed };
      }
      if (pathname.includes("/c/") || pathname.includes("/user/")) {
        const name = pathname.split(/\/c\/|\/user\//)[1].split("/")[0];
        return { handle: `@${name}`, originalQuery: trimmed };
      }
    }
  } catch (e) {
  }
  if (trimmed.startsWith("@")) {
    return { handle: trimmed, originalQuery: trimmed };
  }
  if (trimmed.startsWith("UC") && trimmed.length >= 20) {
    return { channelId: trimmed, originalQuery: trimmed };
  }
  return { handle: `@${trimmed.replace(/^@/, "")}`, originalQuery: trimmed };
}
async function fetchYouTubeChannelData(query) {
  const parsed = cleanChannelQuery(query);
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (apiKey) {
    try {
      let apiUrl = "";
      if (parsed.channelId) {
        apiUrl = `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,contentDetails&id=${parsed.channelId}&key=${apiKey}`;
      } else if (parsed.handle) {
        const cleanHandle = parsed.handle.replace(/^@/, "");
        apiUrl = `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,contentDetails&forHandle=${cleanHandle}&key=${apiKey}`;
      }
      if (apiUrl) {
        const res = await fetch(apiUrl);
        if (res.ok) {
          const data = await res.json();
          if (data.items && data.items.length > 0) {
            const item = data.items[0];
            const channelId2 = item.id;
            const snippet = item.snippet || {};
            const stats = item.statistics || {};
            const subs = parseInt(stats.subscriberCount || "0", 10);
            const vids = parseInt(stats.videoCount || "0", 10);
            const views = parseInt(stats.viewCount || "0", 10);
            const uploadsPlaylistId = item.contentDetails?.relatedPlaylists?.uploads;
            let recentVideos2 = [];
            let pkxdCount = 0;
            let avgViews = 0;
            if (uploadsPlaylistId) {
              try {
                const playRes = await fetch(`https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=15&playlistId=${uploadsPlaylistId}&key=${apiKey}`);
                if (playRes.ok) {
                  const playData = await playRes.json();
                  const videoIds = (playData.items || []).map((i) => i.snippet?.resourceId?.videoId).filter(Boolean);
                  let videoViewsMap = {};
                  if (videoIds.length > 0) {
                    const vidStatsRes = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=statistics,contentDetails&id=${videoIds.join(",")}&key=${apiKey}`);
                    if (vidStatsRes.ok) {
                      const vidData = await vidStatsRes.json();
                      (vidData.items || []).forEach((v) => {
                        videoViewsMap[v.id] = parseInt(v.statistics?.viewCount || "0", 10);
                      });
                    }
                  }
                  let totalViewsSum = 0;
                  recentVideos2 = (playData.items || []).map((i) => {
                    const vId = i.snippet?.resourceId?.videoId || "";
                    const title2 = i.snippet?.title || "";
                    const isPkxd = /pk\s*xd|afterverse/i.test(title2);
                    const isShort = /#shorts|\bshort\b/i.test(title2);
                    const viewCount = videoViewsMap[vId] || 0;
                    totalViewsSum += viewCount;
                    if (isPkxd) pkxdCount++;
                    return {
                      id: vId,
                      title: title2,
                      publishedAt: i.snippet?.publishedAt || (/* @__PURE__ */ new Date()).toISOString(),
                      isShort,
                      isPkxdContent: isPkxd,
                      views: viewCount
                    };
                  });
                  if (recentVideos2.length > 0) {
                    avgViews = Math.round(totalViewsSum / recentVideos2.length);
                  }
                }
              } catch (e) {
                console.warn("Erro ao puxar v\xEDdeos da playlist via API:", e);
              }
            }
            return {
              channelId: channelId2,
              title: snippet.title || parsed.handle || "Canal do YouTube",
              handle: snippet.customUrl ? `@${snippet.customUrl.replace(/^@/, "")}` : parsed.handle || `@${snippet.title}`,
              avatarUrl: snippet.thumbnails?.high?.url || snippet.thumbnails?.default?.url || "",
              subscriberCount: subs,
              videoCount: vids,
              totalViews: views,
              recentVideos: recentVideos2,
              pkxdVideosDetected: pkxdCount,
              averageRecentViews: avgViews || (vids > 0 ? Math.round(views / vids) : 0),
              estimatedMonthlyGrowth: Math.max(50, Math.round(subs * 0.05)),
              isPublicDataAvailable: true,
              dataSource: "youtube_api"
            };
          }
        }
      }
    } catch (apiErr) {
      console.warn("Falha na requisi\xE7\xE3o YouTube Data API, usando coletor p\xFAblico resiliente:", apiErr);
    }
  }
  let targetUrl = "";
  if (parsed.channelId) {
    targetUrl = `https://www.youtube.com/channel/${parsed.channelId}`;
  } else if (parsed.handle) {
    targetUrl = `https://www.youtube.com/${parsed.handle}`;
  } else {
    targetUrl = `https://www.youtube.com/@${parsed.originalQuery}`;
  }
  console.log(`[YouTube Scraper] Acessando metadados p\xFAblicos: ${targetUrl}`);
  const userAgents = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36"
  ];
  const htmlResponse = await fetch(targetUrl, {
    headers: {
      "User-Agent": userAgents[0],
      "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
      "Cache-Control": "no-cache"
    }
  });
  if (!htmlResponse.ok) {
    throw new Error(`N\xE3o foi poss\xEDvel carregar a p\xE1gina p\xFAblica do canal. Verifique se o @handle "${query}" est\xE1 correto.`);
  }
  const html = await htmlResponse.text();
  let channelId = parsed.channelId || "";
  const canonicalMatch = html.match(/<link rel="canonical" href="https:\/\/www\.youtube\.com\/channel\/(UC[a-zA-Z0-9_-]{20,24})"/i);
  if (canonicalMatch) {
    channelId = canonicalMatch[1];
  } else {
    const channelIdMatch = html.match(/"channelId":"(UC[a-zA-Z0-9_-]{20,24})"/);
    if (channelIdMatch) {
      channelId = channelIdMatch[1];
    }
  }
  let title = "";
  const ogTitleMatch = html.match(/<meta property="og:title" content="([^"]+)"/i);
  if (ogTitleMatch) {
    title = ogTitleMatch[1];
  } else {
    const titleTagMatch = html.match(/<title>([^<]+)<\/title>/i);
    if (titleTagMatch) {
      title = titleTagMatch[1].replace("- YouTube", "").trim();
    }
  }
  let avatarUrl = "";
  const ogImageMatch = html.match(/<meta property="og:image" content="([^"]+)"/i);
  if (ogImageMatch) {
    avatarUrl = ogImageMatch[1];
  }
  let subscriberCount = 0;
  let videoCount = 0;
  let handle = parsed.handle || `@${title.replace(/\s+/g, "")}`;
  const subPattern = /"([0-9.,]+(?:\s*(?:mil|mi|k|m|milh[oõ]es)?))\s*(?:inscritos|subscribers)"/i;
  const subMatch = html.match(subPattern);
  if (subMatch) {
    subscriberCount = parseSubscriberCount(subMatch[1]);
  } else {
    const subAlt = html.match(/subscriberCountText":\{"accessibility":\{"accessibilityData":\{"label":"([^"]+)"/);
    if (subAlt) {
      subscriberCount = parseSubscriberCount(subAlt[1]);
    }
  }
  const vidPattern = /"([0-9.,]+(?:\s*(?:mil|k)?))\s*(?:v[íi]deos|videos)"/i;
  const vidMatch = html.match(vidPattern);
  if (vidMatch) {
    videoCount = parseVideoCount(vidMatch[1]);
  }
  const handleMatch = html.match(/"canonicalBaseUrl":"\/(@[a-zA-Z0-9_.-]+)"/);
  if (handleMatch) {
    handle = handleMatch[1];
  }
  let recentVideos = [];
  let pkxdVideosDetected = 0;
  let totalSampleViews = 0;
  if (channelId) {
    try {
      const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
      const rssRes = await fetch(rssUrl, {
        headers: { "User-Agent": userAgents[1] }
      });
      if (rssRes.ok) {
        const xml = await rssRes.text();
        const entryRegex = /<entry>([\s\S]*?)<\/entry>/gi;
        let entryMatch;
        while ((entryMatch = entryRegex.exec(xml)) !== null) {
          const entryXml = entryMatch[1];
          const vidIdMatch = entryXml.match(/<yt:videoId>([^<]+)<\/yt:videoId>/i);
          const vidTitleMatch = entryXml.match(/<title>([^<]+)<\/title>/i);
          const publishedMatch = entryXml.match(/<published>([^<]+)<\/published>/i);
          const viewsMatch = entryXml.match(/<media:statistics views="(\d+)"/i);
          const vidId = vidIdMatch ? vidIdMatch[1] : "";
          const vidTitle = vidTitleMatch ? vidTitleMatch[1] : "";
          const published = publishedMatch ? publishedMatch[1] : "";
          const views = viewsMatch ? parseInt(viewsMatch[1], 10) : void 0;
          if (vidId && vidTitle) {
            const isPkxd = /pk\s*xd|afterverse|pkxd/i.test(vidTitle);
            const isShort = /#shorts|\bshorts\b/i.test(vidTitle);
            if (isPkxd) pkxdVideosDetected++;
            if (views !== void 0) totalSampleViews += views;
            recentVideos.push({
              id: vidId,
              title: vidTitle,
              publishedAt: published,
              isShort,
              isPkxdContent: isPkxd,
              views
            });
          }
        }
      }
    } catch (rssErr) {
      console.warn("Aviso ao ler RSS do YouTube:", rssErr);
    }
  }
  const averageRecentViews = recentVideos.length > 0 && totalSampleViews > 0 ? Math.round(totalSampleViews / recentVideos.length) : Math.max(150, Math.round(subscriberCount * 0.15));
  const estimatedMonthlyGrowth = Math.max(80, Math.round(subscriberCount * 0.04));
  return {
    channelId: channelId || `UC_${encodeURIComponent(handle)}`,
    title: title || handle,
    handle,
    avatarUrl,
    subscriberCount,
    videoCount: videoCount || (recentVideos.length > 0 ? recentVideos.length : 0),
    totalViews: totalSampleViews || subscriberCount * 25,
    recentVideos,
    pkxdVideosDetected,
    averageRecentViews,
    estimatedMonthlyGrowth,
    isPublicDataAvailable: true,
    dataSource: "youtube_public_scrape"
  };
}

// server.ts
import_dotenv.default.config();
var app = (0, import_express.default)();
var PORT = 3e3;
app.use(import_express.default.json());
var fallbackPublicKey = "BOjr-tCGr-DdW6_g8F3quXEvVYc7QlkkEnI-c8kslDtX3M839-ga74J-x5H2LBHs3ufvSjlWm_fa0IqTNLEC1Tc";
var fallbackPrivateKey = "SIwRZY-VmYgHBNpfVVwMGsQOG30j1hIusw6snQnQXVI";
function isValidPrivateKey(key) {
  if (!key) return false;
  try {
    const buf = Buffer.from(key.trim(), "base64url");
    return buf.length === 32;
  } catch (e) {
    return false;
  }
}
var vapidKeys = (() => {
  let pub = (process.env.VAPID_PUBLIC_KEY || "").trim();
  let priv = (process.env.VAPID_PRIVATE_KEY || "").trim();
  if (!pub || pub.length < 40 || !isValidPrivateKey(priv)) {
    console.log("[Web Push] Using fallback hardcoded VAPID keys because env keys were missing or invalid.");
    pub = fallbackPublicKey;
    priv = fallbackPrivateKey;
  }
  return { publicKey: pub, privateKey: priv };
})();
try {
  import_web_push.default.setVapidDetails(
    "mailto:kawanyuri35@gmail.com",
    vapidKeys.publicKey,
    vapidKeys.privateKey
  );
  console.log("[Web Push] VAPID details configured successfully.");
} catch (error) {
  console.error("[Web Push] Failed to configure VAPID details with primary keys, trying fallback keys...", error);
  try {
    import_web_push.default.setVapidDetails(
      "mailto:kawanyuri35@gmail.com",
      fallbackPublicKey,
      fallbackPrivateKey
    );
    console.log("[Web Push] Fallback VAPID details configured successfully.");
  } catch (fallbackError) {
    console.error("[Web Push] Critical: Both primary and fallback VAPID configurations failed.", fallbackError);
  }
}
var serverStartTime = Date.now() - 5e3;
async function sendPushNotificationToAll(title, body, url = "/") {
  console.log(`[Web Push] Disparando notifica\xE7\xE3o nativa para todos: "${title}" - "${body}"`);
  try {
    const subsSnap = await adminDb.collection("push_subscriptions").get();
    if (subsSnap.empty) {
      console.log("[Web Push] Nenhuma inscri\xE7\xE3o encontrada no banco.");
      return;
    }
    const payload = JSON.stringify({
      title,
      body,
      url
    });
    const sendPromises = subsSnap.docs.map(async (doc) => {
      const subData = doc.data();
      try {
        await import_web_push.default.sendNotification(subData.subscription, payload);
      } catch (err) {
        if (err.statusCode === 410 || err.statusCode === 404) {
          console.log(`[Web Push] Removendo inscri\xE7\xE3o inativa: ${doc.id}`);
          await doc.ref.delete();
        } else {
          console.error(`[Web Push] Erro ao enviar para ${doc.id}:`, err);
        }
      }
    });
    await Promise.allSettled(sendPromises);
    console.log("[Web Push] Disparo em lote finalizado.");
  } catch (err) {
    console.error("[Web Push] Erro geral ao disparar notifica\xE7\xF5es:", err);
  }
}
try {
  adminDb.collection("notifications").onSnapshot((snapshot) => {
    snapshot.docChanges().forEach(async (change) => {
      if (change.type === "added") {
        const data = change.doc.data();
        if (data && data.createdAt && data.createdAt > serverStartTime) {
          await sendPushNotificationToAll(data.title, data.body, "/");
        }
      }
    });
  });
  console.log("[Web Push] Ouvinte em tempo real da cole\xE7\xE3o 'notifications' ativado.");
} catch (snapshotErr) {
  console.error("Erro ao configurar Firestore Snapshot Listener para Web Push:", snapshotErr);
}
app.get("/api/vapid-public-key", (req, res) => {
  res.json({ publicKey: vapidKeys.publicKey });
});
app.post("/api/push-subscribe", async (req, res) => {
  const subscription = req.body;
  if (!subscription || !subscription.endpoint) {
    res.status(400).json({ error: "Inscri\xE7\xE3o inv\xE1lida" });
    return;
  }
  try {
    const subscriptionId = import_crypto.default.createHash("sha256").update(subscription.endpoint).digest("hex");
    console.log(`[Web Push] Nova inscri\xE7\xE3o registrada! ID: ${subscriptionId}, Endpoint: ${subscription.endpoint}`);
    const subRef = adminDb.collection("push_subscriptions").doc(subscriptionId);
    await subRef.set({
      subscription,
      createdAt: Date.now()
    });
    res.json({ success: true, id: subscriptionId });
  } catch (err) {
    console.error("Erro ao salvar inscri\xE7\xE3o Push:", err);
    res.status(500).json({ error: err.message || "Erro interno do servidor" });
  }
});
app.post("/api/send-push", async (req, res) => {
  const { title, body, admin_secret, url } = req.body;
  if (admin_secret !== "pkxd2026_super_secret_admin_key") {
    res.status(401).json({ error: "Acesso administrativo negado." });
    return;
  }
  if (!title || !body) {
    res.status(400).json({ error: "T\xEDtulo e corpo s\xE3o obrigat\xF3rios." });
    return;
  }
  try {
    console.log(`[Web Push API] Enviando notifica\xE7\xE3o manual direta: "${title}"`);
    await sendPushNotificationToAll(title, body, url || "/");
    res.json({ success: true });
  } catch (err) {
    console.error("[Web Push API] Erro ao disparar notifica\xE7\xE3o manual direta:", err);
    res.status(500).json({ error: err.message || "Erro interno ao disparar push" });
  }
});
app.post("/api/admin-delete", async (req, res) => {
  const { collectionName, docId, admin_secret } = req.body;
  if (admin_secret !== "pkxd2026_super_secret_admin_key") {
    res.status(401).json({ error: "Acesso administrativo negado." });
    return;
  }
  if (!collectionName || !docId) {
    res.status(400).json({ error: "Par\xE2metros collectionName e docId s\xE3o obrigat\xF3rios." });
    return;
  }
  try {
    console.log(`[Admin DB] Deletando documento ${docId} da cole\xE7\xE3o ${collectionName}`);
    await adminDb.collection(collectionName).doc(docId).delete();
    res.json({ success: true });
  } catch (err) {
    console.error("[Admin DB] Erro ao deletar documento:", err);
    res.status(500).json({ error: err.message || "Erro interno ao deletar" });
  }
});
var aiClient = null;
function getAI() {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY n\xE3o encontrada no servidor. Configure-a no painel de Secrets.");
    }
    aiClient = new import_genai.GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build"
        }
      }
    });
  }
  return aiClient;
}
function cleanHtmlText(html) {
  let clean = html.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "");
  clean = clean.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "");
  clean = clean.replace(/<[^>]+>/g, " ");
  clean = clean.replace(/\s+/g, " ").trim();
  return clean.substring(0, 6e4);
}
function extractHeuristicFallback(html) {
  let title = "Novidade PK XD! \u{1F579}\uFE0F";
  const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
  if (titleMatch && titleMatch[1]) {
    title = titleMatch[1].trim();
  } else {
    const h1Match = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
    if (h1Match && h1Match[1]) {
      title = h1Match[1].trim();
    }
  }
  if (title.length > 50) {
    title = title.substring(0, 50) + "...";
  }
  let cleanText = cleanHtmlText(html);
  if (cleanText.length > 400) {
    cleanText = cleanText.substring(0, 400) + "...";
  }
  const description = `### \u26A0\uFE0F [Modelos de IA sob Alta Demanda]

Os servidores do Gemini est\xE3o ocupados no momento (Erro 503), mas salvamos as informa\xE7\xF5es b\xE1sicas diretamente do conte\xFAdo:

**Conte\xFAdo extra\xEDdo da newsletter:**
${cleanText}

*Por favor, tente enviar novamente em alguns instantes para o Gemini gerar o relat\xF3rio automatizado completo com diagrama\xE7\xE3o e IA!*`;
  return { title, description };
}
async function generateContentWithFallback(ai, prompt, schema) {
  const modelsToTry = [
    "gemini-3.5-flash",
    "gemini-3.1-flash-lite",
    "gemini-flash-latest",
    "gemini-3.1-pro-preview"
  ];
  let lastError = null;
  for (let i = 0; i < modelsToTry.length; i++) {
    const model = modelsToTry[i];
    if (i > 0) {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        console.log(`[Gemini] Tentando gerar com o modelo ${model} (tentativa ${attempt}/2)...`);
        const response = await ai.models.generateContent({
          model,
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: schema
          }
        });
        if (response && response.text) {
          console.log(`[Gemini] Sucesso ao gerar conte\xFAdo usando modelo: ${model}`);
          return response;
        }
      } catch (err) {
        lastError = err;
        const errStr = String(err?.message || err?.status || err?.statusText || JSON.stringify(err) || err || "");
        console.warn(`[Gemini] Erro no modelo ${model} (tentativa ${attempt}):`, errStr);
        const is503Or429 = errStr.includes("503") || errStr.includes("429") || errStr.toLowerCase().includes("unavailable") || errStr.toLowerCase().includes("high demand") || errStr.toLowerCase().includes("spikes in demand") || errStr.toLowerCase().includes("exhausted") || errStr.toLowerCase().includes("quota") || err?.status && (String(err.status).includes("503") || String(err.status).includes("429"));
        if (is503Or429) {
          console.warn(`[Gemini] Modelo ${model} est\xE1 sobrecarregado ou sem cota (Erro cr\xEDtico/Transit\xF3rio). Avan\xE7ando imediatamente para o pr\xF3ximo modelo...`);
          break;
        }
        if (attempt < 2) {
          await new Promise((resolve) => setTimeout(resolve, 1e3));
        }
      }
    }
  }
  throw lastError || new Error("Todos os modelos do Gemini falharam ou est\xE3o fora do ar.");
}
app.post("/api/scrape-spoiler", async (req, res) => {
  const { url } = req.body;
  if (!url) {
    res.status(400).json({ error: "URL \xE9 obrigat\xF3ria" });
    return;
  }
  let htmlContent = "";
  try {
    const fetchResponse = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36"
      }
    });
    if (!fetchResponse.ok) {
      res.status(500).json({ error: `Falha ao carregar a p\xE1gina do link. Status: ${fetchResponse.status}` });
      return;
    }
    htmlContent = await fetchResponse.text();
    const textToAnalyze = cleanHtmlText(htmlContent);
    const ai = getAI();
    const prompt = `Voc\xEA \xE9 um rob\xF4 extrator inteligente do portal PKXD Central.
Eu te passei o conte\xFAdo em texto limpo de uma newsletter de novidades e spoilers semanais recebida por e-mail do PK XD.
Analise com aten\xE7\xE3o e extraia os seguintes dados em portugu\xEAs das novidades ou spoilers descritos:
1. Um t\xEDtulo chamativo em portugu\xEAs sobre a principal novidade ou spoiler (m\xE1ximo de 8 palavras) acompanhado de um emoji legal de spoiler ou PK XD.
2. Uma descri\xE7\xE3o resumida, por\xE9m detalhada e interessante em formato markdown limpo contendo os principais fatos, datas de atualiza\xE7\xE3o citadas e itens novos exclusivos revelados no texto.

Retorne no formato JSON exato especificado a seguir:
{
  "title": "...",
  "description": "..."
}

Newsletter PK XD:
---
${textToAnalyze}
---
`;
    const schema = {
      type: import_genai.Type.OBJECT,
      properties: {
        title: { type: import_genai.Type.STRING },
        description: { type: import_genai.Type.STRING }
      },
      required: ["title", "description"]
    };
    const modelResponse = await generateContentWithFallback(ai, prompt, schema);
    const parsedData = JSON.parse(modelResponse.text || "{}");
    res.json({
      success: true,
      data: parsedData
    });
  } catch (err) {
    console.error("Erro no scraping / an\xE1lise com Gemini:", err);
    if (htmlContent) {
      try {
        console.log("[Resgate] Ativando analisador alternativo (HTML Heuristic)...");
        const fallbackData = extractHeuristicFallback(htmlContent);
        res.json({
          success: true,
          data: fallbackData,
          isFallbackRescue: true
        });
        return;
      } catch (rescueErr) {
        console.error("Falha no resgate heur\xEDstico:", rescueErr);
      }
    }
    res.status(500).json({ error: err.message || "Erro desconhecido ao puxar spoilers." });
  }
});
app.get("/api/youtube/channel", async (req, res) => {
  const query = (req.query.query || "").trim();
  if (!query) {
    res.status(400).json({ error: "O par\xE2metro query (handle, ID ou URL do canal) \xE9 obrigat\xF3rio." });
    return;
  }
  try {
    const channelData = await fetchYouTubeChannelData(query);
    res.json({ success: true, data: channelData });
  } catch (err) {
    console.error("[YouTube API] Erro ao buscar canal:", err);
    res.status(404).json({
      error: err.message || "Canal n\xE3o encontrado ou indispon\xEDvel publicamente."
    });
  }
});
async function startServer() {
  app.use((req, res, next) => {
    if (req.path.startsWith("/api") || import_path.default.extname(req.path)) {
      return next();
    }
    if (process.env.NODE_ENV !== "production") {
      req.url = "/";
    }
    next();
  });
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map

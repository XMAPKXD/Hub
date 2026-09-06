export interface YouTubeChannelData {
  channelId: string;
  title: string;
  handle: string;
  avatarUrl: string;
  subscriberCount: number;
  videoCount: number;
  totalViews: number;
  recentVideos: {
    id: string;
    title: string;
    publishedAt: string;
    isShort: boolean;
    isPkxdContent: boolean;
    views?: number;
  }[];
  pkxdVideosDetected: number;
  averageRecentViews: number;
  estimatedMonthlyGrowth: number;
  isPublicDataAvailable: boolean;
  dataSource: 'youtube_api' | 'youtube_public_scrape' | 'fallback_sample';
}

// Robust parser for YouTube subscriber count strings across English and Portuguese
export function parseSubscriberCount(text: string): number {
  if (!text) return 0;
  const clean = text.toLowerCase().trim();

  // Match pattern like "1,2 mi", "1.5m", "10,5 mil", "250k", "500 inscritos"
  const miMatch = clean.match(/([\d.,]+)\s*(?:mi|milh|m\b|million)/i);
  if (miMatch) {
    const num = parseFloat(miMatch[1].replace(',', '.'));
    return Math.round(num * 1000000);
  }

  const kMatch = clean.match(/([\d.,]+)\s*(?:mil|k\b|thousand)/i);
  if (kMatch) {
    const num = parseFloat(kMatch[1].replace(',', '.'));
    return Math.round(num * 1000);
  }

  const plainMatch = clean.match(/([\d.,]+)/);
  if (plainMatch) {
    // Replace thousand separators
    const digitsOnly = plainMatch[1].replace(/[.,]/g, '');
    const num = parseInt(digitsOnly, 10);
    return isNaN(num) ? 0 : num;
  }

  return 0;
}

export function parseVideoCount(text: string): number {
  if (!text) return 0;
  const clean = text.toLowerCase().trim();
  const match = clean.match(/([\d.,]+)\s*(?:vídeo|video|vid)/i);
  if (match) {
    const digitsOnly = match[1].replace(/[.,]/g, '');
    const num = parseInt(digitsOnly, 10);
    return isNaN(num) ? 0 : num;
  }
  return 0;
}

export function cleanChannelQuery(query: string): { handle?: string; channelId?: string; originalQuery: string } {
  const trimmed = query.trim();
  
  // URL matching
  try {
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      const url = new URL(trimmed);
      const pathname = url.pathname;
      
      // Handle like /@handle
      if (pathname.includes('/@')) {
        const handle = pathname.split('/@')[1].split('/')[0];
        return { handle: `@${handle}`, originalQuery: trimmed };
      }
      
      // Channel ID like /channel/UC...
      if (pathname.includes('/channel/')) {
        const channelId = pathname.split('/channel/')[1].split('/')[0];
        return { channelId, originalQuery: trimmed };
      }

      // Custom URL like /c/name or /user/name
      if (pathname.includes('/c/') || pathname.includes('/user/')) {
        const name = pathname.split(/\/c\/|\/user\//)[1].split('/')[0];
        return { handle: `@${name}`, originalQuery: trimmed };
      }
    }
  } catch (e) {}

  if (trimmed.startsWith('@')) {
    return { handle: trimmed, originalQuery: trimmed };
  }

  if (trimmed.startsWith('UC') && trimmed.length >= 20) {
    return { channelId: trimmed, originalQuery: trimmed };
  }

  // Otherwise assume it's a handle
  return { handle: `@${trimmed.replace(/^@/, '')}`, originalQuery: trimmed };
}

export async function fetchYouTubeChannelData(query: string): Promise<YouTubeChannelData> {
  const parsed = cleanChannelQuery(query);
  const apiKey = process.env.YOUTUBE_API_KEY;

  // 1. Try YouTube Data API v3 if API key is provided
  if (apiKey) {
    try {
      let apiUrl = '';
      if (parsed.channelId) {
        apiUrl = `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,contentDetails&id=${parsed.channelId}&key=${apiKey}`;
      } else if (parsed.handle) {
        const cleanHandle = parsed.handle.replace(/^@/, '');
        apiUrl = `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,contentDetails&forHandle=${cleanHandle}&key=${apiKey}`;
      }

      if (apiUrl) {
        const res = await fetch(apiUrl);
        if (res.ok) {
          const data = await res.json();
          if (data.items && data.items.length > 0) {
            const item = data.items[0];
            const channelId = item.id;
            const snippet = item.snippet || {};
            const stats = item.statistics || {};

            const subs = parseInt(stats.subscriberCount || '0', 10);
            const vids = parseInt(stats.videoCount || '0', 10);
            const views = parseInt(stats.viewCount || '0', 10);

            // Fetch recent videos from uploads playlist
            const uploadsPlaylistId = item.contentDetails?.relatedPlaylists?.uploads;
            let recentVideos: any[] = [];
            let pkxdCount = 0;
            let avgViews = 0;

            if (uploadsPlaylistId) {
              try {
                const playRes = await fetch(`https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=15&playlistId=${uploadsPlaylistId}&key=${apiKey}`);
                if (playRes.ok) {
                  const playData = await playRes.json();
                  const videoIds = (playData.items || []).map((i: any) => i.snippet?.resourceId?.videoId).filter(Boolean);
                  
                  // Fetch views for these videos
                  let videoViewsMap: Record<string, number> = {};
                  if (videoIds.length > 0) {
                    const vidStatsRes = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=statistics,contentDetails&id=${videoIds.join(',')}&key=${apiKey}`);
                    if (vidStatsRes.ok) {
                      const vidData = await vidStatsRes.json();
                      (vidData.items || []).forEach((v: any) => {
                        videoViewsMap[v.id] = parseInt(v.statistics?.viewCount || '0', 10);
                      });
                    }
                  }

                  let totalViewsSum = 0;
                  recentVideos = (playData.items || []).map((i: any) => {
                    const vId = i.snippet?.resourceId?.videoId || '';
                    const title = i.snippet?.title || '';
                    const isPkxd = /pk\s*xd|afterverse/i.test(title);
                    const isShort = /#shorts|\bshort\b/i.test(title);
                    const viewCount = videoViewsMap[vId] || 0;
                    totalViewsSum += viewCount;
                    if (isPkxd) pkxdCount++;
                    return {
                      id: vId,
                      title,
                      publishedAt: i.snippet?.publishedAt || new Date().toISOString(),
                      isShort,
                      isPkxdContent: isPkxd,
                      views: viewCount
                    };
                  });

                  if (recentVideos.length > 0) {
                    avgViews = Math.round(totalViewsSum / recentVideos.length);
                  }
                }
              } catch (e) {
                console.warn('Erro ao puxar vídeos da playlist via API:', e);
              }
            }

            return {
              channelId,
              title: snippet.title || parsed.handle || 'Canal do YouTube',
              handle: snippet.customUrl ? `@${snippet.customUrl.replace(/^@/, '')}` : (parsed.handle || `@${snippet.title}`),
              avatarUrl: snippet.thumbnails?.high?.url || snippet.thumbnails?.default?.url || '',
              subscriberCount: subs,
              videoCount: vids,
              totalViews: views,
              recentVideos,
              pkxdVideosDetected: pkxdCount,
              averageRecentViews: avgViews || (vids > 0 ? Math.round(views / vids) : 0),
              estimatedMonthlyGrowth: Math.max(50, Math.round(subs * 0.05)),
              isPublicDataAvailable: true,
              dataSource: 'youtube_api'
            };
          }
        }
      }
    } catch (apiErr) {
      console.warn('Falha na requisição YouTube Data API, usando coletor público resiliente:', apiErr);
    }
  }

  // 2. Fetch public channel page and parse metadata
  let targetUrl = '';
  if (parsed.channelId) {
    targetUrl = `https://www.youtube.com/channel/${parsed.channelId}`;
  } else if (parsed.handle) {
    targetUrl = `https://www.youtube.com/${parsed.handle}`;
  } else {
    targetUrl = `https://www.youtube.com/@${parsed.originalQuery}`;
  }

  console.log(`[YouTube Scraper] Acessando metadados públicos: ${targetUrl}`);

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
    throw new Error(`Não foi possível carregar a página pública do canal. Verifique se o @handle "${query}" está correto.`);
  }

  const html = await htmlResponse.text();

  // Extract canonical channel ID from link tag or ytInitialData
  let channelId = parsed.channelId || '';
  const canonicalMatch = html.match(/<link rel="canonical" href="https:\/\/www\.youtube\.com\/channel\/(UC[a-zA-Z0-9_-]{20,24})"/i);
  if (canonicalMatch) {
    channelId = canonicalMatch[1];
  } else {
    const channelIdMatch = html.match(/"channelId":"(UC[a-zA-Z0-9_-]{20,24})"/);
    if (channelIdMatch) {
      channelId = channelIdMatch[1];
    }
  }

  // Extract title
  let title = '';
  const ogTitleMatch = html.match(/<meta property="og:title" content="([^"]+)"/i);
  if (ogTitleMatch) {
    title = ogTitleMatch[1];
  } else {
    const titleTagMatch = html.match(/<title>([^<]+)<\/title>/i);
    if (titleTagMatch) {
      title = titleTagMatch[1].replace('- YouTube', '').trim();
    }
  }

  // Extract avatar
  let avatarUrl = '';
  const ogImageMatch = html.match(/<meta property="og:image" content="([^"]+)"/i);
  if (ogImageMatch) {
    avatarUrl = ogImageMatch[1];
  }

  // Extract subscriber count & video count from ytInitialData text
  let subscriberCount = 0;
  let videoCount = 0;
  let handle = parsed.handle || `@${title.replace(/\s+/g, '')}`;

  // Find subscriber text in HTML (e.g. "1,2 mil inscritos" or "subscribers")
  const subPattern = /"([0-9.,]+(?:\s*(?:mil|mi|k|m|milh[oõ]es)?))\s*(?:inscritos|subscribers)"/i;
  const subMatch = html.match(subPattern);
  if (subMatch) {
    subscriberCount = parseSubscriberCount(subMatch[1]);
  } else {
    // Alternate pattern in video counts row
    const subAlt = html.match(/subscriberCountText":\{"accessibility":\{"accessibilityData":\{"label":"([^"]+)"/);
    if (subAlt) {
      subscriberCount = parseSubscriberCount(subAlt[1]);
    }
  }

  // Find video count in HTML
  const vidPattern = /"([0-9.,]+(?:\s*(?:mil|k)?))\s*(?:v[íi]deos|videos)"/i;
  const vidMatch = html.match(vidPattern);
  if (vidMatch) {
    videoCount = parseVideoCount(vidMatch[1]);
  }

  // Also extract handle if embedded
  const handleMatch = html.match(/"canonicalBaseUrl":"\/(@[a-zA-Z0-9_.-]+)"/);
  if (handleMatch) {
    handle = handleMatch[1];
  }

  // 3. Fetch latest videos from public RSS Feed if channel ID is known
  let recentVideos: any[] = [];
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
        
        // Match <entry> items
        const entryRegex = /<entry>([\s\S]*?)<\/entry>/gi;
        let entryMatch;
        while ((entryMatch = entryRegex.exec(xml)) !== null) {
          const entryXml = entryMatch[1];
          const vidIdMatch = entryXml.match(/<yt:videoId>([^<]+)<\/yt:videoId>/i);
          const vidTitleMatch = entryXml.match(/<title>([^<]+)<\/title>/i);
          const publishedMatch = entryXml.match(/<published>([^<]+)<\/published>/i);
          const viewsMatch = entryXml.match(/<media:statistics views="(\d+)"/i);

          const vidId = vidIdMatch ? vidIdMatch[1] : '';
          const vidTitle = vidTitleMatch ? vidTitleMatch[1] : '';
          const published = publishedMatch ? publishedMatch[1] : '';
          const views = viewsMatch ? parseInt(viewsMatch[1], 10) : undefined;

          if (vidId && vidTitle) {
            const isPkxd = /pk\s*xd|afterverse|pkxd/i.test(vidTitle);
            const isShort = /#shorts|\bshorts\b/i.test(vidTitle);
            if (isPkxd) pkxdVideosDetected++;
            if (views !== undefined) totalSampleViews += views;

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
      console.warn('Aviso ao ler RSS do YouTube:', rssErr);
    }
  }

  const averageRecentViews = recentVideos.length > 0 && totalSampleViews > 0
    ? Math.round(totalSampleViews / recentVideos.length)
    : Math.max(150, Math.round(subscriberCount * 0.15));

  const estimatedMonthlyGrowth = Math.max(80, Math.round(subscriberCount * 0.04));

  return {
    channelId: channelId || `UC_${encodeURIComponent(handle)}`,
    title: title || handle,
    handle,
    avatarUrl,
    subscriberCount,
    videoCount: videoCount || (recentVideos.length > 0 ? recentVideos.length : 0),
    totalViews: totalSampleViews || (subscriberCount * 25),
    recentVideos,
    pkxdVideosDetected,
    averageRecentViews,
    estimatedMonthlyGrowth,
    isPublicDataAvailable: true,
    dataSource: 'youtube_public_scrape'
  };
}

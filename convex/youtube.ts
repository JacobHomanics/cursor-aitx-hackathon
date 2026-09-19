const YOUTUBE_SEARCH_URL = 'https://www.youtube.com/youtubei/v1/search?prettyPrint=false';
const YOUTUBE_DATA_SEARCH_URL = 'https://www.googleapis.com/youtube/v3/search';
const PLAYLIST_SEARCH_PARAMS = 'EgIQAw==';
const YOUTUBE_HEADERS = {
  Accept: 'application/json',
  'Content-Type': 'application/json',
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
};

export type YoutubeCourse = {
  id: string;
  name: string;
  url: string;
  channel?: string;
  kind: 'playlist' | 'video';
  videoCount?: string;
  duration?: string;
  coverUrl?: string;
};

export async function searchYoutubeCourses(queries: string[]): Promise<YoutubeCourse[]> {
  const uniqueQueries = [...new Set(queries.map((query) => query.trim()).filter(Boolean))].slice(
    0,
    3,
  );
  const apiKey = process.env.YOUTUBE_API_KEY;
  const catalog: YoutubeCourse[] = [];

  for (const query of uniqueQueries) {
    if (apiKey) {
      catalog.push(...(await searchWithDataApi(apiKey, query, 'playlist')));
    } else {
      catalog.push(...(await searchWithInnertube(query, PLAYLIST_SEARCH_PARAMS)));
    }
  }

  if (uniqueQueries[0]) {
    if (apiKey) {
      catalog.push(...(await searchWithDataApi(apiKey, `${uniqueQueries[0]} full course`, 'video')));
    } else {
      catalog.push(...(await searchWithInnertube(`${uniqueQueries[0]} full course`)));
    }
  }

  const byId = new Map<string, YoutubeCourse>();
  for (const course of catalog) {
    if (course.kind === 'video' && isShortVideo(course.duration)) {
      continue;
    }
    if (!byId.has(course.id)) {
      byId.set(course.id, course);
    }
  }

  return [...byId.values()].slice(0, 20);
}

async function searchWithInnertube(query: string, params?: string) {
  const response = await fetch(YOUTUBE_SEARCH_URL, {
    method: 'POST',
    headers: YOUTUBE_HEADERS,
    body: JSON.stringify({
      context: {
        client: {
          clientName: 'WEB',
          clientVersion: '2.20260101.00.00',
          hl: 'en',
          gl: 'US',
        },
      },
      query,
      ...(params ? { params } : {}),
    }),
  });

  if (!response.ok) {
    throw new Error(`YouTube search failed (${response.status})`);
  }

  const payload: unknown = await response.json();
  const courses: YoutubeCourse[] = [];
  collectCourses(payload, courses);
  return courses;
}

async function searchWithDataApi(apiKey: string, query: string, type: 'playlist' | 'video') {
  const url = new URL(YOUTUBE_DATA_SEARCH_URL);
  url.searchParams.set('part', 'snippet');
  url.searchParams.set('q', query);
  url.searchParams.set('type', type);
  url.searchParams.set('maxResults', '10');
  url.searchParams.set('key', apiKey);
  if (type === 'video') {
    url.searchParams.set('videoDuration', 'long');
  }

  const response = await fetch(url, {
    headers: { Accept: 'application/json' },
  });
  if (!response.ok) {
    throw new Error(`YouTube search failed (${response.status})`);
  }

  const payload: unknown = await response.json();
  const root = asRecord(payload);
  const items = Array.isArray(root?.items) ? root.items : [];

  return items.flatMap((item): YoutubeCourse[] => {
    const record = asRecord(item);
    const id = asRecord(record?.id);
    const snippet = asRecord(record?.snippet);
    const title = asString(snippet?.title);
    const playlistId = asString(id?.playlistId);
    const videoId = asString(id?.videoId);
    const thumbnails = asRecord(snippet?.thumbnails);
    const thumb =
      asRecord(thumbnails?.high) ?? asRecord(thumbnails?.medium) ?? asRecord(thumbnails?.default);
    if (!title) {
      return [];
    }
    if (playlistId) {
      return [
        {
          id: playlistId,
          name: title,
          url: `https://www.youtube.com/playlist?list=${playlistId}`,
          channel: asString(snippet?.channelTitle),
          kind: 'playlist' as const,
          coverUrl: asString(thumb?.url),
        },
      ];
    }
    if (videoId) {
      return [
        {
          id: videoId,
          name: title,
          url: `https://www.youtube.com/watch?v=${videoId}`,
          channel: asString(snippet?.channelTitle),
          kind: 'video' as const,
          coverUrl: asString(thumb?.url),
        },
      ];
    }
    return [];
  });
}

function collectCourses(node: unknown, out: YoutubeCourse[]) {
  if (!node || typeof node !== 'object') {
    return;
  }
  if (Array.isArray(node)) {
    for (const item of node) {
      collectCourses(item, out);
    }
    return;
  }

  const record = node as Record<string, unknown>;
  const video = fromVideoRenderer(record.videoRenderer);
  const playlist = fromPlaylistRenderer(record.playlistRenderer);
  const lockup = fromLockup(record.lockupViewModel);
  if (video) {
    out.push(video);
  }
  if (playlist) {
    out.push(playlist);
  }
  if (lockup) {
    out.push(lockup);
  }

  for (const value of Object.values(record)) {
    if (value && typeof value === 'object') {
      collectCourses(value, out);
    }
  }
}

function fromVideoRenderer(node: unknown): YoutubeCourse | null {
  const record = asRecord(node);
  const id = asString(record?.videoId);
  const name = firstText(record?.title);
  if (!id || !name) {
    return null;
  }
  return {
    id,
    name,
    url: `https://www.youtube.com/watch?v=${id}`,
    channel: firstText(record?.ownerText) ?? firstText(record?.shortBylineText),
    kind: 'video',
    duration: firstText(record?.lengthText),
    coverUrl: firstThumbnail(record),
  };
}

function fromPlaylistRenderer(node: unknown): YoutubeCourse | null {
  const record = asRecord(node);
  const id = asString(record?.playlistId);
  const name = firstText(record?.title);
  if (!id || !name) {
    return null;
  }
  return {
    id,
    name,
    url: `https://www.youtube.com/playlist?list=${id}`,
    channel: firstText(record?.shortBylineText) ?? firstText(record?.ownerText),
    kind: 'playlist',
    videoCount: asString(record?.videoCount) ?? firstText(record?.videoCountShortText),
    coverUrl: firstThumbnail(record),
  };
}

function fromLockup(node: unknown): YoutubeCourse | null {
  const record = asRecord(node);
  const id = asString(record?.contentId);
  const contentType = asString(record?.contentType);
  const meta = asRecord(asRecord(record?.metadata)?.lockupMetadataViewModel);
  const name = asString(asRecord(meta?.title)?.content) ?? firstText(meta?.title);
  if (!id || !name) {
    return null;
  }

  const kind =
    contentType === 'LOCKUP_CONTENT_TYPE_PLAYLIST' || id.startsWith('PL')
      ? 'playlist'
      : contentType === 'LOCKUP_CONTENT_TYPE_VIDEO'
        ? 'video'
        : id.startsWith('PL')
          ? 'playlist'
          : null;
  if (!kind) {
    return null;
  }

  const rows = asRecord(asRecord(meta?.metadata)?.contentMetadataViewModel)?.metadataRows;
  const firstRow = Array.isArray(rows) ? asRecord(rows[0]) : null;
  const parts = Array.isArray(firstRow?.metadataParts) ? firstRow.metadataParts : [];
  const channel = asString(asRecord(asRecord(parts[0])?.text)?.content);

  return {
    id,
    name,
    url:
      kind === 'playlist'
        ? `https://www.youtube.com/playlist?list=${id}`
        : `https://www.youtube.com/watch?v=${id}`,
    channel,
    kind,
    videoCount: findBadgeText(record),
    coverUrl: firstThumbnail(record),
  };
}

function firstText(node: unknown): string | undefined {
  if (typeof node === 'string') {
    return node.trim() || undefined;
  }
  const record = asRecord(node);
  if (!record) {
    return undefined;
  }
  const simple = asString(record.simpleText) ?? asString(record.content);
  if (simple) {
    return simple;
  }
  if (Array.isArray(record.runs)) {
    const joined = record.runs
      .map((run) => asString(asRecord(run)?.text) ?? '')
      .join('')
      .trim();
    return joined || undefined;
  }
  return undefined;
}

function firstThumbnail(node: unknown): string | undefined {
  const urls: string[] = [];
  collectThumbUrls(node, urls);
  return urls[0];
}

function collectThumbUrls(node: unknown, urls: string[]) {
  if (urls.length > 0) {
    return;
  }
  if (typeof node === 'string') {
    if (node.startsWith('https://i.ytimg.com/') || node.includes('ytimg.com/vi/')) {
      urls.push(node);
    }
    return;
  }
  if (!node || typeof node !== 'object') {
    return;
  }
  if (Array.isArray(node)) {
    for (const item of node) {
      collectThumbUrls(item, urls);
      if (urls.length > 0) {
        return;
      }
    }
    return;
  }
  for (const value of Object.values(node)) {
    collectThumbUrls(value, urls);
    if (urls.length > 0) {
      return;
    }
  }
}

function findBadgeText(node: unknown): string | undefined {
  const record = asRecord(node);
  const image = asRecord(record?.contentImage);
  const badges: string[] = [];
  collectBadgeText(image, badges);
  return badges.find((text) => /video/i.test(text));
}

function collectBadgeText(node: unknown, out: string[]) {
  if (out.length > 0) {
    return;
  }
  const record = asRecord(node);
  if (!record) {
    if (Array.isArray(node)) {
      for (const item of node) {
        collectBadgeText(item, out);
        if (out.length > 0) {
          return;
        }
      }
    }
    return;
  }
  const text = asString(record.text);
  if (text && /video/i.test(text)) {
    out.push(text);
    return;
  }
  for (const value of Object.values(record)) {
    collectBadgeText(value, out);
    if (out.length > 0) {
      return;
    }
  }
}

function isShortVideo(duration?: string) {
  if (!duration) {
    return false;
  }
  const parts = duration.split(':').map((part) => Number(part));
  if (parts.some((part) => !Number.isFinite(part))) {
    return false;
  }
  const seconds =
    parts.length === 3
      ? parts[0] * 3600 + parts[1] * 60 + parts[2]
      : parts.length === 2
        ? parts[0] * 60 + parts[1]
        : parts[0];
  return seconds < 20 * 60;
}

function asRecord(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

function asString(value: unknown) {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
}

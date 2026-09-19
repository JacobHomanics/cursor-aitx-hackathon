const LUMA_DISCOVER_URL = 'https://api.luma.com/discover/get-paginated-events';
const LUMA_BOOTSTRAP_URL = 'https://api.luma.com/discover/bootstrap-page';
const LUMA_HEADERS = {
  Accept: 'application/json',
  'User-Agent': 'NorthBound/1.0',
};

const CITY_ALIASES: Record<string, string> = {
  'new york': 'nyc',
  'new york city': 'nyc',
  nyc: 'nyc',
  brooklyn: 'nyc',
  buffalo: 'nyc',
  ithaca: 'nyc',
  albany: 'nyc',
  rochester: 'nyc',
  syracuse: 'nyc',
  'san francisco': 'sf',
  sf: 'sf',
  'bay area': 'sf',
  berkeley: 'sf',
  oakland: 'sf',
  stanford: 'sf',
  'san jose': 'sf',
  'los angeles': 'la',
  la: 'la',
  irvine: 'la',
  'washington dc': 'dc',
  'washington d.c.': 'dc',
  'district of columbia': 'dc',
  dc: 'dc',
  'san diego': 'sd',
  cambridge: 'boston',
  evanston: 'chicago',
  urbana: 'chicago',
  'ann arbor': 'detroit',
  boulder: 'denver',
  'college station': 'austin',
  durham: 'raleigh',
  charlotte: 'raleigh',
  'sao paulo': 'saopaulo',
  'rio de janeiro': 'rio',
  'hong kong': 'hongkong',
  'cape town': 'capetown',
  'mexico city': 'mexico-city',
};

const STATE_HUB_SLUGS: Record<string, string> = {
  arizona: 'phoenix',
  california: 'sf',
  colorado: 'denver',
  'district of columbia': 'dc',
  florida: 'miami',
  georgia: 'atlanta',
  hawaii: 'honolulu',
  illinois: 'chicago',
  massachusetts: 'boston',
  michigan: 'detroit',
  minnesota: 'minneapolis',
  nevada: 'las-vegas',
  'new york': 'nyc',
  'north carolina': 'raleigh',
  ohio: 'cincinnati',
  oregon: 'portland',
  pennsylvania: 'philadelphia',
  texas: 'austin',
  utah: 'salt-lake-city',
  washington: 'seattle',
  alberta: 'calgary',
  'british columbia': 'vancouver',
  ontario: 'toronto',
};

export type LumaEvent = {
  id: string;
  name: string;
  url: string;
  startAt?: string;
  timezone?: string;
  location?: string;
  calendarName?: string;
  guestCount?: number;
  isFree?: boolean;
  coverUrl?: string;
};

export type LumaSearchResult = {
  placeName?: string;
  placeSlug?: string;
  events: LumaEvent[];
};

export async function searchLumaEvents(
  city: string,
  state: string,
  queries: string[] = [],
  excludeIds: ReadonlySet<string> = new Set(),
): Promise<LumaSearchResult> {
  const place = await resolveLumaPlace(city, state);
  const slug = place?.slug;
  if (!slug) {
    return { events: [] };
  }

  const nearby = await fetchLumaEvents(slug);
  const matched: LumaEvent[] = [];
  for (const query of queries.slice(0, 3)) {
    const trimmed = query.trim();
    if (!trimmed) {
      continue;
    }
    matched.push(...(await fetchLumaEvents(slug, trimmed)));
  }

  const byId = new Map<string, LumaEvent>();
  for (const event of [...matched, ...nearby]) {
    if (!byId.has(event.id) && !excludeIds.has(event.id)) {
      byId.set(event.id, event);
    }
  }

  return {
    placeName: place?.name,
    placeSlug: slug,
    events: [...byId.values()].slice(0, 12),
  };
}

async function resolveLumaPlace(city: string, state: string) {
  const places = await fetchLumaPlaces();
  const cityKey = normalizePlace(city);
  const stateKey = normalizePlace(state);
  const aliasSlug = CITY_ALIASES[cityKey];

  const scored = places
    .map((place) => {
      const nameKey = normalizePlace(place.name);
      const slugKey = normalizePlace(place.slug.replace(/-/g, ' '));
      let score = 0;
      if (aliasSlug && place.slug === aliasSlug) {
        score += 8;
      }
      if (nameKey === cityKey || slugKey === cityKey || place.slug === slugify(city)) {
        score += 6;
      }
      if (cityKey.length >= 4 && (nameKey.includes(cityKey) || cityKey.includes(nameKey))) {
        score += 3;
      }
      if (stateKey && (nameKey.includes(stateKey) || slugKey.includes(stateKey))) {
        score += 1;
      }
      return { place, score };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score);

  if (scored[0]) {
    return scored[0].place;
  }

  const hubSlug = STATE_HUB_SLUGS[stateKey];
  return places.find((place) => place.slug === hubSlug);
}

async function fetchLumaPlaces() {
  const response = await fetch(LUMA_BOOTSTRAP_URL, { headers: LUMA_HEADERS });
  if (!response.ok) {
    throw new Error(`Luma places failed (${response.status})`);
  }

  const payload: unknown = await response.json();
  const root = asRecord(payload);
  const places = Array.isArray(root?.places) ? root.places : [];

  return places.flatMap((entry) => {
    const record = asRecord(entry);
    const place = asRecord(record?.place) ?? record;
    const name = asString(place?.name);
    const slug = asString(place?.slug);
    if (!name || !slug) {
      return [];
    }
    return [{ name, slug }];
  });
}

async function fetchLumaEvents(slug: string, query?: string) {
  const url = new URL(LUMA_DISCOVER_URL);
  url.searchParams.set('slug', slug);
  url.searchParams.set('pagination_limit', query ? '15' : '25');
  if (query) {
    url.searchParams.set('query', query);
  }

  const response = await fetch(url, { headers: LUMA_HEADERS });
  if (response.status === 404) {
    return [];
  }
  if (!response.ok) {
    throw new Error(`Luma events failed (${response.status})`);
  }

  const payload: unknown = await response.json();
  const root = asRecord(payload);
  const entries = Array.isArray(root?.entries) ? root.entries : [];

  return entries.flatMap((entry) => {
    const event = normalizeLumaEvent(entry);
    return event ? [event] : [];
  });
}

function normalizeLumaEvent(entry: unknown): LumaEvent | null {
  const record = asRecord(entry);
  const event = asRecord(record?.event) ?? record;
  if (!event) {
    return null;
  }

  const id = asString(event.api_id) ?? asString(record?.api_id);
  const name = asString(event.name);
  const slug = asString(event.url);
  if (!id || !name || !slug) {
    return null;
  }

  const geo = asRecord(event.geo_address_info);
  const ticket = asRecord(record?.ticket_info);
  const calendar = asRecord(record?.calendar);
  const location =
    asString(geo?.city_state) ??
    asString(geo?.full_address) ??
    asString(geo?.short_address) ??
    asString(geo?.city);

  return {
    id,
    name,
    url: `https://lu.ma/${slug}`,
    startAt: asString(event.start_at) ?? asString(record?.start_at),
    timezone: asString(event.timezone),
    location,
    calendarName: asString(calendar?.name),
    guestCount: asNumber(record?.guest_count),
    isFree: typeof ticket?.is_free === 'boolean' ? ticket.is_free : undefined,
    coverUrl: asString(event.cover_url),
  };
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function normalizePlace(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
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

function asNumber(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

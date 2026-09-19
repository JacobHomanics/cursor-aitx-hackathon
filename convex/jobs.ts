export type InternshipListing = {
  id: string;
  name: string;
  url: string;
  company?: string;
  location?: string;
  category?: string;
  publishedAt?: string;
};

const MUSE_JOBS_URL = 'https://www.themuse.com/api/public/jobs';
const MUSE_HEADERS = {
  Accept: 'application/json',
  'User-Agent': 'NorthBound/1.0',
};

const ROLE_CATEGORIES: Record<string, string[]> = {
  software_engineer: ['Software Engineering', 'Computer and IT'],
  product_manager: ['Product Management'],
  designer: ['Design and UX', 'Design'],
  data_scientist: ['Data and Analytics', 'Data Science'],
  researcher: ['Science and Engineering', 'Data and Analytics'],
  founder: ['Business Operations', 'Product Management'],
  consultant: ['Business Operations'],
  operations: ['Business Operations'],
  marketing: ['Advertising and Marketing', 'Marketing'],
  policy: ['Law', 'Social Services'],
};

const INDUSTRY_CATEGORIES: Record<string, string[]> = {
  technology: ['Software Engineering', 'Computer and IT'],
  finance: ['Accounting and Finance'],
  healthcare: ['Healthcare'],
  energy: ['Energy Generation and Mining'],
  consulting: ['Business Operations'],
  education: ['Education'],
  government: ['Law'],
  media: ['Media, PR, and Communications'],
  consumer: ['Retail', 'Advertising and Marketing'],
  nonprofit: ['Social Services'],
};

const STATE_ABBREVIATIONS: Record<string, string> = {
  alabama: 'AL',
  alaska: 'AK',
  arizona: 'AZ',
  arkansas: 'AR',
  california: 'CA',
  colorado: 'CO',
  connecticut: 'CT',
  delaware: 'DE',
  florida: 'FL',
  georgia: 'GA',
  hawaii: 'HI',
  idaho: 'ID',
  illinois: 'IL',
  indiana: 'IN',
  iowa: 'IA',
  kansas: 'KS',
  kentucky: 'KY',
  louisiana: 'LA',
  maine: 'ME',
  maryland: 'MD',
  massachusetts: 'MA',
  michigan: 'MI',
  minnesota: 'MN',
  mississippi: 'MS',
  missouri: 'MO',
  montana: 'MT',
  nebraska: 'NE',
  nevada: 'NV',
  'new hampshire': 'NH',
  'new jersey': 'NJ',
  'new mexico': 'NM',
  'new york': 'NY',
  'north carolina': 'NC',
  'north dakota': 'ND',
  ohio: 'OH',
  oklahoma: 'OK',
  oregon: 'OR',
  pennsylvania: 'PA',
  'rhode island': 'RI',
  'south carolina': 'SC',
  'south dakota': 'SD',
  tennessee: 'TN',
  texas: 'TX',
  utah: 'UT',
  vermont: 'VT',
  virginia: 'VA',
  washington: 'WA',
  'west virginia': 'WV',
  wisconsin: 'WI',
  wyoming: 'WY',
  'district of columbia': 'DC',
};

export async function searchInternshipListings(input: {
  roleInterest?: string;
  industryInterest?: string;
  preferredCompany?: string;
  city?: string;
  state?: string;
}): Promise<InternshipListing[]> {
  const categories = museCategories(input.roleInterest, input.industryInterest);
  const location = museLocation(input.city, input.state);
  const company = input.preferredCompany?.trim();
  const requests: Promise<InternshipListing[]>[] = [];

  for (const category of categories.slice(0, 2)) {
    if (location) {
      requests.push(fetchMuseJobs({ category, location }));
    }
    requests.push(fetchMuseJobs({ category }));
  }

  if (location) {
    requests.push(fetchMuseJobs({ location }));
  }

  requests.push(fetchMuseJobs({ location: 'Flexible / Remote' }));

  if (company && company.toLowerCase() !== 'unknown') {
    requests.push(fetchMuseJobs({ company }));
  }

  const catalog = (await Promise.all(requests)).flat();

  const byId = new Map<string, InternshipListing>();
  for (const listing of catalog) {
    if (!byId.has(listing.id)) {
      byId.set(listing.id, listing);
    }
  }

  return [...byId.values()].slice(0, 20);
}

async function fetchMuseJobs(filters: { category?: string; location?: string; company?: string }) {
  const url = new URL(MUSE_JOBS_URL);
  url.searchParams.set('page', '0');
  url.searchParams.set('level', 'Internship');
  if (filters.category) {
    url.searchParams.set('category', filters.category);
  }
  if (filters.location) {
    url.searchParams.set('location', filters.location);
  }
  if (filters.company) {
    url.searchParams.set('company', filters.company);
  }

  try {
    const response = await fetch(url, { headers: MUSE_HEADERS });
    if (!response.ok) {
      return [];
    }

    const payload: unknown = await response.json();
    const root = asRecord(payload);
    const results = Array.isArray(root?.results) ? root.results : [];

    return results.flatMap((entry): InternshipListing[] => {
      const listing = normalizeListing(entry);
      return listing ? [listing] : [];
    });
  } catch {
    return [];
  }
}

function normalizeListing(entry: unknown): InternshipListing | null {
  const record = asRecord(entry);
  const idValue = record?.id;
  const id = typeof idValue === 'number' ? String(idValue) : asString(idValue);
  const name = asString(record?.name);
  const refs = asRecord(record?.refs);
  const url = asString(refs?.landing_page);
  if (!id || !name || !url) {
    return null;
  }

  const company = asString(asRecord(record?.company)?.name);
  const locations = Array.isArray(record?.locations) ? record.locations : [];
  const categories = Array.isArray(record?.categories) ? record.categories : [];
  const location = locations
    .map((item) => asString(asRecord(item)?.name))
    .filter(Boolean)
    .slice(0, 3)
    .join(', ');
  const category = asString(asRecord(categories[0])?.name);

  return {
    id,
    name,
    url,
    company,
    location: location || undefined,
    category,
    publishedAt: asString(record?.publication_date),
  };
}

function museCategories(roleInterest?: string, industryInterest?: string) {
  const fromRole = ROLE_CATEGORIES[roleInterest ?? ''] ?? [];
  const fromIndustry = INDUSTRY_CATEGORIES[industryInterest ?? ''] ?? [];
  return [...new Set([...fromRole, ...fromIndustry])];
}

function museLocation(city?: string, state?: string) {
  const cityName = city?.trim();
  const stateName = state?.trim();
  if (!cityName || !stateName) {
    return undefined;
  }
  const abbreviated = STATE_ABBREVIATIONS[stateName.toLowerCase()] ?? stateName;
  return `${cityName}, ${abbreviated}`;
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

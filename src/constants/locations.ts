import type { InterestOption } from '@/constants/onboarding';

function options(names: string[]): InterestOption[] {
  return names.map((name) => ({ value: name, label: name }));
}

const LOCATION_TREE: Record<string, Record<string, string[]>> = {
  'United States': {
    Alabama: ['Birmingham', 'Huntsville', 'Mobile', 'Montgomery', 'Tuscaloosa'],
    Alaska: ['Anchorage', 'Fairbanks', 'Juneau', 'Sitka', 'Wasilla'],
    Arizona: ['Chandler', 'Mesa', 'Phoenix', 'Scottsdale', 'Tucson'],
    Arkansas: ['Fayetteville', 'Fort Smith', 'Little Rock', 'Springdale'],
    California: [
      'Berkeley',
      'Fresno',
      'Irvine',
      'Los Angeles',
      'Oakland',
      'Sacramento',
      'San Diego',
      'San Francisco',
      'San Jose',
      'Stanford',
    ],
    Colorado: ['Aurora', 'Boulder', 'Colorado Springs', 'Denver', 'Fort Collins'],
    Connecticut: ['Bridgeport', 'Hartford', 'New Haven', 'Stamford'],
    Delaware: ['Dover', 'Newark', 'Wilmington'],
    'District of Columbia': ['Washington'],
    Florida: ['Jacksonville', 'Miami', 'Orlando', 'Tallahassee', 'Tampa'],
    Georgia: ['Athens', 'Atlanta', 'Augusta', 'Savannah'],
    Hawaii: ['Hilo', 'Honolulu', 'Kailua'],
    Idaho: ['Boise', 'Idaho Falls', 'Meridian'],
    Illinois: ['Chicago', 'Evanston', 'Naperville', 'Springfield', 'Urbana'],
    Indiana: ['Bloomington', 'Fort Wayne', 'Indianapolis', 'South Bend'],
    Iowa: ['Cedar Rapids', 'Des Moines', 'Iowa City'],
    Kansas: ['Kansas City', 'Lawrence', 'Topeka', 'Wichita'],
    Kentucky: ['Lexington', 'Louisville', 'Owensboro'],
    Louisiana: ['Baton Rouge', 'Lafayette', 'New Orleans', 'Shreveport'],
    Maine: ['Augusta', 'Bangor', 'Portland'],
    Maryland: ['Annapolis', 'Baltimore', 'Bethesda', 'College Park'],
    Massachusetts: ['Boston', 'Cambridge', 'Springfield', 'Worcester'],
    Michigan: ['Ann Arbor', 'Detroit', 'Grand Rapids', 'Lansing'],
    Minnesota: ['Duluth', 'Minneapolis', 'Saint Paul'],
    Mississippi: ['Biloxi', 'Jackson', 'Oxford'],
    Missouri: ['Columbia', 'Kansas City', 'Springfield', 'St. Louis'],
    Montana: ['Billings', 'Bozeman', 'Helena', 'Missoula'],
    Nebraska: ['Lincoln', 'Omaha'],
    Nevada: ['Henderson', 'Las Vegas', 'Reno'],
    'New Hampshire': ['Concord', 'Manchester', 'Nashua'],
    'New Jersey': ['Jersey City', 'Newark', 'Princeton', 'Trenton'],
    'New Mexico': ['Albuquerque', 'Las Cruces', 'Santa Fe'],
    'New York': ['Albany', 'Brooklyn', 'Buffalo', 'Ithaca', 'New York', 'Rochester', 'Syracuse'],
    'North Carolina': ['Charlotte', 'Durham', 'Greensboro', 'Raleigh'],
    'North Dakota': ['Bismarck', 'Fargo', 'Grand Forks'],
    Ohio: ['Cincinnati', 'Cleveland', 'Columbus', 'Dayton'],
    Oklahoma: ['Norman', 'Oklahoma City', 'Tulsa'],
    Oregon: ['Bend', 'Eugene', 'Portland', 'Salem'],
    Pennsylvania: ['Harrisburg', 'Philadelphia', 'Pittsburgh', 'State College'],
    'Rhode Island': ['Newport', 'Providence'],
    'South Carolina': ['Charleston', 'Columbia', 'Greenville'],
    'South Dakota': ['Pierre', 'Rapid City', 'Sioux Falls'],
    Tennessee: ['Chattanooga', 'Knoxville', 'Memphis', 'Nashville'],
    Texas: ['Austin', 'College Station', 'Dallas', 'Houston', 'San Antonio'],
    Utah: ['Provo', 'Salt Lake City', 'West Valley City'],
    Vermont: ['Burlington', 'Montpelier'],
    Virginia: ['Alexandria', 'Arlington', 'Charlottesville', 'Norfolk', 'Richmond'],
    Washington: ['Bellevue', 'Olympia', 'Seattle', 'Spokane', 'Tacoma'],
    'West Virginia': ['Charleston', 'Huntington', 'Morgantown'],
    Wisconsin: ['Madison', 'Milwaukee'],
    Wyoming: ['Casper', 'Cheyenne', 'Laramie'],
  },
  Canada: {
    Alberta: ['Calgary', 'Edmonton'],
    'British Columbia': ['Vancouver', 'Victoria'],
    Manitoba: ['Winnipeg'],
    'New Brunswick': ['Fredericton', 'Moncton', 'Saint John'],
    'Newfoundland and Labrador': ['St. John\'s'],
    'Northwest Territories': ['Yellowknife'],
    'Nova Scotia': ['Halifax'],
    Nunavut: ['Iqaluit'],
    Ontario: ['Mississauga', 'Ottawa', 'Toronto', 'Waterloo'],
    'Prince Edward Island': ['Charlottetown'],
    Quebec: ['Montreal', 'Quebec City'],
    Saskatchewan: ['Regina', 'Saskatoon'],
    Yukon: ['Whitehorse'],
  },
  'United Kingdom': {
    England: ['Birmingham', 'Cambridge', 'Leeds', 'Liverpool', 'London', 'Manchester', 'Oxford'],
    'Northern Ireland': ['Belfast'],
    Scotland: ['Edinburgh', 'Glasgow'],
    Wales: ['Cardiff', 'Swansea'],
  },
  India: {
    Delhi: ['New Delhi'],
    Gujarat: ['Ahmedabad', 'Surat'],
    Karnataka: ['Bengaluru', 'Mysuru'],
    Maharashtra: ['Mumbai', 'Pune'],
    'Tamil Nadu': ['Chennai'],
    Telangana: ['Hyderabad'],
    'Uttar Pradesh': ['Lucknow', 'Noida'],
    'West Bengal': ['Kolkata'],
  },
  Australia: {
    'Australian Capital Territory': ['Canberra'],
    'New South Wales': ['Newcastle', 'Sydney'],
    'Northern Territory': ['Darwin'],
    Queensland: ['Brisbane', 'Gold Coast'],
    'South Australia': ['Adelaide'],
    Tasmania: ['Hobart'],
    Victoria: ['Melbourne'],
    'Western Australia': ['Perth'],
  },
  Germany: {
    Bavaria: ['Munich', 'Nuremberg'],
    Berlin: ['Berlin'],
    Hamburg: ['Hamburg'],
    Hesse: ['Frankfurt'],
    'North Rhine-Westphalia': ['Cologne', 'Düsseldorf'],
  },
  France: {
    'Île-de-France': ['Paris'],
    'Auvergne-Rhône-Alpes': ['Lyon'],
    "Provence-Alpes-Côte d'Azur": ['Marseille', 'Nice'],
  },
  Mexico: {
    'Mexico City': ['Mexico City'],
    Jalisco: ['Guadalajara'],
    'Nuevo León': ['Monterrey'],
  },
  Nigeria: {
    Lagos: ['Lagos'],
    'Federal Capital Territory': ['Abuja'],
    Rivers: ['Port Harcourt'],
  },
  Kenya: {
    Nairobi: ['Nairobi'],
    Mombasa: ['Mombasa'],
  },
  'South Africa': {
    Gauteng: ['Johannesburg', 'Pretoria'],
    'Western Cape': ['Cape Town'],
    'KwaZulu-Natal': ['Durban'],
  },
  Brazil: {
    'São Paulo': ['Campinas', 'São Paulo'],
    'Rio de Janeiro': ['Rio de Janeiro'],
    'Federal District': ['Brasília'],
  },
  Philippines: {
    'Metro Manila': ['Makati', 'Manila', 'Quezon City'],
    Cebu: ['Cebu City'],
  },
  'United Arab Emirates': {
    Dubai: ['Dubai'],
    'Abu Dhabi': ['Abu Dhabi'],
    Sharjah: ['Sharjah'],
  },
  Singapore: {
    Singapore: ['Singapore'],
  },
  Ghana: {
    'Greater Accra': ['Accra'],
    Ashanti: ['Kumasi'],
  },
};

const EXTRA_COUNTRIES = [
  'Argentina',
  'Austria',
  'Bangladesh',
  'Belgium',
  'Chile',
  'China',
  'Colombia',
  'Denmark',
  'Egypt',
  'Ethiopia',
  'Finland',
  'Greece',
  'Indonesia',
  'Ireland',
  'Israel',
  'Italy',
  'Japan',
  'Malaysia',
  'Netherlands',
  'New Zealand',
  'Norway',
  'Pakistan',
  'Poland',
  'Portugal',
  'Saudi Arabia',
  'South Korea',
  'Spain',
  'Sweden',
  'Switzerland',
  'Taiwan',
  'Thailand',
  'Turkey',
  'Uganda',
  'Vietnam',
];

export const COUNTRIES: InterestOption[] = options([
  'United States',
  ...Object.keys(LOCATION_TREE)
    .filter((name) => name !== 'United States')
    .sort((a, b) => a.localeCompare(b)),
  ...EXTRA_COUNTRIES.filter((name) => !(name in LOCATION_TREE)).sort((a, b) => a.localeCompare(b)),
]);

export function statesForCountry(country: string): InterestOption[] {
  const states = LOCATION_TREE[country];
  return states ? options(Object.keys(states)) : [];
}

export function citiesFor(country: string, state: string): InterestOption[] {
  const cities = LOCATION_TREE[country]?.[state] ?? [];
  return options(cities);
}

export function hasLocationCatalog(country: string) {
  return Boolean(LOCATION_TREE[country]);
}

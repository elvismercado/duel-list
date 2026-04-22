import type { Item, ListConfig } from '@/types';

function makeItem(id: string, name: string, rank: number): Item {
  return {
    id,
    name,
    eloScore: 1000,
    prevEloScore: 1000,
    prevRank: rank,
    comparisonCount: 0,
    added: '2026-04-21',
  };
}

const SAMPLE_DATA: Record<string, { name: string; items: string[] }> = {
  anime: {
    name: 'Top Anime',
    items: [
      'One Piece',
      'Attack on Titan',
      'Naruto',
      'Fullmetal Alchemist',
      'Death Note',
      'Demon Slayer',
      'Jujutsu Kaisen',
      'My Hero Academia',
      'Steins;Gate',
      'Cowboy Bebop',
    ],
  },
  pizza: {
    name: 'Pizza Toppings',
    items: [
      'Pepperoni',
      'Mushroom',
      'Onion',
      'Sausage',
      'Bacon',
      'Basil',
      'Olive',
      'Extra Cheese',
      'Garlic',
      'Tomato',
    ],
  },
  movies: {
    name: 'Favorite Movies',
    items: [
      'The Shawshank Redemption',
      'Inception',
      'The Dark Knight',
      'Pulp Fiction',
      'Forrest Gump',
      'The Matrix',
      'Interstellar',
      'Fight Club',
    ],
  },
  vacation: {
    name: 'Vacation Destinations',
    items: [
      'Tokyo',
      'Paris',
      'New York',
      'Bali',
      'London',
      'Rome',
      'Barcelona',
      'Reykjavik',
      'Maldives',
      'Cape Town',
    ],
  },
  snacks: {
    name: 'Best Snacks',
    items: [
      'Chips',
      'Popcorn',
      'Chocolate',
      'Pretzels',
      'Cookies',
      'Trail Mix',
      'Gummy Bears',
      'Nachos',
      'Ice Cream',
      'Fruit',
    ],
  },
  hobbies: {
    name: 'Hobbies',
    items: [
      'Reading',
      'Gaming',
      'Cooking',
      'Hiking',
      'Photography',
      'Drawing',
      'Gardening',
      'Music',
      'Cycling',
      'Yoga',
    ],
  },
};

// Deterministic IDs for sample items (4-char, unique per sample)
const SAMPLE_IDS = [
  'sa01', 'sa02', 'sa03', 'sa04', 'sa05',
  'sa06', 'sa07', 'sa08', 'sa09', 'sa10',
];

const SAMPLE_LIST_IDS: Record<string, string> = {
  anime: 'sani',
  pizza: 'spiz',
  movies: 'smov',
  vacation: 'svac',
  snacks: 'ssnk',
  hobbies: 'shob',
};

export function getSampleList(key: string): ListConfig | null {
  const data = SAMPLE_DATA[key];
  if (!data) return null;

  const items = data.items.map((name, idx) =>
    makeItem(SAMPLE_IDS[idx]!, name, idx + 1),
  );

  return {
    id: SAMPLE_LIST_IDS[key]!,
    name: data.name,
    sessionLength: 10,
    kFactor: 32,
    created: '2026-04-21',
    items: structuredClone(items),
  };
}

export const SAMPLE_KEYS = Object.keys(SAMPLE_DATA);

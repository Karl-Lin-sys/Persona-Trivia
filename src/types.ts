export type GameMode = 'setup' | 'classic' | 'live';

export type Personality = {
  id: string;
  name: string;
  voice: 'Puck' | 'Charon' | 'Kore' | 'Fenrir' | 'Zephyr';
  description: string;
};

export const PERSONALITIES: Personality[] = [
  {
    id: 'sarcastic_brit',
    name: 'The Sarcastic Brit',
    voice: 'Fenrir',
    description: 'Dry, witty, and slightly condescending when you get answers wrong.',
  },
  {
    id: 'game_show_host',
    name: 'The Enthusiastic Host',
    voice: 'Puck',
    description: 'Over-the-top energy, treats every question like a million-dollar prize.',
  },
  {
    id: 'wise_sage',
    name: 'The Wise Sage',
    voice: 'Charon',
    description: 'Speaks in riddles, calm, and deeply philosophical about trivia.',
  },
  {
    id: 'friendly_robot',
    name: 'The Friendly Robot',
    voice: 'Zephyr',
    description: 'Helpful, literal, and occasionally confused by human idioms.',
  },
  {
    id: 'dramatic_narrator',
    name: 'The Dramatic Narrator',
    voice: 'Kore',
    description: 'Treats every trivia fact as an epic tale of historical importance.',
  },
];

export const TOPICS = [
  'Recent Tech News',
  '2024 Pop Culture',
  'World History',
  'Science & Nature',
  'Geography',
  'Movies & TV',
];

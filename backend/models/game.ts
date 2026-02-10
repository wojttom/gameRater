export interface GameDetails {
  appid?: string | number;
  type: string;
  name: string;
  steam_appid: number;
  required_age: number;
  is_free: boolean;
  dlc: number[];
  detailed_description: string;
  about_the_game: string;
  short_description: string;
  supported_languages: string;
  header_image: string;
  capsule_image: string;
  capsule_imagev5: string;
  background: string;
  background_raw: string;
  website: string | null;
  pc_requirements: any;
  mac_requirements: any;
  linux_requirements: any;
  developers: string[];
  publishers: string[];
  price_overview?: {
    currency: string;
    initial: number;
    final: number;
    discount_percent: number;
    initial_formatted: string;
    final_formatted: string;
  };
  platforms: {
    windows: boolean;
    mac: boolean;
    linux: boolean;
  };
  metacritic?: {
    score: number;
    url: string;
  };
  categories: Array<{ id: number; description: string }>;
  genres: Array<{ id: string; description: string }>;
  screenshots: Array<{ id: number; path_thumbnail: string; path_full: string }>;
  movies?: Array<any>;
  recommendations?: { total: number };
  release_date: {
    coming_soon: boolean;
    date: string;
  };
  fullgame?: {
    appid: string | number;
    name: string;
  };
  createdBy?: string | { username: string } | null;
}

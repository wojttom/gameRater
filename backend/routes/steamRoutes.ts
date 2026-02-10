import express from 'express';
import axios from 'axios';
import axiosRetry from 'axios-retry';
import Ajv from 'ajv';
import CustomGame from '../models/customGame';

interface DLCDto {
  id: number;
  name: string;
  header_image?: string;
  price_overview?: any;
  platforms?: { windows: boolean; mac: boolean; linux: boolean };
  release_date?: { coming_soon: boolean; date: string };
}

axiosRetry(axios, { retries: 3, retryDelay: axiosRetry.exponentialDelay });

const router = express.Router();
const TTL = 1000 * 60 * 5;
const cache = new Map<string, { ts: number; data: any }>();

const appDetailsSchema = {
  type: 'object',
  properties: {
    success: { type: 'boolean' },
    data: {
      type: 'object',
      properties: {
        appid: { type: ['string', 'number'] },
        type: { type: 'string' },
        name: { type: 'string' },
        steam_appid: { type: 'number' },
        required_age: { type: ['number', 'string'] },
        is_free: { type: 'boolean' },
        dlc: { type: 'array', items: { type: 'number' } },
        detailed_description: { type: 'string' },
        about_the_game: { type: 'string' },
        short_description: { type: 'string' },
        supported_languages: { type: 'string' },
        header_image: { type: 'string' },
        capsule_image: { type: 'string' },
        capsule_imagev5: { type: 'string' },
        background: { type: 'string' },
        background_raw: { type: 'string' },
        website: { type: ['string', 'null'] },
        pc_requirements: {},
        mac_requirements: {},
        linux_requirements: {},
        developers: { type: 'array', items: { type: 'string' } },
        publishers: { type: 'array', items: { type: 'string' } },
        price_overview: {
          type: 'object',
          properties: {
            currency: { type: 'string' },
            initial: { type: 'number' },
            final: { type: 'number' },
            discount_percent: { type: 'number' },
            initial_formatted: { type: 'string' },
            final_formatted: { type: 'string' },
          },
        },
        platforms: {
          type: 'object',
          properties: {
            windows: { type: 'boolean' },
            mac: { type: 'boolean' },
            linux: { type: 'boolean' },
          },
        },
        metacritic: {
          type: 'object',
          properties: {
            score: { type: 'number' },
            url: { type: 'string' },
          },
        },
        categories: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number' },
              description: { type: 'string' },
            },
          },
        },
        genres: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              description: { type: 'string' },
            },
          },
        },
        screenshots: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number' },
              path_thumbnail: { type: 'string' },
              path_full: { type: 'string' },
            },
          },
        },
        movies: { type: 'array' },
        recommendations: {
          type: 'object',
          properties: {
            total: { type: 'number' },
          },
        },
        release_date: {
          type: 'object',
          properties: {
            coming_soon: { type: 'boolean' },
            date: { type: 'string' },
          },
        },
        fullgame: {
          type: 'object',
          properties: {
            appid: { type: ['string', 'number'] },
            name: { type: 'string' },
          },
        },
      },
    },
  },
  required: ['success'],
};
const ajv = new Ajv();
const validate = ajv.compile(appDetailsSchema);

let cacheHits = 0;
let cacheMisses = 0;
let apiErrors = 0;

async function fetchAppDetails(appid: number): Promise<any> {
  const key = `appdetails_${appid}`;
  const now = Date.now();
  const cached = cache.get(key);
  if (cached && now - cached.ts < TTL) {
    cacheHits++;
    return cached.data;
  }
  cacheMisses++;

  try {
    const response = await axios.get(
      `https://store.steampowered.com/api/appdetails?appids=${appid}&l=english&cc=EN`,
    );
    const data = response.data[String(appid)];
    if (data && data.success && data.data) {
      if (validate(data)) {
        (data.data as any).platforms = (data.data as any).platforms || {
          windows: false,
          mac: false,
          linux: false,
        };
        cache.set(key, { ts: now, data });
        return data.data;
      } else {
        console.log('Schema validation failed for appid', appid, ajv.errors);
        cache.set(key, { ts: now, data });
        return data.data;
      }
    } else {
      console.log('API response invalid for appid', appid, data);
      apiErrors++;
      if (cached) return cached.data;
      return null;
    }
  } catch (error) {
    apiErrors++;
    if (cached) return cached.data;
    return null;
  }
}

async function fetchDLCDetails(dlcIds: number[], parentAppid?: number) {
  const dlcData: any[] = [];
  if (parentAppid) {
    try {
      const url = `https://store.steampowered.com/api/dlcforapp/?appid=${parentAppid}&l=english&cc=EN`;
      const res = await axios.get(url, { timeout: 10000 });
      const data = res.data;
      const dlcs = data?.dlc || [];

      for (const dlc of dlcs as DLCDto[]) {
        if (dlcIds && dlcIds.length > 0 && !dlcIds.includes(dlc.id)) continue;
        const capsule = `https://cdn.cloudflare.steamstatic.com/steam/apps/${dlc.id}/capsule_231x87.jpg`;
        dlcData.push({
          id: dlc.id,
          name: dlc.name || `DLC ${dlc.id}`,
          capsule_image: capsule,
          header_image: dlc.header_image || null,
          thumbnail: dlc.header_image || capsule,
          price_overview: dlc.price_overview || null,
          platforms: dlc.platforms || null,
          release_date: dlc.release_date || null,
        });
      }

      return dlcData;
    } catch (e) {}
  }
  for (const dlcId of dlcIds) {
    try {
      const details = await fetchAppDetails(dlcId);
      if (details) {
        const capsule = `https://cdn.cloudflare.steamstatic.com/steam/apps/${dlcId}/capsule_231x87.jpg`;
        dlcData.push({
          id: dlcId,
          name: details.name || `DLC ${dlcId}`,
          capsule_image: capsule,
          header_image: details.header_image || null,
          thumbnail: details.header_image || capsule,
          price_overview: details.price_overview || null,
          platforms: details.platforms || null,
          release_date: details.release_date || null,
        });
      }
    } catch (e) {}
  }

  return dlcData;
}

router.get('/details/:appid', async (req, res) => {
  const appidParam = req.params.appid;

  if (/^c\d/.test(appidParam)) {
    try {
      const customGame = await CustomGame.findOne({ appid: appidParam }).populate(
        'createdBy',
        'username avatarUrl',
      );
      if (!customGame) {
        return res.status(404).json({ error: 'Custom game not found' });
      }
      return res.json(customGame);
    } catch (err) {
      return res.status(500).json({ error: 'Failed to fetch custom game' });
    }
  }

  const appid = Number(appidParam);
  if (!appid || isNaN(appid)) {
    return res.status(400).json({ error: 'Invalid appid' });
  }

  const details = await fetchAppDetails(appid);
  if (!details) {
    return res.status(404).json({ error: 'Game not found' });
  }

  if (details.dlc && details.dlc.length > 0) {
    details.dlc_details = await fetchDLCDetails(details.dlc, appid);
  }

  return res.json(details);
});

router.get('/search', async (req, res) => {
  try {
    const term = req.query.term;
    if (!term) return res.status(400).json({ error: 'No search term provided' });
    const url = `https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(
      String(term),
    )}&l=english&cc=EN`;
    const response = await axios.get(url);
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: 'Search failed' });
  }
});

router.get('/search-all', async (req, res) => {
  try {
    const term = req.query.term as string;
    if (!term) return res.status(400).json({ error: 'No search term provided' });

    const steamUrl = `https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(
      term,
    )}&l=english&cc=EN`;
    const steamResponse = await axios.get(steamUrl);
    const steamGames = steamResponse.data.items || [];

    const customGames = await CustomGame.find({
      $or: [
        { name: { $regex: term, $options: 'i' } },
        { about_the_game: { $regex: term, $options: 'i' } },
      ],
    })
      .limit(20)
      .select('appid name header_image capsule_image price_overview');

    const allResults = {
      steam: steamGames,
      custom: customGames,
      total: steamGames.length + customGames.length,
    };

    res.json(allResults);
  } catch (error) {
    res.status(500).json({ error: 'Search failed' });
  }
});

router.get('/metrics', (req, res) => {
  res.json({ cacheHits, cacheMisses, apiErrors });
});

export default router;

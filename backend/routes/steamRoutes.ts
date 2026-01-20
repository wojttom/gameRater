import express from 'express';
import axios from 'axios';
import CustomGame from '../models/customGame';

const router = express.Router();
const TTL = 1000 * 60 * 5;
const cache = new Map<string, { ts: number; data: any }>();

async function fetchAppDetails(appid: number) {
  const key = `app_${appid}`;
  const cached = cache.get(key);
  if (cached && Date.now() - cached.ts < TTL) return cached.data;

  try {
    const url = `https://store.steampowered.com/api/appdetails?appids=${appid}&l=english&cc=EN`;
    const res = await axios.get(url, { timeout: 10000 });
    const data = res.data?.[String(appid)];

    if (!data?.success) return null;

    const appData = data.data;
    cache.set(key, { ts: Date.now(), data: appData });
    return appData;
  } catch (e) {
    return null;
  }
}

async function fetchDLCDetails(dlcIds: number[]) {
  const dlcData: any[] = [];

  for (const dlcId of dlcIds) {
    try {
      const details = await fetchAppDetails(dlcId);
      if (details) {
        dlcData.push({
          id: dlcId,
          name: details.name || `DLC ${dlcId}`,
          capsule_image: `https://cdn.cloudflare.steamstatic.com/steam/apps/${dlcId}/capsule_231x87.jpg`,
          header_image: details.header_image || null,
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
    details.dlc_details = await fetchDLCDetails(details.dlc);
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

export default router;

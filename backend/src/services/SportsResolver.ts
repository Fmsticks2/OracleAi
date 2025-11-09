import axios from 'axios';
import type { SportsMatchCriteria } from '../types';

export async function resolveSportsMatch(criteria: SportsMatchCriteria): Promise<{ outcome: 'Yes' | 'No' | 'Invalid'; confidence: number; sources: string[] }> {
  if (criteria.league !== 'NBA') {
    return { outcome: 'Invalid', confidence: 40, sources: ['https://www.espn.com', 'https://www.nba.com'] };
  }

  const dateStr = criteria.date.replace(/-/g, ''); // ESPN expects YYYYMMDD
  const url = `https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard?dates=${dateStr}`;
  let sources: string[] = [url, 'https://www.nba.com/scores'];
  try {
    const resp = await axios.get(url, { timeout: 8000 });
    const events = resp?.data?.events || [];
    const game = events.find((ev: any) => {
      const comps = ev?.competitions?.[0]?.competitors || [];
      const home = comps.find((c: any) => c.homeAway === 'home');
      const away = comps.find((c: any) => c.homeAway === 'away');
      const homeCode = home?.team?.abbreviation || home?.team?.shortDisplayName;
      const awayCode = away?.team?.abbreviation || away?.team?.shortDisplayName;
      return (
        homeCode && awayCode &&
        homeCode.toLowerCase() === criteria.home.toLowerCase() &&
        awayCode.toLowerCase() === criteria.away.toLowerCase()
      );
    });

    if (!game) {
      return { outcome: 'Invalid', confidence: 50, sources };
    }

    const comps = game.competitions?.[0]?.competitors || [];
    const statusCompleted = game?.status?.type?.completed === true || game?.status?.type?.state === 'post';
    const home = comps.find((c: any) => c.homeAway === 'home');
    const away = comps.find((c: any) => c.homeAway === 'away');
    const homeScore = Number(home?.score);
    const awayScore = Number(away?.score);

    if (!statusCompleted || isNaN(homeScore) || isNaN(awayScore)) {
      return { outcome: 'Invalid', confidence: 45, sources };
    }

    const winnerCode = homeScore > awayScore ? (home?.team?.abbreviation || criteria.home) : (away?.team?.abbreviation || criteria.away);
    const pickNorm = criteria.pick.toLowerCase();
    const pickCode = pickNorm === 'home' ? criteria.home : pickNorm === 'away' ? criteria.away : criteria.pick;
    const outcome: 'Yes' | 'No' = winnerCode.toLowerCase() === pickCode.toLowerCase() ? 'Yes' : 'No';

    // Confidence: completed game with official ESPN score -> high
    const confidence = 95;
    return { outcome, confidence, sources };
  } catch {
    return { outcome: 'Invalid', confidence: 40, sources };
  }
}
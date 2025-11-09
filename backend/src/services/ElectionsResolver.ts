import axios from 'axios';
import type { ElectionsCriteria } from '../types';

export async function resolveElectionWinner(criteria: ElectionsCriteria): Promise<{ outcome: 'Yes' | 'No' | 'Invalid'; confidence: number; sources: string[] }> {
  // Placeholder implementation using public pages; real integration would use AP Elections API
  const sources: string[] = [
    'https://apnews.com/hub/elections',
    'https://www.reuters.com/world/us/'
  ];
  try {
    const [apResp, reutersResp] = await Promise.all([
      axios.get(sources[0], { timeout: 8000 }).catch(() => null),
      axios.get(sources[1], { timeout: 8000 }).catch(() => null)
    ]);
    const apText = apResp?.data ? String(apResp.data).toLowerCase() : '';
    const reutersText = reutersResp?.data ? String(reutersResp.data).toLowerCase() : '';
    const name = criteria.candidate.toLowerCase();
    const keywords = ['wins', 'victory', 'elected'];
    const apSignal = keywords.some(k => apText.includes(name) && apText.includes(k));
    const reutersSignal = keywords.some(k => reutersText.includes(name) && reutersText.includes(k));
    if (apSignal && reutersSignal) {
      return { outcome: 'Yes', confidence: 70, sources };
    }
    if (!apSignal && !reutersSignal) {
      return { outcome: 'Invalid', confidence: 50, sources };
    }
    return { outcome: 'Yes', confidence: 60, sources };
  } catch {
    return { outcome: 'Invalid', confidence: 45, sources };
  }
}
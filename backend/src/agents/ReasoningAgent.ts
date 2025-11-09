import type { ResolutionRequest, Outcome } from '../types';

export class ReasoningAgent {
  async conclude(req: ResolutionRequest, validation: { sources: string[]; score: number; proposedOutcome?: Outcome; proposedConfidence?: number }): Promise<{ outcome: Outcome; confidence: number }> {
    // Prefer proposedOutcome from domain resolver when available
    if (validation.proposedOutcome) {
      const confidence = Math.max(validation.score, validation.proposedConfidence || 0);
      return { outcome: validation.proposedOutcome, confidence };
    }
    // Fallback heuristic
    let outcome: Outcome = 'Invalid';
    if (validation.score >= 90) {
      outcome = 'Yes';
    } else if (validation.score >= 70) {
      outcome = 'No';
    }
    return { outcome, confidence: validation.score };
  }
}
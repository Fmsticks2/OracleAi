export class ValidatorAgent {
  evaluate(chunks: Array<{ sources: string[]; agreement: number; proposedOutcome?: 'Yes' | 'No' | 'Invalid'; confidence?: number }>): { sources: string[]; score: number; proposedOutcome?: 'Yes' | 'No' | 'Invalid'; proposedConfidence?: number } {
    const sources = chunks.flatMap(c => c.sources);
    const agreementAvg = chunks.reduce((acc, c) => acc + c.agreement, 0) / Math.max(1, chunks.length);
    const score = Math.round(agreementAvg * 100);
    const withOutcome = chunks.find(c => c.proposedOutcome);
    const proposedOutcome = withOutcome?.proposedOutcome;
    const proposedConfidence = withOutcome?.confidence;
    return { sources, score, proposedOutcome, proposedConfidence };
  }
}
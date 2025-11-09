export class ValidatorAgent {
  evaluate(chunks: Array<{ sources: string[]; agreement: number }>): { sources: string[]; score: number } {
    const sources = chunks.flatMap(c => c.sources);
    const agreementAvg = chunks.reduce((acc, c) => acc + c.agreement, 0) / Math.max(1, chunks.length);
    const score = Math.round(agreementAvg * 100);
    return { sources, score };
  }
}
import { keccak256, toUtf8Bytes } from 'ethers';

export class ProofAgent {
  async generate(payload: unknown): Promise<string> {
    const json = JSON.stringify(payload);
    return keccak256(toUtf8Bytes(json));
  }
}
import { keccak256, toUtf8Bytes } from 'ethers';
import axios from 'axios';

export class ProofAgent {
  async generate(payload: unknown): Promise<{ hash: string; cid?: string | null }> {
    const json = JSON.stringify(payload);
    const hash = keccak256(toUtf8Bytes(json));

    const apiKey = process.env.PINATA_API_KEY || '';
    const secretKey = process.env.PINATA_SECRET_KEY || '';

    if (!apiKey || !secretKey) {
      return { hash, cid: null };
    }

    try {
      const resp = await axios.post(
        'https://api.pinata.cloud/pinning/pinJSONToIPFS',
        { pinataContent: JSON.parse(json), pinataMetadata: { name: `oracleai-proof-${Date.now()}` } },
        { headers: { pinata_api_key: apiKey, pinata_secret_api_key: secretKey } }
      );
      const cid = resp?.data?.IpfsHash || null;
      return { hash, cid };
    } catch {
      return { hash, cid: null };
    }
  }
}
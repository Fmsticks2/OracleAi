import { ethers } from "ethers";

export const BSC_MAINNET_CHAIN_ID = 56;
export const BSC_TESTNET_CHAIN_ID = 97;

export type SupportedChainId = typeof BSC_MAINNET_CHAIN_ID | typeof BSC_TESTNET_CHAIN_ID;

export function getDefaultChainId(): SupportedChainId {
  const fromEnv = Number(import.meta.env.VITE_DEFAULT_CHAIN_ID || BSC_TESTNET_CHAIN_ID);
  return (fromEnv === BSC_MAINNET_CHAIN_ID ? BSC_MAINNET_CHAIN_ID : BSC_TESTNET_CHAIN_ID) as SupportedChainId;
}

export async function getBrowserProvider(): Promise<ethers.BrowserProvider> {
  if (typeof window === "undefined" || !(window as any).ethereum) {
    throw new Error("No injected wallet detected. Please install MetaMask or BSC Wallet.");
  }
  return new ethers.BrowserProvider((window as any).ethereum);
}

export async function getSigner(): Promise<ethers.Signer> {
  const provider = await getBrowserProvider();
  await (window as any).ethereum.request({ method: "eth_requestAccounts" });
  return await provider.getSigner();
}

export async function getChainId(provider?: ethers.BrowserProvider): Promise<number> {
  const p = provider || (await getBrowserProvider());
  const network = await p.getNetwork();
  return Number(network.chainId);
}

export async function ensureBscChain(targetChainId: SupportedChainId = getDefaultChainId()): Promise<number> {
  const provider = await getBrowserProvider();
  const current = await getChainId(provider);
  if (current === targetChainId) return current;

  const chainHex = targetChainId === BSC_MAINNET_CHAIN_ID ? "0x38" : "0x61";
  try {
    await (window as any).ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: chainHex }],
    });
    return targetChainId;
  } catch (err: any) {
    // Attempt to add the chain if it's missing
    if (err?.code === 4902 || /Unrecognized chain ID/i.test(String(err?.message))) {
      const params = targetChainId === BSC_MAINNET_CHAIN_ID
        ? {
            chainId: "0x38",
            chainName: "BNB Smart Chain",
            nativeCurrency: { name: "BNB", symbol: "BNB", decimals: 18 },
            rpcUrls: ["https://bsc-dataseed.binance.org/"],
            blockExplorerUrls: ["https://bscscan.com"],
          }
        : {
            chainId: "0x61",
            chainName: "BNB Smart Chain Testnet",
            nativeCurrency: { name: "tBNB", symbol: "tBNB", decimals: 18 },
            rpcUrls: ["https://data-seed-prebsc-1-s1.binance.org:8545/"],
            blockExplorerUrls: ["https://testnet.bscscan.com"],
          };
      await (window as any).ethereum.request({ method: "wallet_addEthereumChain", params: [params] });
      return targetChainId;
    }
    throw err;
  }
}

export function toWei(bnbAmount: string): bigint {
  return ethers.parseEther(bnbAmount || "0");
}

export function isAddress(value: string): boolean {
  try {
    return !!ethers.getAddress(value);
  } catch {
    return false;
  }
}
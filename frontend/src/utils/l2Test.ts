import { Provider } from 'zksync-ethers';
import { BrowserProvider } from 'ethers';

/**
 * Minimal isolated test to validate that MetaMask signer can send a noop tx on zkSync.
 * Returns transaction hash if successful, otherwise throws detailed error.
 */
export async function testL2Transaction(): Promise<string> {
  if (!(window as any).ethereum) {
    throw new Error('No injected provider (MetaMask) found');
  }
  const browser = new BrowserProvider((window as any).ethereum);
  const signer = await browser.getSigner();
  const addr = await signer.getAddress();
  const l2 = new Provider('https://sepolia.era.zksync.dev');
  const zkSigner: any = signer.connect(l2);
  const network = await zkSigner.provider.getNetwork();
  if (Number(network.chainId) !== 300) {
    throw new Error(`Wrong chain (expected 300). Got ${network.chainId}`);
  }
  try {
    const tx = await zkSigner.sendTransaction({ to: addr, value: 0 });
    console.log('[l2Test] Sent tx', tx.hash);
    await tx.wait();
    console.log('[l2Test] Confirmed');
    return tx.hash;
  } catch (e: any) {
    console.error('[l2Test] Failed sending tx:', e);
    throw new Error(`L2 test transaction failed: ${e?.message || e}`);
  }
}

import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { hardhat, sepolia } from "viem/chains";

/**
 * WalletConnect projectId is optional for MetaMask-only flows.
 * Register at https://cloud.walletconnect.com if you want WalletConnect v2 support.
 */
const WALLETCONNECT_PROJECT_ID = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID ?? "00000000000000000000000000000000";

export const wagmiConfig = getDefaultConfig({
  appName: "SupplyChain DApp",
  projectId: WALLETCONNECT_PROJECT_ID,
  chains: [hardhat, sepolia],
  ssr: false,
  pollingInterval: 1_000, // check for new blocks every 1 s (fast enough for live demos)
});

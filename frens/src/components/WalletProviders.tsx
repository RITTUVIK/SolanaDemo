"use client";

import { useMemo, type ReactNode } from "react";
import { clusterApiUrl } from "@solana/web3.js";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import "@solana/wallet-adapter-react-ui/styles.css";

// Devnet for the hackathon demo: free test SOL, no real money.
const ENDPOINT = process.env.NEXT_PUBLIC_RPC_URL ?? clusterApiUrl("devnet");

export function WalletProviders({ children }: { children: ReactNode }) {
  // Empty list = auto-detect any Wallet Standard wallet (Phantom, Solflare, Backpack...).
  const wallets = useMemo(() => [], []);

  return (
    <ConnectionProvider endpoint={ENDPOINT}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}

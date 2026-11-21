"use client";

import dynamic from "next/dynamic";

// Loaded client-only so the button doesn't cause a hydration mismatch.
const WalletMultiButton = dynamic(
  () =>
    import("@solana/wallet-adapter-react-ui").then((m) => m.WalletMultiButton),
  { ssr: false },
);

export function Header() {
  return (
    <header className="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-zinc-950/80 px-6 py-4 backdrop-blur">
      <div className="flex items-center gap-2 text-xl font-bold tracking-tight">
        <span aria-hidden>👋</span>
        <span>Frens</span>
      </div>
      <WalletMultiButton />
    </header>
  );
}

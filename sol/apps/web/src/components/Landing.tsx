"use client";
import { GlyphField } from "@/components/GlyphField";
import { FrensConnectButton, FrensDashboard, FrensWalletProviders, useFrensConnected } from "@/components/FrensWallet";

/**
 * Home: the "solfrends" wordmark, centred over the midnight-purple field of arrows (components/GlyphField.tsx;
 * the hero layout is adapted from the MIT "Onward Summit Template", see THIRD_PARTY_NOTICES.md).
 * Connect wallet sits top right; once connected the friends dashboard appears under a smaller wordmark.
 *
 * `split`: an app page is open in the right-hand pane (components/SplitFrame.tsx). On desktop the landing narrows to
 * the left column; below lg it hides, because the app takes the whole screen.
 */
export function Landing({ split = false }: { split?: boolean }) {
  return (
    <FrensWalletProviders>
      <LandingInner split={split} />
    </FrensWalletProviders>
  );
}

function LandingInner({ split }: { split: boolean }) {
  const connected = useFrensConnected() && !split;
  return (
    <div className={`landing-shell fixed inset-y-0 left-0 z-0 overflow-hidden ${split ? "right-0 max-lg:hidden lg:right-[var(--app-w)]" : "right-0"}`}
      data-split={split ? "" : undefined}>
      <section aria-label="SolFrends" className={`relative isolate flex h-full flex-col items-center px-4 text-white ${connected ? "justify-start gap-8 overflow-y-auto pt-20 pb-10" : "justify-center"}`}>
        <div className="landing-bg absolute inset-0 -z-20" aria-hidden="true" />
        <GlyphField />
        {!split && <FrensConnectButton />}
        <h1 className={`landing-title ${split ? "landing-title--split" : ""} ${connected ? "landing-title--connected" : ""}`} aria-label="SolFrends">
          <span className="landing-sol">sol</span><span className="landing-send">frends</span>
        </h1>
        {connected && <FrensDashboard />}
      </section>
    </div>
  );
}

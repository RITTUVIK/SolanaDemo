"use client";
// Connect-wallet + friends dashboard shown over the landing hero.
// Uses the standard Solana wallet adapter (Phantom, Solflare, Backpack…), devnet, separate from the Privy login.
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import dynamic from "next/dynamic";
import { ConnectionProvider, WalletProvider, useConnection, useWallet } from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import { PUBLIC_DEVNET_HTTP } from "@/client/config";
import "@solana/wallet-adapter-react-ui/styles.css";

const WalletMultiButton = dynamic(
  () => import("@solana/wallet-adapter-react-ui").then((m) => m.WalletMultiButton),
  { ssr: false },
);

export function FrensWalletProviders({ children }: { children: ReactNode }) {
  const wallets = useMemo(() => [], []); // auto-detect Wallet Standard wallets
  return (
    <ConnectionProvider endpoint={PUBLIC_DEVNET_HTTP}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}

export function FrensConnectButton() {
  return (
    <div className="frens-connect absolute right-5 top-5 z-20">
      <WalletMultiButton />
    </div>
  );
}

type Friend = { name: string; address: string };
const STORAGE_KEY = "solfrends:friends";
const short = (a: string) => `${a.slice(0, 4)}…${a.slice(-4)}`;
const validAddress = (a: string) => {
  try { new PublicKey(a); return true; } catch { return false; }
};

/** Renders nothing until a wallet is connected; then the two-panel dashboard. */
export function FrensDashboard() {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  const [balance, setBalance] = useState<number | null>(null);
  const [friends, setFriends] = useState<Friend[]>([]);

  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newAddr, setNewAddr] = useState("");
  const [formError, setFormError] = useState("");

  const [sending, setSending] = useState(false);
  const [to, setTo] = useState<Friend | null>(null);
  const [amount, setAmount] = useState("");
  const [status, setStatus] = useState<{ kind: "idle" | "pending" | "ok" | "err"; text?: string }>({ kind: "idle" });

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setFriends(JSON.parse(raw));
    } catch {}
  }, []);

  const saveFriends = (list: Friend[]) => {
    setFriends(list);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  };

  const refreshBalance = useCallback(async () => {
    if (!publicKey) return setBalance(null);
    try { setBalance((await connection.getBalance(publicKey)) / LAMPORTS_PER_SOL); } catch {}
  }, [connection, publicKey]);
  useEffect(() => { refreshBalance(); }, [refreshBalance]);

  if (!publicKey) return null;

  const addFriend = () => {
    const name = newName.trim();
    const address = newAddr.trim();
    if (!name) return setFormError("Give your fren a name");
    if (!validAddress(address)) return setFormError("That address isn't valid");
    saveFriends([...friends, { name, address }]);
    setNewName(""); setNewAddr(""); setFormError(""); setAdding(false);
  };

  const send = async () => {
    if (!to) return;
    const sol = parseFloat(amount);
    if (!(sol > 0)) return setStatus({ kind: "err", text: "Enter an amount" });
    try {
      setStatus({ kind: "pending" });
      const tx = new Transaction().add(SystemProgram.transfer({
        fromPubkey: publicKey,
        toPubkey: new PublicKey(to.address),
        lamports: Math.round(sol * LAMPORTS_PER_SOL),
      }));
      const sig = await sendTransaction(tx, connection);
      const latest = await connection.getLatestBlockhash();
      await connection.confirmTransaction({ signature: sig, ...latest }, "confirmed");
      setStatus({ kind: "ok", text: sig });
      setAmount("");
      refreshBalance();
    } catch (e) {
      setStatus({ kind: "err", text: e instanceof Error ? e.message : "Send failed" });
    }
  };

  const card = "rounded-3xl border border-white/15 bg-black/35 p-6 text-white shadow-2xl backdrop-blur-xl";
  const input = "w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2.5 text-sm text-white placeholder:text-white/40 outline-none focus:border-[#14f195]";
  const cta = "landing-cta w-full disabled:opacity-50";

  return (
    <div className="relative z-10 mx-auto grid w-full max-w-5xl gap-6 md:grid-cols-2">
      {/* LEFT: my wallet + send */}
      <section className={card}>
        <h2 className="text-sm font-medium text-white/60">My wallet</h2>
        <p className="mt-1 font-mono text-sm text-white/80">{short(publicKey.toBase58())}</p>
        <p className="mt-4 text-5xl font-bold tracking-tight">
          {balance === null ? "…" : balance.toFixed(4)} <span className="text-xl font-normal text-white/60">SOL</span>
        </p>
        <p className="text-xs text-white/40">devnet</p>

        {!sending ? (
          <button className={`${cta} mt-6`} onClick={() => setSending(true)}>Send</button>
        ) : (
          <div className="mt-6 space-y-3">
            <p className="text-sm text-white/60">Send to…</p>
            {friends.length === 0 && <p className="text-sm text-white/40">Add a fren on the right first.</p>}
            <div className="flex flex-wrap gap-2">
              {friends.map((f) => (
                <button key={f.address} onClick={() => setTo(f)}
                  className={`rounded-full border px-4 py-1.5 text-sm transition ${to?.address === f.address ? "border-[#14f195] bg-[#14f195]/20" : "border-white/20 hover:border-white/40"}`}>
                  {f.name}
                </button>
              ))}
            </div>
            {to && (
              <>
                <input className={input} type="number" min="0" step="0.01" placeholder="Amount in SOL"
                  value={amount} onChange={(e) => setAmount(e.target.value)} />
                <button className={cta} disabled={status.kind === "pending"} onClick={send}>
                  {status.kind === "pending" ? "Sending…" : `Send to ${to.name}`}
                </button>
              </>
            )}
            {status.kind === "ok" && (
              <p className="text-sm text-[#14f195]">
                Sent!{" "}
                <a className="underline" target="_blank" rel="noreferrer"
                  href={`https://explorer.solana.com/tx/${status.text}?cluster=devnet`}>View transaction</a>
              </p>
            )}
            {status.kind === "err" && <p className="text-sm text-red-300">{status.text}</p>}
            <button className="text-xs text-white/50 hover:text-white"
              onClick={() => { setSending(false); setTo(null); setStatus({ kind: "idle" }); }}>
              Cancel
            </button>
          </div>
        )}
      </section>

      {/* RIGHT: frens */}
      <section className={card}>
        <h2 className="text-sm font-medium text-white/60">Frens</h2>
        <ul className="mt-3 divide-y divide-white/10">
          {friends.map((f) => (
            <li key={f.address} className="flex items-center justify-between py-3">
              <div>
                <p className="font-semibold">{f.name}</p>
                <p className="font-mono text-xs text-white/50">{short(f.address)}</p>
              </div>
              <button className="text-xs text-white/40 hover:text-red-300"
                onClick={() => saveFriends(friends.filter((x) => x.address !== f.address))}>
                Remove
              </button>
            </li>
          ))}
          {friends.length === 0 && <li className="py-3 text-sm text-white/40">No frens yet.</li>}
        </ul>

        {!adding ? (
          <button className="mt-4 w-full rounded-full border border-dashed border-white/30 py-2.5 text-sm hover:border-white/60"
            onClick={() => setAdding(true)}>
            + Add wallet
          </button>
        ) : (
          <div className="mt-4 space-y-3">
            <input className={input} placeholder="Name (e.g. Alex)" value={newName} onChange={(e) => setNewName(e.target.value)} />
            <input className={`${input} font-mono`} placeholder="Deposit address" value={newAddr} onChange={(e) => setNewAddr(e.target.value)} />
            {formError && <p className="text-sm text-red-300">{formError}</p>}
            <div className="flex items-center gap-3">
              <button className="landing-cta" onClick={addFriend}>Save</button>
              <button className="text-sm text-white/50 hover:text-white" onClick={() => { setAdding(false); setFormError(""); }}>Cancel</button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

/** True once a wallet is connected (used to shrink the hero title). */
export function useFrensConnected() {
  return !!useWallet().publicKey;
}

"use client";

import { useCallback, useEffect, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import {
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";

type Friend = { name: string; address: string };

const STORAGE_KEY = "frens:friends";

function short(addr: string) {
  return `${addr.slice(0, 4)}…${addr.slice(-4)}`;
}

function isValidAddress(addr: string) {
  try {
    new PublicKey(addr);
    return true;
  } catch {
    return false;
  }
}

export function Dashboard() {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();

  const [balance, setBalance] = useState<number | null>(null);
  const [friends, setFriends] = useState<Friend[]>([]);

  // Add-friend form
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newAddr, setNewAddr] = useState("");
  const [formError, setFormError] = useState("");

  // Send flow
  const [sending, setSending] = useState(false);
  const [to, setTo] = useState<Friend | null>(null);
  const [amount, setAmount] = useState("");
  const [status, setStatus] = useState<
    | { kind: "idle" }
    | { kind: "pending" }
    | { kind: "ok"; sig: string }
    | { kind: "err"; msg: string }
  >({ kind: "idle" });

  // Load friends from this browser
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
    const lamports = await connection.getBalance(publicKey);
    setBalance(lamports / LAMPORTS_PER_SOL);
  }, [connection, publicKey]);

  useEffect(() => {
    refreshBalance();
  }, [refreshBalance]);

  const addFriend = () => {
    const name = newName.trim();
    const address = newAddr.trim();
    if (!name) return setFormError("Give your fren a name");
    if (!isValidAddress(address)) return setFormError("That address isn't valid");
    saveFriends([...friends, { name, address }]);
    setNewName("");
    setNewAddr("");
    setFormError("");
    setAdding(false);
  };

  const removeFriend = (address: string) =>
    saveFriends(friends.filter((f) => f.address !== address));

  const send = async () => {
    if (!publicKey || !to) return;
    const sol = parseFloat(amount);
    if (!(sol > 0)) return setStatus({ kind: "err", msg: "Enter an amount" });
    try {
      setStatus({ kind: "pending" });
      const tx = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: new PublicKey(to.address),
          lamports: Math.round(sol * LAMPORTS_PER_SOL),
        }),
      );
      const sig = await sendTransaction(tx, connection);
      const latest = await connection.getLatestBlockhash();
      await connection.confirmTransaction({ signature: sig, ...latest }, "confirmed");
      setStatus({ kind: "ok", sig });
      setAmount("");
      refreshBalance();
    } catch (e) {
      setStatus({ kind: "err", msg: e instanceof Error ? e.message : "Send failed" });
    }
  };

  if (!publicKey) {
    return (
      <section className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Send crypto to frens, by name.
        </h1>
        <p className="max-w-md text-zinc-400">
          Connect your wallet (top right) to get started.
        </p>
      </section>
    );
  }

  const card = "rounded-2xl border border-white/10 bg-zinc-900 p-6";
  const input =
    "w-full rounded-lg border border-white/10 bg-zinc-950 px-3 py-2 text-sm outline-none focus:border-purple-500";
  const btn =
    "rounded-full bg-purple-600 px-5 py-2 text-sm font-semibold hover:bg-purple-500 disabled:opacity-50";

  return (
    <div className="mx-auto grid w-full max-w-5xl gap-6 p-6 md:grid-cols-2">
      {/* LEFT: my wallet + send */}
      <section className={card}>
        <h2 className="text-sm font-medium text-zinc-400">My wallet</h2>
        <p className="mt-1 font-mono text-sm">{short(publicKey.toBase58())}</p>
        <p className="mt-4 text-4xl font-bold">
          {balance === null ? "…" : balance.toFixed(4)}{" "}
          <span className="text-lg text-zinc-400">SOL</span>
        </p>
        <p className="text-xs text-zinc-500">devnet</p>

        {!sending ? (
          <button className={`${btn} mt-6 w-full`} onClick={() => setSending(true)}>
            Send
          </button>
        ) : (
          <div className="mt-6 space-y-3">
            <p className="text-sm text-zinc-400">Send to…</p>
            {friends.length === 0 && (
              <p className="text-sm text-zinc-500">Add a fren on the right first.</p>
            )}
            <div className="flex flex-wrap gap-2">
              {friends.map((f) => (
                <button
                  key={f.address}
                  onClick={() => setTo(f)}
                  className={`rounded-full border px-4 py-1.5 text-sm ${
                    to?.address === f.address
                      ? "border-purple-500 bg-purple-500/20"
                      : "border-white/10 hover:border-white/30"
                  }`}
                >
                  {f.name}
                </button>
              ))}
            </div>
            {to && (
              <>
                <input
                  className={input}
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Amount in SOL"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
                <button
                  className={`${btn} w-full`}
                  disabled={status.kind === "pending"}
                  onClick={send}
                >
                  {status.kind === "pending" ? "Sending…" : `Send to ${to.name}`}
                </button>
              </>
            )}
            {status.kind === "ok" && (
              <p className="text-sm text-green-400">
                Sent!{" "}
                <a
                  className="underline"
                  target="_blank"
                  rel="noreferrer"
                  href={`https://explorer.solana.com/tx/${status.sig}?cluster=devnet`}
                >
                  View transaction
                </a>
              </p>
            )}
            {status.kind === "err" && (
              <p className="text-sm text-red-400">{status.msg}</p>
            )}
            <button
              className="text-xs text-zinc-500 hover:text-zinc-300"
              onClick={() => {
                setSending(false);
                setTo(null);
                setStatus({ kind: "idle" });
              }}
            >
              Cancel
            </button>
          </div>
        )}
      </section>

      {/* RIGHT: friends */}
      <section className={card}>
        <h2 className="text-sm font-medium text-zinc-400">Frens</h2>
        <ul className="mt-3 divide-y divide-white/5">
          {friends.map((f) => (
            <li key={f.address} className="flex items-center justify-between py-3">
              <div>
                <p className="font-semibold">{f.name}</p>
                <p className="font-mono text-xs text-zinc-500">{short(f.address)}</p>
              </div>
              <button
                className="text-xs text-zinc-500 hover:text-red-400"
                onClick={() => removeFriend(f.address)}
              >
                Remove
              </button>
            </li>
          ))}
          {friends.length === 0 && (
            <li className="py-3 text-sm text-zinc-500">No frens yet.</li>
          )}
        </ul>

        {!adding ? (
          <button
            className="mt-4 w-full rounded-full border border-dashed border-white/20 py-2 text-sm hover:border-white/40"
            onClick={() => setAdding(true)}
          >
            + Add wallet
          </button>
        ) : (
          <div className="mt-4 space-y-3">
            <input
              className={input}
              placeholder="Name (e.g. Alex)"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
            <input
              className={`${input} font-mono`}
              placeholder="Deposit address"
              value={newAddr}
              onChange={(e) => setNewAddr(e.target.value)}
            />
            {formError && <p className="text-sm text-red-400">{formError}</p>}
            <div className="flex gap-2">
              <button className={btn} onClick={addFriend}>
                Save
              </button>
              <button
                className="text-sm text-zinc-500 hover:text-zinc-300"
                onClick={() => {
                  setAdding(false);
                  setFormError("");
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

# solfrends

Send SOL to your friends by name, not by long wallet addresses.

## What it does
- **Connect wallet** (top right): Phantom, Solflare, Backpack and other Solana wallets.
- **My wallet** (left): your address and SOL balance. Hit **Send**, pick a friend, type an amount, confirm.
- **Frens** (right): your saved friends. **+ Add wallet** → give it a name and paste their deposit address → Save.
- Every send gives you a link to the transaction on Solana Explorer.

Runs on **devnet** (test money). Get free test SOL at https://faucet.solana.com.

## Run it
```bash
cd sol
pnpm install
pnpm dev
```
Open http://localhost:3000.

## Built with
Next.js, Tailwind, and the Solana wallet adapter. Friends are saved in your browser (localStorage).

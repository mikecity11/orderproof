# OrderProof
Electronics purchase terms and evidence-based dispute assessments. No escrow, payments, or private-key storage.

## Run/build
`npm ci` then `npx esbuild app.js --bundle --format=esm --outfile=dist/app.js`. Serve `dist/` over HTTPS or localhost.

## Historical initial status
Local browser demo implemented. Injected-wallet connection and StudioNet SDK adapter implemented but not live tested. Python contract source syntax checked only, not GenVM validated or deployed. No claim of live consensus. Demo assessment always returns insufficient evidence; never impersonates AI consensus.

## Deployment
Download `dist/orderproof.py`, deploy through GenLayer Studio with no constructor args or use Network & setup > Deploy contract with wallet. Use a funded StudioNet test wallet. Verify the resulting address and enter it in settings. Select StudioNet mode, connect wallet, refresh. Buyer and seller use separate wallets and same contract. Contract indexes records from 1. Do not use demo IDs onchain.

## Evidence model
Statements plus optional SHA-256 file hashes. Raw attachments remain on the user's device. Hashes attest integrity only: neither the UI nor contract sees image contents. Validator prompt must not treat claims as verified observations. Onchain agreement terms and statements are public. Avoid sensitive personal details.

## Required live validation before release
Deploy contract, verify schema, create with wallet A, accept wallet B, reject outsider mutations, confirm delivery as buyer, submit statements from both sides, open dispute, request assessment, verify decision/finality and rejection behavior. Test all three outcome classes with verifiable evidence. Validate RPC/SDK version and receipt fields against active StudioNet network. Wallet refusal and network failures must leave state unchanged. Current integration waits for a receipt then rereads storage; receipt alone is not a claim of final consensus. Index-based loading is bounded at 1000 records.

Network migration: stable StudioNet preset, chain ID 61999, RPC https://studio.genlayer.com/api. Contract address storage is isolated under op-contract-studionet; old Bradbury configuration is preserved but never reused. Fund StudioNet separately using the Studio faucet. No StudioNet deployment has been verified.

## StudioNet deployment — 21 October 2026
Contract: 0x27283aB5Dd183985d57AFa67Ee4fE54387404853
Transaction: 0x76d1b92658a53eb69477a3f149527b44acaf386b68d07f456f4197d181e95407
Receipt: ACCEPTED, MAJORITY_AGREE, constructor SUCCESS. Read get_count returned 0. Agreement writes and AI assessment not yet live tested. Deployment used a separate faucet-funded development account. No user wallet funds used.

## GitHub development — 21 October 2026
Canonical user repository: https://github.com/mikecity11/orderproof .
Source imported from the existing Site; generated `dist/app.js` is rebuilt with `npm ci && npm run build`.
Run `npm test` for deterministic lifecycle and authorization tests. These use a mocked GenLayer runtime and do not prove network consensus.

### Evidence flow improvements (not deployed)
- Assessment requires an evidence statement from both parties. There is no response timeout yet; a nonresponsive party blocks assessment.
- An insufficient-evidence case can be reopened by adding evidence, preserving previous assessments in `assessment_history`.
- Optional file digests must be SHA-256 hexadecimal strings; files themselves are not uploaded or inspected.
- GitHub Actions runs tests and the frontend build.

The deployed StudioNet address above still runs the earlier contract. The revised contract needs a fresh deployment and live lifecycle verification before the interface can rely on these contract guarantees. Do not treat this GitHub update as a redeployment. Existing onchain records are not migrated automatically.

## Verified StudioNet revision — 22 October 2026
Current contract: `0xf09c670448A5052B613554C27e201c7827767286`.
Deployment transaction: `0x7a1e7cfd31756398cec6195d79eba8926edab553fc1169bd7adcc5f8791b48bf`.
The earlier deployment above is historical. The interface defaults to the current address under a separate v2 settings key. Connecting a wallet switches into the StudioNet workspace and loads records.

Live SDK checks passed: agreement creation, seller acceptance, buyer-only delivery, outsider rejection, both-party evidence requirement, a real insufficient-evidence assessment, and reopening with assessment history. Public transaction evidence is in `deployments/studionet-qa.json`. The test used dedicated faucet-funded development wallets; no user funds were used. Keys are stored only in a temporary session file, never in this repository.

The receipt checker distinguishes leader execution from validator-side idle results and rejects accepted receipts containing a failed leader execution. Acceptance and finalization remain separate states.

Still pending: browser wallet signing end-to-end; conclusive MATCHES / DOES_NOT_MATCH live cases; verifiable attachment content ingestion; response deadlines for nonresponsive parties. The present evidence model is written allegations and optional hashes only.

`npm test` runs local Python and JavaScript tests. `npm run build` bundles the frontend and copies the contract. `scripts/live-check.mjs` creates test wallets for StudioNet only; `scripts/test-studionet.mjs` expects a freshly deployed empty contract and records live results. Never point these scripts at a production network.

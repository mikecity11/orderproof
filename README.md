# OrderProof
Electronics purchase terms and evidence-based dispute assessments. No escrow, payments, or private-key storage.

## Run/build
`npm ci` then `npx esbuild app.js --bundle --format=esm --outfile=dist/app.js`. Serve `dist/` over HTTPS or localhost.

## Current status
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

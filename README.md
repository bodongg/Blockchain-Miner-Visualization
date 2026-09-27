# Mini Blockchain Miner

Mini Blockchain Miner is a browser-only React project that demonstrates how blocks are linked, how proof of work finds a valid hash, and why changing old data breaks trust in everything that follows it.

## What is a blockchain?

A blockchain is an ordered list of records called blocks. Each block in this project stores:

- `index` — the block's position in the chain
- `data` — the text record stored in the block
- `previousHash` — the hash recorded by the block before it
- `nonce` — the number changed during mining
- `hash` — the SHA-256 fingerprint of the other stored fields

The project uses CryptoJS to calculate this fingerprint:

```text
SHA256(index + data + previousHash + nonce)
```

A tiny change to the data creates a very different hash. If you edit a mined block, its stored hash no longer matches its recalculated hash. That block and every later block are marked broken because the history they rely on can no longer be trusted. This demonstrates tamper resistance: changing history is easy to detect.

Block `#0` is the fixed genesis block. It starts the chain and cannot be edited.

## What is proof-of-work mining?

Mining searches for a nonce that makes a block's hash begin with a required number of zeroes. The app tries nonce `0`, then `1`, then `2`, and continues until it finds a matching hash.

Difficulty controls how many leading zeroes are required. Each extra zero makes a successful hash much less likely, so higher difficulty usually needs many more attempts and more time. Difficulty `1` is useful for quick demonstrations; difficulty `5` or `6` may take substantially longer depending on the device.

The miner processes small batches with `requestAnimationFrame`. It gives control back to the browser after every batch, allowing React to update the nonce, hash attempt, elapsed time, pickaxe animation, and crack stage without freezing the page.

## Game features

- **Mining rewards:** each successful block earns diamonds based on difficulty.
- **Tool upgrades:** diamonds buy a faster pickaxe, larger mining batches, and an Auto Miner. Typing only prepares a block; mining begins after clicking **Start mining** or **Run Auto Miner**.
- **Timed challenges:** mine before the timer or energy runs out to earn a bonus.
- **Chain repair:** after tampering, re-mine the first broken block and every block after it in order.
- **Attacker mode:** a simulated attacker randomly changes one mined block. That block and every later block become invalid. Repair within 30 seconds for a reward; after the timer expires, repair costs 5 diamonds per broken block, up to the diamonds available.
- **Saved world:** progress is kept in browser storage. The New Game control resets the world after confirmation.

## Run the project

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Open the local address shown in the terminal, usually `http://localhost:5173`.

On a Windows PowerShell installation that blocks `npm.ps1`, use the command wrapper instead:

```powershell
npm.cmd install
npm.cmd run dev
```

Run the automated checks:

```bash
npm run test
npm run lint
npm run build
```

## Project structure

```text
src/
├── main.jsx                 React entry point
├── App.jsx                  Chain state and mining lifecycle
├── Block.jsx                Block icon and selected-block editor
├── MiningPanel.jsx          Data input, difficulty, controls, and statistics
├── PickaxeAnimation.jsx     Pickaxe, ore, cracks, and break scene
├── ChainRow.jsx             Chain status and inventory row
├── GameDashboard.jsx        Diamonds, chain state, streak, and current mode
├── MissionPanel.jsx         Timed challenge, attacker, and repair actions
├── RepairProgress.jsx       Sequential chain-repair progress
├── UpgradeShop.jsx          Pickaxe, batch, and auto-miner upgrades
├── App.css                  Component layout and animations
├── index.css                Global tokens and browser styles
├── game/
│   ├── attacker.js          Attack target selection and tampering
│   ├── gameConfig.js        Rewards, challenges, prices, and upgrade effects
│   ├── gameState.js         New-world defaults and browser persistence
│   └── repairChain.js       Transactional sequential re-mining
└── utils/
    ├── hash.js              CryptoJS SHA-256 helper
    ├── mineBlock.js         Batched proof-of-work loop
    └── validateChain.js     Hash/link checks and downstream invalidation
```

## Suggested two-person split

**Blockchain/mining teammate:** own `src/utils/` and its tests. Be ready to explain how hashes are created, why the nonce changes, how difficulty affects probability, and how validation carries failure forward.

**React/visual teammate:** own the components and CSS. Be ready to explain how `App.jsx` holds the chain and game state, how mining progress reaches the interface, how block editing triggers revalidation, and how animation states reflect the computation.

The boundary between the two sides is small: components call the utility functions and render their returned block or validation results. This lets both teammates work independently while keeping the full demonstration easy to follow.

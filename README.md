# 🏙️ BlockShare Luxury

Welcome to **BlockShare Luxury**—the ultimate decentralized Real Estate and property tokenization platform. BlockShare redefines property investment by allowing seamless micro-ownership, governance, and automated rent distribution using ERC1155 tokens on the Ethereum blockchain. 

## 🌟 Key Features

* **Real Estate Tokenization:** Convert physical high-value buildings into dynamically traded tokenized shares (ERC1155). 
* **Built-in AMM DEX:** Buy or sell real estate tokens instantly via the smart contract's automated market maker.
* **Property Governance:** Once you hold building tokens, you become part of an autonomous DAO. Propose, vote, and execute operational changes for strict property management.
* **Automated Rental Yields:** As tenants actively pay their monthly rent, the protocol autonomously mathematically distributes passive income directly to thousands of token holders based on exact ownership percentage. 
* **Cinematic Experience:** Envelops the user in a breathtaking cyberpunk neon intro splash screen powered by `framer-motion` for a premium, high-luxury aesthetic.

## 🛠️ Tech Stack

### Frontend Architecture
* **Framework:** React 19 via Vite SSR
* **Routing:** `@tanstack/react-router` (TanStack Router) for type-safe, sub-second page transitions.
* **Styling:** Tailwind CSS V4 + `clsx` & `tailwind-merge` for rapid, deterministic styles.
* **Animations:** `framer-motion` (Motion) for complex SVG rendering, cinematic zooms, and staggered glitches.
* **Components:** `@radix-ui` unstyled, accessible primitives. 

### Web3 Integration
* **Blockchain Connections:** `wagmi` + `viem` providing rock-solid hooks and RPC node interactions.
* **Wallet Connect:** `@rainbow-me/rainbowkit` for beautiful, standardized wallet modal selection.

## 🚀 Getting Started

### Prerequisites
Make sure you have Node or Bun installed on your machine.

### Installation

1. **Clone the repository:**
   ```bash
   git clone <your-repo-link>
   cd blockshare-luxury
   ```

2. **Install core dependencies:**
   ```bash
   npm install
   # or
   bun install
   ```

3. **Start the local development server:**
   ```bash
   npm run dev
   ```


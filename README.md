# 🏙️ BlockShare — Decentralized Real Estate Marketplace

BlockShare is a **Web3-powered real estate platform** that enables users to invest in **fractional property ownership**, earn rental income, and participate in governance — all fully **on-chain**.

## Demo Link
https://www.loom.com/share/9d3326f17e2442acb4d343f9ac9a9ee9
### Full Working
https://www.loom.com/share/a316b56c270f4239bd184ba40b52b45f
---

## 🚀 Core Idea

Traditional real estate is:

* expensive 💰
* illiquid 🔒
* inaccessible 🌍

**BlockShare solves this by tokenizing properties**, allowing anyone to:

* buy shares (ERC-1155 tokens)
* earn rent proportional to ownership
* trade property tokens
* vote on decisions

---

## 🔑 Key Features

### 🏢 1. Property Tokenization

* Each building is divided into **fractional tokens**
* Built on **ERC-1155 standard**
* Dynamic token supply based on equity

👉 Enables:

* multiple investors per property
* flexible ownership distribution

---

### 📩 2. Decentralized Building Approval System

* Users submit **building requests** (with deposit)
* Platform owner approves/rejects
* Refund mechanism for rejected requests

👉 Makes onboarding **controlled yet decentralized**

---

### 🧱 3. Dynamic Flat & Rent Configuration

* Owners can:

  * add flats by BHK type
  * define number of units
  * set rent per unit

👉 This makes the system:

* flexible for different property types
* adaptable to real-world scenarios

---

### 💸 4. On-Chain Rent Distribution

* Tenants pay rent directly via smart contract
* Rent is automatically distributed to:

  * token holders (proportional share)
  * building owner (remaining amount)

👉 Fully trustless income system

---

### 🔄 5. Built-in AMM (Token Trading)

* Users can:

  * buy property tokens
  * sell tokens back
* Uses **liquidity pool model**:

  * ETH reserves
  * token reserves

👉 Enables:

* instant liquidity
* dynamic token pricing

---

### 🧑‍⚖️ 6. Governance System

* Investors can:

  * create proposals
  * vote using token weight
* Majority voting decides execution

👉 True **decentralized decision-making**

---

### 🔐 7. Security & Protection

* `ReentrancyGuard` → prevents attacks
* controlled ownership logic
* safe ETH transfers using `.call()`

---

## 🌐 Why This is Dynamic

BlockShare is not a static marketplace — it is **fully dynamic**:

### 🔁 Dynamic Ownership

* Ownership changes in real-time via token trading

### 💰 Dynamic Pricing

* Token price changes based on:

  * ETH reserves
  * demand (AMM logic)

### 🏢 Dynamic Property Structure

* Different buildings → different:

  * flat types
  * rent values
  * configurations

### 🗳️ Dynamic Governance

* Decisions are not fixed
* Investors control outcomes through voting

### 📊 Dynamic Income Distribution

* Rent is calculated and distributed **on-chain in real-time**

---

## ⚙️ Smart Contract Architecture

### 📦 Contracts Overview

#### 1. `BlockShare.sol`

* Core contract
* Manages:

  * buildings
  * tokens
  * liquidity pool
  * shareholders

---

#### 2. `Rent.sol`

* Handles:

  * rent setup
  * rent payments
  * automated distribution

---

#### 3. `ProposalManager.sol`

* Governance layer
* Handles:

  * proposal creation
  * voting
  * execution

---



## 🛠️ Tech Stack

* **Framework:** React 19 via Vite SSR
* **Routing:** `@tanstack/react-router` (TanStack Router) for type-safe, sub-second page transitions.
* **Styling:** Tailwind CSS V4 + `clsx` & `tailwind-merge` for rapid, deterministic styles.
* **Animations:** `framer-motion` (Motion) for complex SVG rendering, cinematic zooms, and staggered glitches.
* **Components:** `@radix-ui` unstyled, accessible primitives. 
* **Solidity (0.8.x)**
* OpenZeppelin Contracts
* ERC-1155 Token Standard
* Web3 Frontend (React + Wagmi + Viem)
* MetaMask Wallet Integration

---

## ⚠️ Challenges Solved

* Trustless rent distribution
* Fractional ownership without intermediaries
* Liquidity for real estate assets
* On-chain governance

---

## 🔮 Future Improvements

* AI-based property valuation
* Multi-chain deployment
* NFT-based property metadata
* Advanced analytics dashboard

---

## 🧠 Vision

To make **real estate investment accessible, liquid, and decentralized**, enabling anyone to invest in global properties with just a wallet.

---



import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { sepolia } from "wagmi/chains";

export const wagmiConfig = getDefaultConfig({
  appName: "BlockShare",
  // Public WalletConnect demo project ID — replace with your own for production.
  projectId: "3a8170812b534d0ff9d794f19a901d64",
  chains: [sepolia],
  ssr: false,
});

/**
 * 🚧 PLACEHOLDER ADDRESSES — replace after deployment.
 * The same address is used for BlockShare / Rent / ProposalManager because
 * Rent and ProposalManager both inherit from BlockShare in your contracts,
 * so once deployed as a single contract instance they share storage. If you
 * deploy them separately, override these with the individual addresses.
 */
export const CONTRACTS = {
  blockShare: "0x0000000000000000000000000000000000000000" as `0x${string}`,
  rent: "0x0000000000000000000000000000000000000000" as `0x${string}`,
  proposals: "0x0000000000000000000000000000000000000000" as `0x${string}`,
};

/** Fee required to create a new building (from AddBuilding). */
export const ADD_BUILDING_FEE_ETH = "1";

// ─────────────────────────────────────────────────────────────────────────────
// BlockShare ABI
// ─────────────────────────────────────────────────────────────────────────────
export const BLOCKSHARE_ABI = [
  {
    type: "function",
    name: "BuildingCount",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "buildings",
    stateMutability: "view",
    inputs: [{ name: "", type: "uint256" }],
    outputs: [
      { name: "id", type: "uint256" },
      { name: "owner", type: "address" },
      { name: "name", type: "string" },
      { name: "description", type: "string" },
      { name: "price", type: "uint256" },
      { name: "tokenEquity", type: "uint256" },
      { name: "tokenPrice", type: "uint256" },
      { name: "totTokens", type: "uint256" },
      { name: "tokensSold", type: "uint256" },
    ],
  },
  {
    type: "function",
    name: "AddBuilding",
    stateMutability: "payable",
    inputs: [
      { name: "_name", type: "string" },
      { name: "_description", type: "string" },
      { name: "_price", type: "uint256" },
      { name: "_tokenEquity", type: "uint256" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "addFlat",
    stateMutability: "nonpayable",
    inputs: [
      { name: "_buildingId", type: "uint256" },
      { name: "numBHK", type: "uint256" },
      { name: "numFlats", type: "uint256" },
      { name: "rentPerFlat", type: "uint256" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "flats",
    stateMutability: "view",
    inputs: [
      { name: "", type: "uint256" },
      { name: "", type: "uint256" },
    ],
    outputs: [
      { name: "BuildingId", type: "uint256" },
      { name: "numBHK", type: "uint256" },
      { name: "numFlats", type: "uint256" },
      { name: "rentPerFlat", type: "uint256" },
    ],
  },
  {
    type: "function",
    name: "mint",
    stateMutability: "payable",
    inputs: [
      { name: "id", type: "uint256" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "balanceOf",
    stateMutability: "view",
    inputs: [
      { name: "account", type: "address" },
      { name: "id", type: "uint256" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "setBuildingPrice",
    stateMutability: "nonpayable",
    inputs: [
      { name: "id", type: "uint256" },
      { name: "price", type: "uint256" },
    ],
    outputs: [],
  },
  {
    type: "event",
    name: "BuildingAdded",
    inputs: [
      { indexed: false, name: "buildingId", type: "uint256" },
      { indexed: false, name: "owner", type: "address" },
      { indexed: false, name: "name", type: "string" },
    ],
  },
] as const;

// ─────────────────────────────────────────────────────────────────────────────
// Rent ABI (inherits from BlockShare → above ABI also valid against same addr)
// ─────────────────────────────────────────────────────────────────────────────
export const RENT_ABI = [
  {
    type: "function",
    name: "setRent",
    stateMutability: "nonpayable",
    inputs: [
      { name: "buildingId", type: "uint256" },
      { name: "numBHK", type: "uint256" },
      { name: "monthlyRent", type: "uint256" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "updateRent",
    stateMutability: "nonpayable",
    inputs: [
      { name: "buildingId", type: "uint256" },
      { name: "numBHK", type: "uint256" },
      { name: "newMonthlyRent", type: "uint256" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "toggleRentActive",
    stateMutability: "nonpayable",
    inputs: [
      { name: "buildingId", type: "uint256" },
      { name: "numBHK", type: "uint256" },
      { name: "active", type: "bool" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "payMonthlyRent",
    stateMutability: "payable",
    inputs: [
      { name: "buildingId", type: "uint256" },
      { name: "numBHK", type: "uint256" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "getRentalInfo",
    stateMutability: "view",
    inputs: [
      { name: "buildingId", type: "uint256" },
      { name: "numBHK", type: "uint256" },
    ],
    outputs: [
      { name: "monthlyRent", type: "uint256" },
      { name: "lastPaid", type: "uint256" },
      { name: "active", type: "bool" },
    ],
  },
] as const;

// ─────────────────────────────────────────────────────────────────────────────
// ProposalManager ABI
// ─────────────────────────────────────────────────────────────────────────────
export const PROPOSALS_ABI = [
  {
    type: "function",
    name: "CreateProposal",
    stateMutability: "nonpayable",
    inputs: [
      { name: "description", type: "string" },
      { name: "BuildingId", type: "uint256" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "Vote",
    stateMutability: "nonpayable",
    inputs: [
      { name: "proposalId", type: "uint256" },
      { name: "BuildingId", type: "uint256" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "Execution",
    stateMutability: "nonpayable",
    inputs: [
      { name: "proposalId", type: "uint256" },
      { name: "BuildingId", type: "uint256" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "Proposals",
    stateMutability: "view",
    inputs: [
      { name: "proposalId", type: "uint256" },
      { name: "BuildingId", type: "uint256" },
    ],
    outputs: [
      { name: "description", type: "string" },
      { name: "votes", type: "uint256" },
      { name: "deadline", type: "uint256" },
    ],
  },
  {
    type: "function",
    name: "proposalsForBuilding",
    stateMutability: "view",
    inputs: [
      { name: "", type: "uint256" },
      { name: "", type: "uint256" },
    ],
    outputs: [
      { name: "description", type: "string" },
      { name: "votes", type: "uint256" },
      { name: "deadline", type: "uint256" },
      { name: "executed", type: "bool" },
    ],
  },
  {
    type: "function",
    name: "hasVoted",
    stateMutability: "view",
    inputs: [
      { name: "", type: "address" },
      { name: "", type: "uint256" },
      { name: "", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    type: "function",
    name: "getVotes",
    stateMutability: "view",
    inputs: [
      { name: "proposalId", type: "uint256" },
      { name: "BuildingId", type: "uint256" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;

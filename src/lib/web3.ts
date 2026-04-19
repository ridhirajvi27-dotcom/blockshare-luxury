import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { sepolia } from "wagmi/chains";

export const wagmiConfig = getDefaultConfig({
  appName: "BlockShare",
  projectId: "3a8170812b534d0ff9d794f19a901d64",
  chains: [sepolia],
  ssr: false,
});

/**
 * 🚧 PLACEHOLDER ADDRESSES — replace after deployment.
 * BlockShare and ProposalManager share storage (ProposalManager inherits BlockShare),
 * so deploy ProposalManager and use its address for both.
 * Rent is a separate contract that takes BlockShare's address in its constructor.
 */
export const CONTRACTS = {
  blockShare: "0x0000000000000000000000000000000000000000" as `0x${string}`,
  rent: "0x0000000000000000000000000000000000000000" as `0x${string}`,
  proposals: "0x0000000000000000000000000000000000000000" as `0x${string}`,
};

/** Fee required to submit a building request. */
export const ADD_BUILDING_FEE_ETH = "1";

// ─────────────────────────────────────────────────────────────────────────────
// BlockShare ABI (request/approve flow + AMM swap)
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
    name: "requestCount",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "owner",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
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
      { name: "ethReserves", type: "uint256" },
      { name: "tokenReserves", type: "uint256" },
    ],
  },
  {
    type: "function",
    name: "requests",
    stateMutability: "view",
    inputs: [{ name: "", type: "uint256" }],
    outputs: [
      { name: "requester", type: "address" },
      { name: "name", type: "string" },
      { name: "description", type: "string" },
      { name: "price", type: "uint256" },
      { name: "tokenEquity", type: "uint256" },
      { name: "valueSent", type: "uint256" },
      { name: "approved", type: "bool" },
      { name: "rejected", type: "bool" },
    ],
  },
  {
    type: "function",
    name: "requestBuilding",
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
    name: "approveBuilding",
    stateMutability: "nonpayable",
    inputs: [{ name: "requestId", type: "uint256" }],
    outputs: [],
  },
  {
    type: "function",
    name: "rejectBuilding",
    stateMutability: "nonpayable",
    inputs: [{ name: "requestId", type: "uint256" }],
    outputs: [],
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
    name: "noOfFlatsByBHK",
    stateMutability: "view",
    inputs: [
      { name: "", type: "uint256" },
      { name: "", type: "uint256" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "seedLiquidity",
    stateMutability: "payable",
    inputs: [{ name: "_id", type: "uint256" }],
    outputs: [],
  },
  {
    type: "function",
    name: "swap",
    stateMutability: "payable",
    inputs: [
      { name: "_id", type: "uint256" },
      { name: "_tokenAmountIn", type: "uint256" },
      { name: "_isBuy", type: "bool" },
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
    type: "function",
    name: "setApprovalForAll",
    stateMutability: "nonpayable",
    inputs: [
      { name: "operator", type: "address" },
      { name: "approved", type: "bool" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "isApprovedForAll",
    stateMutability: "view",
    inputs: [
      { name: "account", type: "address" },
      { name: "operator", type: "address" },
    ],
    outputs: [{ name: "", type: "bool" }],
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
  {
    type: "event",
    name: "BuildingRequested",
    inputs: [
      { indexed: false, name: "requestId", type: "uint256" },
      { indexed: false, name: "requester", type: "address" },
    ],
  },
] as const;

// ─────────────────────────────────────────────────────────────────────────────
// Rent ABI (separate contract — takes BlockShare address in constructor)
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
      { name: "active", type: "bool" },
    ],
  },
  {
    type: "function",
    name: "rentalSettings",
    stateMutability: "view",
    inputs: [
      { name: "", type: "uint256" },
      { name: "", type: "uint256" },
    ],
    outputs: [
      { name: "monthlyRent", type: "uint256" },
      { name: "isActive", type: "bool" },
    ],
  },
  {
    type: "function",
    name: "lastPaidTimestamp",
    stateMutability: "view",
    inputs: [
      { name: "", type: "uint256" },
      { name: "", type: "address" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;

// ─────────────────────────────────────────────────────────────────────────────
// ProposalManager ABI (inherits BlockShare → use proposals address)
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

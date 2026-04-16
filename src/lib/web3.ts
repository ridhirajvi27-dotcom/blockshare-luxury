import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { mainnet, polygon, sepolia, base } from "wagmi/chains";

export const wagmiConfig = getDefaultConfig({
  appName: "BlockShare",
  // Public WalletConnect demo project ID — replace with your own for production.
  projectId: "3a8170812b534d0ff9d794f19a901d64",
  chains: [mainnet, polygon, base, sepolia],
  ssr: false,
});

// Placeholder contract — replace with deployed BlockShare contract
export const BLOCKSHARE_CONTRACT = {
  address: "0x0000000000000000000000000000000000000000" as `0x${string}`,
  abi: [
    {
      name: "mintFractionalTokens",
      type: "function",
      stateMutability: "payable",
      inputs: [
        { name: "buildingId", type: "uint256" },
        { name: "amount", type: "uint256" },
      ],
      outputs: [],
    },
    {
      name: "payRent",
      type: "function",
      stateMutability: "payable",
      inputs: [
        { name: "buildingId", type: "uint256" },
        { name: "flatType", type: "string" },
      ],
      outputs: [],
    },
    {
      name: "vote",
      type: "function",
      stateMutability: "nonpayable",
      inputs: [
        { name: "proposalId", type: "uint256" },
        { name: "support", type: "bool" },
      ],
      outputs: [],
    },
    {
      name: "balanceOf",
      type: "function",
      stateMutability: "view",
      inputs: [
        { name: "owner", type: "address" },
        { name: "buildingId", type: "uint256" },
      ],
      outputs: [{ name: "", type: "uint256" }],
    },
  ] as const,
};

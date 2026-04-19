/**
 * Reads BuildingCount + every building struct from BlockShare.
 * The BuildingInfo struct now has 11 fields (added ethReserves + tokenReserves).
 */
import { useMemo } from "react";
import { useReadContract, useReadContracts } from "wagmi";
import { formatEther } from "viem";
import { BLOCKSHARE_ABI, CONTRACTS } from "@/lib/web3";

export type ChainBuilding = {
  id: number;
  owner: `0x${string}`;
  name: string;
  description: string;
  priceWei: bigint;
  priceEth: string;
  tokenEquity: bigint;
  tokenPriceWei: bigint;
  tokenPriceEth: string;
  totTokens: bigint;
  tokensSold: bigint;
  ethReservesWei: bigint;
  tokenReserves: bigint;
  hasPool: boolean;
  /** AMM spot price (ETH per token) — based on reserves. */
  spotPriceEth: number;
  soldPct: number;
};

export function useBuildings() {
  const { data: countData, refetch: refetchCount } = useReadContract({
    address: CONTRACTS.blockShare,
    abi: BLOCKSHARE_ABI,
    functionName: "BuildingCount",
    query: { refetchInterval: 15_000 },
  });

  const count = countData ? Number(countData) : 0;

  const calls = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        address: CONTRACTS.blockShare,
        abi: BLOCKSHARE_ABI,
        functionName: "buildings" as const,
        args: [BigInt(i + 1)] as const,
      })),
    [count]
  );

  const { data: results, isLoading, refetch } = useReadContracts({
    contracts: calls,
    query: { enabled: count > 0 },
  });

  const buildings = useMemo<ChainBuilding[]>(() => {
    if (!results) return [];
    return results
      .map((r, i) => {
        if (r.status !== "success" || !r.result) return null;
        
        // Struct from BlockShare.sol: 
        // uint256 id; address owner; string description; uint256 price; uint256 totTokens; uint256 ethReserves; uint256 tokenReserves;
        const [
          id,
          owner,
          description,
          price,
          totTokens,
          ethReserves,
          tokenReserves,
        ] = r.result as readonly [
          bigint,
          `0x${string}`,
          string,
          bigint,
          bigint,
          bigint,
          bigint,
        ];
        
        const hasPool = ethReserves > 0n && tokenReserves > 0n;
        const spotPriceEth = hasPool
          ? Number(formatEther(ethReserves)) / Number(tokenReserves)
          : Number(formatEther(price)) / Math.max(1, Number(totTokens));

        const tokenPrice = price / (totTokens > 0n ? totTokens : 1n);

        // Name is removed from struct, infer from description
        const name = description.length > 20 ? description.substring(0, 20) + "..." : description || `Property #${Number(id) || i + 1}`;
        
        // Equity is derived
        const tokenEquity = totTokens > 0n ? 1_000_000n / totTokens : 0n;
        // Tokens sold is extracted from reserves vs total
        const tokensSold = hasPool && totTokens > 0n ? totTokens - tokenReserves : 0n;

        return {
          id: Number(id) || i + 1,
          owner,
          name,
          description,
          priceWei: price,
          priceEth: formatEther(price),
          tokenEquity,
          tokenPriceWei: tokenPrice,
          tokenPriceEth: String(spotPriceEth),
          totTokens,
          tokensSold,
          ethReservesWei: ethReserves,
          tokenReserves,
          hasPool,
          spotPriceEth,
          soldPct:
            totTokens > 0n ? Number((tokensSold * 10000n) / totTokens) / 100 : 0,
        } as ChainBuilding;
      })
      .filter((x): x is ChainBuilding => x !== null);
  }, [results]);

  return {
    buildings,
    count,
    isLoading,
    refetch: () => {
      refetchCount();
      refetch();
    },
  };
}

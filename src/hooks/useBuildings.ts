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
        const [
          id,
          owner,
          name,
          description,
          price,
          tokenEquity,
          tokenPrice,
          totTokens,
          tokensSold,
          ethReserves,
          tokenReserves,
        ] = r.result as readonly [
          bigint,
          `0x${string}`,
          string,
          string,
          bigint,
          bigint,
          bigint,
          bigint,
          bigint,
          bigint,
          bigint,
        ];
        const hasPool = ethReserves > 0n && tokenReserves > 0n;
        const spotPriceEth = hasPool
          ? Number(formatEther(ethReserves)) / Number(tokenReserves)
          : Number(formatEther(tokenPrice));
        return {
          id: Number(id) || i + 1,
          owner,
          name,
          description,
          priceWei: price,
          priceEth: formatEther(price),
          tokenEquity,
          tokenPriceWei: tokenPrice,
          tokenPriceEth: formatEther(tokenPrice),
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

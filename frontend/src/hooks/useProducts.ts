import { useMemo } from "react";
import { useReadContract, useReadContracts } from "wagmi";
import { supplyChainContract } from "../config/contract";

export interface ChainProduct {
  id: bigint;
  name: string;
  batch: string;
  metadataCID: `0x${string}`;
  manufacturer: `0x${string}`;
  currentOwner: `0x${string}`;
  state: number;
  createdAt: bigint;
}

export function useProductCount() {
  return useReadContract({
    ...supplyChainContract,
    functionName: "productCount",
  });
}

export function useAllProducts() {
  const { data: countRaw, isLoading: countLoading } = useProductCount();
  const count = countRaw ? Number(countRaw) : 0;

  const ids = useMemo(() => Array.from({ length: count }, (_, i) => BigInt(i + 1)), [count]);

  const { data, isLoading } = useReadContracts({
    contracts: ids.map((id) => ({
      ...supplyChainContract,
      functionName: "getProduct" as const,
      args: [id],
    })),
    query: { enabled: count > 0 },
  });

  const products: ChainProduct[] = useMemo(() => {
    if (!data) return [];
    return data
      .map((r: { result?: unknown }) => r.result as ChainProduct | undefined)
      .filter((p: ChainProduct | undefined): p is ChainProduct => !!p);
  }, [data]);

  return { products, isLoading: isLoading || countLoading, count };
}

export function useProduct(id: bigint | undefined) {
  return useReadContract({
    ...supplyChainContract,
    functionName: "getProduct",
    args: id !== undefined ? [id] : undefined,
    query: { enabled: id !== undefined },
  });
}

export function useHistory(id: bigint | undefined) {
  return useReadContract({
    ...supplyChainContract,
    functionName: "getHistory",
    args: id !== undefined ? [id] : undefined,
    query: { enabled: id !== undefined },
  });
}

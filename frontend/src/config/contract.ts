import type { Abi } from "viem";
import abi from "../generated/SupplyChain.abi.json";
import { SUPPLY_CHAIN_ADDRESS, SUPPLY_CHAIN_CHAIN_ID } from "../generated/deployment";

export const supplyChainAbi = abi as unknown as Abi;

export const supplyChainContract = {
  address: SUPPLY_CHAIN_ADDRESS as `0x${string}`,
  abi: supplyChainAbi,
  chainId: SUPPLY_CHAIN_CHAIN_ID,
} as const;

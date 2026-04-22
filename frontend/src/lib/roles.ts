import { keccak256, toBytes } from "viem";

/**
 * Role identifiers match the `bytes32` constants in SupplyChain.sol.
 * These are stable — we compute them once from their label strings.
 */
export const ROLE_ID = {
  ADMIN:        "0x0000000000000000000000000000000000000000000000000000000000000000" as `0x${string}`,
  MANUFACTURER: keccak256(toBytes("MANUFACTURER_ROLE")),
  DISTRIBUTOR:  keccak256(toBytes("DISTRIBUTOR_ROLE")),
  RETAILER:     keccak256(toBytes("RETAILER_ROLE")),
} as const;

export type RoleName = "ADMIN" | "MANUFACTURER" | "DISTRIBUTOR" | "RETAILER" | "NONE";

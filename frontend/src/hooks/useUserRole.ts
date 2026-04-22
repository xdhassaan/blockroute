import { useAccount, useReadContracts } from "wagmi";
import { supplyChainContract } from "../config/contract";
import { ROLE_ID, type RoleName } from "../lib/roles";

/**
 * Derive the connected wallet's highest-privilege role from on-chain `hasRole` reads.
 * Order matters — the hierarchy is ADMIN > MANUFACTURER/DISTRIBUTOR/RETAILER.
 */
export function useUserRole(): { role: RoleName; isLoading: boolean } {
  const { address } = useAccount();

  const { data, isLoading } = useReadContracts({
    contracts: address
      ? [
          { ...supplyChainContract, functionName: "hasRole", args: [ROLE_ID.ADMIN,        address] },
          { ...supplyChainContract, functionName: "hasRole", args: [ROLE_ID.MANUFACTURER, address] },
          { ...supplyChainContract, functionName: "hasRole", args: [ROLE_ID.DISTRIBUTOR,  address] },
          { ...supplyChainContract, functionName: "hasRole", args: [ROLE_ID.RETAILER,     address] },
        ]
      : [],
    query: { enabled: !!address },
  });

  if (!address) return { role: "NONE", isLoading: false };
  if (isLoading || !data) return { role: "NONE", isLoading: true };

  const [isAdmin, isMfg, isDist, isRetail] = data.map((r: { result?: unknown }) => r.result as boolean | undefined);
  if (isAdmin)  return { role: "ADMIN",        isLoading: false };
  if (isMfg)    return { role: "MANUFACTURER", isLoading: false };
  if (isDist)   return { role: "DISTRIBUTOR",  isLoading: false };
  if (isRetail) return { role: "RETAILER",     isLoading: false };
  return { role: "NONE", isLoading: false };
}

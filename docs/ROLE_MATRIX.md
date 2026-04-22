# Role × Function Matrix

`✓` = role can call · `—` = role cannot call · `*` = role check enforced on the *recipient* parameter

| Function                | ADMIN | MANUFACTURER | DISTRIBUTOR | RETAILER | Other notes                        |
|-------------------------|:-----:|:------------:|:-----------:|:--------:|------------------------------------|
| `grantRole`             |  ✓    | —            | —           | —        | OZ AccessControl admin             |
| `revokeRole`            |  ✓    | —            | —           | —        | OZ AccessControl admin             |
| `registerProduct`       | —     | ✓            | —           | —        | Caller becomes initial owner       |
| `shipToDistributor`     | —     | ✓            | *           | —        | Recipient must hold DISTRIBUTOR_ROLE |
| `receiveAsDistributor`  | —     | —            | ✓           | —        | Caller must be current owner       |
| `shipToRetailer`        | —     | —            | ✓           | *        | Recipient must hold RETAILER_ROLE  |
| `receiveAsRetailer`     | —     | —            | —           | ✓        | Caller must be current owner       |
| `markSold`              | —     | —            | —           | ✓        | Terminal state                     |
| `getProduct`            |  ✓    | ✓            | ✓           | ✓        | Public view                        |
| `getHistory`            |  ✓    | ✓            | ✓           | ✓        | Public view (append-only array)    |
| `productCount`          |  ✓    | ✓            | ✓           | ✓        | Public view                        |
| `shipNonce`             |  ✓    | ✓            | ✓           | ✓        | Public view (used for signatures)  |
| `receiptDigest`         |  ✓    | ✓            | ✓           | ✓        | Pure helper for off-chain signing  |

## Two-key checks

Most state-changing functions enforce **two** distinct checks:

1. **Role check** (`onlyRole(...)`) — the caller must hold the operational role for that
   action. This rejects outsiders with no role, and rejects roles assigned to a different
   stage of the pipeline.
2. **Ownership check** (`_requireOwner`) — the caller must currently hold the product
   (`product.currentOwner == msg.sender`). This stops a manufacturer from shipping a
   product they no longer own, or a distributor from acting on a product they have not
   yet received.

This is intentionally stricter than role-only or ownership-only gates: it prevents both
"hostile role-holder" attacks and "stale ownership claim" attacks.

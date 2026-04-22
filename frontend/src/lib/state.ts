export enum ProductState {
  Manufactured = 0,
  ShippedToDistributor = 1,
  ReceivedByDistributor = 2,
  ShippedToRetailer = 3,
  ReceivedByRetailer = 4,
  Sold = 5,
}

export const STATE_LABEL: Record<ProductState, string> = {
  [ProductState.Manufactured]:           "Manufactured",
  [ProductState.ShippedToDistributor]:   "Shipped → Distributor",
  [ProductState.ReceivedByDistributor]:  "Received by Distributor",
  [ProductState.ShippedToRetailer]:      "Shipped → Retailer",
  [ProductState.ReceivedByRetailer]:     "Received by Retailer",
  [ProductState.Sold]:                   "Sold",
};

export const STATE_COLOR: Record<ProductState, string> = {
  [ProductState.Manufactured]:           "bg-slate-100   text-slate-800",
  [ProductState.ShippedToDistributor]:   "bg-amber-100   text-amber-800",
  [ProductState.ReceivedByDistributor]:  "bg-blue-100    text-blue-800",
  [ProductState.ShippedToRetailer]:      "bg-indigo-100  text-indigo-800",
  [ProductState.ReceivedByRetailer]:     "bg-violet-100  text-violet-800",
  [ProductState.Sold]:                   "bg-emerald-100 text-emerald-800",
};

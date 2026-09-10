export interface BinCell {
  id: string;
  barcode: string;
  aisle: string;
  rack: string;
  shelf: string;
  status: 'EMPTY' | 'OCCUPIED' | 'RESERVED' | 'EXPIRING';
  productName?: string;
  sku?: string;
  qty?: number;
  batch?: string;
  expiry?: string;
}

export interface SimulationResult {
  threadId: number;
  status: 'SUCCESS' | 'REJECTED';
  message: string;
}

export interface PutawayResult {
  zone: string;
  shelf: string;
  bin: string;
  reason: string;
}

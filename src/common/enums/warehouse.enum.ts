export enum Warehouse {
  HN = 'HN', // Hà Nội
  QB = 'QB', // Quảng Bình
  SG = 'SG', // Sài Gòn
}

export const WAREHOUSE_LABELS: Record<Warehouse, string> = {
  [Warehouse.HN]: 'Hà Nội',
  [Warehouse.QB]: 'Quảng Bình',
  [Warehouse.SG]: 'Sài Gòn',
};

// Map warehouse → cột tồn kho tương ứng trên Product
export const WAREHOUSE_STOCK_COLUMN: Record<Warehouse, 'stockHN' | 'stockQB' | 'stockSG'> = {
  [Warehouse.HN]: 'stockHN',
  [Warehouse.QB]: 'stockQB',
  [Warehouse.SG]: 'stockSG',
};

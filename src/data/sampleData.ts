// ============================================================
// SAMPLE DATA — Central Auto Parts Distribution
// A mid-size distributor doing ~$7M/year across 3 locations
// ============================================================

export const business = {
  name: 'Central Auto Parts Distribution',
  locations: ['Main Warehouse', 'East Distribution Hub', 'West Distribution Hub'],
  categories: [
    'Brake Components',
    'Engine Parts',
    'Filters',
    'Electrical',
    'Suspension',
    'Exhaust',
    'Fluids',
    'Accessories',
  ],
};

// ============================================================
// INVENTORY STATUS
// ============================================================

export type StockTier = 'healthy' | 'watch' | 'warning' | 'critical' | 'out';

export interface InventoryItem {
  sku: string;
  product: string;
  category: string;
  location: string;
  currentStock: number;
  dailyDemand: number;
  daysLeft: number;
  tier: StockTier;
  supplier: string;
  unitCost: number;
  reorderQty: number;
  leadTimeDays: number;
}

export const inventoryItems: InventoryItem[] = [
  // OUT OF STOCK
  { sku: 'BRK-004', product: 'Rear Brake Caliper - Universal', category: 'Brake Components', location: 'Main Warehouse', currentStock: 0, dailyDemand: 6, daysLeft: 0, tier: 'out', supplier: 'FastParts Inc', unitCost: 84, reorderQty: 120, leadTimeDays: 4 },
  { sku: 'ENG-022', product: 'Timing Belt Kit - 4-Cylinder', category: 'Engine Parts', location: 'East Distribution Hub', currentStock: 0, dailyDemand: 4, daysLeft: 0, tier: 'out', supplier: 'GlobalSupply Co', unitCost: 62, reorderQty: 80, leadTimeDays: 12 },
  { sku: 'FLT-009', product: 'Cabin Air Filter - Premium', category: 'Filters', location: 'West Distribution Hub', currentStock: 0, dailyDemand: 9, daysLeft: 0, tier: 'out', supplier: 'FleetSource', unitCost: 18, reorderQty: 200, leadTimeDays: 14 },

  // CRITICAL (<3 days)
  { sku: 'BRK-001', product: 'Front Brake Pads - Semi-Metallic', category: 'Brake Components', location: 'Main Warehouse', currentStock: 14, dailyDemand: 8, daysLeft: 1, tier: 'critical', supplier: 'FastParts Inc', unitCost: 42, reorderQty: 150, leadTimeDays: 4 },
  { sku: 'ELT-007', product: 'Alternator - 12V 130A', category: 'Electrical', location: 'East Distribution Hub', currentStock: 9, dailyDemand: 5, daysLeft: 1, tier: 'critical', supplier: 'PartsMaster', unitCost: 128, reorderQty: 60, leadTimeDays: 8 },
  { sku: 'SUS-003', product: 'Front Strut Assembly - Pair', category: 'Suspension', location: 'Main Warehouse', currentStock: 22, dailyDemand: 10, daysLeft: 2, tier: 'critical', supplier: 'QuickShip Ltd', unitCost: 190, reorderQty: 80, leadTimeDays: 3 },
  { sku: 'ENG-008', product: 'Water Pump - OEM Compatible', category: 'Engine Parts', location: 'West Distribution Hub', currentStock: 18, dailyDemand: 7, daysLeft: 2, tier: 'critical', supplier: 'AutoDirect', unitCost: 74, reorderQty: 100, leadTimeDays: 5 },
  { sku: 'FLT-002', product: 'Engine Oil Filter - High Performance', category: 'Filters', location: 'Main Warehouse', currentStock: 36, dailyDemand: 14, daysLeft: 2, tier: 'critical', supplier: 'PrimeParts', unitCost: 12, reorderQty: 300, leadTimeDays: 6 },

  // WARNING (3-7 days)
  { sku: 'BRK-007', product: 'Brake Rotor Set - Slotted', category: 'Brake Components', location: 'West Distribution Hub', currentStock: 45, dailyDemand: 8, daysLeft: 5, tier: 'warning', supplier: 'FastParts Inc', unitCost: 96, reorderQty: 120, leadTimeDays: 4 },
  { sku: 'ELT-012', product: 'Starter Motor - Heavy Duty', category: 'Electrical', location: 'Main Warehouse', currentStock: 21, dailyDemand: 4, daysLeft: 5, tier: 'warning', supplier: 'QualityAuto', unitCost: 145, reorderQty: 50, leadTimeDays: 7 },
  { sku: 'ENG-015', product: 'Spark Plug Set - Iridium (8pk)', category: 'Engine Parts', location: 'East Distribution Hub', currentStock: 84, dailyDemand: 14, daysLeft: 6, tier: 'warning', supplier: 'AutoDirect', unitCost: 38, reorderQty: 200, leadTimeDays: 5 },
  { sku: 'RAD-002', product: 'Radiator - Aluminum Core', category: 'Engine Parts', location: 'Main Warehouse', currentStock: 30, dailyDemand: 5, daysLeft: 6, tier: 'warning', supplier: 'GlobalSupply Co', unitCost: 210, reorderQty: 40, leadTimeDays: 12 },
  { sku: 'EXH-004', product: 'Catalytic Converter - Direct Fit', category: 'Exhaust', location: 'West Distribution Hub', currentStock: 35, dailyDemand: 5, daysLeft: 7, tier: 'warning', supplier: 'PartsMaster', unitCost: 320, reorderQty: 30, leadTimeDays: 8 },

  // WATCH (7-14 days)
  { sku: 'FLT-003', product: 'Fuel Filter - Universal', category: 'Filters', location: 'Main Warehouse', currentStock: 110, dailyDemand: 11, daysLeft: 10, tier: 'watch', supplier: 'PrimeParts', unitCost: 22, reorderQty: 200, leadTimeDays: 6 },
  { sku: 'SUS-008', product: 'Rear Shock Absorber - Gas Charged', category: 'Suspension', location: 'East Distribution Hub', currentStock: 72, dailyDemand: 6, daysLeft: 12, tier: 'watch', supplier: 'QuickShip Ltd', unitCost: 88, reorderQty: 80, leadTimeDays: 3 },
  { sku: 'BRK-011', product: 'Brake Master Cylinder', category: 'Brake Components', location: 'Main Warehouse', currentStock: 55, dailyDemand: 4, daysLeft: 13, tier: 'watch', supplier: 'FastParts Inc', unitCost: 112, reorderQty: 60, leadTimeDays: 4 },
  { sku: 'ELT-003', product: 'Battery - AGM 650CCA', category: 'Electrical', location: 'West Distribution Hub', currentStock: 156, dailyDemand: 12, daysLeft: 13, tier: 'watch', supplier: 'QualityAuto', unitCost: 165, reorderQty: 100, leadTimeDays: 7 },

  // HEALTHY (14+ days)
  { sku: 'FLD-001', product: 'Motor Oil 5W-30 Synthetic (5qt)', category: 'Fluids', location: 'Main Warehouse', currentStock: 840, dailyDemand: 32, daysLeft: 26, tier: 'healthy', supplier: 'AutoDirect', unitCost: 28, reorderQty: 500, leadTimeDays: 5 },
  { sku: 'FLD-002', product: 'Brake Fluid DOT 4 (32oz)', category: 'Fluids', location: 'Main Warehouse', currentStock: 380, dailyDemand: 14, daysLeft: 27, tier: 'healthy', supplier: 'AutoDirect', unitCost: 14, reorderQty: 300, leadTimeDays: 5 },
  { sku: 'FLD-003', product: 'Power Steering Fluid (16oz)', category: 'Fluids', location: 'East Distribution Hub', currentStock: 295, dailyDemand: 10, daysLeft: 29, tier: 'healthy', supplier: 'PrimeParts', unitCost: 11, reorderQty: 250, leadTimeDays: 6 },
  { sku: 'ACC-007', product: 'Floor Mats - Universal Fit (4pc)', category: 'Accessories', location: 'West Distribution Hub', currentStock: 200, dailyDemand: 6, daysLeft: 33, tier: 'healthy', supplier: 'QuickShip Ltd', unitCost: 32, reorderQty: 100, leadTimeDays: 3 },
  { sku: 'FLT-001', product: 'Air Filter - High Flow Performance', category: 'Filters', location: 'Main Warehouse', currentStock: 520, dailyDemand: 15, daysLeft: 34, tier: 'healthy', supplier: 'PrimeParts', unitCost: 24, reorderQty: 300, leadTimeDays: 6 },
  { sku: 'EXH-001', product: 'Muffler - OEM Replacement', category: 'Exhaust', location: 'East Distribution Hub', currentStock: 88, dailyDemand: 2, daysLeft: 44, tier: 'healthy', supplier: 'PartsMaster', unitCost: 180, reorderQty: 40, leadTimeDays: 8 },
  { sku: 'SUS-014', product: 'Sway Bar Links - Front Pair', category: 'Suspension', location: 'Main Warehouse', currentStock: 144, dailyDemand: 3, daysLeft: 48, tier: 'healthy', supplier: 'QuickShip Ltd', unitCost: 56, reorderQty: 80, leadTimeDays: 3 },
  { sku: 'ENG-031', product: 'Valve Cover Gasket Set', category: 'Engine Parts', location: 'Main Warehouse', currentStock: 210, dailyDemand: 4, daysLeft: 52, tier: 'healthy', supplier: 'AutoDirect', unitCost: 34, reorderQty: 120, leadTimeDays: 5 },
  { sku: 'BRK-019', product: 'Brake Line Kit - Stainless', category: 'Brake Components', location: 'West Distribution Hub', currentStock: 180, dailyDemand: 3, daysLeft: 60, tier: 'healthy', supplier: 'FastParts Inc', unitCost: 78, reorderQty: 60, leadTimeDays: 4 },
  { sku: 'ELT-021', product: 'Ignition Coil Pack - 6-Cyl', category: 'Electrical', location: 'East Distribution Hub', currentStock: 165, dailyDemand: 2, daysLeft: 82, tier: 'healthy', supplier: 'QualityAuto', unitCost: 94, reorderQty: 60, leadTimeDays: 7 },
  { sku: 'ACC-003', product: 'Wheel Covers 15" (4pc)', category: 'Accessories', location: 'West Distribution Hub', currentStock: 320, dailyDemand: 4, daysLeft: 80, tier: 'healthy', supplier: 'QuickShip Ltd', unitCost: 48, reorderQty: 80, leadTimeDays: 3 },
  { sku: 'FLD-006', product: 'Transmission Fluid ATF+4 (1qt)', category: 'Fluids', location: 'Main Warehouse', currentStock: 440, dailyDemand: 5, daysLeft: 88, tier: 'healthy', supplier: 'AutoDirect', unitCost: 16, reorderQty: 200, leadTimeDays: 5 },
];

// Summary counts
export const inventorySummary = {
  total: 487,
  healthy: 312,
  watch: 89,
  warning: 52,
  critical: 24,
  out: 10,
  dailyOutOfStockCost: 4200,
};

export const inventoryHealthData = [
  { name: 'Healthy (14+ days)', value: 312, color: '#22c55e' },
  { name: 'Watch (7-14 days)', value: 89, color: '#60a5fa' },
  { name: 'Warning (3-7 days)', value: 52, color: '#f59e0b' },
  { name: 'Critical (<3 days)', value: 24, color: '#f87171' },
  { name: 'Out of Stock', value: 10, color: '#dc2626' },
];

// ============================================================
// STOCKOUT COSTS
// ============================================================

export interface MonthlyCostData {
  month: string;
  directLost: number;
  churn: number;
  emergency: number;
  labor: number;
  total: number;
}

export const monthlyCostHistory: MonthlyCostData[] = [
  { month: 'Sep 2025', directLost: 18200, churn: 5800, emergency: 3400, labor: 2100, total: 29500 },
  { month: 'Oct 2025', directLost: 20400, churn: 6200, emergency: 3800, labor: 2400, total: 32800 },
  { month: 'Nov 2025', directLost: 22100, churn: 7100, emergency: 4200, labor: 2600, total: 36000 },
  { month: 'Dec 2025', directLost: 24800, churn: 7800, emergency: 4900, labor: 2900, total: 40400 },
  { month: 'Jan 2026', directLost: 26500, churn: 8400, emergency: 5600, labor: 3200, total: 43700 },
  { month: 'Feb 2026', directLost: 28400, churn: 9200, emergency: 6180, labor: 3500, total: 47280 },
];

export interface StockoutCostItem {
  rank: number;
  sku: string;
  product: string;
  totalCost: number;
  daysOut: number;
  stockouts: number;
  supplier: string;
}

export const topStockoutCosts: StockoutCostItem[] = [
  { rank: 1, sku: 'EXH-004', product: 'Catalytic Converter - Direct Fit', totalCost: 9600, daysOut: 3, stockouts: 5, supplier: 'PartsMaster' },
  { rank: 2, sku: 'SUS-003', product: 'Front Strut Assembly - Pair', totalCost: 7600, daysOut: 4, stockouts: 4, supplier: 'QuickShip Ltd' },
  { rank: 3, sku: 'ELT-007', product: 'Alternator - 12V 130A', totalCost: 6400, daysOut: 5, stockouts: 6, supplier: 'PartsMaster' },
  { rank: 4, sku: 'RAD-002', product: 'Radiator - Aluminum Core', totalCost: 5250, daysOut: 2, stockouts: 3, supplier: 'GlobalSupply Co' },
  { rank: 5, sku: 'ENG-022', product: 'Timing Belt Kit - 4-Cylinder', totalCost: 4960, daysOut: 8, stockouts: 7, supplier: 'GlobalSupply Co' },
  { rank: 6, sku: 'BRK-004', product: 'Rear Brake Caliper - Universal', totalCost: 4200, daysOut: 7, stockouts: 9, supplier: 'FastParts Inc' },
  { rank: 7, sku: 'ELT-012', product: 'Starter Motor - Heavy Duty', totalCost: 3625, daysOut: 5, stockouts: 5, supplier: 'QualityAuto' },
  { rank: 8, sku: 'FLT-009', product: 'Cabin Air Filter - Premium', totalCost: 2700, daysOut: 6, stockouts: 11, supplier: 'FleetSource' },
  { rank: 9, sku: 'BRK-001', product: 'Front Brake Pads - Semi-Metallic', totalCost: 2520, daysOut: 3, stockouts: 8, supplier: 'FastParts Inc' },
  { rank: 10, sku: 'ENG-008', product: 'Water Pump - OEM Compatible', totalCost: 1850, daysOut: 2, stockouts: 4, supplier: 'AutoDirect' },
];

// ============================================================
// SUPPLIER SCORECARD
// ============================================================

export type SupplierGrade = 'A' | 'A-' | 'B+' | 'B' | 'B-' | 'C+' | 'C' | 'D' | 'F';

export interface Supplier {
  name: string;
  onTimeRate: number;
  avgLeadTime: number;
  leadTimeVariance: string;
  emergencyRate: number;
  grade: SupplierGrade;
  ordersQtd: number;
  lateDeliveries: number;
  avgOrderValue: number;
}

export const suppliers: Supplier[] = [
  { name: 'FastParts Inc', onTimeRate: 94, avgLeadTime: 4, leadTimeVariance: '+/-1 day', emergencyRate: 2, grade: 'A', ordersQtd: 28, lateDeliveries: 2, avgOrderValue: 4800 },
  { name: 'AutoDirect', onTimeRate: 91, avgLeadTime: 5, leadTimeVariance: '+/-1 day', emergencyRate: 3, grade: 'A-', ordersQtd: 24, lateDeliveries: 2, avgOrderValue: 3600 },
  { name: 'QuickShip Ltd', onTimeRate: 88, avgLeadTime: 3, leadTimeVariance: '+/-1 day', emergencyRate: 5, grade: 'B+', ordersQtd: 22, lateDeliveries: 3, avgOrderValue: 2900 },
  { name: 'PrimeParts', onTimeRate: 86, avgLeadTime: 6, leadTimeVariance: '+/-2 days', emergencyRate: 6, grade: 'B', ordersQtd: 20, lateDeliveries: 3, avgOrderValue: 2200 },
  { name: 'QualityAuto', onTimeRate: 82, avgLeadTime: 7, leadTimeVariance: '+/-2 days', emergencyRate: 8, grade: 'B-', ordersQtd: 18, lateDeliveries: 3, avgOrderValue: 3100 },
  { name: 'PartsMaster', onTimeRate: 78, avgLeadTime: 8, leadTimeVariance: '+/-3 days', emergencyRate: 12, grade: 'C+', ordersQtd: 18, lateDeliveries: 4, avgOrderValue: 5200 },
  { name: 'GlobalSupply Co', onTimeRate: 72, avgLeadTime: 12, leadTimeVariance: '+/-4 days', emergencyRate: 18, grade: 'C', ordersQtd: 14, lateDeliveries: 4, avgOrderValue: 4100 },
  { name: 'FleetSource', onTimeRate: 61, avgLeadTime: 14, leadTimeVariance: '+/-5 days', emergencyRate: 24, grade: 'D', ordersQtd: 12, lateDeliveries: 7, avgOrderValue: 1800 },
];

export const supplierStats = {
  total: 8,
  avgOnTimeRate: 84,
  ordersQtd: 156,
  lateDeliveries: 28,
};

// ============================================================
// ALERTS
// ============================================================

export interface AlertItem {
  sku: string;
  product: string;
  location: string;
  currentStock: number;
  daysLeft: number;
  supplier: string;
  recommendedOrderQty: number;
  leadTimeDays: number;
  tier: 'critical' | 'warning' | 'watch';
  estimatedDailyLoss: number;
}

export const todayAlerts: AlertItem[] = [
  // CRITICAL
  {
    sku: 'BRK-001', product: 'Front Brake Pads - Semi-Metallic',
    location: 'Main Warehouse', currentStock: 14, daysLeft: 1,
    supplier: 'FastParts Inc', recommendedOrderQty: 150, leadTimeDays: 4,
    tier: 'critical', estimatedDailyLoss: 336,
  },
  {
    sku: 'ELT-007', product: 'Alternator - 12V 130A',
    location: 'East Distribution Hub', currentStock: 9, daysLeft: 1,
    supplier: 'PartsMaster', recommendedOrderQty: 60, leadTimeDays: 8,
    tier: 'critical', estimatedDailyLoss: 640,
  },
  {
    sku: 'FLT-002', product: 'Engine Oil Filter - High Performance',
    location: 'Main Warehouse', currentStock: 36, daysLeft: 2,
    supplier: 'PrimeParts', recommendedOrderQty: 300, leadTimeDays: 6,
    tier: 'critical', estimatedDailyLoss: 168,
  },
  // WARNING
  {
    sku: 'SUS-003', product: 'Front Strut Assembly - Pair',
    location: 'Main Warehouse', currentStock: 22, daysLeft: 2,
    supplier: 'QuickShip Ltd', recommendedOrderQty: 80, leadTimeDays: 3,
    tier: 'warning', estimatedDailyLoss: 1900,
  },
  {
    sku: 'ENG-008', product: 'Water Pump - OEM Compatible',
    location: 'West Distribution Hub', currentStock: 18, daysLeft: 2,
    supplier: 'AutoDirect', recommendedOrderQty: 100, leadTimeDays: 5,
    tier: 'warning', estimatedDailyLoss: 518,
  },
  {
    sku: 'BRK-007', product: 'Brake Rotor Set - Slotted',
    location: 'West Distribution Hub', currentStock: 45, daysLeft: 5,
    supplier: 'FastParts Inc', recommendedOrderQty: 120, leadTimeDays: 4,
    tier: 'warning', estimatedDailyLoss: 768,
  },
  {
    sku: 'ELT-012', product: 'Starter Motor - Heavy Duty',
    location: 'Main Warehouse', currentStock: 21, daysLeft: 5,
    supplier: 'QualityAuto', recommendedOrderQty: 50, leadTimeDays: 7,
    tier: 'warning', estimatedDailyLoss: 580,
  },
  {
    sku: 'ENG-015', product: 'Spark Plug Set - Iridium (8pk)',
    location: 'East Distribution Hub', currentStock: 84, daysLeft: 6,
    supplier: 'AutoDirect', recommendedOrderQty: 200, leadTimeDays: 5,
    tier: 'warning', estimatedDailyLoss: 532,
  },
  // WATCH
  {
    sku: 'EXH-004', product: 'Catalytic Converter - Direct Fit',
    location: 'West Distribution Hub', currentStock: 35, daysLeft: 7,
    supplier: 'PartsMaster', recommendedOrderQty: 30, leadTimeDays: 8,
    tier: 'watch', estimatedDailyLoss: 1600,
  },
  {
    sku: 'FLT-003', product: 'Fuel Filter - Universal',
    location: 'Main Warehouse', currentStock: 110, daysLeft: 10,
    supplier: 'PrimeParts', recommendedOrderQty: 200, leadTimeDays: 6,
    tier: 'watch', estimatedDailyLoss: 242,
  },
  {
    sku: 'SUS-008', product: 'Rear Shock Absorber - Gas Charged',
    location: 'East Distribution Hub', currentStock: 72, daysLeft: 12,
    supplier: 'QuickShip Ltd', recommendedOrderQty: 80, leadTimeDays: 3,
    tier: 'watch', estimatedDailyLoss: 528,
  },
  {
    sku: 'BRK-011', product: 'Brake Master Cylinder',
    location: 'Main Warehouse', currentStock: 55, daysLeft: 13,
    supplier: 'FastParts Inc', recommendedOrderQty: 60, leadTimeDays: 4,
    tier: 'watch', estimatedDailyLoss: 448,
  },
];

export interface AlertHistoryItem {
  date: string;
  sku: string;
  product: string;
  tier: 'critical' | 'warning' | 'watch';
  actionTaken: string;
  resolved: boolean;
}

export const alertHistory: AlertHistoryItem[] = [
  { date: 'Feb 27', sku: 'BRK-004', product: 'Rear Brake Caliper - Universal', tier: 'critical', actionTaken: 'Emergency order placed', resolved: false },
  { date: 'Feb 27', sku: 'ENG-022', product: 'Timing Belt Kit - 4-Cylinder', tier: 'critical', actionTaken: 'Sourcing alternate supplier', resolved: false },
  { date: 'Feb 26', sku: 'FLT-009', product: 'Cabin Air Filter - Premium', tier: 'warning', actionTaken: 'Order placed with FleetSource', resolved: false },
  { date: 'Feb 26', sku: 'RAD-002', product: 'Radiator - Aluminum Core', tier: 'warning', actionTaken: 'PO #4421 submitted', resolved: true },
  { date: 'Feb 25', sku: 'ELT-003', product: 'Battery - AGM 650CCA', tier: 'watch', actionTaken: 'Reorder triggered automatically', resolved: true },
  { date: 'Feb 24', sku: 'BRK-007', product: 'Brake Rotor Set - Slotted', tier: 'warning', actionTaken: 'Reorder submitted to FastParts', resolved: true },
  { date: 'Feb 23', sku: 'EXH-004', product: 'Catalytic Converter - Direct Fit', tier: 'watch', actionTaken: 'Monitoring — next reorder Feb 28', resolved: true },
  { date: 'Feb 22', sku: 'FLT-002', product: 'Engine Oil Filter - High Performance', tier: 'critical', actionTaken: 'Emergency PO placed', resolved: true },
  { date: 'Feb 21', sku: 'SUS-003', product: 'Front Strut Assembly - Pair', tier: 'critical', actionTaken: '80 units ordered from QuickShip', resolved: true },
  { date: 'Feb 20', sku: 'ENG-015', product: 'Spark Plug Set - Iridium (8pk)', tier: 'watch', actionTaken: 'Added to next weekly PO', resolved: true },
  { date: 'Feb 19', sku: 'ENG-008', product: 'Water Pump - OEM Compatible', tier: 'warning', actionTaken: '100 units ordered — confirmed', resolved: true },
  { date: 'Feb 18', sku: 'ELT-007', product: 'Alternator - 12V 130A', tier: 'critical', actionTaken: 'Emergency order placed with PartsMaster', resolved: true },
  { date: 'Feb 17', sku: 'FLD-002', product: 'Brake Fluid DOT 4', tier: 'watch', actionTaken: 'Auto-reorder triggered', resolved: true },
  { date: 'Feb 16', sku: 'BRK-001', product: 'Front Brake Pads - Semi-Metallic', tier: 'warning', actionTaken: '120 units ordered from FastParts', resolved: true },
];

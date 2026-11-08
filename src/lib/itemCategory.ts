export type ItemCategory =
  | 'pump' | 'valve' | 'flange' | 'filter' | 'gasket' | 'bearing'
  | 'gauge' | 'hose' | 'electrical' | 'safety' | 'chemical' | 'generic';

const RULES: Array<[ItemCategory, RegExp]> = [
  ['pump', /\b(pump|impeller|mechanical seal|suction|discharge)\b/i],
  ['valve', /\b(valve|cock|butterfly|gate valve|check valve|ball valve)\b/i],
  ['flange', /\b(flange|coupling|fitting|elbow|tee|union|nipple|reducer)\b/i],
  ['filter', /\b(filter|strainer|element|cartridge|separator|mesh)\b/i],
  ['gasket', /\b(gasket|o-?ring|packing|seal|gland|joint)\b/i],
  ['bearing', /\b(bearing|bush|ball bearing|roller bearing)\b/i],
  ['gauge', /\b(gauge|sensor|thermometer|transmitter|meter|indicator|manometer)\b/i],
  ['hose', /\b(hose|pipe|tube|tubing|ducting)\b/i],
  ['electrical', /\b(cable|motor|switch|relay|lamp|fuse|breaker|starter|wire)\b/i],
  ['safety', /\b(helmet|glove|lifejacket|extinguisher|harness|boots|mask|flare)\b/i],
  ['chemical', /\b(paint|grease|oil|solvent|chemical|lubricant|degreaser)\b/i],
];

/** Categorize product description into standard marine chandlery category */
export function categorize(name: string): ItemCategory {
  if (!name) return 'generic';
  for (const [cat, re] of RULES) {
    if (re.test(name)) return cat;
  }
  return 'generic';
}

export interface CategoryMeta {
  label: string;
  badgeBg: string;
  badgeText: string;
}

export const CATEGORY_META: Record<ItemCategory, CategoryMeta> = {
  pump: { label: 'Pump', badgeBg: 'bg-teal-50 border-teal-200', badgeText: 'text-teal-700' },
  valve: { label: 'Valve', badgeBg: 'bg-blue-50 border-blue-200', badgeText: 'text-blue-700' },
  flange: { label: 'Fitting', badgeBg: 'bg-slate-100 border-slate-300', badgeText: 'text-slate-700' },
  filter: { label: 'Filter', badgeBg: 'bg-amber-50 border-amber-200', badgeText: 'text-amber-700' },
  gasket: { label: 'Seal', badgeBg: 'bg-emerald-50 border-emerald-200', badgeText: 'text-emerald-700' },
  bearing: { label: 'Bearing', badgeBg: 'bg-indigo-50 border-indigo-200', badgeText: 'text-indigo-700' },
  gauge: { label: 'Gauge', badgeBg: 'bg-violet-50 border-violet-200', badgeText: 'text-violet-700' },
  hose: { label: 'Hose', badgeBg: 'bg-cyan-50 border-cyan-200', badgeText: 'text-cyan-700' },
  electrical: { label: 'Electrical', badgeBg: 'bg-yellow-50 border-yellow-200', badgeText: 'text-yellow-800' },
  safety: { label: 'Safety', badgeBg: 'bg-rose-50 border-rose-200', badgeText: 'text-rose-700' },
  chemical: { label: 'Chemical', badgeBg: 'bg-purple-50 border-purple-200', badgeText: 'text-purple-700' },
  generic: { label: 'Part', badgeBg: 'bg-slate-50 border-slate-200', badgeText: 'text-slate-600' },
};


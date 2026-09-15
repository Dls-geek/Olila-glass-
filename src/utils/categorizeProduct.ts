/** Ordered name→category rules. More specific patterns must come first. */
const CATEGORY_RULES: ReadonlyArray<{ category: string; pattern: RegExp }> = [
  {
    category: 'Baby & Kids',
    pattern:
      /baby\s*chair|baby\s*rocker|potty|feeding\s*bottle|hello\s*baby|mother\s*touch|mum\s*pot|hair\s*comb/i,
  },
  {
    category: 'Stools & Chairs',
    pattern: /\bstool\b|(?<!baby\s)\bchair\b/i,
  },
  {
    category: 'Flower Tubs & Planters',
    pattern: /flower\s*tub|flower\s*basket/i,
  },
  {
    category: 'Buckets',
    pattern: /\bbucket\b|\bbodna\b/i,
  },
  {
    category: 'Ice & Cool Boxes',
    pattern: /ice\s*box|cool\s*box|thermal\s*ice/i,
  },
  {
    category: 'Bowls',
    pattern: /\bbowl\b/i,
  },
  {
    category: 'Strainers & Utensils',
    pattern:
      /stainers?|strainer|dal\s*spoon|dal\s*ghutni|funnel|chopping\s*board|food\s*cover|hand\s*fan|handy\s*fan|ice\s*tray|\bknife\b|rice\s*spoon|tea\s*spoon|spoon\s*\(|jhar|scourer/i,
  },
  {
    category: 'Jugs & Juicers',
    pattern: /\bjug\b|juicer/i,
  },
  {
    category: 'Mugs & Glasses',
    pattern: /\bmug\b|\bglass\b/i,
  },
  {
    category: 'Trays',
    pattern: /\btray\b/i,
  },
  {
    category: 'Tiffin & Lunch',
    pattern:
      /tiffin|lunch\s*(box|bag|carrier)|food\s*carrier|food\s*jar|food\s*box|flapper\s*food|air\s*tight\s*food|ping\s*pong|freezer\s*box|foodie\s|roti\s*box|multi\s*chamber|carrier.*bati|ss\s*lunch|insulated\s*lunch|food\s*serving|thermal\s*carrier|oval\s*food\s*container|food\s*container/i,
  },
  {
    category: 'Bottles & Flasks',
    pattern:
      /water\s*bottle|vacuum\s*flask|marvel|jerry\s*can|\bflask\b|crystal\s*bottle|captain\s*bottle|thermo\s*(smart|sports)|moon\s*full\s*steel|galaxy\s|aroma\s*stelo|solar\s*stelo|winner\s*ek-|tb-101|titan\s*(super\s*)?stelo|alpha\s*plastico|thermal\s*tea\s*pot/i,
  },
  {
    category: 'Storage & Baskets',
    pattern:
      /storage\s*jar|spice\s*(box|jar)|oil\s*jar|family\s*jar|beauty\s*box|poco\s*storage|mini\s*food\s*box|square\s*food\s*box|organizer\s*box|storage\s*basket|rattan|ratton|laundry|hexagonal\s*tub|first\s*aid/i,
  },
  {
    category: 'Racks & Stands',
    pattern:
      /\brack\b|dish\s*rack|shoe\s*rack|organizer|dish\s*drainer|filter\s*stand|prayer\s*stand/i,
  },
  {
    category: 'Cleaning & Bathroom',
    pattern:
      /brush|dust\s*pan|soap\s*case|paddle\s*bin|dust\s*bin|waste\s*paper|star\s*bin|helmet|\bmop\b|wiper|toilet\s*cleaner|dust\s*cleaner|wastage\s*bin|utility\s*brash|cleaning\s*pad|pva\s*sponge|floor\s*dust/i,
  },
  {
    category: 'Hangers & Clips',
    pattern: /hanger|cloth\s*clip/i,
  },
  {
    category: 'Stationery',
    pattern: /pen\s*stand|pencil\s*box|pen\s*holder/i,
  },
];

export const PRODUCT_CATEGORIES = [
  'Baby & Kids',
  'Stools & Chairs',
  'Flower Tubs & Planters',
  'Buckets',
  'Ice & Cool Boxes',
  'Bowls',
  'Strainers & Utensils',
  'Jugs & Juicers',
  'Mugs & Glasses',
  'Trays',
  'Tiffin & Lunch',
  'Bottles & Flasks',
  'Storage & Baskets',
  'Racks & Stands',
  'Cleaning & Bathroom',
  'Hangers & Clips',
  'Stationery',
  'Other',
] as const;

export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];

/** Derive a shop category from a product display name. */
export function categorizeProductName(name: string): ProductCategory {
  for (const rule of CATEGORY_RULES) {
    if (rule.pattern.test(name)) {
      return rule.category as ProductCategory;
    }
  }
  return 'Other';
}

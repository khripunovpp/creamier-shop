import { Flavor } from './flavor.type';
import { Rule } from './rule.type';

export interface StockSet {
  id: string;
  slug: string;
  name_ru: string;
  name_pt: string;
  description_ru: string | null;
  description_pt: string | null;
  position: number;
  items: Flavor[];
  rules: Rule[];
}

export interface SetCartItem {
  stock_set_rule_id: string;
  flavor_ids: string[];
  quantity: number;

  set_slug: string;
  set_name_ru: string;
  set_name_pt: string;
  count: number;
  price: number;
}

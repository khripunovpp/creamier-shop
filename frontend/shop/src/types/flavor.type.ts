export interface Flavor {
  id: string;
  name_ru: string;
  name_pt: string;
  detail_ru: string | null;
  detail_pt: string | null;
  tags_ru: string[] | null;
  tags_pt: string[] | null;
  photo_url: string | null;
}

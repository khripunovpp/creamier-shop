-- ─────────────────────────────────────────────────────────────────────────────
-- Seed: sets + rules + flavors + M:M links, sourced from the template
-- (source/sweet-thing-v2.html TARTLET_FLAVORS / ECLAIR_FLAVORS / PRICES).
-- ─────────────────────────────────────────────────────────────────────────────


-- ─────────────────────────────────────────────────────────────────────────────
-- 2.1  Seed photos for product flavors.
--      url uses '/photos/<filename>' served from frontend/shop/public/photos.
--      Files come over in stage 3; URL strings are stable until then.
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO private.photos (url, alt_ru, alt_pt) VALUES
  ('/photos/IMG_0284.JPG',                              'Клубника с фисташкой',     'Morango com pistácio'),
  ('/photos/IMG_1008.JPG',                              'Лимон с меренгой',         'Limão com merengue'),
  ('/photos/IMG_1013.JPG',                              'Ваниль с манго',           'Baunilha com manga'),
  ('/photos/IMG_1009.JPG',                              'Пекан с карамелью',        'Pecã com caramelo'),
  ('/photos/55D93CEC-5533-4E58-91C1-CDC874500DFF.JPG',  'Малина и ваниль',          'Framboesa & baunilha'),
  ('/photos/F169D37B-8F34-4442-8C2D-CD96C2038C2F.JPG',  'Ванильный классика',       'Baunilha clássico'),
  ('/photos/IMG_1058.PNG',                              'Шоколадный с бобом тонка', 'Chocolate com fava tonka'),
  ('/photos/IMG_0671.JPG',                              'Карамельный',              'Caramelo'),
  ('/photos/5EB830D0-D35C-4911-A4DF-EB0EC3B618CD.JPG',  'Фисташковый',              'Pistácio');


-- ─────────────────────────────────────────────────────────────────────────────
-- 2.2  Seed stock_sets: the two product groups shown in the template.
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO private.stock_sets (slug, name_ru, name_pt, description_ru, description_pt, position) VALUES
  (
    'tartlet',
    'Тарталетки',
    'Tarteletes',
    'Хрустящая основа из песочного теста, заварной крем, свежие сезонные фрукты. Набор из четырёх — один или два вкуса, как вам нравится.',
    'Base crocante de massa areada, creme pasteleiro, frutos da época. Conjunto de quatro — um ou dois sabores, à sua escolha.',
    0
  ),
  (
    'eclair',
    'Эклеры',
    'Eclairs',
    'Заварное тесто и кремовые начинки. От пары на двоих до коробки из четырёх — выбирайте размер и комбинируйте вкусы.',
    'Massa choux e recheios cremosos. Do par para dois à caixa de quatro — escolha o tamanho e combine sabores.',
    1
  );


-- ─────────────────────────────────────────────────────────────────────────────
-- 2.3  Seed stock_set_rules: count / price / max_flavors from PRICES in the
--      template. Tartlet has a single rule (always 4). Eclair has three sizes.
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO private.stock_set_rules (set_id, count, price, max_flavors, position)
SELECT s.id, v.count, v.price, v.max_flavors, v.position
FROM (VALUES
  ('tartlet', 4,  14.00, 2, 0),
  ('eclair',  2,   8.00, 1, 0),
  ('eclair',  3,  11.00, 1, 1),
  ('eclair',  4,  14.00, 2, 2)
) AS v(slug, count, price, max_flavors, position)
JOIN private.stock_sets s ON s.slug = v.slug;


-- ─────────────────────────────────────────────────────────────────────────────
-- 2.4  Seed stock_items (flavors).
--      - name      = RU name (existing column, no rename to keep admin diff small)
--      - photo_id  = resolved via subquery on photos.url; NULL when no photo
--      - price/cost_price = 0 (flavors are sold only via sets)
--      - position  = order in which they appear in the carousel within their set
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO private.stock_items (
  name, name_pt, detail_ru, detail_pt, tags_ru, tags_pt,
  photo_id, price, cost_price, is_service, status, position
)
SELECT
  v.name_ru, v.name_pt, v.detail_ru, v.detail_pt, v.tags_ru, v.tags_pt,
  (SELECT id FROM private.photos WHERE url = v.photo_url),
  0, 0, false, 'active', v.position
FROM (VALUES
  -- Tartlet flavors (5)
  ('Клубника с фисташкой',  'Morango com pistácio',
   'Фисташковый крем, свежая клубника, хрустящее пралине, штройзель',
   'Creme de pistácio, morango fresco, praliné crocante, crumble',
   ARRAY['фисташка','клубника','пралине'],
   ARRAY['pistácio','morango','praliné'],
   '/photos/IMG_0284.JPG', 0),

  ('Лимон с меренгой',      'Limão com merengue',
   'Лимонный курд, итальянская меренга, цедра, хрустящее тесто',
   'Curd de limão, merengue italiano, raspa cítrica, massa crocante',
   ARRAY['лимон','меренга','цитрус'],
   ARRAY['limão','merengue','cítrico'],
   '/photos/IMG_1008.JPG', 1),

  ('Ваниль с манго',        'Baunilha com manga',
   'Крем дипломат, мадагаскарская ваниль, манго, маракуйя',
   'Creme diplomata, baunilha de Madagáscar, manga, maracujá',
   ARRAY['ваниль','манго','маракуйя'],
   ARRAY['baunilha','manga','maracujá'],
   '/photos/IMG_1013.JPG', 2),

  ('Пекан с карамелью',     'Pecã com caramelo',
   'Карамельный ганаш, обжаренный пекан, масляная карамель, fleur de sel',
   'Ganache de caramelo, pecã torrado, caramelo de manteiga, fleur de sel',
   ARRAY['пекан','карамель','fleur de sel'],
   ARRAY['pecã','caramelo','fleur de sel'],
   '/photos/IMG_1009.JPG', 3),

  ('Чёрный лес с вишней',   'Floresta negra com cereja',
   'Тёмный шоколад, вишнёвое компоте, шантильи кирш, какао-крошка',
   'Chocolate negro, compota de cereja, chantilly kirsch, crumble de cacau',
   ARRAY['шоколад','вишня','кирш'],
   ARRAY['chocolate','cereja','kirsch'],
   NULL, 4),

  -- Eclair flavors (6)
  ('Малина и ваниль',       'Framboesa & baunilha',
   'Ванильный крем, свежая малина, малиновое желе, белый шоколад',
   'Creme de baunilha, framboesa fresca, geleia de framboesa, chocolate branco',
   ARRAY['малина','ваниль','белый шоколад'],
   ARRAY['framboesa','baunilha','chocolate branco'],
   '/photos/55D93CEC-5533-4E58-91C1-CDC874500DFF.JPG', 0),

  ('Ванильный классика',    'Baunilha clássico',
   'Крем дипломат на мадагаскарской ваниле, классическая помадка',
   'Creme diplomata de baunilha de Madagáscar, fondant clássico',
   ARRAY['ваниль','классика'],
   ARRAY['baunilha','clássico'],
   '/photos/F169D37B-8F34-4442-8C2D-CD96C2038C2F.JPG', 1),

  ('Шоколадный с бобом тонка', 'Chocolate com fava tonka',
   'Тёмный шоколадный ганаш, боб тонка, какао-нибс, помадка',
   'Ganache de chocolate negro, fava tonka, nibs de cacau, fondant',
   ARRAY['шоколад','тонка','какао'],
   ARRAY['chocolate','tonka','cacau'],
   '/photos/IMG_1058.PNG', 2),

  ('Карамельный',           'Caramelo',
   'Карамельный крем с солью, масляная карамель, fleur de sel',
   'Creme de caramelo salgado, caramelo de manteiga, fleur de sel',
   ARRAY['карамель','fleur de sel'],
   ARRAY['caramelo','fleur de sel'],
   '/photos/IMG_0671.JPG', 3),

  ('Фисташковый',           'Pistácio',
   'Сицилийская фисташка, фисташковый крем, дробленые фисташки',
   'Pistácio da Sicília, creme de pistácio, pistácios picados',
   ARRAY['фисташка','Сицилия'],
   ARRAY['pistácio','Sicília'],
   '/photos/5EB830D0-D35C-4911-A4DF-EB0EC3B618CD.JPG', 4),

  ('Фундучный',             'Avelã',
   'Пьемонтская фундучная паста, ганаш гианджуа, обжаренный фундук',
   'Pasta de avelã do Piemonte, ganache gianduja, avelãs torradas',
   ARRAY['фундук','гианджуа'],
   ARRAY['avelã','gianduja'],
   NULL, 5)
) AS v(
  name_ru, name_pt, detail_ru, detail_pt, tags_ru, tags_pt, photo_url, position
);


-- ─────────────────────────────────────────────────────────────────────────────
-- 2.5  Link flavors to sets (M:M).
--      In the template each flavor belongs to exactly one set; this is the data
--      the admin would otherwise toggle in the UI.
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO private.stock_set_items (set_id, stock_item_id, position)
SELECT s.id, i.id, v.position
FROM (VALUES
  -- Tartlet
  ('tartlet', 'Клубника с фисташкой',     0),
  ('tartlet', 'Лимон с меренгой',         1),
  ('tartlet', 'Ваниль с манго',           2),
  ('tartlet', 'Пекан с карамелью',        3),
  ('tartlet', 'Чёрный лес с вишней',      4),
  -- Eclair
  ('eclair',  'Малина и ваниль',          0),
  ('eclair',  'Ванильный классика',       1),
  ('eclair',  'Шоколадный с бобом тонка', 2),
  ('eclair',  'Карамельный',              3),
  ('eclair',  'Фисташковый',              4),
  ('eclair',  'Фундучный',                5)
) AS v(slug, flavor_name, position)
JOIN private.stock_sets  s ON s.slug = v.slug
JOIN private.stock_items i ON i.name = v.flavor_name;

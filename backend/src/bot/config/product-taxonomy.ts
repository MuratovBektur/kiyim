export interface CategoryPreset {
  name: string;
  slug: string;
}

// Single source of truth for the catalog taxonomy — used both by the
// database seed (creates these rows) and the bot wizard's subtype step.
export const CATEGORIES: CategoryPreset[] = [
  { name: 'Верхняя одежда', slug: 'verhnyaya-odezhda' },
  { name: 'Платья и юбки', slug: 'platya-i-yubki' },
  { name: 'Верх', slug: 'verh' },
  { name: 'Низ', slug: 'niz' },
  { name: 'Костюмы и пиджаки', slug: 'kostyumy-i-pidzhaki' },
  { name: 'Спортивная одежда', slug: 'sportivnaya-odezhda' },
  { name: 'Домашняя одежда', slug: 'domashnyaya-odezhda' },
  { name: 'Нижнее бельё', slug: 'nizhnee-bele' },
  { name: 'Пляжная одежда', slug: 'plyazhnaya-odezhda' },
  { name: 'Обувь', slug: 'obuv' },
  { name: 'Аксессуары', slug: 'aksessuary' },
  { name: 'Детская одежда', slug: 'detskaya-odezhda' },
];

export const SUBTYPES_BY_CATEGORY_SLUG: Record<string, string[]> = {
  'verhnyaya-odezhda': ['Куртка', 'Пуховик', 'Пальто', 'Парка', 'Плащ', 'Ветровка', 'Анорак', 'Шуба', 'Дублёнка', 'Жилет'],
  'platya-i-yubki': ['Платье', 'Вечернее платье', 'Сарафан', 'Юбка', 'Юбка-брюки'],
  verh: [
    'Футболка', 'Лонгслив', 'Поло', 'Рубашка', 'Блузка', 'Топ', 'Боди', 'Свитер',
    'Водолазка', 'Худи', 'Толстовка', 'Кофта', 'Кардиган', 'Свитшот', 'Майка',
  ],
  niz: ['Джинсы', 'Брюки', 'Шорты', 'Леггинсы', 'Бриджи', 'Карго', 'Юбка', 'Чиркеш'],
  'kostyumy-i-pidzhaki': ['Пиджак', 'Деловой костюм', 'Брючный костюм', 'Жилет', 'Смокинг', 'Галстук'],
  'sportivnaya-odezhda': [
    'Спортивный костюм', 'Тренировочный костюм', 'Спортивные штаны', 'Спортивная куртка',
    'Спортивные шорты', 'Термобельё', 'Велосипедки', 'Рашгард', 'Тайтсы',
  ],
  'domashnyaya-odezhda': ['Пижама', 'Халат', 'Домашний костюм', 'Домашние шорты'],
  'nizhnee-bele': ['Бюстгальтер', 'Лифчик', 'Трусы', 'Боксеры', 'Брифы', 'Стринги', 'Комплект белья', 'Носки', 'Колготки'],
  'plyazhnaya-odezhda': ['Купальник', 'Плавки', 'Парео'],
  obuv: ['Кроссовки', 'Кеды', 'Слипоны', 'Ботинки', 'Сапоги', 'Угги', 'Туфли', 'Балетки', 'Мокасины', 'Лоферы', 'Сандалии', 'Шлёпанцы', 'Тапочки'],
  aksessuary: [
    'Сумка', 'Рюкзак', 'Клатч', 'Поясная сумка', 'Кошелёк', 'Ремень', 'Шарф', 'Платок',
    'Шапка', 'Кепка', 'Панама', 'Перчатки', 'Очки', 'Галстук', 'Зонт',
  ],
  'detskaya-odezhda': [
    'Комбинезон', 'Боди', 'Ползунки', 'Костюм детский', 'Платье детское', 'Куртка детская',
    'Штаны детские', 'Футболка детская', 'Свитер детский', 'Школьная форма',
  ],
};

export const DEFAULT_SUBTYPE_PRESETS = ['Другое'];

export const BRAND_PRESETS = ['Nike', 'Adidas', 'Zara', 'H&M', 'Bershka', 'Massimo Dutti', 'Локальный бренд'];

export const OWN_PRODUCTION_LABEL = 'Собственное производство';

export const COUNTRY_PRESETS = [
  'Китай',
  'Турция',
  'Бангладеш',
  'Индия',
  'Пакистан',
  'Вьетнам',
  'Италия',
  'Франция',
  'Германия',
  'Россия',
  'Кыргызстан',
  'Казахстан',
  'Узбекистан',
  'Таиланд',
];

export const MATERIAL_PRESETS = ['Хлопок', 'Полиэстер', 'Шерсть', 'Кожа', 'Деним', 'Лён', 'Синтетика', 'Флис'];

export const COLOR_PRESETS = [
  'чёрный', 'белый', 'серый', 'синий', 'красный', 'жёлтый', 'зелёный',
  'бежевый', 'коричневый', 'розовый', 'хаки', 'олива', 'бордовый',
];

const SHOE_SIZE_GRID = Array.from({ length: 10 }, (_, i) => String(36 + i));
const KIDS_SIZE_GRID = ['80', '86', '92', '98', '104', '110', '116', '122', '128', '134', '140', '146', '152'];
const STANDARD_SIZE_GRID = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
const ONE_SIZE_GRID = ['one size'];

export function sizeGridForCategory(categorySlug: string | undefined): string[] {
  if (categorySlug === 'obuv') return SHOE_SIZE_GRID;
  if (categorySlug === 'aksessuary') return ONE_SIZE_GRID;
  if (categorySlug === 'detskaya-odezhda') return KIDS_SIZE_GRID;
  return STANDARD_SIZE_GRID;
}

export function subtypesForCategory(categorySlug: string | undefined, extra: string[] = []): string[] {
  const base = (categorySlug && SUBTYPES_BY_CATEGORY_SLUG[categorySlug]) || [];
  const merged = [...extra.filter((v) => !base.includes(v)), ...base];
  return merged;
}

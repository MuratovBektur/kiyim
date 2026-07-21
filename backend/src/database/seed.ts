import 'reflect-metadata';
import { AppDataSource } from '../data-source';
import { Category } from '../categories/category.entity';
import { Seller } from '../sellers/seller.entity';
import { Product } from '../products/product.entity';
import { CATEGORIES } from '../bot/config/product-taxonomy';

const sellers = [
  {
    name: 'UrbanWear',
    slug: 'urbanwear',
    logoUrl: 'https://picsum.photos/seed/urbanwear/100',
    description: 'Стритвир и повседневная одежда',
    rating: 4.6,
  },
  {
    name: 'KZ Fashion House',
    slug: 'kz-fashion-house',
    logoUrl: 'https://picsum.photos/seed/kzfashion/100',
    description: 'Локальный бренд одежды премиум-класса',
    rating: 4.8,
  },
  {
    name: 'StepStyle',
    slug: 'stepstyle',
    logoUrl: 'https://picsum.photos/seed/stepstyle/100',
    description: 'Обувь на любой сезон',
    rating: 4.4,
  },
  {
    name: 'AccessoryHub',
    slug: 'accessoryhub',
    logoUrl: 'https://picsum.photos/seed/accessoryhub/100',
    description: 'Сумки, ремни, украшения',
    rating: 4.2,
  },
  {
    name: 'EcoThread',
    slug: 'ecothread',
    logoUrl: 'https://picsum.photos/seed/ecothread/100',
    description: 'Одежда из эко-материалов',
    rating: 4.7,
  },
];

function products(categoryIds: Record<string, string>, sellerIds: Record<string, string>) {
  return [
    { title: 'Мужская футболка Basic', price: 4500, category: 'verh', seller: 'urbanwear', sizes: ['S', 'M', 'L', 'XL'], colors: ['чёрный', 'белый'] },
    { title: 'Худи Oversize', price: 12900, category: 'verh', seller: 'urbanwear', sizes: ['M', 'L', 'XL'], colors: ['серый', 'хаки'] },
    { title: 'Джинсы Slim Fit', price: 15900, category: 'niz', seller: 'kz-fashion-house', sizes: ['M', 'L'], colors: ['синий'] },
    { title: 'Рубашка льняная', price: 9900, category: 'verh', seller: 'ecothread', sizes: ['S', 'M', 'L'], colors: ['бежевый', 'белый'] },
    { title: 'Спортивные шорты', price: 5900, category: 'sportivnaya-odezhda', seller: 'urbanwear', sizes: ['S', 'M', 'L', 'XL'], colors: ['чёрный'] },
    { title: 'Куртка-бомбер', price: 24900, category: 'verhnyaya-odezhda', seller: 'kz-fashion-house', sizes: ['M', 'L', 'XL'], colors: ['олива'] },
    { title: 'Свитер вязаный', price: 13900, category: 'verh', seller: 'ecothread', sizes: ['M', 'L'], colors: ['синий', 'серый'] },
    { title: 'Платье летнее', price: 11900, category: 'platya-i-yubki', seller: 'kz-fashion-house', sizes: ['XS', 'S', 'M'], colors: ['красный', 'жёлтый'] },
    { title: 'Блузка шёлковая', price: 14900, category: 'verh', seller: 'kz-fashion-house', sizes: ['S', 'M', 'L'], colors: ['белый', 'розовый'] },
    { title: 'Юбка миди', price: 8900, category: 'platya-i-yubki', seller: 'ecothread', sizes: ['XS', 'S', 'M', 'L'], colors: ['чёрный'] },
    { title: 'Кардиган оверсайз', price: 13500, category: 'verh', seller: 'urbanwear', sizes: ['S', 'M', 'L'], colors: ['бежевый'] },
    { title: 'Джинсы клёш', price: 16900, category: 'niz', seller: 'kz-fashion-house', sizes: ['XS', 'S', 'M'], colors: ['синий'] },
    { title: 'Топ хлопковый', price: 4900, category: 'verh', seller: 'ecothread', sizes: ['XS', 'S', 'M', 'L'], colors: ['белый', 'чёрный'] },
    { title: 'Пальто шерстяное', price: 34900, category: 'verhnyaya-odezhda', seller: 'kz-fashion-house', sizes: ['S', 'M', 'L'], colors: ['серый', 'чёрный'] },
    { title: 'Кроссовки повседневные', price: 21900, category: 'obuv', seller: 'stepstyle', sizes: ['39', '40', '41', '42', '43'], colors: ['белый'] },
    { title: 'Ботинки зимние', price: 28900, category: 'obuv', seller: 'stepstyle', sizes: ['40', '41', '42', '43', '44'], colors: ['чёрный', 'коричневый'] },
    { title: 'Кеды классические', price: 16900, category: 'obuv', seller: 'stepstyle', sizes: ['38', '39', '40', '41'], colors: ['синий', 'белый'] },
    { title: 'Сандалии летние', price: 9900, category: 'obuv', seller: 'stepstyle', sizes: ['37', '38', '39', '40'], colors: ['бежевый'] },
    { title: 'Туфли деловые', price: 25900, category: 'obuv', seller: 'kz-fashion-house', sizes: ['39', '40', '41', '42'], colors: ['чёрный'] },
    { title: 'Угги тёплые', price: 19900, category: 'obuv', seller: 'stepstyle', sizes: ['36', '37', '38', '39'], colors: ['серый'] },
    { title: 'Сумка кожаная', price: 22900, category: 'aksessuary', seller: 'accessoryhub', sizes: ['one size'], colors: ['чёрный', 'коричневый'] },
    { title: 'Ремень кожаный', price: 6900, category: 'aksessuary', seller: 'accessoryhub', sizes: ['one size'], colors: ['чёрный'] },
    { title: 'Шапка вязаная', price: 4900, category: 'aksessuary', seller: 'ecothread', sizes: ['one size'], colors: ['серый', 'синий'] },
    { title: 'Шарф шерстяной', price: 5900, category: 'aksessuary', seller: 'ecothread', sizes: ['one size'], colors: ['бордовый'] },
    { title: 'Рюкзак городской', price: 17900, category: 'aksessuary', seller: 'urbanwear', sizes: ['one size'], colors: ['чёрный', 'хаки'] },
    { title: 'Очки солнцезащитные', price: 8900, category: 'aksessuary', seller: 'accessoryhub', sizes: ['one size'], colors: ['чёрный'] },
    { title: 'Перчатки кожаные', price: 7900, category: 'aksessuary', seller: 'accessoryhub', sizes: ['S', 'M', 'L'], colors: ['чёрный', 'коричневый'] },
    { title: 'Кепка бейсболка', price: 3900, category: 'aksessuary', seller: 'urbanwear', sizes: ['one size'], colors: ['чёрный', 'белый'] },
  ].map((p, i) => ({
    title: p.title,
    description: `${p.title} от ${p.seller}`,
    price: String(p.price),
    currency: 'сом',
    photos: [`https://picsum.photos/seed/product-${i}/400/500`],
    sizes: p.sizes,
    colors: p.colors,
    inStock: true,
    sellerUrl: `https://example-${p.seller}.kz/product/${i}`,
    categoryId: categoryIds[p.category],
    sellerId: sellerIds[p.seller],
  }));
}

async function main() {
  await AppDataSource.initialize();

  const categoryRepo = AppDataSource.getRepository(Category);
  const sellerRepo = AppDataSource.getRepository(Seller);
  const productRepo = AppDataSource.getRepository(Product);

  // Products reference categories/sellers via FK. Plain DELETE (not TRUNCATE)
  // so Postgres doesn't reject it over the still-existing FK constraint.
  await productRepo.createQueryBuilder().delete().execute();
  await categoryRepo.createQueryBuilder().delete().execute();

  await categoryRepo.save(CATEGORIES.map((c) => categoryRepo.create(c)));
  const savedCategories = await categoryRepo.find();
  const categoryIds = Object.fromEntries(savedCategories.map((c) => [c.slug, c.id]));

  await sellerRepo.upsert(sellers, ['slug']);
  const savedSellers = await sellerRepo.find();
  const sellerIds = Object.fromEntries(
    sellers.map((s) => [s.slug, savedSellers.find((ss) => ss.slug === s.slug)!.id]),
  );

  await productRepo.save(products(categoryIds, sellerIds));

  console.log('Сид завершён: продавцы, категории и товары созданы.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await AppDataSource.destroy();
  });

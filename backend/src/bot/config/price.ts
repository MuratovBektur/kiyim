export interface ParsedPrice {
  price: string;
  currency: string;
}

const PRICE_INPUT_REGEX = /^(\d+(?:[.,]\d{1,2})?)\s+(\S+)$/;

// Accepted currencies with their spelling/symbol variants — anything else
// is rejected as an unsupported currency.
const CURRENCY_ALIASES: Record<string, string> = {
  сом: 'сом', сому: 'сом', сомов: 'сом', som: 'сом', kgs: 'сом',
  рубль: 'рубль', руб: 'рубль', рублей: 'рубль', рубли: 'рубль', '₽': 'рубль', rub: 'рубль', rur: 'рубль',
  доллар: 'доллар', доллара: 'доллар', долларов: 'доллар', usd: 'доллар', dollar: 'доллар', '$': 'доллар',
  тенге: 'тенге', kzt: 'тенге', '₸': 'тенге',
};

export const PRICE_PROMPT = 'Введите цену и валюту через пробел:\n\n' + '_Примеры: 500 сом · 1200 рубль · 15 доллар_';

export const PRICE_INVALID_MESSAGE =
  'Неверный формат. Введите цену и валюту через пробел:\n\n' + '_Примеры: 500 сом · 1200 рубль · 15 доллар_';

function normalizeCurrency(raw: string): string | null {
  return CURRENCY_ALIASES[raw.trim().toLowerCase()] ?? null;
}

export function parsePriceInput(raw: string): ParsedPrice | null {
  const match = PRICE_INPUT_REGEX.exec(raw.trim());
  if (!match) return null;
  const currency = normalizeCurrency(match[2]);
  if (!currency) return null;
  return { price: match[1].replace(',', '.'), currency };
}

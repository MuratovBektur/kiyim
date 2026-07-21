export interface ParsedPrice {
  price: string;
  currency: string;
}

const PRICE_INPUT_REGEX = /^\d+(?:[.,]\d{1,2})?$/;

// Only сом is used on the local market — no currency input needed, it's
// always appended automatically.
export const CURRENCY = 'сом';

export const PRICE_PROMPT = 'Введите цену в сомах (только цифры):\n\n' + '_Пример: 500_';

export const PRICE_INVALID_MESSAGE =
  'Неверный формат. Введите цену в сомах (только цифры):\n\n' + '_Пример: 500_';

export function parsePriceInput(raw: string): ParsedPrice | null {
  const trimmed = raw.trim();
  if (!PRICE_INPUT_REGEX.test(trimmed)) return null;
  return { price: trimmed.replace(',', '.'), currency: CURRENCY };
}

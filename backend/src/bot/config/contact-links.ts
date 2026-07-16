// Accepts either a ready-made link or a bare phone/@username and normalizes
// it to a full URL, so sellers can type "@shop" or "77001234567" from the bot.
function normalizeLink(input: string, buildUrl: (handle: string) => string): string {
  const trimmed = input.trim();
  if (!trimmed) return trimmed;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  const handle = trimmed.replace(/^@/, '');
  return handle ? buildUrl(handle) : trimmed;
}

export function normalizeWhatsapp(input: string): string {
  return normalizeLink(input, (handle) => `https://wa.me/${handle.replace(/\D/g, '')}`);
}

export function normalizeTelegram(input: string): string {
  return normalizeLink(input, (handle) => `https://t.me/${handle}`);
}

export function normalizeInstagram(input: string): string {
  return normalizeLink(input, (handle) => `https://instagram.com/${handle}`);
}

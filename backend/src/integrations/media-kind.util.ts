// Тот же список расширений и та же логика, что в mir-jeans'
// server/src/modules/telegram-bot/media-kind.util.ts — определяем видео по
// расширению файла в URL.
const VIDEO_EXTENSIONS = ['.mp4', '.mov', '.webm', '.avi', '.mkv'];

export function isVideoPath(url: string | null | undefined): boolean {
  if (!url) return false;
  const lower = url.toLowerCase();
  return VIDEO_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

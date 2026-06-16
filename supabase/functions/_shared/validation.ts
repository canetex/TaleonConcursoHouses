const DIRECT_IMAGE_PATTERN = /\.(png|jpe?g|gif|webp|bmp)(\?.*)?$/i;
const BLOCKED_URL_PATTERN = /^(data:|javascript:)/i;
const MAX_HIRELINGS = 20;
const MAX_DUMMIES = 20;

const ALLOWED_IMAGE_HOSTS = new Set(["i.imgur.com", "imgur.com"]);

export function clamp_house_counts(dummies_count: number, hirelings_count: number) {
  if (!Number.isInteger(dummies_count) || dummies_count < 0 || dummies_count > MAX_DUMMIES) {
    throw new Error(`dummies_count deve estar entre 0 e ${MAX_DUMMIES}`);
  }
  if (!Number.isInteger(hirelings_count) || hirelings_count < 0 || hirelings_count > MAX_HIRELINGS) {
    throw new Error(`hirelings_count deve estar entre 0 e ${MAX_HIRELINGS}`);
  }
}

export function validate_screenshot_urls(urls: unknown): string[] {
  if (!Array.isArray(urls) || urls.length === 0) {
    throw new Error("Pelo menos uma URL de screenshot é obrigatória");
  }

  const cleaned: string[] = [];
  for (const raw of urls) {
    if (typeof raw !== "string") throw new Error("URL de screenshot inválida");
    const url = raw.trim();
    if (!url) continue;
    if (BLOCKED_URL_PATTERN.test(url)) throw new Error("URL de screenshot não permitida");
    if (url.toLowerCase().includes(".svg")) throw new Error("URLs SVG não são permitidas");

    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      throw new Error(`URL inválida: ${url}`);
    }

    const host = parsed.hostname.replace(/^www\./, "").toLowerCase();
    if (!ALLOWED_IMAGE_HOSTS.has(host)) {
      throw new Error("Apenas URLs do Imgur são permitidas para screenshots");
    }
    if (!DIRECT_IMAGE_PATTERN.test(parsed.pathname) && host !== "imgur.com") {
      throw new Error("Use link direto da imagem (.png, .jpg, .gif, .webp)");
    }
    cleaned.push(url);
  }

  if (cleaned.length === 0) throw new Error("Pelo menos uma URL de screenshot é obrigatória");
  return cleaned;
}

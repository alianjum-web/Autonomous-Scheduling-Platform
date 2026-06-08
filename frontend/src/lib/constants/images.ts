/** Curated Unsplash imagery — healthcare / clinical context, production-safe CDN URLs */

export const IMAGE_ASSETS = {
  hero: {
    id: "1576091160399-112ba8d25d1d",
    alt: "Clinical professional using a mobile device in a healthcare setting",
    objectPosition: "center 25%",
  },
  auth: {
    id: "1638202993928-7267aad84c31",
    alt: "Healthcare professional holding a stethoscope",
    objectPosition: "center 30%",
  },
  chat: {
    id: "1559839734-2b71ea197ec2",
    alt: "Doctor consulting with a patient",
    objectPosition: "center 20%",
  },
  frontDesk: {
    id: "1519494026892-80bbd2d6fd0d",
    alt: "Modern clinic reception desk and waiting area",
    objectPosition: "center center",
  },
  appointments: {
    id: "1666886573531-48d2e3c2b684",
    alt: "Doctor showing appointment details on a tablet to a patient",
    objectPosition: "center 35%",
  },
  docs: {
    id: "1486312338219-ce68d2c6f44d",
    alt: "Clinician reviewing medical records on a laptop",
    objectPosition: "center 40%",
  },
  team: {
    id: "1504813184591-01572f98c85f",
    alt: "Medical team collaborating in a clinical workspace",
    objectPosition: "center 30%",
  },
} as const;

export type ImageAssetKey = keyof typeof IMAGE_ASSETS;

export type ImageVariant = "hero" | "auth" | "header" | "card" | "banner" | "thumb";

const VARIANT_DIMENSIONS: Record<ImageVariant, { w: number; h: number; q: number }> = {
  hero: { w: 1200, h: 900, q: 85 },
  auth: { w: 900, h: 1200, q: 80 },
  header: { w: 560, h: 320, q: 80 },
  card: { w: 720, h: 288, q: 80 },
  banner: { w: 1280, h: 400, q: 80 },
  thumb: { w: 400, h: 250, q: 75 },
};

export const IMAGE_SIZES: Record<ImageVariant, string> = {
  hero: "(max-width: 1024px) 100vw, 600px",
  auth: "(max-width: 1280px) 44vw, 500px",
  header: "280px",
  card: "(max-width: 640px) 100vw, 360px",
  banner: "(max-width: 768px) 100vw, 1280px",
  thumb: "(max-width: 640px) 50vw, 200px",
};

export function getImageSrc(asset: ImageAssetKey, variant: ImageVariant = "card"): string {
  const { id } = IMAGE_ASSETS[asset];
  const { w, h, q } = VARIANT_DIMENSIONS[variant];
  return `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&h=${h}&q=${q}`;
}

/** @deprecated Use IMAGE_ASSETS + getImageSrc instead */
export const IMAGES = Object.fromEntries(
  Object.keys(IMAGE_ASSETS).map((key) => [key, getImageSrc(key as ImageAssetKey, "card")]),
) as Record<ImageAssetKey, string>;

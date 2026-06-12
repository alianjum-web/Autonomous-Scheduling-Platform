import Image from "next/image";

import {
  getImageSrc,
  IMAGE_ASSETS,
  IMAGE_SIZES,
  type ImageAssetKey,
  type ImageVariant,
} from "@/lib/constants/images";
import { cn } from "@/lib/utils";

const VARIANT_QUALITY: Record<ImageVariant, number> = {
  hero: 85,
  auth: 80,
  header: 80,
  card: 80,
  banner: 80,
  thumb: 75,
};

interface ClinicalImageProps {
  asset: ImageAssetKey;
  variant: ImageVariant;
  className?: string;
  priority?: boolean;
  /** Prefer eager for above-the-fold / LCP images (hero, headers, access gates). */
  loading?: "eager" | "lazy";
  /** When true, the image fills its positioned parent (auth panel, custom layouts). */
  fillParent?: boolean;
}

const ABOVE_FOLD_VARIANTS: ReadonlySet<ImageVariant> = new Set(["hero", "header"]);

function resolveLoading(
  variant: ImageVariant,
  priority: boolean,
  loading?: "eager" | "lazy",
): "eager" | "lazy" | undefined {
  if (loading) return loading;
  if (priority || ABOVE_FOLD_VARIANTS.has(variant)) return "eager";
  return undefined;
}

export function ClinicalImage({
  asset,
  variant,
  className,
  priority = false,
  loading,
  fillParent = false,
}: ClinicalImageProps) {
  const { alt, objectPosition } = IMAGE_ASSETS[asset];
  const resolvedLoading = resolveLoading(variant, priority, loading);

  return (
    <Image
      src={getImageSrc(asset, variant)}
      alt={alt}
      fill
      sizes={IMAGE_SIZES[variant]}
      quality={VARIANT_QUALITY[variant]}
      priority={priority}
      loading={resolvedLoading}
      className={cn("object-cover", fillParent && "absolute inset-0", className)}
      style={{ objectPosition }}
    />
  );
}

import { BookOpen, HeartHandshake, Landmark, type LucideIcon } from "lucide-react";
import type { SectionSlug } from "./data";

export interface SectionMeta {
  slug: SectionSlug;
  title: string;
  kicker: string;
  icon: LucideIcon;
  /** Required artist tag of the section's audio. Unset = any non-empty artist (until the owner sends it). */
  audioArtist?: string;
}

export const sectionMeta: Record<SectionSlug, SectionMeta> = {
  akhlagh: { slug: "akhlagh", title: "مباحث اخلاقی", kicker: "اخلاق", icon: HeartHandshake },
  aghayed: { slug: "aghayed", title: "اصول عقاید تشیع", kicker: "اعتقادات", icon: Landmark },
  tafsir: { slug: "tafsir", title: "قرآن کریم", kicker: "تفسیر", icon: BookOpen, audioArtist: "حجت الاسلام والمسلمین رامین گلمکانی" },
};

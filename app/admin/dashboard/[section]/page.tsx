import { notFound } from "next/navigation";
import { SectionPage } from "../content/SectionPage";
import { isSectionSlug } from "../content/data";
import { sectionMeta } from "../content/meta";

export function generateMetadata({ params }: { params: { section: string } }) {
  return { title: `${isSectionSlug(params.section) ? sectionMeta[params.section].title : "بخش"} | پیشخوان مدیریت` };
}

export default function SectionRoute({ params }: { params: { section: string } }) {
  if (!isSectionSlug(params.section)) notFound();
  return <SectionPage slug={params.section} />;
}

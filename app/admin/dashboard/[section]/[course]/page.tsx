import { notFound } from "next/navigation";
import { CoursePage } from "../../content/CoursePage";
import { isSectionSlug } from "../../content/data";

export default function CourseRoute({ params }: { params: { section: string; course: string } }) {
  if (!isSectionSlug(params.section)) notFound();
  return <CoursePage slug={params.section} courseId={decodeURIComponent(params.course)} />;
}

// Demo data for the content sections (front-end only for now).
// When the real API is ready, replace the functions in store.ts; the pages only talk to store.ts.

export type SessionStatus = "published" | "draft";

export interface Session {
  id: string;
  title: string;
  /** Name of the attached audio file (demo: nothing is uploaded yet). */
  audioName: string | null;
  /** Name of the attached written file (PDF / Word). */
  textName: string | null;
  /** "Lesson" part of the audio, shown next to "Full" on the site (mm:ss). */
  lessonStart: string | null;
  lessonEnd: string | null;
  status: SessionStatus;
  createdAt: string;
}

export interface Course {
  id: string;
  title: string;
  /** false = hidden on the site. */
  visible: boolean;
  sessions: Session[];
}

export type ContentState = Record<string, Course[]>;

export const SECTION_SLUGS = ["akhlagh", "aghayed", "tafsir"] as const;
export type SectionSlug = (typeof SECTION_SLUGS)[number];

export function isSectionSlug(value: string): value is SectionSlug {
  return (SECTION_SLUGS as readonly string[]).includes(value);
}

const DAY = 24 * 60 * 60 * 1000;
const pad = (value: number) => String(value).padStart(2, "0");

function sessions(prefix: string, titles: string[], lastIso: string, options: { draftLast?: boolean } = {}): Session[] {
  const last = new Date(lastIso).getTime();
  return titles.map((title, index) => {
    const isLast = index === titles.length - 1;
    const lesson = index % 3 !== 2;
    return {
      id: `${prefix}-${index + 1}`,
      title,
      audioName: options.draftLast && isLast ? null : `${prefix}-${index + 1}.mp3`,
      textName: index === 3 ? null : `${prefix}-${index + 1}.pdf`,
      lessonStart: lesson ? `${pad(5 + index)}:${pad((10 + index * 7) % 60)}` : null,
      lessonEnd: lesson ? `${pad(38 + index)}:${pad((15 + index * 5) % 60)}` : null,
      status: options.draftLast && isLast ? "draft" : "published",
      createdAt: new Date(last - (titles.length - 1 - index) * 7 * DAY).toISOString(),
    } satisfies Session;
  });
}

function numbered(prefix: string, count: number, lastIso: string): Session[] {
  const ordinal = ["اول", "دوم", "سوم", "چهارم", "پنجم", "ششم", "هفتم", "هشتم", "نهم", "دهم", "یازدهم", "دوازدهم"];
  return sessions(
    prefix,
    Array.from({ length: count }, (_, index) => `جلسه ${ordinal[index] ?? index + 1}`),
    lastIso
  );
}

export const initialContent: ContentState = {
  // مباحث اخلاقی
  akhlagh: [
    { id: "nashaat", title: "نشآت وجودی انسان: درجات و درکات", visible: true, sessions: numbered("nashaat", 9, "2026-10-17T18:00:00Z") },
    { id: "lezzat", title: "لذت در عبادت", visible: true, sessions: numbered("lezzat", 6, "2026-10-10T18:00:00Z") },
    { id: "tamalat", title: "تاملاتی در من", visible: true, sessions: numbered("tamalat", 5, "2026-09-26T18:00:00Z") },
    {
      id: "takabbor",
      title: "تکبر",
      visible: true,
      sessions: sessions(
        "takabbor",
        [
          "جلسه اول ـ تکبر چیست؟",
          "جلسه دوم ـ نشانه‌های تکبر",
          "جلسه سوم ـ تکبر در برابر خدا",
          "جلسه چهارم ـ تکبر در برابر مردم",
          "جلسه پنجم ـ ریشه‌های تکبر",
          "جلسه ششم ـ درمان تکبر",
          "جلسه هفتم ـ فروتنی",
        ],
        "2026-09-19T18:00:00Z"
      ),
    },
    { id: "hobb-donya", title: "حب دنیا", visible: true, sessions: numbered("hobb", 6, "2026-09-05T18:00:00Z") },
    { id: "bokhl", title: "بخل", visible: true, sessions: numbered("bokhl", 4, "2026-08-10T18:00:00Z") },
    { id: "ghazab", title: "غضب", visible: false, sessions: numbered("ghazab", 9, "2026-07-10T18:00:00Z") },
  ],
  // اصول عقاید تشیع
  aghayed: [
    { id: "sane", title: "اثبات صانع", visible: true, sessions: numbered("sane", 8, "2026-10-14T18:00:00Z") },
    { id: "tawhid", title: "توحید و صفات الهی", visible: true, sessions: numbered("tawhid", 7, "2026-10-02T18:00:00Z") },
    { id: "adl", title: "عدل الهی", visible: true, sessions: numbered("adl", 5, "2026-09-18T18:00:00Z") },
    { id: "nobowat", title: "نبوت", visible: true, sessions: numbered("nobowat", 6, "2026-09-01T18:00:00Z") },
    { id: "emamat", title: "امامت", visible: true, sessions: numbered("emamat", 9, "2026-08-15T18:00:00Z") },
    { id: "maad", title: "معاد", visible: false, sessions: numbered("maad", 4, "2026-07-20T18:00:00Z") },
  ],
  // قرآن کریم
  tafsir: [
    { id: "tartibi-hamd", title: "تفسیر ترتیبی ـ سوره حمد", visible: true, sessions: numbered("hamd", 10, "2026-10-16T18:00:00Z") },
    { id: "ahsan-hadis", title: "تفسیر موضوعی ـ احسن الحدیث", visible: true, sessions: numbered("ahsan", 12, "2026-10-09T18:00:00Z") },
    { id: "baqara", title: "تفسیر ترتیبی ـ سوره بقره", visible: true, sessions: numbered("baqara", 8, "2026-09-24T18:00:00Z") },
    { id: "al-imran", title: "تفسیر ترتیبی ـ سوره آل عمران", visible: false, sessions: numbered("imran", 5, "2026-08-30T18:00:00Z") },
  ],
};

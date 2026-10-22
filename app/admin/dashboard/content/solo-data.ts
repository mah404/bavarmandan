// Demo data for the two "finished" sections (front-end only for now): برهان امکان و وجوب, and the book شرح تجرید الاعتقاد.
// The pages talk to solo-store.ts only; connecting the API later means rewriting that file.

const DAY = 24 * 60 * 60 * 1000;

export interface BurhanSession {
  id: string;
  title: string;
  /** Names of the attached files (demo: nothing is uploaded yet). */
  textName: string | null;
  audioName: string | null;
  files: string[];
  createdAt: string;
}

export interface TajridSession {
  id: string;
  /** Position in the whole book (1-based). */
  n: number;
  title: string;
  /** شرح */
  textName: string | null;
  /** جزوه */
  handoutName: string | null;
  audioName: string | null;
  createdAt: string;
}

export interface TajridChapter {
  id: string;
  title: string;
  from: number;
  to: number;
}

export const burhanMeta = {
  title: "برهان امکان و وجوب · اثبات صفات الله تعالی",
  short: "برهان امکان و وجوب · اثبات صفات",
  kicker: "اصول عقاید",
};

export const tajridMeta = {
  title: "دروس شرح کتاب تجرید الاعتقاد",
  short: "شرح تجرید الاعتقاد",
  author: "اثر خواجه نصیرالدین طوسی",
  maqsad: "مقصد اول ـ امور عامه",
};

export const tajridChapters: TajridChapter[] = [
  { id: "ch1", title: "فصل اول ـ وجود و عدم", from: 1, to: 14 },
  { id: "ch2", title: "فصل دوم ـ ماهیت و لواحق آن", from: 15, to: 24 },
  { id: "ch3", title: "فصل سوم ـ علت و معلول", from: 25, to: 31 },
];

const burhanTitles = [
  "جلسه اول ـ معنای وجوب و امکان",
  "جلسه دوم ـ تقسیم موجود به واجب و ممکن",
  "جلسه سوم ـ نیاز ممکن به علت",
  "جلسه چهارم ـ ابطال دور",
  "جلسه پنجم ـ ابطال تسلسل",
  "جلسه ششم ـ نتیجه‌ی برهان",
  "جلسه هفتم ـ صفات ذاتی و صفات فعلی",
  "جلسه هشتم ـ اثبات بساطت و غیر مادی بودن ذات الله",
  "جلسه نهم ـ علم الهی",
  "جلسه دهم ـ قدرت الهی",
];

// Which sessions miss a file or have related files, so the list shows every state.
const burhanNoText = new Set([5, 7, 10]);
const burhanNoAudio = new Set([4, 6]);
const burhanFiles: Record<number, string[]> = { 1: ["نمودار-برهان.pdf"], 3: ["منابع.pdf", "پرسش‌ها.pdf"], 9: ["جدول-صفات.pdf"] };

export const initialBurhan: BurhanSession[] = burhanTitles.map((title, index) => {
  const n = index + 1;
  return {
    id: `b-${n}`,
    title,
    textName: burhanNoText.has(n) ? null : `burhan-${n}.pdf`,
    audioName: burhanNoAudio.has(n) ? null : `burhan-${n}.mp3`,
    files: burhanFiles[n] ?? [],
    createdAt: new Date(Date.parse("2026-08-01T18:00:00Z") + index * 7 * DAY).toISOString(),
  };
});

const lastThree = ["تعریف علت", "تعریف علت", "اقسام علت", "اقسام علت", "علت تامه و ناقصه", "علت تامه و ناقصه", "وحدت علت و معلول"];

export const initialTajrid: TajridSession[] = Array.from({ length: 31 }, (_, index) => {
  const n = index + 1;
  const chapter = tajridChapters.find((item) => n >= item.from && n <= item.to)!;
  const topic = chapter.id === "ch3" ? lastThree[n - 25] : `${chapter.id === "ch1" ? "وجود و عدم" : "ماهیت و لواحق آن"} ـ جلسه ${n - chapter.from + 1}`;
  return {
    id: `t-${n}`,
    n,
    title: topic,
    textName: n === 29 ? null : `sharh-${n}.pdf`,
    handoutName: n % 3 === 0 || n === 30 ? null : `jozve-${n}.pdf`,
    audioName: `tajrid-${n}.mp3`,
    createdAt: new Date(Date.parse("2026-10-10T18:00:00Z") - (31 - n) * 7 * DAY).toISOString(),
  };
});

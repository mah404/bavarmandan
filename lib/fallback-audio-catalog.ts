import type { AudioCatalog } from "@/lib/media-api";

const mediaBase = (process.env.MEDIA_API_BASE || "").replace(/\/$/, "");

function mediaUrl(path: string) {
  return mediaBase ? `${mediaBase}${path}` : "";
}

export const fallbackAudioCatalog: AudioCatalog = {
  aghayed: {
    bavardasht: {
      title: "باورداشت",
      description: "بیان ساده از عقاید شیعه",
      sessions: [
        {
          id: "1",
          title: "جلسه اول",
          subtitle:
            "1- توضیحی پیرامون مسیر پیش رو  2- اثبات ضرورت بررسی اصول عقاید و ادعا های ادیان",
          audioUrl: mediaUrl("/aghayed/bavardasht/sessions1/audio.mp3"),
          pdfs: [
            {
              title: "قسمت 1",
              url: mediaUrl("/aghayed/bavardasht/sessions1/pdfs/part1.pdf"),
            },
            {
              title: "قسمت 2",
              url: mediaUrl("/aghayed/bavardasht/sessions1/pdfs/part2.pdf"),
            },
          ],
        },
        {
          id: "2",
          title: "جلسه دوم",
          subtitle: "",
          audioUrl: mediaUrl("/aghayed/bavardasht/sessions2/audio.mp3"),
          pdfs: [
            {
              title: "قسمت 1",
              url: mediaUrl("/aghayed/bavardasht/sessions2/pdfs/part1.pdf"),
            },
          ],
        },
      ],
    },
    "maa-al-sadeghin": {
      title: "مع الصادقین",
      files: [
        {
          title: "حضرت زهرا علیهاالسلام - انسیة الحوراء",
          url: mediaUrl("/aghayed/maa-al-sadeghin/maalsadeghin.mp3"),
        },
      ],
    },
    "konkash-dar-aghayed": {
      title: "کنکاش در عقاید",
      files: [
        {
          title: "دین؛ اثبات یا عملگرایی؟",
          url: mediaUrl("/aghayed/konkash-dar-aghayed/dinesbatyaamalgaraei.mp3"),
        },
        {
          title: "چگونه ایمان آوردی؟ عقل یا احساس؟",
          url: mediaUrl("/aghayed/konkash-dar-aghayed/imanaghlyaehsas.mp3"),
        },
      ],
    },
    "shia-va-miras-fatemi": {
      title: "شیعه و میراث فاطمی",
      files: [
        {
          title: "در تکاپوی نجات امت رسول (ص)",
          url: mediaUrl("/aghayed/shia-va-miras-fatemi/dartakapooyenejat.mp3"),
        },
        {
          title: "دوشنبه، آن روز تاریک",
          url: mediaUrl("/aghayed/shia-va-miras-fatemi/doshanbehanroozetarik.mp3"),
        },
        {
          title: "فدک، صدای حق طلبی فاطمی",
          url: mediaUrl("/aghayed/shia-va-miras-fatemi/fadak.mp3"),
        },
        {
          title: "سقیفه، حلوای حکومت، بلوای بدعت",
          url: mediaUrl("/aghayed/shia-va-miras-fatemi/saghifeh.mp3"),
        },
      ],
    },
    "goftogooha-ye-qorani": {
      title: "گفتگوهای قرآنی",
      files: [
        {
          title: "عصمت انبیا",
          url: mediaUrl("/aghayed/goftogooha-ye-qorani/5goftegooqoraaniesmat.mp3"),
        },
        {
          title: "شفاعت",
          url: mediaUrl("/aghayed/goftogooha-ye-qorani/6goftegooyeqoraanishefaat.mp3"),
        },
      ],
    },
    motafarreghe: {
      title: "مباحث متفرقه",
      files: [
        {
          title: "عصمت پیامبر",
          url: mediaUrl("/aghayed/motafarreghe/anbia.mp3"),
        },
        {
          title: "اثبات خداوند فایده‌ای هم دارد؟",
          url: mediaUrl("/aghayed/motafarreghe/esbatekhodafaedeihamdarad.mp3"),
        },
        {
          title: "فاطمیه فراتر از شبهات",
          url: mediaUrl("/aghayed/motafarreghe/fatemiyeh.mp3"),
        },
        {
          title: "مناظره با یک خداناباور",
          url: mediaUrl("/aghayed/motafarreghe/zeus.mp3"),
        },
      ],
    },
  },
  akhlagh: {
    "lezat-dar-ebadat": {
      title: "لذت در عبادت",
      files: [
        {
          title: "لذت در عبادت",
          url: mediaUrl("/akhlagh/lezat-dar-ebadat.mp3"),
        },
      ],
    },
    "tamolati-dar-man": { title: "تاملاتی در من", files: [] },
    takabbor: { title: "تکبر", files: [] },
    "hobbe-donya": { title: "حب دنیا", files: [] },
    bokhl: { title: "بخل", files: [] },
    ghadab: { title: "غضب", files: [] },
    gheibat: { title: "غیبت", files: [] },
    nefagh: { title: "نفاق", files: [] },
    taassob: { title: "تعصب", files: [] },
    hasad: { title: "حسد", files: [] },
    ojbe: { title: "عجب", files: [] },
    riya: { title: "ریا", files: [] },
    doa: { title: "دعا", files: [] },
  },
  maktubat: {
    title: "مکتوبات",
    description: "لیست کامل مکتوبات",
    sessions: [
      {
        id: "1",
        title: "مکتوب اول",
        subtitle: "اثبات ذات الله :از طریق برهان امکان و وجوب",
        content: "اثبات ذات الله :از طریق برهان امکان و وجوب",
        pdfUrl: null,
        audioUrl: null,
      },
      {
        id: "2",
        title: "مکتوب دوم",
        subtitle: "اثبات بساطت و غیر مادی بودن ذات الله",
        content: "اثبات بساطت و غیر مادی بودن ذات الله",
        pdfUrl: null,
        audioUrl: null,
      },
      {
        id: "3",
        title: "مکتوب سوم",
        subtitle: "نتایج بساطت ذات الله تبارک و تعالی",
        content: "نتایج بساطت ذات الله تبارک و تعالی",
        pdfUrl: null,
        audioUrl: null,
      },
      {
        id: "4",
        title: "مکتوب چهارم",
        subtitle: "اثبات کامل مطلق بودن الله",
        content: "اثبات کامل مطلق بودن الله",
        pdfUrl: null,
        audioUrl: null,
      },
      {
        id: "5",
        title: "مکتوب پنجم",
        subtitle: "نتیجه کامل مطلق بودن واجب:اثبات وحدت ذات الله",
        content: "نتیجه کامل مطلق بودن واجب:اثبات وحدت ذات الله",
        pdfUrl: null,
        audioUrl: null,
      },
      {
        id: "6",
        title: "مکتوب ششم",
        subtitle: "اثبات صفت علم برای ذات الله تعالی",
        content: "اثبات صفت علم برای ذات الله تعالی",
        pdfUrl: null,
        audioUrl: null,
      },
      {
        id: "7",
        title: "مکتوب هفتم",
        subtitle: "اثبات صفت قدرت برای ذات الله",
        content: "اثبات صفت قدرت برای ذات الله",
        pdfUrl: null,
        audioUrl: null,
      },
      {
        id: "8",
        title: "مکتوب هشتم",
        subtitle: "اثبات اختیار برای الله تعالی",
        content: "اثبات اختیار برای الله تعالی",
        pdfUrl: null,
        audioUrl: null,
      },
      {
        id: "9",
        title: "مکتوب نهم",
        subtitle: "توحید ذاتی ، صفاتی و افعالی الله تبارک و تعالی",
        content: "توحید ذاتی ، صفاتی و افعالی الله تبارک و تعالی",
        pdfUrl: null,
        audioUrl: null,
      },
      {
        id: "10",
        title: "مکتوب دهم",
        subtitle: "خالقیت الله تعالی قسمت اول",
        content: "خالقیت الله تعالی قسمت اول",
        pdfUrl: null,
        audioUrl: null,
      },
      {
        id: "11",
        title: "مکتوب یازدهم",
        subtitle: "خالقیت الله تعالی قسمت دوم",
        content: "خالقیت الله تعالی قسمت دوم",
        pdfUrl: null,
        audioUrl: null,
      },
      {
        id: "12",
        title: "مکتوب دوازدهم",
        subtitle: "اثبات حکمت الله تبارک و تعالی",
        content: "اثبات حکمت الله تبارک و تعالی",
        pdfUrl: null,
        audioUrl: null,
      },
    ],
    motafarreghe: [
      {
        title: "گفتمان",
        url: mediaUrl("/maktubat/motafarreghe/gofteman.mp3"),
      },
      {
        title: "گفتاری در باب بساطت",
        url: mediaUrl("/maktubat/motafarreghe/basatat.mp3"),
      },
      {
        title: "انکار عقل، با وهم و گمان",
        url: mediaUrl("/maktubat/motafarreghe/enkar-aql.mp3"),
      },
    ],
  },
  tajrid: {
    audios: [],
    pdfs: [],
  },
};

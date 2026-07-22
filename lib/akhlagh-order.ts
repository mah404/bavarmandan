export const akhlaghTopicOrder = [
  "لذت در عبادت",
  "تاملاتی در من",
  "تکبر",
  "حب دنیا",
  "بخل",
  "غضب",
  "غیبت",
  "نفاق",
  "تعصب",
  "حسد",
  "عجب",
  "ریا",
  "دعا",
];

export function normalizePersianText(value = "") {
  return value
    .replace(/[\u064B-\u065F\u0670\u0640]/g, "")
    .replace(/[ي]/g, "ی")
    .replace(/[ك]/g, "ک")
    .replace(/\s+/g, " ")
    .trim();
}

export function akhlaghOrderIndex(title = "") {
  const normalizedTitle = normalizePersianText(title);
  const exactIndex = akhlaghTopicOrder.findIndex(
    (item) => normalizePersianText(item) === normalizedTitle
  );

  if (exactIndex >= 0) return exactIndex;

  const partialIndex = akhlaghTopicOrder.findIndex((item) =>
    normalizedTitle.includes(normalizePersianText(item))
  );

  return partialIndex >= 0 ? partialIndex : akhlaghTopicOrder.length + 1;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AnnouncementsResponse {
  success: boolean;
  announcements: Announcement[];
  message?: string;
}

export interface AnnouncementInput {
  title: string;
  content: string;
  published: boolean;
}

/** Validates and normalizes a create/update body. Returns an error message (Persian) or the clean fields. */
export function parseAnnouncementInput(
  raw: unknown,
  { partial }: { partial: boolean }
): { error: string } | { value: Partial<AnnouncementInput> } {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { error: "درخواست نامعتبر است." };
  }

  const body = raw as Record<string, unknown>;
  const value: Partial<AnnouncementInput> = {};

  if (body.title !== undefined || !partial) {
    if (typeof body.title !== "string") return { error: "عنوان باید متن باشد." };
    const title = body.title.trim();
    if (!title) return { error: "عنوان اعلان نمی‌تواند خالی باشد." };
    value.title = title;
  }

  if (body.content !== undefined || !partial) {
    if (typeof body.content !== "string") return { error: "متن اعلان باید متن باشد." };
    const content = body.content.trim();
    if (!content) return { error: "متن اعلان نمی‌تواند خالی باشد." };
    value.content = content;
  }

  if (body.published !== undefined || !partial) {
    if (typeof body.published !== "boolean") return { error: "وضعیت انتشار نامعتبر است." };
    value.published = body.published;
  }

  if (partial && Object.keys(value).length === 0) {
    return { error: "چیزی برای ویرایش ارسال نشده است." };
  }

  return { value };
}

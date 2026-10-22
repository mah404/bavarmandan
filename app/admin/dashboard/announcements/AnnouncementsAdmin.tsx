"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import EmojiPicker, { Categories, EmojiStyle } from "emoji-picker-react";
import "./admin-announcements.css";
import { initAnnouncementsAdmin } from "./admin-announcements";
import { announcementsMarkup } from "./markup";
import { logoutAdminSession } from "../logout-client";
import { toggleAudioOn } from "../secret-audio";
import { useThemeFlow } from "../use-theme-flow";

type PickerPosition = { top: number; left: number };

const PICKER_WIDTH = 350;
const PICKER_HEIGHT = 420;

const pickerCategories = [
  { category: Categories.SUGGESTED, name: "اخیراً استفاده‌شده" },
  { category: Categories.SMILEYS_PEOPLE, name: "چهره‌ها و افراد" },
  { category: Categories.ANIMALS_NATURE, name: "طبیعت و حیوانات" },
  { category: Categories.FOOD_DRINK, name: "خوراکی" },
  { category: Categories.TRAVEL_PLACES, name: "سفر و مکان‌ها" },
  { category: Categories.ACTIVITIES, name: "فعالیت‌ها" },
  { category: Categories.OBJECTS, name: "اشیا" },
  { category: Categories.SYMBOLS, name: "نمادها" },
  { category: Categories.FLAGS, name: "پرچم‌ها" },
];

export function AnnouncementsAdmin() {
  const rootRef = useRef<HTMLDivElement>(null);
  const pickerRef = useRef<HTMLDivElement>(null);
  const onPickRef = useRef<((emoji: string) => void) | null>(null);
  const { theme, toggleTheme } = useThemeFlow();
  const [picker, setPicker] = useState<PickerPosition | null>(null);
  const latest = useRef({ toggleTheme });
  latest.current = { toggleTheme };

  const closePicker = useCallback(() => {
    setPicker(null);
    onPickRef.current = null;
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    // The dashboard owns this subtree; fresh markup per mount keeps StrictMode from doubling listeners.
    root.innerHTML = announcementsMarkup;

    // Same as the site's navbar: the logo plays the audio.
    const logoAudio = { current: null as HTMLAudioElement | null };
    const onLogo = () => toggleAudioOn(logoAudio);
    root.querySelector("#logoAudio")?.addEventListener("click", onLogo);

    const dispose = initAnnouncementsAdmin(root, {
      onLogout: logoutAdminSession,
      toggleTheme: () => latest.current.toggleTheme(),
      demoAllowed: false,
      openEmojiPicker: (rect: DOMRect, onPick: (emoji: string) => void) => {
        onPickRef.current = onPick;
        const left = Math.max(12, Math.min(rect.right - PICKER_WIDTH, window.innerWidth - PICKER_WIDTH - 12));
        let top = rect.bottom + 8;
        if (top + PICKER_HEIGHT > window.innerHeight - 12) {
          top = Math.max(12, rect.top - PICKER_HEIGHT - 8);
        }
        setPicker((current) => (current ? null : { top, left }));
      },
      closeEmojiPicker: closePicker,
    });

    return () => {
      dispose();
      logoAudio.current?.pause();
      root.innerHTML = "";
    };
  }, [closePicker]);

  // Close on outside click, Escape, resize and page scroll.
  useEffect(() => {
    if (!picker) return;

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Element | null;
      if (pickerRef.current?.contains(target)) return;
      if (target?.closest("#emojiBtn")) return;
      closePicker();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closePicker();
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", closePicker);
    const root = rootRef.current;
    root?.addEventListener("scroll", closePicker, { passive: true });

    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", closePicker);
      root?.removeEventListener("scroll", closePicker);
    };
  }, [picker, closePicker]);

  return (
    <>
      <div ref={rootRef} className="bv-admin" dir="rtl" />
      {picker ? (
        <div
          ref={pickerRef}
          className="bv-emoji-pop"
          dir="ltr"
          style={{ top: picker.top, left: picker.left }}
        >
          <EmojiPicker
            onEmojiClick={(data) => onPickRef.current?.(data.emoji)}
            theme={theme === "light" ? "light" : "dark"}
            emojiStyle={EmojiStyle.NATIVE}
            width={PICKER_WIDTH}
            height={PICKER_HEIGHT}
            lazyLoadEmojis
            autoFocusSearch={false}
            searchPlaceholder="جستجوی ایموجی (انگلیسی)…"
            categories={pickerCategories}
            previewConfig={{ showPreview: false }}
          />
        </div>
      ) : null}
    </>
  );
}

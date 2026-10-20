"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from "react";
import styles from "./login.module.css";

type LoginResponse = {
  success?: boolean;
  redirectTo?: string;
  error?: string;
  remainingAttempts?: number;
  locked?: boolean;
};

const persianNumber = (value: number) =>
  String(value).replace(/\d/g, (digit) => "۰۱۲۳۴۵۶۷۸۹"[Number(digit)]);

export function AdminLoginPage() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const shakeTimer = useRef<ReturnType<typeof setTimeout>>();
  const redirectTimer = useRef<ReturnType<typeof setTimeout>>();
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [capsLock, setCapsLock] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "error" | "locked" | "success">("idle");
  const [message, setMessage] = useState("");
  const [shaking, setShaking] = useState(false);

  useEffect(() => {
    return () => {
      clearTimeout(shakeTimer.current);
      clearTimeout(redirectTimer.current);
    };
  }, []);

  const shakeField = () => {
    setShaking(false);
    requestAnimationFrame(() => setShaking(true));
    clearTimeout(shakeTimer.current);
    shakeTimer.current = setTimeout(() => setShaking(false), 340);
  };

  const showError = (text: string) => {
    setStatus("error");
    setMessage(text);
    shakeField();
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  const checkCapsLock = (event: KeyboardEvent<HTMLInputElement>) => {
    setCapsLock(event.getModifierState("CapsLock"));
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (status === "loading" || status === "locked" || status === "success") return;

    if (!password) {
      showError("رمز عبور را وارد کنید.");
      return;
    }

    setStatus("loading");
    setMessage("");

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, remember }),
      });
      const result = (await response.json()) as LoginResponse;

      if (response.ok && result.success) {
        setStatus("success");
        setMessage("");
        redirectTimer.current = setTimeout(
          () => router.push(result.redirectTo || "/admin/dashboard"),
          600
        );
        return;
      }

      setPassword("");
      if (response.status === 429 || result.locked) {
        setStatus("locked");
        setMessage("به خاطر چند تلاش ناموفق، ورود تا ۱۵ دقیقه بسته شد.");
        return;
      }

      if (typeof result.remainingAttempts === "number") {
        showError(
          `رمز درست نیست. ${persianNumber(result.remainingAttempts)} بار دیگر می‌توانید امتحان کنید.`
        );
        return;
      }

      showError(result.error || "در حال حاضر ورود ممکن نیست. دوباره تلاش کنید.");
    } catch {
      showError("ارتباط با سرور برقرار نشد. دوباره تلاش کنید.");
    }
  };

  const invalid = status === "error" || status === "locked";
  const disabled = status === "loading" || status === "locked";

  return (
    <main className={styles.page} dir="rtl">
      <section className={styles.formHalf}>
        <Link href="/" className={styles.brand} aria-label="بازگشت به مجمع باورمندان">
          <span className={styles.brandLogo}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 1.5v2" />
              <path d="M12 3.5c-1.3 2.2-5.6 4-5.6 8.4V22h11.2V11.9c0-4.4-4.3-6.2-5.6-8.4z" />
              <path d="M9.6 22v-6a2.4 2.4 0 014.8 0v6" />
            </svg>
          </span>
          <span>مجمع باورمندان</span>
        </Link>

        <div className={styles.formCenter}>
          <form className={styles.form} onSubmit={submit} noValidate>
            <div className={styles.heading}>
              <h1>ورود به پنل مدیریت</h1>
              <p>این بخش فقط برای مدیر سایت است.</p>
            </div>

            <div className={styles.fieldGroup}>
              <label htmlFor="admin-password">رمز عبور</label>
              <div className={`${styles.passwordField} ${invalid ? styles.invalid : ""} ${shaking ? styles.shake : ""}`}>
                <span className={styles.lockIcon}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <rect x="5" y="10.5" width="14" height="10" rx="2.5" />
                    <path d="M8 10.5V7.5a4 4 0 018 0v3" />
                  </svg>
                </span>
                <input
                  ref={inputRef}
                  id="admin-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value);
                    if (status === "error") {
                      setStatus("idle");
                      setMessage("");
                    }
                  }}
                  onKeyUp={checkCapsLock}
                  autoComplete="current-password"
                  dir="ltr"
                  disabled={status === "locked"}
                  aria-invalid={invalid}
                  aria-describedby="password-message"
                  autoFocus
                />
                <button
                  className={styles.eyeButton}
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  aria-label={showPassword ? "پنهان کردن رمز" : "نمایش رمز"}
                  aria-pressed={showPassword}
                  disabled={status === "locked"}
                >
                  {showPassword ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M3 3l18 18M10.6 6.1A9.8 9.8 0 0112 6c5 0 9 6 9 6a16 16 0 01-3 3.4M6.6 6.6C4.3 8.1 3 12 3 12s4 6 9 6c1.6 0 3-.4 4.3-1.1M9.9 9.9a3 3 0 004.2 4.2" />
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M3 12s4-6 9-6 9 6 9 6-4 6-9 6-9-6-9-6z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>

              <div id="password-message" className={styles.messages} aria-live="polite">
                {capsLock && status !== "locked" ? (
                  <span className={styles.capsMessage}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M12 4l7 8h-4v4H9v-4H5zM9 20h6" />
                    </svg>
                    Caps Lock روشن است
                  </span>
                ) : null}
                {message ? (
                  <span role="alert" className={styles.errorMessage}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                      <circle cx="12" cy="12" r="9" />
                      <path d="M12 7.5v5.5M12 16.5v.01" />
                    </svg>
                    {message}
                  </span>
                ) : null}
              </div>
            </div>

            <label className={styles.remember}>
              <input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} disabled={status === "locked"} />
              در این دستگاه وارد بمانم
            </label>

            {status === "success" ? (
              <Link className={styles.submitButton} href="/admin/dashboard">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M5 12l5 5 9-10" />
                </svg>
                خوش آمدید ـ ورود به داشبورد
              </Link>
            ) : (
              <button className={`${styles.submitButton} ${status === "locked" ? styles.lockedButton : ""}`} type="submit" disabled={disabled}>
                {status === "loading" ? (
                  <svg className={styles.spin} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" aria-hidden="true">
                    <path d="M12 3a9 9 0 019 9" />
                  </svg>
                ) : null}
                {status === "loading" ? "در حال بررسی…" : status === "locked" ? "ورود موقتاً بسته است" : "ورود"}
              </button>
            )}
          </form>
        </div>

        <footer className={styles.footer}>
          <Link href="/">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M9 6l6 6-6 6" />
            </svg>
            بازگشت به سایت
          </Link>
          <span>اتصال امن · HTTPS</span>
        </footer>
      </section>

      <section className={styles.artHalf} aria-hidden="true">
        <svg className={styles.pattern} width="100%" height="100%">
          <defs>
            <pattern id="admin-khatam" width="80" height="80" patternUnits="userSpaceOnUse">
              <g fill="none" stroke="#C6973C" strokeWidth="1">
                <rect x="20" y="20" width="40" height="40" />
                <rect x="20" y="20" width="40" height="40" transform="rotate(45 40 40)" />
                <path d="M0 40h11.7M68.3 40H80M40 0v11.7M40 68.3V80" />
              </g>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#admin-khatam)" />
        </svg>
        <div className={styles.rosetteWrap}>
          <svg className={styles.rosette} width="300" height="300" viewBox="0 0 300 300">
            <g fill="none" stroke="#E6C55A" strokeLinejoin="round">
              <circle cx="150" cy="150" r="140" strokeWidth="1" opacity=".35" />
              <rect x="55" y="55" width="190" height="190" strokeWidth="1.5" opacity=".9" />
              <rect x="55" y="55" width="190" height="190" transform="rotate(45 150 150)" strokeWidth="1.5" opacity=".9" />
              <rect x="85" y="85" width="130" height="130" transform="rotate(22.5 150 150)" strokeWidth="1" opacity=".5" />
              <rect x="85" y="85" width="130" height="130" transform="rotate(67.5 150 150)" strokeWidth="1" opacity=".5" />
              <circle cx="150" cy="150" r="58" strokeWidth="1" opacity=".5" />
            </g>
          </svg>
          <div className={styles.centerLogo}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round">
              <path d="M12 1.5v2" />
              <path d="M12 3.5c-1.3 2.2-5.6 4-5.6 8.4V22h11.2V11.9c0-4.4-4.3-6.2-5.6-8.4z" />
              <path d="M9.6 22v-6a2.4 2.4 0 014.8 0v6" />
            </svg>
            مجمع باورمندان
          </div>
        </div>
      </section>
    </main>
  );
}

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
  const mobileInputRef = useRef<HTMLInputElement>(null);
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
    requestAnimationFrame(() => {
      const visible = inputRef.current?.offsetParent ? inputRef.current : mobileInputRef.current;
      visible?.focus();
    });
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
            <img src="/mainicon.jpg" alt="" draggable={false} />
          </span>
          <span>مجمع باورمندان</span>
        </Link>

        <div className={styles.formCenter}>
          <form className={styles.form} onSubmit={submit} noValidate>
            <div className={styles.heading}>
              <h1>ورود به پیشخوان مدیریت</h1>
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
                خوش آمدید ـ ورود به پیشخوان مدیریت
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
            <img src="/mainicon.jpg" alt="" draggable={false} />
          </div>
        </div>
      </section>

      <div className={styles.mLogin}>
        <svg className={styles.mPattern} aria-hidden="true" width="100%" height="360">
          <defs>
            <pattern id="admin-m-khatam" width="56" height="56" patternUnits="userSpaceOnUse">
              <g fill="none" stroke="#C6973C" strokeWidth=".9">
                <rect x="14" y="14" width="28" height="28" />
                <rect x="14" y="14" width="28" height="28" transform="rotate(45 28 28)" />
                <path d="M0 28h8.2M47.8 28H56M28 0v8.2M28 47.8V56" />
              </g>
            </pattern>
          </defs>
          <rect className={styles.mDrift} x="0" y="0" width="100%" height="430" fill="url(#admin-m-khatam)" />
        </svg>

        <header className={styles.mHead}>
          <div className={`${styles.mBadge} ${styles.mPop}`} aria-hidden="true">
            <span className={styles.mGlow} />
            <svg className={styles.mRot} viewBox="0 0 300 300">
              <g fill="none" stroke="#E6C55A" strokeLinejoin="round" strokeWidth="2.2">
                <rect x="62" y="62" width="176" height="176" opacity=".75" />
                <rect x="62" y="62" width="176" height="176" transform="rotate(45 150 150)" opacity=".75" />
                <circle cx="150" cy="150" r="136" strokeWidth="1.6" opacity=".3" strokeDasharray="4 10" />
              </g>
            </svg>
            <svg className={styles.mRotRev} viewBox="0 0 300 300">
              <g fill="none" stroke="#E6C55A" strokeLinejoin="round" strokeWidth="1.6" opacity=".45">
                <rect x="88" y="88" width="124" height="124" transform="rotate(22.5 150 150)" />
                <rect x="88" y="88" width="124" height="124" transform="rotate(67.5 150 150)" />
              </g>
            </svg>
            <i className={styles.mTw} style={{ top: 8, left: 78, animationDelay: "0s" }} />
            <i className={styles.mTw} style={{ top: 80, right: 2, animationDelay: ".7s" }} />
            <i className={styles.mTw} style={{ bottom: 10, left: 30, animationDelay: "1.4s" }} />
            <i className={styles.mTw} style={{ top: 34, left: 14, animationDelay: "2.1s" }} />
            <span className={styles.mLogo}>
              <img src="/mainicon.jpg" alt="" draggable={false} />
            </span>
          </div>
          <span className={`${styles.mSite} ${styles.mRise}`} style={{ animationDelay: ".25s" }}>مجمع باورمندان</span>
          <h1 className={`${styles.mTitle} ${styles.mRise}`} style={{ animationDelay: ".35s" }}>ورود به پیشخوان مدیریت</h1>
        </header>

        <form className={styles.mForm} onSubmit={submit} noValidate>
          <div className={`${styles.mField} ${styles.mRise}`} style={{ animationDelay: ".5s" }}>
            <label htmlFor="admin-m-password">رمز عبور</label>
            <div className={`${styles.mPw} ${invalid ? styles.mIsError : ""} ${shaking ? styles.mShake : ""}`}>
              <span className={styles.mIc}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="5" y="10.5" width="14" height="10" rx="2.5" />
                  <path d="M8 10.5V7.5a4 4 0 018 0v3" />
                </svg>
              </span>
              <input
                ref={mobileInputRef}
                id="admin-m-password"
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
                aria-describedby="admin-m-message"
              />
              <button
                className={styles.mEye}
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
            <div id="admin-m-message" className={styles.mMessages} aria-live="polite">
              {capsLock && status !== "locked" ? (
                <span className={styles.mCaps}>Caps Lock روشن است</span>
              ) : null}
              {message ? (
                <span role="alert" className={styles.mError}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                    <circle cx="12" cy="12" r="9" />
                    <path d="M12 7.5v5.5M12 16.5v.01" />
                  </svg>
                  {message}
                </span>
              ) : null}
            </div>
          </div>

          <label className={`${styles.mCheck} ${styles.mRise}`} style={{ animationDelay: ".6s" }}>
            <input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} disabled={status === "locked"} />
            در این دستگاه وارد بمانم
          </label>

          {status === "success" ? (
            <Link className={styles.mGo} href="/admin/dashboard">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M5 12l5 5 9-10" />
              </svg>
              خوش آمدید ـ ورود به پیشخوان مدیریت
            </Link>
          ) : (
            <button
              className={`${styles.mGo} ${styles.mRise} ${status === "locked" ? styles.mGoLocked : ""}`}
              style={{ animationDelay: ".7s" }}
              type="submit"
              disabled={disabled}
            >
              {status === "loading" ? (
                <svg className={styles.mSpin} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" aria-hidden="true">
                  <path d="M12 3a9 9 0 019 9" />
                </svg>
              ) : null}
              {status === "loading" ? "در حال بررسی…" : status === "locked" ? "ورود موقتاً بسته است" : "ورود"}
            </button>
          )}
        </form>

        <Link className={styles.mBack} href="/">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M9 6l6 6-6 6" />
          </svg>
          بازگشت به سایت
        </Link>
      </div>
    </main>
  );
}

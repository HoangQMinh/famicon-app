'use client';

import { useState, useEffect, useRef, useCallback, useTransition } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { signUpWithEmail, verifyOtp } from '@/app/actions/auth';

const OTP_LENGTH = 6;
const COUNTDOWN_SECONDS = 60;
const MAX_ATTEMPTS = 3;

function formatCountdown(seconds: number): string {
  const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
  const ss = String(seconds % 60).padStart(2, '0');
  return `${mm}:${ss}`;
}

export default function RegisterVerifyPage() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email') ?? '';

  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [error, setError] = useState<string | null>(null);
  const [attemptsLeft, setAttemptsLeft] = useState(MAX_ATTEMPTS);
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);
  const [isPending, startTransition] = useTransition();
  const [isResending, setIsResending] = useState(false);

  const canResend = countdown === 0 && !isResending && !isPending;
  const otp = digits.join('');
  const isOtpComplete = otp.length === OTP_LENGTH && digits.every((d) => d !== '');
  const canSubmit = isOtpComplete && !isPending;

  const inputRefs = useRef<Array<HTMLInputElement | null>>(Array(OTP_LENGTH).fill(null));

  // Countdown timer
  useEffect(() => {
    if (countdown <= 0) return;
    const id = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [countdown]);

  // Auto-focus first OTP box on mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const focusInput = useCallback((index: number) => {
    const clamped = Math.min(Math.max(index, 0), OTP_LENGTH - 1);
    inputRefs.current[clamped]?.focus();
  }, []);

  function handleDigitChange(index: number, value: string) {
    const digit = value.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[index] = digit;
    setDigits(next);
    if (error) setError(null);
    if (digit && index < OTP_LENGTH - 1) {
      focusInput(index + 1);
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace') {
      if (digits[index]) {
        const next = [...digits];
        next[index] = '';
        setDigits(next);
      } else if (index > 0) {
        const next = [...digits];
        next[index - 1] = '';
        setDigits(next);
        focusInput(index - 1);
      }
      e.preventDefault();
    } else if (e.key === 'ArrowLeft') {
      focusInput(index - 1);
      e.preventDefault();
    } else if (e.key === 'ArrowRight') {
      focusInput(index + 1);
      e.preventDefault();
    }
  }

  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (!pasted) return;
    const next = Array(OTP_LENGTH).fill('') as string[];
    for (let i = 0; i < pasted.length; i++) {
      next[i] = pasted[i];
    }
    setDigits(next);
    setError(null);
    focusInput(Math.min(pasted.length, OTP_LENGTH - 1));
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!canSubmit) return;

    setError(null);

    startTransition(async () => {
      try {
        const result = await verifyOtp(email, otp);

        if (!result.success) {
          const remaining = attemptsLeft - 1;
          setAttemptsLeft(remaining);

          if (remaining <= 0) {
            setError('Vui lòng yêu cầu mã mới.');
            setDigits(Array(OTP_LENGTH).fill(''));
            return;
          }

          setError(result.error ?? `Mã không đúng. Còn ${remaining} lần thử.`);
          setDigits(Array(OTP_LENGTH).fill(''));
          setTimeout(() => focusInput(0), 50);
          return;
        }

        // Session established — always go to onboarding for new registrants.
        // createProfile() will determine if they need discovery flow or /home.
        window.location.href = '/onboarding';
      } catch {
        setError('Không kết nối được. Kiểm tra mạng và thử lại nhé.');
      }
    });
  }

  async function handleResend() {
    if (!canResend) return;

    setIsResending(true);
    setError(null);

    try {
      // Use signUpWithEmail (no invite gate) for the registration resend path
      const result = await signUpWithEmail(email);
      if (!result.success) {
        setError(result.error ?? 'Không gửi lại được. Thử lại sau nhé.');
        return;
      }
      setCountdown(COUNTDOWN_SECONDS);
      setDigits(Array(OTP_LENGTH).fill(''));
      setAttemptsLeft(MAX_ATTEMPTS);
      setTimeout(() => focusInput(0), 50);
    } catch {
      setError('Không kết nối được. Kiểm tra mạng và thử lại nhé.');
    } finally {
      setIsResending(false);
    }
  }

  const hasError = error !== null;

  return (
    <main className="auth-page">
      {/* Back button */}
      <Link
        href="/register"
        className="auth-back-btn"
        aria-label="Quay lại trang nhập email"
      >
        <svg
          className="auth-back-icon"
          viewBox="0 0 20 20"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M12.5 15L7.5 10L12.5 5"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        Quay lại
      </Link>

      {/* Heading */}
      <h1 className="auth-heading">Kiểm tra email của bạn</h1>
      <p className="auth-subtext">
        Chúng tôi đã gửi mã 6 số đến{' '}
        <strong>{email || 'email của bạn'}</strong>.{' '}
        Kiểm tra cả thư mục spam nhé.
      </p>

      {/* Error state */}
      {hasError && (
        <div className="auth-error" role="alert" aria-live="polite">
          {error}
        </div>
      )}

      {/* OTP form */}
      <form onSubmit={handleSubmit} noValidate>
        <div
          className="otp-inputs"
          role="group"
          aria-label="Mã xác nhận 6 chữ số"
        >
          {digits.map((digit, index) => (
            <input
              key={index}
              ref={(el) => {
                inputRefs.current[index] = el;
              }}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={1}
              value={digit}
              onChange={(e) => handleDigitChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={handlePaste}
              disabled={isPending}
              aria-label={`Chữ số thứ ${index + 1}`}
              autoComplete={index === 0 ? 'one-time-code' : 'off'}
              className={[
                'otp-input',
                digit ? 'otp-input--filled' : '',
                hasError ? 'otp-input--error' : '',
              ]
                .filter(Boolean)
                .join(' ')}
            />
          ))}
        </div>

        <button
          type="submit"
          className="auth-btn"
          disabled={!canSubmit}
          aria-busy={isPending}
          aria-label={isPending ? 'Đang xác nhận...' : 'Xác nhận'}
        >
          {isPending ? (
            <>
              <span className="auth-spinner" aria-hidden="true" />
              Đang xác nhận…
            </>
          ) : (
            'Xác nhận'
          )}
        </button>
      </form>

      {/* Resend section */}
      <div className="otp-resend-section">
        <p className="otp-resend-hint">Không nhận được mã?</p>
        <button
          type="button"
          className="otp-resend-btn"
          onClick={handleResend}
          aria-disabled={!canResend}
          aria-live="polite"
          aria-atomic="true"
        >
          {isResending
            ? 'Đang gửi lại…'
            : countdown > 0
            ? `Gửi lại (${formatCountdown(countdown)})`
            : 'Gửi lại'}
        </button>
      </div>
    </main>
  );
}

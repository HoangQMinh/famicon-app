'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { signUpWithEmail } from '@/app/actions/auth';

// Basic email format check — full validation happens server-side
function isValidEmailFormat(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export default function RegisterPage() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const canSubmit = isValidEmailFormat(email) && !isPending;

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!canSubmit) return;

    setError(null);

    startTransition(async () => {
      try {
        const result = await signUpWithEmail(email.trim());

        if (!result.success) {
          setError(result.error ?? 'Không gửi được mã. Thử lại sau nhé.');
          return;
        }

        const verifyUrl = new URL('/register/verify', window.location.origin);
        verifyUrl.searchParams.set('email', email.trim());
        router.push(verifyUrl.pathname + verifyUrl.search);
      } catch {
        setError('Không kết nối được. Kiểm tra mạng và thử lại nhé.');
      }
    });
  }

  return (
    <main className="auth-page">
      {/* Logo */}
      <div className="auth-logo">
        <div className="auth-logo-mark" aria-hidden="true">
          🏠
        </div>
        <span className="auth-logo-name">FAMICON</span>
      </div>

      {/* Heading */}
      <h1 className="auth-heading">
        Đăng ký{' '}
        <span className="auth-heading-highlight">Vòng Tròn Tương Trợ</span>
      </h1>
      <p className="auth-subtext">
        Nhập email của bạn để nhận mã xác nhận đăng ký.
      </p>

      {/* Error state — inline, no toast */}
      {error !== null && (
        <div className="auth-error" role="alert" aria-live="polite">
          {error}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} noValidate>
        <div className="auth-field">
          <label htmlFor="email" className="auth-field-label">
            Nhập email của bạn
          </label>
          <input
            id="email"
            type="email"
            name="email"
            autoComplete="email"
            inputMode="email"
            placeholder="email@example.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (error) setError(null);
            }}
            disabled={isPending}
            className={`auth-input${error ? ' auth-input--error' : ''}`}
            autoFocus
            spellCheck={false}
          />
        </div>

        <button
          type="submit"
          className="auth-btn"
          disabled={!canSubmit}
          aria-busy={isPending}
          aria-label={isPending ? 'Đang gửi mã...' : 'Gửi mã xác nhận'}
        >
          {isPending ? (
            <>
              <span className="auth-spinner" aria-hidden="true" />
              Đang gửi…
            </>
          ) : (
            'Gửi mã xác nhận'
          )}
        </button>
      </form>

      {/* Divider + sign-in link */}
      <div className="auth-divider" aria-hidden="true">hoặc</div>
      <p className="auth-footer-note">
        Đã có tài khoản?{' '}
        <a href="/auth" className="auth-link">
          Đăng nhập
        </a>
      </p>
    </main>
  );
}

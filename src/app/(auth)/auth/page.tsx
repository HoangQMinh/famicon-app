'use client';

import { Suspense, useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signInWithEmail } from '@/app/actions/auth';

// Basic email format check — full validation happens server-side
function isValidEmailFormat(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function AuthContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // Preserve invite_token through the auth flow so verify page can pass it along
  const inviteToken = searchParams.get('invite_token');

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
        const result = await signInWithEmail(email.trim());

        if (!result.success) {
          setError(result.error ?? 'Không gửi được mã. Thử lại sau nhé.');
          return;
        }

        // Encode email and pass invite_token through to the verify page
        const verifyUrl = new URL('/auth/verify', window.location.origin);
        verifyUrl.searchParams.set('email', email.trim());
        if (inviteToken) {
          verifyUrl.searchParams.set('invite_token', inviteToken);
        }
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
        Chào mừng đến{' '}
        <span className="auth-heading-highlight">Vòng Tròn Tương Trợ</span>
      </h1>
      <p className="auth-subtext">
        Nhập email của bạn để nhận mã xác nhận.
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
              // Clear error so user isn't stuck seeing stale message while editing
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

      {/* Divider + footer */}
      <div className="auth-divider" aria-hidden="true">hoặc</div>
      <p className="auth-footer-note">
        Bạn chưa có lời mời? Hỏi người thân trong vòng.
      </p>
    </main>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={<main className="auth-page" />}>
      <AuthContent />
    </Suspense>
  );
}

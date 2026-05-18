'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createProfile } from '@/app/actions/profiles';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const EMOJI_OPTIONS = [
  '👨‍👩‍👧',
  '👩‍👧',
  '👨‍👦',
  '👨‍👩‍👧‍👦',
  '👩‍👩‍👧',
  '👨‍👩‍👦',
  '👩‍👧‍👦',
  '👨‍👧',
] as const;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function OnboardingPage() {
  const router = useRouter();

  const [selectedEmoji, setSelectedEmoji] = useState<string>(EMOJI_OPTIONS[0]);
  const [displayName, setDisplayName] = useState('');
  const [kidsDesc, setKidsDesc] = useState('');
  const [location, setLocation] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Button is disabled when display_name is too short or submission in-flight
  const canSubmit = displayName.trim().length >= 2 && !isPending;

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!canSubmit) return;

    setError(null);

    startTransition(async () => {
      try {
        const result = await createProfile({
          display_name: displayName.trim(),
          avatar_emoji: selectedEmoji,
          kids_desc: kidsDesc.trim() || undefined,
          location: location.trim() || undefined,
        });

        if (!result.success) {
          setError(result.error);
          return;
        }

        // Profile created — route based on circle membership.
        // Users who arrived via invite will already have a circle (hasCircle = true).
        // Users who registered openly have no circle yet → discovery onboarding.
        if (!result.data.hasCircle) {
          window.location.href = '/onboarding/discovery';
          return;
        }

        router.push('/home');
      } catch (err) {
        // Next.js redirect() throws internally — re-throw so navigation works
        if (err instanceof Error && err.message.includes('NEXT_REDIRECT')) {
          throw err;
        }
        setError('Không kết nối được. Kiểm tra mạng và thử lại nhé.');
      }
    });
  }

  return (
    <main className="auth-page onboarding-page">
      {/* Logo */}
      <div className="auth-logo">
        <div className="auth-logo-mark" aria-hidden="true">
          🏠
        </div>
        <span className="auth-logo-name">FAMICON</span>
      </div>

      {/* Heading */}
      <h1 className="auth-heading" style={{ textAlign: 'center' }}>
        Chào mừng!
      </h1>
      <p className="auth-subtext" style={{ textAlign: 'center' }}>
        Hãy giới thiệu về gia đình bạn để các thành viên trong vòng có thể nhận ra bạn.
      </p>

      {/* Error state */}
      {error !== null && (
        <div className="auth-error" role="alert" aria-live="polite">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        {/* ── Emoji avatar picker ── */}
        <div className="auth-field">
          <span className="auth-field-label">Hình đại diện gia đình</span>
          <div className="emoji-picker" role="group" aria-label="Chọn hình đại diện">
            {EMOJI_OPTIONS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                className={`emoji-option${selectedEmoji === emoji ? ' emoji-option--selected' : ''}`}
                aria-pressed={selectedEmoji === emoji}
                aria-label={`Chọn hình ${emoji}`}
                onClick={() => setSelectedEmoji(emoji)}
                disabled={isPending}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>

        {/* ── Display name — required ── */}
        <div className="auth-field">
          <label htmlFor="display_name" className="auth-field-label">
            Tên hiển thị <span aria-hidden="true" style={{ color: 'var(--color-error-500)' }}>*</span>
          </label>
          <input
            id="display_name"
            type="text"
            name="display_name"
            autoComplete="name"
            placeholder="Ví dụ: Nhà Anh Tuấn"
            value={displayName}
            onChange={(e) => {
              setDisplayName(e.target.value);
              if (error) setError(null);
            }}
            disabled={isPending}
            maxLength={50}
            className="auth-input"
            autoFocus
            aria-required="true"
          />
          {displayName.length > 0 && displayName.trim().length < 2 && (
            <span className="field-hint field-hint--error" role="alert">
              Tên cần ít nhất 2 ký tự nhé
            </span>
          )}
        </div>

        {/* ── Kids description — optional ── */}
        <div className="auth-field">
          <label htmlFor="kids_desc" className="auth-field-label">
            Con cái <span className="optional-tag">tùy chọn</span>
          </label>
          <input
            id="kids_desc"
            type="text"
            name="kids_desc"
            placeholder="Bé 3 tuổi, bé 6 tuổi"
            value={kidsDesc}
            onChange={(e) => setKidsDesc(e.target.value)}
            disabled={isPending}
            maxLength={100}
            className="auth-input"
          />
        </div>

        {/* ── Location — optional ── */}
        <div className="auth-field">
          <label htmlFor="location" className="auth-field-label">
            Khu vực <span className="optional-tag">tùy chọn</span>
          </label>
          <input
            id="location"
            type="text"
            name="location"
            placeholder="Yokohama"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            disabled={isPending}
            maxLength={50}
            className="auth-input"
          />
        </div>

        {/* ── Submit ── */}
        <button
          type="submit"
          className="auth-btn"
          disabled={!canSubmit}
          aria-busy={isPending}
          aria-label={isPending ? 'Đang lưu...' : 'Tiếp tục'}
          style={{ marginTop: 'var(--space-4)' }}
        >
          {isPending ? (
            <>
              <span className="auth-spinner" aria-hidden="true" />
              Đang lưu…
            </>
          ) : (
            'Tiếp tục'
          )}
        </button>
      </form>
    </main>
  );
}

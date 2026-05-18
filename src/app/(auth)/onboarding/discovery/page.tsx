'use client';

import { useState, useEffect, useTransition } from 'react';
import { updateDiscoverySettings } from '@/app/actions/discovery';
import {
  getCirclesNearby,
  requestToJoinCircle,
  createCircleWithFounder,
  type CircleNearby,
} from '@/app/actions/circles';

// ---------------------------------------------------------------------------
// Step 1 — Enable discovery
// ---------------------------------------------------------------------------

function Step1({
  onNext,
}: {
  onNext: () => void;
}) {
  const [isVisible, setIsVisible] = useState(false);
  const [radiusKm, setRadiusKm] = useState<3 | 5 | 10>(5);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleContinue() {
    setError(null);
    startTransition(async () => {
      const result = await updateDiscoverySettings({ is_visible: isVisible, radius_km: radiusKm });
      if (!result.success) {
        setError(result.error);
        return;
      }
      onNext();
    });
  }

  return (
    <div className="auth-page">
      <div className="auth-logo">
        <div className="auth-logo-mark" aria-hidden="true">🏠</div>
        <span className="auth-logo-name">FAMICON</span>
      </div>

      <h1 className="auth-heading" style={{ textAlign: 'center' }}>
        Để gia đình Việt gần bạn tìm thấy bạn
      </h1>
      <p className="auth-subtext" style={{ textAlign: 'center' }}>
        Bật tính năng này để các gia đình Việt gần bạn có thể tìm thấy và mời bạn vào vòng tròn.
      </p>

      {error !== null && (
        <div className="auth-error" role="alert" aria-live="polite">
          {error}
        </div>
      )}

      {/* Visibility toggle */}
      <div className="auth-field">
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: 'var(--space-3) 0',
          }}
        >
          <label htmlFor="is_visible" className="auth-field-label" style={{ marginBottom: 0 }}>
            Hiển thị trong khu vực
          </label>
          <button
            id="is_visible"
            type="button"
            role="switch"
            aria-checked={isVisible}
            onClick={() => setIsVisible((v) => !v)}
            disabled={isPending}
            style={{
              width: 48,
              height: 28,
              borderRadius: 14,
              border: 'none',
              cursor: 'pointer',
              backgroundColor: isVisible ? 'var(--color-primary-500, #10b981)' : 'var(--color-neutral-300, #d1d5db)',
              position: 'relative',
              transition: 'background-color 0.2s',
              flexShrink: 0,
            }}
            aria-label={isVisible ? 'Tắt hiển thị' : 'Bật hiển thị'}
          >
            <span
              style={{
                position: 'absolute',
                top: 3,
                left: isVisible ? 23 : 3,
                width: 22,
                height: 22,
                borderRadius: '50%',
                backgroundColor: 'white',
                transition: 'left 0.2s',
                boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
              }}
            />
          </button>
        </div>
      </div>

      {/* Radius selection */}
      <div className="auth-field">
        <span className="auth-field-label">Khoảng cách tìm kiếm</span>
        <div
          role="radiogroup"
          aria-label="Khoảng cách tìm kiếm"
          style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', marginTop: 'var(--space-2)' }}
        >
          {([3, 5, 10] as const).map((km) => (
            <label
              key={km}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-1)',
                padding: 'var(--space-2) var(--space-3)',
                borderRadius: 'var(--radius-md, 8px)',
                border: `2px solid ${radiusKm === km ? 'var(--color-primary-500, #10b981)' : 'var(--color-neutral-200, #e5e7eb)'}`,
                cursor: 'pointer',
                backgroundColor: radiusKm === km ? 'var(--color-primary-50, #ecfdf5)' : 'white',
                fontSize: 'var(--text-sm)',
                fontWeight: radiusKm === km ? 600 : 400,
              }}
            >
              <input
                type="radio"
                name="radius_km"
                value={km}
                checked={radiusKm === km}
                onChange={() => setRadiusKm(km)}
                disabled={isPending}
                style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }}
                aria-label={`${km} km`}
              />
              {km} km
            </label>
          ))}
        </div>
      </div>

      <button
        type="button"
        className="auth-btn"
        onClick={handleContinue}
        disabled={isPending}
        aria-busy={isPending}
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

      <div style={{ textAlign: 'center', marginTop: 'var(--space-3)' }}>
        <a
          href="/home"
          style={{ color: 'var(--color-neutral-500, #6b7280)', fontSize: 'var(--text-sm)', textDecoration: 'underline' }}
        >
          Bỏ qua, vào trang chủ
        </a>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 2 — Browse nearby circles
// ---------------------------------------------------------------------------

function Step2({
  onNext,
}: {
  onNext: () => void;
}) {
  const [circles, setCircles] = useState<CircleNearby[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    getCirclesNearby().then((result) => {
      if (cancelled) return;
      if (result.success) {
        setCircles(result.data);
      } else {
        setLoadError(result.error);
      }
      setIsLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleJoin(circleId: string) {
    if (joiningId) return;
    setJoiningId(circleId);
    const result = await requestToJoinCircle(circleId);
    setJoiningId(null);
    if (!result.success) {
      setToast(result.error);
      return;
    }
    setToast('Đã gửi yêu cầu tham gia! Chờ thành viên trong vòng duyệt nhé.');
    setTimeout(() => {
      window.location.href = '/home';
    }, 2000);
  }

  return (
    <div className="auth-page">
      <div className="auth-logo">
        <div className="auth-logo-mark" aria-hidden="true">🏠</div>
        <span className="auth-logo-name">FAMICON</span>
      </div>

      <h1 className="auth-heading" style={{ textAlign: 'center' }}>
        Các vòng gần bạn đang tìm thành viên
      </h1>

      {toast !== null && (
        <div
          role="status"
          aria-live="polite"
          style={{
            backgroundColor: 'var(--color-success-50, #f0fdf4)',
            border: '1px solid var(--color-success-200, #bbf7d0)',
            borderRadius: 'var(--radius-md, 8px)',
            padding: 'var(--space-3)',
            marginBottom: 'var(--space-3)',
            fontSize: 'var(--text-sm)',
            color: 'var(--color-success-700, #15803d)',
          }}
        >
          {toast}
        </div>
      )}

      {isLoading && (
        <p className="auth-subtext" style={{ textAlign: 'center' }}>
          Đang tải danh sách vòng…
        </p>
      )}

      {loadError !== null && (
        <div className="auth-error" role="alert" aria-live="polite">
          {loadError}
        </div>
      )}

      {!isLoading && circles.length === 0 && !loadError && (
        <div style={{ textAlign: 'center', padding: 'var(--space-6) 0' }}>
          <p className="auth-subtext">Chưa có vòng nào gần bạn.</p>
          <button
            type="button"
            className="auth-btn"
            onClick={onNext}
            style={{ marginTop: 'var(--space-4)' }}
          >
            Tạo vòng mới
          </button>
        </div>
      )}

      {!isLoading && circles.length > 0 && (
        <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 var(--space-4)' }}>
          {circles.map((circle) => (
            <li
              key={circle.id}
              style={{
                border: '1px solid var(--color-neutral-200, #e5e7eb)',
                borderRadius: 'var(--radius-md, 8px)',
                padding: 'var(--space-3) var(--space-4)',
                marginBottom: 'var(--space-3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 'var(--space-3)',
              }}
            >
              <div>
                <p style={{ fontWeight: 600, margin: 0, fontSize: 'var(--text-base)' }}>
                  {circle.name}
                </p>
                <p
                  style={{
                    margin: 'var(--space-1) 0 0',
                    fontSize: 'var(--text-sm)',
                    color: 'var(--color-neutral-500, #6b7280)',
                  }}
                >
                  {circle.location} · {circle.memberCount} thành viên
                </p>
                {circle.memberAvatars.length > 0 && (
                  <p style={{ margin: 'var(--space-1) 0 0', fontSize: 'var(--text-lg)' }}>
                    {circle.memberAvatars.join(' ')}
                  </p>
                )}
              </div>
              <button
                type="button"
                className="auth-btn"
                onClick={() => handleJoin(circle.id)}
                disabled={joiningId !== null}
                aria-busy={joiningId === circle.id}
                style={{
                  flexShrink: 0,
                  padding: 'var(--space-2) var(--space-3)',
                  fontSize: 'var(--text-sm)',
                }}
              >
                {joiningId === circle.id ? 'Đang gửi…' : 'Xin tham gia'}
              </button>
            </li>
          ))}
        </ul>
      )}

      <div style={{ textAlign: 'center', marginTop: 'var(--space-2)' }}>
        <a
          href="/home"
          style={{ color: 'var(--color-neutral-500, #6b7280)', fontSize: 'var(--text-sm)', textDecoration: 'underline' }}
        >
          Bỏ qua, vào trang chủ
        </a>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 3 — Create new circle
// ---------------------------------------------------------------------------

function Step3({
  onBack,
}: {
  onBack: () => void;
}) {
  const [circleName, setCircleName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const canSubmit = circleName.trim().length >= 2 && !isPending;

  function handleCreate() {
    if (!canSubmit) return;
    setError(null);
    startTransition(async () => {
      const result = await createCircleWithFounder(circleName.trim());
      if (!result.success) {
        setError(result.error);
        return;
      }
      window.location.href = '/home';
    });
  }

  return (
    <div className="auth-page">
      <button
        type="button"
        className="auth-back-btn"
        onClick={onBack}
        aria-label="Quay lại danh sách vòng"
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
      </button>

      <h1 className="auth-heading" style={{ textAlign: 'center' }}>
        Bạn sẽ là người đầu tiên tạo vòng ở khu này
      </h1>
      <p className="auth-subtext" style={{ textAlign: 'center' }}>
        Đặt tên cho vòng tròn của bạn. Sau đó mời bạn bè, hàng xóm tham gia.
      </p>

      {error !== null && (
        <div className="auth-error" role="alert" aria-live="polite">
          {error}
        </div>
      )}

      <div className="auth-field">
        <label htmlFor="circle_name" className="auth-field-label">
          Tên vòng tròn <span aria-hidden="true" style={{ color: 'var(--color-error-500)' }}>*</span>
        </label>
        <input
          id="circle_name"
          type="text"
          placeholder="Ví dụ: Gia đình Việt Yokohama"
          value={circleName}
          onChange={(e) => {
            setCircleName(e.target.value);
            if (error) setError(null);
          }}
          disabled={isPending}
          maxLength={100}
          className="auth-input"
          autoFocus
          aria-required="true"
        />
        {circleName.length > 0 && circleName.trim().length < 2 && (
          <span className="field-hint field-hint--error" role="alert">
            Tên cần ít nhất 2 ký tự nhé
          </span>
        )}
      </div>

      <button
        type="button"
        className="auth-btn"
        onClick={handleCreate}
        disabled={!canSubmit}
        aria-busy={isPending}
        style={{ marginTop: 'var(--space-4)' }}
      >
        {isPending ? (
          <>
            <span className="auth-spinner" aria-hidden="true" />
            Đang tạo…
          </>
        ) : (
          'Tạo vòng'
        )}
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page — step controller
// ---------------------------------------------------------------------------

export default function DiscoveryOnboardingPage() {
  const [step, setStep] = useState<1 | 2 | 3>(1);

  if (step === 1) {
    return <Step1 onNext={() => setStep(2)} />;
  }

  if (step === 2) {
    return <Step2 onNext={() => setStep(3)} />;
  }

  return <Step3 onBack={() => setStep(2)} />;
}

'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { updateProfile, uploadAvatar } from '@/app/actions/profiles';
import { HelpTagsPicker } from './help-tags-picker';
import type { ProfileData } from '@/lib/types';

// ---------------------------------------------------------------------------
// Inline SVG icons
// ---------------------------------------------------------------------------

function IconX() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function IconCamera() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Toast — inline, reuses existing .nr-toast classes from globals.css
// ---------------------------------------------------------------------------

interface ToastState {
  message: string;
  type: 'success' | 'error';
}

// ---------------------------------------------------------------------------
// EditProfileModal props
// ---------------------------------------------------------------------------

interface EditProfileModalProps {
  profile: ProfileData;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * EditProfileModal — slide-up bottom sheet for editing profile fields.
 *
 * Submit flow:
 *   1. If new avatar file selected → uploadAvatar(file) first (saves avatar_url directly to DB)
 *   2. Call updateProfile({ display_name, location, kids_desc, help_tags })
 *   3. On success: close modal + router.refresh() to re-fetch SSR data
 *
 * Toast is shown on success/error.
 * Avatar upload: file picker → local preview → submitted with form.
 *
 * Constitution compliance:
 *   - No contribution counters, badges, or ranking fields (P2, P7).
 */
export function EditProfileModal({ profile, isOpen, onClose }: EditProfileModalProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [displayName, setDisplayName] = useState(profile.display_name);
  const [location, setLocation] = useState(profile.location ?? '');
  const [kidsDesc, setKidsDesc] = useState(profile.kids_desc ?? '');
  const [helpTags, setHelpTags] = useState<string[]>(profile.help_tags ?? []);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(profile.avatar_url);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);

  function showToast(message: string, type: 'success' | 'error') {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    // Local preview before upload
    const objectUrl = URL.createObjectURL(file);
    setAvatarPreview(objectUrl);
  }

  function handleClose() {
    if (isSubmitting) return;
    onClose();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isSubmitting) return;

    const trimmedName = displayName.trim();
    if (trimmedName.length < 2) {
      showToast('Tên hiển thị cần ít nhất 2 ký tự.', 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      let newAvatarUrl: string | undefined;

      // Step 1: Upload avatar if a new file was selected
      if (avatarFile) {
        const uploadResult = await uploadAvatar(avatarFile);
        if (!uploadResult.success) {
          showToast(uploadResult.error, 'error');
          setIsSubmitting(false);
          return;
        }
        newAvatarUrl = uploadResult.data.avatar_url;
      }

      // Step 2: Update profile fields
      const updateData: Record<string, unknown> = {
        display_name: trimmedName,
        location: location.trim() || null,
        kids_desc: kidsDesc.trim() || null,
        help_tags: helpTags.length > 0 ? helpTags : null,
      };

      const updateResult = await updateProfile(updateData);

      if (!updateResult.success) {
        showToast(updateResult.error, 'error');
        setIsSubmitting(false);
        return;
      }

      showToast('Hồ sơ đã được cập nhật.', 'success');

      // Close modal and refresh SSR data after a short delay for toast visibility
      setTimeout(() => {
        onClose();
        router.refresh();
      }, 800);
    } catch {
      showToast('Có lỗi xảy ra. Vui lòng thử lại.', 'error');
      setIsSubmitting(false);
    }
  }

  if (!isOpen) return null;

  const avatarDisplay = avatarPreview || null;
  const avatarEmoji = profile.avatar_emoji ?? '👤';

  return (
    <>
      {/* Backdrop */}
      <div
        className="edit-modal__backdrop"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Bottom sheet */}
      <div
        className="edit-modal__sheet"
        role="dialog"
        aria-modal="true"
        aria-label="Chỉnh sửa hồ sơ"
      >
        {/* Header */}
        <div className="edit-modal__header">
          <h2 className="edit-modal__title">Chỉnh sửa hồ sơ</h2>
          <button
            type="button"
            className="edit-modal__close-btn"
            onClick={handleClose}
            aria-label="Đóng"
            disabled={isSubmitting}
          >
            <IconX />
          </button>
        </div>

        {/* Scrollable form body */}
        <form onSubmit={handleSubmit} className="edit-modal__body">
          {/* Avatar section */}
          <div className="edit-modal__avatar-section">
            <div className="edit-modal__avatar-preview">
              {avatarDisplay ? (
                <img
                  src={avatarDisplay}
                  alt="Ảnh đại diện"
                  className="fc-avatar fc-avatar--lg"
                  style={{ objectFit: 'cover' }}
                />
              ) : (
                <div className="fc-avatar fc-avatar--lg">
                  <span style={{ fontSize: 32, lineHeight: 1 }}>{avatarEmoji}</span>
                </div>
              )}
            </div>
            <button
              type="button"
              className="fc-btn fc-btn--secondary edit-modal__change-avatar-btn"
              onClick={() => fileInputRef.current?.click()}
              disabled={isSubmitting}
            >
              <IconCamera />
              <span style={{ marginLeft: 6 }}>Đổi ảnh</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleFileChange}
              aria-label="Chọn ảnh đại diện"
            />
          </div>

          {/* Display name */}
          <div className="edit-modal__field">
            <label htmlFor="edit-display-name" className="fc-field__label">
              Tên hiển thị <span style={{ color: 'var(--color-error-500)' }}>*</span>
            </label>
            <input
              id="edit-display-name"
              type="text"
              className="fc-input"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Tên của bạn"
              minLength={2}
              required
              disabled={isSubmitting}
              autoComplete="name"
            />
          </div>

          {/* Location */}
          <div className="edit-modal__field">
            <label htmlFor="edit-location" className="fc-field__label">
              Khu vực / Ga{' '}
              <span className="optional-tag">(tuỳ chọn)</span>
            </label>
            <input
              id="edit-location"
              type="text"
              className="fc-input"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Ví dụ: Ga Edogawa"
              disabled={isSubmitting}
            />
          </div>

          {/* Kids description */}
          <div className="edit-modal__field">
            <label htmlFor="edit-kids-desc" className="fc-field__label">
              Mô tả con cái{' '}
              <span className="optional-tag">(tuỳ chọn)</span>
            </label>
            <textarea
              id="edit-kids-desc"
              className="fc-textarea"
              value={kidsDesc}
              onChange={(e) => setKidsDesc(e.target.value)}
              placeholder="Ví dụ: Bé gái 3 tuổi, bé trai 6 tuổi"
              rows={3}
              disabled={isSubmitting}
            />
          </div>

          {/* Help tags */}
          <div className="edit-modal__field">
            <span className="fc-field__label">
              Có thể giúp{' '}
              <span className="optional-tag">(tuỳ chọn)</span>
            </span>
            <div style={{ marginTop: 8 }}>
              <HelpTagsPicker
                value={helpTags}
                onChange={setHelpTags}
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="edit-modal__actions">
            <button
              type="submit"
              className="fc-btn fc-btn--primary fc-btn--block"
              disabled={isSubmitting}
              aria-busy={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className="nr-spinner" aria-hidden="true" />
                  Đang lưu...
                </>
              ) : (
                'Lưu thay đổi'
              )}
            </button>
            <button
              type="button"
              className="fc-btn fc-btn--secondary fc-btn--block"
              onClick={handleClose}
              disabled={isSubmitting}
              style={{ marginTop: 8 }}
            >
              Huỷ
            </button>
          </div>
        </form>
      </div>

      {/* Toast notification */}
      {toast && (
        <div
          className={`nr-toast nr-toast--${toast.type}`}
          role="status"
          aria-live="polite"
          onClick={() => setToast(null)}
        >
          {toast.message}
        </div>
      )}
    </>
  );
}

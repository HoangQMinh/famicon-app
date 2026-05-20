/**
 * Unit tests for Sprint 8 profile Server Actions:
 *   - getMyProfile
 *   - updateProfile
 *   - uploadAvatar
 *
 * WHY these edge cases matter:
 *  - getMyProfile: line_user_id must never appear in the response (Constitution P9).
 *    This test is a regression guard — if anyone adds line_user_id to the SELECT
 *    query, the TC-A8.1.4 test catches it before deploy.
 *  - updateProfile: empty payload guard prevents silent no-op DB writes that would
 *    confuse users into thinking their data was saved when nothing changed.
 *  - uploadAvatar: storage path must always be server-computed from user.id (never
 *    from client input). The path format test (TC-A8.3.6) catches path injection.
 *    The upsert:true test (TC-A8.3.7) ensures old avatars are overwritten atomically.
 *
 * Mock strategy:
 *  - Mutable scenario objects per action group, reset in beforeEach.
 *  - storage mock tracks call arguments so upload path and options can be verified.
 *  - vi.mock hoisting: all vi.mock() calls at module top level.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Must mock before any imports that use these modules
// ---------------------------------------------------------------------------

vi.mock('next/navigation', () => ({ redirect: vi.fn() }));
vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({ getAll: vi.fn(() => []), set: vi.fn() })),
}));

// ---------------------------------------------------------------------------
// Scenario shapes
// ---------------------------------------------------------------------------

interface GetMyProfileScenario {
  authUser: { id: string; email: string } | null;
  authError: { message: string } | null;
  profileRow: {
    id: string;
    display_name: string;
    avatar_emoji: string | null;
    avatar_url: string | null;
    location: string | null;
    kids_desc: string | null;
    help_tags: string[] | null;
    // line_user_id intentionally kept here to simulate DB row with the field
    line_user_id?: string;
  } | null;
  profileError: { code: string } | null;
}

interface UpdateProfileScenario {
  authUser: { id: string; email: string } | null;
  authError: { message: string } | null;
  updateError: { code: string } | null;
}

interface UploadAvatarScenario {
  authUser: { id: string; email: string } | null;
  authError: { message: string } | null;
  uploadError: { message: string } | null;
  publicUrl: string;
  profileUpdateError: { code: string } | null;
}

let getScenario: GetMyProfileScenario = {
  authUser: null,
  authError: null,
  profileRow: null,
  profileError: null,
};

let updateScenario: UpdateProfileScenario = {
  authUser: null,
  authError: null,
  updateError: null,
};

let uploadScenario: UploadAvatarScenario = {
  authUser: null,
  authError: null,
  uploadError: null,
  publicUrl: 'https://storage.supabase.co/avatars/uid-a/avatar.webp',
  profileUpdateError: null,
};

// Track storage.upload call arguments for verification
const uploadSpy = vi.fn();

// ---------------------------------------------------------------------------
// Supabase client mock
// ---------------------------------------------------------------------------

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    auth: {
      getUser: vi.fn(async () => {
        // Determine active scenario based on which one has authUser set
        const scenario = getScenario.authUser
          ? getScenario
          : updateScenario.authUser
          ? updateScenario
          : uploadScenario;

        if (scenario.authError) {
          return { data: { user: null }, error: scenario.authError };
        }
        if (!scenario.authUser) {
          return { data: { user: null }, error: { message: 'not authenticated' } };
        }
        return { data: { user: scenario.authUser }, error: null };
      }),
    },

    from: (table: string) => {
      // --- getMyProfile paths ---
      if (getScenario.authUser && table === 'profiles') {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({
                data: getScenario.profileRow,
                error: getScenario.profileError,
              }),
            }),
          }),
        };
      }

      // --- updateProfile paths ---
      if (updateScenario.authUser && table === 'profiles') {
        return {
          update: () => ({
            eq: async () => ({ error: updateScenario.updateError }),
          }),
        };
      }

      // --- uploadAvatar profile update (step 5) ---
      if (uploadScenario.authUser && table === 'profiles') {
        return {
          update: () => ({
            eq: async () => ({ error: uploadScenario.profileUpdateError }),
          }),
        };
      }

      return {
        select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null, error: null }) }) }),
        update: () => ({ eq: async () => ({ error: null }) }),
      };
    },

    storage: {
      from: (_bucket: string) => ({
        upload: async (path: string, _file: File, opts: Record<string, unknown>) => {
          // Record call for assertion in upload path/upsert tests
          uploadSpy(path, opts);
          if (uploadScenario.uploadError) {
            return { data: null, error: uploadScenario.uploadError };
          }
          return { data: { path }, error: null };
        },
        getPublicUrl: (_path: string) => ({
          data: { publicUrl: uploadScenario.publicUrl },
        }),
      }),
    },
  })),
}));

vi.mock('@/lib/supabase/server-admin', () => ({
  createAdminClient: vi.fn(() => ({
    from: () => ({
      select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null, error: null }) }) }),
      update: () => ({ eq: async () => ({ error: null }) }),
      insert: async () => ({ error: null }),
    }),
  })),
}));

// ---------------------------------------------------------------------------
// Import actions AFTER mocks (vi.mock hoisting requirement)
// ---------------------------------------------------------------------------

import { getMyProfile, updateProfile, uploadAvatar } from '@/app/actions/profiles';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const USER_A = { id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', email: 'a@example.com' };

const PROFILE_ROW_A = {
  id: USER_A.id,
  display_name: 'Lan Anh',
  avatar_emoji: '👩',
  avatar_url: 'https://storage.supabase.co/avatars/uid-a/avatar.webp',
  location: 'Edogawa',
  kids_desc: 'Bé 3 tuổi',
  help_tags: ['pickup', 'childcare'],
};

// ---------------------------------------------------------------------------
// getMyProfile tests
// ---------------------------------------------------------------------------

describe('getMyProfile', () => {
  beforeEach(() => {
    getScenario = { authUser: null, authError: null, profileRow: null, profileError: null };
    updateScenario = { ...updateScenario, authUser: null };
    uploadScenario = { ...uploadScenario, authUser: null };
  });

  it('returns unauthenticated error when not logged in', async () => {
    // getScenario.authUser remains null
    const result = await getMyProfile();
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('Bạn cần đăng nhập.');
    }
  });

  it('returns error when profile row not found in DB', async () => {
    /**
     * WHY: New user completed auth but onboarding wasn't called yet (rare but
     * possible if session was interrupted). getMyProfile must fail gracefully.
     */
    getScenario.authUser = USER_A;
    getScenario.profileRow = null;
    const result = await getMyProfile();
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain('Không tìm thấy hồ sơ');
    }
  });

  it('returns full profile data on happy path', async () => {
    getScenario.authUser = USER_A;
    getScenario.profileRow = PROFILE_ROW_A;
    const result = await getMyProfile();
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.id).toBe(USER_A.id);
      expect(result.data.display_name).toBe('Lan Anh');
      expect(result.data.avatar_emoji).toBe('👩');
      expect(result.data.location).toBe('Edogawa');
      expect(result.data.help_tags).toEqual(['pickup', 'childcare']);
    }
  });

  it('CONSTITUTION: response does not contain line_user_id even if DB row has it', async () => {
    /**
     * WHY CRITICAL: Constitution Principle 9 — line_user_id is PII and must
     * never be returned to the client. This test simulates a DB row that includes
     * line_user_id (as the real DB table does) and verifies getMyProfile strips it.
     * If this test fails, it means line_user_id is leaking to the client.
     */
    getScenario.authUser = USER_A;
    getScenario.profileRow = {
      ...PROFILE_ROW_A,
      line_user_id: 'U_SENSITIVE_LINE_ID_12345',
    };
    const result = await getMyProfile();
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).not.toHaveProperty('line_user_id');
      // Ensure the raw sensitive value is not anywhere in the response
      expect(JSON.stringify(result.data)).not.toContain('U_SENSITIVE_LINE_ID_12345');
    }
  });
});

// ---------------------------------------------------------------------------
// updateProfile tests
// ---------------------------------------------------------------------------

describe('updateProfile', () => {
  beforeEach(() => {
    updateScenario = { authUser: null, authError: null, updateError: null };
    getScenario = { ...getScenario, authUser: null };
    uploadScenario = { ...uploadScenario, authUser: null };
  });

  it('returns unauthenticated error when not logged in', async () => {
    // updateScenario.authUser remains null
    const result = await updateProfile({ display_name: 'Test' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('Bạn cần đăng nhập.');
    }
  });

  it('rejects empty payload {} — no silent no-op DB writes', async () => {
    updateScenario.authUser = USER_A;
    const result = await updateProfile({});
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain('cập nhật');
    }
  });

  it('returns error when DB update fails', async () => {
    updateScenario.authUser = USER_A;
    updateScenario.updateError = { code: '23503' };
    const result = await updateProfile({ display_name: 'New Name' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain('Không thể cập nhật');
    }
  });

  it('successfully updates display_name', async () => {
    updateScenario.authUser = USER_A;
    const result = await updateProfile({ display_name: 'Nguyen Test' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.updated).toBe(true);
    }
  });

  it('successfully updates help_tags array', async () => {
    updateScenario.authUser = USER_A;
    const result = await updateProfile({ help_tags: ['pickup', 'meal'] });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.updated).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------------
// uploadAvatar tests
// ---------------------------------------------------------------------------

describe('uploadAvatar', () => {
  const makeFile = (size: number, type: string): File => {
    return {
      size,
      type,
      arrayBuffer: async () => new ArrayBuffer(0),
      name: 'avatar.jpg',
      lastModified: Date.now(),
    } as unknown as File;
  };

  beforeEach(() => {
    uploadScenario = {
      authUser: null,
      authError: null,
      uploadError: null,
      publicUrl: `https://storage.supabase.co/avatars/${USER_A.id}/avatar.webp`,
      profileUpdateError: null,
    };
    getScenario = { ...getScenario, authUser: null };
    updateScenario = { ...updateScenario, authUser: null };
    uploadSpy.mockClear();
  });

  it('returns unauthenticated error when not logged in', async () => {
    // uploadScenario.authUser remains null
    const file = makeFile(500 * 1024, 'image/jpeg');
    const result = await uploadAvatar(file);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('Bạn cần đăng nhập.');
    }
  });

  it('rejects file over 2MB with user-friendly message', async () => {
    /**
     * WHY: Large file rejection must happen before the Supabase Storage upload
     * attempt. We should not waste bandwidth uploading files that will be rejected.
     * The error message must match exactly what the UI expects to display.
     */
    uploadScenario.authUser = USER_A;
    const oversizeFile = makeFile(3 * 1024 * 1024, 'image/jpeg'); // 3MB
    const result = await uploadAvatar(oversizeFile);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('File quá lớn. Vui lòng chọn ảnh dưới 2MB.');
    }
  });

  it('rejects invalid file type (PDF) with user-friendly message', async () => {
    uploadScenario.authUser = USER_A;
    const pdfFile = makeFile(100 * 1024, 'application/pdf');
    const result = await uploadAvatar(pdfFile);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('Định dạng file không được hỗ trợ.');
    }
  });

  it('returns error when Supabase Storage upload fails', async () => {
    uploadScenario.authUser = USER_A;
    uploadScenario.uploadError = { message: 'Bucket not found' };
    const file = makeFile(500 * 1024, 'image/jpeg');
    const result = await uploadAvatar(file);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain('Không thể tải ảnh lên');
    }
  });

  it('returns avatar_url on happy path', async () => {
    uploadScenario.authUser = USER_A;
    const file = makeFile(500 * 1024, 'image/jpeg');
    const result = await uploadAvatar(file);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.avatar_url).toContain('https://');
      expect(result.data.avatar_url).toContain('avatar');
    }
  });

  it('upload path uses server-side user.id — not client-controlled', async () => {
    /**
     * WHY SECURITY: If the storage path were constructed from client input,
     * a malicious user could overwrite another user's avatar by guessing their
     * path. The path must always be {auth.user.id}/avatar.webp — computed
     * server-side from the verified JWT.
     */
    uploadScenario.authUser = USER_A;
    const file = makeFile(500 * 1024, 'image/jpeg');
    await uploadAvatar(file);
    expect(uploadSpy).toHaveBeenCalled();
    const [calledPath] = uploadSpy.mock.calls[0] as [string, unknown];
    expect(calledPath).toBe(`${USER_A.id}/avatar.webp`);
  });

  it('passes upsert: true to storage upload — overwrites previous avatar atomically', async () => {
    /**
     * WHY: Without upsert:true, a second upload would fail with "already exists".
     * Users must be able to update their avatar multiple times. upsert:true ensures
     * the new file replaces the old one atomically in the same storage path.
     */
    uploadScenario.authUser = USER_A;
    const file = makeFile(500 * 1024, 'image/jpeg');
    await uploadAvatar(file);
    expect(uploadSpy).toHaveBeenCalled();
    const [, calledOpts] = uploadSpy.mock.calls[0] as [string, { upsert: boolean }];
    expect(calledOpts.upsert).toBe(true);
  });
});

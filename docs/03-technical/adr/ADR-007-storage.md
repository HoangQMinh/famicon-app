---
adr: ADR-007
title: File Storage — Supabase Storage cho avatar
status: ACCEPTED
date: 2026-05-16
decision_ref: D-029
---

# ADR-007 — Storage

## Context

OQ-008 đã resolve (D-029): Supabase Storage, không dùng Cloudflare R2 hay CDN ngoài.

Scope MVP: chỉ avatar. Không có file attachment cho requests (không cần trong MVP).

## Decision

**Supabase Storage cho avatar upload.**

### Bucket setup

```
bucket: avatars
  access: private (RLS controlled)
  allowed MIME types: image/jpeg, image/png, image/webp
  max file size: 2MB
```

### File path convention

```
avatars/{user_id}/avatar.{ext}
```

Overwrite on re-upload (không tích lũy file cũ).

### Upload flow

```typescript
// Server Action — upload avatar
async function uploadAvatar(file: File, userId: string) {
  const ext = file.type.split('/')[1];
  const path = `${userId}/avatar.${ext}`;

  const { error } = await supabase.storage
    .from('avatars')
    .upload(path, file, { upsert: true });

  if (error) throw error;

  // Lưu public URL vào profiles
  const { data: { publicUrl } } = supabase.storage
    .from('avatars')
    .getPublicUrl(path);

  await updateProfile(userId, { avatar_url: publicUrl });
}
```

### RLS cho Storage

```sql
-- User chỉ upload/delete file của chính mình
create policy "Users can manage own avatar"
on storage.objects for all
using (auth.uid()::text = (storage.foldername(name))[1]);

-- Members cùng vòng có thể xem avatar nhau
create policy "Circle members can view avatars"
on storage.objects for select
using (
  exists (
    select 1 from circle_members cm1
    join circle_members cm2 on cm1.circle_id = cm2.circle_id
    where cm1.user_id = auth.uid()
    and cm2.user_id::text = (storage.foldername(name))[1]
  )
);
```

## Emoji avatar fallback

MVP app dùng emoji avatar (như prototype — components.jsx `Avatar`). Upload ảnh thật là optional, không required.

Khi user chưa upload: hiển thị emoji từ `profiles.avatar_emoji`.
Khi user đã upload: hiển thị `<img>` từ Supabase Storage URL.

## Consequences

**Tốt:**
- Stack đồng nhất — không thêm vendor
- Supabase free tier: 1GB storage, 2GB/tháng bandwidth — đủ cho hàng trăm users với avatar 200KB
- Image transform built-in (resize, format)

**Rủi ro:**
- Không có global CDN như Cloudflare — latency từ Nhật tùy Supabase region
- Chọn Supabase region `ap-northeast-1` (Tokyo) để minimize latency

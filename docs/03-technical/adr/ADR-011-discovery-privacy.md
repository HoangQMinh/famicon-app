---
adr: ADR-011
title: Discovery Privacy — Opt-in, radius-based, no exact location
status: ACCEPTED
date: 2026-05-16
decision_ref: D-019, D-020, D-031
open_questions: OQ-014, OQ-016
---

# ADR-011 — Discovery Privacy

## Context

Discovery (Sprint 11-12) cho phép gia đình tìm nhau. Privacy là core concern — người dùng Việt tại Nhật nhạy cảm với việc chia sẻ vị trí với người lạ.

## Decision

### Opt-in by default

Discovery mặc định **OFF** (`is_visible = false`). User phải chủ động bật.

Không có dark pattern "bạn đã được thêm vào Discovery" mà không có action của user.

### Location privacy

**Không lưu tọa độ GPS cụ thể.** Thay vào đó:

1. User nhập khu vực (quận/TP) khi setup Discovery
2. Hệ thống geocode khu vực → centroid tọa độ (ví dụ: "Yokohama" → lat/lng trung tâm Yokohama)
3. Khi hiển thị, tính khoảng cách từ centroid → centroid, làm tròn đến 0.5km
4. Không bao giờ hiển thị tọa độ thô với user

```sql
-- profiles bổ sung khi Discovery build
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS
  location_lat  decimal(9,6),   -- centroid của khu vực (không phải GPS user)
  location_lng  decimal(9,6);
```

### Radius filter (D-031)

User chọn bán kính muốn tìm: 3km / 5km / 10km (default 5km).
Radius này áp dụng cả 2 chiều: bạn tìm người trong bán kính X, và người trong bán kính X của bạn mới thấy bạn.

### Thông tin hiển thị

| Field | Hiển thị | Không hiển thị |
|---|---|---|
| Tên | Tên gia đình (không tên đầy đủ) | Họ + tên đầy đủ |
| Khu vực | Quận / TP | Địa chỉ cụ thể, số nhà |
| Khoảng cách | ~X km (làm tròn 0.5km) | Tọa độ |
| Con nhỏ | Nhóm tuổi (free text) | Ngày sinh |
| Tags giúp đỡ | Loại aid (pickup, childcare...) | — |
| Liên hệ | LINE (qua hand-off) | Email, SĐT, LINE ID trực tiếp |

### "Gửi lời chào" — hand-off LINE (D-012)

Không build in-app messaging. Khi gửi lời chào:
- Mở LINE deeplink hoặc share sheet
- Pre-fill message: "Xin chào! Mình là [tên], gia đình Việt ở [khu vực]..."
- Không lưu message trong DB

OQ-014 (OPEN): Message tùy chọn hay 1-click thuần — quyết Sprint 11.

### Visibility control (OQ-016 OPEN)

Chưa quyết có cho user thấy "bạn đang visible cho N người" hay không. Placeholder trong Settings. Quyết Sprint 11.

## APPI Compliance

- Location data là sensitive info theo APPI — cần explicit consent khi bật Discovery
- Consent UI: checkbox + text rõ ràng trước khi bật
- User có thể tắt Discovery và xoá location data bất kỳ lúc nào

## Consequences

**Tốt:**
- Opt-in + centroid location = privacy-first by design
- Không có exact GPS exposure
- LINE hand-off = không cần manage in-app contact info

**Rủi ro:**
- Centroid geocoding có thể không chính xác cho khu vực nhỏ
- User nhập sai khu vực → distance không đúng — chấp nhận cho MVP

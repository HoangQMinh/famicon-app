---
adr: ADR-002
title: PWA-first, không native app
status: ACCEPTED
date: 2026-05-16
decision_ref: D-008, D-009
---

# ADR-002 — PWA Strategy

## Context

Lifestyle business cần release nhanh và iterate liên tục mà không qua App Store review cycle (1-7 ngày mỗi release). Target user là người Việt tại Nhật — có iOS (LINE-heavy) và Android.

## Decision

**Progressive Web App (PWA) làm primary delivery.**

Cấu hình PWA:
- `manifest.json`: name, icons, theme_color (#FF8966), display=standalone
- Service Worker: cache shell + offline fallback screen
- HTTPS required (Vercel default)
- iOS: `<meta name="apple-mobile-web-app-capable">` để Add to Home Screen

## Web Push trên iOS

iOS Safari hỗ trợ Web Push từ iOS 16.4+ khi user đã "Add to Home Screen". Fallback: LINE Messaging API (D-011, ADR-004).

## Consequences

**Tốt:**
- Zero App Store friction — deploy = live trong phút
- Không cần developer account Apple ($99/năm) để ship
- Same codebase cho iOS + Android + desktop

**Hạn chế:**
- iOS Web Push chỉ hoạt động sau khi Add to Home Screen — onboarding phải hướng dẫn rõ
- Không có push notification trên iOS trước khi Add to Home Screen → LINE fallback (D-011)
- Performance nhẹ hơn native một chút — không đáng kể cho use case này

## Native migration path (D-009)

Khi traction đủ:
1. Wrap bằng Capacitor (Ionic)
2. Native plugins cho camera, contacts nếu cần
3. Submit App Store / Play Store
4. Giữ nguyên Next.js UI code

## PWA Checklist (Sprint 0)

- [ ] manifest.json với icon 192px + 512px
- [ ] Service Worker đăng ký
- [ ] Offline fallback page
- [ ] HTTPS (Vercel default)
- [ ] "Add to Home Screen" prompt flow trong Onboarding

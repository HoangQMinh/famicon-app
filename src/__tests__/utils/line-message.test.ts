/**
 * Unit tests for formatLineMessage — LINE fallback message formatter.
 *
 * WHY: The LINE message is the ONLY notification channel for iOS users not on
 * Add to Home Screen. If the format is wrong (missing 🆘 for urgent, broken
 * URL, PII leak), real families will not be able to respond in time.
 *
 * Constitution constraint: message must NOT contain PII — description is
 * free-text entered by users and routinely contains names, addresses, phone
 * numbers. Only category label (structured) and request URL are included.
 */

import { describe, it, expect } from 'vitest';
import { formatLineMessage } from '@/lib/notifications/helpers';

describe('formatLineMessage', () => {
  // -------------------------------------------------------------------------
  // Normal (non-urgent) request
  // -------------------------------------------------------------------------

  it('formats normal request with [FAMICON] tag (no 🆘)', () => {
    const msg = formatLineMessage({
      id: 'req-123',
      is_urgent: false,
      category: 'pickup',
    });

    expect(msg).toContain('[FAMICON]');
    expect(msg).not.toContain('🆘');
    expect(msg).not.toContain('[FAMICON 🆘 GẤP]');
  });

  it('normal request contains the correct request URL', () => {
    const msg = formatLineMessage({
      id: 'req-123',
      is_urgent: false,
      category: 'pickup',
    });

    expect(msg).toContain('https://famicon.app/requests/req-123');
  });

  it('normal request contains the category label in Vietnamese', () => {
    const msg = formatLineMessage({
      id: 'req-abc',
      is_urgent: false,
      category: 'childcare',
    });

    expect(msg).toContain('trông trẻ');
  });

  // -------------------------------------------------------------------------
  // Urgent request
  // -------------------------------------------------------------------------

  it('formats urgent request with [FAMICON 🆘 GẤP] tag', () => {
    const msg = formatLineMessage({
      id: 'req-456',
      is_urgent: true,
      category: 'childcare',
    });

    expect(msg).toContain('[FAMICON 🆘 GẤP]');
    expect(msg).not.toContain('[FAMICON]\n');
  });

  it('urgent request still contains the request URL', () => {
    const msg = formatLineMessage({
      id: 'req-456',
      is_urgent: true,
      category: 'childcare',
    });

    expect(msg).toContain('https://famicon.app/requests/req-456');
  });

  // -------------------------------------------------------------------------
  // Unknown category fallback
  // -------------------------------------------------------------------------

  it('uses generic label for unknown category', () => {
    const msg = formatLineMessage({
      id: 'req-unk',
      is_urgent: false,
      category: 'nonexistent_category',
    });

    expect(msg).toContain('hỗ trợ');
  });

  // -------------------------------------------------------------------------
  // Constitution compliance: no PII in message
  // -------------------------------------------------------------------------

  it('does NOT include description in message body — description may contain PII', () => {
    const msg = formatLineMessage({
      id: 'req-pii-test',
      is_urgent: false,
      category: 'pickup',
      description: 'Đón bé Minh tại trường Sakura gần ga Nishi-Funabashi lúc 4h',
    });

    expect(msg).not.toContain('Đón bé Minh');
    expect(msg).not.toContain('Sakura');
    expect(msg).not.toContain('Nishi-Funabashi');
  });

  it('does NOT include requester_name in message body', () => {
    const msg = formatLineMessage({
      id: 'req-name-test',
      is_urgent: false,
      category: 'pickup',
      requester_name: 'Nguyễn Thị Bích Loan',
    });

    expect(msg).not.toContain('Nguyễn Thị Bích Loan');
  });

  it('message only contains category label and URL (no user-entered text)', () => {
    const msg = formatLineMessage({
      id: 'req-clean',
      is_urgent: false,
      category: 'borrow',
      description: 'Mượn xe đạp của bà Hoa ở tầng 3',
      requester_name: 'Anh Tuấn',
    });

    // Only structured data allowed
    expect(msg).toContain('mượn đồ');
    expect(msg).toContain('https://famicon.app/requests/req-clean');
    // No user-entered free text
    expect(msg).not.toContain('bà Hoa');
    expect(msg).not.toContain('Anh Tuấn');
    expect(msg).not.toContain('tầng 3');
  });
});

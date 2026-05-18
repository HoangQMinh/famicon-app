import type { ReactNode } from 'react';

// ---------------------------------------------------------------------------
// InfoBlock — reusable detail row used in Request Detail screen.
// ---------------------------------------------------------------------------

interface InfoBlockProps {
  icon: ReactNode;
  label: string;
  value: string;
}

/**
 * InfoBlock — displays a labelled detail row with a leading icon.
 *
 * Used in Request Detail for:
 *   - Thời gian (scheduled_at)
 *   - Địa điểm (location_text)
 *   - Người nhờ (requester_name)
 *
 * CSS classes: fc-info-block, fc-info-block__icon, fc-info-block__label,
 *              fc-info-block__value — defined in globals.css Sprint 7 section.
 *
 * Design spec: icon 20px + label (secondary small) + value (primary bold)
 */
export function InfoBlock({ icon, label, value }: InfoBlockProps) {
  return (
    <div className="fc-info-block">
      <div className="fc-info-block__icon" aria-hidden="true">
        {icon}
      </div>
      <div className="fc-info-block__text">
        <span className="fc-info-block__label">{label}</span>
        <span className="fc-info-block__value">{value}</span>
      </div>
    </div>
  );
}

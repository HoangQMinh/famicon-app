'use client';

// ---------------------------------------------------------------------------
// HelpTagsPicker — multi-select chip picker for help capabilities
// ---------------------------------------------------------------------------

const HELP_TAG_OPTIONS: { value: string; label: string }[] = [
  { value: 'pickup', label: 'Đón con' },
  { value: 'childcare', label: 'Trông con' },
  { value: 'ride', label: 'Chở đi' },
  { value: 'meal', label: 'Nấu ăn' },
  { value: 'other', label: 'Khác' },
];

interface HelpTagsPickerProps {
  value: string[];
  onChange: (tags: string[]) => void;
  disabled?: boolean;
}

/**
 * HelpTagsPicker — 5 chip options, multi-select toggle.
 *
 * No minimum selection (0 tags is valid).
 * Renders any unrecognised tag value from DB as-is (no crash on old data).
 *
 * Selected chip uses .fc-pill--selected class.
 * Constitution: these chips represent capabilities, not contribution records.
 */
export function HelpTagsPicker({ value, onChange, disabled = false }: HelpTagsPickerProps) {
  function toggle(tag: string) {
    if (disabled) return;
    if (value.includes(tag)) {
      onChange(value.filter((t) => t !== tag));
    } else {
      onChange([...value, tag]);
    }
  }

  return (
    <div
      style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}
      role="group"
      aria-label="Khả năng có thể giúp"
    >
      {HELP_TAG_OPTIONS.map((opt) => {
        const selected = value.includes(opt.value);
        return (
          <button
            key={opt.value}
            type="button"
            className={`fc-pill${selected ? ' fc-pill--selected' : ''}`}
            onClick={() => toggle(opt.value)}
            aria-pressed={selected}
            disabled={disabled}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

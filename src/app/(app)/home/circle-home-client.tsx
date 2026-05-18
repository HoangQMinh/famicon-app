'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { TopHeader } from '@/components/layout/top-header';
import { RequestCard } from '@/components/features/request-card';
import { Fab } from '@/components/ui/fab';
import { createClient } from '@/lib/supabase/client';
import type { AidRequestWithProfile } from '@/lib/types';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface CircleHomeClientProps {
  initialRequests: AidRequestWithProfile[];
  circleId: string;
  circleName: string;
  memberCount: number;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * CircleHomeClient — client shell for Circle Home.
 *
 * Handles:
 *   - Local state for requests list (initialized from SSR data)
 *   - Supabase Realtime subscription for INSERT events (ADR-006)
 *   - Reconnect on visibilitychange (iOS WebSocket kill mitigation)
 *   - "Không lần này" — local-only dismiss, no DB write (Constitution P3)
 *
 * States: loading (SSR), empty, error (passed via prop), success (requests list)
 */
export function CircleHomeClient({
  initialRequests,
  circleId,
  circleName,
  memberCount,
}: CircleHomeClientProps) {
  const [requests, setRequests] = useState<AidRequestWithProfile[]>(initialRequests);
  const [realtimeError, setRealtimeError] = useState(false);

  // ---------------------------------------------------------------------------
  // Supabase Realtime subscription (ADR-006)
  // ---------------------------------------------------------------------------

  // Memoize Supabase client to prevent new instance on every render,
  // which would cause subscription churn via unstable dependency reference.
  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;

  const subscribe = useCallback(() => {
    const channel = supabase
      .channel(`circle-${circleId}-requests`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'aid_requests',
          filter: `circle_id=eq.${circleId}`,
        },
        (payload) => {
          // New request received — prepend to list.
          // The realtime payload does not include the profile join,
          // so we create a partial AidRequestWithProfile with safe defaults.
          const newRow = payload.new as {
            id: string;
            circle_id: string;
            requester_id: string;
            category: string;
            description: string;
            scheduled_at: string | null;
            location: string | null;
            is_urgent: boolean;
            status: string;
            created_at: string;
          };

          const newRequest: AidRequestWithProfile = {
            id: newRow.id,
            circle_id: newRow.circle_id,
            requester_id: newRow.requester_id,
            category: newRow.category,
            description: newRow.description,
            scheduled_at: newRow.scheduled_at,
            location_text: newRow.location,
            is_urgent: newRow.is_urgent,
            status: newRow.status,
            created_at: newRow.created_at,
            // Profile fields not available in realtime payload — use fallback.
            // The full profile join is only available via getCircleRequests().
            requester_name: 'Thành viên',
            requester_emoji: null,
          };

          setRequests((prev) => [newRequest, ...prev]);
          setRealtimeError(false);
        }
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          setRealtimeError(true);
        } else {
          setRealtimeError(false);
        }
      });

    return channel;
  }, [circleId]);

  useEffect(() => {
    // Initial subscription
    const channel = subscribe();

    // Re-subscribe when app returns to foreground (iOS WebSocket kill mitigation)
    function handleVisibilityChange() {
      if (!document.hidden) {
        // Supabase will reconnect automatically; calling subscribe() again is safe
        channel.subscribe();
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Critical: cleanup on unmount to prevent memory leaks
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      supabase.removeChannel(channel);
    };
  }, [subscribe]);

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  /**
   * "Không lần này" — local-only dismiss.
   * Per Constitution Principle 3: no notification to asker, no DB persist.
   * Card stays visible (not removed) in this phase — see home-screen.md note.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  function handleDecline(_id: string) {
    // Intentionally no-op in UI state — card remains visible.
    // No DB call, no notification. Per Constitution P3.
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  const subText = `${memberCount} gia đình`;

  return (
    <div className="circle-home">
      {/* TopHeader — always visible */}
      <TopHeader
        title={circleName}
        sub={subText}
        rightHref="/notifications"
      />

      {/* Realtime error banner (non-blocking — data still usable) */}
      {realtimeError && (
        <div
          className="circle-home__realtime-error"
          role="status"
          aria-live="polite"
        >
          Cập nhật tự động tạm gián đoạn. Kéo xuống để làm mới.
        </div>
      )}

      <div className="circle-home__body">
        {/* Section heading */}
        <p className="circle-home__section-heading" aria-live="polite">
          Yêu cầu đang mở ({requests.length})
        </p>

        {/* Empty state */}
        {requests.length === 0 && (
          <div className="empty-state" role="status" aria-label="Chưa có yêu cầu nào">
            <span className="empty-state__icon" aria-hidden="true">🏠</span>
            <h2 className="empty-state__heading">Yên tĩnh hôm nay</h2>
            <p className="empty-state__body">
              Khi ai đó trong vòng cần giúp, bạn sẽ thấy ở đây.
            </p>
          </div>
        )}

        {/* Request cards feed */}
        {requests.length > 0 && (
          <div className="circle-home__feed" role="feed" aria-label="Danh sách yêu cầu">
            {requests.map((req) => (
              <RequestCard
                key={req.id}
                req={req}
                onDecline={handleDecline}
              />
            ))}
          </div>
        )}
      </div>

      {/* FAB — always visible above BottomNav */}
      <Fab />
    </div>
  );
}

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getRequestDetail } from '@/app/actions/requests';
import { RequestDetailClient } from '@/components/features/request-detail-client';

/**
 * Request Detail page — Server Component.
 *
 * Responsibilities:
 *   1. Fetch full request detail via getRequestDetail() — RLS enforced
 *   2. If not found or error → notFound() (renders error.tsx / 404)
 *   3. Render RequestDetailClient with full RequestDetail data
 *
 * URL: /requests/[id]
 * Protected by middleware (PROTECTED_ROUTES includes '/requests').
 */
export const metadata: Metadata = {
  title: 'Chi tiết yêu cầu',
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function RequestDetailPage({ params }: PageProps) {
  const { id } = await params;

  const result = await getRequestDetail(id);

  if (!result.success) {
    // Triggers error.tsx boundary — includes "Thử lại" button
    throw new Error(result.error);
  }

  if (!result.data) {
    notFound();
  }

  return <RequestDetailClient request={result.data} />;
}

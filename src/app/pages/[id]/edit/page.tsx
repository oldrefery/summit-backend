// src/app/pages/[id]/edit/page.tsx
import EditPageClient from './edit-client';

interface EditPagePageProps {
  params: Promise<{ id: string }>;
}

export default async function EditPagePage({ params }: EditPagePageProps) {
  const { id } = await params;

  return <EditPageClient id={id} />;
}

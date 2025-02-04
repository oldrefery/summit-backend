// src/app/events/[id]/edit/page.tsx
import EditEventClient from './edit-client';

interface EditEventPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditEventPage({ params }: EditEventPageProps) {
  const resolvedParams = await params;
  return <EditEventClient id={resolvedParams.id} />;
}

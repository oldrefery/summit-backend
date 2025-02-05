// src/app/events/[id]/edit/page.tsx
import EditEventClient from './edit-client';

interface EditEventPageProps {
  params: {
    id: string;
  };
}

export default function EditEventPage({ params }: EditEventPageProps) {
  return <EditEventClient id={params.id} />;
}

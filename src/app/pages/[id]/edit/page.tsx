// src/app/pages/[id]/edit/page.tsx
import EditPageClient from './edit-client';

interface EditPagePageProps {
  params: {
    id: string;
  };
}

export default function EditPagePage({ params }: EditPagePageProps) {
  return <EditPageClient id={params.id} />;
}

// src/app/pages/new/page.tsx
'use client';

import { useState } from 'react';
import { MarkdownForm } from '@/components/pages/markdown-form';

export default function NewPagePage() {
  const [isFormOpen, setIsFormOpen] = useState(true);

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">Create New Page</h1>
      <MarkdownForm open={isFormOpen} onOpenChangeAction={setIsFormOpen} />
    </div>
  );
}

// src/app/pages/new/page.tsx
'use client';

import { MarkdownForm } from '@/components/pages/markdown-form';

export default function NewMarkdownPage() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">Create New Page</h1>
      <MarkdownForm />
    </div>
  );
}

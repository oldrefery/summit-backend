// src/app/pages/page.tsx
'use client';

import { useMarkdownPages } from '@/hooks/use-markdown';
// ... остальные импорты

export default function MarkdownPagesPage() {
  const { data: pages, isLoading } = useMarkdownPages();
  console.log(pages, isLoading);
}

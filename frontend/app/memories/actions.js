'use server';

import { redirect } from 'next/navigation';
import { createMemory } from '@/lib/memories/service';

function formValue(formData, key, fallback = '') {
  const value = formData.get(key);
  return typeof value === 'string' ? value.trim() : fallback;
}

export async function createMemoryAction(formData) {
  const content = formValue(formData, 'content');
  const type = formValue(formData, 'type', 'note');
  const source = formValue(formData, 'source', 'Dashboard');
  const importance = formValue(formData, 'importance', '75');
  const confidence = formValue(formData, 'confidence', '85');

  if (!content) {
    redirect('/memories/new?error=missing-content');
  }

  try {
    const memory = await createMemory({
      content,
      type,
      source,
      importance,
      confidence,
    });

    redirect(`/memories/${encodeURIComponent(memory.id)}`);
  } catch (error) {
    console.error('createMemoryAction failed:', error);
    redirect('/memories/new?error=create-failed');
  }
}

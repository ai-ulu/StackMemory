'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createMemory, deleteMemory, updateMemory } from '@/lib/memories/service';

function formValue(formData, key, fallback = '') {
  const value = formData.get(key);
  return typeof value === 'string' ? value.trim() : fallback;
}

function revalidateMemoryViews(id) {
  revalidatePath('/dashboard');
  revalidatePath('/memories');
  revalidatePath('/brain');
  revalidatePath('/usage');
  if (id) revalidatePath(`/memories/${id}`);
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

    revalidateMemoryViews(memory.id);
    redirect(`/memories/${encodeURIComponent(memory.id)}`);
  } catch (error) {
    console.error('createMemoryAction failed:', error);
    redirect('/memories/new?error=create-failed');
  }
}

export async function updateMemoryAction(formData) {
  const id = formValue(formData, 'id');
  const content = formValue(formData, 'content');
  const type = formValue(formData, 'type', 'note');
  const source = formValue(formData, 'source', 'Dashboard');
  const confidence = formValue(formData, 'confidence', '85');

  if (!id || !content) {
    redirect(id ? `/memories/${encodeURIComponent(id)}?error=missing-content` : '/memories?error=missing-id');
  }

  try {
    await updateMemory(id, { content, type, source, confidence });
    revalidateMemoryViews(id);
    redirect(`/memories/${encodeURIComponent(id)}?status=updated`);
  } catch (error) {
    console.error('updateMemoryAction failed:', error);
    redirect(`/memories/${encodeURIComponent(id)}?error=update-failed`);
  }
}

export async function deleteMemoryAction(formData) {
  const id = formValue(formData, 'id');

  if (!id) {
    redirect('/memories?error=missing-id');
  }

  try {
    await deleteMemory(id);
    revalidateMemoryViews(id);
    redirect('/memories?status=deleted');
  } catch (error) {
    console.error('deleteMemoryAction failed:', error);
    redirect(`/memories/${encodeURIComponent(id)}?error=delete-failed`);
  }
}

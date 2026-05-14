'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createMemory, deleteMemory, updateMemory } from '@/lib/memories/service';

function formValue(formData, key, fallback = '') {
  const value = formData.get(key);
  return typeof value === 'string' ? value.trim() : fallback;
}

function appendParams(path, params = {}) {
  const entries = Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== '');
  if (!entries.length) return path;
  const separator = path.includes('?') ? '&' : '?';
  return `${path}${separator}${entries.map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`).join('&')}`;
}

function revalidateMemoryViews(id) {
  revalidatePath('/dashboard');
  revalidatePath('/memories');
  revalidatePath('/brain');
  revalidatePath('/usage');
  revalidatePath('/runtime');
  if (id) revalidatePath(`/memories/${id}`);
}

export async function createMemoryAction(formData) {
  const content = formValue(formData, 'content');
  const type = formValue(formData, 'type', 'note');
  const source = formValue(formData, 'source', 'Dashboard');
  const importance = formValue(formData, 'importance', '75');
  const confidence = formValue(formData, 'confidence', '85');
  const namespace = formValue(formData, 'namespace');

  if (!content) {
    redirect(appendParams('/memories/new', { namespace, error: 'missing-content' }));
  }

  try {
    const memory = await createMemory({
      content,
      type,
      source,
      importance,
      confidence,
      namespace,
    });

    revalidateMemoryViews(memory.id);
    redirect(appendParams(`/memories/${encodeURIComponent(memory.id)}`, { namespace }));
  } catch (error) {
    console.error('createMemoryAction failed:', error);
    redirect(appendParams('/memories/new', { namespace, error: 'create-failed' }));
  }
}

export async function updateMemoryAction(formData) {
  const id = formValue(formData, 'id');
  const content = formValue(formData, 'content');
  const type = formValue(formData, 'type', 'note');
  const source = formValue(formData, 'source', 'Dashboard');
  const confidence = formValue(formData, 'confidence', '85');
  const namespace = formValue(formData, 'namespace');

  if (!id || !content) {
    redirect(id
      ? appendParams(`/memories/${encodeURIComponent(id)}`, { namespace, error: 'missing-content' })
      : appendParams('/memories', { namespace, error: 'missing-id' })
    );
  }

  try {
    await updateMemory(id, { content, type, source, confidence, namespace });
    revalidateMemoryViews(id);
    redirect(appendParams(`/memories/${encodeURIComponent(id)}`, { namespace, status: 'updated' }));
  } catch (error) {
    console.error('updateMemoryAction failed:', error);
    redirect(appendParams(`/memories/${encodeURIComponent(id)}`, { namespace, error: 'update-failed' }));
  }
}

export async function deleteMemoryAction(formData) {
  const id = formValue(formData, 'id');
  const namespace = formValue(formData, 'namespace');

  if (!id) {
    redirect(appendParams('/memories', { namespace, error: 'missing-id' }));
  }

  try {
    await deleteMemory(id, { namespace });
    revalidateMemoryViews(id);
    redirect(appendParams('/memories', { namespace, status: 'deleted' }));
  } catch (error) {
    console.error('deleteMemoryAction failed:', error);
    redirect(appendParams(`/memories/${encodeURIComponent(id)}`, { namespace, error: 'delete-failed' }));
  }
}

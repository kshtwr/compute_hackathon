import { useEffect, useState } from "react";
import type { Annotation } from "@/lib/mock-data";
import { mockAnnotations } from "@/lib/mock-data";

const STORAGE_KEY = "annotations";

function loadAnnotations(): Annotation[] {
  if (typeof window === "undefined") return [...mockAnnotations];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [...mockAnnotations];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [...mockAnnotations];
    return parsed as Annotation[];
  } catch {
    return [...mockAnnotations];
  }
}

function saveAnnotations(items: Annotation[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // ignore quota or other storage errors
  }
}

let annotations: Annotation[] = loadAnnotations();
const listeners = new Set<() => void>();

function notify(): void {
  listeners.forEach((cb) => cb());
}

export function getAnnotations(): Annotation[] {
  return annotations;
}

export function subscribe(callback: () => void): () => void {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

export function addAnnotation(
  data: Omit<Annotation, "id" | "timestamp">
): Annotation {
  const id = crypto.randomUUID();
  const timestamp = new Date().toISOString();
  const annotation: Annotation = {
    ...data,
    id,
    timestamp,
  };
  annotations = [annotation, ...annotations];
  saveAnnotations(annotations);
  notify();
  return annotation;
}

export function updateAnnotation(
  id: string,
  patch: Partial<Omit<Annotation, "id">>
): void {
  const index = annotations.findIndex((a) => a.id === id);
  if (index === -1) return;
  annotations = annotations.map((a) =>
    a.id === id ? { ...a, ...patch } : a
  );
  saveAnnotations(annotations);
  notify();
}

export function deleteAnnotation(id: string): void {
  annotations = annotations.filter((a) => a.id !== id);
  saveAnnotations(annotations);
  notify();
}

export type AnnotationStore = {
  annotations: Annotation[];
  addAnnotation: typeof addAnnotation;
  updateAnnotation: typeof updateAnnotation;
  deleteAnnotation: typeof deleteAnnotation;
};

export function useAnnotationStore(): AnnotationStore {
  const [, setTick] = useState(0);
  useEffect(() => {
    return subscribe(() => setTick((n) => n + 1));
  }, []);
  return {
    annotations: getAnnotations(),
    addAnnotation,
    updateAnnotation,
    deleteAnnotation,
  };
}

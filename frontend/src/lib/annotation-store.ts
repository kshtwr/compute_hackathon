import { useEffect, useState } from "react";
import { getCategoryForAnnotation } from "@/lib/category-api";
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

/** If aiCategory is missing or empty, AI classifies it (match existing ≥75% or new category). */
export async function addAnnotation(
  data: Omit<Annotation, "id" | "timestamp">
): Promise<Annotation> {
  let resolved = { ...data };
  if (!data.aiCategory?.trim()) {
    const existingNames = [
      ...new Set(annotations.map((a) => a.aiCategory).filter(Boolean)),
    ];
    try {
      const result = await getCategoryForAnnotation(
        {
          pageTitle: data.pageTitle,
          highlightedText: data.highlightedText,
          stickyNoteContent: data.stickyNoteContent,
        },
        existingNames
      );
      resolved = { ...data, aiCategory: result.category };
    } catch {
      resolved = { ...data, aiCategory: "Uncategorized" };
    }
  }
  const id = crypto.randomUUID();
  const timestamp = new Date().toISOString();
  const annotation: Annotation = {
    ...resolved,
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

/** Fills in aiCategory for an annotation that has none (AI match or new category). */
export async function ensureAnnotationCategory(id: string): Promise<void> {
  const annotation = annotations.find((a) => a.id === id);
  if (!annotation || annotation.aiCategory?.trim()) return;
  const existingNames = [
    ...new Set(
      annotations.filter((a) => a.id !== id).map((a) => a.aiCategory).filter(Boolean)
    ),
  ];
  try {
    const result = await getCategoryForAnnotation(
      {
        pageTitle: annotation.pageTitle,
        highlightedText: annotation.highlightedText,
        stickyNoteContent: annotation.stickyNoteContent,
      },
      existingNames
    );
    updateAnnotation(id, { aiCategory: result.category });
  } catch {
    updateAnnotation(id, { aiCategory: "Uncategorized" });
  }
}

export type AnnotationStore = {
  annotations: Annotation[];
  addAnnotation: typeof addAnnotation;
  updateAnnotation: typeof updateAnnotation;
  deleteAnnotation: typeof deleteAnnotation;
  ensureAnnotationCategory: typeof ensureAnnotationCategory;
};

export function useAnnotationStore(): AnnotationStore {
  const [annotationsState, setAnnotationsState] = useState<Annotation[]>(() =>
    getAnnotations()
  );
  useEffect(() => {
    return subscribe(() => setAnnotationsState(getAnnotations()));
  }, []);
  return {
    annotations: annotationsState,
    addAnnotation,
    updateAnnotation,
    deleteAnnotation,
    ensureAnnotationCategory,
  };
}

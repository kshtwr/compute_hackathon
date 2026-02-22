/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { getCategoryForAnnotation } from "@/lib/category-api";
import type { Annotation } from "@/lib/mock-data";
import { supabase } from "./supabase";

const MOCK_USER_ID = '00000000-0000-0000-0000-000000000000';

let annotations: Annotation[] = [];
let isLoaded = false;
const listeners = new Set<() => void>();

function notify(): void {
  listeners.forEach((cb) => cb());
}

// Map from DB format to Frontend format
function mapToFrontend(row: any): Annotation {
  // Extract a quick favicon approximation from the URL origin
  let faviconUrl = "";
  try {
    const urlObj = new URL(row.website_url);
    faviconUrl = `${urlObj.origin}/favicon.ico`;
  } catch (e) {
    // leave empty if invalid URL
  }

  return {
    id: row.id,
    websiteUrl: row.website_url,
    pageTitle: row.page_title,
    favicon: faviconUrl,
    annotationType: row.annotation_type,
    highlightedText: row.highlighted_text,
    stickyNoteContent: row.sticky_note_content,
    color: row.color || 'yellow',
    timestamp: row.timestamp,
    aiCategory: row.ai_category || "",
    aiTags: row.ai_tags || [],
  };
}

// Map from Frontend format to DB format
function mapToDB(a: Annotation): any {
  return {
    id: a.id,
    user_id: MOCK_USER_ID,
    website_url: a.websiteUrl,
    page_title: a.pageTitle,
    annotation_type: a.annotationType,
    highlighted_text: a.highlightedText || null,
    sticky_note_content: a.stickyNoteContent || null,
    color: a.color,
    timestamp: a.timestamp,
    ai_category: a.aiCategory,
    ai_tags: a.aiTags,
  };
}

export async function fetchAnnotations() {
  const { data, error } = await supabase
    .from('annotations')
    .select('*')
    .eq('user_id', MOCK_USER_ID)
    .order('timestamp', { ascending: false });

  if (error) {
    console.error("Error fetching annotations:", error);
    return;
  }

  annotations = data.map(mapToFrontend);
  isLoaded = true;
  notify();
}

export function getAnnotations(): Annotation[] {
  return annotations;
}

export function subscribe(callback: () => void): () => void {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

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

  // Optimistic UI update
  annotations = [annotation, ...annotations];
  notify();

  // Persist to DB
  await supabase.from('annotations').insert([mapToDB(annotation)]);

  return annotation;
}

export async function updateAnnotation(
  id: string,
  patch: Partial<Omit<Annotation, "id">>
): Promise<void> {
  const index = annotations.findIndex((a) => a.id === id);
  if (index === -1) return;

  const updatedAnnotation = { ...annotations[index], ...patch };

  // Optimistic UI update
  annotations = annotations.map((a) =>
    a.id === id ? updatedAnnotation : a
  );
  notify();

  // Create patch for DB
  const dbPatch: any = {};
  if (patch.websiteUrl !== undefined) dbPatch.website_url = patch.websiteUrl;
  if (patch.pageTitle !== undefined) dbPatch.page_title = patch.pageTitle;
  if (patch.annotationType !== undefined) dbPatch.annotation_type = patch.annotationType;
  if (patch.highlightedText !== undefined) dbPatch.highlighted_text = patch.highlightedText;
  if (patch.stickyNoteContent !== undefined) dbPatch.sticky_note_content = patch.stickyNoteContent;
  if (patch.color !== undefined) dbPatch.color = patch.color;
  if (patch.aiCategory !== undefined) dbPatch.ai_category = patch.aiCategory;
  if (patch.aiTags !== undefined) dbPatch.ai_tags = patch.aiTags;

  // Persist to DB
  await supabase.from('annotations').update(dbPatch).eq('id', id);
}

export async function deleteAnnotation(id: string): Promise<void> {
  // Optimistic UI update
  annotations = annotations.filter((a) => a.id !== id);
  notify();

  // Persist to DB
  await supabase.from('annotations').delete().eq('id', id);
}

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
    await updateAnnotation(id, { aiCategory: result.category });
  } catch {
    await updateAnnotation(id, { aiCategory: "Uncategorized" });
  }
}

export type AnnotationStore = {
  annotations: Annotation[];
  addAnnotation: typeof addAnnotation;
  updateAnnotation: typeof updateAnnotation;
  deleteAnnotation: typeof deleteAnnotation;
  ensureAnnotationCategory: typeof ensureAnnotationCategory;
  refreshAnnotations: () => void;
};

export function useAnnotationStore(): AnnotationStore {
  const [annotationsState, setAnnotationsState] = useState<Annotation[]>(() =>
    getAnnotations()
  );

  useEffect(() => {
    if (!isLoaded) {
      fetchAnnotations();
    }
    return subscribe(() => setAnnotationsState(getAnnotations()));
  }, []);

  return {
    annotations: annotationsState,
    addAnnotation,
    updateAnnotation,
    deleteAnnotation,
    ensureAnnotationCategory,
    refreshAnnotations: fetchAnnotations
  };
}

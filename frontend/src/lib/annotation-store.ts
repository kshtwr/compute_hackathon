/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { getCategoryForAnnotation } from "@/lib/category-api";
import { getIconAndColor } from "@/lib/categories";
import type { Annotation, Category } from "@/lib/mock-data";
import { supabase } from "./supabase";

const MOCK_USER_ID = '00000000-0000-0000-0000-000000000000';

let annotations: Annotation[] = [];
let dbCategories: Category[] = [];
let isLoaded = false;
let isFetching = false;
let syncPromise = Promise.resolve();
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

// Force all database syncing to execute sequentially to prevent race conditions
function syncCategoriesToDB(currentAnnotations: Annotation[]) {
  syncPromise = syncPromise.then(async () => {
    const categoryCounts = new Map<string, number>();
    for (const a of currentAnnotations) {
      const name = a.aiCategory?.trim() || "Uncategorized";
      categoryCounts.set(name, (categoryCounts.get(name) || 0) + 1);
    }

    const { data: existing } = await supabase.from('categories').select('*').eq('user_id', MOCK_USER_ID);
    const existingMap = new Map((existing || []).map((c: any) => [c.name, c]));

    for (const [name, count] of categoryCounts.entries()) {
      if (existingMap.has(name)) {
        const cat = existingMap.get(name);
        if (cat.annotation_count !== count) {
          await supabase.from('categories').update({ annotation_count: count }).eq('id', cat.id);
        }
        existingMap.delete(name);
      } else {
        await supabase.from('categories').insert([{
          id: crypto.randomUUID(),
          user_id: MOCK_USER_ID,
          name: name,
          description: "",
          annotation_count: count
        }]);
      }
    }

    for (const cat of existingMap.values()) {
      await supabase.from('categories').delete().eq('id', cat.id);
    }

    // Refresh the local cache of categories after syncing
    const { data: updatedCategories } = await supabase.from('categories').select('*').eq('user_id', MOCK_USER_ID).order('annotation_count', { ascending: false });
    if (updatedCategories) {
      dbCategories = updatedCategories.map((c: any) => ({
        name: c.name,
        count: c.annotation_count,
        ...getIconAndColor(c.name)
      }));
      notify();
    }
  }).catch(console.error);
}

export async function fetchAnnotations() {
  if (isLoaded || isFetching) return;
  isFetching = true;

  const { data, error } = await supabase
    .from('annotations')
    .select('*')
    .eq('user_id', MOCK_USER_ID)
    .order('timestamp', { ascending: false });

  if (error) {
    console.error("Error fetching annotations:", error);
    isFetching = false;
    return;
  }

  annotations = data.map(mapToFrontend);
  isLoaded = true;
  isFetching = false;
  notify();
  syncCategoriesToDB(annotations);
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
  syncCategoriesToDB(annotations);

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
  syncCategoriesToDB(annotations);
}

export async function deleteAnnotation(id: string): Promise<void> {
  // Optimistic UI update
  annotations = annotations.filter((a) => a.id !== id);
  notify();

  // Persist to DB
  await supabase.from('annotations').delete().eq('id', id);
  syncCategoriesToDB(annotations);
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
};

export function useAnnotationStore() {
  const [data, setData] = useState(annotations);
  const [cats, setCats] = useState(dbCategories);

  useEffect(() => {
    if (!isLoaded && !isFetching) {
      fetchAnnotations();
    }
    const update = () => {
      setData([...annotations]);
      setCats([...dbCategories]);
    };
    listeners.add(update);
    return () => {
      listeners.delete(update);
    };
  }, []);

  return {
    annotations: data,
    categories: cats,
    addAnnotation,
    updateAnnotation,
    deleteAnnotation,
    ensureAnnotationCategory,
  };
}

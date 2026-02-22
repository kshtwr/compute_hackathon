export interface Annotation {
  id: string;
  websiteUrl: string;
  pageTitle: string;
  favicon: string;
  annotationType: "highlight" | "sticky-note";
  highlightedText?: string;
  stickyNoteContent?: string;
  color: string;
  timestamp: string;
  aiCategory: string;
  aiTags: string[];
}

export interface Category {
  name: string;
  count: number;
  icon: string;
  color: string;
}



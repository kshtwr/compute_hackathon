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

export const mockAnnotations: Annotation[] = [
  {
    id: "1",
    websiteUrl: "https://arxiv.org/abs/2401.12345",
    pageTitle: "Attention Is All You Need - Revisited",
    favicon: "https://arxiv.org/favicon.ico",
    annotationType: "highlight",
    highlightedText: "The dominant sequence transduction models are based on complex recurrent or convolutional neural networks that include an encoder and a decoder.",
    color: "yellow",
    timestamp: "2026-02-21T10:30:00Z",
    aiCategory: "Machine Learning",
    aiTags: ["transformers", "deep-learning", "NLP"],
  },
  {
    id: "2",
    websiteUrl: "https://paulgraham.com/greatwork.html",
    pageTitle: "How to Do Great Work - Paul Graham",
    favicon: "https://paulgraham.com/favicon.ico",
    annotationType: "sticky-note",
    stickyNoteContent: "This resonates with my experience — curiosity-driven work always yields the most interesting results. Need to revisit this when planning Q2 projects.",
    color: "orange",
    timestamp: "2026-02-21T09:15:00Z",
    aiCategory: "Productivity",
    aiTags: ["career", "creativity", "motivation"],
  },
  {
    id: "3",
    websiteUrl: "https://en.wikipedia.org/wiki/Nalanda",
    pageTitle: "Nalanda - Wikipedia",
    favicon: "https://en.wikipedia.org/favicon.ico",
    annotationType: "highlight",
    highlightedText: "Nalanda was an acclaimed Mahavihara, a large Buddhist monastery and university, in the ancient kingdom of Magadha in what is now Bihar, India.",
    stickyNoteContent: "Great name inspiration for our project!",
    color: "blue",
    timestamp: "2026-02-20T16:45:00Z",
    aiCategory: "History",
    aiTags: ["education", "ancient-india", "university"],
  },
  {
    id: "4",
    websiteUrl: "https://www.nngroup.com/articles/situated-cognition/",
    pageTitle: "Situated Cognition and the Design of Information",
    favicon: "https://www.nngroup.com/favicon.ico",
    annotationType: "highlight",
    highlightedText: "Knowledge is not something that can be simply transferred from one context to another without loss of meaning. The environment in which we learn is integral to what we learn.",
    color: "green",
    timestamp: "2026-02-20T14:20:00Z",
    aiCategory: "UX Research",
    aiTags: ["cognition", "context", "design-theory"],
  },
  {
    id: "5",
    websiteUrl: "https://stripe.com/docs/payments/accept-a-payment",
    pageTitle: "Accept a Payment - Stripe Documentation",
    favicon: "https://stripe.com/favicon.ico",
    annotationType: "sticky-note",
    stickyNoteContent: "Use PaymentIntent API for the checkout flow. Remember to handle webhook for async payment confirmations.",
    color: "pink",
    timestamp: "2026-02-19T11:00:00Z",
    aiCategory: "Web Development",
    aiTags: ["payments", "API", "stripe"],
  },
  {
    id: "6",
    websiteUrl: "https://www.nature.com/articles/d41586-024-00001-1",
    pageTitle: "The Race to Build a Better AI Brain",
    favicon: "https://www.nature.com/favicon.ico",
    annotationType: "highlight",
    highlightedText: "Researchers are exploring neuromorphic computing architectures that mimic the brain's structure, promising dramatic improvements in energy efficiency.",
    color: "yellow",
    timestamp: "2026-02-19T08:30:00Z",
    aiCategory: "Machine Learning",
    aiTags: ["neuromorphic", "hardware", "research"],
  },
  {
    id: "7",
    websiteUrl: "https://fs.blog/mental-models/",
    pageTitle: "Mental Models: The Best Way to Make Intelligent Decisions",
    favicon: "https://fs.blog/favicon.ico",
    annotationType: "sticky-note",
    stickyNoteContent: "Inversion and second-order thinking are the two I use most. Should compile a personal toolkit of the top 10 models.",
    color: "orange",
    timestamp: "2026-02-18T19:45:00Z",
    aiCategory: "Critical Thinking",
    aiTags: ["mental-models", "decision-making", "frameworks"],
  },
  {
    id: "8",
    websiteUrl: "https://designsystem.gov/",
    pageTitle: "U.S. Web Design System",
    favicon: "https://designsystem.gov/favicon.ico",
    annotationType: "highlight",
    highlightedText: "Design tokens are the visual design atoms of the design system — specifically, they are named entities that store visual design attributes.",
    color: "green",
    timestamp: "2026-02-18T13:10:00Z",
    aiCategory: "Design Systems",
    aiTags: ["tokens", "accessibility", "UI"],
  },
];

export const mockCategories: Category[] = [
  { name: "Machine Learning", count: 12, icon: "🧠", color: "yellow" },
  { name: "Productivity", count: 8, icon: "⚡", color: "orange" },
  { name: "UX Research", count: 6, icon: "🔬", color: "green" },
  { name: "Web Development", count: 9, icon: "💻", color: "blue" },
  { name: "History", count: 4, icon: "📜", color: "blue" },
  { name: "Critical Thinking", count: 5, icon: "🎯", color: "orange" },
  { name: "Design Systems", count: 7, icon: "🎨", color: "pink" },
];

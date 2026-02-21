# Product Requirements Document: Nalanda

## Project Overview

*Name:* Nalanda  
*Tagline:* Your Personal Internet Library - Annotate the Web, Organize Your Thoughts  
*Hackathon Theme:* Intelligent Human-Computer Interfaces / Generative User Interfaces  
*Timeline:* 2 hours remaining  
*Target Users:* General consumers who want to capture and organize knowledge from across the web

## Problem Statement

The internet is a vast library of ideas, but current note-taking and bookmarking tools force users to extract information from its original context. When we clip content into separate databases or note-taking apps, we lose the *situated nature of cognition* - the context and environment where ideas originated. This disconnection makes it harder to remember, understand, and build upon information.

## Solution

Nalanda transforms the entire internet into your personal library by enabling *in-context webpage annotations*. Users can highlight text and add sticky note annotations directly on any webpage (as a glass layer overlay), with all annotations stored and organized in a central dashboard hub. This preserves the situational context of knowledge while providing intelligent organization.

## Core Value Proposition

- *Situate Your Cognition:* Keep thoughts and notes exactly where you found the information
- *Your Internet, Your Library:* Build a personalized knowledge base across the entire web
- *Intelligent Organization:* AI automatically categorizes and connects your annotations
- *Generative UI:* Dashboard adapts to your browsing and annotation patterns

---

## MVP Feature Set (Hackathon Scope)

### 1. Browser Extension - Web Annotator
*Priority:* CRITICAL (P0)

*Functionality:*
- Inject a glass-layer overlay on any webpage the user visits
- *Highlight Tool:* Select text on webpage and highlight it (multiple color options)
- *Sticky Note Tool:* Click anywhere to add a sticky note annotation with custom text
- Visual indicators showing existing annotations when revisiting pages
- Simple, non-intrusive UI that doesn't interfere with webpage content

*Technical Implementation:*
- Chrome/Firefox browser extension (content script injection)
- Captures annotation data and packages into JSON schema
- Sends data to central hub via API

*JSON Schema for Annotations:*
json
{
  "annotationId": "uuid",
  "userId": "user-id",
  "websiteUrl": "https://example.com/page",
  "pageTitle": "Page Title",
  "timestamp": "ISO-8601 timestamp",
  "annotationType": "highlight | sticky-note",
  "highlightedText": "Selected text content",
  "stickyNoteContent": "User's note text",
  "position": {
    "xpath": "DOM xpath",
    "offset": "character offset"
  },
  "color": "#hex-color",
  "tags": ["auto-generated-tags"]
}


### 2. Central Hub Dashboard
*Priority:* CRITICAL (P0)

*Core Views:*

*A. Home/Overview*
- Total annotation count
- Recent annotations (last 10)
- Top categories/topics (AI-generated)
- Quick search bar

*B. All Annotations View*
- Card-based layout showing all annotations
- Each card displays:
  - Website favicon and title
  - Highlighted text (if applicable)
  - Sticky note content
  - Timestamp
  - AI-generated category tag
  - Link to source webpage
- Filter by:
  - Date range
  - Website/domain
  - Category
  - Annotation type

*C. Collections/Categories View*
- AI-organized groupings of related annotations
- Visual representation (grid or list)
- Click into category to see all related annotations

### 3. AI-Powered Organization (Generative UI Core)
*Priority:* CRITICAL (P0) - This is your hackathon differentiator

*Auto-Categorization:*
- When annotation is created, AI analyzes:
  - Highlighted text content
  - Sticky note content
  - Webpage context (title, domain, meta description)
- Generates semantic category tags (e.g., "Machine Learning", "Product Design", "Philosophy")
- Groups similar annotations into collections

*Intelligent Features:*
- *Smart Suggestions:* "You might also be interested in..." based on current annotation context
- *Connection Discovery:* Surface related annotations when viewing a specific one
- *Adaptive Layout:* Dashboard reorganizes to show most relevant categories based on recent activity

*Technical Implementation:*
- Use Claude API (Anthropic) for text analysis and categorization
- Prompt engineering to extract topics, themes, and generate category names
- Real-time processing as annotations are created

### 4. Search & Filter
*Priority:* HIGH (P0)

*Search Capabilities:*
- Full-text search across:
  - Highlighted text
  - Sticky note content
  - Website titles
  - AI-generated tags
- Instant results as you type
- Search result cards show context and allow direct navigation to source

*Filter Options:*
- By date (today, this week, this month, custom range)
- By website/domain
- By AI-generated category
- By annotation type (highlights vs sticky notes)

---

## Technical Architecture

### Tech Stack Recommendations for Lovable

*Frontend (Dashboard):*
- React with TypeScript
- Tailwind CSS for styling
- Lucide React for icons
- Recharts for any data visualizations (annotation trends)

*Browser Extension:*
- Vanilla JavaScript (content scripts)
- Chrome Extension Manifest V3
- Message passing to communicate with dashboard

*Backend:*
- Python with FastAPI or Flask
- PostgreSQL database
- SQLAlchemy ORM for database operations
- Anthropic Python SDK for AI categorization
- CORS middleware for browser extension communication

*Database Schema:*
sql
-- Users table
users (
  id UUID PRIMARY KEY,
  email TEXT,
  created_at TIMESTAMP
)

-- Annotations table
annotations (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  website_url TEXT,
  page_title TEXT,
  annotation_type TEXT, -- 'highlight' or 'sticky-note'
  highlighted_text TEXT,
  sticky_note_content TEXT,
  position JSONB,
  color TEXT,
  timestamp TIMESTAMP,
  ai_category TEXT,
  ai_tags TEXT[]
)

-- Categories table (AI-generated)
categories (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  name TEXT,
  description TEXT,
  annotation_count INTEGER
)


### API Endpoints

*POST /api/annotations*
- Create new annotation
- Trigger AI categorization
- Return annotation with AI-generated tags

*GET /api/annotations*
- Query params: userId, category, dateRange, searchQuery
- Return filtered/searched annotations

*GET /api/annotations/:websiteUrl*
- Get all annotations for specific URL
- Used by extension when revisiting pages

*GET /api/categories*
- Get AI-generated categories for user
- Include annotation counts

*POST /api/ai/categorize*
- Analyze annotation content
- Return suggested categories and tags

### Python Backend Implementation

*FastAPI Application Structure:*
python
# main.py
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from anthropic import Anthropic
import os
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel
import uvicorn

app = FastAPI()

# CORS for browser extension
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Anthropic client
anthropic = Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))

# Pydantic models
class AnnotationCreate(BaseModel):
    user_id: str
    website_url: str
    page_title: str
    annotation_type: str
    highlighted_text: Optional[str] = None
    sticky_note_content: Optional[str] = None
    position: dict
    color: str

class AnnotationResponse(BaseModel):
    id: str
    user_id: str
    website_url: str
    page_title: str
    annotation_type: str
    highlighted_text: Optional[str]
    sticky_note_content: Optional[str]
    position: dict
    color: str
    timestamp: datetime
    ai_category: str
    ai_tags: List[str]

# AI Categorization Function
async def categorize_annotation(annotation: AnnotationCreate) -> tuple[str, List[str]]:
    """Use Claude to categorize annotation and generate tags"""
    
    content = f"""
    Website: {annotation.page_title} ({annotation.website_url})
    Highlighted Text: {annotation.highlighted_text or 'N/A'}
    User Note: {annotation.sticky_note_content or 'N/A'}
    
    Analyze this web annotation and provide:
    1. A single primary category (2-3 words, e.g., "Machine Learning", "Product Design")
    2. 2-3 relevant tags
    
    Format your response as JSON:
    {{"category": "Primary Category", "tags": ["tag1", "tag2", "tag3"]}}
    """
    
    message = anthropic.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=200,
        messages=[
            {"role": "user", "content": content}
        ]
    )
    
    # Parse response (add error handling in production)
    import json
    result = json.loads(message.content[0].text)
    return result["category"], result["tags"]

# Endpoints
@app.post("/api/annotations", response_model=AnnotationResponse)
async def create_annotation(annotation: AnnotationCreate, db: Session = Depends(get_db)):
    """Create new annotation with AI categorization"""
    
    # Get AI categorization
    category, tags = await categorize_annotation(annotation)
    
    # Create database record
    db_annotation = Annotation(
        user_id=annotation.user_id,
        website_url=annotation.website_url,
        page_title=annotation.page_title,
        annotation_type=annotation.annotation_type,
        highlighted_text=annotation.highlighted_text,
        sticky_note_content=annotation.sticky_note_content,
        position=annotation.position,
        color=annotation.color,
        timestamp=datetime.utcnow(),
        ai_category=category,
        ai_tags=tags
    )
    
    db.add(db_annotation)
    db.commit()
    db.refresh(db_annotation)
    
    return db_annotation

@app.get("/api/annotations", response_model=List[AnnotationResponse])
async def get_annotations(
    user_id: str,
    category: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get annotations with optional filtering"""
    
    query = db.query(Annotation).filter(Annotation.user_id == user_id)
    
    if category:
        query = query.filter(Annotation.ai_category == category)
    
    if search:
        query = query.filter(
            (Annotation.highlighted_text.contains(search)) |
            (Annotation.sticky_note_content.contains(search)) |
            (Annotation.page_title.contains(search))
        )
    
    return query.order_by(Annotation.timestamp.desc()).all()

@app.get("/api/annotations/by-url")
async def get_annotations_by_url(
    user_id: str,
    website_url: str,
    db: Session = Depends(get_db)
):
    """Get all annotations for a specific URL"""
    
    annotations = db.query(Annotation).filter(
        Annotation.user_id == user_id,
        Annotation.website_url == website_url
    ).all()
    
    return annotations

@app.get("/api/categories")
async def get_categories(user_id: str, db: Session = Depends(get_db)):
    """Get AI-generated categories with counts"""
    
    from sqlalchemy import func
    
    categories = db.query(
        Annotation.ai_category,
        func.count(Annotation.id).label('count')
    ).filter(
        Annotation.user_id == user_id
    ).group_by(
        Annotation.ai_category
    ).all()
    
    return [{"name": cat, "count": count} for cat, count in categories]

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)


*Database Models (SQLAlchemy):*
python
# models.py
from sqlalchemy import Column, String, Text, TIMESTAMP, ARRAY, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.ext.declarative import declarative_base
import uuid

Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True)
    created_at = Column(TIMESTAMP, default=datetime.utcnow)

class Annotation(Base):
    __tablename__ = "annotations"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), nullable=False)
    website_url = Column(Text, nullable=False)
    page_title = Column(Text)
    annotation_type = Column(String, nullable=False)  # 'highlight' or 'sticky-note'
    highlighted_text = Column(Text)
    sticky_note_content = Column(Text)
    position = Column(JSON)
    color = Column(String)
    timestamp = Column(TIMESTAMP, default=datetime.utcnow)
    ai_category = Column(String)
    ai_tags = Column(ARRAY(String))

class Category(Base):
    __tablename__ = "categories"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), nullable=False)
    name = Column(String, nullable=False)
    description = Column(Text)
    annotation_count = Column(Integer, default=0)


*Database Connection:*
python
# database.py
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import os

DATABASE_URL = os.environ.get("DATABASE_URL", "postgresql://user:password@localhost/nalanda")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


*Requirements.txt:*

fastapi==0.104.1
uvicorn==0.24.0
sqlalchemy==2.0.23
psycopg2-binary==2.9.9
anthropic==0.7.1
pydantic==2.5.0
python-multipart==0.0.6


---

## User Flow

### First-Time User Flow
1. User installs browser extension
2. User signs up/logs in (simple email auth or guest mode)
3. Extension shows onboarding tooltip on any webpage
4. User creates first annotation (highlight or sticky note)
5. Dashboard opens automatically showing the new annotation
6. AI categorization happens in background
7. User sees their first category created

### Returning User Flow
1. User browses the web normally
2. Encounters interesting content
3. Clicks extension icon or uses keyboard shortcut
4. Highlights text and/or adds sticky note
5. Annotation saved and AI-categorized instantly
6. User can continue browsing or visit dashboard
7. Dashboard shows updated categories and suggestions

### Dashboard Exploration Flow
1. User opens dashboard
2. Sees overview with recent annotations and top categories
3. Uses search to find specific content
4. Clicks into AI-generated category to explore related ideas
5. Sees "Related Annotations" suggestions for deeper exploration
6. Clicks source link to revisit original webpage with annotations intact

---

## Generative UI Elements (Hackathon Theme Alignment)

### 1. Dynamic Category Generation
- AI creates new categories based on user's annotation patterns
- Categories evolve as more annotations are added
- Dashboard layout adapts to show emerging themes

### 2. Contextual Suggestions
- When viewing an annotation, AI suggests related annotations
- "People who annotated this also found these interesting"
- Smart connections between seemingly unrelated topics

### 3. Adaptive Dashboard Layout
- Most active categories move to top
- Recent browsing patterns influence what's surfaced
- Time-based patterns (e.g., show work-related categories during work hours)

### 4. Visual Knowledge Graph (Stretch Goal)
- Interactive graph showing connections between annotations
- Nodes = annotations, edges = AI-detected relationships
- Click nodes to navigate between related ideas

---

## UI/UX Guidelines

### Design Principles
1. *Minimal Friction:* Annotation should be as fast as thinking
2. *Context Preservation:* Always show source webpage context
3. *Intelligent Defaults:* AI does the organizing, user can override
4. *Visual Clarity:* Clear hierarchy and information architecture

### Color Palette
- Primary: Deep blue (#2563EB) - trust, knowledge
- Secondary: Warm amber (#F59E0B) - highlights, attention
- Background: Clean white/light gray (#F9FAFB)
- Accent: Various colors for highlight options

### Typography
- Headings: Inter or similar modern sans-serif
- Body: System font stack for performance
- Annotations: Slightly larger font for readability

---

## Success Metrics (Hackathon Judging Criteria)

### Innovation
- *Generative UI:* AI-powered categorization and adaptive dashboard
- *Situated Cognition:* Unique approach to knowledge management
- *Seamless Integration:* Browser extension + centralized hub

### Technical Implementation
- *Full-stack functionality:* Extension + Dashboard + AI integration
- *Real-time updates:* Instant annotation capture and categorization
- *Clean architecture:* Well-structured code and API design

### User Experience
- *Intuitive annotation:* Easy to use on any webpage
- *Intelligent organization:* AI removes cognitive load
- *Beautiful UI:* Polished dashboard design

### Hackathon Theme Alignment
- *Adaptive Interface:* Dashboard responds to user behavior
- *Intelligent Categorization:* Interface generates new structure based on content
- *Contextual Intelligence:* Suggestions and connections emerge from usage

---

## MVP Development Priorities (2-Hour Sprint)

Given the time constraint, here's the critical path:

### Hour 1: Core Infrastructure
*Minutes 1-20:* Backend Setup
- Set up Python FastAPI project
- Create database schema with SQLAlchemy
- Set up PostgreSQL connection
- Implement basic CORS for extension communication
- Create API endpoints shell

*Minutes 21-40:* Browser Extension Shell
- Create manifest.json
- Basic content script injection
- Capture highlighted text
- Send to Python API (test with curl/Postman first)

*Minutes 41-60:* Dashboard Foundation
- Create React app in Lovable
- Build annotation card component
- Connect to Python backend API
- Basic search functionality

### Hour 2: AI Integration & Polish
*Minutes 61-80:* AI Categorization
- Integrate Claude API
- Create categorization prompt
- Process annotations and generate categories
- Display categories in dashboard

*Minutes 81-100:* Generative UI Features
- Implement category view
- Add "Related Annotations" suggestions
- Dynamic category display based on frequency

*Minutes 101-120:* Demo Polish
- Test end-to-end flow
- Fix critical bugs
- Prepare demo narrative
- Screenshot/record demo

---

## Python Backend Quick Start

### Local Development Setup

bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set environment variables
export ANTHROPIC_API_KEY="your-api-key"
export DATABASE_URL="postgresql://user:password@localhost/nalanda"

# Initialize database
python init_db.py

# Run server
uvicorn main:app --reload --port 8000


*init_db.py:*
python
from database import engine
from models import Base

# Create all tables
Base.metadata.create_all(bind=engine)
print("Database initialized!")


### Testing API Endpoints

bash
# Test annotation creation
curl -X POST http://localhost:8000/api/annotations \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "test-user",
    "website_url": "https://example.com",
    "page_title": "Example Page",
    "annotation_type": "highlight",
    "highlighted_text": "Important text here",
    "sticky_note_content": "My thoughts",
    "position": {"xpath": "/html/body/p[1]", "offset": 0},
    "color": "#FFEB3B"
  }'

# Get annotations
curl http://localhost:8000/api/annotations?user_id=test-user

# Get categories
curl http://localhost:8000/api/categories?user_id=test-user


### Deployment Options

*Option 1: Railway*
- Connect GitHub repo
- Add PostgreSQL plugin
- Set ANTHROPIC_API_KEY environment variable
- Railway auto-detects Python and deploys

*Option 2: Render*
- Create new Web Service
- Connect repository
- Add PostgreSQL database
- Set environment variables
- Deploy

*Option 3: DigitalOcean App Platform*
- Create new app from GitHub
- Add managed PostgreSQL
- Configure environment variables
- Deploy

---

## Frontend-Backend Integration

*React Frontend API Client:*
typescript
// api.ts
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

export interface Annotation {
  id: string;
  user_id: string;
  website_url: string;
  page_title: string;
  annotation_type: string;
  highlighted_text?: string;
  sticky_note_content?: string;
  position: any;
  color: string;
  timestamp: string;
  ai_category: string;
  ai_tags: string[];
}

export const createAnnotation = async (data: any): Promise<Annotation> => {
  const response = await fetch(`${API_BASE_URL}/api/annotations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return response.json();
};

export const getAnnotations = async (
  userId: string,
  filters?: { category?: string; search?: string }
): Promise<Annotation[]> => {
  const params = new URLSearchParams({ user_id: userId, ...filters });
  const response = await fetch(`${API_BASE_URL}/api/annotations?${params}`);
  return response.json();
};

export const getCategories = async (userId: string) => {
  const response = await fetch(`${API_BASE_URL}/api/categories?user_id=${userId}`);
  return response.json();
};


*Browser Extension Communication:*
javascript
// content.js (in browser extension)
async function saveAnnotation(annotationData) {
  try {
    const response = await fetch('http://localhost:8000/api/annotations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(annotationData)
    });
    
    const result = await response.json();
    console.log('Annotation saved:', result);
    
    // Show success indicator
    showSuccessNotification(result.ai_category);
  } catch (error) {
    console.error('Failed to save annotation:', error);
  }
}


---

## Demo Script

*Opening (30 seconds):*
"The internet is humanity's largest library, but we've been taking notes in the wrong place. Nalanda lets you annotate any webpage directly - preserving the situated context of your thoughts."

*Demo Flow (2 minutes):*
1. Show browser extension highlighting text on Wikipedia article
2. Add sticky note with personal insight
3. Switch to dashboard - show annotation appearing in real-time
4. Show AI automatically categorizing it
5. Add 2-3 more annotations on different sites/topics
6. Show dashboard reorganizing with new categories
7. Demonstrate search finding annotations across sites
8. Show "Related Annotations" suggesting connections

*Closing (30 seconds):*
"Nalanda's generative interface learns from your curiosity - automatically organizing your knowledge and surfacing unexpected connections. The entire internet becomes your personal library, annotated and organized exactly as you think."

---

## Future Enhancements (Post-Hackathon)

- *Collaborative Annotations:* Share annotations with friends/teams
- *Public Library:* Opt-in to share annotations publicly
- *Mobile App:* Native iOS/Android for on-the-go annotation
- *Advanced AI Features:* 
  - Summarization of annotated pages
  - Question answering across your library
  - Smart flashcards from your annotations
- *Export Options:* PDF, Markdown, Notion integration
- *Knowledge Graph Visualization:* Interactive web of ideas
- *Browser Sync:* Sync annotations across devices
- *Offline Mode:* Annotate and sync later

---

## Conclusion

Nalanda reimagines web browsing as an act of library curation. By keeping annotations in context and using AI to organize them intelligently, we're building an interface that adapts to how humans naturally think and learn. This aligns perfectly with the hackathon's theme of generative, adaptive interfaces while solving a real problem for knowledge workers, students, and curious minds everywhere.

*Core Differentiator:* We're not building another note-taking app - we're augmenting the entire internet with your personal layer of cognition.
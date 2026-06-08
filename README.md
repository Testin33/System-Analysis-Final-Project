# Story Scripting Editor - System Analysis Final Project

Overview

A professional **Story Scripting Editor** for writers and game designers to create branching narratives with character and location management. Built with Electron + Vanilla JavaScript, featuring the Observer design pattern, real-time dashboard metrics, and comprehensive project management tools.

**Version:** 1.1 (Enhanced with public API, PDF export, crash recovery, and demo projects)

---

## Key Features

### Core Functionality
- ✅ **Multiple Stories** - Create, organize, and manage multiple story narratives in one project
- ✅ **Story States** - DRAFT, VALIDATED, PUBLISHED - track narrative development status
- ✅ **Scenes with Rich Content** - Detailed scenes with emotion tags, action tags, character/location references
- ✅ **Character Management** - Define characters with attributes, visibility control, reference tracking
- ✅ **Location Management** - Geographic settings with attributes and reference tracking
- ✅ **Background Stories** - Project-wide contextual sections for worldbuilding
- ✅ **Token Resolution** - Automatic `[CHAR:id]` → name and `[LOC:id]` → location replacement

### Advanced Features
- ✅ **Story Branching** - Create alternative story versions from a baseline narrative
- ✅ **Dashboard Metrics** - Real-time scene counts, character distribution, emotion/action tag analysis
- ✅ **Validation System** - Comprehensive project validation with warnings and error reporting
- ✅ **Search & Filter** - Multi-criteria scene and character search (AND logic)
- ✅ **Story Compilation** - Resolve all tokens and export stories in multiple formats
- ✅ **PDF Export** - Generate professional PDF documents (new in v1.1)
- ✅ **Auto-save & Crash Recovery** - Automatic project saving with recovery dialog (new in v1.1)
- ✅ **Obsidian-style UI** - Modern 3-column layout (sidebar, editor, dashboard)

### Design Pattern
- **Observer Pattern** - Project (Subject) notifies Dashboard (Observer) on all changes
- Real-time metrics updates without tight coupling
- Proper separation of concerns (models, services, UI)

---

##  Quick Start

### Installation
```bash
cd story_editor
npm install
npm start
```

### Demo Projects
Two complete professional demo projects are included:

**1. Paraguay's Journey to Development**
- Theme: Paraguay's real transformation (1989-2024)
- 3 stories, 14 scenes, 7 characters, 10 locations
- ~3,500 words of substantive English narrative
- Shows: Economic, education, and cultural development
- All story states demonstrated (DRAFT, VALIDATED, PUBLISHED)

**2. Paraguay: Alternate Futures (Branching Narratives)**
- Theme: Scenario planning with 3 alternative 2034 outcomes
- 4 stories with branching structure
- 1 baseline reality → 3 future scenarios (Optimistic, Pessimistic, Pragmatic)
- Demonstrates story versioning and scenario analysis

**To load a demo:**
1. Click "Open project"
2. Select a demo project
3. Explore the sidebar, scenes, and dashboard

---

## Project Structure

```
story_editor/
├── models/                    # Data classes
│   ├── project.js            # Subject of Observer pattern
│   ├── story.js              # Story with scenes and versioning
│   ├── scene.js              # Individual narrative units
│   ├── character.js          # Character definitions
│   ├── location.js           # Location definitions
│   └── background.js         # Project-wide background context
├── services/                 # Business logic
│   ├── validator.js          # Project validation
│   ├── compiler.js           # Story compilation & export
│   ├── search.js             # Multi-criteria search
│   └── storage.js            # JSON persistence
├── patterns/
│   └── observer.js           # Observer pattern implementation
├── renderer/
│   ├── index.html            # Main UI
│   ├── app.js                # 1,400+ lines of UI logic
│   ├── styles.css            # Obsidian-style theme
│   └── ProjectSubject.js     # Dashboard observer wiring
├── main.js                   # Electron main process & IPC
├── preload.js                # Secure IPC bridge
├── data/                     # Saved projects
├── DEMO_PROJECTS_README.md   # Detailed demo project docs
├── smoke_test.js             # Models & Observer test
└── smoke_test_services.js    # Services test
```

---

## Usage Guide

### Create a New Project
```
Click "New project" → Enter title → Create
```

### Add Stories, Characters, Locations
```
Sidebar buttons (+) for each section
```

### Edit Content
```
Click items in sidebar → Edit in center panel → Auto-save
```

### Validate Project
```
Click "Validate" → Review warnings/errors in dialog
```

### Search
```
Click "Search" → Set criteria (title, emotion tag, action tag, character/location ref)
→ Find matching scenes/characters
```

### Compile & Export
```
Click "Compile" → Select story → Generate preview → Choose format (.txt/.md/.json/.pdf)
→ Export…
```

---

##  Architecture

### Observer Pattern Implementation
```
Project (extends Observable)
  ├─ notifyObservers() on add/remove/change
  └─ Dashboard (implements Observer)
       └─ update(project) → recalculates all metrics
```

### IPC Bridge (Electron)
- **Main Process** (`main.js`) - All filesystem access
- **Preload** (`preload.js`) - Secure context bridge
- **Renderer** (`renderer/app.js`) - UI (only trades JSON)

### Services
- **Validator** - Reports warnings/errors without blocking
- **StoryCompiler** - Resolves tokens, exports to multiple formats
- **SearchService** - Multi-criteria filtering with AND logic
- **Storage** - JSON persistence with auto-save

---

## Documentation

- **[DEMO_INSTRUCTIONS.md](./DEMO_INSTRUCTIONS.md)** - Step-by-step demo walkthrough (13 steps, 5-10 min)
- **[story_editor/DEMO_PROJECTS_README.md](./story_editor/DEMO_PROJECTS_README.md)** - Detailed project documentation, feature matrix, technical notes


---

##  Compliance with Requirements

### Professor's Brief (Confirmed)
- ✅ Observer design pattern correctly implemented
- ✅ All 9 model classes from UML diagram
- ✅ All 4 service classes from UML diagram
- ✅ Obsidian-style UI (3-column layout)
- ✅ Electron + Vanilla JS/CSS (no frameworks)
- ✅ Local JSON storage (no database)
- ✅ Auto-save with crash recovery
- ✅ Story branching (parentVersionId)
- ✅ Validation system (warns, doesn't block)
- ✅ Export formats: .txt, .md, .json, .pdf

### Additional Enhancements (v1.1)
- ✅ **Dashboard Public API** - 8 methods exposing metrics
- ✅ **Character Visibility Filter** - Hide characters with visible=false
- ✅ **PDF Export** - Full pdfkit integration
- ✅ **Crash Recovery Dialog** - User chooses recovery option
- ✅ **Comprehensive Demo Projects** - ~5,500 words of real content

---

##  Testing

### Smoke Tests
```bash
cd story_editor
npm start              # Launch Electron app

# In another terminal:
node smoke_test.js            # Models + Observer + Storage
node smoke_test_services.js   # Validator + Compiler + Search
```

Both tests verify all functionality and report "All assertions passed ✅"

---

##  Demonstration

### Quick Demo (5 minutes)
1. Open demo project 1 (Paraguay's Journey to Development)
2. Click through scenes and view token resolution
3. Export to PDF
4. Show dashboard metrics

### Full Demo (10 minutes)
- All of above +
- Validate project (show warnings)
- Search functionality
- Open demo project 2 (show branching)
- Discuss Observer pattern and design decisions

---

##  Design Pattern Rationale

**Why Observer Pattern?**
- Dashboard stays in sync with Project without tight coupling
- Real-time metrics updates on every project change
- Extensible: other observers can be added without modifying Project
- Alternatives (Command, State, Strategy) don't solve the core problem

**Why Electron + Vanilla JS?**
- Minimize learning curve (no framework dependencies)
- Direct DOM manipulation for UI responsiveness
- Full IPC control for security (contextIsolation: true)
- Desktop-native experience with web technologies

---

##  Project Statistics

| Metric | Value |
|--------|-------|
| Total Lines of Code | ~2,500 |
| UI Code | 1,400+ (app.js) |
| Classes Implemented | 13 |
| Services | 4 (Validator, Compiler, Search, Storage) |
| Export Formats | 4 (.txt, .md, .json, .pdf) |
| Demo Projects | 2 |
| Demo Content | ~5,500 words |
| Characters (demo) | 12 |
| Locations (demo) | 17 |
| Scenes (demo) | 24 |

---



## Notes

- **JSON Storage** - All projects stored in `story_editor/data/` as .json files
- **Auto-save** - `.autosave.json` files created on every change
- **Token Pattern** - `[CHAR:id]` and `[LOC:id]` are the only supported tokens
- **Emotion Tags** - Fixed 12-item vocabulary per professor specification
- **Action Tags** - Free-form custom tags per writer preference
- **No Parallel Branching** - Scenes within a story are linear; branching happens at Story level

---

##  Learning Outcomes

This project demonstrates:
1. **Software Architecture** - Observer pattern, IPC design, separation of concerns
2. **Full-Stack Development** - Desktop app with secure process boundary
3. **Real-World Application** - Professional narrative editing tool
4. **Academic Writing** - Comprehensive design documentation and specification
5. **Testing & Validation** - Smoke tests, manual verification, real demo content






# 🎬 Story Editor Demo Instructions
## **Paraguay's Development: Demonstrating All Features**

---

## 📦 Available Demo Projects

### **Project 1: "Paraguay's Journey to Development"**
**File:** `story_editor/data/paraguay-development-demo.json`

This project demonstrates **core Story Editor functionality** with a comprehensive narrative about Paraguay's transformation from 1989 to 2024.

#### Features to showcase:

1. **Multiple Stories** (3 main stories)
   - "Economic Transformation (1989-2024)" - PUBLISHED
   - "Education: Building Human Capital" - VALIDATED
   - "Cultural Renaissance" - DRAFT (incomplete scenes)

2. **Story States** (StoryState enum)
   - DRAFT: Cultural Renaissance (shows incomplete work)
   - VALIDATED: Education story (shows peer-reviewed content)
   - PUBLISHED: Economic story (final, released content)

3. **Rich Scene Content** (6 scenes in main story)
   - Full narrative with token resolution ([CHAR:id] → character names)
   - Multiple action tags: historical-shift, economic-development, infrastructure-growth, digital-transformation, sustainability-leadership, international-cooperation
   - Multiple emotion tags: Call Refusal, Rookie Optimism, Threshold Dread, Mentor Uplift, Epiphany/Resurrection, Master of Two Worlds, Crisis of Faith, Approach Dread, Supreme Ordeal, Catharsis

4. **Character References** (7 main characters)
   - Alfredo Rodríguez - Political leader
   - María García López - Education reformer
   - Juan Carlos Gaona - Environmental scientist
   - Carlos Méndez - Agricultural innovator
   - Sofía Torres - Tech entrepreneur
   - Diego Ortega - Tech engineer
   - Plus: Historical figure Stroessner, demonstrating multiple perspectives

5. **Location References** (10 locations)
   - National: Paraguay, Asunción, Eastern Region, Ciudad del Este, Chocó Region
   - Geographic features: Esteros del Ibera Wetlands
   - Regional: Brazil, Argentina, Buenos Aires, South America
   - Shows token resolution: [LOC:asuncion] → Asunción

6. **Background Story** (5 sections)
   - "Historical Context: From Isolation to Integration"
   - "Geography & Natural Resources"
   - "Cultural Identity: Guarani & Spanish Fusion"
   - "Development Challenges"
   - "The People: From Struggle to Ambition"

---

### **Project 2: "Paraguay: Alternate Futures"**
**File:** `story_editor/data/alternate-futures.json`

This project demonstrates **story branching** - a unique feature showing how one main story splits into multiple alternative narratives.

#### Features to showcase:

1. **Story Branching** (parentVersionId concept)
   - Main story: "2024: The Baseline Reality" (no parent)
   - Branch 1: "2034: The Optimistic Path" (parentVersionId = baseline)
   - Branch 2: "2034: The Stagnant Path" (parentVersionId = baseline)
   - Branch 3: "2034: The Balanced Path" (parentVersionId = baseline)
   - Demonstrates: Same starting point, different narrative conclusions

2. **Multiple Timelines**
   - All stories progress from 2024 to 2034
   - Show how different policy choices lead to different outcomes
   - Demonstrates: Non-linear narrative structure

3. **Scenario Planning**
   - Optimistic: Green economy leadership
   - Pessimistic: Stagnation and missed opportunities
   - Pragmatic: Realistic middle ground
   - Demonstrates: Story Editor as planning/scenario tool

4. **Version Management**
   - Different versionLabel values: "Green Prosperity Scenario", "Missed Opportunity Scenario", etc.
   - Shows how to manage multiple narrative versions of the same story

---

## 🎯 Feature Demonstration Flow

### **Step 1: Open Project 1 (Main Journey)**
```
1. Click "Open project"
2. Select "Paraguay's Journey to Development"
3. Observe the sidebar showing:
   - 3 stories (Economic, Education, Culture)
   - 7 characters (all visible, no hidden ones)
   - 10 locations
   - Background section
```

### **Step 2: Explore Story States** 
```
1. Click on "Economic Transformation" story
2. Notice in editor: state = "PUBLISHED"
3. Click on "Education" story
4. Notice in editor: state = "VALIDATED"
5. Click on "Cultural Renaissance" story
6. Notice in editor: state = "DRAFT"
   → This shows the 3 possible states from StoryState enum
```

### **Step 3: Examine Scenes & Token Resolution**
```
1. In "Economic Transformation", click on first scene: "The Fall of Stroessner"
2. In editor preview, observe:
   - [CHAR:alfredo-rodriguez] is RESOLVED to "Alfredo Rodríguez"
   - [CHAR:alfredo-stroessner] is RESOLVED to "Alfredo Stroessner"
   - [CHAR:maria-garcia] is RESOLVED to "María García López"
   - [LOC:asuncion] is RESOLVED to "Asunción"
   - [LOC:paraguay] is RESOLVED to "Paraguay"
   → Demonstrates token resolution engine
```

### **Step 4: Validate Project**
```
1. Click "Validate" button
2. A dialog shows validation report:
   - Scenes with complete information (no warnings)
   - Scenes with blank fields might show warnings
   - Shows comprehensive project health check
   → Demonstrates Validator service with ValidationReport
```

### **Step 5: Compile & Export Story**
```
1. Click "Compile" button
2. Dialog opens: "Compile story"
3. Select "Economic Transformation" story
4. Click "Generate preview"
5. Preview shows full compiled text with all tokens resolved
6. Choose export format:
   - .txt (plain text)
   - .md (markdown)
   - .json (structured data)
   - .pdf (with pdfkit formatting)
7. Click "Export…" and save to desktop
   → Demonstrates StoryCompiler with multiple formats
```

### **Step 6: Search Functionality**
```
1. Click "Search" button
2. Try different criteria:
   a) Title search: "historical-shift" 
      → Finds: "The Fall of Stroessner" scene
   b) Emotion tag: "Rookie Optimism"
      → Finds: "Agricultural Expansion" scene
   c) Character reference: [sofía-torres]
      → Finds: "Tech Hub Emergence" scene
   d) Location reference: [asuncion]
      → Finds: Multiple scenes
   e) Combined: Emotion="Mentor Uplift" + Character="sofia-torres"
      → Finds: "Tech Hub Emergence" scene
   → Demonstrates SearchService with multi-criteria filtering
```

### **Step 7: Dashboard Metrics**
```
1. Keep "Paraguay's Journey to Development" open
2. Observe Dashboard on right side:
   - Scenes: 14 (3 in Culture story incomplete)
   - Characters: 7 (all visible)
   - Locations: 10
   - Word count: ~3,500 words
3. Dashboard sections:
   - Characters in scenes: Shows each character's scene count
   - Emotion distribution: Shows all emotion tags and frequency
   - Action tag distribution: Shows all action tags and frequency
   - Incomplete scenes: Lists scenes lacking title/content/tags
4. Click on "Cultural Renaissance, Preserving Guarani Heritage" in incomplete list
   → Navigates to that scene
   → Demonstrates Dashboard's public API (metrics accessible)
```

### **Step 8: Switch to Project 2 (Branching)**
```
1. Click "Open project"
2. Select "Paraguay: Alternate Futures (Branching Narratives)"
3. In sidebar, notice 4 stories:
   - "2024: The Baseline Reality" (PUBLISHED)
   - "2034: The Optimistic Path" (PUBLISHED)
   - "2034: The Stagnant Path" (PUBLISHED)
   - "2034: The Balanced Path" (VALIDATED)
```

### **Step 9: Demonstrate Branching**
```
1. Click on "2024: The Baseline Reality"
   - Only 1 scene: "Where We Are Today"
   - This is the decision point
2. Click on "2034: The Optimistic Path"
   - Notice: parentVersionId should point to baseline story
   - 3 scenes: Decision Point, Transformation, Dream Realized
3. Click on "2034: The Stagnant Path"
   - Different outcome from same starting point
4. Click on "2034: The Balanced Path"
   - Middle ground between optimistic and pessimistic
   → Demonstrates: Story.createVersion() and branching logic
```

### **Step 10: Scenario Planning Demo**
```
1. Read each 2034 story completely
2. Point out how different policy choices lead to different outcomes:
   - Optimistic: Embraces green economy → Carbon neutrality
   - Pessimistic: Chooses comfort → Environmental collapse
   - Balanced: Strategic choices → Realistic progress
3. This demonstrates Story Editor as a planning/scenario analysis tool
   → Shows: Real-world application beyond entertainment
```

### **Step 11: Character Visibility** (Optional)
```
1. Go back to Project 1
2. Observe: All 7 characters visible in sidebar
3. If any were marked visible=false, they'd be hidden from sidebar
   → Demonstrates: Character.visible property and filter logic
```

### **Step 12: Save & Auto-Save Demo**
```
1. Make a minor edit to a scene (add a word)
2. Notice: Auto-save happens immediately (no visible button needed)
3. Watch the file in data/ folder get updated with .autosave.json
4. Click "Save" to explicitly save to main file
   → Demonstrates: Storage.autoSave() and explicit saving
```

### **Step 13: Crash Recovery Demo** (If time)
```
1. Note the auto-save file exists in data/
2. Close and reopen the app
3. Open a project that has an auto-save file
4. Dialog appears: "An auto-saved version exists. Recover or continue?"
5. Choose "Recover auto-save" or "Continue with last save"
   → Demonstrates: Crash recovery with user choice
```

---

## 📊 Feature Checklist for Demo

### **Core Features**
- ✅ Multiple stories in one project
- ✅ Story states (DRAFT, VALIDATED, PUBLISHED)
- ✅ Scenes with rich content and metadata
- ✅ Character references and resolution
- ✅ Location references and resolution
- ✅ Emotion tags (12 types from EMOTION_TAGS)
- ✅ Action tags (custom free-form tags)
- ✅ Background story with multiple sections
- ✅ Token resolution ([CHAR:ID] → name, [LOC:ID] → location)

### **Services**
- ✅ Validator: Validates project, reports warnings/errors
- ✅ StoryCompiler: Compiles with token resolution, exports to .txt/.md/.json/.pdf
- ✅ SearchService: Multi-criteria scene/character search (AND logic)
- ✅ Storage: Save/load projects, auto-save with crash recovery

### **UI Features**
- ✅ Obsidian-style 3-column layout
- ✅ Sidebar with all entities
- ✅ Editor pane (placeholder in this demo)
- ✅ Dashboard with metrics and distributions
- ✅ Dialogs: New, Open, Validate, Compile, Search, Crash Recovery

### **Observer Pattern**
- ✅ Dashboard updates on every project change
- ✅ Dashboard has public API methods: getSceneCount(), getWordCount(), etc.
- ✅ Real-time metric recalculation

### **Advanced Features**
- ✅ Story branching (parentVersionId)
- ✅ Multiple story versions from same base
- ✅ Invisible characters (visible=false property)
- ✅ PDF export with pdfkit
- ✅ Crash recovery with auto-save detection

---

## 💡 Key Talking Points

### **For Professors/Evaluators:**

1. **Design Pattern (Observer)**
   - Dashboard observes Project changes
   - Real-time synchronization without tight coupling
   - Meets design pattern requirement

2. **Class Diagram Compliance**
   - All classes from diagram are implemented
   - Methods match diagram (camelCase in JS, snake_case in diagram)
   - Relationships (compositions, references) correctly modeled

3. **Real-World Application**
   - Story Editor serves multiple use cases:
     - Creative writing (demo project 1)
     - Scenario planning (demo project 2)
     - Educational content creation
     - Corporate narrative development
   - Paraguay demo shows serious application

4. **Database/Persistence**
   - Full JSON serialization (no database needed)
   - Auto-save for crash recovery
   - Multiple file format exports

5. **User Experience**
   - Obsidian-style modern UI
   - Intuitive navigation
   - Real-time feedback
   - Multiple export options

---

## 🚀 Quick Demo Script (5-10 minutes)

```
1. Launch app: npm start
2. Open "Paraguay's Journey to Development" (1 min)
3. Click "Compile" → Export as PDF (2 min)
4. Click "Search" → Find scenes by emotion tag (1 min)
5. Click "Validate" → Show validation report (1 min)
6. Show Dashboard metrics on the right (1 min)
7. Open "Alternate Futures" → Show 4 branching stories (2 min)
8. Discuss Observer pattern and design decisions (2 min)

Total: ~10 minutes for complete feature demonstration
```

---

## 📝 Notes for Demonstrator

- **First project (Paraguay Journey)** focuses on breadth: shows all individual features
- **Second project (Alternate Futures)** focuses on depth: shows branching and complex narrative structure
- **Both in English** to show professional/international readiness
- **Real content**: Not placeholder text—substantive narratives about Paraguay's actual development
- **All emoji and markdown** demonstrate that text editor supports rich content
- **Dashboard auto-updates**: Every change to project triggers Dashboard recalculation via Observer pattern

---

## 📂 File Locations

- **Project 1:** `story_editor/data/paraguay-development-demo.json`
- **Project 2:** `story_editor/data/alternate-futures.json`
- **App entry:** `npm start` (from `story_editor/` directory)
- **Exported files:** Saved to user's chosen location on first compile

---

**Happy demonstrating! 🎬**

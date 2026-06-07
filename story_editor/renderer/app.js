// renderer/app.js — navigation, model editors, and persistence wiring (Phase 5)
(() => {
  const EMOTION_TAGS = [
    "Status Quo Comfort",
    "Call Refusal",
    "Mentor Uplift",
    "Threshold Dread",
    "Rookie Optimism",
    "Approach Dread",
    "Supreme Ordeal",
    "Crisis of Faith",
    "Epiphany / Resurrection",
    "Final Climax Tension",
    "Catharsis",
    "Master of Two Worlds",
  ];

  const STORY_STATES = ["DRAFT", "VALIDATED", "PUBLISHED"];

  const state = {
    project: null, // plain JSON shape from Project.toJSON(), traded over IPC
    filePath: null,
    selectedSection: null,
    selectedItemId: null,
    selectedSceneId: null,
    draft: null, // working copy of whichever entity is currently open in the editor
  };

  const dom = {
    projectName: document.getElementById("project-name"),
    btnNewProject: document.getElementById("btn-new-project"),
    btnOpenProject: document.getElementById("btn-open-project"),
    btnSaveProject: document.getElementById("btn-save-project"),
    sidebarEmpty: document.querySelector(".sidebar-empty"),
    sections: Array.from(document.querySelectorAll(".nav-section")),
    lists: {
      stories: document.getElementById("list-stories"),
      characters: document.getElementById("list-characters"),
      locations: document.getElementById("list-locations"),
      background: document.getElementById("list-background"),
    },
    addButtons: {
      stories: document.getElementById("btn-add-story"),
      characters: document.getElementById("btn-add-character"),
      locations: document.getElementById("btn-add-location"),
      background: document.getElementById("btn-add-background-section"),
    },
    editor: document.getElementById("editor"),
    metricScenes: document.getElementById("metric-scenes"),
    metricCharacters: document.getElementById("metric-characters"),
    metricLocations: document.getElementById("metric-locations"),
    metricWords: document.getElementById("metric-words"),
    dashCharacterMap: document.getElementById("dashboard-character-map"),
    dashEmotionDistribution: document.getElementById("dashboard-emotion-distribution"),
    dashActionDistribution: document.getElementById("dashboard-action-distribution"),
    dashIncompleteScenes: document.getElementById("dashboard-incomplete-scenes"),
    btnValidate: document.getElementById("btn-validate"),
    btnCompile: document.getElementById("btn-compile"),
    btnSearch: document.getElementById("btn-search"),
    dialogNewProject: document.getElementById("dialog-new-project"),
    formNewProject: document.getElementById("form-new-project"),
    inputProjectTitle: document.getElementById("input-project-title"),
    btnCancelNewProject: document.getElementById("btn-cancel-new-project"),
    dialogOpenProject: document.getElementById("dialog-open-project"),
    openProjectList: document.getElementById("open-project-list"),
    openProjectEmpty: document.getElementById("open-project-empty"),
    btnCancelOpenProject: document.getElementById("btn-cancel-open-project"),
    dialogValidationReport: document.getElementById("dialog-validation-report"),
    validationSummary: document.getElementById("validation-summary"),
    validationErrors: document.getElementById("validation-errors"),
    validationErrorsEmpty: document.getElementById("validation-errors-empty"),
    validationWarnings: document.getElementById("validation-warnings"),
    validationWarningsEmpty: document.getElementById("validation-warnings-empty"),
    dialogCompile: document.getElementById("dialog-compile"),
    compileStorySelect: document.getElementById("compile-story-select"),
    compileSceneOrder: document.getElementById("compile-scene-order"),
    btnCompilePreview: document.getElementById("btn-compile-preview"),
    compilePreview: document.getElementById("compile-preview"),
    compileFormat: document.getElementById("compile-format"),
    btnCancelCompile: document.getElementById("btn-cancel-compile"),
    btnCompileExport: document.getElementById("btn-compile-export"),
    compileExportResult: document.getElementById("compile-export-result"),
    dialogSearch: document.getElementById("dialog-search"),
    searchText: document.getElementById("search-text"),
    searchEmotionTag: document.getElementById("search-emotion-tag"),
    searchActionTag: document.getElementById("search-action-tag"),
    searchCharacterRef: document.getElementById("search-character-ref"),
    btnCancelSearch: document.getElementById("btn-cancel-search"),
    btnRunSearch: document.getElementById("btn-run-search"),
    searchResultsScenes: document.getElementById("search-results-scenes"),
    searchResultsScenesEmpty: document.getElementById("search-results-scenes-empty"),
    searchResultsCharacters: document.getElementById("search-results-characters"),
    searchResultsCharactersEmpty: document.getElementById("search-results-characters-empty"),
  };

  const ENTITY_FACTORIES = {
    stories: () => ({
      id: crypto.randomUUID(),
      title: "New story",
      versionLabel: "",
      parentVersionId: null,
      state: "DRAFT",
      scenes: [],
    }),
    characters: () => ({ id: crypto.randomUUID(), name: "New character", visible: true, attributes: {} }),
    locations: () => ({ id: crypto.randomUUID(), name: "New location", attributes: {} }),
    background: () => ({ id: crypto.randomUUID(), title: "New section", content: "" }),
  };

  function setProject(project, filePath) {
    state.project = project;
    state.filePath = filePath;
    state.selectedSection = null;
    state.selectedItemId = null;
    state.selectedSceneId = null;
    state.draft = null;
    render();
  }

  // Auto-save fires after every mutation; the explicit Save button writes to filePath instead.
  function persist() {
    if (state.project) window.api.autoSaveProject(state.project);
  }

  function esc(text) {
    return String(text ?? "").replace(/[&<>"']/g, (ch) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    }[ch]));
  }

  function capitalize(text) {
    return text.charAt(0).toUpperCase() + text.slice(1);
  }

  function countWords(text) {
    const trimmed = (text || "").trim();
    return trimmed ? trimmed.split(/\s+/).length : 0;
  }

  function createEmptyScene() {
    return {
      id: crypto.randomUUID(),
      title: "",
      shortDescription: "",
      content: "",
      emotionTag: "",
      actionTag: "",
      characterRefs: [],
      locationRefs: [],
    };
  }

  function attributesFromDraft(pairs) {
    const result = {};
    pairs.forEach(({ key, value }) => {
      const trimmedKey = key.trim();
      if (trimmedKey) result[trimmedKey] = value;
    });
    return result;
  }

  // Mirrors Character.isReferencedIn / Location.isReferencedIn — the renderer only
  // ever holds plain JSON (toJSON shape), not model instances, so the guard is reimplemented here.
  function isCharacterReferenced(project, characterId) {
    return project.stories.some((story) => story.scenes.some((scene) => scene.characterRefs.includes(characterId)));
  }

  function isLocationReferenced(project, locationId) {
    return project.stories.some((story) => story.scenes.some((scene) => scene.locationRefs.includes(locationId)));
  }

  // A scene the writer hasn't fleshed out yet — distinct from Scene.isEmpty() (which the
  // Validator uses to flag fully-blank scenes); this is the Dashboard's "needs attention" list.
  function isSceneIncomplete(scene) {
    return !scene.title.trim() || !scene.content.trim() || !scene.emotionTag || !scene.actionTag.trim();
  }

  function navigateToScene(storyId, sceneId) {
    selectItem("stories", storyId);
    selectScene(storyId, sceneId);
  }

  // ---------- Observer pattern: Dashboard observes ProjectSubject ----------
  // Mirrors Project (extends Observable) / Dashboard (implements Observer) from the class
  // diagram (see patterns/observer.js, loaded as a <script> above). The renderer only ever
  // holds plain JSON though, so ProjectSubject wraps that JSON and forwards it directly as
  // the notification payload — the base Observable.notifyObservers() forwards `this` instead.
  class ProjectSubject extends Observable {
    constructor() {
      super();
      this.project = null;
    }
    setProject(project) {
      this.project = project;
    }
    notifyObservers() {
      for (const observer of this.observers) observer.update(this.project);
    }
  }

  class Dashboard extends Observer {
    constructor(dom) {
      super();
      this.dom = dom;
    }

    update(project) {
      if (!project) {
        this._renderEmpty();
        return;
      }
      const scenes = project.stories.flatMap((story) => story.scenes);
      const wordCount = scenes.reduce((total, scene) => total + countWords(scene.content), 0);

      this.dom.metricScenes.textContent = scenes.length;
      this.dom.metricCharacters.textContent = project.characters.length;
      this.dom.metricLocations.textContent = project.locations.length;
      this.dom.metricWords.textContent = wordCount;

      this._renderCharacterMap(project, scenes);
      this._renderDistribution(this.dom.dashEmotionDistribution, scenes, (scene) => scene.emotionTag);
      this._renderDistribution(this.dom.dashActionDistribution, scenes, (scene) => scene.actionTag);
      this._renderIncompleteScenes(project);
    }

    _renderEmpty() {
      this.dom.metricScenes.textContent = "—";
      this.dom.metricCharacters.textContent = "—";
      this.dom.metricLocations.textContent = "—";
      this.dom.metricWords.textContent = "—";
      [
        this.dom.dashCharacterMap,
        this.dom.dashEmotionDistribution,
        this.dom.dashActionDistribution,
        this.dom.dashIncompleteScenes,
      ].forEach((el) => {
        el.innerHTML = "";
      });
    }

    _renderCharacterMap(project, scenes) {
      const rows = project.characters.map((character) => ({
        label: character.name || "(unnamed)",
        count: scenes.filter((scene) => scene.characterRefs.includes(character.id)).length,
      }));
      this._renderRows(this.dom.dashCharacterMap, rows, "No characters yet.");
    }

    _renderDistribution(listEl, scenes, tagFor) {
      const counts = new Map();
      scenes.forEach((scene) => {
        const tag = (tagFor(scene) || "").trim() || "Untagged";
        counts.set(tag, (counts.get(tag) || 0) + 1);
      });
      const rows = Array.from(counts.entries())
        .map(([label, count]) => ({ label, count }))
        .sort((a, b) => b.count - a.count);
      this._renderRows(listEl, rows, "No scenes yet.");
    }

    _renderRows(listEl, rows, emptyMessage) {
      listEl.innerHTML = "";
      if (!rows.length) {
        const li = document.createElement("li");
        li.className = "dashboard-rows-empty";
        li.textContent = emptyMessage;
        listEl.appendChild(li);
        return;
      }
      const max = Math.max(...rows.map((row) => row.count), 1);
      rows.forEach(({ label, count }) => {
        const li = document.createElement("li");
        li.innerHTML = `
          <span class="row-label">${esc(label)}</span>
          <span class="row-bar"><span class="row-bar-fill" style="width: ${Math.round((count / max) * 100)}%"></span></span>
          <span class="row-count">${count}</span>
        `;
        listEl.appendChild(li);
      });
    }

    _renderIncompleteScenes(project) {
      const listEl = this.dom.dashIncompleteScenes;
      listEl.innerHTML = "";
      const entries = [];
      project.stories.forEach((story) => {
        story.scenes.forEach((scene) => {
          if (isSceneIncomplete(scene)) entries.push({ story, scene });
        });
      });
      if (!entries.length) {
        const li = document.createElement("li");
        li.className = "dashboard-rows-empty";
        li.textContent = "Nothing incomplete — every scene has a title, content, and tags.";
        listEl.appendChild(li);
        return;
      }
      entries.forEach(({ story, scene }) => {
        const li = document.createElement("li");
        li.textContent = `${scene.title || "(untitled scene)"} — ${story.title || "(untitled story)"}`;
        li.addEventListener("click", () => navigateToScene(story.id, scene.id));
        listEl.appendChild(li);
      });
    }
  }

  const projectSubject = new ProjectSubject();
  const dashboard = new Dashboard(dom);
  projectSubject.addObserver(dashboard);

  function notifyDashboard() {
    projectSubject.setProject(state.project);
    projectSubject.notifyObservers();
  }

  // ---------- Selection ----------
  function selectItem(sectionKey, itemId) {
    state.selectedSection = sectionKey;
    state.selectedItemId = itemId;
    state.selectedSceneId = null;
    state.draft = buildEntityDraft(sectionKey, itemId);
    render();
  }

  function selectScene(storyId, sceneId) {
    const story = state.project.stories.find((entry) => entry.id === storyId);
    const scene = story && story.scenes.find((entry) => entry.id === sceneId);
    if (!scene) return;
    state.selectedSceneId = sceneId;
    state.draft = {
      id: scene.id,
      title: scene.title,
      shortDescription: scene.shortDescription,
      content: scene.content,
      emotionTag: scene.emotionTag,
      actionTag: scene.actionTag,
      characterRefs: [...scene.characterRefs],
      locationRefs: [...scene.locationRefs],
    };
    render();
  }

  function buildEntityDraft(sectionKey, itemId) {
    if (!state.project) return null;
    if (sectionKey === "stories") {
      const story = state.project.stories.find((entry) => entry.id === itemId);
      return story && { id: story.id, title: story.title, versionLabel: story.versionLabel, state: story.state };
    }
    if (sectionKey === "characters") {
      const character = state.project.characters.find((entry) => entry.id === itemId);
      return (
        character && {
          id: character.id,
          name: character.name,
          visible: character.visible,
          attributes: Object.entries(character.attributes || {}).map(([key, value]) => ({ key, value })),
        }
      );
    }
    if (sectionKey === "locations") {
      const location = state.project.locations.find((entry) => entry.id === itemId);
      return (
        location && {
          id: location.id,
          name: location.name,
          attributes: Object.entries(location.attributes || {}).map(([key, value]) => ({ key, value })),
        }
      );
    }
    if (sectionKey === "background") {
      const section = state.project.background.sections.find((entry) => entry.id === itemId);
      return section && { id: section.id, title: section.title, content: section.content };
    }
    return null;
  }

  // ---------- Render: shell ----------
  function render() {
    const hasProject = Boolean(state.project);
    dom.projectName.textContent = hasProject ? state.project.title || "(untitled)" : "No project open";
    dom.btnSaveProject.disabled = !hasProject;
    dom.btnValidate.disabled = !hasProject;
    dom.btnCompile.disabled = !hasProject;
    dom.btnSearch.disabled = !hasProject;
    dom.sidebarEmpty.hidden = hasProject;
    dom.sections.forEach((section) => {
      section.hidden = !hasProject;
    });

    if (!hasProject) {
      renderEditorPlaceholder("Create or open a project to get started.");
      notifyDashboard();
      return;
    }

    renderList(dom.lists.stories, state.project.stories, (story) => story.title || "(untitled)", "stories");
    renderList(dom.lists.characters, state.project.characters, (character) => character.name || "(unnamed)", "characters");
    renderList(dom.lists.locations, state.project.locations, (location) => location.name || "(unnamed)", "locations");
    renderList(
      dom.lists.background,
      state.project.background.sections,
      (section) => section.title || "(untitled)",
      "background"
    );

    notifyDashboard();
    renderEditorSelection();
  }

  function renderList(listEl, items, labelFor, sectionKey) {
    listEl.innerHTML = "";
    if (!items || items.length === 0) {
      const li = document.createElement("li");
      li.className = "nav-list-empty";
      li.textContent = "No items yet.";
      listEl.appendChild(li);
      return;
    }
    items.forEach((item) => {
      const li = document.createElement("li");
      li.textContent = labelFor(item);
      if (state.selectedSection === sectionKey && state.selectedItemId === item.id) {
        li.classList.add("active");
      }
      li.addEventListener("click", () => selectItem(sectionKey, item.id));
      listEl.appendChild(li);
    });
  }

  function renderEditorPlaceholder(message, hint) {
    dom.editor.innerHTML = "";
    const wrapper = document.createElement("div");
    wrapper.className = "editor-placeholder";
    wrapper.innerHTML = `
      <h1>Welcome</h1>
      <p>${esc(message)}</p>
      ${hint ? `<p class="editor-placeholder-hint">${esc(hint)}</p>` : ""}
    `;
    dom.editor.appendChild(wrapper);
  }

  // ---------- Render: editor pane dispatch ----------
  function renderEditorSelection() {
    const NO_SELECTION_HINT =
      "Use the + button in each sidebar section to create a new story, character, location, or background section.";

    if (!state.selectedSection || !state.selectedItemId) {
      renderEditorPlaceholder("Select an item from the left panel to edit it.", NO_SELECTION_HINT);
      return;
    }

    const project = state.project;

    if (state.selectedSection === "stories") {
      const story = project.stories.find((entry) => entry.id === state.selectedItemId);
      if (!story) {
        state.selectedSection = null;
        state.selectedItemId = null;
        renderEditorPlaceholder("Select an item from the left panel to edit it.", NO_SELECTION_HINT);
        return;
      }
      if (state.selectedSceneId) {
        const scene = story.scenes.find((entry) => entry.id === state.selectedSceneId);
        if (scene) {
          renderSceneEditor(story, scene);
          return;
        }
        state.selectedSceneId = null;
      }
      renderStoryView(story);
      return;
    }

    if (state.selectedSection === "characters") {
      const character = project.characters.find((entry) => entry.id === state.selectedItemId);
      if (!character) {
        state.selectedSection = null;
        state.selectedItemId = null;
        renderEditorPlaceholder("Select an item from the left panel to edit it.", NO_SELECTION_HINT);
        return;
      }
      renderCharacterEditor(character);
      return;
    }

    if (state.selectedSection === "locations") {
      const location = project.locations.find((entry) => entry.id === state.selectedItemId);
      if (!location) {
        state.selectedSection = null;
        state.selectedItemId = null;
        renderEditorPlaceholder("Select an item from the left panel to edit it.", NO_SELECTION_HINT);
        return;
      }
      renderLocationEditor(location);
      return;
    }

    if (state.selectedSection === "background") {
      const section = project.background.sections.find((entry) => entry.id === state.selectedItemId);
      if (!section) {
        state.selectedSection = null;
        state.selectedItemId = null;
        renderEditorPlaceholder("Select an item from the left panel to edit it.", NO_SELECTION_HINT);
        return;
      }
      renderBackgroundSectionEditor(section);
      return;
    }
  }

  // ---------- Shared editor widgets ----------

  // Renders a removable list of references (character or location refs on a scene)
  // plus a "pick from the rest of the project and add" control. Operates on the
  // draft's array directly so unsaved edits to other fields are never lost.
  function wireRefEditor({ listEl, selectEl, addBtn, refs, pool, labelFor, emptyLabel, noOptionsLabel }) {
    function refreshList() {
      listEl.innerHTML = "";
      if (!refs.length) {
        const li = document.createElement("li");
        li.className = "ref-list-empty";
        li.textContent = emptyLabel;
        listEl.appendChild(li);
        return;
      }
      refs.forEach((id) => {
        const entry = pool.find((candidate) => candidate.id === id);
        const li = document.createElement("li");
        const label = document.createElement("span");
        label.textContent = entry ? labelFor(entry) : `Unresolved reference (${id})`;
        const removeBtn = document.createElement("button");
        removeBtn.className = "btn btn-small";
        removeBtn.textContent = "Remove";
        removeBtn.addEventListener("click", () => {
          const at = refs.indexOf(id);
          if (at !== -1) refs.splice(at, 1);
          refreshList();
          refreshOptions();
        });
        li.appendChild(label);
        li.appendChild(removeBtn);
        listEl.appendChild(li);
      });
    }

    function refreshOptions() {
      const available = pool.filter((entry) => !refs.includes(entry.id));
      selectEl.innerHTML = available.length
        ? available.map((entry) => `<option value="${esc(entry.id)}">${esc(labelFor(entry))}</option>`).join("")
        : `<option value="">${esc(noOptionsLabel)}</option>`;
      selectEl.disabled = available.length === 0;
      addBtn.disabled = available.length === 0;
    }

    addBtn.addEventListener("click", () => {
      const id = selectEl.value;
      if (!id || refs.includes(id)) return;
      refs.push(id);
      refreshList();
      refreshOptions();
    });

    refreshList();
    refreshOptions();
  }

  // Renders editable key/value rows for Character/Location `attributes`. Mutates the
  // draft's array of {key, value} pairs in place; `onChange` re-renders the rows.
  function renderAttributeRows(containerEl, attributes, onChange) {
    containerEl.innerHTML = "";
    if (!attributes.length) {
      const empty = document.createElement("p");
      empty.className = "attribute-list-empty";
      empty.textContent = "No attributes yet.";
      containerEl.appendChild(empty);
      return;
    }
    attributes.forEach((pair, index) => {
      const row = document.createElement("div");
      row.className = "attribute-row";

      const keyInput = document.createElement("input");
      keyInput.type = "text";
      keyInput.placeholder = "Key (e.g. personality)";
      keyInput.value = pair.key;
      keyInput.addEventListener("input", () => {
        pair.key = keyInput.value;
      });

      const valueInput = document.createElement("input");
      valueInput.type = "text";
      valueInput.placeholder = "Value";
      valueInput.value = pair.value;
      valueInput.addEventListener("input", () => {
        pair.value = valueInput.value;
      });

      const removeBtn = document.createElement("button");
      removeBtn.className = "btn btn-small";
      removeBtn.textContent = "Remove";
      removeBtn.addEventListener("click", () => {
        attributes.splice(index, 1);
        onChange();
      });

      row.appendChild(keyInput);
      row.appendChild(valueInput);
      row.appendChild(removeBtn);
      containerEl.appendChild(row);
    });
  }

  // ---------- Story view ----------
  function renderStoryView(story) {
    const draft = state.draft;
    dom.editor.innerHTML = `
      <div class="entity-view">
        <div class="entity-header">
          <h1>Story editor</h1>
          <button id="btn-delete-story" class="btn btn-danger">Delete story</button>
        </div>
        <p class="field-hint">
          ID: <code>${esc(story.id)}</code>${
            story.parentVersionId ? ` · branched from <code>${esc(story.parentVersionId)}</code>` : ""
          }
        </p>

        <label class="field-label" for="story-title">Title</label>
        <input type="text" id="story-title" value="${esc(draft.title)}" placeholder="Story title" />

        <div class="field-grid">
          <div>
            <label class="field-label" for="story-version-label">Version label</label>
            <input type="text" id="story-version-label" value="${esc(draft.versionLabel)}" placeholder="e.g. v1, branch-A" />
          </div>
          <div>
            <label class="field-label" for="story-state">State</label>
            <select id="story-state">
              ${STORY_STATES.map(
                (value) =>
                  `<option value="${value}" ${value === draft.state ? "selected" : ""}>${capitalize(value.toLowerCase())}</option>`
              ).join("")}
            </select>
          </div>
        </div>

        <div class="branch-row">
          <input type="text" id="story-branch-label" placeholder="New branch's version label (e.g. branch-A)" />
          <button id="btn-create-version" class="btn">Branch new version</button>
        </div>

        <div class="entity-actions">
          <button id="btn-save-story" class="btn btn-accent">Save story</button>
        </div>

        <div class="entity-section">
          <div class="entity-section-header">
            <h2>Scenes</h2>
            <button id="btn-add-scene" class="btn btn-accent">+ New scene</button>
          </div>
          <ul class="entity-list" id="story-scene-list"></ul>
        </div>
      </div>
    `;

    const titleInput = dom.editor.querySelector("#story-title");
    titleInput.addEventListener("input", () => {
      draft.title = titleInput.value;
    });

    const versionLabelInput = dom.editor.querySelector("#story-version-label");
    versionLabelInput.addEventListener("input", () => {
      draft.versionLabel = versionLabelInput.value;
    });

    const stateSelect = dom.editor.querySelector("#story-state");
    stateSelect.addEventListener("change", () => {
      draft.state = stateSelect.value;
    });

    dom.editor.querySelector("#btn-save-story").addEventListener("click", () => {
      story.title = draft.title;
      story.versionLabel = draft.versionLabel;
      story.state = draft.state;
      persist();
      render();
    });

    dom.editor.querySelector("#btn-delete-story").addEventListener("click", () => {
      state.project.stories = state.project.stories.filter((entry) => entry.id !== story.id);
      state.selectedSection = null;
      state.selectedItemId = null;
      state.selectedSceneId = null;
      state.draft = null;
      persist();
      render();
    });

    dom.editor.querySelector("#btn-create-version").addEventListener("click", () => {
      const labelInput = dom.editor.querySelector("#story-branch-label");
      const branch = {
        id: crypto.randomUUID(),
        title: story.title,
        versionLabel: labelInput.value.trim(),
        parentVersionId: story.id,
        state: "DRAFT",
        // Linear narrative only — branching means a brand-new Story object that starts
        // as a copy of this one's scenes (scene IDs preserved, same as Story.createVersion).
        scenes: story.scenes.map((scene) => ({
          ...scene,
          characterRefs: [...scene.characterRefs],
          locationRefs: [...scene.locationRefs],
        })),
      };
      state.project.stories.push(branch);
      persist();
      selectItem("stories", branch.id);
    });

    renderSceneList(dom.editor.querySelector("#story-scene-list"), story);

    dom.editor.querySelector("#btn-add-scene").addEventListener("click", () => {
      const scene = createEmptyScene();
      story.scenes.push(scene);
      persist();
      selectScene(story.id, scene.id);
    });
  }

  function renderSceneList(listEl, story) {
    listEl.innerHTML = "";
    if (!story.scenes.length) {
      const li = document.createElement("li");
      li.className = "entity-list-empty";
      li.textContent = "No scenes yet.";
      listEl.appendChild(li);
      return;
    }
    story.scenes.forEach((scene, index) => {
      const li = document.createElement("li");
      li.className = "entity-list-item";

      const info = document.createElement("div");
      info.className = "entity-list-item-info";
      const title = document.createElement("span");
      title.className = "entity-list-item-title";
      title.textContent = `${index + 1}. ${scene.title || "(untitled)"}`;
      info.appendChild(title);
      if (scene.shortDescription) {
        const subtitle = document.createElement("span");
        subtitle.className = "entity-list-item-subtitle";
        subtitle.textContent = scene.shortDescription;
        info.appendChild(subtitle);
      }
      info.addEventListener("click", () => selectScene(story.id, scene.id));

      const removeBtn = document.createElement("button");
      removeBtn.className = "btn btn-small btn-danger";
      removeBtn.textContent = "Delete";
      removeBtn.addEventListener("click", (event) => {
        event.stopPropagation();
        story.scenes = story.scenes.filter((entry) => entry.id !== scene.id);
        if (state.selectedSceneId === scene.id) state.selectedSceneId = null;
        persist();
        render();
      });

      li.appendChild(info);
      li.appendChild(removeBtn);
      listEl.appendChild(li);
    });
  }

  // ---------- Scene editor ----------
  function renderSceneEditor(story, scene) {
    const draft = state.draft;
    dom.editor.innerHTML = `
      <div class="entity-view">
        <div class="entity-header">
          <h1>Scene editor</h1>
          <div class="entity-header-actions">
            <button id="btn-back-to-story" class="btn">← Back to story</button>
            <button id="btn-delete-scene" class="btn btn-danger">Delete scene</button>
          </div>
        </div>
        <p class="field-hint">ID: <code>${esc(scene.id)}</code> · in <code>${esc(story.title || "(untitled)")}</code></p>

        <label class="field-label" for="scene-title">Title</label>
        <input type="text" id="scene-title" value="${esc(draft.title)}" placeholder="Scene title" />

        <label class="field-label" for="scene-short-description">Short description</label>
        <input type="text" id="scene-short-description" value="${esc(draft.shortDescription)}" placeholder="One-line summary" />

        <label class="field-label" for="scene-content">Content</label>
        <textarea id="scene-content" rows="8" placeholder="Write the scene. Use [CHAR:id] / [LOC:id] tokens — they resolve to real names on compile.">${esc(
          draft.content
        )}</textarea>

        <div class="field-grid">
          <div>
            <label class="field-label" for="scene-emotion-tag">Emotion tag</label>
            <select id="scene-emotion-tag">
              <option value="">—</option>
              ${EMOTION_TAGS.map(
                (tag) => `<option value="${esc(tag)}" ${tag === draft.emotionTag ? "selected" : ""}>${esc(tag)}</option>`
              ).join("")}
            </select>
          </div>
          <div>
            <label class="field-label" for="scene-action-tag">Action tag</label>
            <input type="text" id="scene-action-tag" value="${esc(draft.actionTag)}" placeholder="e.g. Confrontation, Escape, Negotiation" />
          </div>
        </div>

        <div class="ref-section">
          <label class="field-label">Character references</label>
          <ul class="ref-list" id="scene-character-refs"></ul>
          <div class="ref-add-row">
            <select id="scene-add-character-ref"></select>
            <button id="btn-add-character-ref" class="btn">+ Add</button>
          </div>
        </div>

        <div class="ref-section">
          <label class="field-label">Location references</label>
          <ul class="ref-list" id="scene-location-refs"></ul>
          <div class="ref-add-row">
            <select id="scene-add-location-ref"></select>
            <button id="btn-add-location-ref" class="btn">+ Add</button>
          </div>
        </div>

        <div class="entity-actions">
          <button id="btn-save-scene" class="btn btn-accent">Save scene</button>
        </div>
      </div>
    `;

    dom.editor.querySelector("#scene-title").addEventListener("input", function () {
      draft.title = this.value;
    });
    dom.editor.querySelector("#scene-short-description").addEventListener("input", function () {
      draft.shortDescription = this.value;
    });
    dom.editor.querySelector("#scene-content").addEventListener("input", function () {
      draft.content = this.value;
    });
    dom.editor.querySelector("#scene-emotion-tag").addEventListener("change", function () {
      draft.emotionTag = this.value;
    });
    dom.editor.querySelector("#scene-action-tag").addEventListener("input", function () {
      draft.actionTag = this.value;
    });

    wireRefEditor({
      listEl: dom.editor.querySelector("#scene-character-refs"),
      selectEl: dom.editor.querySelector("#scene-add-character-ref"),
      addBtn: dom.editor.querySelector("#btn-add-character-ref"),
      refs: draft.characterRefs,
      pool: state.project.characters,
      labelFor: (entry) => entry.name || "(unnamed)",
      emptyLabel: "No character references yet.",
      noOptionsLabel: "No characters available",
    });

    wireRefEditor({
      listEl: dom.editor.querySelector("#scene-location-refs"),
      selectEl: dom.editor.querySelector("#scene-add-location-ref"),
      addBtn: dom.editor.querySelector("#btn-add-location-ref"),
      refs: draft.locationRefs,
      pool: state.project.locations,
      labelFor: (entry) => entry.name || "(unnamed)",
      emptyLabel: "No location references yet.",
      noOptionsLabel: "No locations available",
    });

    dom.editor.querySelector("#btn-back-to-story").addEventListener("click", () => {
      state.selectedSceneId = null;
      state.draft = { id: story.id, title: story.title, versionLabel: story.versionLabel, state: story.state };
      render();
    });

    dom.editor.querySelector("#btn-delete-scene").addEventListener("click", () => {
      story.scenes = story.scenes.filter((entry) => entry.id !== scene.id);
      state.selectedSceneId = null;
      state.draft = { id: story.id, title: story.title, versionLabel: story.versionLabel, state: story.state };
      persist();
      render();
    });

    dom.editor.querySelector("#btn-save-scene").addEventListener("click", () => {
      scene.title = draft.title;
      scene.shortDescription = draft.shortDescription;
      scene.content = draft.content;
      scene.emotionTag = draft.emotionTag;
      scene.actionTag = draft.actionTag;
      scene.characterRefs = [...draft.characterRefs];
      scene.locationRefs = [...draft.locationRefs];
      persist();
      render();
    });
  }

  // ---------- Character editor ----------
  function renderCharacterEditor(character) {
    const draft = state.draft;
    dom.editor.innerHTML = `
      <div class="entity-view">
        <div class="entity-header">
          <h1>Character editor</h1>
          <button id="btn-delete-character" class="btn btn-danger">Delete character</button>
        </div>
        <p class="field-hint">ID: <code>${esc(character.id)}</code></p>

        <label class="field-label" for="character-name">Name</label>
        <input type="text" id="character-name" value="${esc(draft.name)}" placeholder="Character name" />

        <label class="field-checkbox">
          <input type="checkbox" id="character-visible" ${draft.visible ? "checked" : ""} />
          Visible in the character list
        </label>

        <div class="entity-section">
          <div class="entity-section-header">
            <h2>Attributes</h2>
            <button id="btn-add-attribute" class="btn">+ Add attribute</button>
          </div>
          <p class="field-hint">Freeform key/value pairs — personality, emotional background, trust level, backstory…</p>
          <div class="attribute-list" id="character-attribute-list"></div>
        </div>

        <div class="entity-actions">
          <button id="btn-save-character" class="btn btn-accent">Save character</button>
        </div>
      </div>
    `;

    dom.editor.querySelector("#character-name").addEventListener("input", function () {
      draft.name = this.value;
    });
    dom.editor.querySelector("#character-visible").addEventListener("change", function () {
      draft.visible = this.checked;
    });

    const attributeContainer = dom.editor.querySelector("#character-attribute-list");
    function refreshAttributes() {
      renderAttributeRows(attributeContainer, draft.attributes, refreshAttributes);
    }
    refreshAttributes();

    dom.editor.querySelector("#btn-add-attribute").addEventListener("click", () => {
      draft.attributes.push({ key: "", value: "" });
      refreshAttributes();
    });

    dom.editor.querySelector("#btn-save-character").addEventListener("click", () => {
      character.name = draft.name;
      character.visible = draft.visible;
      character.attributes = attributesFromDraft(draft.attributes);
      persist();
      render();
    });

    dom.editor.querySelector("#btn-delete-character").addEventListener("click", () => {
      if (isCharacterReferenced(state.project, character.id)) {
        window.alert("This character is referenced in at least one scene and cannot be deleted.");
        return;
      }
      state.project.characters = state.project.characters.filter((entry) => entry.id !== character.id);
      state.selectedSection = null;
      state.selectedItemId = null;
      state.draft = null;
      persist();
      render();
    });
  }

  // ---------- Location editor ----------
  function renderLocationEditor(location) {
    const draft = state.draft;
    dom.editor.innerHTML = `
      <div class="entity-view">
        <div class="entity-header">
          <h1>Location editor</h1>
          <button id="btn-delete-location" class="btn btn-danger">Delete location</button>
        </div>
        <p class="field-hint">ID: <code>${esc(location.id)}</code></p>

        <label class="field-label" for="location-name">Name</label>
        <input type="text" id="location-name" value="${esc(draft.name)}" placeholder="Location name" />

        <div class="entity-section">
          <div class="entity-section-header">
            <h2>Attributes</h2>
            <button id="btn-add-attribute" class="btn">+ Add attribute</button>
          </div>
          <p class="field-hint">Freeform key/value pairs — geography, mood, history…</p>
          <div class="attribute-list" id="location-attribute-list"></div>
        </div>

        <div class="entity-actions">
          <button id="btn-save-location" class="btn btn-accent">Save location</button>
        </div>
      </div>
    `;

    dom.editor.querySelector("#location-name").addEventListener("input", function () {
      draft.name = this.value;
    });

    const attributeContainer = dom.editor.querySelector("#location-attribute-list");
    function refreshAttributes() {
      renderAttributeRows(attributeContainer, draft.attributes, refreshAttributes);
    }
    refreshAttributes();

    dom.editor.querySelector("#btn-add-attribute").addEventListener("click", () => {
      draft.attributes.push({ key: "", value: "" });
      refreshAttributes();
    });

    dom.editor.querySelector("#btn-save-location").addEventListener("click", () => {
      location.name = draft.name;
      location.attributes = attributesFromDraft(draft.attributes);
      persist();
      render();
    });

    dom.editor.querySelector("#btn-delete-location").addEventListener("click", () => {
      if (isLocationReferenced(state.project, location.id)) {
        window.alert("This location is referenced in at least one scene and cannot be deleted.");
        return;
      }
      state.project.locations = state.project.locations.filter((entry) => entry.id !== location.id);
      state.selectedSection = null;
      state.selectedItemId = null;
      state.draft = null;
      persist();
      render();
    });
  }

  // ---------- Background section editor ----------
  function renderBackgroundSectionEditor(section) {
    const draft = state.draft;
    dom.editor.innerHTML = `
      <div class="entity-view">
        <div class="entity-header">
          <h1>Background section editor</h1>
          <button id="btn-delete-section" class="btn btn-danger">Delete section</button>
        </div>
        <p class="field-hint">ID: <code>${esc(section.id)}</code> · use [CHAR:id] / [LOC:id] tokens to reference characters and locations.</p>

        <label class="field-label" for="section-title">Title</label>
        <input type="text" id="section-title" value="${esc(draft.title)}" placeholder="e.g. Geography, Technology, Historical events" />

        <label class="field-label" for="section-content">Content</label>
        <textarea id="section-content" rows="10" placeholder="Write the background lore here.">${esc(draft.content)}</textarea>

        <div class="entity-actions">
          <button id="btn-save-section" class="btn btn-accent">Save section</button>
        </div>
      </div>
    `;

    dom.editor.querySelector("#section-title").addEventListener("input", function () {
      draft.title = this.value;
    });
    dom.editor.querySelector("#section-content").addEventListener("input", function () {
      draft.content = this.value;
    });

    dom.editor.querySelector("#btn-save-section").addEventListener("click", () => {
      section.title = draft.title;
      section.content = draft.content;
      persist();
      render();
    });

    dom.editor.querySelector("#btn-delete-section").addEventListener("click", () => {
      state.project.background.sections = state.project.background.sections.filter((entry) => entry.id !== section.id);
      state.selectedSection = null;
      state.selectedItemId = null;
      state.draft = null;
      persist();
      render();
    });
  }

  // ---------- New project ----------
  dom.btnNewProject.addEventListener("click", () => {
    dom.inputProjectTitle.value = "";
    dom.dialogNewProject.showModal();
    dom.inputProjectTitle.focus();
  });

  dom.btnCancelNewProject.addEventListener("click", () => dom.dialogNewProject.close());

  dom.formNewProject.addEventListener("submit", async (event) => {
    event.preventDefault();
    const title = dom.inputProjectTitle.value.trim();
    if (!title) return;
    const { project, filePath } = await window.api.createProject(title);
    dom.dialogNewProject.close();
    setProject(project, filePath);
  });

  // ---------- Open project ----------
  dom.btnOpenProject.addEventListener("click", async () => {
    const projects = await window.api.listProjects();
    dom.openProjectList.innerHTML = "";
    dom.openProjectEmpty.hidden = projects.length > 0;
    projects.forEach((entry) => {
      const li = document.createElement("li");
      li.textContent = entry.title || "(untitled)";
      li.addEventListener("click", async () => {
        const project = await window.api.loadProject(entry.filePath);
        dom.dialogOpenProject.close();
        setProject(project, entry.filePath);
      });
      dom.openProjectList.appendChild(li);
    });
    dom.dialogOpenProject.showModal();
  });

  dom.btnCancelOpenProject.addEventListener("click", () => dom.dialogOpenProject.close());

  // ---------- Save ----------
  dom.btnSaveProject.addEventListener("click", async () => {
    if (!state.project || !state.filePath) return;
    await window.api.saveProject(state.project, state.filePath);
  });

  // ---------- Validate ----------
  function renderReportList(listEl, emptyEl, messages) {
    listEl.innerHTML = "";
    emptyEl.hidden = messages.length > 0;
    messages.forEach((message) => {
      const li = document.createElement("li");
      li.textContent = message;
      listEl.appendChild(li);
    });
  }

  dom.btnValidate.addEventListener("click", async () => {
    if (!state.project) return;
    const report = await window.api.validateProject(state.project);
    dom.validationSummary.textContent = report.summary;
    renderReportList(dom.validationErrors, dom.validationErrorsEmpty, report.errors);
    renderReportList(dom.validationWarnings, dom.validationWarningsEmpty, report.warnings);
    dom.dialogValidationReport.showModal();
  });

  // ---------- Compile ----------
  const compileState = { storyId: null, order: [] };

  function currentCompileStory() {
    return state.project.stories.find((entry) => entry.id === compileState.storyId) || null;
  }

  function renderCompileSceneOrder() {
    const story = currentCompileStory();
    dom.compileSceneOrder.innerHTML = "";
    if (!story || !story.scenes.length) {
      const li = document.createElement("li");
      li.className = "nav-list-empty";
      li.textContent = "This story has no scenes yet.";
      dom.compileSceneOrder.appendChild(li);
      return;
    }
    const byId = new Map(story.scenes.map((scene) => [scene.id, scene]));
    compileState.order.forEach((sceneId, index) => {
      const scene = byId.get(sceneId);
      if (!scene) return;
      const li = document.createElement("li");
      li.className = "entity-list-item";

      const info = document.createElement("span");
      info.textContent = scene.title || "(untitled scene)";
      li.appendChild(info);

      const actions = document.createElement("span");
      actions.className = "entity-list-item-actions";

      const upBtn = document.createElement("button");
      upBtn.className = "btn btn-move";
      upBtn.textContent = "▲";
      upBtn.disabled = index === 0;
      upBtn.addEventListener("click", () => {
        [compileState.order[index - 1], compileState.order[index]] = [compileState.order[index], compileState.order[index - 1]];
        renderCompileSceneOrder();
      });

      const downBtn = document.createElement("button");
      downBtn.className = "btn btn-move";
      downBtn.textContent = "▼";
      downBtn.disabled = index === compileState.order.length - 1;
      downBtn.addEventListener("click", () => {
        [compileState.order[index], compileState.order[index + 1]] = [compileState.order[index + 1], compileState.order[index]];
        renderCompileSceneOrder();
      });

      actions.appendChild(upBtn);
      actions.appendChild(downBtn);
      li.appendChild(actions);
      dom.compileSceneOrder.appendChild(li);
    });
  }

  function selectCompileStory(storyId) {
    compileState.storyId = storyId;
    const story = currentCompileStory();
    compileState.order = story ? story.scenes.map((scene) => scene.id) : [];
    dom.compilePreview.value = "";
    dom.compileExportResult.textContent = "";
    renderCompileSceneOrder();
  }

  dom.btnCompile.addEventListener("click", () => {
    if (!state.project) return;
    dom.compileStorySelect.innerHTML = state.project.stories.length
      ? state.project.stories.map((story) => `<option value="${esc(story.id)}">${esc(story.title || "(untitled)")}</option>`).join("")
      : `<option value="">No stories in this project</option>`;
    dom.compileFormat.value = "txt";
    selectCompileStory(state.project.stories[0] ? state.project.stories[0].id : null);
    dom.dialogCompile.showModal();
  });

  dom.compileStorySelect.addEventListener("change", () => selectCompileStory(dom.compileStorySelect.value));

  dom.btnCancelCompile.addEventListener("click", () => dom.dialogCompile.close());

  dom.btnCompilePreview.addEventListener("click", async () => {
    const story = currentCompileStory();
    if (!story) return;
    dom.compileExportResult.textContent = "";
    dom.compilePreview.value = await window.api.compileStory(state.project, story.id, compileState.order);
  });

  dom.btnCompileExport.addEventListener("click", async () => {
    const content = dom.compilePreview.value;
    if (!content.trim()) {
      dom.compileExportResult.textContent = "Generate a preview before exporting.";
      return;
    }
    const format = dom.compileFormat.value;
    const result = await window.api.exportCompiled(content, format);
    dom.compileExportResult.textContent = result.canceled ? "Export canceled." : `Exported to ${result.filePath}`;
  });

  // ---------- Search ----------
  function populateSearchPickers() {
    dom.searchEmotionTag.innerHTML =
      `<option value="">Any</option>` + EMOTION_TAGS.map((tag) => `<option value="${esc(tag)}">${esc(tag)}</option>`).join("");
    dom.searchCharacterRef.innerHTML =
      `<option value="">Any</option>` +
      state.project.characters.map((character) => `<option value="${esc(character.id)}">${esc(character.name || "(unnamed)")}</option>`).join("");
  }

  function renderSearchResults(listEl, emptyEl, items, labelFor, onSelect) {
    listEl.innerHTML = "";
    emptyEl.hidden = items.length > 0;
    items.forEach((item) => {
      const li = document.createElement("li");
      li.textContent = labelFor(item);
      li.addEventListener("click", () => {
        dom.dialogSearch.close();
        onSelect(item);
      });
      listEl.appendChild(li);
    });
  }

  dom.btnSearch.addEventListener("click", () => {
    if (!state.project) return;
    dom.searchText.value = "";
    dom.searchActionTag.value = "";
    populateSearchPickers();
    dom.searchEmotionTag.value = "";
    dom.searchCharacterRef.value = "";
    renderSearchResults(dom.searchResultsScenes, dom.searchResultsScenesEmpty, [], () => "", () => {});
    renderSearchResults(dom.searchResultsCharacters, dom.searchResultsCharactersEmpty, [], () => "", () => {});
    dom.dialogSearch.showModal();
  });

  dom.btnCancelSearch.addEventListener("click", () => dom.dialogSearch.close());

  dom.btnRunSearch.addEventListener("click", async () => {
    if (!state.project) return;
    const title = dom.searchText.value.trim();
    const emotionTag = dom.searchEmotionTag.value;
    const actionTag = dom.searchActionTag.value.trim();
    const characterRef = dom.searchCharacterRef.value;

    const sceneCriteria = {};
    if (title) sceneCriteria.title = title;
    if (emotionTag) sceneCriteria.emotionTag = emotionTag;
    if (actionTag) sceneCriteria.actionTag = actionTag;
    if (characterRef) sceneCriteria.characterRef = characterRef;

    const characterCriteria = {};
    if (title) characterCriteria.name = title;

    const [scenes, characters] = await Promise.all([
      window.api.searchScenes(state.project, sceneCriteria),
      // A bare character-ref/emotion/action filter doesn't translate to a character search —
      // only the free-text "title / name" field applies to characters.
      Object.keys(characterCriteria).length ? window.api.searchCharacters(state.project, characterCriteria) : Promise.resolve([]),
    ]);

    const storyByScene = new Map();
    state.project.stories.forEach((story) => story.scenes.forEach((scene) => storyByScene.set(scene.id, story)));

    renderSearchResults(
      dom.searchResultsScenes,
      dom.searchResultsScenesEmpty,
      scenes,
      (scene) => `${scene.title || "(untitled scene)"} — ${(storyByScene.get(scene.id) || {}).title || "(untitled story)"}`,
      (scene) => {
        const story = storyByScene.get(scene.id);
        if (story) navigateToScene(story.id, scene.id);
      }
    );
    renderSearchResults(
      dom.searchResultsCharacters,
      dom.searchResultsCharactersEmpty,
      characters,
      (character) => character.name || "(unnamed)",
      (character) => selectItem("characters", character.id)
    );
  });

  // ---------- Sidebar "create new" buttons ----------
  Object.entries(dom.addButtons).forEach(([sectionKey, button]) => {
    if (!button) return;
    button.addEventListener("click", () => {
      if (!state.project) return;
      const entity = ENTITY_FACTORIES[sectionKey]();
      if (sectionKey === "stories") state.project.stories.push(entity);
      else if (sectionKey === "characters") state.project.characters.push(entity);
      else if (sectionKey === "locations") state.project.locations.push(entity);
      else if (sectionKey === "background") state.project.background.sections.push(entity);
      persist();
      selectItem(sectionKey, entity.id);
    });
  });

  render();
})();

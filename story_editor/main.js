// main.js — Electron main process
const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("path");
const fs = require("fs");
const Project = require("./models/project");
const Storage = require("./services/storage");
const { Validator } = require("./services/validator");
const StoryCompiler = require("./services/compiler");
const SearchService = require("./services/search");

const storage = new Storage();
const compiler = new StoryCompiler();
const DATA_DIR = path.join(__dirname, "data");

let mainWindow = null;

const EXPORT_FILTERS = {
  txt: [{ name: "Plain text", extensions: ["txt"] }],
  md: [{ name: "Markdown", extensions: ["md"] }],
  json: [{ name: "JSON", extensions: ["json"] }],
  pdf: [{ name: "PDF", extensions: ["pdf"] }],
};

function listProjectFiles() {
  if (!fs.existsSync(DATA_DIR)) return [];
  return fs
    .readdirSync(DATA_DIR)
    .filter((name) => name.endsWith(".json") && !name.includes(".autosave.json"))
    .map((name) => {
      const filePath = path.join(DATA_DIR, name);
      try {
        const project = storage.loadProject(filePath);
        // Check if an autosave file exists for this project
        const autoSavePath = path.join(DATA_DIR, `${project.id}.autosave.json`);
        const hasAutoSave = fs.existsSync(autoSavePath);
        return { id: project.id, title: project.title, filePath, hasAutoSave, autoSavePath };
      } catch {
        return null;
      }
    })
    .filter(Boolean);
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    backgroundColor: "#1e1f22",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  mainWindow.loadFile(path.join(__dirname, "renderer", "index.html"));
  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

// All filesystem access stays in the main process; the renderer only ever
// trades plain JSON with it through the IPC bridge exposed by preload.js.
ipcMain.handle("projects:list", () => listProjectFiles());

ipcMain.handle("projects:create", (event, title) => {
  const project = new Project({ title });
  const filePath = path.join(DATA_DIR, `${project.id}.json`);
  storage.saveProject(project, filePath);
  return { project: project.toJSON(), filePath };
});

ipcMain.handle("projects:load", (event, filePath) => {
  return storage.loadProject(filePath).toJSON();
});

ipcMain.handle("projects:loadAutoSave", (event, autoSavePath) => {
  // Load a project from its autosave file (e.g., after crash recovery)
  return storage.loadProject(autoSavePath).toJSON();
});

ipcMain.handle("projects:save", (event, projectData, filePath) => {
  storage.saveProject(Project.fromJSON(projectData), filePath);
  return true;
});

ipcMain.handle("projects:autoSave", (event, projectData) => {
  return storage.autoSave(Project.fromJSON(projectData));
});

// ValidationReport instances aren't structured-clone-friendly over IPC — return plain data.
ipcMain.handle("project:validate", (event, projectData) => {
  const report = new Validator().validate(Project.fromJSON(projectData));
  return { errors: report.errors, warnings: report.warnings, summary: report.summary() };
});

// `sceneOrder` (if given) reorders the story's scenes for this compile only — it is never
// written back to the project, so the writer's saved scene order is left untouched.
ipcMain.handle("story:compile", (event, projectData, storyId, sceneOrder) => {
  const project = Project.fromJSON(projectData);
  const story = project.stories.find((entry) => entry.id === storyId);
  if (!story) throw new Error(`Story "${storyId}" not found in project.`);
  if (sceneOrder) story.reorderScenes(sceneOrder);
  return compiler.compile(story, project);
});

ipcMain.handle("story:export", async (event, content, format) => {
  const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
    title: "Export compiled story",
    defaultPath: `compiled.${format}`,
    filters: EXPORT_FILTERS[format] || [],
  });
  if (canceled || !filePath) return { canceled: true };
  const result = compiler.exportToFile(content, filePath, format);
  // PDF export returns a Promise; others return undefined
  if (result instanceof Promise) {
    await result;
  }
  return { canceled: false, filePath };
});

ipcMain.handle("project:searchScenes", (event, projectData, criteria) => {
  const project = Project.fromJSON(projectData);
  return new SearchService(project).searchScenes(criteria).map((scene) => scene.toJSON());
});

ipcMain.handle("project:searchCharacters", (event, projectData, criteria) => {
  const project = Project.fromJSON(projectData);
  return new SearchService(project).searchCharacters(criteria).map((character) => character.toJSON());
});

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

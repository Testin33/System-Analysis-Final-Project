// preload.js — secure bridge between the renderer and the main process
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
  listProjects: () => ipcRenderer.invoke("projects:list"),
  createProject: (title) => ipcRenderer.invoke("projects:create", title),
  loadProject: (filePath) => ipcRenderer.invoke("projects:load", filePath),
  saveProject: (projectData, filePath) => ipcRenderer.invoke("projects:save", projectData, filePath),
  autoSaveProject: (projectData) => ipcRenderer.invoke("projects:autoSave", projectData),
  validateProject: (projectData) => ipcRenderer.invoke("project:validate", projectData),
  compileStory: (projectData, storyId, sceneOrder) => ipcRenderer.invoke("story:compile", projectData, storyId, sceneOrder),
  exportCompiled: (content, format) => ipcRenderer.invoke("story:export", content, format),
  searchScenes: (projectData, criteria) => ipcRenderer.invoke("project:searchScenes", projectData, criteria),
  searchCharacters: (projectData, criteria) => ipcRenderer.invoke("project:searchCharacters", projectData, criteria),
});

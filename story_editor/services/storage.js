// services/storage.js
// Local JSON persistence via Node's fs module — no database, runs fully offline.
const fs = require("fs");
const path = require("path");
const Project = require("../models/project");

const DATA_DIR = path.join(__dirname, "..", "data");
const AUTO_SAVE_SUFFIX = ".autosave.json";

class Storage {
  saveProject(project, filePath) {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(project.toJSON(), null, 2), "utf-8");
  }

  loadProject(filePath) {
    const raw = fs.readFileSync(filePath, "utf-8");
    return Project.fromJSON(JSON.parse(raw));
  }

  // Fires after every mutation; crash recovery reads this file back via loadProject().
  autoSave(project) {
    const filePath = path.join(DATA_DIR, `${project.id}${AUTO_SAVE_SUFFIX}`);
    this.saveProject(project, filePath);
    return filePath;
  }
}

module.exports = Storage;

// services/compiler.js
// Replaces [CHAR:ID] / [LOC:ID] tokens with real names — only these two ID types are resolved.
const fs = require("fs");

const TOKEN_PATTERN = /\[(CHAR|LOC):([^\]]+)\]/g;

class StoryCompiler {
  compile(story, project) {
    const charById = new Map(project.characters.map((character) => [character.id, character]));
    const locById = new Map(project.locations.map((location) => [location.id, location]));

    return story.scenes
      .map((scene) => this._resolveTokens(scene.content, charById, locById))
      .join("\n\n");
  }

  // Same as compile(), but intended for UI preview — never writes to disk.
  preview(story, project) {
    return this.compile(story, project);
  }

  exportToFile(content, filePath, format) {
    switch (format) {
      case "txt":
      case "md":
        fs.writeFileSync(filePath, content, "utf-8");
        break;
      case "json":
        fs.writeFileSync(filePath, JSON.stringify({ content }, null, 2), "utf-8");
        break;
      case "pdf":
        throw new Error("PDF export needs a PDF-generation library that isn't wired up yet — use .txt/.md/.json for now.");
      default:
        throw new Error(`Unsupported export format: "${format}"`);
    }
  }

  _resolveTokens(content, charById, locById) {
    return content.replace(TOKEN_PATTERN, (match, kind, id) => {
      const entity = kind === "CHAR" ? charById.get(id) : locById.get(id);
      return entity ? entity.name : match;
    });
  }
}

module.exports = StoryCompiler;

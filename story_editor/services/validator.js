// services/validator.js
// Validator never blocks the writer — it only reports issues for the UI to show in a popup.

class ValidationReport {
  constructor() {
    this.warnings = [];
    this.errors = [];
  }

  addWarning(message) {
    this.warnings.push(message);
  }

  addError(message) {
    this.errors.push(message);
  }

  hasIssues() {
    return this.warnings.length > 0 || this.errors.length > 0;
  }

  summary() {
    return `${this.errors.length} error(s), ${this.warnings.length} warning(s)`;
  }
}

class Validator {
  validate(project) {
    const report = new ValidationReport();
    const characterIds = new Set(project.characters.map((character) => character.id));
    const locationIds = new Set(project.locations.map((location) => location.id));

    for (const story of project.stories) {
      for (const scene of story.scenes) {
        const label = `"${scene.title || scene.id}" (story "${story.title || story.id}")`;

        if (scene.isEmpty()) {
          report.addWarning(`Scene ${label} has no title, description, or content.`);
        } else {
          if (!scene.title.trim()) report.addWarning(`Scene ${label} has a blank title.`);
          if (!scene.content.trim()) report.addWarning(`Scene ${label} has no content.`);
        }

        for (const charId of scene.characterRefs) {
          if (!characterIds.has(charId)) {
            report.addError(`Scene ${label} references unknown character ID "${charId}".`);
          }
        }
        for (const locId of scene.locationRefs) {
          if (!locationIds.has(locId)) {
            report.addError(`Scene ${label} references unknown location ID "${locId}".`);
          }
        }

        // "Isolated" = it shares no character/location references with anything else,
        // so it is disconnected from the rest of the project's narrative web.
        if (scene.characterRefs.length === 0 && scene.locationRefs.length === 0) {
          report.addWarning(`Scene ${label} is isolated — it has no character or location references connecting it to the rest of the project.`);
        }
      }
    }

    return report;
  }
}

module.exports = { Validator, ValidationReport };

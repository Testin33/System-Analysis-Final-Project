// models/background.js
// BackgroundStory is a global, project-wide reference (not linked to specific scenes).
// Section content can contain [CHAR:ID] / [LOC:ID] tokens, same as Scene content.
const { randomUUID } = require("crypto");

class BackgroundSection {
  constructor({ id = randomUUID(), title = "", content = "" } = {}) {
    this.id = id;
    this.title = title;
    this.content = content;
  }

  toJSON() {
    return { id: this.id, title: this.title, content: this.content };
  }

  static fromJSON(data) {
    return new BackgroundSection(data);
  }
}

class BackgroundStory {
  constructor({ sections = [] } = {}) {
    this.sections = sections.map((section) =>
      section instanceof BackgroundSection ? section : new BackgroundSection(section)
    );
  }

  addSection(section) {
    this.sections.push(section);
  }

  removeSection(sectionId) {
    const before = this.sections.length;
    this.sections = this.sections.filter((section) => section.id !== sectionId);
    return this.sections.length < before;
  }

  toJSON() {
    return { sections: this.sections.map((section) => section.toJSON()) };
  }

  static fromJSON(data) {
    return new BackgroundStory(data || {});
  }
}

module.exports = { BackgroundSection, BackgroundStory };

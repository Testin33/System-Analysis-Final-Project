// models/scene.js
const { randomUUID } = require("crypto");

class Scene {
  constructor({
    id = randomUUID(),
    title = "",
    shortDescription = "",
    content = "",
    emotionTag = "",
    actionTag = "",
    characterRefs = [],
    locationRefs = [],
  } = {}) {
    this.id = id;
    this.title = title;
    this.shortDescription = shortDescription;
    this.content = content;
    this.emotionTag = emotionTag;
    this.actionTag = actionTag;
    this.characterRefs = [...characterRefs];
    this.locationRefs = [...locationRefs];
  }

  addCharacterRef(charId) {
    if (!this.characterRefs.includes(charId)) {
      this.characterRefs.push(charId);
    }
  }

  removeCharacterRef(charId) {
    this.characterRefs = this.characterRefs.filter((id) => id !== charId);
  }

  addLocationRef(locId) {
    if (!this.locationRefs.includes(locId)) {
      this.locationRefs.push(locId);
    }
  }

  removeLocationRef(locId) {
    this.locationRefs = this.locationRefs.filter((id) => id !== locId);
  }

  // No fields are mandatory on save; this just flags scenes the Validator should warn about.
  isEmpty() {
    return (
      !this.title.trim() &&
      !this.shortDescription.trim() &&
      !this.content.trim()
    );
  }

  toJSON() {
    return {
      id: this.id,
      title: this.title,
      shortDescription: this.shortDescription,
      content: this.content,
      emotionTag: this.emotionTag,
      actionTag: this.actionTag,
      characterRefs: [...this.characterRefs],
      locationRefs: [...this.locationRefs],
    };
  }

  static fromJSON(data) {
    return new Scene(data);
  }
}

module.exports = Scene;

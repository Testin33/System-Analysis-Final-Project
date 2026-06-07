// models/character.js
const { randomUUID } = require("crypto");

class Character {
  constructor({
    id = randomUUID(),
    name = "",
    visible = true,
    attributes = {},
  } = {}) {
    this.id = id;
    this.name = name;
    this.visible = visible; // if false, character is hidden from the character list view
    this.attributes = { ...attributes }; // freeform: personality, emotional background, trust level, backstory...
  }

  isReferencedIn(scenes) {
    return scenes.some((scene) => scene.characterRefs.includes(this.id));
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      visible: this.visible,
      attributes: { ...this.attributes },
    };
  }

  static fromJSON(data) {
    return new Character(data);
  }
}

module.exports = Character;

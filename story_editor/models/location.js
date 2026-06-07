// models/location.js
const { randomUUID } = require("crypto");

class Location {
  constructor({ id = randomUUID(), name = "", attributes = {} } = {}) {
    this.id = id;
    this.name = name;
    this.attributes = { ...attributes };
  }

  isReferencedIn(scenes) {
    return scenes.some((scene) => scene.locationRefs.includes(this.id));
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      attributes: { ...this.attributes },
    };
  }

  static fromJSON(data) {
    return new Location(data);
  }
}

module.exports = Location;

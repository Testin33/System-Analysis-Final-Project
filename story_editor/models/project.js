// models/project.js
const { randomUUID } = require("crypto");
const { Observable } = require("../patterns/observer");
const { Story } = require("./story");
const Character = require("./character");
const Location = require("./location");
const { BackgroundStory } = require("./background");

// Subject of the Observer pattern: every mutation ends with notifyObservers()
// so Dashboard (and any other Observer) can recompute its metrics.
class Project extends Observable {
  constructor({
    id = randomUUID(),
    title = "",
    stories = [],
    characters = [],
    locations = [],
    background = {},
  } = {}) {
    super();
    this.id = id;
    this.title = title;
    this.stories = stories.map((story) => (story instanceof Story ? story : new Story(story)));
    this.characters = characters.map((character) =>
      character instanceof Character ? character : new Character(character)
    );
    this.locations = locations.map((location) =>
      location instanceof Location ? location : new Location(location)
    );
    this.background = background instanceof BackgroundStory ? background : new BackgroundStory(background);
  }

  // Flattens every scene across every story — used for reference checks (Validator, guards).
  allScenes() {
    return this.stories.flatMap((story) => story.scenes);
  }

  addStory(story) {
    this.stories.push(story);
    this.notifyObservers();
  }

  removeStory(storyId) {
    const before = this.stories.length;
    this.stories = this.stories.filter((story) => story.id !== storyId);
    const removed = this.stories.length < before;
    if (removed) this.notifyObservers();
    return removed;
  }

  addCharacter(character) {
    this.characters.push(character);
    this.notifyObservers();
  }

  // Cannot be deleted if referenced in any scene.
  removeCharacter(characterId) {
    const character = this.characters.find((c) => c.id === characterId);
    if (!character || character.isReferencedIn(this.allScenes())) {
      return false;
    }
    this.characters = this.characters.filter((c) => c.id !== characterId);
    this.notifyObservers();
    return true;
  }

  addLocation(location) {
    this.locations.push(location);
    this.notifyObservers();
  }

  removeLocation(locationId) {
    const location = this.locations.find((l) => l.id === locationId);
    if (!location || location.isReferencedIn(this.allScenes())) {
      return false;
    }
    this.locations = this.locations.filter((l) => l.id !== locationId);
    this.notifyObservers();
    return true;
  }

  toJSON() {
    return {
      id: this.id,
      title: this.title,
      stories: this.stories.map((story) => story.toJSON()),
      characters: this.characters.map((character) => character.toJSON()),
      locations: this.locations.map((location) => location.toJSON()),
      background: this.background.toJSON(),
    };
  }

  static fromJSON(data) {
    return new Project(data);
  }
}

module.exports = Project;

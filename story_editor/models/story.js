// models/story.js
const { randomUUID } = require("crypto");
const Scene = require("./scene");

const StoryState = Object.freeze({
  DRAFT: "DRAFT",
  VALIDATED: "VALIDATED",
  PUBLISHED: "PUBLISHED",
});

class Story {
  constructor({
    id = randomUUID(),
    title = "",
    versionLabel = "",
    parentVersionId = null,
    state = StoryState.DRAFT,
    scenes = [],
  } = {}) {
    this.id = id;
    this.title = title;
    this.versionLabel = versionLabel;
    this.parentVersionId = parentVersionId; // enables branching: a new Story per branch
    this.state = state;
    this.scenes = scenes.map((scene) => (scene instanceof Scene ? scene : new Scene(scene)));
  }

  addScene(scene) {
    this.scenes.push(scene);
  }

  removeScene(sceneId) {
    const before = this.scenes.length;
    this.scenes = this.scenes.filter((scene) => scene.id !== sceneId);
    return this.scenes.length < before;
  }

  // `order` is a list of scene IDs in the desired sequence (drag-drop or typed).
  reorderScenes(order) {
    const byId = new Map(this.scenes.map((scene) => [scene.id, scene]));
    const reordered = order.map((sceneId) => byId.get(sceneId)).filter(Boolean);
    const remaining = this.scenes.filter((scene) => !order.includes(scene.id));
    this.scenes = [...reordered, ...remaining];
  }

  changeState(newState) {
    if (!Object.values(StoryState).includes(newState)) {
      throw new Error(`Invalid story state: ${newState}`);
    }
    this.state = newState;
  }

  // Branching happens at the Story level (linear scenes only — no parallel branching).
  createVersion(label) {
    return new Story({
      title: this.title,
      versionLabel: label,
      parentVersionId: this.id,
      state: StoryState.DRAFT,
      scenes: this.scenes.map((scene) => new Scene(scene.toJSON())),
    });
  }

  toJSON() {
    return {
      id: this.id,
      title: this.title,
      versionLabel: this.versionLabel,
      parentVersionId: this.parentVersionId,
      state: this.state,
      scenes: this.scenes.map((scene) => scene.toJSON()),
    };
  }

  static fromJSON(data) {
    return new Story(data);
  }
}

module.exports = { Story, StoryState };

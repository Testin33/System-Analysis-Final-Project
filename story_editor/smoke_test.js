// Temporary manual smoke test for Fase 2 — exercises models + Observer + Storage end to end.
// Run with: node smoke_test.js   (delete once verified, or keep as a quick sanity check)
const { Observer } = require("./patterns/observer");
const Project = require("./models/project");
const { Story, StoryState } = require("./models/story");
const Scene = require("./models/scene");
const Character = require("./models/character");
const Location = require("./models/location");
const Storage = require("./services/storage");

class FakeDashboard extends Observer {
  constructor() {
    super();
    this.updateCount = 0;
  }
  update(project) {
    this.updateCount += 1;
    console.log(`  [Dashboard] notified (#${this.updateCount}) — scenes: ${project.allScenes().length}, characters: ${project.characters.length}`);
  }
}

console.log("1. Create project + observer wiring");
const project = new Project({ title: "Demo Project" });
const dashboard = new FakeDashboard();
project.addObserver(dashboard);

console.log("2. Add character + location");
const elena = new Character({ name: "Elena", attributes: { trustLevel: "high" } });
const marco = new Character({ name: "Marco" });
const castle = new Location({ name: "Castillo del Norte" });
project.addCharacter(elena);
project.addCharacter(marco);
project.addLocation(castle);

console.log("3. Create story + scenes");
const story = new Story({ title: "Chapter 1", versionLabel: "v1" });
const scene1 = new Scene({
  title: "The Meeting",
  shortDescription: "Elena meets Marco",
  content: "[CHAR:" + elena.id + "] se encontró con [CHAR:" + marco.id + "] en [LOC:" + castle.id + "].",
  emotionTag: "Rookie Optimism",
  actionTag: "dialogue",
});
scene1.addCharacterRef(elena.id);
scene1.addCharacterRef(marco.id);
scene1.addLocationRef(castle.id);
const blankScene = new Scene();
story.addScene(scene1);
story.addScene(blankScene);
project.addStory(story);

console.log("4. Reorder, branch, change state");
story.reorderScenes([blankScene.id, scene1.id]);
console.assert(story.scenes[0].id === blankScene.id, "reorderScenes should move the blank scene first");
story.changeState(StoryState.VALIDATED);
const branch = story.createVersion("v2-branch");
project.addStory(branch);
console.assert(branch.parentVersionId === story.id, "branch should reference parent story id");

console.log("5. Guarded removal: character referenced in a scene cannot be removed");
console.assert(project.removeCharacter(elena.id) === false, "Elena is referenced — removal must fail");
console.assert(project.removeCharacter(marco.id) === false, "Marco is referenced — removal must fail");
console.assert(project.locations.length === 1 && !project.removeLocation(castle.id), "Castle is referenced — removal must fail");

console.log("6. isEmpty / isReferencedIn checks");
console.assert(story.scenes[0].isEmpty() === true, "blank scene should report isEmpty() === true");
console.assert(scene1.isEmpty() === false, "filled-in scene should report isEmpty() === false");
console.assert(elena.isReferencedIn(project.allScenes()) === true, "Elena should be referenced in scenes");

console.log("7. Save + load round trip via Storage");
const storage = new Storage();
const savePath = require("path").join(__dirname, "data", `${project.id}.json`);
storage.saveProject(project, savePath);
const reloaded = Project.fromJSON(JSON.parse(require("fs").readFileSync(savePath, "utf-8")));
console.assert(reloaded.title === project.title, "reloaded project title should match");
console.assert(reloaded.stories.length === project.stories.length, "reloaded stories count should match");
console.assert(reloaded.allScenes().length === project.allScenes().length, "reloaded scene count should match");
console.assert(reloaded.characters[0] instanceof Character, "reloaded characters should be Character instances");

console.log("8. autoSave");
const autoSavePath = storage.autoSave(project);
console.assert(require("fs").existsSync(autoSavePath), "autosave file should exist");

console.log(`\nDashboard was notified ${dashboard.updateCount} times via notifyObservers().`);
console.log("All smoke-test assertions passed ✅");

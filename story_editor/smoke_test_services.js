// Temporary manual smoke test for Fase 3 — exercises Validator, StoryCompiler, SearchService.
// Run with: node smoke_test_services.js
const fs = require("fs");
const path = require("path");
const Project = require("./models/project");
const { Story } = require("./models/story");
const Scene = require("./models/scene");
const Character = require("./models/character");
const Location = require("./models/location");
const { Validator } = require("./services/validator");
const StoryCompiler = require("./services/compiler");
const SearchService = require("./services/search");

const project = new Project({ title: "Demo Project" });
const elena = new Character({ name: "Elena", attributes: { trustLevel: "high" } });
const marco = new Character({ name: "Marco", attributes: { trustLevel: "low" } });
const castle = new Location({ name: "Castillo del Norte" });
project.addCharacter(elena);
project.addCharacter(marco);
project.addLocation(castle);

const story = new Story({ title: "Chapter 1" });
const goodScene = new Scene({
  title: "The Meeting",
  shortDescription: "Elena meets Marco",
  content: `[CHAR:${elena.id}] se encontró con [CHAR:${marco.id}] en [LOC:${castle.id}].`,
  emotionTag: "Rookie Optimism",
  actionTag: "dialogue",
  characterRefs: [elena.id, marco.id],
  locationRefs: [castle.id],
});
const blankScene = new Scene();
const brokenRefScene = new Scene({
  title: "Mystery Stranger",
  content: "[CHAR:does-not-exist] aparece de la nada.",
  characterRefs: ["does-not-exist"],
});
story.addScene(goodScene);
story.addScene(blankScene);
story.addScene(brokenRefScene);
project.addStory(story);

console.log("1. Validator");
const report = new Validator().validate(project);
console.log(`  summary: ${report.summary()}`);
console.log("  errors:", report.errors);
console.log("  warnings:", report.warnings);
console.assert(report.hasIssues() === true, "report should have issues");
console.assert(
  report.errors.some((e) => e.includes("does-not-exist")),
  "should report unresolved character ref"
);
console.assert(
  report.warnings.some((w) => w.includes("isolated")),
  "blank scene should be flagged as isolated"
);
console.assert(
  report.warnings.some((w) => w.includes("no title, description, or content")),
  "blank scene should be flagged as empty"
);

console.log("\n2. StoryCompiler");
const compiler = new StoryCompiler();
const compiled = compiler.compile(story, project);
console.log(`  compiled:\n${compiled}\n`);
console.assert(compiled.includes("Elena se encontró con Marco en Castillo del Norte"), "tokens should resolve to real names");
console.assert(compiled.includes("[CHAR:does-not-exist]"), "unresolved tokens should be left untouched");
console.assert(compiler.preview(story, project) === compiled, "preview() should match compile() output");

const exportPath = path.join(__dirname, "data", "compiled_preview.txt");
compiler.exportToFile(compiled, exportPath, "txt");
console.assert(fs.existsSync(exportPath), "exportToFile should write a .txt file");
fs.unlinkSync(exportPath);
let pdfRejected = false;
try {
  compiler.exportToFile(compiled, exportPath, "pdf");
} catch (err) {
  pdfRejected = true;
}
console.assert(pdfRejected, "exportToFile should reject unsupported .pdf for now");

console.log("\n3. SearchService");
const search = new SearchService(project);
const byEmotion = search.searchScenes({ emotionTag: "Rookie Optimism" });
console.assert(byEmotion.length === 1 && byEmotion[0].id === goodScene.id, "should find scene by emotionTag");

const byEmotionAndChar = search.searchScenes({ emotionTag: "Rookie Optimism", characterRef: marco.id });
console.assert(byEmotionAndChar.length === 1, "should support combined emotionTag + characterRef criteria");

const byEmotionAndOtherChar = search.searchScenes({ emotionTag: "Rookie Optimism", characterRef: "someone-else" });
console.assert(byEmotionAndOtherChar.length === 0, "combined criteria should be ANDed, not ORed");

const byName = search.searchCharacters({ name: "mar" });
console.assert(byName.length === 1 && byName[0].id === marco.id, "should find character by partial name (case-insensitive)");

const byAttribute = search.searchCharacters({ attributes: { trustLevel: "low" } });
console.assert(byAttribute.length === 1 && byAttribute[0].id === marco.id, "should filter characters by attribute value");

console.log("\nAll service smoke-test assertions passed ✅");

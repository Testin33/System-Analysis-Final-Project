// services/search.js
// Bound to a Project so search_scenes/search_characters can match the class-diagram
// signatures (criteria only) while still navigating project.stories -> story.scenes.
class SearchService {
  constructor(project) {
    this.project = project;
  }

  // criteria: { title, emotionTag, actionTag, characterRef, locationRef } — all optional, combined with AND.
  searchScenes(criteria = {}) {
    return this.project.allScenes().filter((scene) => this._matchesScene(scene, criteria));
  }

  // criteria: { name, attributes: { key: value, ... } } — all optional, combined with AND.
  searchCharacters(criteria = {}) {
    return this.project.characters.filter((character) => this._matchesCharacter(character, criteria));
  }

  _matchesScene(scene, criteria) {
    if (criteria.title && !scene.title.toLowerCase().includes(criteria.title.toLowerCase())) return false;
    if (criteria.emotionTag && scene.emotionTag !== criteria.emotionTag) return false;
    if (criteria.actionTag && scene.actionTag !== criteria.actionTag) return false;
    if (criteria.characterRef && !scene.characterRefs.includes(criteria.characterRef)) return false;
    if (criteria.locationRef && !scene.locationRefs.includes(criteria.locationRef)) return false;
    return true;
  }

  _matchesCharacter(character, criteria) {
    if (criteria.name && !character.name.toLowerCase().includes(criteria.name.toLowerCase())) return false;
    if (criteria.attributes) {
      for (const [key, value] of Object.entries(criteria.attributes)) {
        if (character.attributes[key] !== value) return false;
      }
    }
    return true;
  }
}

module.exports = SearchService;

// patterns/observer.js
// Observer pattern: Observable (subject) notifies registered Observers on change.
// Project extends Observable; Dashboard implements Observer (see Chapter 7, Report 1).

class Observer {
  update(project) {
    throw new Error("update() must be implemented by concrete observers");
  }
}

class Observable {
  constructor() {
    this.observers = [];
  }

  addObserver(observer) {
    this.observers.push(observer);
  }

  removeObserver(observer) {
    this.observers = this.observers.filter((o) => o !== observer);
  }

  notifyObservers() {
    for (const observer of this.observers) {
      observer.update(this);
    }
  }
}

module.exports = { Observer, Observable };

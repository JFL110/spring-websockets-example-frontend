
var theGlobalStore = null;

export function setStore(store) {
  if (theGlobalStore != null) {
    throw "Attempt to overwrite the global store.";
  }
  theGlobalStore = store;
}

export function getStore() {
  if (theGlobalStore == null) {
    throw "Attempt to get store before it has been set.";
  }
  return theGlobalStore;
}

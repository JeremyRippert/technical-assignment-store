import { JSONObject } from "./json-types";
import { Permission, Store } from "./store";
import set from "lodash/set";

export class GenericStore extends Store {
  constructor(defaultPolicy: Permission, entries: JSONObject) {
    super();
    this.defaultPolicy = defaultPolicy;
    console.log("entries", entries);

    Object.keys(entries).forEach((key) => {
      const value = entries[key];
      if (
        typeof value === "object" &&
        value !== null &&
        !(value instanceof Array)
      ) {
        set(this, key, new GenericStore(defaultPolicy, value as JSONObject));
      } else {
        set(this, key, value);
      }
    });
  }
}

export const createStore = (
  defaultPolicy: Permission,
  entries: JSONObject
): Store => {
  console.log("createStore", entries);
  return new GenericStore(defaultPolicy, entries);
};

import { JSONArray, JSONObject, JSONPrimitive } from "./json-types";
import get from "lodash/get";
import set from "lodash/set";
import cloneDeep from "lodash/cloneDeep";

export type Permission = "r" | "w" | "rw" | "none";

export type StoreResult = Store | JSONPrimitive | undefined;

export type StoreValue =
  | JSONObject
  | JSONArray
  | StoreResult
  | (() => StoreResult);

export interface IStore {
  defaultPolicy: Permission;
  allowedToRead(key: string): boolean;
  allowedToWrite(key: string): boolean;
  read(path: string): StoreResult;
  write(path: string, value: StoreValue): StoreValue;
  writeEntries(entries: JSONObject): void;
  entries(): JSONObject;
}

export function Restrict(policy: Permission = "none") {
  return function (target: any, propertyKey: string) {
    if (!target._accessPolicies) {
      target._accessPolicies = {};
    }
    target._accessPolicies[propertyKey] = policy;
  };
}

export class Store implements IStore {
  defaultPolicy: Permission = "rw";
  _accessPolicies?: Record<string, Permission>;
  private storeData: JSONObject = {};

  allowedToRead(path: string): boolean {
    const segments = path.split(":");
    const firstSegment = segments[0];
    const first = get(this, firstSegment);
    if (first instanceof Store) {
      return first.defaultPolicy === "r" || first.defaultPolicy === "rw";
    }
    const policy = get(
      this,
      `_accessPolicies.${segments[0]}`,
      this.defaultPolicy
    );
    return policy === "r" || policy === "rw";
  }

  allowedToWrite(path: string): boolean {
    const segments = path.split(":");
    const firstSegment = segments[0];
    const first = get(this, firstSegment);
    if (first instanceof Store) {
      return first.defaultPolicy === "w" || first.defaultPolicy === "rw";
    }
    const policy = get(
      this,
      `_accessPolicies.${segments[0]}`,
      this.defaultPolicy
    );
    return policy === "w" || policy === "rw";
  }

  read(path: string): StoreResult {
    const segments = path.split(":");
    const firstSegment = segments[0];
    const restOfPath = segments.slice(1).join(":");

    if (!this.allowedToRead(firstSegment)) {
      throw new Error(`Access denied for reading path: ${path}`);
    }

    const first = get(this, firstSegment);

    if (first instanceof Store) {
      return first.read(restOfPath);
    } else if (typeof first === "function") {
      const resultFromFunction = first();
      if (resultFromFunction instanceof Store) {
        return resultFromFunction.read(restOfPath);
      } else {
        throw new Error(
          `Function at path: ${firstSegment} did not return a Store`
        );
      }
    } else {
      const dotPath = path.replace(/:/g, ".");
      const result = get(this, dotPath);
      if (result === undefined) {
        throw new Error(`No value found at path: ${dotPath}`);
      }

      return result;
    }
  }

  write(path: string, value: StoreValue): StoreValue {
    const segments = path.split(":");
    const firstSegment = segments[0];
    const restOfPath = segments.slice(1).join(":");

    if (!this.allowedToWrite(firstSegment)) {
      throw new Error(`Access denied for writing to path: ${path}`);
    }

    if (get(this, firstSegment) instanceof Store) {
      return get(this, firstSegment).write(restOfPath, value);
    } else {
      const dotPath = path.replace(/:/g, ".");
      set(this, dotPath, value);
      return this;
    }
  }

  writeEntries(entries: JSONObject): void {
    Object.keys(entries).forEach((key) => {
      const value = entries[key];
      if (
        typeof value === "object" &&
        value !== null &&
        !(value instanceof Array)
      ) {
        Object.keys(value).forEach((subKey) => {
          this.write(`${key}:${subKey}`, value[subKey]);
        });
      } else {
        this.write(key, value);
      }
    });
  }

  entries(): JSONObject {
    // Simply return a deep copy of the storeData to avoid direct mutation
    return cloneDeep(this.storeData);
  }
}

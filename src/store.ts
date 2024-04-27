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
    if (path === "") {
      return this;
    }

    const segments = path.split(":");
    const firstSegment = segments[0];
    const restOfPath = segments.slice(1).join(":");

    if (!this.allowedToRead(firstSegment)) {
      throw new Error(`Access denied for reading path: ${path}`);
    }

    const first = get(this, firstSegment);

    if (first instanceof Store) {
      return first.read(restOfPath);
    }

    if (typeof first === "function") {
      const resultFromFunction = first();
      if (resultFromFunction instanceof Store) {
        return resultFromFunction.read(restOfPath);
      }
      throw new Error(
        `Function at path: ${firstSegment} did not return a Store`
      );
    }

    if (segments.length === 1) {
      return first;
    }

    return this.read(restOfPath);
  }

  write(path: string, value: StoreValue): StoreValue {
    const segments = path.split(":");
    const firstSegment = segments[0];
    const restOfPath = segments.slice(1).join(":");

    if (!this.allowedToWrite(firstSegment)) {
      throw new Error(`Access denied for writing to path: ${path}`);
    }

    if (segments.length === 1) {
      set(this, firstSegment, value);
      return this;
    }

    if (get(this, firstSegment) instanceof Store) {
      return get(this, firstSegment).write(restOfPath, value);
    }

    return this.write(restOfPath, value);
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
    const result: JSONObject = {};
    for (const key in this) {
      // Check if the key is allowed to be read using the allowedToRead method
      if (this.allowedToRead(key)) {
        const value = this[key];
        // Ensure the value is serializable and not a function or another Store
        if (typeof value !== "function" && !(value instanceof Store)) {
          // @ts-expect-error
          result[key] = value;
        }
      }
    }
    return result;
  }
}

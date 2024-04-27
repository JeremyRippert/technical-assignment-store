# User store basics

Questions:

- why doesn't IStore include a `storeValue` property?

Lot of complaining about types, ended up doing

```ts
export class Store implements IStore {
  defaultPolicy: Permission = "rw";
  storeValue: StoreValue = {};

  allowedToRead(key: string): boolean {
    return true;
  }

  allowedToWrite(key: string): boolean {
    return true;
  }

  read(path: string): StoreResult {
    // @ts-expect-error
    return this.storeValue[path];
  }

  write(path: string, value: StoreValue): StoreValue {
    // @ts-expect-error
    this.storeValue[path] = value;

    return this.storeValue;
  }

  writeEntries(entries: JSONObject): void {
    throw new Error("Method not implemented.");
  }

  entries(): JSONObject {
    // @ts-expect-error
    return this.storeValue;
  }
}

```

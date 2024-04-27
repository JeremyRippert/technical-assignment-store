# should be able to loop on a store

Last test not passing: should be able to loop on a store

My best guess it that it's not passing because the `read` function should be able to return a store even when path is not `""` (or make it go as far).

My current issue is that `store.read("deep:store")` falls in the last case were the returned value is not a store.
In order to circumvent this issue, I need to be able to return a store by either:

- returning the value as a store
- writing the value as a store if it's compatible (i.e an object)

Also, I probably shouldn't be doing `const dotPath = path.replace(/:/g, ".");` as it seems to be an anti-pattern. Maybe the solution is to continue working with `path` as they are provided, creating stores along the way.

Basically, the goal would be that in `read`, `const first = get(this, firstSegment);` would either be:

- a `Store`
- a `() => Store`
- a `JSONPrimitive`

Which is clearly indicated by the return type `read(path: string): StoreResult`

Would I also need to update `writeEntries` afterwards? Maybe I should loop on it as loog as `const value = entries[key];` is a `JSONObject`.

Let's start coding.

Timer: 2:02

In order to make the test suite run, I needed to create a `createStore` that would create the store directly in `write`

All tests PASS

Timer: 2:32

Adding a test case

```ts
  it("should be able to loop on a store with writeEntries", () => {
    const store = new Store();
    const entries: JSONObject = {
      deep: { value: "value", store: { value: "value" } },
    };
    store.writeEntries(entries);
    const cStore = store.read("deep:store") as Store;
    cStore.write("deep", entries);
    expect(store.read("deep:store:deep:store:value")).toBe("value");
  });
```

To "fix" the implementation of `writeEntries`

Timer: 2"35

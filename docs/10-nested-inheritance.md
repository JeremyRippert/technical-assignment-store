# Nested inheritance

With simple edge case handling

```ts
  read(path: string): StoreResult {
    if (path === "") {
      return this;
    }
```

The test case passes. Last step: nested store.

Timer: 1"53

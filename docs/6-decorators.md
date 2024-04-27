# Decorators

With `"include": ["src/**/*.ts"],` in `tsconfig.json`, 

```ts
class TestStore extends Store {
      @Restrict("none")
      public restrictedProp?: string;
    }
```

yields TS error

```ts
Unable to resolve signature of property decorator when called as an expression.
Argument of type 'ClassFieldDecoratorContext<TestStore, string | undefined> & { name: "restrictedProp"; private: false; static: false; }' is not assignable to parameter of type 'string'.
```

After updating to `"include": ["**/*.ts"],`, the TS error disappears.

In order to pass


```ts
fit("entries method shows restricted properties", () => {
    class TestStore extends Store {
      @Restrict("r")
      public readableProperty = "test";
    }
    const testStore = new TestStore();
    expect(testStore.entries()).toHaveProperty("readableProperty", "test");
  });
```

I will need to remove `private storeData: JSONObject = {};` and use the keys from `this` instead.

With current implem, all test pass except `nested key inherits parent key's permissions` and `should be able to loop on a store`.

Timer: 1"50

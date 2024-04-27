# Admin store

Here I need to use the Restrict decorator. First, let's understand decorators. According to docs, here is the signature

```ts
function enumerable(value: boolean) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    descriptor.enumerable = value;
  };
}
```

However it doesn't work with our current signature (no `descriptor`). Let's try without the `descriptor` for now.

Given the following test and code

```ts

export class AdminStore extends Store {
  @Restrict("r")
  public user: UserStore;
  @Restrict()
  name: string = "John Doe";

  it("should disallow reading admin name", () => {
    expect(() => adminStore.read("name")).toThrow();
  });
```

I assume that the fact that Restrict is called without args is what restricts the access to the property. However, how does it relates to the `read` function?

Asking the question to GPT yields

```ts
export function Restrict(policy: Permission = "none") {
  return function (target: any, propertyKey: string) {
    console.log(`Policy ${policy} applied to ${String(propertyKey)}`);

    if (!target._accessPolicies) {
      target._accessPolicies = {};
    }
    target._accessPolicies[propertyKey] = policy;
  };
}

export class Store implements IStore {
  defaultPolicy: Permission = "rw";
  storeValue: StoreValue = {};
  _accessPolicies?: Record<string, Permission>;

  allowedToRead(key: string): boolean {
    if (this._accessPolicies && this._accessPolicies[key] === "none") {
      return false;
    }
    return this.defaultPolicy === "r" || this.defaultPolicy === "rw";
  }

  read(path: string): StoreResult {
    if (!this.allowedToRead(path)) {
      throw new Error("Access denied.");
    }
    return this.storeValue[path];
  }
}
```

Timer: 0:25

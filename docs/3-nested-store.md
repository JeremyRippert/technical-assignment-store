# Nested store

First of all, calling `userStore.write("profile:name", "John Smith");` seems weird, why not `profile.name` or `['profile', 'name']`?

Given the heavy logic requirements of this, it will be more efficient to setup a debugger. Done with

```json
{
  // Use IntelliSense to learn about possible attributes.
  // Hover to view descriptions of existing attributes.
  // For more information, visit: https://go.microsoft.com/fwlink/?linkid=830387
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Jest: current file",
      "cwd": "${workspaceFolder}",
      "program": "${workspaceFolder}/node_modules/.bin/jest",
      "args": [
        "${fileBasenameNoExtension}",
        "--config",
        "${workspaceFolder}/jest.config.ts"
      ],
      "console": "integratedTerminal",
      "disableOptimisticBPs": true,
      "windows": {
        "program": "${workspaceFolder}/node_modules/jest/bin/jest"
      }
    }
  ]
}
```

Now, the question is, how do permissions cascade in nested store?

If `expect(adminStore.read("user:name")).toBe("John Doe");` and

```ts
@Restrict("r")
  public user: UserStore;

@Restrict("rw")
  name: string = "John Doe";
```

then it can either mean that `user:name` should be `"r"` or `"rw"`

Going too fast into the implementation made me lose a ton of time, I'm already at 48". I should write the requirements on paper.

Had to restart from scratch, realizing I didn't understand the principle of store nesting at first.

Adding `lodash` to get and set nested values.

Last test remaining: `should be able to loop on a store`

Timer: 1"15

Skipping loop for now as it seems to be a question much harder than others.

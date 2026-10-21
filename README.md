# Exquisitive

Exquisitive is a userscript for retrieving and (semi-)automatically inputting answers on the [Norton Inquizitive platform](ncia.wwnorton.com).

The genius minds at Norton have made this easy for us to do by shipping the entire answer as a client-sided value -- no validation whatsoever.

It is deliberately not fully automatic. I did this for 2 reasons: 1) I could not verify that there is no server-sided automation detections (Let's not kid ourselves, Norton doesn't care enough about the products they release to add that!) and 2) you should at least read the question content before skipping it. This is made as a tool to speed up your work on a clunkily designed platform, not to replace your cognitive abilities

## Install

Get it on **[Greasy Fork](https://greasyfork.org/en/users/1655377-spiraljng)** or from the **[GitHub Releases Page](https://github.com/spiraljng/exquizitive/releases/latest)**.

---

Alternatively, you can build it yourself.

```bash
bun install
bun run check # bundles `bun run build` and `bun run verify` in to one
```

Then, simply load `dist/Exquizitive.user.js` into your userscript client

## Usage

When in an inquizitive assignment, you will notice on the right side that a new panel labeled "Answer Key" has appeared (right next to the usual righthand panels you may see, like the confidence slider)

The panel has buttons to help you answer your questions, as well as shortcuts:

| Control                | Action                       | Shortcut       |
| ---------------------- | ---------------------------- | -------------- |
| **Answer**             | Applies the correct answer   | `Ctrl+Shift+A` |
| **Highlight**          | Outlines the correct choices | `Ctrl+Shift+H` |
| **Auto-skip (Off/On)** | Skips the feedback popups    | `Ctrl+Shift+S` |
| `▾`                    | Collapse the menu            |                |

The panel will also detail the correct answers to the current question, so you can manually input them if you prefer

## Contributing

Contriubtion to this repo is pretty self explanatory -- the only thing to take specific note of is the versioning system & how it plays into the release pipeline.

The workflow action only really cares about the `"version"` attribute in the `package.json` file, so when releasing a new version you should update that value.

Alternatively, you can use the `bun run release <version>` shorthand to bump the package.json, build, and verify all in one. Release workflow only executes on the main branch

# WKND Tag Picker — DA Library plugin

A small Document Authoring (da.live) Library plugin that lets authors pick from
a curated set of WKND tags and insert them into a document as a comma-separated
list.

## Files
- `index.html` — plugin UI (loaded in the DA editor sidebar)
- `tag-picker.js` — tag list, filtering, and DA SDK integration
- `tag-picker.css` — styles

## How it talks to DA
On **Insert**, the plugin sends the selected tags to the open document. It
prefers the DA SDK (`https://da.live/nx/utils/sdk.js` → `actions.sendHTML` /
`actions.sendText`) and falls back to a `postMessage({action:'sendText'})` so it
also works when previewed standalone.

## Registering the plugin in DA
The plugin is served through the site's code pipeline at:

```
https://main--capstone--namanagrawal57.aem.live/tools/tag-picker/index.html
```

Register it in the DA Library config sheet (`/.da/config` or the site's library
sheet) with a `plugins` (or `library`) entry, for example:

| title       | path                                                                        |
| ----------- | --------------------------------------------------------------------------- |
| Tag Picker  | https://main--capstone--namanagrawal57.aem.live/tools/tag-picker/index.html |

Publish the config sheet; the plugin then appears in the DA editor's Library
panel. Selecting it opens this UI in the sidebar.

## Local preview
Open `/tools/tag-picker/index.html` on the dev server or preview. Standalone it
uses the postMessage fallback (no document is attached), so **Insert** is a
no-op except for the message dispatch — useful for verifying the UI.

# ADR-0092: Own pad icons — SVG files the user adds, shown only as an image

**Status:** Accepted
**Date:** 2026-11-08
**Slice:** Slice 16
**Refines:** ADR-0070
**Category:** Persistence

## Context

[library.md L7](../product/features/library.md#l7-own-icons-svg) decided that the library's ICONS
tab takes the user's own SVG icons and that an uploaded SVG is drawn **only through `<img>`**: an
SVG used as an image "can't" run JavaScript or fetch external resources (MDN, "SVG as an image").
V1 had own icons (`onLibIconUpload`): it stored each SVG in the library store as an entry with
`type: 'icon'`, and a pad named it by `{h: hash}`. ADR-0070 names the icons of the collection by a
key `set:name`; a pad holds up to four keys.

Claude decided the rest on 2026-11-08, under the owner's authorization to decide while away, for
review. The decisions follow the OWASP File Upload Cheat Sheet: allow-list the extension, treat
the Content-Type only as a sanity check, validate the content as well, set a size limit, let the
application name the file, and keep the files apart from anything that runs.

## Decision

1. **An own store.** IndexedDB store `icons` (keyPath `id`, database version 13), as the pad
   templates have their own (ADR-0090). An entry holds the SVG file's **text** together with `id`,
   `name`, `size` and `addedAt`. The id is the SHA-256 of the bytes, so the same file added twice
   is one icon, as for audio files. Text rather than a Blob: Safari's private and ephemeral sessions
   cannot store a Blob in IndexedDB ("UnknownError: Error preparing Blob/File data to be stored in
   object store", Playwright WebKit, 2026-11-09; also noted in `v3/tests/e2e/helpers.ts` since
   2026-09-29). An SVG is text of at most 100 KB, and text goes into a backup's JSON as it is.
2. **One key scheme.** An own icon's key is `own:<id>`, which is ADR-0070's `set:name` form, so a
   pad's `icons` list and its check stay as they are. The prefix `own` is reserved: no pack of the
   collection may use it.
3. **What is accepted.** The file must pass all four checks; anything else is refused with a
   message that says what was wrong (Nielsen heuristic 9):
   - the extension `.svg` or the type `image/svg+xml` (allow list);
   - at most 100 KB;
   - text that parses as `image/svg+xml` (DOMParser) without a parser error;
   - a root element `svg`.

   The name shown is the file name without `.svg`. It is never used as a storage path.

4. **Drawn only as an image.** The app shows an own icon only through `<img>` with an object URL of
   a Blob of type `image/svg+xml` made from its text, never inline in the page and never as a page
   of its own. One URL per icon is cached and revoked when the icon is deleted.
5. **Metadata in memory, the SVG on demand.** At app start the list (`id`, `name`, `size`,
   `addedAt`) is read through a cursor that does not touch the SVG text, as `libGetAllMeta` does
   not touch the audio. The text is read when an icon is first drawn. Adding and deleting count as
   a running save from the call, so a reload waits for them.
6. **Delete in one tap with UNDO**, as for library files. A pad that names a deleted icon draws its
   other icons, or its placeholder when it has none left (V1: "Pads using it will revert to the
   default icon"). The key stays on the pad, so UNDO brings the icon back.
7. **Backups (16e step 2, 3.0.297):** the manifest carries the own icons with their text, and an
   import passes them through the same checks, storing each under the id of its text — never the
   id the file names; the keys of pads and templates follow. The V1 import takes V1's
   `type: 'icon'` entries the same way and maps a pad's `{h: hash}` to `own:<id>` (ADR-0061
   amendment 2026-11-09).

## Consequences

**Positive:**

- A script inside an uploaded SVG never runs, without a sanitizer dependency (L7).
- Pads and their check need no new field, because the key scheme is the existing one.
- The same SVG added twice is stored once.

**Negative:**

- An SVG that relies on external files, fonts or scripts is drawn without them (MDN: an image
  loads nothing). That is accepted: pad icons are small drawings.
- A backup made before 3.0.297 does not carry own icons; its pads keep their keys and draw their
  other icons until such an icon is added again.

## Alternatives considered

- **Icons in the library store with `type: 'icon'` (as V1):** rejected. Every audio code path
  would have to filter them out, and the library list must stay audio only.
- **A sanitizer library (L7 B):** rejected in L7. It adds a dependency, and `<img>` already keeps
  scripts from running.
- **Re-encode to a pixel image on upload (L7 C, OWASP's advice for images):** rejected in L7,
  because it loses the vector drawing.

## Related

- **ADRs:** ADR-0070 (pad icons, key scheme), ADR-0090 (templates in an own store), ADR-0087 (delete
  with UNDO), ADR-0061 (backup format, for 16e-2).
- **Files:** `v3/src/db/idb.ts`, `v3/src/state/ownIcons.ts`, `v3/src/lib/svgCheck.ts`,
  `v3/src/components/OwnIconsTab.tsx`, `v3/src/components/PadIcons.tsx`,
  `v3/src/components/IconPicker.tsx`.
- **Sources:** MDN, "SVG as an image"; OWASP, "File Upload Cheat Sheet".

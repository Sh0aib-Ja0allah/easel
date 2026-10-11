# style-match example: blueprint

What `easel-motion:style-match` produces from three reference images, end to end.

- `references/`: three blueprint sheets (Easel-made SVG drawings rendered to PNG, so they can be
  committed; a user's real references stay in their own git-ignored job folder).
- `styles/blueprint/`: the style made from them: `kit.js` and `STYLE.md` with the measured palette,
  line weights, type, frame checklist and what is not matched.
- `piece/`: a 6 s piece in the new style, for 9:16 and 16:9 (started with
  `tools/new-piece.mjs --style blueprint`, which uses the blank starter for a style without a demo).
- `compare/`: our frames next to the references on a 10% grid (`compare_images`), with both
  palettes as numbers.

Easel, MIT.

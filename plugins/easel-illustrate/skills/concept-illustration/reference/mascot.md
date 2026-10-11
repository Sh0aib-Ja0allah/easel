<!-- Easel's own (MIT). The default mascot for easel-illustrate:concept-illustration. -->

# The mascot

A concept illustration has one recurring character who does the work in every image. Readers
learn it once, then read each new image faster.

## The user's own mascot (preferred)

If the user or their brand has a mascot, use it: ask for a reference image or a description,
and write down in five or six lines its silhouette, line weight, face (how the eyes and mouth
are drawn), limbs and the one or two things that make it recognisable. Draw it the same way in
every image. Never use a well-known character from a film, a game, a comic, a channel or another
illustrator's series, even when asked: offer the default card or a new character instead.

## The default: the card

When there is no mascot, use **the card**, Easel's neutral default:

- **Body:** an upright index card, about 3:4, with softly rounded corners, drawn as an outline
  (never filled black), with two or three faint ruled lines across its lower half.
- **Face:** two small solid dot eyes near the top third; no mouth by default (a short straight
  line when it must react). Deadpan: serious, unbothered, never cute.
- **Limbs:** thin single-line arms and legs, no hands or feet beyond a tiny stub; the arms bend
  only at the middle.
- **Size:** about one fifth of the canvas height, so it can stand beside a machine or inside a
  box.
- **Colour:** black line on white; it never takes the accent colour itself. Its props can.

It does things the way a card would: gets filed, sorted, stamped, slotted into a drawer, pinned to
a board, carried in a stack. That keeps the metaphors physical and low-tech.

## Drawing it in SVG

```svg
<defs>
  <g id="card" fill="none" stroke="#111" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
    <rect x="-36" y="-48" width="72" height="96" rx="8" fill="#fff"/>
    <path d="M-24 12h48M-24 24h48M-24 36h32" stroke-width="1.5" opacity=".5"/>
    <circle cx="-12" cy="-22" r="3.5" fill="#111" stroke="none"/>
    <circle cx="12" cy="-22" r="3.5" fill="#111" stroke="none"/>
  </g>
</defs>
<g transform="translate(400 300)">
  <use href="#card"/>
  <g fill="none" stroke="#111" stroke-width="3" stroke-linecap="round">
    <path d="M-36 0l-26 18M36 0l26 -14"/>   <!-- arms: this pose only -->
    <path d="M-14 48l-4 30M14 48l4 30"/>    <!-- legs: this pose only -->
  </g>
</g>
```

`#card` is the body and face only; reuse it with `<use href="#card"/>` inside a group placed
with `transform="translate(x y) rotate(a)"`, and draw the arms and legs in that group for each pose
(pushing, pulling, carrying, holding up). Keep the body and face identical across images.

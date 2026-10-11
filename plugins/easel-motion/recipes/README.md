# Style recipes

Looks that are written down but have no Easel kit yet: each recipe gives the palette (exact
values), how the look is drawn in code (layers, textures, numbers), its motion, the pitfalls found
building it and what is not done. Translated and adapted from alchaincyf/huashu-art-motion (MIT;
see each file's header). Styles are named after the look or the period, never after an artist.

| Recipe | The look |
|---|---|
| [cave-painting](cave-painting.md) | ochre and charcoal pigment soaked into a lit rock wall |
| [egyptian-tomb](egyptian-tomb.md) | flat registers, composite figures, mineral pigments on plaster |
| [greek-black-figure](greek-black-figure.md) | black slip silhouettes with incised lines on orange clay |
| [roman-mosaic](roman-mosaic.md) | stone tesserae laid along the forms, grout lines |
| [illuminated-manuscript](illuminated-manuscript.md) | gold leaf, ultramarine and vermilion on vellum, a decorated initial |
| [renaissance-sfumato](renaissance-sfumato.md) | smoky blended modelling, warm glazes, aerial perspective |
| [impressionist](impressionist.md) | broken colour in short strokes, outdoor light |
| [post-impressionist-swirl](post-impressionist-swirl.md) | thick strokes following a flow field, a swirling sky |
| [art-nouveau-poster](art-nouveau-poster.md) | flowing outlines, a halo panel, ornamental borders and lettering |
| [analytic-cubist](analytic-cubist.md) | faceted planes in a narrow brown-grey range |

**To use one:** run `easel-motion:style-match` with the recipe as the measured reference (the
numbers replace `measure_image` for the parts the recipe covers), build `styles/<name>/kit.js` on
`kit/core.js`, and draw the piece's frames in it. Font names in a recipe are the source's; a kit
uses a font bundled with easel-core (or bundles another OFL face first).

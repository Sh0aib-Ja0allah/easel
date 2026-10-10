{ "pass": false, "deliver": "refused: fix contrast first", "hardFailures": ["contrast"], "checks": [
  { "name": "text_clipping", "pass": true, "hard": true, "value": 0, "threshold": 0, "findings": [] },
  { "name": "contrast", "pass": false, "hard": true, "value": 2.32, "threshold": "WCAG AA (4.5, large text 3)", "findings": [{ "element": "p.subtitle \"Fast, simple, secure\"", "ratio": 2.32, "required": 4.5, "fg": [170,170,170], "bg": [255,255,255] }] }
] }

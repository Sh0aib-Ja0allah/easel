---
description: Routing - reviewing an animation pasted as HTML should trigger critique (filmstrip + qa + critic).
tags: [routing, critique]
runs: 2
max_turns: 20
allowed_tools: [Skill, Read, Glob, Agent, Write]
---

Can you give me feedback on the motion in my little explainer animation? Here's the page:

<!doctype html><html><head><style>body{margin:0;background:#0b0b2a;font-family:sans-serif}#t{color:#8b5cf6;font-size:20px;position:absolute;left:40px;top:40px;animation:in 0.2s linear both}@keyframes in{from{opacity:0}to{opacity:1}}.dot{position:absolute;top:200px;width:40px;height:40px;border-radius:50%;background:#6366f1;animation:slide 6s linear both}@keyframes slide{from{left:40px}to{left:600px}}</style></head><body><div id="root" data-composition-id="main" data-duration="6" data-width="1280" data-height="720"><div id="t">How solar power works: sunlight hits the panel, electrons move, current flows to your home.</div><div class="dot"></div></div></body></html>

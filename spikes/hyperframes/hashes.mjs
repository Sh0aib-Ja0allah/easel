#!/usr/bin/env node
// Compare two renders: per-frame SHA-256 of PNG pixels (decoded via ffmpeg to raw RGB) and file hashes.
// Usage: node hashes.mjs <dirA> <dirB>   (each holds frames/*.png or *.png, and/or out.mp4)
// The PSNR figures in docs/spikes/hyperframes.md came from ffmpeg's psnr filter (runner job 016):
//   ffmpeg -i <a> -i <b> -lavfi "[0:v]format=rgb24[a];[1:v]format=rgb24[b];[a][b]psnr" -f null -
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
const sha = (b) => createHash('sha256').update(b).digest('hex');
function pngs(d) {
  const f = existsSync(join(d, 'frames')) ? join(d, 'frames') : d;
  return readdirSync(f).filter((n) => n.endsWith('.png')).sort().map((n) => join(f, n));
}
function rawHash(file) {
  const r = spawnSync('ffmpeg', ['-v', 'error', '-i', file, '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], { maxBuffer: 1 << 30 });
  if (r.status !== 0 || !r.stdout || r.stdout.length === 0) throw new Error(`ffmpeg could not decode ${file}`);
  return sha(r.stdout);
}
function mp4In(d) { const m = readdirSync(d).find((n) => n.endsWith('.mp4')); return m ? join(d, m) : null; }
const [a, b] = process.argv.slice(2);
const A = pngs(a), B = pngs(b);
let same = 0, diff = [];
for (let i = 0; i < Math.min(A.length, B.length); i++) {
  if (rawHash(A[i]) === rawHash(B[i])) same++; else diff.push(i);
}
const ma = mp4In(a), mb = mp4In(b);
const out = {
  framesA: A.length, framesB: B.length, identicalFrames: same, differingFrames: diff.slice(0, 20), differingCount: diff.length,
  mp4A: ma && { bytes: statSync(ma).size, sha: sha(readFileSync(ma)).slice(0, 16) },
  mp4B: mb && { bytes: statSync(mb).size, sha: sha(readFileSync(mb)).slice(0, 16) },
};
out.mp4Identical = !!(ma && mb && out.mp4A.sha === out.mp4B.sha);
console.log(JSON.stringify(out));

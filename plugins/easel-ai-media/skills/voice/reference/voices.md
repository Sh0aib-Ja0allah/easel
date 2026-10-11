<!-- Easel: adapted from Alisa0808/vox-director @ 6a85a7c341610442a6a5b1885e6e0217ab82a11f
     (github.com/Alisa0808/vox-director, references/voices.md), MIT License, Copyright (c) 2026 Alisa Qian;
     see NOTICE.md. Modified by Easel (2026-10-11): beats.json voice settings replaced by generate tool arguments; voice cloning rewritten around the voice skill's consent statement and recording (consent_template, kind voice-clone) with the public-figure ban; persona and audio-scene clone recipe removed; "listen before assembling" replaced by checks the model can run; ASCII punctuation. -->

# Narrator voices

How to pick the narrator for a film, the voice roster for Atlas Cloud's `xai/tts-v1`, and the
only way Easel clones a voice.

Narration is generated with `mcp__plugin_easel-ai-media_media__generate` kind `tts`: pass the
words in `text`, the voice id in `voice` and the language in `language` (Atlas `xai/tts-v1`
only; OpenAI and ElevenLabs take the language from the text and refuse `language`) (a dry run with a cost
estimate and a `quote` first; call again with the same arguments, `confirm: true` and that `quote`
once the user agrees). The ids below are for
`xai/tts-v1` on Atlas Cloud; other providers (OpenAI, ElevenLabs) have their own voice
libraries, and the same selection rules apply. Voice ids change: check them against the
provider's current list before a long job.

## How to pick

1. **Language first.** Match the film's language. For a non-English film, prefer that
   language's native voice for the most natural accent (for example a Chinese history film:
   `Jian` or `Hao`). Or use a multilingual voice and set `language` explicitly.
2. **Then gender and energy to the topic.** Documentary or authoritative: `leo` or `rex`.
   Warm or inviting: `sal` or `ara`. A bright female lead: `eve`, or the native English
   `Grace`.
3. **One voice for the whole film.** Pick it once (record it in the job's plan) and use the
   same `voice` and `language` for every narration call. Mixing voices between beats breaks the
   film.
4. **Do not just keep the default.** The default (`leo`, male, multilingual, documentary
   tone) is a fallback, not a choice. Say which voice you picked and why.
5. **Check before assembling.** You cannot hear the audio, so check what can be measured: the
   words in the line's `.words.json` (where the provider returns word timings) against the
   script (a missing, doubled or misread word), its length against the beat, and its loudness
   with `qa` (see the voice skill's check step). Narration is cheap; regenerate a
   line that comes back wrong rather than fixing it in the edit, and tell the user to listen to
   the lines too. Final beat timing comes from the generated audio (word timings where the
   provider gives them), never from the script.

- **Multilingual** voices (`ara`, `eve`, `leo`, `rex`, `sal`) speak any language, so they are
  safe for English, Chinese or mixed-language films.
- **Native** voices are tuned for their own language (a more natural accent) and set the
  language automatically.

## Multilingual voices (any language)

| id | name | gender |
|---|---|---|
| `leo` | Leo | M (default) |
| `rex` | Rex | M |
| `sal` | Sal | M |
| `ara` | Ara | F |
| `eve` | Eve | F |

## Native voices by language (name, gender, id)

Genders are as listed by the source; where none is given, check by ear.

- **en**: Daniel, M, `96819d0bd28d`; James, M, `78a495fdbb39`; Grace, F, `f8cf5c2c78d4`; Claire, F, `79f3a8b96d43`
- **zh-CN**: Jian, M, `jpi39icg`; Hao, F, `d18jlf6v`; Xia, F, `33g9t0jl`
- **ja**: Ren, M, `b1a7441b97a1`; Sakura, F, `d0cb9ff07d95`
- **ko**: Jun-seo, M, `bf9fe5b5f981`; Min-jun, M, `b5ae17439907`; Ji-yeon, F, `23be42535a45`; Seo-yeon, F, `a0401c9101f8`
- **es**: Manuel, M, `yis75yfp`; Javier, M, `ekhwx401`; Andres, M, `0hhfxxqq`; Diego, `jupvcf34`
- **fr**: Remi, M, `0p0rt7o1`; Hugo, `hbxkrnwm`; Camille, F, `69smp8rm`
- **de**: Moritz, M, `41321eb41295`; Niklas, M, `40f31906b23d`; Clara, F, `458705c07139`; Lena, F, `3a7889066fa2`
- **it**: Enzo, M, `x7avnu1k`; Matteo, M, `bcs7l2c3`; Alessandro, M, `h27ltdnz`; Luca, F, `hqxr4yub`
- **pt**: Mateus, M, `abfbdf26f115`; Rafael, M, `3d030bc92a87`; Beatriz, F, `6da5baee46d0`
- **ru**: Dmitri, M, `wy0m9l5w`; Andrei, M, `dr8gqysu`; Pavel, M, `26w6ihxi`; Irina, F, `om17cury`
- **hi**: Karan, M, `89q2pnko`; Ananya, F, `73xd5dum`
- **ar**: Khalid, M, `70013edeb8e8`; Tariq, M, `23468361b4ef`; Layla, F, `35c8d7f60dc8`
- **tr**: Emre, M, `670a0c3ac005`; Kaan, M, `182a91893636`; Aylin, F, `d634b6da3d3b`
- **vi**: Duc, M, `fc7de6afcf6c`; Minh, M, `7a9ee820b342`; Mai, F, `0895a5b8ce5c`
- **th**: Aroon, M, `4ff93971bfdc`; Krit, M, `908c4626660f`
- **nl**: Thijs, M, `a13662ba951c`; Ruben, M, `244e27b39200`; Femke, F, `58d27475085e`; Noor, F, `247783ebdd51`
- **pl**: Jakub, M, `2badb5f46b1e`; Mateusz, M, `37329fd8895a`; Aleksandra, F, `1b12d5daee6b`; Katarzyna, F, `97fabd54445f`
- **sv-SE**: Axel, M, `e22152e06fd8`; Erik, M, `1f046a033914`; Saga, F, `490ea3be50b1`
- **da**: Kasper, M, `0ih5oi34`; Lars, M, `gwnexu6y`; Ida, F, `97zmdc6s`
- **fi**: Eero, M, `83c6f4fea98e`; Valtteri, M, `dfe7b9e7d217`; Elina, F, `34fd4dce1ba3`; Helmi, F, `c3a2c594479e`

Use the **id**, not the name, in the `voice` argument. Example for Grace (native English,
female): `{"kind": "tts", "provider": "atlas", "model": "xai/tts-v1", "voice": "f8cf5c2c78d4",
"language": "en", "text": "..."}`.

## Voice cloning (consent only, through the voice skill)

A cloned voice is made **only through the `voice` skill**, and only for a person who has given
their consent:

1. Get the statement with `mcp__plugin_easel-ai-media_media__consent_template`.
2. The voice owner gives the statement themselves, in their own words, naming the purpose.
   Write it in English (the check reads English only; a speaker of another language reads and agrees to an English translation), with the consent in its own sentence: "I, <full name>, consent to my voice being cloned for …", with no "not", "no" or "without" in that sentence; put limits in a sentence of their own.
   Save it as `consent.json` in the job folder `./easel-out/<slug>/`, together with their
   recording of the statement: the owner themselves reading all of it aloud, never generated
   speech (Easel refuses its own output, silence, and a clip shorter than the statement takes
   to read).
3. Generate with `mcp__plugin_easel-ai-media_media__generate` kind `voice-clone`, passing
   `voiceName`, the owner's own recordings in `samples` (a clean 20-60 s of solo speech works
   best), and `consentFile`, all as names in the job folder (`consent.json`, `sample-1.wav`).
   Without the consent file the clone is refused. Every clone is logged to `consent-log.jsonl`
   in the job folder. The checks are a procedure the user must honour, not proof of consent:
   they cannot tell who is speaking.
4. Narrate with kind `tts` and the new voice's id, following the same rules as any other voice.

**Never clone a public figure, or anyone who has not consented.** A recording of someone found
online, a voice that "sounds like" a known person, or a clip the user has no right to use is
never a cloning sample. If the user wants a recognisable style of delivery, pick a stock voice
and describe the delivery instead.

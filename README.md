# Harbor

A private place for women who have experienced sexual violence to say what they can't say out loud yet, and to be met with belief instead of questions.

Many survivors never tell anyone. Shame, self-blame and the fear of not being believed are a big part of why. Harbor is built for the moment before someone is ready to call a hotline or tell a friend. She can type, or just tap how she feels, and get a reply that believes her, never asks "why", and never asks for details. When she's ready, she can find real people, her options, and other women who have been through it.

**Everything runs on her phone.** There is no server, no account, no analytics and no network request with anything she writes. Anything she chooses to keep is encrypted on the device with her passcode.

> Harbor is an independent project, not a clinical tool. It hasn't been reviewed by a rape crisis center yet, and that review is the next step before anyone relies on it.

## What's in it

| | |
|---|---|
| **Talk** | A listener that reflects and validates. Safety checks run before anything else: thoughts of self-harm surface 988, immediate danger surfaces 911 and the quick exit, and a very recent assault gets gentle, no-pressure information about time-sensitive medical care. |
| **Say it without words** | Tap feelings (scared, numb, "like it's my fault"…) and what would help. For when typing it is too much. |
| **Show someone** | Full-screen cards for a nurse, doctor, counselor or friend: *"I'm finding it hard to speak. Can I type or point instead?"*, *"Please ask before you touch me."* It can read them aloud. You can add your own. |
| **Write privately** | A journal with gentle prompts and an unsent-letter option. "Let it go" clears the page without saving. |
| **Calm my body** | Box breathing, 5-4-3-2-1 grounding, butterfly hug. |
| **My options** | Medical care, advocates, reporting, protective orders, therapy, what consent means, common reactions. Each one says plainly that it's her choice. |
| **Women who've been here** | Five real talks by survivors and advocates (verified on ted.com) with content notes, plus two books. Linked, not embedded, so nothing loads from a third party unless she chooses it. |
| **Safety plan** | Who to call, where to go, what to take. Encrypted. |
| **Small steps** | Notice what you did today. No streaks to break. |
| **Help now** | RAINN, 988, the National Domestic Violence Hotline, Crisis Text Line and findahelpline.com, with one-tap call and text. |

## Safety and privacy decisions

- **Quick exit.** A *Leave* button on every screen, or Esc twice. It wipes in-memory state, locks the vault and replaces the page with a weather search.
- **No history trail.** Navigation uses `history.replaceState`, so the back button leaves Harbor instead of stepping back through it.
- **Discreet by default when installed.** The home-screen name and icon are "Notes". Discreet mode also changes the tab title and header.
- **Nothing saved unless she asks.** Conversations disappear when she leaves. To keep anything, she sets a passcode: PBKDF2-SHA256 (310k iterations) → AES-256-GCM via Web Crypto, with a fresh IV on every save. There's no recovery, on purpose. It auto-locks after 5 minutes in the background.
- **Strict CSP.** `default-src 'self'`, no inline scripts or styles, and `connect-src` allows only this origin and `localhost:11434`.
- **Optional AI, on-device only.** She can connect a model she runs herself (e.g. Ollama). The rule-based safety checks still run first, and every model reply is screened for blaming or doubting language ("why didn't you", "you should have", "what were you wearing", "at least…"). A reply that fails falls back to the built-in listener.
- **Honest about calls and texts.** The Help page says plainly that calls and texts show up in phone history.

## How the listener works

`web/js/listener.js` is a pure function: `respond(text, state) → { text, tools, crisis, themes }`.

1. **Safety first:** self-harm, then immediate danger, then a recent assault. These always win.
2. **Themes:** freezing, self-blame, fear of not being believed, someone she knew, being alone, shame, numbness, flashbacks, anger, fear, reporting, "was it assault?", the body, hopelessness, progress. It replies to at most two themes, so replies stay short.
3. **Otherwise:** a gentle reflection. Very short messages ("idk", "…") offer tapping instead of typing.
4. **Variety:** replies rotate so she doesn't read the same sentence twice.

Things it never does, and the tests check every one: ask *why*, ask for details, suggest she could have prevented it, question whether it "counts", push her to report or forgive, or write a reply longer than an overwhelmed person can take in.

## Run it

```bash
npm test                 # 14 listener tests (node --test, no dependencies)
npm start                # http://localhost:8790
```

It's a static site. `.github/workflows/pages.yml` runs the tests and publishes `/web` to GitHub Pages on every push to main. HTTPS turns on the service worker, so it works offline after the first visit.

## What I'd do next

1. Have it reviewed by advocates at a rape crisis center and, if possible, by survivors. Change the wording wherever they say it's wrong.
2. Spanish, then more languages. RAINN and the DV hotline already support Spanish.
3. Local resources by ZIP code, from a bundled list rather than a network lookup.
4. A small, private evaluation set of messages written with advocates, scored for safety-routing recall and tone.

## Sources

Hotline numbers were checked against the providers' own sites in November 2026: [RAINN](https://hotline.rainn.org/online), [National DV Hotline](https://www.thehotline.org), [Crisis Text Line](https://www.crisistextline.org), [findahelpline.com](https://findahelpline.com). The talks are linked on ted.com. Option summaries are general US information, not legal or medical advice.

MIT licensed.

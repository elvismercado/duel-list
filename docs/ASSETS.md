# DuelList.Asset checklist

## 1. Brand core (do these first)
| Asset | Format | Size | Used in |
|---|---|---|---|
| Wordmark "DuelList" | SVG | scalable | Header, OG image, README |
| Logo mark (icon-only, no text) | SVG | square, ~512×512 source | Favicon, PWA, app store |
| Monochrome logo mark | SVG | square | Dark mode, watermark |
| Brand color palette | HEX tokens | n/a | `tailwind.config` / CSS vars |

## 2. App icons / PWA (generate from logo mark)
| Asset | Size | Path |
|---|---|---|
| favicon.ico | 16/32/48 | `public/favicon.ico` |
| favicon.svg | scalable | `public/favicon.svg` |
| apple-touch-icon | 180×180 | `public/apple-touch-icon.png` |
| PWA icon (any) | 192×192 | `public/icons/icon-192.png` |
| PWA icon (any) | 512×512 | `public/icons/icon-512.png` |
| PWA icon (maskable) | 512×512 with safe zone | `public/icons/icon-maskable-512.png` |
| Windows tile | 270×270 | `public/icons/mstile-270.png` |

> Tip: realfavicongenerator.net produces all of these from one SVG.

## 3. Social / share
| Asset | Size | Path |
|---|---|---|
| Open Graph image | 1200×630 PNG | `public/og-image.png` |
| Twitter card | 1200×600 PNG | `public/twitter-card.png` |

## 4. Empty-state illustrations (one consistent style)
| Screen | Scene idea |
|---|---|
| Home.no lists yet | Empty shelf / blank scoreboard |
| Rankings.no items | Empty podium |
| Rankings.filter no match | Magnifying glass + question mark |
| History.no sessions | Empty calendar / clock |
| Duel.finished session | Trophy / handshake |
| Settings → Storage.no linked files | Unplugged cable / loose paper |

Format: **SVG preferred** (recolorable), 1× PNG fallback at 800px wide.

## 5. UI iconography
- **Already covered by Lucide.** No action needed unless a specific concept is missing.list those here as you hit them:
  - [ ] Custom "duel" icon (if Lucide `Swords` ever feels too generic for marketing)
  - [ ] Custom "score" badge shape (for podium / chip variants)

## 6. Optional polish (nice-to-have, not blocking)
| Asset | Notes |
|---|---|
| Sound: duel-pick *click* | Short, ~100ms, CC0 |
| Sound: session-complete *fanfare* | ~1s, mutable in settings |
| Lottie: trophy reveal | Plays on finishing a session |
| Lottie: vs-flash transition | Between duels |
| Confetti SVG sprite | Already possible via `canvas-confetti` lib if desired |

## 7. Marketing / docs (only if you ever do a landing page)
| Asset | Notes |
|---|---|
| Hero illustration | Big scene, same illustration style |
| 3 feature thumbnails | Linking files / Ranking / History |
| Screenshot frames (phone mockups) | Mockuphone / Shots.so |
| README banner | 1280×640 PNG with wordmark + tagline |

---

## Suggested file layout

```
public/
  favicon.ico
  favicon.svg
  apple-touch-icon.png
  og-image.png
  icons/
    icon-192.png
    icon-512.png
    icon-maskable-512.png

src/assets/
  brand/
    wordmark.svg
    mark.svg
  illustrations/
    empty-home.svg
    empty-rankings.svg
    empty-history.svg
    no-match.svg
    session-complete.svg
    no-linked-files.svg
  sounds/        (optional)
    pick.mp3
    fanfare.mp3
  lottie/        (optional)
    trophy.json
    vs-flash.json
```

## Minimum viable set (ship-ready in one sitting)
1. Wordmark SVG
2. Logo mark SVG
3. Full favicon/PWA pack (auto-generated)
4. OG image
5. Three empty-state illustrations (home / rankings / history)

Everything else is incremental polish.
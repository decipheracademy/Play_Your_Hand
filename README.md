# Play Your Hand: Survive the Island

A static, dependency-free HTML/CSS/JavaScript game for Decipher Academy’s Skill Challenge Friday. Implements the revised brief, including Player Setup and the shareable PNG result card. No backend, real-time multiplayer, leaderboard, analytics, external fonts, or external runtime assets.

## Run and deploy

Serve this folder through a static HTTP server. For local testing with Python installed:

```sh
python3 -m http.server 8000
```

Open http://localhost:8000. Use an HTTP server rather than double-clicking index.html, because browser ES modules require an origin. To use GitHub Pages, place the extracted game files in the repository’s configured Pages directory (root or `docs/`). Every asset uses relative paths, including on project-subdirectory URLs. No build command or npm installation is needed. HTTPS enables native file sharing on supported browsers.

## Controls

- Pack: tap an item to add/remove it, or drag it into the backpack. Capacity is enforced. Review → Confirm locks the pack permanently; Go Back preserves editable packing.
- Navigate: tap the ground; hold arrow keys, WASD, or the on-screen direction buttons. Wooden sign shortcuts walk the character through the corresponding physical path.
- Supplies: tap a carried supply near a relevant obstacle. Water, food and first aid work wherever needed. Reusable gear can help again at later checkpoints. A wrong-time use costs 30 points but does not disable reusable gear.
- Every obstacle has a walkable land alternative. The Compass enables a shorter alternate path. Dry Matches light the designated camp point during a storm. Equipment does not bypass the need to travel.
- Gold tokens award 25 Adaptation. The risky shortcut is present on the middle Round 2 trail; walk to its sign to attempt it.
- Share: download the complete PNG result card, or use the native Share button when file sharing is supported. The app never automatically sends anything. Student names stay in memory and clear on Main Menu/Play Again. Only grade, sound and reduced-motion preferences are stored.

## Rules and implementation choices

`engine.js` contains band tables, supply properties, capacities, locking, event selection and scoring. `app.js` owns the state machine and physical movement. `scene.js` contains original Canvas placeholder scenery and characters; replace the clearly marked artwork functions for final assets. Music and sound effects are original Web Audio synthesis; no third-party audio license is required.

- All six capacities, item pools and timing targets follow the brief.
- Round 2 has three continuous trail sections. Jungle, Cliff, Cave and Coastal preserve their relative travel lengths. The first Round 3 event always follows the original Round 2 route. Universal Storm and Injury events each have four times the sampling weight of other candidate events; immediate duplicates are excluded.
- For event-count ranges (Grades 7–8 and 11–12), the count is sampled inclusively. The lower/upper route-shift count is paired with the lower/upper event count. Land paths visibly change sides during those shifts. Grade 1–2 has no shifts; all alternatives remain accessible.
- Movement and energy units are calibrated around 50 Energy spent on a direct Round 2 route. Rough terrain adds exertion; Extra Shoes reduce that movement/exertion disadvantage. Longer detours cost more. Storm travel increases exertion and reduces speed unless protected.
- In Grades 9–12, 45% of exertion during the upper portion of a Round 2 detour is deferred until Round 3. No advance warning is displayed. Younger grades show the whole cost immediately.
- Zero Energy gives half movement speed and a 100-point penalty on each transition from positive Energy to zero. Staying at zero does not repeatedly penalize. Restoring Energy removes fatigue. Injury reduces movement but never stops it.
- Zero Health triggers a safe-checkpoint rescue, a 75-point penalty, and 20 seconds added to final completion time. Health stays zero until healed; rescue does not invent a health restoration value. There is always a positive movement-speed floor. Subsequent injury/failed-shortcut incidents can trigger another rescue.
- Consumables are one-use; every other item is reusable. A useful reusable activation is rewarded at most once per obstacle, preventing repeated-click score farming. Gear may be retried after an unnecessary use. Fuel works alongside a carried Flashlight. Matches provide storm protection at camp without inventing an energy-restoration amount.
- Progress is route +300 and arrival +300. Adaptation includes efficient obstacles +50, tokens +25, and successful risky shortcuts +75, capped at 200. Resource Efficiency is meaningful use +20, capped at 300. Penalties are separate. Time Bonus is 150 up to the band’s summed core target and declines linearly to zero at 125% of it.
- Core elapsed time includes packing (including review) and active navigation. Story/menu/transition reading and hidden-tab time are excluded. Rescue time is included in the final total and time bonus. Soft targets never stop play. Result cards show minutes:seconds for manual ranking.
- Animation-completion promises drive the six story beats and line reveals. Reduced motion removes camera motion and ambient movement while preserving readable narrative fades and manual movement. Skip is always available.

## Validation

With Node.js 18+ installed, run `npm test` (no installation needed).

- `tests/permutations.mjs`: 10,290 legal loadouts, covering 493,920 loadout × route × event × full/zero-meter cases across all six bands. Checks real collision geometry for a walkable fallback, one-way locking, event counts/mapping, consumables/reuse, scoring caps, rescue penalties, shortcut odds and linear time taper.
- `tests/navigation.mjs`: executes the app’s actual movement/state machine with rendering stubbed. Covers 48 complete route/band/meter runs, repeated injury rescues, upper/lower detours, physical fork selection and gear activation without reward farming.

These tests establish model and navigation reachability, not browser rendering or hardware performance. A browser binary and compatible static-site preview were unavailable in the build environment. Desktop/mobile visual QA, real touch drag behavior, native file sharing, PNG download and stable Chromebook frame rate still need a real-device classroom pilot. The renderer is bounded to 30 FPS and a device pixel ratio of at most 1.5 to limit work on modest hardware.

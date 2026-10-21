# Test plan and actual results

**Where tests were run:** a Linux cloud sandbox (Node 22), 21 Oct 2026. The sandbox cannot reach MongoDB Atlas or OpenWeatherMap, so:
* the database was **FerretDB 1.24 (a MongoDB-wire-compatible server, SQLite backend)**, *not* MongoDB Atlas;
* the weather provider was a **local stand-in** (`docs/mock-openweather.js`) returning canned OpenWeather-shaped JSON.
Anything marked ⚠ must be re-run by you against Atlas / the real API before you claim it.

## 1. Automated API tests — `cd server && npm test`
Result: **39 / 39 passed** (Jest + Supertest, real HTTP stack + real database driver).
| Area | What is checked |
|---|---|
| Auth | register hashes password (bcrypt `$2…`), password never returned; `role:"admin"` ignored; duplicate email 409; weak password/bad email 400; wrong password and unknown email give identical 401; NoSQL operator injection rejected; protected routes 401 without/with bad token; profile update can't change role; password change; disabled account can't log in or reuse token |
| Farms/crops | CRUD + validation; duplicate farm name 409; another farmer gets 404 on read/update/delete; invalid id 400; harvest-before-sowing rejected on create **and** update; attaching a crop to someone else's farm 404; filters; activities/soil ownership; soil guidance text; farm delete cascades |
| Crop info | list/search/detail/pests, disclaimer present |
| Marketplace | admin-only product CRUD, negative price/stock rejected, search/filter, **price & total taken from DB (client values ignored)**, oversell → 409 with stock unchanged, multi-line order failing halfway rolls back, 8 parallel orders for stock 3 → exactly 3 succeed and stock ends at 0 ⚠ (see below), order privacy, status flow rules, cancel restores stock, inactive product can't be ordered |
| Bookings | farmers can't create services; past date/unknown slot rejected; capacity 409; cancel frees slot; reschedule only while pending; admin status flow; non-owner 404; service with open bookings can't be deleted |
| Weather (mocked provider) | normalised data with location + retrieved time; second call served from cache (no provider call); API key only sent server-side and never in the response; coordinates; invalid coords 400; invalid city 404; bad key 502; network failure 504; provider rate limit 503; missing key 503 (no fake data) and labelled demo mode when explicitly enabled; farm weather creates de-duplicated rule alerts |
| Alerts/dashboard/community/admin | harvest-soon/overdue and soil rules; admin broadcast visible to farmers, farmers can't broadcast; dashboard counts + empty state; post edit author-only, admin moderation, comments; admin endpoints 403 for farmers; stats aggregates; admin can't demote self; role re-read per request |
| Hardening | malformed JSON 400 without stack trace; unknown route 404; helmet headers, no `x-powered-by` |

⚠ **Concurrency:** FerretDB's SQLite backend does not make concurrent `findOneAndUpdate` calls atomic (observed directly: 5 of 8 parallel decrements "succeeded" on stock 3). Real MongoDB/Atlas guarantees single-document atomicity, which is the primary guard in the code. The in-process lock in `utils/mutex.js` makes the parallel test pass here on a single Node process. **Re-run `npm test` against an Atlas `_test` database** to confirm the primary guard.

## 2. Postman collection — Newman
`docs/AgriTech.postman_collection.json` run with Newman against the live API (sandbox DB): **28 requests, 30 assertions, 0 failed**. Covers register/login/me, 401/403/409/400 cases, farm→crop→soil→dashboard, weather (stand-in), product→order→oversell→cancel, service→booking→duplicate slot→confirm→cancel, admin stats/users.

## 3. Browser end-to-end — `docs/e2e-browser-test.js` (Playwright + Chromium)
Result: **20 / 20 steps passed** on the production build: landing; register; create farm; server-side date validation message; add crop and update stage; crop guide search/detail; weather by city, invalid city message, weather for a farm; soil record + guidance; alerts (harvest + warm/humid rules); marketplace search → cart → demo order → order history; booking create → reschedule → cancel; community post + comment; Hindi switch; farmer blocked from admin (UI redirect and API 403); logout; wrong-password message; anonymous redirect to login; admin dashboard; admin add product/update stock/hide product; admin orders/users/bookings/advisory; mobile (390 px) menu and no horizontal overflow on `/admin` and `/marketplace`.
Console: 32 messages — 28 were Google-Fonts requests blocked by the sandbox network, 4 were the expected 400/403/404 responses from deliberate negative tests. No page errors.
Bugs found by this run and fixed: logout landed on the login page instead of the home page (now a dedicated `/logout` route).

## 4. Build & lint
`client: npm run build` ✓ (code-split into 41 JS chunks). `npm run lint` (oxlint): 0 errors, 10 warnings (mostly "fast refresh" style notes and one `Date.now()` purity hint) — not fixed, harmless.

## 5. Not verified (needs you)
| Item | How |
|---|---|
| MongoDB **Atlas** connection with your credentials/IP list | start the server; look for `MongoDB connected successfully` before `Server running…` |
| `npm test` against Atlas `AgriTech_test` | see README |
| Real **OpenWeatherMap** responses & icons, geolocation prompt | add key; use Weather page; click "Use my location" in a real browser |
| Cross-browser (Firefox/Safari), real phones, screen reader | manual |
| Hindi wording | ask a Hindi speaker to review `client/src/i18n/hi.js` |
| Performance/load, deployment | not done |

## 6. Manual checklist (tick as you verify on your machine)
- [ ] Atlas connects; `GET /api/db-status` → `{"connected":true}`
- [ ] Register → data visible in Atlas `AgriTech.users` (password is a bcrypt hash)
- [ ] Farmer journey: register → login → farm → crop → crop detail → weather → marketplace → demo order → history
- [ ] Booking journey: services → book → view → reschedule → cancel
- [ ] Admin journey: seed:admin → login → dashboard → product/stock → orders/bookings/users
- [ ] Two farmers cannot see each other's farms
- [ ] Mobile layout in browser dev-tools (iPhone/Android sizes)
- [ ] Retake screenshots for the report

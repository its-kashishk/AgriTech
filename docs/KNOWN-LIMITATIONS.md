# Known limitations (be upfront about these in the report and viva)

* **Not verified against Atlas or the real OpenWeatherMap API** — tests ran on a MongoDB-compatible server and a local weather stand-in (see TEST-PLAN).
* **Demo checkout only** – no payment gateway; `paymentStatus` is always "simulated"; no card data is collected.
* **Alerts are rules, not AI**; soil guidance is generic; no sensor/IoT data; no outbreak prediction. Crop-guide content is a short, approximate student reference and must be confirmed with local experts.
* **No yield prediction, resource-usage (water/fertiliser) tracker or analytics export** beyond the dashboards and charts; the SkillWallet "resource management" and "yield prediction" ideas are only partly covered (activity log + soil records).
* **No expert role / live consultation** – consultation is a bookable service handled by admins; no chat/video.
* **JWT in `localStorage`** (XSS-readable) and no server-side revocation or refresh tokens; tokens last 1 day. A production app would use httpOnly cookies + refresh tokens.
* **No e-mail verification / password reset / account approval step.**
* **Booking availability is simplified**: capacity per service/date/slot; no provider calendars; the capacity check is "count then insert", so two simultaneous requests could both pass for the last seat.
* **Stock reservation** relies on MongoDB's atomic conditional update (plus a single-process lock); no multi-document transactions.
* **Rate limiting is per process (in memory).** Rate limits apply to auth (30 per 15 min), password change and weather (30/min).
* **Multilingual:** English + Hindi for navigation, buttons, headings and main labels. Form field labels in several pages, validation messages from the server, crop guide, pest notes, alerts, forum and admin pages remain **English**. Hindi strings were not reviewed by a native speaker.
* **Accessibility** was designed in (labels, skip link, focus rings, aria on dialogs/progress) but not audited with a screen reader.
* Weather forecast uses the free 5-day/3-hour endpoint; icons load from openweathermap.org.
* Pagination is implemented on main lists; some lists (farms, crops pick-lists) cap at 50 items.
* Images for products are URLs only (no uploads).
* Not deployed; no CI.

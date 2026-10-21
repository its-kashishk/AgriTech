# Demo video plan (target 8–10 minutes) — *not recorded yet*

Prepare: backend + frontend running, `seed:admin` and `seed:demo` done, a real OpenWeather key set, browser at 100% zoom, a second window ready for dev-tools mobile view. Use a fresh farmer e-mail. Record with any screen recorder (Xbox Game Bar `Win+G`, OBS, or Loom), upload (YouTube *unlisted* / Drive), paste the link in SkillWallet.

| # | Min | Show | Say / point out |
|---|---|---|---|
| 1 | 0:00 | Landing page | Problem, MERN stack, honest-by-design note (demo checkout, rule-based alerts, no sensors) |
| 2 | 0:45 | Register → dashboard (empty state) → logout → login | bcrypt, JWT; try a wrong password |
| 3 | 1:45 | Farms → add farm | validation; fields |
| 4 | 2:30 | Crops → add crop (show bad-date error) → crop detail → change stage | ownership & date validation, progress bar |
| 5 | 3:30 | Crop guide + pests tab | reference data with source/disclaimer |
| 6 | 4:00 | Weather: city search, then farm; mention "Use my location" permission; show an invalid city | OpenWeather via server, cache, retrieved time |
| 7 | 5:00 | Soil record → Guidance; Alerts page | "entered by you", rule list on the Alerts page |
| 8 | 5:45 | Marketplace → search → cart → demo order → Orders | server-side price/stock; "Demo" banner |
| 9 | 6:45 | Services → book → Bookings → reschedule → cancel | capacity rule, status rules |
| 10 | 7:30 | Log in as admin: dashboard, products/stock, orders status change, bookings, users, advisory | role-based access; farmer visiting /admin is redirected |
| 11 | 9:00 | Responsive: dev-tools mobile width, open the menu; switch language to हिन्दी | |
| 12 | 9:30 | Atlas → show the collections | database design |

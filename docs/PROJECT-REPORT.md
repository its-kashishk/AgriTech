# AgriTech — Empowering Farmers Through Digital Technology
**Project report (draft) — SkillWallet Full Stack Development (MERN) · Individual project**

> ⚠ **Template notice.** The mandatory SkillWallet report template was not available when this draft was prepared. This draft follows the section list requested for the capstone; before submission, copy its content into the official template and keep the template's headings and formatting. Items in **[YOU]** must be completed by the student (name, ids, screenshots, links, mentor). No result below is invented: test figures come from `docs/TEST-PLAN.md`.

**Student:** [YOU: Kashish Kamaal] · **Program/Project:** Full Stack Development MERN · AgriTech · **Mentor:** [YOU – none assigned yet] · **GitHub:** [YOU] · **Demo video:** [YOU]

## 1. Abstract
AgriTech is a MERN web application that gives farmers one place to manage farms and crops, check weather from OpenWeatherMap, record soil observations, read a crop guide, purchase farm inputs through a demonstration marketplace, book services and discuss with other farmers. Administrators manage users, products, services, orders, bookings and advisories. The API follows MVC with JWT authentication, bcrypt hashing, role-based authorisation, validation and rate limiting. The interface is responsive and available in English and Hindi (interface text). Testing combined 39 automated API tests, a Postman/Newman run and a 20-step browser run (executed against a MongoDB-compatible test server and a stand-in weather provider; Atlas and live weather verification are listed as pending).

## 2. Problem statement
Small farmers often keep records on paper, rely on word of mouth for weather and crop information, and find buying inputs or booking equipment time-consuming. Existing tools are rarely simple, mobile-friendly or available in regional languages. AgriTech explores how a lightweight, accessible web platform can bring these functions together.

## 3. Objectives
1. Secure registration/login with farmer and admin roles. 2. Farm and crop record management. 3. Weather information for farm locations. 4. Soil observation records with general guidance. 5. A crop and pest information library. 6. A resource marketplace with demo ordering and an inventory-aware backend. 7. Service booking with status tracking. 8. Community forum. 9. Admin dashboard with real statistics. 10. Responsive, accessible, bilingual interface.

## 4. Scope
In scope: the modules above. Out of scope: real payments, IoT sensors, AI/ML prediction, live expert video/chat, native mobile apps, deployment. See `KNOWN-LIMITATIONS.md`.

## 5. Requirements
**Functional:** FR1 register/login/profile · FR2 farms CRUD (owner-only) · FR3 crops CRUD with date validation, filters · FR4 crop guide search · FR5 weather by city/coordinates/farm with forecast · FR6 soil records + guidance + chart · FR7 pest/disease reference and rule-based alerts · FR8 product catalogue, search, cart, demo orders, order history/status · FR9 services and bookings (create, reschedule, cancel) · FR10 forum posts/comments with moderation · FR11 farmer dashboard · FR12 admin: users, products/inventory, services, orders, bookings, advisories, statistics.
**Non-functional:** security (hashing, JWT, RBAC, validation, rate limits, headers); data integrity (stock never negative, price from DB); usability (responsive, labelled forms, loading/empty/error states, confirmations); maintainability (MVC, modules); performance (code-splitting, pagination, weather caching); honesty (demo/rule labels).

## 6. System architecture
See `docs/ARCHITECTURE.md` for the diagram. React SPA → Express API (`/api`, middleware chain) → MongoDB Atlas; weather via server-side OpenWeatherMap calls. **[YOU: paste the diagram image]**

## 7. User roles
Farmer and Admin (table in ARCHITECTURE.md). Admin accounts are created only by `npm run seed:admin` or promotion by an admin; registration never grants admin.

## 8. User flow
Home → Register/Login → Dashboard → Farms → Crops → Crop info → Weather → Marketplace → Cart → Orders → Services → Bookings (plus Soil, Alerts, Community).

## 9. MVC architecture
Models (Mongoose), Controllers (business logic), Routes (endpoints). Request chain: rate-limit → JWT → role → zod validation → controller → model (see ARCHITECTURE.md).

## 10. Technology stack
React 19, Vite, React Router, Axios, React-Bootstrap, Recharts, React Icons · Node.js, Express 5, Mongoose 9, bcryptjs, jsonwebtoken, zod, helmet, express-rate-limit · MongoDB Atlas · Jest, Supertest, Playwright, Postman/Newman.

## 11. Database design
13 collections (see `docs/ER-DIAGRAM.md`): User, Farm, Crop, FarmActivity, SoilRecord, Product, Order (embedded items with price snapshots), Service, Booking, Post, Comment, Alert, WeatherCache. References via ObjectId; indexes for owner/farm queries; unique email, unique farm name per owner; unique alert key per user.

## 12. API design
REST under `/api` with consistent envelopes and status codes — see `docs/API.md` and the Postman collection.

## 13. Module descriptions
* **Authentication** – bcrypt + JWT, profile, password change, disabled-account handling.
* **Farm & crop** – owner-scoped CRUD; harvest date must follow sowing; crop detail with season progress and stage update; cascade deletes.
* **Crop information** – 8 crops with climate, soil, irrigation, planting, stages, harvest, care, pests/diseases; source and disclaimer displayed.
* **Weather** – current weather (temperature, humidity, wind, pressure, description, icon), 5-day outlook, location + retrieval time, cache, error handling, optional geolocation.
* **Soil** – pH, moisture, N/P/K entered by the farmer, trend chart, general guidance, explicit "not a lab diagnosis".
* **Alerts** – transparent rules + admin advisories.
* **Marketplace** – search/filter, stock display, cart, demo checkout, atomic stock reservation, rollbacks, cancellation.
* **Services & bookings** – slot capacity, status flow (pending → confirmed → completed; cancel/reject).
* **Community** – posts, comments, tags/categories, author-only edit, admin moderation.
* **Admin** – dashboard aggregates, user management, inventory, orders, bookings, advisories.

## 14. Screenshots
Files in `docs/screenshots/` were captured in the sandbox (weather via a stand-in provider). **[YOU: retake with your real setup]** and insert: landing, register, dashboard, farm form, crop detail, weather, soil, marketplace, cart/orders, bookings, community, admin dashboard/products/orders, mobile menu.

## 15. Testing methodology and results
Method: automated API tests (Jest/Supertest), Postman collection run with Newman, Playwright browser journeys on the production build, build and lint. **Actual results (sandbox, 21 Oct 2026):** 39/39 API tests passed; Newman 28 requests, 30 assertions, 0 failures; 20/20 browser steps passed; client build succeeded; lint 0 errors / 10 warnings. One defect was found and fixed (logout redirect). **Not yet verified:** MongoDB Atlas, live OpenWeatherMap, cross-browser, screen readers. **[YOU: add your own re-run results]**

## 16. Security and privacy considerations
Password hashing (bcrypt), JWT with 1-day expiry, server-side RBAC and ownership checks, input validation and key sanitisation, CORS restriction, helmet headers, rate limiting on auth/weather, generic error messages, secrets only in `.env`, weather key never exposed to the browser, no card data stored, passwords never returned. Privacy: only data the user enters is stored (name, email, optional phone/location, farm records); no tracking; geolocation only on explicit click and not stored. Limitations: JWT in localStorage, no revocation, no email verification, per-process rate limit.

## 17. Limitations
See `docs/KNOWN-LIMITATIONS.md` (demo payments; rule-based alerts; partial translation; simplified booking capacity; unverified Atlas/live weather).

## 18. Future enhancements
httpOnly-cookie sessions with refresh tokens; email verification and password reset; payment-gateway sandbox; push/SMS notifications; image upload; resource-usage and yield tracking; more regional languages reviewed by native speakers; real expert consultation chat; deployment with CI.

## 19. Conclusion
The project delivers a working, tested MERN platform covering the main modules of the SkillWallet brief with attention to security and honesty about what is demo or rule-based. Remaining steps are verification on Atlas with a real weather key, recording the demo, and completing the official report template.

## 20. References
React docs (react.dev); Vite (vite.dev); React Router (reactrouter.com); Express (expressjs.com); Mongoose (mongoosejs.com); MongoDB Atlas docs (mongodb.com/docs/atlas); OpenWeatherMap API docs (openweathermap.org/api); JWT (jwt.io/introduction); OWASP Cheat Sheet Series; Bootstrap 5 / React-Bootstrap docs; Recharts (recharts.org). Agronomic summaries are general public extension guidance (e.g. ICAR / state agricultural universities) — verify locally. **[YOU: add any course material you used]**

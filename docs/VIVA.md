# Grand Assessment / viva preparation (answers match this code)

**1. Explain the MERN architecture here.** React SPA (Vite) calls a JSON REST API built with Express on Node; Mongoose models persist data in MongoDB Atlas. The browser only talks to `/api`; secrets (JWT secret, DB URI, weather key) stay on the server.

**2. What is MVC in your backend?** Models = `server/models` (schemas); Controllers = `server/controllers` (logic); Routes = `server/routes/index.js` (URL → middleware → controller). The "view" of a REST API is the JSON response (React renders the UI).

**3. Why did you not use microservices (the diagram shows services)?** Scope and maintainability for one developer. The boxes in the diagram are modules inside one Express app; `/api` is the single gateway-like entry point.

**4. Show relationships.** `Crop.farm → Farm`, `Farm.owner → User`, `Booking.user/service/farm`, `Order.items[].product`. See `docs/ER-DIAGRAM.md`. Orders embed items with price snapshots; farms/crops are referenced.

**5. How does JWT auth work?** Login verifies the bcrypt hash, signs a 1-day JWT `{id}` with `JWT_SECRET`. The client sends it as `Authorization: Bearer`. `protect` verifies it, loads the user (active only) and sets `req.user`; `authorize('admin')` checks the role from the database.

**6. Why bcrypt?** Passwords are never stored in plain text; bcrypt is slow and salted, so leaked hashes are hard to crack. Cost 10 in `User.js`; the hash has `select:false` so queries don't return it.

**7. How do you stop someone registering as admin?** The zod register schema has no `role`; the controller forces `farmer`. Admins come from `npm run seed:admin` (password from `.env`) or are promoted by an existing admin. Tested.

**8. How do you stop farmer A reading farmer B's farm?** Every query includes `{ owner: req.user.id }` (`utils/ownedCrud.js`), so the result is 404. Referenced farms/crops are checked on write. Tested.

**9. How do you prevent overselling?** `findOneAndUpdate({_id, stock:{$gte:qty}}, {$inc:{stock:-qty}})` is atomic per document in MongoDB; failed multi-item orders roll back; prices come from the DB. A small in-process lock adds protection on one server. (I observed that a MongoDB-compatible test server lacked this atomicity, which is why I document it.)

**10. REST design?** Nouns + verbs (`GET /farms`, `POST /farms`, `PUT/DELETE /farms/:id`), consistent `{success,data,message}`, status codes 200/201/400/401/403/404/409, pagination via `page/limit`.

**11. Validation & security?** zod schemas for every write; Mongoose validators; sanitiser removes `$`/dotted keys; helmet; CORS limited to `CLIENT_URL`; rate limits on auth and weather; JSON size limit; generic errors (no stack traces); same message for wrong email/password.

**12. How is the weather integrated?** `GET /api/weather` → `weatherService` calls OpenWeatherMap `/weather` and `/forecast` with the key from `.env`, normalises the data, caches 15 min in MongoDB, maps provider errors to 404/502/503/504. Browser geolocation is requested only on a button click.

**13. React routing and state?** React Router v7 with lazy-loaded pages; `RequireAuth` guards routes (the API enforces the same rules); Context for auth, cart, language, toasts; `useFetch` hook for data.

**14. How are alerts generated?** Documented rules in `alertService.js` (e.g. humidity ≥80% and 15–30 °C → fungal-disease advisory; harvest due ≤7 days; soil pH <5.5 or >8). They are advisories, not AI predictions, and are de-duplicated per day.

**15. Multilingual?** `LanguageContext` + `i18n/en.js`, `hi.js`; unknown keys fall back to English. Only UI chrome is translated — agricultural advice isn't, to avoid inaccurate translations.

**16. What testing did you do?** 39 Jest/Supertest API tests, a Newman run of the Postman collection, a 20-step Playwright browser run, build and lint (see TEST-PLAN). What I could not test: Atlas and the real weather API in my sandbox — I list that openly.

**17. Limitations / future work?** See KNOWN-LIMITATIONS: JWT in localStorage, no payments, simplified booking capacity, partial translation, no real expert chat. Future: httpOnly cookies + refresh tokens, email verification, payment gateway sandbox, notifications, image upload, more languages.

**18. Design decisions to defend:** soft-delete products (keep order history); snapshots in orders; static crop library; ownership by `owner` field; avoiding transactions for portability; demo labels on seeded data.

**Be ready to demo:** register, create farm/crop, show the 404 when using another user's id in Postman, place an order and show stock decrease in Atlas.

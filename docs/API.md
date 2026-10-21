# REST API

Base URL `http://localhost:8000/api`. JSON in/out. Protected routes need `Authorization: Bearer <token>`.
Success: `{ "success": true, "data": …, "message"?: …, "meta"?: { page, limit, total, pages } }`
Error: `{ "success": false, "message": "…", "errors"?: [{ field, message }] }`
Status codes: 200/201 OK, 400 validation, 401 not logged in, 403 wrong role/not author, 404 not found (also for other users' records), 409 conflict (duplicate, stock, slot full), 429 rate limited, 502/503/504 weather provider problems.
Lists accept `page` (default 1) and `limit` (default 20, max 50).

| Group | Method & path | Who | Notes |
|---|---|---|---|
| Health | GET `/health` | public | |
| Auth | POST `/auth/register` | public | role is ignored → always farmer; rate-limited |
| | POST `/auth/login` | public | rate-limited; same error for bad email/password |
| | GET `/auth/me` | any | |
| Users | PUT `/users/me` | any | name, phone, location, language |
| | PUT `/users/me/password` | any | currentPassword, newPassword |
| Farms | GET/POST `/farms`, GET/PUT/DELETE `/farms/:id` | owner | delete cascades |
| Crops | GET/POST `/crops`, GET/PUT/DELETE `/crops/:id` | owner | filters `farm,status,stage,type`; harvest date must be after sowing |
| Activities | GET/POST `/activities`, GET/PUT/DELETE `/activities/:id` | owner | filters `farm,crop,type` |
| Soil | GET/POST `/soil`, GET/PUT/DELETE `/soil/:id`, GET `/soil/:id/guidance` | owner | pH 0–14, moisture 0–100 |
| Dashboard | GET `/dashboard` | farmer | real counts for the logged-in user |
| Crop info | GET `/crop-info?q=&type=`, GET `/crop-info/:slug`, GET `/crop-info/pests?crop=&q=` | any | static, attributed reference data |
| Weather | GET `/weather?city=` or `?lat=&lon=` or `?farm=<id>` | any | server-side OpenWeatherMap, cached 15 min, rate-limited 30/min; `farm` also evaluates alert rules |
| Products | GET `/products?q=&category=&inStock=&page=` | any | admin may add `all=true` |
| | GET `/products/:id`; POST `/products`; PUT/DELETE `/products/:id` | read: any; write: admin | DELETE is a soft delete |
| Orders | POST `/orders` | farmer | `{items:[{product,quantity}], shippingAddress}`; price/stock from DB |
| | GET `/orders`, GET `/orders/:id`, PUT `/orders/:id/cancel` | owner | cancel only while pending; restores stock |
| | GET `/orders/admin/all?status=`, PUT `/orders/:id/status` | admin | flow: pending→confirmed→shipped→delivered; cancel allowed before shipping |
| Services | GET `/services`, GET `/services/:id` | any | |
| | POST `/services`; PUT/DELETE `/services/:id` | admin | delete blocked if open bookings |
| Bookings | POST `/bookings` | farmer | `{service,date,slot,farm?,notes?}` |
| | GET `/bookings`, GET `/bookings/:id`, PUT `/bookings/:id`, PUT `/bookings/:id/cancel` | owner | reschedule only while pending; cancel while pending/confirmed |
| | GET `/bookings/admin/all`, PUT `/bookings/:id/status` | admin | pending→confirmed/rejected/cancelled; confirmed→completed/cancelled |
| Community | GET/POST `/community`, GET/PUT/DELETE `/community/:id` | any / author (admin may delete) | filters `q,category,tag` |
| | POST `/community/:id/comments`, DELETE `/community/:id/comments/:commentId` | any / author or admin | |
| Alerts | GET `/alerts`, PUT `/alerts/:id/read` | any | refreshes rule-based alerts |
| | POST `/alerts/broadcast`, DELETE `/alerts/broadcast/:id` | admin | advisory to all farmers |
| Admin | GET `/admin/stats`, GET `/admin/users?q=&role=`, PUT `/admin/users/:id` | admin | cannot change own role/status |

A Postman collection with login-token capture and basic assertions is in `docs/AgriTech.postman_collection.json` (set variables `baseUrl`, `email`, `password`, `adminEmail`, `adminPassword`).

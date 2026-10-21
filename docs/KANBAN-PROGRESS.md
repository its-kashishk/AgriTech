# SkillWallet Kanban mapping (6 epics / 19 stories)

Status key — **Done & verified** (ran/tested, see TEST-PLAN) · **Ready for review** (built and tested in sandbox, needs your check on your machine) · **To do (you)** · The SkillWallet board itself must be updated by you; nothing was changed there.

| Epic | Story | Implementation | Status |
|---|---|---|---|
| Project Architecture | Technical Architecture | `docs/ARCHITECTURE.md` (diagram) | Ready for review |
| | ER Diagram | `docs/ER-DIAGRAM.md` (matches schemas) | Ready for review |
| | Features | README + this repo's modules | Ready for review |
| | Roles and responsibilities | ARCHITECTURE.md § Roles; role checks in `middleware/auth.js` | Done & verified (tests) |
| | User Flow | ARCHITECTURE.md § User flow; E2E script follows it | Ready for review |
| | MVC Pattern | models / controllers / routes | Done & verified (structure) |
| Project Setup & Configuration | Creating Project Folder | `client/`, `server/` | Ready for review (merge, see MERGE-GUIDE) |
| | Setting up Client folder | Vite + React + axios, router, bootstrap, react-bootstrap, react-icons, recharts | Done & verified (build) |
| | Setting up Server folder | Express, mongoose, cors, dotenv, bcryptjs, jsonwebtoken (+helmet, zod, rate-limit) | Done & verified (server starts) |
| Backend Development | Backend Structure | `server/` layout | Done & verified |
| | Development and Explanation | all controllers/routes, JWT middleware | Done & verified (39 tests, Newman) |
| Database Development | Configure MongoDB | Atlas steps in README | **To do (you)** – connect your Atlas cluster |
| | Create Database Connection | `config/db.js` (await, then listen) | Ready for review – verified on a compatible server, **not on Atlas** |
| | Create Schemas and Models | 13 models | Done & verified (tests) |
| Front-end Development | Frontend Structure | `client/src/*` | Done & verified (build) |
| | Development and Explanation | pages, Axios, OpenWeatherMap via API, charts, i18n | Done & verified (E2E) with weather stand-in; real key **To do (you)** |
| Project Execution | Steps for Execution | README | Ready for review |
| | Demo Screenshots | `docs/screenshots` (sandbox) | **To do (you)** – retake on your machine |
| | Demo Video | `docs/DEMO-SCRIPT.md` | **To do (you)** – record and upload |
Also **To do (you):** add GitHub and Demo links in SkillWallet, mentor review, Grand Assessment.

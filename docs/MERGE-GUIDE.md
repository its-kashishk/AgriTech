# Merging this project into `D:\Kashish-Project\AgriTech`

This code was built in a cloud sandbox, so it replaces your starter files rather than editing them in place.

1. **Back up first**: copy `D:\Kashish-Project\AgriTech` to `AgriTech-backup`.
2. **Keep your secrets**: copy your current `server\.env` somewhere safe (do not paste it into chats). Optionally rotate the Atlas DB password and OpenWeather key if they were ever shared.
3. Unzip `agritech-mern.zip`. Copy over your project folder:
   * `server\` → replaces `server\index.js` and adds `config, controllers, middleware, models, routes, services, utils, validators, data, seeds, tests`, `package.json`, `.env.example`.
   * `client\` → replaces `client\src`, `index.html`, `package.json`, `public\`.
   * `docs\`, `README.md`, `.gitignore` → project root.
   * **Do not** copy anything named `node_modules`; run `npm install` in `server` and `client`.
4. Restore your `server\.env`; add the new keys from `server\.env.example` (`JWT_SECRET` ≥ 16 chars, `CLIENT_URL`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, optional `OPENWEATHER_API_KEY`). `MONGO_URI` should end with `/AgriTech?retryWrites=true&w=majority`.
5. Start the backend and confirm `MongoDB connected successfully` appears **before** `Server running on port 8000`.
6. `npm run seed:admin`, `npm run seed:demo`, start the client, and walk through `docs/DEMO-SCRIPT.md`.
7. If Git is already initialised in the folder, run `git status` and check that `.env` is **not** listed before committing.

Your previous `server/index.js` printed "Server running" without waiting for `mongoose.connect()`, which is why "MongoDB connected" never appeared and failures were hidden. The new entry point awaits the connection first and exits with an explanation if it fails.

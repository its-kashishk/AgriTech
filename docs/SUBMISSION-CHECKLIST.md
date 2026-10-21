# SkillWallet submission checklist (tick yourself — nothing here is done for you)

- [ ] Merge the code into `D:\Kashish-Project\AgriTech` (`MERGE-GUIDE.md`)
- [ ] Atlas connects; `MongoDB connected successfully` shown before `Server running`
- [ ] `npm run seed:admin` and `npm run seed:demo`; OpenWeather key added
- [ ] `npm test` (against an `AgriTech_test` database), `npm run build`, manual journeys in TEST-PLAN §6
- [ ] Retake screenshots with the real weather key and put them in the report
- [ ] Complete the **SkillWallet report template** (open the report document in the workspace; paste sections from `docs/PROJECT-REPORT.md`) — *the mandatory template was not available to me*
- [ ] Secret check before committing: `git status` (no `.env`), `git grep -n -i "mongodb+srv://" -- . ":!*.example" ":!*.md"` returns nothing with a real password, `git grep -n "appid="` nothing
- [ ] If any secret was ever pasted/committed: rotate the Atlas DB password, `JWT_SECRET` and OpenWeather key
- [ ] Review: `git add . ; git status ; git commit -m "AgriTech MERN capstone" ; git remote add origin <your repo URL> ; git push -u origin main` (only when you decide)
- [ ] Record the demo video (`DEMO-SCRIPT.md`), upload (unlisted), copy the link
- [ ] SkillWallet → project page → **Add Github Link** and **Add Demo Link**
- [ ] Update the Kanban board cards (`KANBAN-PROGRESS.md`)
- [ ] Mentor review (none assigned yet on your page) and Grand Assessment (`VIVA.md`)

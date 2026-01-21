# Push: neues GitHub Repo erstellen und hochladen

Ich kann das GitHub-Repo nicht zuverlässig ohne deine Credentials/Interaktion erstellen. Hier sind die schnellsten Wege.

## Option A: GitHub CLI (empfohlen)

1. GitHub CLI installieren (falls nötig): https://cli.github.com/
2. Login:
   - `gh auth login`
3. Repo erstellen und pushen:
   - `cd Sunflow-HA`
   - `gh repo create robotnikz/sunflow-ha --public --source=. --remote=origin --push`

## Option B: Web UI

1. Auf GitHub ein neues Repo anlegen (z.B. `sunflow-ha`).
2. Remote setzen und pushen:
   - `cd Sunflow-HA`
   - `git remote add origin https://github.com/robotnikz/sunflow-ha.git`
   - `git add -A`
   - `git commit -m "chore: initial home assistant addon + integration scaffold"`
   - `git push -u origin main`

## Hinweis

Fürs Add-on Repository in Home Assistant brauchst du danach die Repo-URL (z.B. `https://github.com/robotnikz/sunflow-ha`).

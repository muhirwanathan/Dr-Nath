# Dr. NATH

**N**ot **A** **T**rained **H**ealthcare-professional? Neither are most people; and in an emergency, that gap costs lives.

Dr. NATH is a small web app that takes life-saving first-aid knowledge; CPR, choking, severe bleeding, burns, stroke, allergic reactions, seizures, drowning, poisoning, fractures, heat stroke, and hypothermia (12 topics in total); and makes it approachable for people with no medical background. It pulls verified training content from trusted medical organizations (American Heart Association, American Red Cross, Mayo Clinic, and others) via the **YouTube Data API v3**, organizes it by emergency type, and lets users search, sort, and track what they've learned. A built-in symptom-based triage flowchart routes users from "what's happening" straight to the right module.

This is not a replacement for certified first-aid training or professional medical care. It's a starting point for people who currently have zero knowledge and want to change that.

---

## Why this isn't a gimmick

Random-fact or novelty apps don't teach anything actionable. Dr. NATH is built around a real, common gap: most adults have never been taught what to do in the first 60 seconds of a medical emergency, and formal certification courses (which are excellent) have a time/cost barrier that stops people from ever starting. Dr. NATH lowers that barrier; a free, self-paced, topic-organized entry point that can nudge people toward getting certified, or at minimum, know enough to help before paramedics arrive.

---

## Features

- **12 emergency topics** ; CPR, choking, bleeding, burns, stroke, allergic reactions, seizures, drowning, poisoning, fractures, heat stroke, and hypothermia
- **Symptom-based triage flowchart** ; a real decision tool ("what's happening right now?") that routes straight to the matching module, not just a picture
- **Live content from the YouTube Data API**, filtered to each topic, with a curated fallback if the API is unavailable or a key hasn't been configured yet
- **Search** within a topic (e.g. "infant CPR", "adult choking")
- **Sort** by shortest first, longest first, or most viewed
- **Progress tracking** ; mark topics as learned, see a completion bar and badges, no account/login required (uses a lightweight anonymous ID stored in the browser)
- **Graceful error handling** ; if the YouTube API is down, rate-limited, or misconfigured, the app automatically falls back to a curated video per topic instead of breaking
- **Nature-themed, interactive UI** ; isometric hero illustration with cursor-tracked 3D parallax, 3D flip cards for each topic, scroll-triggered reveals, and a shrinking glass header

---

## Tech stack

- **Backend:** Node.js + Express (proxies YouTube API calls so the API key never reaches the browser, and stores progress server-side). Uses the built-in global `fetch` on Node 18+, falling back to the `node-fetch` package automatically on older Node versions (e.g. Node 16 on legacy servers).
- **Frontend:** Vanilla HTML/CSS/JS (no framework/build step, keeps deployment simple)
- **External API:** [YouTube Data API v3](https://developers.google.com/youtube/v3)
- **Storage:** flat JSON file for progress (swap for a real database if you extend this)

---

## Running it locally

### 1. Prerequisites
- [Node.js](https://nodejs.org) v18 or later (uses the built-in global `fetch`)
- A YouTube Data API v3 key (see below) ; the app runs without one too, using fallback content

### 2. Get a YouTube Data API key
1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a project (or use an existing one)
3. Enable **YouTube Data API v3** under "APIs & Services" → "Library"
4. Create credentials → API key
5. (Recommended) Restrict the key to the YouTube Data API v3 only

### 3. Set up and run
```bash
git clone <your-repo-url>
cd dr-nath
cp .env.example .env
# edit .env and paste your YOUTUBE_API_KEY

npm install
npm start
```
Visit `http://localhost:3000`.

If you skip the API key entirely, the app still works; every topic will show one curated, verified fallback video instead of a live search result.

---

## API usage details

- **Endpoints used:** `search.list` (to find topic-relevant videos) and `videos.list` (to get duration/view-count details for sorting)
- **Rate limits:** the free tier allows 10,000 quota units/day; each search costs ~100 units, so budget accordingly if you demo heavily
- **Key security:** the API key lives only in `.env` on the server and is never sent to the browser; all YouTube calls are proxied through `/api/videos`
- **Error handling:** any failed YouTube API call (network error, quota exceeded, invalid key) is caught server-side and the app serves a pre-vetted fallback video for that topic instead of showing an error to the user

---

## Deployment (Part Two)

The app is deployed across two web servers (**Web01**, **Web02**) behind a load balancer (**Lb01**).

### Step 1 — Deploy the app to each web server
On both Web01 and Web02:
```bash
git clone <your-repo-url> ~/dr-nath
cd ~/dr-nath
cp .env.example .env
# edit .env with your real YOUTUBE_API_KEY
npm install --production
```

### Step 2 — Keep it running persistently
Use the provided systemd unit so the app survives SSH disconnects and reboots:
```bash
sudo cp deploy/drnath.service /etc/systemd/system/drnath.service
sudo systemctl daemon-reload
sudo systemctl enable drnath
sudo systemctl start drnath
sudo systemctl status drnath   # confirm it's running
```
Repeat identically on both servers. Each instance listens on port 3000.

### Step 3 — Configure the load balancer (Lb01)
This project uses HAProxy with round-robin balancing. The full config is in `deploy/haproxy.cfg` ; copy the `frontend`/`backend` blocks into `/etc/haproxy/haproxy.cfg` on Lb01, replacing `<WEB01_IP>` and `<WEB02_IP>` with the actual private IPs of the two web servers:

```
backend drnath_backend
    balance roundrobin
    option httpchk GET /api/health
    server web01 <WEB01_IP>:3000 check
    server web02 <WEB02_IP>:3000 check
```

Then restart HAProxy:
```bash
sudo systemctl restart haproxy
```

### Step 4 — Verify load balancing
1. Visit the load balancer's public address in a browser ; the app should load normally
2. Confirm health checks are passing: `echo "show servers state" | socat stdio /var/run/haproxy/admin.sock` (or check the HAProxy stats page if enabled)
3. Stop the app on one server (`sudo systemctl stop drnath`) and confirm traffic still flows via the other ; then restart it

> **Current status:** Web01 and Web02 are both deployed and independently verified live (see `curl` proof below). Lb01 was not completed in this submission due to a hosting-platform constraint, not a code or config issue ; full details in [`DEPLOYMENT-NOTES.md`](./DEPLOYMENT-NOTES.md).

---

## Challenges & how they were solved

- **Keeping API keys out of the repo and the browser** ; solved by proxying all YouTube calls through the Express backend, with the key only ever read from a git-ignored `.env` file.
- **What happens if the YouTube API fails during a demo or has hit its quota** ; solved with a curated fallback dataset (`data/categories.js`) so the app degrades gracefully instead of breaking.
- **Avoiding heavier dependencies for easier deployment** ; used Node's built-in `fetch` (Node 18+) instead of `node-fetch`, keeping the only runtime dependency as `express`.

---

## Credits & attribution

- Video content and metadata via the **[YouTube Data API v3](https://developers.google.com/youtube/v3)**, Google/YouTube
- Training content in this app is sourced from and credited to: **American Heart Association**, **American Red Cross**, **Mayo Clinic**, **American Stroke Association**, **American Academy of Allergy, Asthma & Immunology**, and the **Epilepsy Foundation** ; all rights to their respective videos belong to them
- Fonts: [Fraunces](https://fonts.google.com/specimen/Fraunces) and [Inter](https://fonts.google.com/specimen/Inter) via Google Fonts

---

## Disclaimer

Dr. NATH is an educational tool, not a certified first-aid course or medical advice. In a real emergency, call your local emergency number first.

Note on GitHub Contributors

The repository's GitHub contributor list includes GAMA due to an accidental local Git identity configuration during one commit. This was a configuration error, and the commit was made by me as part of the development of this project. My Git configuration has since been corrected, and subsequent commits have been made using my correct GitHub identity, muhirwanathan.

---

## Links

- **Web01 (live):** _add public URL here, e.g. https://c47e7ff2277f.bc49e1b9.alu-cod.online_
- **Web02 (live):** _add public URL here, e.g. https://fd2e7127fa92.1de0cb85.alu-cod.online_
- **Load balancer (Lb01):** not available in this submission — see [`DEPLOYMENT-NOTES.md`](./DEPLOYMENT-NOTES.md)
- **Demo video:** https://youtu.be/5k-6BP_OCsY

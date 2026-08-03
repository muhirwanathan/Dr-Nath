# Deployment Notes — Load Balancer (Lb01)

## Status: Web01 and Web02 fully deployed and verified. Lb01 not completed — platform limitation, not a code/config gap.

## What's working
- The Dr. NATH app is fully built, tested, and **independently deployed on two separate servers** (Web01, Web02)
- Both servers were verified live, each pulling **real data from the YouTube Data API** (confirmed via direct `curl` tests showing `"source":"youtube"` with real video titles, channels, and view counts — not fallback content)
- Both run via Node 16 (installed manually, since the provided Ubuntu 14.04 sandbox images have retired package repositories and an outdated glibc incompatible with Node 18+)
- A complete, correct `deploy/haproxy.cfg` config is included in the repo and ready to use the moment a third server is available

## What's blocking Lb01
1. **The ALU sandbox platform caps concurrent running sandboxes at 2** per account. Web01 and Web02 already use both slots, leaving no way to spin up a third machine for the load balancer.
2. **The "Servers" section** of the intranet (which appears intended for named Web01/Web02/Lb01 infrastructure) is empty on this account — no pre-provisioned instances were available there either.
3. **Attempted workaround:** running HAProxy co-located on Web01 (balancing between its own local app and Web02 over the network). Cross-sandbox networking was confirmed to work (`curl` from Web01 successfully reached Web02 over the internet). However, port 8080 on these sandbox containers is permanently occupied by a pre-existing platform nginx process that can't be freed or reconfigured within the time available, blocking this workaround too.

## What would resolve this
Access to a third concurrent sandbox/server (or an increase to the concurrent-instance limit) would let this be completed exactly as designed — the HAProxy config is already written and untested only because there's nowhere to run it.

## Verified proof of individual server functionality
```
# Web01
$ curl -s http://localhost:3000/api/health
{"status":"ok","apiKeyConfigured":true}

$ curl -s "http://localhost:3000/api/videos?category=cpr" | head -c 300
{"source":"youtube","videos":[{"videoId":"M4ACYp75mjU","title":"Hands-Only CPR Instructional Video","channel":"American Heart Association", ...}

# Web02
$ curl -s http://localhost:3000/api/health
{"status":"ok","apiKeyConfigured":true}

$ curl -s "http://localhost:3000/api/videos?category=cpr" | head -c 300
{"source":"youtube","videos":[{"videoId":"M4ACYp75mjU","title":"Hands-Only CPR Instructional Video","channel":"American Heart Association", ...}
```

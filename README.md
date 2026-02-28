# GREENROOM

AI production studio for JellyJelly, running inside encrypted group chat.

Three autonomous AI agents coordinate in real-time to find content gaps, run intelligence, recruit creators, open funded production rooms, and generate QR codes — all inside a Convos group chat.

## How It Works

```
User types "lets go" in the group chat
        |
   PULSE (Creative Director)
   Scans JellyJelly trending + NYC events
   Cross-references to find content gaps
   Drops 2-3 picks with creative direction
        |
   SCOUT (Intel & Talent)
   Deep-dives each opportunity
   Finds creators, funders, verifies gaps
   Packages intel with dollar amounts
        |
   BANKER (Production & Deals)
   Opens FUNDER room (green QR code)
   Opens CREATOR room (purple QR code)
   Posts full brief + QR codes in chat
        |
   Scan green QR = back the production
   Scan purple QR = get your assignment
```

Full pipeline: under 90 seconds. No human in the loop.

## Agents

### PULSE — Creative Director
- Scans JellyJelly trending feed in real-time
- Cross-references with NYC events (lu.ma, google, reddit, timeout)
- Identifies content gaps worth producing
- Designs creative briefs with specific angles

### SCOUT — Intelligence & Talent
- Deep event intel via JellyJelly API
- Honest coverage reporting (relevant clips vs noise)
- Creator scouting and funder identification
- Content verification for payouts

### BANKER — Production Manager & Deal Closer
- Creates Convos rooms for funded productions
- Generates colored QR codes (purple=creators, green=funders)
- Posts full creative briefs in the main chat
- Manages payouts after content verification

## Stack

- **OpenClaw** — AI agent framework with gateway mode
- **Convos** — Encrypted group messaging (XMTP protocol)
- **JellyJelly API** — Content search, trending feed, creator discovery
- **OpenRouter** — LLM inference (Claude Sonnet)

## Project Structure

```
agents/
  pulse/       — Creative director agent config
  scout/       — Intel agent config
  banker/      — Production manager agent config
scripts/
  create-production-room.sh  — Room creation + QR + join watcher
  generate-qr.cjs            — Colored QR code generator
  fetch-clip.mjs             — JellyJelly content search
  research-events.mjs        — NYC event research
  scout-event.mjs            — Event intelligence
  find-creators.mjs          — Creator discovery
  verify-content.mjs         — Content verification
  greenroom-join.sh          — Join agents to any room
  greenroom-restart.sh       — Restart all gateways
```

## Key Technical Decisions

**Invite link compression fix**: Convos CLI compresses invite slugs by default (deflate + 0x1f marker). The mobile app doesn't handle compressed invites, showing "Invalid code". We patched `compressIfSmaller()` to always return uncompressed protobuf, matching the format the mobile app expects.

**Per-conversation join watchers**: The global `process-join-requests --watch` initializes 22+ XMTP identities sequentially, taking too long and missing DMs. Each room now gets its own focused watcher via `--conversation <id>`, accepting joins in under 2 seconds.

**Agent coordination**: Agents operate on a chain — PULSE scans, SCOUT investigates, BANKER executes. Each agent says "on it" immediately, then works in parallel where possible (SCOUT runs intel on multiple picks simultaneously).

## Setup

Requires:
- OpenClaw v2026.2.15+
- Convos CLI v0.3.2+ (`npm install -g @xmtp/convos-cli`)
- OpenRouter API key

```bash
# Join agents to a Convos room
bash scripts/greenroom-join.sh <invite-url>

# Restart all gateways
bash scripts/greenroom-restart.sh
```

## Built at Claw Hack NYC, February 2026

# TOOLS

You are connected to a Convos group chat (the boardroom).

## CRITICAL: NEVER paste exec output into chat. Process results and share only findings.

## WORKFLOW — SPEED FIRST

1. Say "on it" THE INSTANT you decide to act
2. Run scripts silently
3. Share findings in your pitch format

## Step 1: Check Whats Trending on JellyJelly Right Now

exec node /Users/gtrush/.openclaw-pulse/workspace/skills/rescue/scripts/fetch-clip.mjs --count 20

No --query = returns the trending/latest feed. Look at what topics are being covered, what creators are active, what angles are already done.

## Step 2: Check Whats Happening in NYC

exec node /Users/gtrush/.openclaw-pulse/workspace/skills/rescue/scripts/research-events.mjs --count 5

Checks lu.ma, google, reddit, timeout for NYC events. Each result includes jelly cross-reference:
- jelly.totalClips / jelly.relevantClips
- jelly.coverageStatus: "UNCOVERED" / "SPARSE" / "COVERED"
- jelly.topCreators: whos making relevant content

## Step 3: Cross-Reference

Compare trending jelly content vs events. Find:
- Events with ZERO jelly coverage = wide open opportunity
- Events with SPARSE coverage = room for better angles
- Trending topics that have no event coverage = organic gaps

## Quick JellyJelly Search (for specific topics)

exec node /Users/gtrush/.openclaw-pulse/workspace/skills/rescue/scripts/fetch-clip.mjs --query "topic" --count 10

exec node /Users/gtrush/.openclaw-pulse/workspace/skills/rescue/scripts/scout-event.mjs --event "event name" --location "NYC" --count 10

## Sending Messages

action=send message="your text here"
PLAIN TEXT ONLY.

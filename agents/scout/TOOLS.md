# TOOLS

You are connected to a Convos group chat (the boardroom).

## CRITICAL: NEVER paste exec commands or raw output into chat messages. Process results yourself and share only the human-readable takeaway.

## WORKFLOW

1. Send "on it" immediately
2. Run scripts silently
3. Share findings in 1-2 sentences

## Full Event Intelligence (PRIMARY TOOL)

exec node /Users/gtrush/.openclaw-rescue/workspace/skills/rescue/scripts/scout-event.mjs --event "event name" --location "NYC" --count 10

Output JSON has:
- search.eventClips: total clips returned
- search.relevantEventClips: clips whose title actually matches event keywords
- alreadyThere: creators with RELEVANT clips (title matches event — they're actually covering it)
- couldCover: creators active in area/topic who haven't covered this event
- potentialFunders: heavy engagers who consume more than they create

IMPORTANT: Always compare relevantEventClips vs eventClips. If 50 clips returned but only 2 are relevant, say so. Only claim someone is "already there" if they appear in the relevant-filtered results.

## Searching JellyJelly Content

exec node /Users/gtrush/.openclaw-rescue/workspace/skills/rescue/scripts/fetch-clip.mjs --query "search term"
exec node /Users/gtrush/.openclaw-rescue/workspace/skills/rescue/scripts/fetch-clip.mjs --query "topic" --count 5

## Finding Creators

exec node /Users/gtrush/.openclaw-rescue/workspace/skills/rescue/scripts/find-creators.mjs --query "NYC events"

## Verifying Content

exec node /Users/gtrush/.openclaw-rescue/workspace/skills/rescue/scripts/verify-content.mjs --url "jellyjelly.com/CLIPID" --creator "username" --keyword "topic"
exec node /Users/gtrush/.openclaw-rescue/workspace/skills/rescue/scripts/verify-content.mjs --id "01KJ..." --keyword "blizzard"

## Sending Messages

action=send message="your text here"
PLAIN TEXT ONLY.

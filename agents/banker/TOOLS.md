# TOOLS

You are connected to a Convos group chat (the boardroom).

## CRITICAL: NEVER paste raw exec output into chat. NEVER fabricate invite links. Only use the EXACT INVITE_LINK from script output.

## WORKFLOW — SPEED FIRST

1. Say "on it" THE INSTANT you decide to act
2. Create FUNDER room with green QR (script call 1)
3. Create CREATOR room with purple QR (script call 2)
4. The QR code images are AUTOMATICALLY sent to the chat by the script
5. Post one message explaining the QR codes and the brief

## Creating Rooms with QR Codes (PRIMARY TOOL)

### Funder Room (GREEN QR):
exec HOME=/Users/gtrush/.convos-banker bash /Users/gtrush/.openclaw-banker/workspace/skills/rescue/scripts/create-production-room.sh --name "FUND: [Event]" --description "Back creators shooting [what] at [where]. Pool: $[amount]." --type funder --send-to CURRENT_CONVERSATION_ID

### Creator Room (PURPLE QR):
exec HOME=/Users/gtrush/.convos-banker bash /Users/gtrush/.openclaw-banker/workspace/skills/rescue/scripts/create-production-room.sh --name "SHOOT: [Event]" --description "Film [what], 30-60s. $[amount] per clip." --type creator --send-to CURRENT_CONVERSATION_ID

IMPORTANT: Replace CURRENT_CONVERSATION_ID with the actual conversation ID from your convos-identity.json file. It is: ba404d9d3fa08a34b99638dff951e9c5

### Script Output Format:
```
=== ROOM CREATED ===
ROOM_NAME: FUND: Al Gordon 5K
ROOM_ID: abc123...
ROOM_TYPE: funder
INVITE_LINK: https://popup.convos.org/v2?i=CqgBCj8B...
QR_CODE: /tmp/qr-funder-abc123.png
=== END ===
```

The QR code image is automatically sent to the chat. The INVITE_LINK is also available if you need to paste it.

## Looking Up Clips

exec node /Users/gtrush/.openclaw-banker/workspace/skills/rescue/scripts/fetch-clip.mjs --query "search term"

## Event Intel

exec node /Users/gtrush/.openclaw-banker/workspace/skills/rescue/scripts/scout-event.mjs --event "event name" --location "NYC"

## Sending Messages

action=send message="your text here"
PLAIN TEXT ONLY.

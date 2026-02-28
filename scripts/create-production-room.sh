#!/usr/bin/env bash
# Create a Convos production room, generate colored QR code, and send it.
# Usage: HOME=/Users/gtrush/.convos-banker bash create-production-room.sh \
#   --name "SHOOT: Al Gordon 5K — $50" \
#   --description "Film the race finish line, 30-60s." \
#   --type creator \
#   --send-to ba404d9d3fa08a34b99638dff951e9c5

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
NAME=""
DESCRIPTION=""
ROOM_TYPE="creator"  # creator=purple, funder=green
SEND_TO=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --name) NAME="$2"; shift 2 ;;
    --description) DESCRIPTION="$2"; shift 2 ;;
    --type) ROOM_TYPE="$2"; shift 2 ;;
    --send-to) SEND_TO="$2"; shift 2 ;;
    --timer) shift 2 ;; # accepted but ignored
    *) echo "Unknown arg: $1" >&2; exit 1 ;;
  esac
done

if [[ -z "$NAME" ]]; then
  echo '{"error":"--name is required"}' >&2
  exit 1
fi

# Create conversation — returns JSON with conversationId + invite.url
CREATE_OUT=$(convos conversations create \
  --name "$NAME" \
  --description "${DESCRIPTION:-$NAME}" \
  --profile-name "BANKER" \
  --env production \
  --json 2>/dev/null)

# Extract invite URL and conversation ID
INVITE_URL=$(echo "$CREATE_OUT" | node -e "const d=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8')); console.log(d.invite?.url || 'ERROR_NO_INVITE')")
CONV_ID=$(echo "$CREATE_OUT" | node -e "const d=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8')); console.log(d.conversationId || 'ERROR')")

# Start focused join-request watcher for this specific room
nohup convos conversations process-join-requests \
  --env production \
  --watch \
  --conversation "$CONV_ID" \
  > "/tmp/join-watcher-${CONV_ID}.log" 2>&1 &

# Generate colored QR code (purple for creators, green for funders)
QR_COLOR="purple"
if [[ "$ROOM_TYPE" == "funder" ]] || [[ "$ROOM_TYPE" == "fund" ]]; then
  QR_COLOR="green"
fi
QR_FILE="/tmp/qr-${ROOM_TYPE}-${CONV_ID}.png"
node "$SCRIPT_DIR/generate-qr.cjs" --url "$INVITE_URL" --color "$QR_COLOR" --output "$QR_FILE" 2>/dev/null

# Send QR code to the main chat if --send-to is specified
if [[ -n "$SEND_TO" ]] && [[ -f "$QR_FILE" ]]; then
  convos conversation send-attachment "$SEND_TO" "$QR_FILE" --env production 2>/dev/null || true
fi

# Output in clear, labeled format
echo "=== ROOM CREATED ==="
echo "ROOM_NAME: $NAME"
echo "ROOM_ID: $CONV_ID"
echo "ROOM_TYPE: $ROOM_TYPE"
echo "INVITE_LINK: $INVITE_URL"
echo "QR_CODE: $QR_FILE"
echo "=== END ==="

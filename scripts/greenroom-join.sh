#!/bin/bash
# greenroom-join.sh — Join all 3 GREENROOM agents to a Convos room via invite URL
# Usage: ./greenroom-join.sh <invite-url-or-slug>
#
# This script:
# 1. Joins SCOUT, BANKER, PULSE to the room
# 2. Updates their credentials (convos-identity.json)
# 3. Restarts all gateways pointed at the new room

set -euo pipefail

INVITE="${1:-}"
TIMEOUT="${2:-120}"

if [ -z "$INVITE" ]; then
  echo "Usage: greenroom-join.sh <invite-url-or-slug> [timeout-seconds]"
  echo ""
  echo "Examples:"
  echo "  ./greenroom-join.sh 'https://popup.convos.org/v2?i=CrUC...'"
  echo "  ./greenroom-join.sh CrUCCj8B... 180"
  exit 1
fi

PROFILES=("rescue" "banker" "pulse")
NAMES=("SCOUT" "BANKER" "PULSE")
PORTS=(18789 18790 18791)
TOKENS=("YOUR_RESCUE_TOKEN" "YOUR_BANKER_TOKEN" "YOUR_PULSE_TOKEN")

echo "=== GREENROOM Agent Join ==="
echo "Invite: ${INVITE:0:60}..."
echo "Timeout: ${TIMEOUT}s per agent"
echo ""

# Step 1: Kill existing gateways
echo "[1/4] Stopping running gateways..."
kill $(ps aux | grep 'openclaw-gateway' | grep -v grep | awk '{print $2}') 2>/dev/null || true
sleep 2
echo "  Done."

# Step 2: Join each agent to the room
echo ""
echo "[2/4] Joining agents to room..."

CONV_IDS=()
IDENTITY_IDS=()

for i in "${!PROFILES[@]}"; do
  PROFILE="${PROFILES[$i]}"
  NAME="${NAMES[$i]}"
  CONVOS_HOME="/Users/gtrush/.convos-${PROFILE}"

  echo "  Joining ${NAME} (profile: ${PROFILE})..."

  # Join the room — the --json flag gives us the conv ID and identity ID
  JOIN_RESULT=$(HOME="${CONVOS_HOME}" convos conversations join "${INVITE}" \
    --profile-name "${NAME}" \
    --label "GREENROOM" \
    --env production \
    --timeout "${TIMEOUT}" \
    --json 2>/dev/null) || {
    echo "  WARNING: ${NAME} join timed out or failed. The room creator's app may need to accept."
    echo "  Try with --no-wait and then process join requests separately."

    # Try no-wait as fallback
    JOIN_RESULT=$(HOME="${CONVOS_HOME}" convos conversations join "${INVITE}" \
      --profile-name "${NAME}" \
      --label "GREENROOM" \
      --env production \
      --no-wait \
      --json 2>/dev/null) || {
      echo "  FAILED: Could not join ${NAME}. Skipping."
      CONV_IDS+=("")
      IDENTITY_IDS+=("")
      continue
    }
  }

  # Extract conversation ID and identity ID from JSON result
  CONV_ID=$(echo "$JOIN_RESULT" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('conversationId',''))" 2>/dev/null || echo "")
  IDENT_ID=$(echo "$JOIN_RESULT" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('identityId',''))" 2>/dev/null || echo "")

  if [ -n "$CONV_ID" ] && [ -n "$IDENT_ID" ]; then
    echo "  ${NAME} joined! conv=${CONV_ID:0:12}... identity=${IDENT_ID:0:12}..."
    CONV_IDS+=("$CONV_ID")
    IDENTITY_IDS+=("$IDENT_ID")
  else
    echo "  ${NAME} join returned data but couldn't parse IDs. Raw: ${JOIN_RESULT:0:100}"
    CONV_IDS+=("")
    IDENTITY_IDS+=("")
  fi
done

# Step 3: Update credentials
echo ""
echo "[3/4] Updating agent credentials..."

for i in "${!PROFILES[@]}"; do
  PROFILE="${PROFILES[$i]}"
  NAME="${NAMES[$i]}"
  CONV_ID="${CONV_IDS[$i]}"
  IDENT_ID="${IDENTITY_IDS[$i]}"
  CRED_FILE="/Users/gtrush/.openclaw-${PROFILE}/credentials/convos-identity.json"

  if [ -n "$CONV_ID" ] && [ -n "$IDENT_ID" ]; then
    cat > "$CRED_FILE" <<CRED
{
  "ownerConversationId": "${CONV_ID}",
  "identityId": "${IDENT_ID}",
  "convosHome": "/Users/gtrush/.convos-${PROFILE}"
}
CRED
    echo "  ${NAME}: updated → conv=${CONV_ID:0:12}..."
  else
    echo "  ${NAME}: skipped (no valid join result)"
  fi
done

# Step 4: Clear sessions and restart gateways
echo ""
echo "[4/4] Clearing sessions and restarting gateways..."

for i in "${!PROFILES[@]}"; do
  PROFILE="${PROFILES[$i]}"
  NAME="${NAMES[$i]}"
  PORT="${PORTS[$i]}"

  # Clear stale sessions
  rm -f "/Users/gtrush/.openclaw-${PROFILE}/agents/main/sessions/"* 2>/dev/null || true

  # Start gateway
  nohup openclaw --profile "${PROFILE}" gateway run --force > "/tmp/gateway-${PROFILE}.log" 2>&1 &
  disown
  echo "  ${NAME} gateway started on port ${PORT} (PID $!)"
done

sleep 3

# Verify
echo ""
echo "=== Verification ==="
RUNNING=$(ps aux | grep 'openclaw-gateway' | grep -v grep | wc -l | tr -d ' ')
echo "Gateways running: ${RUNNING}/3"

for PROFILE in "${PROFILES[@]}"; do
  if grep -q "Convos provider started" "/tmp/gateway-${PROFILE}.log" 2>/dev/null; then
    echo "  ${PROFILE}: connected to Convos ✓"
  else
    echo "  ${PROFILE}: waiting for Convos connection..."
  fi
done

echo ""
echo "Done. Agents are live. Say something in the room to test."

#!/bin/bash
# greenroom-restart.sh — Restart all 3 GREENROOM gateways cleanly
set -euo pipefail

echo "Stopping gateways..."
kill $(ps aux | grep 'openclaw-gateway' | grep -v grep | awk '{print $2}') 2>/dev/null || true
sleep 2

echo "Clearing sessions..."
rm -f ~/.openclaw-rescue/agents/main/sessions/* 2>/dev/null || true
rm -f ~/.openclaw-banker/agents/main/sessions/* 2>/dev/null || true
rm -f ~/.openclaw-pulse/agents/main/sessions/* 2>/dev/null || true

echo "Starting gateways..."
nohup openclaw --profile rescue gateway run --force > /tmp/gateway-rescue.log 2>&1 & disown
nohup openclaw --profile banker gateway run --force > /tmp/gateway-banker.log 2>&1 & disown
nohup openclaw --profile pulse gateway run --force > /tmp/gateway-pulse.log 2>&1 & disown

sleep 4

echo ""
echo "Status:"
for p in rescue banker pulse; do
  if grep -q "Convos provider started" /tmp/gateway-${p}.log 2>/dev/null; then
    echo "  ${p}: connected ✓"
  else
    echo "  ${p}: starting..."
  fi
done

echo ""
echo "Running: $(ps aux | grep 'openclaw-gateway' | grep -v grep | wc -l | tr -d ' ')/3 gateways"

# GREENROOM

A group-chat prototype for coordinating a small content-production team with AI agents.

GREENROOM connects a creative brief to research and production-room setup. The application combines agent configuration, messaging integrations and utility scripts; OpenClaw supplies the agent framework and Convos/XMTP supplies messaging.

## Engineering entry points

- [Agent configurations](agents/) define the PULSE, SCOUT and BANKER roles.
- [Content search](scripts/fetch-clip.mjs), [event research](scripts/research-events.mjs) and [creator discovery](scripts/find-creators.mjs) connect the workflow to external information.
- [Room setup](scripts/create-production-room.sh) and [QR generation](scripts/generate-qr.cjs) connect a production brief to a joinable conversation.

The intended flow is:

```text
Brief in group chat → PULSE proposes an angle
                    → SCOUT gathers supporting information
                    → BANKER prepares production rooms and invitations
```

The integration separates role instructions from reusable scripts. Per-conversation join watchers narrow the messaging work to the room being created. External information, creator identity and any proposed payment still need verification.

## Scope and contribution

This repository contains the application integration and agent configurations. It was developed with AI assistance, which is recorded in the commit history. OpenClaw, Convos, XMTP, JellyJelly and OpenRouter are third-party dependencies; the underlying models and messaging protocol are not original work in this repository.

The original project notes describe a Claw Hack NYC build in February 2026. No award, customer adoption or production-performance result is asserted here.

## Inspect and run

Start by reading the agent configurations and scripts. The original environment used macOS, OpenClaw, Convos CLI and an OpenRouter account. The setup scripts contain environment-specific assumptions and can join conversations or start gateways; adapt them to an isolated test environment before running them.

```bash
node --check scripts/scout-event.mjs
node --check scripts/find-creators.mjs
node --check scripts/verify-content.mjs
```

These three JavaScript syntax checks passed on September 7, 2026. They do not exercise the external services.

## Current limitations

This is a prototype, not a verified production service. A fresh end-to-end messaging or payment workflow has not been demonstrated in the September 2026 review. Earlier timing claims are omitted because no reproducible benchmark was available. Agent output is a proposal until independently checked; a generated room or QR code does not establish that a production was funded or delivered.

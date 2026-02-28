#!/usr/bin/env node

// Find JellyJelly creators who make content about a given topic.
// Usage: node find-creators.mjs --query "NYC events" [--count 20]

const API_URL = "https://api.jellyjelly.com/v3/jelly/search";

let query = "";
let count = 20;

for (let i = 2; i < process.argv.length; i++) {
  if (process.argv[i] === "--query" && process.argv[i + 1]) {
    query = process.argv[++i];
  } else if (process.argv[i] === "--count" && process.argv[i + 1]) {
    count = parseInt(process.argv[++i], 10);
  }
}

if (!query) {
  console.error("Usage: node find-creators.mjs --query \"topic\" [--count 20]");
  process.exit(1);
}

async function main() {
  const params = new URLSearchParams({
    query,
    page_size: "50",
    ascending: "false",
  });

  const res = await fetch(`${API_URL}?${params}`);
  if (!res.ok) {
    console.error(`API error: HTTP ${res.status}`);
    process.exit(1);
  }

  const data = await res.json();
  const clips = data.jellies || [];

  if (clips.length === 0) {
    console.log(JSON.stringify({ query, totalClips: 0, creators: [] }));
    return;
  }

  // Group by creator username
  const creatorMap = new Map();
  for (const clip of clips) {
    const starter = clip.participants?.[0];
    if (!starter?.username) continue;

    const key = starter.username;
    if (!creatorMap.has(key)) {
      creatorMap.set(key, {
        username: starter.username,
        fullName: starter.full_name || "",
        pfpUrl: starter.pfp_url || "",
        profileUrl: `https://jellyjelly.com/@${starter.username}`,
        clipCount: 0,
        recentTitle: "",
      });
    }
    const c = creatorMap.get(key);
    c.clipCount++;
    if (!c.recentTitle) {
      c.recentTitle = clip.title || "(untitled)";
    }
  }

  // Sort by clip count descending, take top N
  const creators = [...creatorMap.values()]
    .sort((a, b) => b.clipCount - a.clipCount)
    .slice(0, count);

  console.log(JSON.stringify({
    query,
    totalClips: clips.length,
    creators,
  }));
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});

#!/usr/bin/env node

// Fetch clips from the JellyJelly public API.
// Usage: node fetch-clip.mjs [--page N] [--random] [--query "search term"] [--count N]

const API_URL = "https://api.jellyjelly.com/v3/jelly/search";

// Parse CLI args
let page = 1;
let random = false;
let query = "";
let count = 1;

for (let i = 2; i < process.argv.length; i++) {
  if (process.argv[i] === "--page" && process.argv[i + 1]) {
    page = parseInt(process.argv[++i], 10);
  } else if (process.argv[i] === "--random") {
    random = true;
  } else if (process.argv[i] === "--query" && process.argv[i + 1]) {
    query = process.argv[++i];
  } else if (process.argv[i] === "--count" && process.argv[i + 1]) {
    count = parseInt(process.argv[++i], 10);
  }
}

async function main() {
  const params = new URLSearchParams({
    page: String(page),
    page_size: String(Math.max(count, 10)),
    ascending: "false",
  });
  if (query) params.set("query", query);

  const res = await fetch(`${API_URL}?${params}`);
  if (!res.ok) {
    console.error(`API error: HTTP ${res.status}`);
    process.exit(1);
  }

  const data = await res.json();
  const clips = data.jellies.map((j) => {
    const starter = j.participants?.[0];
    return {
      id: j.id,
      title: j.title || "(untitled)",
      thumbnail: j.thumbnail_url,
      url: `https://jellyjelly.com/${j.id}`,
      creator: starter?.username ?? "unknown",
      creatorName: starter?.full_name ?? "",
      creatorPfp: starter?.pfp_url ?? "",
      creatorProfile: starter?.username ? `https://jellyjelly.com/@${starter.username}` : "",
      postedAt: j.posted_at,
      participantCount: j.participants?.length ?? 0,
    };
  });

  if (clips.length === 0) {
    console.error("No clips found");
    process.exit(1);
  }

  if (count > 1) {
    const result = random
      ? clips.sort(() => Math.random() - 0.5).slice(0, count)
      : clips.slice(0, count);
    console.log(JSON.stringify(result));
  } else {
    if (random) {
      console.log(JSON.stringify(clips[Math.floor(Math.random() * clips.length)]));
    } else {
      console.log(JSON.stringify(clips[0]));
    }
  }
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});

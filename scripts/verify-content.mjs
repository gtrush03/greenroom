#!/usr/bin/env node

// Verify a JellyJelly clip exists and matches a production brief.
// Usage: node verify-content.mjs --url "jellyjelly.com/01KJ..." [--creator "username"] [--keyword "blizzard"]
// Also: node verify-content.mjs --id "01KJJXCAXH5V82DY9FVFZ0BQCZ"

const API_URL = "https://api.jellyjelly.com/v3/jelly";

let clipId = "";
let expectedCreator = "";
let keyword = "";

for (let i = 2; i < process.argv.length; i++) {
  if (process.argv[i] === "--id" && process.argv[i + 1]) {
    clipId = process.argv[++i];
  } else if (process.argv[i] === "--url" && process.argv[i + 1]) {
    // Extract ID from jellyjelly.com/XXXX URL
    const url = process.argv[++i];
    const match = url.match(/jellyjelly\.com\/([A-Z0-9]+)/i);
    if (match) clipId = match[1];
  } else if (process.argv[i] === "--creator" && process.argv[i + 1]) {
    expectedCreator = process.argv[++i].replace("@", "");
  } else if (process.argv[i] === "--keyword" && process.argv[i + 1]) {
    keyword = process.argv[++i].toLowerCase();
  }
}

if (!clipId) {
  console.error("Usage: node verify-content.mjs --id <clipId> or --url <jellyUrl> [--creator username] [--keyword topic]");
  process.exit(1);
}

async function main() {
  // Try search API to find the clip
  const searchRes = await fetch(`https://api.jellyjelly.com/v3/jelly/search?query=${clipId}&page_size=50`);
  if (!searchRes.ok) {
    console.error(`API error: HTTP ${searchRes.status}`);
    process.exit(1);
  }

  const searchData = await searchRes.json();
  const clip = searchData.jellies?.find(j => j.id === clipId);

  if (!clip) {
    console.log(JSON.stringify({
      verified: false,
      reason: "clip not found on JellyJelly",
      clipId,
    }));
    return;
  }

  const creator = clip.participants?.[0];
  const checks = {
    exists: true,
    clipId: clip.id,
    title: clip.title || "(untitled)",
    creator: creator?.username || "unknown",
    creatorName: creator?.full_name || "",
    creatorProfile: creator?.username ? `https://jellyjelly.com/@${creator.username}` : "",
    clipUrl: `https://jellyjelly.com/${clip.id}`,
    postedAt: clip.posted_at,
    thumbnail: clip.thumbnail_url,
    participantCount: clip.participants?.length || 0,
  };

  // Check creator match
  if (expectedCreator) {
    checks.creatorMatch = creator?.username?.toLowerCase() === expectedCreator.toLowerCase();
  }

  // Check keyword in title
  if (keyword) {
    checks.keywordMatch = (clip.title || "").toLowerCase().includes(keyword);
  }

  // Overall verification
  checks.verified = checks.exists
    && (!expectedCreator || checks.creatorMatch)
    && (!keyword || checks.keywordMatch);

  console.log(JSON.stringify(checks));
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});

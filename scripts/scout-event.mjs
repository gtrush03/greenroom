#!/usr/bin/env node

// Full event intelligence: find JellyJelly creators already at/near an event,
// creators who could cover it, and potential funders (prolific tippers/engagers).
// Usage: node scout-event.mjs --event "Mistral Hackathon" [--location "Brooklyn"] [--count 10]

const API_URL = "https://api.jellyjelly.com/v3/jelly/search";

let event = "";
let location = "";
let count = 10;

for (let i = 2; i < process.argv.length; i++) {
  if (process.argv[i] === "--event" && process.argv[i + 1]) {
    event = process.argv[++i];
  } else if (process.argv[i] === "--location" && process.argv[i + 1]) {
    location = process.argv[++i];
  } else if (process.argv[i] === "--count" && process.argv[i + 1]) {
    count = parseInt(process.argv[++i], 10);
  }
}

if (!event) {
  console.error("Usage: node scout-event.mjs --event \"event name\" [--location \"area\"] [--count 10]");
  process.exit(1);
}

async function searchJelly(query) {
  const params = new URLSearchParams({ query, page_size: "50", ascending: "false" });
  const res = await fetch(`${API_URL}?${params}`);
  if (!res.ok) return [];
  const data = await res.json();
  return data.jellies || [];
}

function filterByRelevance(clips, eventName) {
  const keywords = eventName.toLowerCase().split(/\s+/).filter(w => w.length > 3);
  if (keywords.length === 0) return clips;
  return clips.filter(clip => {
    const title = (clip.title || "").toLowerCase();
    return keywords.some(kw => title.includes(kw));
  });
}

function extractCreators(clips) {
  const map = new Map();
  for (const clip of clips) {
    const p = clip.participants?.[0];
    if (!p?.username) continue;
    if (!map.has(p.username)) {
      map.set(p.username, {
        username: p.username,
        fullName: p.full_name || "",
        pfpUrl: p.pfp_url || "",
        profileUrl: `https://jellyjelly.com/@${p.username}`,
        clips: [],
        clipCount: 0,
        participantAppearances: 0,
      });
    }
    const c = map.get(p.username);
    c.clipCount++;
    c.clips.push({
      id: clip.id,
      title: clip.title || "(untitled)",
      url: `https://jellyjelly.com/${clip.id}`,
      postedAt: clip.posted_at,
      participantCount: clip.participants?.length || 0,
    });
  }
  // Count how many times they appear as participants (not just starters) — engagement signal
  for (const clip of clips) {
    for (const p of clip.participants || []) {
      if (p.username && map.has(p.username)) {
        map.get(p.username).participantAppearances++;
      }
    }
  }
  return [...map.values()].sort((a, b) => b.clipCount - a.clipCount);
}

async function main() {
  // Search 1: Direct event match — creators already covering this event
  const eventClips = await searchJelly(event);

  // Search 2: Location match — creators active in the area
  const locationClips = location ? await searchJelly(location) : [];

  // Search 3: Broader topic — creators who do similar content
  const keywords = event.split(/\s+/).filter(w => w.length > 3);
  const topicClips = keywords.length > 0 ? await searchJelly(keywords[0]) : [];

  // Relevance filter: only clips whose title actually mentions event keywords
  const relevantEventClips = filterByRelevance(eventClips, event);

  // Categorize creators
  const relevantEventCreators = extractCreators(relevantEventClips);
  const eventCreators = extractCreators(eventClips);
  const locationCreators = extractCreators(locationClips);
  const topicCreators = extractCreators(topicClips);

  // Find "already there" — only from RELEVANT clips (title must match keywords)
  const alreadyThere = relevantEventCreators.slice(0, count);

  // Find "could cover" — active in the area or topic but haven't covered this event
  const alreadyNames = new Set(alreadyThere.map(c => c.username));
  const couldCover = [...locationCreators, ...topicCreators]
    .filter(c => !alreadyNames.has(c.username))
    .slice(0, count);

  // Find "potential funders" — people who participate a lot (join others' jellys = engaged audience)
  // High participantAppearances relative to clipCount = more consumer than creator = potential funder
  const allCreators = [...eventCreators, ...locationCreators, ...topicCreators];
  const uniqueFunders = new Map();
  for (const c of allCreators) {
    if (!uniqueFunders.has(c.username)) {
      uniqueFunders.set(c.username, c);
    } else {
      const existing = uniqueFunders.get(c.username);
      existing.participantAppearances += c.participantAppearances;
    }
  }
  const funders = [...uniqueFunders.values()]
    .filter(c => c.participantAppearances > c.clipCount) // more watching than creating
    .sort((a, b) => b.participantAppearances - a.participantAppearances)
    .slice(0, count);

  console.log(JSON.stringify({
    event,
    location: location || null,
    search: {
      eventClips: eventClips.length,
      relevantEventClips: relevantEventClips.length,
      locationClips: locationClips.length,
      topicClips: topicClips.length,
    },
    alreadyThere: alreadyThere.map(c => ({
      username: c.username,
      fullName: c.fullName,
      profileUrl: c.profileUrl,
      clipCount: c.clipCount,
      recentClip: c.clips[0]?.title || "",
      recentClipUrl: c.clips[0]?.url || "",
    })),
    couldCover: couldCover.map(c => ({
      username: c.username,
      fullName: c.fullName,
      profileUrl: c.profileUrl,
      clipCount: c.clipCount,
      recentClip: c.clips[0]?.title || "",
    })),
    potentialFunders: funders.map(c => ({
      username: c.username,
      fullName: c.fullName,
      profileUrl: c.profileUrl,
      engagementScore: c.participantAppearances,
      ownClips: c.clipCount,
    })),
  }));
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});

#!/usr/bin/env node

// Research NYC events from multiple sources, then cross-reference each with JellyJelly.
// Returns structured intel: what's happening + what's on jelly + what's missing.
// Usage: node research-events.mjs [--count 3]

const JELLY_API = "https://api.jellyjelly.com/v3/jelly/search";

let maxEvents = 3;
for (let i = 2; i < process.argv.length; i++) {
  if (process.argv[i] === "--count" && process.argv[i + 1]) {
    maxEvents = parseInt(process.argv[++i], 10);
  }
}

async function fetchSafe(url, opts = {}) {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)" },
      signal: AbortSignal.timeout(10000),
      ...opts,
    });
    if (!res.ok) return null;
    const ct = res.headers.get("content-type") || "";
    if (ct.includes("json")) return { type: "json", data: await res.json() };
    return { type: "text", data: await res.text() };
  } catch {
    return null;
  }
}

async function searchJelly(query) {
  try {
    const params = new URLSearchParams({ query, page_size: "30", ascending: "false" });
    const res = await fetch(`${JELLY_API}?${params}`, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return [];
    const data = await res.json();
    return data.jellies || [];
  } catch {
    return [];
  }
}

function filterRelevant(clips, eventName) {
  const keywords = eventName.toLowerCase().split(/\s+/).filter(w => w.length > 3);
  if (!keywords.length) return clips;
  return clips.filter(c => {
    const t = (c.title || "").toLowerCase();
    return keywords.some(kw => t.includes(kw));
  });
}

function extractCreatorSummary(clips) {
  const map = new Map();
  for (const clip of clips) {
    const p = clip.participants?.[0];
    if (!p?.username) continue;
    if (!map.has(p.username)) {
      map.set(p.username, { username: p.username, clipCount: 0, recentTitle: "" });
    }
    const c = map.get(p.username);
    c.clipCount++;
    if (!c.recentTitle) c.recentTitle = clip.title || "";
  }
  return [...map.values()].sort((a, b) => b.clipCount - a.clipCount).slice(0, 5);
}

// Extract events from lu.ma HTML
function parseLumaEvents(html) {
  const events = [];
  // Look for event titles and details in the HTML
  const titleMatches = html.match(/(?:class="[^"]*event[^"]*"[^>]*>|<h[23][^>]*>)(.*?)<\//gi) || [];
  // Also try JSON-LD or structured data
  const jsonLdMatch = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi) || [];
  for (const m of jsonLdMatch) {
    try {
      const json = JSON.parse(m.replace(/<[^>]+>/g, ""));
      if (json.name) events.push({ name: json.name, location: json.location?.name || "NYC", source: "luma" });
    } catch {}
  }
  // Fallback: extract text patterns that look like event names
  const lines = html.replace(/<[^>]+>/g, "\n").split("\n").map(l => l.trim()).filter(l => l.length > 10 && l.length < 120);
  const seen = new Set();
  for (const line of lines) {
    if (/today|tonight|now|this evening|happening/i.test(line) && !seen.has(line.toLowerCase())) {
      seen.add(line.toLowerCase());
      events.push({ name: line, source: "luma-text" });
    }
  }
  return events.slice(0, 10);
}

// Extract from Google search results
function parseGoogleResults(html) {
  const events = [];
  const snippets = html.match(/<span[^>]*>(.*?)<\/span>/gi) || [];
  const texts = snippets.map(s => s.replace(/<[^>]+>/g, "").trim()).filter(t => t.length > 15 && t.length < 150);
  const seen = new Set();
  for (const t of texts) {
    if (/NYC|new york|manhattan|brooklyn/i.test(t) && !seen.has(t.toLowerCase())) {
      seen.add(t.toLowerCase());
      events.push({ name: t, source: "google" });
    }
  }
  return events.slice(0, 10);
}

// Extract from Reddit
function parseRedditPosts(json) {
  const events = [];
  const posts = json?.data?.children || [];
  for (const p of posts.slice(0, 15)) {
    const d = p.data;
    if (d?.title) {
      events.push({ name: d.title, source: "reddit", score: d.score || 0 });
    }
  }
  return events;
}

async function main() {
  // Fetch from multiple sources in parallel — errors are silently caught
  const [luma, google, reddit, timeout] = await Promise.all([
    fetchSafe("https://lu.ma/nyc"),
    fetchSafe("https://www.google.com/search?q=NYC+events+today+happening+now+February+2026"),
    fetchSafe("https://www.reddit.com/r/nyc/hot.json"),
    fetchSafe("https://www.timeout.com/newyork/things-to-do/things-to-do-in-nyc-today"),
  ]);

  // Parse events from each source
  let allEvents = [];
  if (luma?.type === "text") allEvents.push(...parseLumaEvents(luma.data));
  if (google?.type === "text") allEvents.push(...parseGoogleResults(google.data));
  if (reddit?.type === "json") allEvents.push(...parseRedditPosts(reddit.data));
  if (timeout?.type === "text") allEvents.push(...parseLumaEvents(timeout.data)); // reuse HTML parser

  // Deduplicate and pick top events
  const uniqueEvents = [];
  const seen = new Set();
  for (const e of allEvents) {
    const key = e.name.toLowerCase().slice(0, 30);
    if (!seen.has(key)) {
      seen.add(key);
      uniqueEvents.push(e);
    }
  }
  const topEvents = uniqueEvents.slice(0, maxEvents);

  // Cross-reference each event with JellyJelly
  const results = [];
  for (const event of topEvents) {
    const clips = await searchJelly(event.name);
    const relevant = filterRelevant(clips, event.name);
    const creators = extractCreatorSummary(relevant);
    results.push({
      event: event.name,
      source: event.source,
      jelly: {
        totalClips: clips.length,
        relevantClips: relevant.length,
        topCreators: creators,
        coverageStatus: relevant.length === 0 ? "UNCOVERED" : relevant.length < 3 ? "SPARSE" : "COVERED",
      },
    });
  }

  // Summary
  const sourcesChecked = [
    luma ? "luma" : null,
    google ? "google" : null,
    reddit ? "reddit" : null,
    timeout ? "timeout" : null,
  ].filter(Boolean);

  console.log(JSON.stringify({
    sourcesChecked,
    eventsFound: uniqueEvents.length,
    topEvents: results,
  }));
}

main().catch(() => {
  console.log(JSON.stringify({ error: "research failed", topEvents: [] }));
});

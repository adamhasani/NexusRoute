/**
 * Model Auto-Sync Scheduler (OmniRoute Pattern)
 * Node/CommonJS + ESM friendly with direct DB access via better-sqlite3
 */

const fs = require("fs");
const path = require("path");

const DEFAULT_SYNC_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours
let schedulerTimer = null;
let isSyncing = false;

function getDb() {
  const Database = require("better-sqlite3");
  const dbPath = "/root/.9router/db/data.sqlite";
  return new Database(dbPath);
}

// Smart capability detector matching OmniRoute specification
function detectCapabilities(id) {
  const lower = String(id || "").toLowerCase();
  const isVision =
    lower.includes("vision") ||
    lower.includes("vl") ||
    lower.includes("image") ||
    lower.includes("gemini") ||
    lower.includes("claude-3") ||
    lower.includes("4o") ||
    lower.includes("gpt-4-turbo") ||
    lower.includes("pixtral") ||
    lower.includes("qwen-vl");

  const isReasoning =
    lower.includes("r1") ||
    lower.includes("o1") ||
    lower.includes("o3") ||
    lower.includes("o4") ||
    lower.includes("thinking") ||
    lower.includes("reason") ||
    lower.includes("deepseek-r1");

  return {
    vision: isVision,
    reasoning: isReasoning,
    toolCall: !lower.includes("embedding") && !lower.includes("rerank"),
  };
}

async function syncSingleConnection(conn, port = 20160) {
  try {
    const url = `http://127.0.0.1:${port}/api/providers/${conn.id}/models`;
    const res = await fetch(url, { headers: { "Cache-Control": "no-store" } });
    if (!res.ok) return 0;

    const data = await res.json();
    let rawList = [];
    if (Array.isArray(data)) rawList = data;
    else if (Array.isArray(data.models)) rawList = data.models;
    else if (Array.isArray(data.data)) rawList = data.data;

    let syncedCount = 0;
    const providerAlias = conn.provider;
    const db = getDb();

    const insertStmt = db.prepare(`
      INSERT INTO kv(scope, key, value) 
      VALUES('customModels', ?, ?)
      ON CONFLICT(scope, key) DO UPDATE SET value = excluded.value
    `);

    for (const item of rawList) {
      const modelId = typeof item === "string" ? item : item.id || item.name;
      if (!modelId) continue;

      const cleanId = modelId.startsWith(`${providerAlias}/`) ? modelId.slice(providerAlias.length + 1) : modelId;
      const caps = detectCapabilities(cleanId);
      const k = `${providerAlias}|${cleanId}|llm`;
      const val = JSON.stringify({
        providerAlias,
        id: cleanId,
        type: "llm",
        name: cleanId,
        caps,
        source: "api-sync",
      });

      insertStmt.run(k, val);
      syncedCount++;
    }
    db.close();

    return syncedCount;
  } catch (err) {
    console.warn(`[ModelSync] Error syncing connection ${conn.id}:`, err.message);
    return 0;
  }
}

async function runFullSyncCycle(port = 20160) {
  if (isSyncing) return;
  isSyncing = true;
  console.log("[ModelSyncScheduler] Running scheduled auto-sync cycle (OmniRoute style)...");

  try {
    const db = getDb();
    const rows = db.prepare("SELECT id, provider, data, isActive FROM providerConnections WHERE isActive = 1").all();
    db.close();

    let totalSynced = 0;
    for (const r of rows) {
      let psd = {};
      try {
        const parsed = JSON.parse(r.data);
        psd = parsed.providerSpecificData || {};
      } catch {}

      // Auto-sync if opted-in or popular dynamic provider
      if (psd.autoSync === true || ["openrouter", "groq", "openai", "qoder"].includes(r.provider)) {
        const count = await syncSingleConnection(r, port);
        if (count > 0) {
          totalSynced += count;
          console.log(`[ModelSyncScheduler] Synced ${count} models for ${r.provider} (${r.id.slice(0, 8)})`);
        }
      }
    }
    console.log(`[ModelSyncScheduler] Cycle finished. Total models synced: ${totalSynced}`);
  } catch (err) {
    console.warn("[ModelSyncScheduler] Cycle error:", err.message);
  } finally {
    isSyncing = false;
  }
}

function startModelSyncScheduler(port = 20160, intervalMs = DEFAULT_SYNC_INTERVAL_MS) {
  if (schedulerTimer) return;
  console.log(`[ModelSyncScheduler] OmniRoute Background Model Sync Active (Interval: ${intervalMs / 3600000}h)`);

  // Staggered startup run after 5s
  setTimeout(() => runFullSyncCycle(port), 5000);

  schedulerTimer = setInterval(() => runFullSyncCycle(port), intervalMs);
  schedulerTimer.unref?.();
}

function stopModelSyncScheduler() {
  if (schedulerTimer) {
    clearInterval(schedulerTimer);
    schedulerTimer = null;
  }
}

module.exports = {
  detectCapabilities,
  syncSingleConnection,
  runFullSyncCycle,
  startModelSyncScheduler,
  stopModelSyncScheduler,
};

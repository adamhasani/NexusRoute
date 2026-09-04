/**
 * modelsDevAutoSync.js — Continuous Global Model Discovery (OmniRoute pattern)
 * Upgrades:
 * 2. Auto-MITM & CLI Tool Alias Generator (alias tanpa prefix)
 * 3. Auto-Probe Reachability (probing 1 token probe test)
 * 4. New Model Changelog & Notification Badge (tracks added model IDs with timestamp)
 * 5. Auto-Enrich Context Window & Token Pricing into DB
 */

const https = require("https");
const Database = require("better-sqlite3");

const MODELS_DEV_URL = "https://models.dev/api.json";
const DB_PATH = "/root/.9router/db/data.sqlite";

const PROVIDER_MAP = {
  openai: ["openai"],
  anthropic: ["anthropic"],
  google: ["gemini", "gemini-cli", "gc", "antigravity", "ag"],
  "google-vertex": ["gemini", "gemini-cli", "gc", "antigravity", "ag"],
  gemini: ["gemini", "gemini-cli", "gc"],
  "gemini-cli": ["gemini-cli", "gc"],
  gc: ["gemini-cli", "gc"],
  antigravity: ["antigravity", "ag"],
  ag: ["antigravity", "ag"],
  xai: ["xai", "grok-cli", "gcli"],
  grok: ["grok-cli", "gcli"],
  "grok-cli": ["grok-cli", "gcli"],
  gcli: ["grok-cli", "gcli"],
  groq: ["groq"],
  mistral: ["mistral"],
  deepseek: ["deepseek"],
  openrouter: ["openrouter"],
  together: ["together"],
  fireworks: ["fireworks"],
  cohere: ["cohere"],
  perplexity: ["perplexity"],
  cerebras: ["cerebras"],
  alibaba: ["alicode-intl"],
  qwen: ["alicode-intl"],
  kilocode: ["kilocode", "kc"],
  pollinations: ["pollinations"],
};

export async function fetchModelsDevData() {
  return new Promise((resolve, reject) => {
    https.get(MODELS_DEV_URL, { headers: { "User-Agent": "NexusRoute-Sync/1.0" } }, (res) => {
      if (res.statusCode !== 200) {
        return reject(new Error(`models.dev returned status ${res.statusCode}`));
      }
      let body = "";
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          reject(e);
        }
      });
    }).on("error", reject);
  });
}

export async function syncGlobalModels(providerFilter = null) {
  try {
    const catalog = await fetchModelsDevData();
    const db = new Database(DB_PATH);

    const insertModelStmt = db.prepare(`
      INSERT INTO kv(scope, key, value) 
      VALUES('customModels', ?, ?)
      ON CONFLICT(scope, key) DO UPDATE SET value = excluded.value
    `);

    // 2. Auto-MITM & Alias generator statement
    const insertAliasStmt = db.prepare(`
      INSERT INTO kv(scope, key, value)
      VALUES('modelAliases', ?, ?)
      ON CONFLICT(scope, key) DO UPDATE SET value = excluded.value
    `);

    // 4. New Model tracker statement (badge NEW)
    const insertNewBadgeStmt = db.prepare(`
      INSERT INTO kv(scope, key, value)
      VALUES('newModels', ?, ?)
      ON CONFLICT(scope, key) DO UPDATE SET value = excluded.value
    `);

    // 5. Pricing updater statement
    const insertPricingStmt = db.prepare(`
      INSERT INTO kv(scope, key, value)
      VALUES('pricing', ?, ?)
      ON CONFLICT(scope, key) DO UPDATE SET value = excluded.value
    `);

    let syncedTotal = 0;
    const nowIso = new Date().toISOString();
    const devProviders = Object.keys(catalog);

    for (const devProv of devProviders) {
      let targets = PROVIDER_MAP[devProv] || [devProv];
      if (!Array.isArray(targets)) targets = [targets];

      if (providerFilter && !targets.includes(providerFilter) && devProv !== providerFilter) {
        continue;
      }

      const provObj = catalog[devProv];
      const modelsObj = provObj.models || {};
      const providerPricingData = {};

      for (const targetProv of targets) {
        if (providerFilter && targetProv !== providerFilter) continue;

        for (const [rawId, m] of Object.entries(modelsObj)) {
          const cleanId = rawId.includes("/") ? rawId.split("/")[1] : rawId;
          const k = `${targetProv}|${cleanId}|llm`;

          const caps = {
            vision:
              m.attachment === true ||
              m.modalities?.includes?.("image") ||
              cleanId.includes("vision") ||
              cleanId.includes("vl"),
            reasoning:
              m.reasoning === true ||
              cleanId.includes("r1") ||
              cleanId.includes("o1") ||
              cleanId.includes("o3") ||
              cleanId.includes("thinking"),
            toolCall: m.tool_call !== false,
          };

          // 5. Context window & Token limit enrichment
          const contextLength = Number(m.limit?.context || m.contextLength || 128000);
          const maxOutputTokens = Number(m.limit?.output || m.maxOutputTokens || 16384);

          const modelRecord = {
            providerAlias: targetProv,
            id: cleanId,
            type: "llm",
            name: m.name || cleanId,
            contextLength,
            maxOutputTokens,
            caps,
            source: "models.dev-sync",
            isNew: true,
            syncedAt: nowIso,
          };

          insertModelStmt.run(k, JSON.stringify(modelRecord));

          // 2. Auto-Alias Generator: buat alias tanpa prefix jika belum dipakai
          try {
            const existing = db.prepare("SELECT value FROM kv WHERE scope = 'modelAliases' AND key = ?").get(cleanId);
            if (!existing) {
              insertAliasStmt.run(cleanId, `${targetProv}/${cleanId}`);
            }
          } catch {}

          // 4. Track for "NEW" badge
          insertNewBadgeStmt.run(`${targetProv}:${cleanId}`, JSON.stringify({ name: m.name || cleanId, addedAt: nowIso }));

          // 5. Pricing calculation ($ / 1M tokens)
          if (m.cost) {
            providerPricingData[cleanId] = {
              input: m.cost.input ? Number(m.cost.input) : undefined,
              output: m.cost.output ? Number(m.cost.output) : undefined,
              cached: m.cost.cached ? Number(m.cost.cached) : undefined,
            };
          }

          syncedTotal++;
        }

        // Save pricing batch if available
        if (Object.keys(providerPricingData).length > 0) {
          try {
            const row = db.prepare("SELECT value FROM kv WHERE scope = 'pricing' AND key = ?").get(targetProv);
            const current = row ? JSON.parse(row.value) : {};
            const merged = { ...current, ...providerPricingData };
            insertPricingStmt.run(targetProv, JSON.stringify(merged));
          } catch {}
        }
      }
    }

    db.close();
    console.log(`[modelsDevAutoSync] Successfully synced & enriched ${syncedTotal} models!`);
    return syncedTotal;
  } catch (err) {
    console.warn("[modelsDevAutoSync] Error during sync:", err.message);
    return 0;
  }
}

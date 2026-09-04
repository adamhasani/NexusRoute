"use client";

import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { Button, Modal, Toggle, Badge } from "@/shared/components";

function detectModelCapabilities(id) {
  const lower = id.toLowerCase();
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

export default function ImportModelsModal({
  isOpen,
  providerId,
  providerAlias,
  connections,
  onImported,
  onClose,
}) {
  const [modelText, setModelText] = useState("");
  const [fetchingRemote, setFetchingRemote] = useState(false);
  const [fetchingGlobal, setFetchingGlobal] = useState(false);
  const [fetchError, setFetchError] = useState("");
  const [fetchSuccess, setFetchSuccess] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveResult, setSaveResult] = useState(null);

  // Upgrade 2: Auto-create Alias toggle
  const [createAliases, setCreateAliases] = useState(true);

  // Upgrade 3: Auto-Probe Reachability toggle
  const [probeReachability, setProbeReachability] = useState(false);
  const [probeStatus, setProbeStatus] = useState({}); // { [id]: "testing" | "ok" | "failed" }

  useEffect(() => {
    if (isOpen) {
      setModelText("");
      setFetchError("");
      setFetchSuccess("");
      setSaveResult(null);
      setProbeStatus({});
    }
  }, [isOpen]);

  const stripAlias = (id) => {
    if (!id || typeof id !== "string") return "";
    const prefix = `${providerAlias}/`;
    return id.startsWith(prefix) ? id.slice(prefix.length) : id;
  };

  // 1. Tarik dari Akun API Aktif
  const handleFetchRemote = async () => {
    setFetchingRemote(true);
    setFetchError("");
    setFetchSuccess("");

    try {
      const activeConn = connections.find((c) => c.isActive !== false);
      let res;
      
      if (activeConn?.id) {
        res = await fetch(`/api/providers/${activeConn.id}/models`, { cache: "no-store" });
      } else {
        res = await fetch(`/api/providers/suggested-models?type=${providerId === "openrouter" ? "openrouter-free" : "openai"}&url=${encodeURIComponent(`https://openrouter.ai/api/v1/models`)}`);
        if (!res.ok) {
          res = await fetch(`/api/models/catalog-sync`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ provider: providerAlias }),
          });
        }
      }

      const data = await res.json();
      let list = [];
      if (Array.isArray(data)) list = data;
      else if (Array.isArray(data.models)) list = data.models;
      else if (Array.isArray(data.data)) list = data.data;

      const extracted = list
        .map((m) => (typeof m === "string" ? m : m.id || m.name || m.model))
        .filter(Boolean)
        .map(stripAlias);

      if (extracted.length === 0) {
        const syncRes = await fetch(`/api/models/catalog-sync`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ provider: providerAlias }),
        });
        const syncData = await syncRes.json();
        if (syncData.syncedCount > 0) {
          setFetchSuccess(`Berhasil sinkronisasi ${syncData.syncedCount} model resmi dari upstream!`);
          setTimeout(async () => {
            await onImported();
            onClose();
          }, 1200);
          return;
        }
        setFetchError("Provider tidak memiliki katalog publik. Hubungkan akun/API key terlebih dahulu.");
      } else {
        const currentList = modelText.split("\n").map((s) => s.trim()).filter(Boolean);
        const merged = Array.from(new Set([...currentList, ...extracted]));
        setModelText(merged.join("\n"));
        setFetchSuccess(`Berhasil menarik ${extracted.length} model langsung dari provider!`);

        if (activeConn?.id) {
          await fetch(`/api/providers/${activeConn.id}/sync-models`, { method: "POST" });
        }
      }
    } catch (err) {
      setFetchError(err.message);
    } finally {
      setFetchingRemote(false);
    }
  };

  // 2. Tarik Otomatis dari Global Registry (models.dev)
  const handleFetchGlobal = async () => {
    setFetchingGlobal(true);
    setFetchError("");
    setFetchSuccess("");
    try {
      const res = await fetch("/api/models/catalog-sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: providerAlias }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal sinkronisasi global catalog.");

      setFetchSuccess(`Berhasil sinkronisasi & enrich ${data.syncedCount || 0} model resmi (termasuk harga & limit)!`);
      setTimeout(async () => {
        await onImported();
        onClose();
      }, 1200);
    } catch (err) {
      setFetchError(err.message);
    } finally {
      setFetchingGlobal(false);
    }
  };

  const parsedModels = modelText
    .split(/[\n,]/)
    .map((s) => stripAlias(s.trim()))
    .filter(Boolean);

  // Upgrade 3: Auto-Probe ping test
  const probeModel = async (cleanId) => {
    try {
      const res = await fetch("/api/models/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: `${providerAlias}/${cleanId}` }),
      });
      const data = await res.json();
      return data.ok ? "ok" : "failed";
    } catch {
      return "failed";
    }
  };

  // Save with Auto-Alias & Probe
  const handleSaveAll = async () => {
    if (parsedModels.length === 0) return;
    setSaving(true);
    setFetchError("");

    let successCount = 0;
    for (const cleanId of parsedModels) {
      let isLive = true;
      if (probeReachability) {
        setProbeStatus((prev) => ({ ...prev, [cleanId]: "testing" }));
        const status = await probeModel(cleanId);
        setProbeStatus((prev) => ({ ...prev, [cleanId]: status }));
        if (status === "failed") isLive = false;
      }

      const caps = detectModelCapabilities(cleanId);
      try {
        const res = await fetch("/api/models/custom", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            providerAlias: providerAlias,
            id: cleanId,
            type: "llm",
            name: cleanId,
            caps: caps,
          }),
        });

        if (res.ok) {
          successCount++;

          // Upgrade 2: Create alias
          if (createAliases) {
            try {
              await fetch("/api/models/alias", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ model: `${providerAlias}/${cleanId}`, alias: cleanId }),
              });
            } catch {}
          }
        }
      } catch {}
    }

    setSaving(false);
    setSaveResult(`Sukses mengimpor ${successCount} model dengan kapabilitas & alias otomatis!`);
    setTimeout(async () => {
      await onImported();
      onClose();
    }, 1200);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Sinkronisasi & Import Model Cerdas">
      <div className="flex flex-col gap-4">
        <p className="text-xs text-text-muted leading-relaxed">
          Tarik otomatis katalog model terbaru dari <strong>Global Registry (models.dev)</strong> atau dari API remote akun kamu.
        </p>

        {/* Dual Quick Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 border-b border-border pb-3">
          <Button
            size="sm"
            variant="primary"
            icon={fetchingGlobal ? "progress_activity" : "public"}
            onClick={handleFetchGlobal}
            disabled={fetchingGlobal || fetchingRemote}
          >
            {fetchingGlobal ? "Menyinkronkan..." : "Update Otomatis (Global Catalog)"}
          </Button>
          <Button
            size="sm"
            variant="secondary"
            icon={fetchingRemote ? "progress_activity" : "sync"}
            onClick={handleFetchRemote}
            disabled={fetchingRemote || fetchingGlobal}
          >
            {fetchingRemote ? "Menghubungi API..." : "Tarik dari Akun API"}
          </Button>
        </div>

        {/* Upgrade Toggles: Alias & Probe */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-surface-2/40 p-2.5 rounded-lg border border-border">
          <Toggle
            size="sm"
            checked={createAliases}
            onChange={setCreateAliases}
            label="Auto-Alias CLI / MITM"
            description="Buat shortcut tanpa prefix (misal: gpt-4o)"
          />
          <Toggle
            size="sm"
            checked={probeReachability}
            onChange={setProbeReachability}
            label="Probe Reachability"
            description="Ping 1 token ke model sebelum disimpan"
          />
        </div>

        {fetchSuccess && (
          <div className="rounded-lg bg-emerald-500/10 p-2 text-xs text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            {fetchSuccess}
          </div>
        )}

        {fetchError && (
          <div className="rounded-lg bg-amber-500/10 p-2 text-xs text-amber-600 dark:text-amber-400 border border-amber-500/20">
            {fetchError}
          </div>
        )}

        {/* Custom Input */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-medium text-text-muted">
              Daftar Model ({parsedModels.length} terdeteksi):
            </label>
            <span className="text-[11px] text-text-muted">1 baris = 1 model</span>
          </div>
          <textarea
            rows={5}
            value={modelText}
            onChange={(e) => setModelText(e.target.value)}
            placeholder={"gpt-4.5-preview\nclaude-3-7-sonnet-20250219\ngemini-2.5-flash\ndeepseek-reasoner"}
            className="w-full font-mono text-xs p-2.5 border border-border rounded-lg bg-background focus:outline-none focus:border-primary"
          />
        </div>

        {/* Realtime Detection Preview */}
        {parsedModels.length > 0 && (
          <div className="rounded-lg border border-border bg-sidebar/40 p-2.5 max-h-28 overflow-y-auto">
            <p className="text-[11px] font-medium text-text-muted mb-1.5">
              Pratinjau Deteksi Kapabilitas & Status Probe:
            </p>
            <div className="flex flex-col gap-1.5">
              {parsedModels.slice(0, 4).map((m) => {
                const caps = detectModelCapabilities(m);
                const probe = probeStatus[m];
                return (
                  <div key={m} className="flex items-center justify-between text-xs font-mono">
                    <span className="truncate max-w-[200px] text-text-main">{m}</span>
                    <div className="flex items-center gap-1 shrink-0">
                      {probe && (
                        <span className={`px-1.5 py-0.5 rounded text-[10px] ${probe === "ok" ? "bg-emerald-500/20 text-emerald-600" : probe === "testing" ? "bg-amber-500/20 text-amber-600" : "bg-rose-500/20 text-rose-600"}`}>
                          {probe.toUpperCase()}
                        </span>
                      )}
                      {caps.vision && (
                        <span className="px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-500 text-[10px]">
                          Vision
                        </span>
                      )}
                      {caps.reasoning && (
                        <span className="px-1.5 py-0.5 rounded bg-purple-500/15 text-purple-500 text-[10px]">
                          Reasoning
                        </span>
                      )}
                      <span className="px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-500 text-[10px]">
                        Tools
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {saveResult && (
          <div className="rounded-lg bg-success/15 p-2 text-xs text-success border border-success/30 font-medium">
            {saveResult}
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-2 pt-1">
          <Button onClick={onClose} variant="ghost" fullWidth size="sm">
            Batal
          </Button>
          <Button
            onClick={handleSaveAll}
            fullWidth
            size="sm"
            disabled={parsedModels.length === 0 || saving}
            icon={saving ? "progress_activity" : "save"}
          >
            {saving ? "Memproses..." : `Import ${parsedModels.length} Model`}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

ImportModelsModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  providerId: PropTypes.string.isRequired,
  providerAlias: PropTypes.string.isRequired,
  connections: PropTypes.array.isRequired,
  onImported: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
};

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Card, Button, Input, Modal, Toggle, PageHeader, Badge, ConfirmModal } from "@/shared/components";
import { useCopyToClipboard } from "@/shared/hooks/useCopyToClipboard";
import { getCurrentLocale, onLocaleChange } from "@/i18n/runtime";


export default function TokenSaverClient() {
  const [rtkEnabled, setRtkEnabledState] = useState(true);
  const [headroomEnabled, setHeadroomEnabled] = useState(false);
  const [headroomUrl, setHeadroomUrl] = useState("http://localhost:8787");
  const [headroomTimeoutMs, setHeadroomTimeoutMs] = useState(3000);
  const [headroomStatus, setHeadroomStatus] = useState({
    installed: false,
    running: false,
    version: null,
    python: null,
    loading: true,
  });
  const [headroomModalOpen, setHeadroomModalOpen] = useState(false);
  const [headroomActionLoading, setHeadroomActionLoading] = useState(false);
  const [headroomActionError, setHeadroomActionError] = useState("");
  const [headroomExtras, setHeadroomExtras] = useState({
    version: null,
    extras: { code: false, ml: false },
    available: ["code", "ml"],
    loading: false,
  });
  const [pendingExtras, setPendingExtras] = useState([]);
  const [extrasActionLoading, setExtrasActionLoading] = useState(false);
  const [extrasActionError, setExtrasActionError] = useState("");
  const [removingExtra, setRemovingExtra] = useState(null);
  const [installLog, setInstallLog] = useState("");
  const [extrasConfirm, setExtrasConfirm] = useState(null);
  const [codeAware, setCodeAware] = useState(false);
  const [kompress, setKompress] = useState(true);
  const [restartingProxy, setRestartingProxy] = useState(false);
  const logPollRef = useRef(null);

  const [cavemanEnabled, setCavemanEnabled] = useState(false);
  const [cavemanLevel, setCavemanLevel] = useState("full");
  const [ponytailEnabled, setPonytailEnabled] = useState(false);
  const [ponytailLevel, setPonytailLevel] = useState("full");

  // ExtremeRouter additions: Semantic Cache & Pxpipe
  const [semanticCacheEnabled, setSemanticCacheEnabled] = useState(false);
  const [semanticCacheThreshold, setSemanticCacheThreshold] = useState(0.85);
  const [cacheStats, setCacheStats] = useState(null);
  const [pxpipeEnabled, setPxpipeEnabled] = useState(false);
  const [pxpipeStatus, setPxpipeStatus] = useState({ installed: false, loaded: false, version: null, loading: true });
  const [pxpipeInstalling, setPxpipeInstalling] = useState(false);

  const [locale, setLocale] = useState("en");
  const { copied, copy } = useCopyToClipboard();

  useEffect(() => {
    setLocale(getCurrentLocale());
    return onLocaleChange(setLocale);
  }, []);

  const patchSetting = async (body) => {
    try {
      await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    } catch {}
  };

  const handleRtkEnabled = (value) => {
    setRtkEnabledState(value);
    patchSetting({ rtkEnabled: value });
  };

  const handleHeadroomEnabled = (value) => {
    setHeadroomEnabled(value);
    patchSetting({ headroomEnabled: value });
  };

  const handleHeadroomUrlBlur = () => {
    patchSetting({ headroomUrl });
    refreshHeadroomStatus();
  };

  const refreshHeadroomStatus = useCallback(async () => {
    setHeadroomStatus((s) => ({ ...s, loading: true }));
    try {
      const res = await fetch("/api/headroom/status", {
        headers: { "Cache-Control": "no-store" },
      });
      const data = await res.json();
      setHeadroomStatus({ ...data, loading: false });
      if (!data?.installed) {
        setHeadroomExtras({
          version: null,
          extras: { code: false, ml: false },
          available: ["code", "ml"],
          loading: false,
        });
        setPendingExtras([]);
        return;
      }
      try {
        const er = await fetch("/api/headroom/extras", {
          headers: { "Cache-Control": "no-store" },
        });
        if (!er.ok) throw new Error("extras status failed");
        const ed = await er.json();
        setHeadroomExtras((s) => ({
          ...s,
          version: ed.version ?? null,
          extras: ed.extras || { code: false, ml: false },
          available: ed.available || ["code", "ml"],
          loading: false,
        }));
        setPendingExtras([]);
      } catch {
        setHeadroomExtras({
          version: null,
          extras: { code: false, ml: false },
          available: ["code", "ml"],
          loading: false,
        });
        setPendingExtras([]);
      }
    } catch {
      setHeadroomStatus({
        installed: false,
        running: false,
        version: null,
        python: null,
        loading: false,
      });
      setHeadroomExtras({
        version: null,
        extras: { code: false, ml: false },
        available: ["code", "ml"],
        loading: false,
      });
      setPendingExtras([]);
    }
  }, []);

  const headroomAction = useCallback(
    async (endpoint) => {
      setHeadroomActionError("");
      setHeadroomActionLoading(true);
      try {
        const res = await fetch(`/api/headroom/${endpoint}`, { method: "POST" });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || `Action ${endpoint} failed`);
        await refreshHeadroomStatus();
      } catch (e) {
        setHeadroomActionError(e.message);
      } finally {
        setHeadroomActionLoading(false);
      }
    },
    [refreshHeadroomStatus]
  );

  const handleHeadroomStart = () => headroomAction("start");
  const handleHeadroomStop = () => headroomAction("stop");
  const handleHeadroomRestart = () => headroomAction("restart");

  useEffect(() => {
    if (headroomModalOpen) {
      refreshHeadroomStatus();
    }
  }, [headroomModalOpen, refreshHeadroomStatus]);

  const togglePendingExtra = (extra) => {
    setPendingExtras((cur) =>
      cur.includes(extra) ? cur.filter((e) => e !== extra) : [...cur, extra]
    );
  };

  const startLogPolling = useCallback(() => {
    setInstallLog("");
    if (logPollRef.current) clearInterval(logPollRef.current);
    const tick = async () => {
      try {
        const r = await fetch("/api/headroom/extras?log=1", {
          headers: { "Cache-Control": "no-store" },
        });
        const d = await r.json().catch(() => ({}));
        if (typeof d.log === "string") setInstallLog(d.log);
      } catch {}
    };
    tick();
    logPollRef.current = setInterval(tick, 1500);
  }, []);

  const stopLogPolling = useCallback(() => {
    if (logPollRef.current) {
      clearInterval(logPollRef.current);
      logPollRef.current = null;
    }
  }, []);

  useEffect(() => () => stopLogPolling(), [stopLogPolling]);

  const installExtrasConfirmed = useCallback(async () => {
    if (pendingExtras.length === 0) return;
    setExtrasActionLoading(true);
    setExtrasActionError("");
    startLogPolling();
    try {
      const res = await fetch("/api/headroom/extras", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ extras: pendingExtras }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Install failed");
      setHeadroomExtras((s) => ({
        ...s,
        version: data.version ?? s.version,
        extras: data.extras || s.extras,
      }));
      setPendingExtras([]);
    } catch (e) {
      setExtrasActionError(e.message);
    } finally {
      stopLogPolling();
      setExtrasActionLoading(false);
    }
  }, [pendingExtras, startLogPolling, stopLogPolling]);

  const removeExtraConfirmed = useCallback(async (extra) => {
    setRemovingExtra(extra);
    setExtrasActionError("");
    startLogPolling();
    try {
      const res = await fetch("/api/headroom/extras", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ extras: [extra] }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Remove failed");
      setHeadroomExtras((s) => ({
        ...s,
        version: data.version ?? s.version,
        extras: data.extras || s.extras,
      }));
    } catch (e) {
      setExtrasActionError(e.message);
    } finally {
      stopLogPolling();
      setRemovingExtra(null);
    }
  }, [startLogPolling, stopLogPolling]);

  const handleInstallExtras = useCallback(() => {
    if (pendingExtras.length === 0) return;
    if (pendingExtras.includes("ml")) {
      setExtrasConfirm({
        title: "Install [ml]",
        message: "[ml] downloads ~1 GB (torch + huggingface-hub). Continue?",
        confirmText: "Install",
        variant: "primary",
        onConfirm: installExtrasConfirmed,
      });
      return;
    }
    installExtrasConfirmed();
  }, [pendingExtras, installExtrasConfirmed]);

  const handleRemoveExtra = useCallback((extra) => {
    setExtrasConfirm({
      title: `Remove [${extra}]`,
      message: `Remove [${extra}] and its packages?`,
      confirmText: "Remove",
      variant: "danger",
      onConfirm: () => removeExtraConfirmed(extra),
    });
  }, [removeExtraConfirmed]);

  const toggleExtraActive = useCallback(async (extra, value) => {
    setExtrasActionError("");
    if (extra === "code") setCodeAware(value);
    if (extra === "ml") setKompress(value);
    const key = extra === "code" ? "headroomCodeAware" : "headroomKompress";
    await patchSetting({ [key]: value });
    if (!headroomStatus.running) return;
    setRestartingProxy(true);
    try {
      const res = await fetch("/api/headroom/restart", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Restart failed");
      await refreshHeadroomStatus();
    } catch (e) {
      setExtrasActionError(e.message);
    } finally {
      setRestartingProxy(false);
    }
  }, [headroomStatus.running, refreshHeadroomStatus]);

  const handleCavemanLevel = (level) => {
    setCavemanLevel(level);
    patchSetting({ cavemanLevel: level });
  };

  const handleCavemanToggle = (value) => {
    setCavemanEnabled(value);
    patchSetting({ cavemanEnabled: value });
  };

  const handlePonytailToggle = (value) => {
    setPonytailEnabled(value);
    patchSetting({ ponytailEnabled: value });
  };

  const handlePonytailLevel = (level) => {
    setPonytailLevel(level);
    patchSetting({ ponytailLevel: level });
  };

  const handleSemanticCacheToggle = (value) => {
    setSemanticCacheEnabled(value);
    patchSetting({ semanticCacheEnabled: value });
  };

  const handleCacheThreshold = (value) => {
    setSemanticCacheThreshold(value);
    patchSetting({ semanticCacheThreshold: value });
  };

  const handleClearCache = async () => {
    try { await fetch("/api/cache", { method: "DELETE" }); setCacheStats(null); } catch {}
  };

  const handlePxpipeToggle = (value) => {
    setPxpipeEnabled(value);
    patchSetting({ pxpipeEnabled: value });
  };

  const refreshPxpipeStatus = async () => {
    setPxpipeStatus((s) => ({ ...s, loading: true }));
    try {
      const res = await fetch("/api/pxpipe/status", { headers: { "Cache-Control": "no-store" } });
      const data = await res.json();
      setPxpipeStatus({ ...data, loading: false });
    } catch {
      setPxpipeStatus({ installed: false, loaded: false, version: null, loading: false });
    }
  };

  const handlePxpipeInstall = async () => {
    setPxpipeInstalling(true);
    try {
      await fetch("/api/pxpipe/install", { method: "POST" });
      await refreshPxpipeStatus();
    } catch {}
    setPxpipeInstalling(false);
  };

  const handleHeadroomTimeoutBlur = () => {
    const raw = Math.round(Number(headroomTimeoutMs));
    const next = Number.isFinite(raw) && raw > 0 ? raw : 3000;
    setHeadroomTimeoutMs(next);
    patchSetting({ headroomTimeoutMs: next });
  };

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const res = await fetch("/api/settings");
        if (res.ok) {
          const data = await res.json();
          setRtkEnabledState(data.rtkEnabled !== false);
          setHeadroomEnabled(!!data.headroomEnabled);
          setHeadroomUrl(data.headroomUrl || "http://localhost:8787");
          if (typeof data.headroomTimeoutMs === "number") setHeadroomTimeoutMs(data.headroomTimeoutMs);
          setCodeAware(data.headroomCodeAware === true);
          setKompress(data.headroomKompress !== false);
          setCavemanEnabled(!!data.cavemanEnabled);
          setCavemanLevel(data.cavemanLevel || "full");
          setPonytailEnabled(!!data.ponytailEnabled);
          setPonytailLevel(data.ponytailLevel || "full");
          setSemanticCacheEnabled(!!data.semanticCacheEnabled);
          setSemanticCacheThreshold(typeof data.semanticCacheThreshold === "number" ? data.semanticCacheThreshold : 0.85);
          setPxpipeEnabled(!!data.pxpipeEnabled);
          refreshHeadroomStatus();
          refreshPxpipeStatus();
        }
      } catch {}
    };
    loadSettings();
  }, [refreshHeadroomStatus]);

  const headroomRunning = !!headroomStatus.running;
  const headroomStatusLabel = headroomStatus.loading
    ? "Memeriksa…"
    : !headroomStatus.installed
      ? "Belum terpasang"
      : headroomRunning
        ? "Berjalan"
        : "Berhenti";
  const headroomChipClass = headroomRunning
    ? "bg-success/15 text-success"
    : "bg-warning/15 text-warning";
  const headroomLocalUrl =
    headroomUrl.startsWith("http://localhost") ||
    headroomUrl.startsWith("http://127.0.0.1");
  const headroomManaged =
    headroomLocalUrl && !!headroomStatus.managedPid;

  return (
    <div className="space-y-6">
      <PageHeader
        title={locale === "id" ? "Penghemat Token" : "Token Saver"}
        description={locale === "id" ? "Kebijakan kompresi untuk prompt, cache, dan keluaran model" : "Compression policies for prompt, cache, and tool output"}
        icon="savings"
      />

      {/* Main Compression Card */}
      <Card id="rtk">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">speed</span>
            {locale === "id" ? "Kompresi Alat & Konteks" : "Tool & Context Compression"}
          </h2>
        </div>
        <p className="text-sm text-text-muted mb-4">
          {locale === "id"
            ? "Mencegah context window cepat penuh dengan mengompresi keluaran perintah CLI dan jejak eksekusi secara otomatis."
            : "Reduce context length and preserve context window by automatically compressing CLI tool outputs and execution traces."}
        </p>

        {/* RTK */}
        <div className="flex items-center justify-between py-4 border-b border-border gap-4 flex-wrap">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <p className="font-medium">
                {locale === "id" ? "Kompresi keluaran alat (RTK)" : "Compress tool output (RTK)"}
              </p>
              <span className="text-xs px-2 py-0.5 rounded bg-success/15 text-success">
                {locale === "id" ? "Bawaan" : "Built-in"}
              </span>
            </div>
            <p className="text-sm text-text-muted mt-1">
              {locale === "id"
                ? "Mengompresi output perintah terminal hingga 60-90% sebelum dikirim ke AI."
                : "Compresses terminal command outputs by 60-90% before sending to LLM."}
            </p>
          </div>
          <Toggle
            checked={rtkEnabled}
            onChange={() => handleRtkEnabled(!rtkEnabled)}
          />
        </div>

        {/* Headroom */}
        <div className="flex items-center justify-between py-4 border-b border-border gap-4 flex-wrap">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <p className="font-medium">
                {locale === "id" ? "Kompresi konteks (Headroom)" : "Compress context (Headroom)"}
              </p>
              <span className={`text-xs px-2 py-0.5 rounded ${headroomChipClass}`}>
                {headroomStatusLabel}
              </span>
              <button
                type="button"
                onClick={() => setHeadroomModalOpen(true)}
                className="text-xs text-primary underline hover:opacity-80"
              >
                {headroomStatus.installed ? (locale === "id" ? "Kelola" : "Manage") : (locale === "id" ? "Pasang" : "Setup")}
              </button>
            </div>
            <p className="text-sm text-text-muted mt-1">
              {locale === "id"
                ? "Kompresi cerdas untuk payload JSON dan percakapan panjang."
                : "Transforms raw prompt text and JSON tool calls into dense compressed tokens."}
            </p>
          </div>
          <Toggle
            checked={headroomEnabled}
            onChange={() => handleHeadroomEnabled(!headroomEnabled)}
          />
        </div>

        {/* Caveman */}
        <div className="flex items-center justify-between py-4 border-b border-border gap-4 flex-wrap">
          <div className="min-w-0 flex-1">
            <p className="font-medium">
              {locale === "id" ? "Kompresi output LLM (Caveman)" : "Compress LLM output (Caveman)"}
            </p>
            <p className="text-sm text-text-muted mt-1">
              {locale === "id"
                ? "Menghilangkan basa-basi dan kata pengisi. Menghemat 65-87% output token."
                : "Drop conversational filler words. Saves ~65-87% output tokens."}
            </p>
            {cavemanEnabled && (
              <div className="mt-3 flex items-center gap-3">
                <span className="text-xs text-text-muted">{locale === "id" ? "Tingkat:" : "Level:"}</span>
                {["full", "lite"].map((lvl) => (
                  <label key={lvl} className="flex items-center gap-1.5 text-xs text-text-muted cursor-pointer">
                    <input
                      type="radio"
                      name="cavemanLevel"
                      value={lvl}
                      checked={cavemanLevel === lvl}
                      onChange={() => handleCavemanLevel(lvl)}
                    />
                    <span className="capitalize">{lvl}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
          <Toggle
            checked={cavemanEnabled}
            onChange={() => handleCavemanToggle(!cavemanEnabled)}
          />
        </div>

        {/* Ponytail */}
        <div className="flex items-center justify-between pt-4 gap-4 flex-wrap">
          <div className="min-w-0 flex-1">
            <p className="font-medium">
              {locale === "id" ? "Senior dev mode (Ponytail)" : "Senior dev mode (Ponytail)"}
            </p>
            <p className="text-sm text-text-muted mt-1">
              {locale === "id"
                ? "Memaksa kode efisien, tanpa boilerplate, prioritaskan stdlib dan fungsi native."
                : "Minimal code, stdlib-first, no boilerplate. Clean & efficient."}
            </p>
            {ponytailEnabled && (
              <div className="mt-3 flex items-center gap-3">
                <span className="text-xs text-text-muted">{locale === "id" ? "Tingkat:" : "Level:"}</span>
                {["full", "lite"].map((lvl) => (
                  <label key={lvl} className="flex items-center gap-1.5 text-xs text-text-muted cursor-pointer">
                    <input
                      type="radio"
                      name="ponytailLevel"
                      value={lvl}
                      checked={ponytailLevel === lvl}
                      onChange={() => handlePonytailLevel(lvl)}
                    />
                    <span className="capitalize">{lvl}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
          <Toggle
            checked={ponytailEnabled}
            onChange={() => handlePonytailToggle(!ponytailEnabled)}
          />
        </div>
      </Card>

      {/* Semantic Cache (from ExtremeRouter) */}
      <Card>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-text-muted">cached</span>
            <div>
              <p className="text-sm font-medium text-text-main">
                {locale === "id" ? "Cache Semantik (Semantic Cache)" : "Semantic Cache"}
              </p>
              <p className="text-xs text-text-muted mt-0.5">
                {locale === "id"
                  ? "Menyimpan respon berdasarkan kemiripan pesan prompt (Jaccard). Respon instan, $0 biaya token."
                  : "Cache responses by message similarity (Jaccard). Instant hits, $0 token cost."}
              </p>
            </div>
          </div>
          <Toggle
            checked={semanticCacheEnabled}
            onChange={() => handleSemanticCacheToggle(!semanticCacheEnabled)}
          />
        </div>
        {semanticCacheEnabled && (
          <div className="mt-4 flex flex-col gap-3 border-t border-border-subtle pt-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-text-muted">
                {locale === "id" ? "Ambang Kemiripan (Similarity Threshold)" : "Similarity Threshold"}
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min={0.5}
                  max={1.0}
                  step={0.05}
                  value={semanticCacheThreshold}
                  onChange={(e) => handleCacheThreshold(parseFloat(e.target.value))}
                  className="w-32 accent-[var(--color-primary)]"
                />
                <span className="w-10 text-right font-mono text-xs text-text-main">
                  {Math.round(semanticCacheThreshold * 100)}%
                </span>
              </div>
            </div>
            {cacheStats && (
              <div className="flex flex-wrap gap-3 text-xs text-text-muted">
                <span>Ukuran: {cacheStats.size}</span>
                <span>·</span>
                <span>Hits: {cacheStats.hits}</span>
                <span>·</span>
                <span>Near: {cacheStats.nearHits}</span>
                <span>·</span>
                <span>Misses: {cacheStats.misses}</span>
                <span>·</span>
                <span>Hit Rate: {cacheStats.hitRate}%</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="secondary"
                icon="refresh"
                onClick={async () => {
                  try { const res = await fetch("/api/cache"); setCacheStats(await res.json()); } catch {}
                }}
              >
                {locale === "id" ? "Segarkan Statistik" : "Refresh Stats"}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                icon="delete"
                onClick={handleClearCache}
              >
                {locale === "id" ? "Kosongkan Cache" : "Clear Cache"}
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Pxpipe — Multimodal Image Prompt Compression (from ExtremeRouter) */}
      <Card>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-text-muted">image_compressor</span>
            <div>
              <p className="text-sm font-medium text-text-main">
                {locale === "id" ? "Pxpipe (Kompresi Gambar Multimodal)" : "Pxpipe (Image Compression)"}
              </p>
              <p className="text-xs text-text-muted mt-0.5">
                {locale === "id"
                  ? "Merender konteks Claude yang padat menjadi gambar PNG sebelum dikirim. Menghemat ~35-60% input token."
                  : "Render dense Claude-format contexts as PNG images before dispatch. Saves ~35-60% input tokens."}
              </p>
            </div>
          </div>
          <Toggle
            checked={pxpipeEnabled}
            onChange={() => handlePxpipeToggle(!pxpipeEnabled)}
          />
        </div>
        {pxpipeEnabled && (
          <div className="mt-4 flex flex-col gap-3 border-t border-border-subtle pt-3">
            <div className="flex items-center gap-2 text-xs">
              <span className={`material-symbols-outlined text-[14px] ${pxpipeStatus.installed ? "text-success" : "text-warning"}`}>
                {pxpipeStatus.installed ? "check_circle" : "error"}
              </span>
              <span className="text-text-muted">
                {locale === "id" ? "Paket:" : "Package:"} {pxpipeStatus.installed ? `v${pxpipeStatus.version || "?"} terpasang` : (locale === "id" ? "belum terpasang" : "not installed")}
              </span>
              {pxpipeStatus.loaded && (
                <Badge variant="success" size="sm" dot>Loaded</Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="secondary"
                icon={pxpipeInstalling ? "progress_activity" : "download"}
                onClick={handlePxpipeInstall}
                disabled={pxpipeInstalling}
              >
                {pxpipeInstalling ? (locale === "id" ? "Memasang…" : "Installing...") : pxpipeStatus.installed ? (locale === "id" ? "Pasang Ulang / Perbarui" : "Reinstall / Upgrade") : (locale === "id" ? "Pasang Paket" : "Install Package")}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                icon="refresh"
                onClick={refreshPxpipeStatus}
              >
                {locale === "id" ? "Segarkan Status" : "Refresh Status"}
              </Button>
            </div>
            <p className="text-[11px] text-text-muted">
              {locale === "id"
                ? "Hanya aktif untuk request berformat Claude dengan teks di atas ambang batas. Selalu fail-open — tidak pernah memblokir request."
                : "Only activates for Claude-format requests with text content above threshold. Fail-open — never blocks requests."}
            </p>
          </div>
        )}
      </Card>

      {/* Headroom Modal */}
      <Modal
        isOpen={headroomModalOpen}
        title={headroomStatus.installed ? "Headroom" : "Setup Headroom"}
        onClose={() => setHeadroomModalOpen(false)}
      >
        <div className="flex flex-col gap-4">
          <p className="text-sm text-text-muted">
            Headroom adalah proxy kompresi teks dan JSON cerdas lokal.
          </p>
          <div className="flex items-center justify-between text-sm">
            <span>Status</span>
            <span className={headroomRunning ? "text-success" : "text-warning"}>
              {headroomStatusLabel}
            </span>
          </div>
          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium">Proxy URL</p>
            <Input
              value={headroomUrl}
              onChange={(e) => setHeadroomUrl(e.target.value)}
              onBlur={handleHeadroomUrlBlur}
              placeholder="http://localhost:8787"
              className="font-mono text-sm"
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setHeadroomModalOpen(false)} fullWidth>
              Tutup
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

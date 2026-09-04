import { NextResponse } from "next/server";
import { getProviderConnectionById, addCustomModel } from "@/models";
import { syncGlobalModels } from "@/lib/services/modelsDevAutoSync";

function detectCaps(id) {
  const lower = String(id || "").toLowerCase();
  return {
    vision: lower.includes("vision") || lower.includes("vl") || lower.includes("image") || lower.includes("4o"),
    reasoning: lower.includes("r1") || lower.includes("o1") || lower.includes("o3") || lower.includes("thinking"),
    toolCall: !lower.includes("embedding") && !lower.includes("rerank"),
  };
}

export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const connection = await getProviderConnectionById(id);

    if (!connection) {
      return NextResponse.json({ error: "Connection not found" }, { status: 404 });
    }

    const provider = connection.provider;
    let fetchedList = [];
    let source = "live-api";

    // Pass incoming cookies/headers for internal auth loopback!
    const cookieHeader = request.headers.get("cookie") || "";

    try {
      const res = await fetch(`http://127.0.0.1:20160/api/providers/${id}/models`, {
        headers: {
          "Cache-Control": "no-store",
          Cookie: cookieHeader,
        },
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) fetchedList = data;
        else if (Array.isArray(data.models)) fetchedList = data.models;
        else if (Array.isArray(data.data)) fetchedList = data.data;
      } else {
        console.warn(`[sync-models] /api/providers/${id}/models returned status ${res.status}`);
      }
    } catch (e) {
      console.warn("[sync-models] Live query failed, falling back to global:", e.message);
    }

    // If live API returned 0, fall back to models.dev global registry
    if (!fetchedList || fetchedList.length === 0) {
      source = "global-catalog-live";
      const globalCount = await syncGlobalModels(provider);
      return NextResponse.json({
        ok: true,
        provider,
        connectionId: id,
        source,
        syncedModels: globalCount,
        message: `Successfully synchronized ${globalCount} live models for ${provider}`,
      });
    }

    let count = 0;
    for (const item of fetchedList) {
      const rawId = typeof item === "string" ? item : item.id || item.name || item.model;
      if (!rawId) continue;

      const cleanId = rawId.startsWith(`${provider}/`) ? rawId.slice(provider.length + 1) : rawId;
      const caps = detectCaps(cleanId);

      await addCustomModel({
        providerAlias: provider,
        id: cleanId,
        type: "llm",
        name: (item && typeof item === "object" ? item.name : cleanId) || cleanId,
        caps,
      });
      count++;
    }

    return NextResponse.json({
      ok: true,
      provider,
      connectionId: id,
      source,
      syncedModels: count,
      message: `Synchronized ${count} live models from remote provider API`,
    });
  } catch (err) {
    console.error("[sync-models] Error:", err);
    return NextResponse.json({ error: err.message || "Failed to sync models" }, { status: 500 });
  }
}

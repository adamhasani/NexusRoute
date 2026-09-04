import { NextResponse } from "next/server";
import { runFullSyncCycle, syncSingleConnection } from "@/lib/services/modelSyncScheduler.js";
import { syncGlobalModels } from "@/lib/services/modelsDevAutoSync.js";
import { getProviderConnectionById } from "@/models";

// POST /api/models/catalog-sync — Trigger instant sync (OmniRoute + models.dev style)
export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const connectionId = body.connectionId;
    const provider = body.provider;

    // 1. If provider specified, pull latest models from models.dev global catalog
    if (provider) {
      const devCount = await syncGlobalModels(provider);
      return NextResponse.json({ success: true, provider, syncedCount: devCount });
    }

    // 2. If single connection
    if (connectionId) {
      const conn = await getProviderConnectionById(connectionId);
      if (!conn) {
        return NextResponse.json({ error: "Connection not found" }, { status: 404 });
      }
      const count = await syncSingleConnection(conn);
      return NextResponse.json({ success: true, connectionId, syncedCount: count });
    }

    // 3. Full sync: both connection-level discovery and models.dev global sync
    await runFullSyncCycle();
    const globalCount = await syncGlobalModels();
    return NextResponse.json({ success: true, message: "Full sync cycle initiated", globalModelsSynced: globalCount });
  } catch (err) {
    return NextResponse.json({ error: err.message || "Failed to trigger sync" }, { status: 500 });
  }
}

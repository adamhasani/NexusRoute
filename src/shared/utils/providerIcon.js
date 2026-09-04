// Unified provider icon resolver combining 9Router functions and ExtremeRouter SVG_ICON_IDS

import { OPENAI_COMPATIBLE_PREFIX, ANTHROPIC_COMPATIBLE_PREFIX } from "@/shared/constants/providers";

const ICON_ALIASES = {
  "perplexity-agent": "perplexity",
  "gitlab-duo": "gitlab",
  "vercel-ai-gateway": "vercel",
  "ollama-search": "ollama",
};

export const SVG_ICON_IDS = new Set([
  "windsurf", "trae", "cody", "kimchi",
  "zai-web", "puter", "adapta-web", "deepseek-web",
  "chatgpt-web", "doubao-web", "gemini-web", "copilot-web", "muse-spark-web",
  "duckduckgo-web", "venice-web", "t3-web", "lmarena", "veoaifree-web",
  "claude-web", "pollinations", "poe-web", "v0-vercel-web", "qwen-web",
  "kimi-web", "huggingchat", "api-airforce", "openvecta", "freebuff-web",
  "zenmux-free", "perplexity-agent", "featherless", "moonshot", "qwencloud",
  "devin", "forge", "tokenrouter",
  "qwen-cloud", "alibaba", "alibaba-cn", "alitp-intl", "hcnsec",
  "cline", "clinepass", "grok-web", "inxorastudio", "inxorastudio-web", "bynara", "infron", "1min", "zed", "wp-studio", "agnes-web", "agnes-api", "stepfun",
  "unimodel",
  "1min-api", "deepinfra", "codestral", "databricks", "venice", "vercel-ai-gateway", "marathon", "qwen2api",
  "kimi-desktop", "novita", "inferx",
  "tokenharbor",
  "felo-web",
  "bazaarlink", "meta-ai", "freebuff", "g4f-pollinations", "fireworks",
  "reka", "pioneer", "meta-llama", "morph", "upstage", "maritalk",
  "nous-research", "liquid", "inception", "writer",
  "modal", "scaleway", "ovhcloud", "heroku", "clarifai", "azure-ai",
  "watsonx", "oci", "sap", "snowflake",
  "auriko",
  "chat-oripe", "chatanywhere", "cloudcode-one", "digitalocean", "dit",
  "dxnt", "electronhub", "empower", "factory", "fastrouter", "free-ai",
  "freeaiapikey", "freeinference", "freemodel-dev", "freetheai", "friendliai",
  "getgoapi", "gitlawb-gmi", "gitlawb", "helixmind", "inference-net", "kenari",
  "kilo-gateway", "lambda-ai", "laozhang", "literouter", "llamagate", "llm-kiwi",
  "llmgateway", "meganova-ai", "mixlayer", "mnn-ai", "modelscope", "naga-ac",
  "naga-ai", "nanogpt", "nara", "navy", "nscale", "nube", "ofoxai",
  "ollama-cloud", "openadapter", "opencode-zen", "openference-api",
  "piapi", "poixe-ai", "poolside", "predibase", "publicai", "qiniu", "regolo",
  "requesty", "routeway", "sambanova", "speka", "sumopod", "synthetic",
  "thebai", "tokenreply", "unorouter", "void-ai", "wafer", "wandb", "x5lab",
  "yolo-auto", "zerolimitai", "zylo-api",
  "lm-studio", "vllm", "lemonade", "llamafile", "llama-cpp", "triton",
  "docker-model-runner", "xinference", "oobabooga",
  "soniox", "gladia", "fishaudio", "rev-ai", "speechmatics",
  "hailuo-web", "gemini-business", "inner-ai", "notion-web", "hyperagent",
]);

const failedIds = new Set();

function normalizeId(providerId) {
  if (!providerId || typeof providerId !== "string") return "";
  return providerId.trim().toLowerCase();
}

export function resolveProviderIconId(providerId) {
  const id = normalizeId(providerId);
  if (!id) return "";
  if (failedIds.has(id)) return "";
  const aliased = ICON_ALIASES[id] || id;
  if (failedIds.has(aliased)) return "";
  return aliased;
}

export function getProviderIconSrc(providerId) {
  const id = resolveProviderIconId(providerId);
  if (!id) return null;
  const ext = SVG_ICON_IDS.has(id) ? "svg" : "png";
  return `/providers/${id}.${ext}`;
}

export function markProviderIconMissing(providerId) {
  const id = normalizeId(providerId);
  if (id) failedIds.add(id);
  const aliased = ICON_ALIASES[id];
  if (aliased) failedIds.add(aliased);
}

export function getProviderIconPath(providerId, apiType) {
  if (providerId?.startsWith(OPENAI_COMPATIBLE_PREFIX)) {
    return apiType === "responses" ? "/providers/oai-r.png" : "/providers/oai-cc.png";
  }
  if (providerId?.startsWith(ANTHROPIC_COMPATIBLE_PREFIX)) {
    return "/providers/anthropic-m.png";
  }
  const id = resolveProviderIconId(providerId);
  const ext = SVG_ICON_IDS.has(id) ? "svg" : "png";
  return `/providers/${id || providerId}.${ext}`;
}

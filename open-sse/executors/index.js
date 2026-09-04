import { MimocodeExecutor } from "./mimocode.js";
import { AihordeExecutor } from "./aihorde.js";
import { FeloWebExecutor } from "./felo-web.js";
import { TheOldLlmExecutor } from "./theoldllm.js";
import { TencentAIStudioWebExecutor } from "./tencent-aistudio-web.js";
import { PollinationsExecutor } from "./pollinations.js";
import { PuterExecutor } from "./puter.js";
import { LMArenaExecutor } from "./lmarena.js";
import { HuggingChatExecutor } from "./huggingchat.js";
import { HyperAgentExecutor } from "./hyperagent.js";
import { NotionWebExecutor } from "./notion-web.js";
import { ConolWebExecutor } from "./conol-web.js";
import { InnerAiExecutor } from "./inner-ai.js";
import { HailuoWebExecutor } from "./hailuo-web.js";
import { GeminiBusinessExecutor } from "./gemini-business.js";
import { GeminiWebExecutor } from "./gemini-web.js";
import { ChatGptWebExecutor } from "./chatgpt-web.js";
import { ClaudeWebExecutor } from "./claude-web.js";
import { VeoAIFreeWebExecutor } from "./veoaifree-web.js";
import { AdaptaWebExecutor } from "./adapta-web.js";
import { MuseSparkWebExecutor } from "./muse-spark-web.js";
import { CopilotWebExecutor } from "./copilot-web.js";
import { PoeWebExecutor } from "./poe-web.js";
import { V0VercelWebExecutor } from "./v0-vercel-web.js";
import { DoubaoWebExecutor } from "./doubao-web.js";
import { VeniceWebExecutor } from "./venice-web.js";
import { DuckDuckGoWebExecutor } from "./duckduckgo-web.js";
import { T3ChatWebExecutor } from "./t3-web.js";
import { QwenCloudExecutor } from "./qwencloud.js";
import { PerplexityAgentExecutor } from "./perplexity-agent.js";
import { AgnesWebExecutor } from "./agnes-web.js";
import { MarathonExecutor } from "./marathon.js";
import { OneMinApiExecutor } from "./onemin-api.js";
import { OneMinExecutor } from "./onemin.js";
import { InxorastudioWebExecutor } from "./inxorastudio-web.js";
import { FreeBuffExecutor } from "./freebuff.js";
import { FreeBuffWebExecutor } from "./freebuff-web.js";
import { ApiAirforceExecutor } from "./api-airforce.js";
import { ZenmuxFreeExecutor } from "./zenmux-free.js";
import { BlackboxWebExecutor } from "./blackbox-web.js";
import { KimiWebExecutor } from "./kimi-web.js";
import { QwenWebExecutor } from "./qwen-web.js";
import { DeepSeekWebExecutor } from "./deepseek-web.js";
import { DevinExecutor } from "./devin.js";
import { ZcodeExecutor } from "./zcode.js";
import { GlmExecutor } from "./glm.js";
import { ZaiWebExecutor } from "./zai-web.js";
import { OpenCodeGoExecutor } from "./opencode-go.js";
import { QwenExecutor } from "./qwen.js";
import { AntigravityExecutor } from "./antigravity.js";
import { AzureExecutor } from "./azure.js";
import { GeminiCLIExecutor } from "./gemini-cli.js";
import { GithubExecutor } from "./github.js";
import { IFlowExecutor } from "./iflow.js";
import { QoderExecutor } from "./qoder.js";
import { KiroExecutor } from "./kiro.js";
import { KimchiExecutor } from "./kimchi.js";
import { CodexExecutor } from "./codex.js";
import { CursorExecutor } from "./cursor.js";
import { VertexExecutor } from "./vertex.js";
import { OpenCodeExecutor } from "./opencode.js";
import { GrokWebExecutor } from "./grok-web.js";
import { GrokCliExecutor } from "./grok-cli.js";
import { PerplexityWebExecutor } from "./perplexity-web.js";
import { OllamaLocalExecutor } from "./ollama-local.js";
import { CommandCodeExecutor } from "./commandcode.js";
import { XiaomiTokenplanExecutor } from "./xiaomi-tokenplan.js";
import { MimoFreeExecutor } from "./mimo-free.js";
import { CodeBuddyExecutor } from "./codebuddy-cn.js";
import { CodeBuddyIntlExecutor } from "./codebuddy-intl.js";
import TraeExecutor from "./trae.js";
import ZedExecutor from "./zed.js";
import WindsurfExecutor from "./windsurf.js";
import { DefaultExecutor } from "./default.js";
import { DevinCliExecutor } from "./devin-cli.js";

const executors = {
  antigravity: new AntigravityExecutor(),
  azure: new AzureExecutor(),
  "gemini-cli": new GeminiCLIExecutor(),
  github: new GithubExecutor(),
  iflow: new IFlowExecutor(),
  qoder: new QoderExecutor(),
  kiro: new KiroExecutor(),
  kimchi: new KimchiExecutor(),
  codex: new CodexExecutor(),
  cursor: new CursorExecutor(),
  cu: new CursorExecutor(), // Alias for cursor
  vertex: new VertexExecutor("vertex"),
  "vertex-partner": new VertexExecutor("vertex-partner"),
  opencode: new OpenCodeExecutor(),
  "grok-web": new GrokWebExecutor(),
  "grok-cli": new GrokCliExecutor(),
  gcli: new GrokCliExecutor(), // Alias
  gb: new GrokCliExecutor(), // Alias (Grok Build)
  "perplexity-web": new PerplexityWebExecutor(),
  "ollama-local": new OllamaLocalExecutor(),
  commandcode: new CommandCodeExecutor(),
  "xiaomi-tokenplan": new XiaomiTokenplanExecutor(),
  "mimo-free": new MimoFreeExecutor(),
  mmf: new MimoFreeExecutor(), // Alias for mimo-free
  "codebuddy-cn": new CodeBuddyExecutor(),
  "codebuddy-intl": new CodeBuddyIntlExecutor(),
  trae: new TraeExecutor(),
  zed: new ZedExecutor(),
  windsurf: new WindsurfExecutor(),
  "devin-cli": new DevinCliExecutor(),
};

const defaultCache = new Map();

export function getExecutor(provider) {
  if (executors[provider]) return executors[provider];
  if (!defaultCache.has(provider)) defaultCache.set(provider, new DefaultExecutor(provider));
  return defaultCache.get(provider);
}

export function hasSpecializedExecutor(provider) {
  return !!executors[provider];
}

export { BaseExecutor } from "./base.js";
export { AntigravityExecutor } from "./antigravity.js";
export { AzureExecutor } from "./azure.js";
export { GeminiCLIExecutor } from "./gemini-cli.js";
export { GithubExecutor } from "./github.js";
export { IFlowExecutor } from "./iflow.js";
export { QoderExecutor } from "./qoder.js";
export { KiroExecutor } from "./kiro.js";
export { KimchiExecutor } from "./kimchi.js";
export { CodexExecutor } from "./codex.js";
export { CursorExecutor } from "./cursor.js";
export { VertexExecutor } from "./vertex.js";
export { DefaultExecutor } from "./default.js";
export { OpenCodeExecutor } from "./opencode.js";
export { GrokWebExecutor } from "./grok-web.js";
export { GrokCliExecutor } from "./grok-cli.js";
export { PerplexityWebExecutor } from "./perplexity-web.js";
export { OllamaLocalExecutor } from "./ollama-local.js";
export { CommandCodeExecutor } from "./commandcode.js";
export { XiaomiTokenplanExecutor } from "./xiaomi-tokenplan.js";
export { MimoFreeExecutor } from "./mimo-free.js";
export { CodeBuddyExecutor } from "./codebuddy-cn.js";
export { CodeBuddyIntlExecutor } from "./codebuddy-intl.js";
export { default as TraeExecutor } from "./trae.js";
export { default as ZedExecutor } from "./zed.js";
export { default as WindsurfExecutor } from "./windsurf.js";
export { DevinCliExecutor } from "./devin-cli.js";

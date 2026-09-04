<div align="center">

# ⚡ NexusRoute

**The Next-Generation Unified AI Gateway & Model Orchestrator**

*Engineered on a rock-solid 9Router proxy core, supercharged with ExtremeRouter's extensive 318+ provider catalog and OmniRoute's real-time model discovery engine.*

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Base: 9Router](https://img.shields.io/badge/Base-9Router%20Core-emerald)](https://github.com/decolua/9router)
[![Providers](https://img.shields.io/badge/Providers-318+-orange.svg)](#-318-ai-providers-supported)
[![Models](https://img.shields.io/badge/Models-7%2C500+-purple.svg)](#-omniroute-style-model-discovery--sync)

[🚀 Quick Start](#-quick-start) • [✨ Key Features](#-key-features) • [🧠 Model Discovery](#-omniroute-style-model-discovery--sync) • [🛠️ Architecture](#%EF%B8%8F-architecture)

</div>

---

## 🌟 Overview

**NexusRoute** is a high-performance AI routing and proxy gateway built for developers and coding agents. It merges the unparalleled stability of the official 9Router proxy core with the rich feature suite of ExtremeRouter and the autonomous discovery capabilities of OmniRoute.

Connecting your developer tools (Claude Code, Cursor, Codex, Cline, OpenCode, Aider) into one unified local endpoint (`http://localhost:20128/v1`), NexusRoute eliminates token waste, avoids rate limits, and unlocks seamless multi-model fallback across 318+ providers.

---

## ✨ Key Features

### 1. 🛡️ Rock-Solid Core Engine
- **Sacrosanct Core (`/v1/*`)**: Native high-throughput proxy pipeline without auth desync or lockouts.
- **Multi-Account Pooling**: Automatic round-robin, sticky sessions, and cooldown rotation across dozens or hundreds of accounts (e.g., 188+ Grok CLI accounts, Antigravity, Kiro, Gemini).

### 2. 🔀 Smart Routing & Combos
- **Combo Studio**: 4 integrated tabs — **Overview**, **Combos List**, **Templates** (instant 1-click presets), and **Lab** (simulation & token cost estimation).
- **Execution Strategies**: Fallback, Round-Robin, Fusion (multi-model panel + consensus), Swarm, and Priority Cascade.
- **Smart Routing & Swarm**: AI-driven dynamic routing and multi-agent persona distribution.
- **Circuit Breaker & Alerts**: Automatic emergency isolation for failing upstreams with webhook notifications.

### 3. 🔍 OmniRoute-Style Live Model Discovery & Sync
- **Two-Tier Model Sync**:
  - **Tier 1 (Live Upstream API)**: Pulls real-time models directly from remote `/v1/models` endpoints.
  - **Tier 2 (Global Catalog Fallback)**: Synchronizes with the open `models.dev` registry (213 providers, 7,500+ models) — ensuring zero downtime and no empty catalogs even for keyless/private providers.
- **Auto Capability Detection**: Smart heuristics automatically tag models for **Vision**, **Reasoning** (thinking effort levels), and **Tool Calling**.
- **Auto-MITM & CLI Alias Generator**: Automatically generates clean shortcuts (e.g. `claude-sonnet-4-6`, `grok-4.6`) without provider prefixes so coding IDEs recognize new models instantly.
- **Probe Reachability**: Integrated 1-token reachability probe to filter out deprecated models before saving.
- **Enriched Metadata**: Pulls context window limits (`context_length`, `max_output_tokens`) and pricing ($/1M tokens) directly into the routing engine.

### 4. 📉 Advanced Token Saver & Compression
- **RTK (Runtime Token Kompression)**: Compresses tool output (git diff, grep, logs) by 60–90%.
- **Headroom**: Context & JSON payload compression.
- **Semantic Cache**: Jaccard similarity cache for instant $0 hits on repetitive prompts.
- **Pxpipe**: Multimodal PNG compression for heavy textual Claude prompts.
- **Caveman Mode**: Eliminates conversational fluff, saving 65–87% output tokens.
- **Ponytail Mode**: Minimalist, stdlib-first senior developer code generation.

### 5. 📊 Quota Tracker & Deep Analytics
- **Complete Quota Table (1,527 lines)**: Granular breakdown per account, tier limits, countdown timers, and batch account toggles (*"Turn off Empty"*, *"Turn on Available"*).
- **Luxury Dark Console**: Tailored Atelier dark palette with Indonesian language support.

---

## ⚡ Quick Start

### Prerequisites
- Node.js >= 18.18
- npm / pnpm

### Installation

```bash
# Clone the repository
git clone https://github.com/adamhasani/NexusRoute.git
cd NexusRoute

# Install dependencies
npm install

# Build production bundle
npm run build

# Start the server
npm run start
```

Default Console URL: `http://localhost:20128` (or port configured in your environment).  
Default Credentials: `123456`

---

## 🔄 Upstream Tracking & Auto-Update

NexusRoute is designed to cleanly follow official 9Router upstream updates without losing custom features or donor providers:

```bash
# Fetch and merge official updates
git fetch upstream master
git merge upstream/master -m "chore(sync): merge upstream 9router updates"

# Rebuild
npm run build
```

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

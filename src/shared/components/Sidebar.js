"use client";

import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/shared/utils/cn";
import { MEDIA_PROVIDER_KINDS } from "@/shared/constants/providers";
import NineRemotePromoModal from "./NineRemotePromoModal";

const VISIBLE_MEDIA_KINDS = ["embedding", "image", "video", "tts", "stt"];
const COMBINED_WEB_ITEM = { id: "web", label: "Web Fetch & Search", icon: "travel_explore", href: "/dashboard/media-providers/web" };

// Exact Top Menu matching Haute Luxury Reference
const topNavItems = [
  { href: "/dashboard/endpoint", label: "Endpoint & Key", icon: "auto_awesome", iconColor: "neon-pink" },
  { href: "/dashboard/providers", label: "Providers", icon: "dns", iconColor: "neon-cyan" },
  { href: "/dashboard/combos", label: "Combo & Vision Adapter", icon: "layers", iconColor: "neon-rose" },
  { href: "/dashboard/usage", label: "Usage", icon: "bar_chart", iconColor: "neon-yellow" },
  { href: "/dashboard/quota", label: "Quota Tracker", icon: "data_usage", iconColor: "neon-yellow" },
  { href: "/dashboard/swarm", label: "Swarm", icon: "hub", iconColor: "neon-purple" },
  { href: "/dashboard/smart-routing", label: "Smart Routing", icon: "alt_route", iconColor: "neon-cyan" },
  { href: "/dashboard/alerts", label: "Alerts & Breaker", icon: "notifications", iconColor: "neon-rose" },
  { href: "/dashboard/token-saver", label: "Token Saver", icon: "smart_toy", iconColor: "neon-cyan" },
  { href: "/dashboard/cli-tools", label: "CLI Tools", icon: "terminal", iconColor: "neon-rose" },
];

// Exact Bottom System Menu matching Haute Luxury Reference
const systemNavItems = [
  { href: "/dashboard/proxy-pools", label: "Proxy Pools", icon: "lan", iconColor: "neon-green" },
  { href: "/dashboard/skills", label: "Skills", icon: "verified", iconColor: "neon-yellow" },
  { href: "/dashboard/console-log", label: "Console Log", icon: "terminal", iconColor: "neon-rose" },
];

export default function Sidebar({ onClose }) {
  const pathname = usePathname();
  const [mediaOpen, setMediaOpen] = useState(false);
  const [showRemoteModal, setShowRemoteModal] = useState(false);

  const isActive = (href) => {
    if (href === "/dashboard/endpoint") {
      return pathname === "/dashboard" || pathname.startsWith("/dashboard/endpoint");
    }
    return pathname.startsWith(href);
  };

  return (
    <>
      <aside className="flex w-64 flex-col border-r border-[#2d1836] bg-[#160e1f] h-full max-h-screen overflow-hidden text-[#8f7b97] select-none">
        {/* 1. macOS Traffic Lights */}
        <div className="flex items-center gap-2 px-6 pt-5 pb-3">
          <div className="w-3 h-3 rounded-full bg-[#FF5F56] traffic-red" />
          <div className="w-3 h-3 rounded-full bg-[#FFBD2E] traffic-yellow" />
          <div className="w-3 h-3 rounded-full bg-[#27C93F] traffic-green" />
        </div>

        {/* 2. Logo & App Branding (Haute Luxury) */}
        <div className="px-6 py-2 pb-4">
          <Link href="/dashboard" className="flex items-center gap-3 group">
            {/* Dual Chevron in Rounded Squircle */}
            <div className="flex items-center justify-center size-9 rounded-[10px] bg-gradient-to-br from-[#f06f47] to-[#e11d48] haute-logo-glow">
              <span className="text-white text-[16px] font-black tracking-tighter leading-none select-none">
                ˄˄
              </span>
            </div>
            <div className="flex flex-col">
              <h1 className="text-[15px] font-bold tracking-tight text-white leading-tight">
                NexusRoute
              </h1>
              <span className="text-[11px] font-mono text-[#fcd34d]/90 font-medium">
                v1.0.0 · Haute Nexus
              </span>
            </div>
          </Link>
        </div>

        {/* 3. Navigation Links (Pill / Capsule Shaped) */}
        <nav className="flex-1 px-3 py-1 space-y-1 overflow-y-auto overscroll-contain custom-scrollbar pb-20 touch-pan-y">
          {topNavItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 px-3.5 py-1.5 rounded-full text-[13px] font-medium transition-all duration-150",
                  active
                    ? "bg-[#32162c] text-[#f1a3be] border border-[#582449] shadow-[0_0_12px_rgba(244,63,94,0.2)]"
                    : "text-[#8f7b97] hover:bg-white/[0.04] hover:text-white border border-transparent"
                )}
              >
                <span
                  className={cn(
                    "material-symbols-outlined text-[17px] shrink-0",
                    active ? "text-[#f1a3be]" : item.iconColor
                  )}
                >
                  {item.icon}
                </span>
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}

          {/* 4. Section Divider: SYSTEM */}
          <div className="pt-4 pb-1 px-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#5e4b68]">
              System
            </p>
          </div>

          {/* Media Providers Accordion */}
          <div>
            <button
              onClick={() => setMediaOpen((v) => !v)}
              className={cn(
                "w-full flex items-center gap-3 px-3.5 py-1.5 rounded-full text-[13px] font-medium transition-all duration-150",
                pathname.startsWith("/dashboard/media-providers")
                  ? "bg-[#32162c] text-[#f1a3be] border border-[#582449]"
                  : "text-[#8f7b97] hover:bg-white/[0.04] hover:text-white border border-transparent"
              )}
            >
              <span className="material-symbols-outlined text-[17px] neon-cyan">movie</span>
              <span className="flex-1 text-left truncate">Media Providers</span>
              <span
                className="material-symbols-outlined text-[14px] transition-transform duration-200"
                style={{ transform: mediaOpen ? "rotate(180deg)" : "rotate(0deg)" }}
              >
                expand_more
              </span>
            </button>
            {mediaOpen && (
              <div className="pl-4 pr-1 py-1 space-y-0.5">
                {MEDIA_PROVIDER_KINDS.filter((k) => VISIBLE_MEDIA_KINDS.includes(k.id)).map((kind) => (
                  <Link
                    key={kind.id}
                    href={`/dashboard/media-providers/${kind.id}`}
                    onClick={onClose}
                    className={cn(
                      "flex items-center gap-2.5 px-3 py-1 rounded-full text-xs transition-all",
                      pathname.startsWith(`/dashboard/media-providers/${kind.id}`)
                        ? "text-[#f1a3be] font-semibold bg-[#32162c]"
                        : "text-[#8f7b97] hover:text-white"
                    )}
                  >
                    <span className="material-symbols-outlined text-[15px]">{kind.icon}</span>
                    <span className="truncate">{kind.label}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* System Items (Proxy Pools, Skills, Console Log) */}
          {systemNavItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 px-3.5 py-1.5 rounded-full text-[13px] font-medium transition-all duration-150",
                  active
                    ? "bg-[#32162c] text-[#f1a3be] border border-[#582449]"
                    : "text-[#8f7b97] hover:bg-white/[0.04] hover:text-white border border-transparent"
                )}
              >
                <span
                  className={cn(
                    "material-symbols-outlined text-[17px] shrink-0",
                    active ? "text-[#f1a3be]" : item.iconColor
                  )}
                >
                  {item.icon}
                </span>
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}

          {/* 9Remote */}
          <button
            onClick={() => setShowRemoteModal(true)}
            className="w-full flex items-center gap-3 px-3.5 py-1.5 rounded-full text-[13px] font-medium text-[#8f7b97] hover:bg-white/[0.04] hover:text-white border border-transparent transition-all"
          >
            <span className="material-symbols-outlined text-[17px] neon-cyan">computer</span>
            <span className="truncate">9Remote</span>
          </button>

          {/* 9English */}
          <a
            href="https://9english.net/"
            target="_blank"
            rel="noreferrer"
            onClick={onClose}
            className="flex items-center gap-3 px-3.5 py-1.5 rounded-full text-[13px] font-medium text-[#8f7b97] hover:bg-white/[0.04] hover:text-white border border-transparent transition-all"
          >
            <span className="material-symbols-outlined text-[17px] neon-yellow">translate</span>
            <span className="truncate">9English</span>
          </a>

          {/* Settings */}
          <Link
            href="/dashboard/profile"
            onClick={onClose}
            className={cn(
              "flex items-center gap-3 px-3.5 py-1.5 rounded-full text-[13px] font-medium transition-all duration-150",
              isActive("/dashboard/profile")
                ? "bg-[#32162c] text-[#f1a3be] border border-[#582449]"
                : "text-[#8f7b97] hover:bg-white/[0.04] hover:text-white border border-transparent"
            )}
          >
            <span className="material-symbols-outlined text-[17px] neon-purple">settings</span>
            <span className="truncate">Settings</span>
          </Link>
        </nav>
      </aside>

      {/* 9Remote Promo Modal */}
      <NineRemotePromoModal isOpen={showRemoteModal} onClose={() => setShowRemoteModal(false)} />
    </>
  );
}

Sidebar.propTypes = {
  onClose: PropTypes.func,
};

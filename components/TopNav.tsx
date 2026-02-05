"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Link, usePathname } from "@/lib/i18n-navigation";
import {
  HamburgerMenuIcon,
  Cross1Icon,
  MoonIcon,
  SunIcon,
} from "@radix-ui/react-icons";
import { useTheme } from "next-themes";
import SiweConnectButton from "./blog/siwe/connect-button";
import LanguageSwitcher from "./LanguageSwitcher";

// Kept for backwards compatibility
export function SiweButtonSkeleton() {
  return null;
}

// Menu items configuration
const menuItems = [
  { href: "/disclaimer", label: "Disclaimer" },
  { href: "/privacy_policy", label: "Privacy Policy" },
  { href: "/about", label: "About" },
  { href: "/blog/support", label: "Support" },
];

export default function TopNav() {
  const pathName = usePathname();
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // sticky-on-scroll affordance
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    setMounted(true);
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  // Close menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathName]);

  const toggleTheme = () => {
    const next = resolvedTheme === "dark" ? "light" : "dark";
    setTheme(next);
  };

  const toggleMobileMenu = useCallback(() => {
    setMobileMenuOpen((prev) => !prev);
  }, []);

  const isActive = (href: string) => pathName === href;
  const linkBase =
    "text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-slate-400 dark:focus-visible:ring-zinc-500 focus-visible:rounded-sm";
  const linkRest =
    "text-slate-700 hover:text-slate-900 hover:underline underline-offset-4 decoration-2 decoration-slate-400/70 dark:text-zinc-300 dark:hover:text-zinc-50 dark:decoration-zinc-400/60";
  const linkActive =
    "font-semibold text-slate-900 dark:text-white underline decoration-emerald-500/80 dark:decoration-emerald-400/80 underline-offset-4";

  return (
    <>
      <div
        className={`sticky top-0 z-50 transition-shadow ${
          scrolled
            ? "bg-white/80 dark:bg-neutral-900/80 backdrop-blur border-b border-slate-200 dark:border-neutral-700 shadow-sm"
            : "bg-white dark:bg-neutral-900"
        }`}
      >
        {/* desktop */}
        <div className="p-5 relative hidden sm:flex flex-col items-center sm:flex-row sm:justify-between max-w-5xl mx-auto">
          <div className="hidden sm:block">
            <Link href="/blog" className="group">
              <div className="transition-colors">
                <span className="font-black text-slate-900 dark:text-slate-100">
                  SUDOPARTY
                </span>{" "}
                <span className="font-medium text-slate-500 dark:text-slate-300">
                  Blog
                </span>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-6 text-sm mt-2 sm:mt-0">
            {menuItems.map((item) => (
              <Link key={item.href} href={item.href}>
                <div
                  className={`${linkBase} ${isActive(item.href) ? linkActive : linkRest}`}
                >
                  {item.label}
                </div>
              </Link>
            ))}

            {/* Language Switcher */}
            <LanguageSwitcher />

            {/* theme toggle */}
            <button
              type="button"
              onClick={mounted ? toggleTheme : undefined}
              aria-label="Toggle theme"
              className="cursor-pointer inline-flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 dark:border-neutral-700 hover:bg-slate-50 dark:hover:bg-neutral-800/60 text-slate-700 dark:text-slate-200"
            >
              {mounted ? (
                <>
                  <SunIcon className="hidden dark:inline-block" />
                  <MoonIcon className="inline-block dark:hidden" />
                </>
              ) : (
                <div className="w-4 h-4" />
              )}
            </button>

            <div className="shrink-0">
              <SiweConnectButton />
            </div>
          </div>
        </div>

        {/* mobile header */}
        <div className="relative flex justify-between items-center p-5 sm:hidden max-w-5xl mx-auto">
          <Link href="/blog" className="group">
            <div className="transition-colors">
              <span className="font-black text-slate-900 dark:text-slate-100">
                SUDOPARTY
              </span>{" "}
              <span className="font-medium text-slate-500 dark:text-slate-300">
                Blog
              </span>
            </div>
          </Link>

          <div className="flex flex-row gap-3 items-center">
            <LanguageSwitcher />

            <button
              type="button"
              onClick={mounted ? toggleTheme : undefined}
              aria-label="Toggle theme"
              className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 dark:border-neutral-700 hover:bg-slate-50 dark:hover:bg-neutral-800/60 text-slate-700 dark:text-slate-200"
            >
              {mounted ? (
                <>
                  <SunIcon className="hidden dark:inline-block" />
                  <MoonIcon className="inline-block dark:hidden" />
                </>
              ) : (
                <div className="w-4 h-4" />
              )}
            </button>

            <div className="shrink-0">
              <SiweConnectButton />
            </div>

            {/* Hamburger button - only shows hamburger icon, X is in overlay */}
            <button
              type="button"
              onClick={toggleMobileMenu}
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileMenuOpen}
              className="relative inline-flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 dark:border-neutral-700 hover:bg-slate-50 dark:hover:bg-neutral-800/60 text-slate-700 dark:text-slate-200"
            >
              <HamburgerMenuIcon />
            </button>
          </div>
        </div>
      </div>

      {/* Fullscreen mobile menu overlay */}
      <div
        className={`fixed inset-0 z-[55] sm:hidden transition-all duration-500 ${
          mobileMenuOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none delay-300"
        }`}
      >
        {/* Backdrop */}
        <div
          className={`absolute inset-0 bg-white dark:bg-neutral-900 transition-all duration-500 origin-center ${
            mobileMenuOpen
              ? "scale-100 opacity-100"
              : "scale-95 opacity-0 delay-200"
          }`}
        />

        {/* Menu content */}
        <nav className="relative h-full flex flex-col items-center justify-center px-8">
          {/* Close button - synced with backdrop, no delay */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close menu"
            className={`absolute top-5 right-5 inline-flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 hover:bg-slate-50 dark:hover:bg-neutral-800 text-slate-700 dark:text-slate-200 transition-all duration-500 ${
              mobileMenuOpen
                ? "opacity-100 scale-100 rotate-0"
                : "opacity-0 scale-75 rotate-90"
            }`}
          >
            <Cross1Icon className="w-4 h-4" />
          </button>

          <ul className="space-y-6 text-center">
            {menuItems.map((item, index) => (
              <li
                key={item.href}
                className={`transition-all duration-400 ${
                  mobileMenuOpen
                    ? "opacity-100 translate-y-0 scale-100"
                    : "opacity-0 -translate-y-4 scale-95"
                }`}
                style={{
                  transitionDelay: mobileMenuOpen
                    ? `${150 + index * 75}ms`
                    : `${(menuItems.length - 1 - index) * 50}ms`,
                }}
              >
                <Link
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="group block"
                >
                  <span
                    className={`text-3xl font-bold transition-all duration-300 ${
                      isActive(item.href)
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-slate-800 dark:text-slate-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400"
                    }`}
                  >
                    {item.label}
                  </span>
                  {/* Animated underline */}
                  <span
                    className={`block h-0.5 mt-1 bg-emerald-500 dark:bg-emerald-400 transition-all duration-300 origin-left ${
                      isActive(item.href)
                        ? "scale-x-100"
                        : "scale-x-0 group-hover:scale-x-100"
                    }`}
                  />
                </Link>
              </li>
            ))}
          </ul>

          {/* Bottom decoration */}
          <div
            className={`absolute bottom-12 left-1/2 -translate-x-1/2 transition-all duration-500 ${
              mobileMenuOpen
                ? "opacity-100 translate-y-0 scale-100"
                : "opacity-0 translate-y-8 scale-90"
            }`}
            style={{ transitionDelay: mobileMenuOpen ? "500ms" : "0ms" }}
          >
            <div className="text-sm text-slate-400 dark:text-slate-500">
              <span className="font-black">SUDOPARTY</span> Blog
            </div>
          </div>
        </nav>
      </div>
    </>
  );
}

"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BrandMark } from "@/components/common/BrandMark";
import type { AuthUser } from "@/lib/api";

export interface NavbarProps {
  user: AuthUser | null;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  onLoginClick?: () => void;
  onRegisterClick?: () => void;
  onLogout?: () => void;
  incomingCount?: number;
  connectionsCount?: number;
}

export function Navbar({
  user,
  activeTab = "home",
  onTabChange,
  onLoginClick,
  onRegisterClick,
  onLogout,
  incomingCount = 0,
  connectionsCount = 0,
}: NavbarProps) {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const authenticated = Boolean(user);

  const handleNavClick = (tab: string) => {
    if (onTabChange) {
      onTabChange(tab);
    } else {
      const item = navItems.find((i) => i.id === tab);
      if (item?.href) {
        router.push(item.href);
      } else if (tab === "profile") {
        router.push("/profile");
      } else if (tab === "network") {
        router.push("/network");
      } else if (tab === "graph") {
        router.push("/graph");
      } else if (tab === "discover") {
        router.push("/discover");
      } else if (tab === "recommendations") {
        router.push("/recommendations");
      } else if (tab === "home") {
        router.push("/dashboard");
      }
    }
    setMobileMenuOpen(false);
  };

  const handleLoginClick = () => {
    if (onLoginClick) {
      onLoginClick();
    } else {
      router.push("/login");
    }
  };

  const handleRegisterClick = () => {
    if (onRegisterClick) {
      onRegisterClick();
    } else {
      router.push("/register");
    }
  };

  const navItems = [
    {
      id: "home",
      label: "Home",
      href: "/dashboard",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
    },
    {
      id: "network",
      label: "My Network",
      href: "/network",
      badge: incomingCount > 0 ? incomingCount : undefined,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
    },
    {
      id: "graph",
      label: "Network Graph",
      href: "/graph",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <circle cx="5" cy="18" r="3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="19" cy="6" r="3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="19" cy="18" r="3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="5" cy="6" r="3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" d="M7.5 7.5l9 9M7.5 16.5l9-9M8 6h8M8 18h8M5 9v6M19 9v6" />
        </svg>
      ),
    },
    {
      id: "discover",
      label: "Discover",
      href: "/discover",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      ),
    },
    {
      id: "recommendations",
      label: "For You",
      href: "/recommendations",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      ),
    },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-white border-b border-[#E2E8F0] shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Left: Brand Logo & Search */}
          <div className="flex items-center gap-3 sm:gap-6 flex-shrink-0">
            <Link
              href="/"
              onClick={() => handleNavClick("home")}
              className="flex items-center gap-2.5 group focus:outline-none"
            >
              <div className="w-10 h-10 rounded-xl bg-[#0F172A] flex items-center justify-center shadow-sm group-hover:bg-[#1E293B] transition-colors">
                <BrandMark size={28} variant="light" />
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-lg sm:text-xl text-[#0F172A] tracking-tight group-hover:text-[#0A66C2] transition-colors leading-none">
                  HappenStance
                </span>
                <span className="text-[10px] font-semibold text-[#0A66C2] tracking-wider uppercase mt-0.5">
                  Network Intelligence
                </span>
              </div>
            </Link>

            {/* Quick Search Trigger (Desktop) */}
            <div className="hidden md:flex items-center">
              <button
                type="button"
                onClick={() => handleNavClick("discover")}
                className="flex items-center gap-2 px-3.5 py-1.5 w-48 lg:w-64 text-xs text-[#64748B] bg-[#F1F5F9] hover:bg-[#E2E8F0] border border-transparent rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-[#0A66C2]"
              >
                <svg className="w-4 h-4 text-[#64748B]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <span>Search people, skills...</span>
              </button>
            </div>
          </div>

          {/* Center / Right: Navigation Links */}
          <div className="hidden md:flex items-center gap-1 lg:gap-2">
            {authenticated ? (
              <>
                {navItems.map((item) => {
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNavClick(item.id)}
                      className={`relative flex flex-col items-center justify-center px-3 lg:px-4 py-1.5 rounded-lg text-xs font-semibold transition-all group ${
                        isActive
                          ? "text-[#0A66C2]"
                          : "text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC]"
                      }`}
                    >
                      <div className="relative">
                        {item.icon}
                        {item.badge !== undefined && (
                          <span className="absolute -top-1 -right-2 px-1.5 py-0.2 bg-[#DC2626] text-white text-[10px] font-bold rounded-full min-w-[16px] text-center">
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <span className="mt-1">{item.label}</span>
                      {isActive && (
                        <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-[#0A66C2] rounded-full" />
                      )}
                    </button>
                  );
                })}

                {/* Profile Avatar / Dropdown */}
                <div className="relative ml-2 pl-3 border-l border-[#E2E8F0]">
                  <button
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    className="flex items-center gap-2 p-1 rounded-lg hover:bg-[#F8FAFC] focus:outline-none transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-[#0A66C2] text-white flex items-center justify-center text-xs font-bold shadow-sm">
                      {(user?.displayName || "U").slice(0, 1).toUpperCase()}
                    </div>
                    <div className="hidden xl:flex flex-col text-left">
                      <span className="text-xs font-bold text-[#0F172A] truncate max-w-[110px]">
                        {user?.displayName || "Member"}
                      </span>
                      <span className="text-[10px] text-[#64748B]">Me ▾</span>
                    </div>
                  </button>

                  {/* Dropdown Menu */}
                  {userDropdownOpen && (
                    <div
                      className="absolute right-0 mt-2 w-56 bg-white rounded-xl border border-[#E2E8F0] shadow-xl py-2 z-50 animate-in fade-in-50 zoom-in-95 duration-150"
                      onMouseLeave={() => setUserDropdownOpen(false)}
                    >
                      <div className="px-4 py-2 border-b border-[#F1F5F9]">
                        <p className="text-xs font-bold text-[#0F172A] truncate">
                          {user?.displayName}
                        </p>
                        <p className="text-[11px] text-[#64748B] truncate">
                          {user?.email}
                        </p>
                      </div>

                      <button
                        onClick={() => {
                          handleNavClick("profile");
                          setUserDropdownOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-xs font-semibold text-[#334155] hover:bg-[#F8FAFC] hover:text-[#0A66C2] transition-colors"
                      >
                        View & Edit Profile
                      </button>

                      <button
                        onClick={() => {
                          handleNavClick("network");
                          setUserDropdownOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-xs font-semibold text-[#334155] hover:bg-[#F8FAFC] hover:text-[#0A66C2] transition-colors flex items-center justify-between"
                      >
                        <span>Connections</span>
                        <span className="text-[10px] px-1.5 py-0.5 bg-[#F1F5F9] rounded-full text-[#64748B]">
                          {connectionsCount}
                        </span>
                      </button>

                      <div className="border-t border-[#F1F5F9] mt-1 pt-1">
                        <button
                          onClick={() => {
                            setUserDropdownOpen(false);
                            if (onLogout) onLogout();
                          }}
                          className="w-full text-left px-4 py-2 text-xs font-semibold text-[#DC2626] hover:bg-[#FEF2F2] transition-colors"
                        >
                          Sign out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleLoginClick}
                  className="px-4 py-2 text-xs font-bold text-[#0A66C2] hover:bg-[#E8F3FC] rounded-lg transition-colors"
                >
                  Sign in
                </button>
                <button
                  type="button"
                  onClick={handleRegisterClick}
                  className="px-4 py-2 text-xs font-bold text-white bg-[#0A66C2] hover:bg-[#004182] rounded-lg shadow-sm transition-colors"
                >
                  Join HappenStance
                </button>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-2">
            {authenticated && (
              <button
                onClick={() => handleNavClick("profile")}
                className="w-8 h-8 rounded-full bg-[#0A66C2] text-white flex items-center justify-center text-xs font-bold"
              >
                {(user?.displayName || "U").slice(0, 1).toUpperCase()}
              </button>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] rounded-lg focus:outline-none"
              aria-label="Toggle mobile menu"
            >
              {mobileMenuOpen ? (
                <span className="text-xl leading-none">✕</span>
              ) : (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[#E2E8F0] bg-white px-4 pt-3 pb-5 space-y-2 animate-in slide-in-from-top-2">
          {authenticated ? (
            <>
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`flex items-center justify-between w-full px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                    activeTab === item.id
                      ? "bg-[#E8F3FC] text-[#0A66C2]"
                      : "text-[#334155] hover:bg-[#F8FAFC]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {item.icon}
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && (
                    <span className="px-2 py-0.5 bg-[#DC2626] text-white text-xs font-bold rounded-full">
                      {item.badge}
                    </span>
                  )}
                </button>
              ))}

              <div className="pt-2 border-t border-[#E2E8F0] mt-2 space-y-1">
                <button
                  onClick={() => handleNavClick("profile")}
                  className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-semibold text-[#334155] hover:bg-[#F8FAFC]"
                >
                  <span>My Profile</span>
                </button>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    if (onLogout) onLogout();
                  }}
                  className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-semibold text-[#DC2626] hover:bg-[#FEF2F2]"
                >
                  <span>Sign out</span>
                </button>
              </div>
            </>
          ) : (
            <div className="space-y-2 pt-2">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLoginClick();
                }}
                className="w-full py-2.5 text-center text-sm font-bold text-[#0A66C2] bg-[#E8F3FC] rounded-lg"
              >
                Sign in
              </button>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleRegisterClick();
                }}
                className="w-full py-2.5 text-center text-sm font-bold text-white bg-[#0A66C2] rounded-lg"
              >
                Join HappenStance
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
}

export default Navbar;

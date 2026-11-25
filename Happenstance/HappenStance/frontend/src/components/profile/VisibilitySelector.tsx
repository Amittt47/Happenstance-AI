"use client";

import React from "react";

export type VisibilityOption = "PUBLIC" | "CONNECTIONS" | "PRIVATE";

interface VisibilitySelectorProps {
  value: VisibilityOption;
  onChange: (value: VisibilityOption) => void;
  disabled?: boolean;
}

interface OptionConfig {
  id: VisibilityOption;
  title: string;
  badge: string;
  description: string;
  icon: React.ReactNode;
}

const OPTIONS: OptionConfig[] = [
  {
    id: "PUBLIC",
    title: "Public",
    badge: "Recommended",
    description:
      "Visible to all HappenStance members. Fully indexed for relationship intelligence, discovery, and high-fidelity recommendations.",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
        />
      </svg>
    ),
  },
  {
    id: "CONNECTIONS",
    title: "Connections Only",
    badge: "Network",
    description:
      "Only members who are accepted 1st-degree connections can view your full bio, skills, and interests. Non-connections see minimal public details.",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
        />
      </svg>
    ),
  },
  {
    id: "PRIVATE",
    title: "Private",
    badge: "Restricted",
    description:
      "Hidden from public member discovery and search suggestions. Only direct connections can see your profile.",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
        />
      </svg>
    ),
  },
];

export function VisibilitySelector({
  value,
  onChange,
  disabled = false,
}: VisibilitySelectorProps) {
  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between text-xs">
        <label className="font-bold text-[#334155] uppercase tracking-wider">
          Profile Visibility & Privacy
        </label>
        <span className="text-[#64748B] font-medium">
          Controls who can discover you
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {OPTIONS.map((opt) => {
          const isSelected = value === opt.id;

          return (
            <button
              key={opt.id}
              type="button"
              disabled={disabled}
              onClick={() => onChange(opt.id)}
              className={`p-3.5 rounded-xl border text-left transition-all relative flex flex-col justify-between ${
                isSelected
                  ? "bg-[#E8F3FC]/50 border-[#0A66C2] ring-2 ring-[#0A66C2]/20 shadow-xs"
                  : "bg-white border-[#E2E8F0] hover:border-[#CBD5E1] hover:bg-[#F8FAFC]"
              } ${disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      isSelected
                        ? "bg-[#0A66C2] text-white"
                        : "bg-[#F1F5F9] text-[#64748B]"
                    }`}
                  >
                    {opt.icon}
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      isSelected
                        ? "bg-[#0A66C2] text-white"
                        : "bg-[#F1F5F9] text-[#64748B]"
                    }`}
                  >
                    {opt.badge}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 mb-1">
                  <div
                    className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                      isSelected
                        ? "border-[#0A66C2] bg-[#0A66C2]"
                        : "border-[#94A3B8] bg-white"
                    }`}
                  >
                    {isSelected && (
                      <div className="w-1.5 h-1.5 rounded-full bg-white" />
                    )}
                  </div>
                  <h4 className="text-sm font-bold text-[#0F172A]">{opt.title}</h4>
                </div>

                <p className="text-xs text-[#64748B] leading-relaxed mt-1">
                  {opt.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default VisibilitySelector;

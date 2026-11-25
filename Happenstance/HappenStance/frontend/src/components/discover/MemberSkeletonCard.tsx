"use client";

import React from "react";
import { Card } from "@/components/common/Card";

export function MemberSkeletonCard() {
  return (
    <Card className="flex flex-col justify-between p-5 animate-pulse bg-white border border-[#E2E8F0] shadow-2xs">
      <div>
        {/* Header with avatar & info */}
        <div className="flex items-start gap-3.5">
          <div className="w-13 h-13 rounded-full bg-[#E2E8F0] flex-shrink-0" />
          <div className="flex-1 space-y-2 pt-1 min-w-0">
            <div className="h-4 bg-[#E2E8F0] rounded-md w-3/4" />
            <div className="h-3 bg-[#F1F5F9] rounded-md w-full" />
            <div className="h-3 bg-[#F1F5F9] rounded-md w-1/2" />
          </div>
        </div>

        {/* Skills placeholder */}
        <div className="flex gap-1.5 mt-4 pt-1">
          <div className="h-5 bg-[#F1F5F9] rounded-full w-16" />
          <div className="h-5 bg-[#F1F5F9] rounded-full w-20" />
          <div className="h-5 bg-[#F1F5F9] rounded-full w-12" />
        </div>
      </div>

      {/* Action buttons placeholder */}
      <div className="flex items-center gap-2 mt-5 pt-3.5 border-t border-[#F1F5F9]">
        <div className="h-8 bg-[#F1F5F9] rounded-lg flex-1" />
        <div className="h-8 bg-[#E2E8F0] rounded-lg flex-1" />
      </div>
    </Card>
  );
}

export default MemberSkeletonCard;

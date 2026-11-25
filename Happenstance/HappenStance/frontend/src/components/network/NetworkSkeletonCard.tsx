"use client";

import React from "react";
import { Card } from "@/components/common/Card";

export function NetworkSkeletonCard() {
  return (
    <Card className="p-4 sm:p-5 animate-pulse bg-white border border-[#E2E8F0] shadow-2xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5 flex-1 min-w-0">
          <div className="w-13 h-13 rounded-full bg-[#E2E8F0] flex-shrink-0" />
          <div className="space-y-2 flex-1 min-w-0">
            <div className="h-4 bg-[#E2E8F0] rounded-md w-1/3" />
            <div className="h-3 bg-[#F1F5F9] rounded-md w-2/3" />
            <div className="h-3 bg-[#F1F5F9] rounded-md w-1/4" />
          </div>
        </div>

        <div className="flex items-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#F1F5F9]">
          <div className="h-8 bg-[#F1F5F9] rounded-lg w-24" />
          <div className="h-8 bg-[#E2E8F0] rounded-lg w-24" />
        </div>
      </div>
    </Card>
  );
}

export default NetworkSkeletonCard;

"use client";

import React from "react";
import { Card } from "@/components/common/Card";

export function RecommendationSkeleton() {
  return (
    <Card className="p-5 animate-pulse shadow-2xs border-[#E2E8F0]">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        {/* Profile info skeleton */}
        <div className="flex items-start gap-4 flex-1">
          <div className="w-14 h-14 rounded-full bg-[#E2E8F0] flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <div className="h-4 bg-[#E2E8F0] rounded w-36" />
              <div className="h-4 bg-[#E2E8F0] rounded w-16" />
            </div>
            <div className="h-3 bg-[#E2E8F0] rounded w-64" />
            <div className="h-3 bg-[#E2E8F0] rounded w-40" />

            {/* Reasons skeleton */}
            <div className="flex gap-2 pt-2">
              <div className="h-5 bg-[#E8F3FC] rounded-md w-32" />
              <div className="h-5 bg-[#E8F3FC] rounded-md w-28" />
            </div>

            {/* Skills skeleton */}
            <div className="flex gap-1.5 pt-2">
              <div className="h-5 bg-[#F1F5F9] rounded w-16" />
              <div className="h-5 bg-[#F1F5F9] rounded w-20" />
              <div className="h-5 bg-[#F1F5F9] rounded w-14" />
            </div>
          </div>
        </div>

        {/* Action skeleton */}
        <div className="flex sm:flex-col items-center sm:items-end gap-2 pt-2 sm:pt-0">
          <div className="h-8 bg-[#E2E8F0] rounded w-20" />
          <div className="h-8 bg-[#E2E8F0] rounded w-24" />
        </div>
      </div>
    </Card>
  );
}

export default RecommendationSkeleton;

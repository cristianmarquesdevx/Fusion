/** @format */

import React from 'react';

function Shimmer({ className = '' }) {
  return (
    <div
      className={`animate-shimmer rounded-sm bg-[linear-gradient(90deg,theme(colors.surface.2)_25%,rgba(255,255,255,0.4)_50%,theme(colors.surface.2)_75%)] dark:bg-[linear-gradient(90deg,theme(colors.surface.dark-2)_25%,rgba(255,255,255,0.08)_50%,theme(colors.surface.dark-2)_75%)] bg-[length:200%_100%] ${className}`}
    />
  );
}

export default function DashboardSkeleton() {
  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="mb-7 space-y-3">
        <Shimmer className="w-48 h-3.5" />
        <Shimmer className="w-full max-w-lg h-7" />
        <Shimmer className="w-72 h-4" />
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="card p-5 space-y-2.5">
            <Shimmer className="w-20 h-3" />
            <Shimmer className="w-28 h-7" />
            <Shimmer className="w-36 h-3" />
          </div>
        ))}
      </div>

      {/* Dashboard grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-4 lg:gap-5">
        {/* Timeline skeleton */}
        <div className="card p-5">
          <div className="flex items-baseline justify-between mb-6">
            <div className="space-y-2">
              <Shimmer className="w-56 h-5" />
              <Shimmer className="w-48 h-3" />
            </div>
            <Shimmer className="w-28 h-3" />
          </div>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="grid grid-cols-[40px_20px_1fr_auto] gap-x-3.5 py-3 border-b border-border dark:border-border-dark last:border-b-0">
              <Shimmer className="w-8 h-3 ml-auto" />
              <div className="flex justify-center">
                <Shimmer className="w-2.5 h-2.5 rounded-full" />
              </div>
              <div className="space-y-1.5">
                <Shimmer className="w-36 h-3.5" />
                <Shimmer className="w-48 h-3" />
              </div>
              <div className="flex gap-1.5">
                <Shimmer className="w-14 h-5 rounded-full" />
                <Shimmer className="w-20 h-5 rounded-full" />
              </div>
            </div>
          ))}
        </div>

        {/* Right column skeleton */}
        <div className="flex flex-col gap-4">
          <div className="card p-5 space-y-4">
            <Shimmer className="w-48 h-5" />
            <div className="flex items-end gap-2 h-[120px]">
              {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-2 justify-end">
                  <Shimmer className="w-10 h-3" />
                  <Shimmer
                    className="w-full max-w-[30px] rounded-[6px_6px_3px_3px]"
                    style={{ height: `${30 + Math.random() * 70}%` }}
                  />
                  <Shimmer className="w-8 h-3" />
                </div>
              ))}
            </div>
          </div>

          {[1, 2].map((i) => (
            <div key={i} className="card p-5 space-y-3">
              <Shimmer className="w-36 h-5" />
              <Shimmer className="w-48 h-3" />
              <div className="space-y-3 pt-2">
                {[1, 2, 3].map((j) => (
                  <div key={j} className="flex items-center justify-between py-1">
                    <div className="space-y-1">
                      <Shimmer className="w-32 h-3.5" />
                      <Shimmer className="w-20 h-3" />
                    </div>
                    <Shimmer className="w-12 h-5" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

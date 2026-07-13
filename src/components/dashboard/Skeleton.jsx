/** @format */

import React from 'react';

export function Shimmer({ className = '' }) {
  return (
    <div
      className={`skeleton-pulse rounded-sm ${className}`}
    />
  );
}

export default function DashboardSkeleton() {
  return (
    <div className="animate-fade-in pb-6">
      {/* Logo + Header */}
      <div className="flex items-start gap-4 mb-7">
        <Shimmer className="w-14 h-14 rounded-2xl shrink-0" />
        <div className="flex-1 space-y-3 pt-1">
          <div className="flex items-center gap-3">
            <Shimmer className="w-48 h-5 rounded-full" />
            <Shimmer className="w-1 h-1 rounded-full" />
            <Shimmer className="w-16 h-3.5" />
            <Shimmer className="w-1 h-1 rounded-full" />
            <Shimmer className="w-24 h-3.5" />
          </div>
          <Shimmer className="w-full max-w-2xl h-8" />
          <Shimmer className="w-96 h-4" />
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="card p-5 space-y-2.5 relative">
            <Shimmer className="w-20 h-3" />
            <Shimmer className="w-28 h-7" />
            <Shimmer className="w-36 h-3" />
            {/* Sparkline placeholder */}
            <Shimmer className="w-16 h-5 absolute bottom-3 right-3" />
          </div>
        ))}
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-4 lg:gap-5">
        {/* Left column */}
        <div className="flex flex-col gap-4">
          {/* Timeline */}
          <div className="card p-5">
            <div className="flex items-baseline justify-between mb-5">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Shimmer className="w-44 h-5" />
                  <Shimmer className="w-14 h-5 rounded-full" />
                </div>
                <Shimmer className="w-52 h-3" />
              </div>
              <Shimmer className="w-24 h-3" />
            </div>
            {[1, 2, 3, 4, 5].map((i) => (
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

          {/* Professionals */}
          <div className="card p-5 space-y-4">
            <div className="space-y-2">
              <Shimmer className="w-56 h-5" />
              <Shimmer className="w-36 h-3" />
            </div>
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="space-y-1.5 min-w-0 flex-1">
                  <Shimmer className="w-24 h-3.5" />
                  <Shimmer className="w-20 h-3" />
                </div>
                <Shimmer className="flex-1 h-6 rounded-md" />
                <Shimmer className="w-16 h-4" />
              </div>
            ))}
          </div>
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-4">
          {/* Revenue chart */}
          <div className="card p-5 space-y-4">
            <div className="flex items-baseline justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Shimmer className="w-32 h-5" />
                  <Shimmer className="w-14 h-5 rounded-full" />
                </div>
              </div>
              <div className="flex gap-3">
                <Shimmer className="w-16 h-3" />
                <Shimmer className="w-16 h-3" />
              </div>
            </div>
            <Shimmer className="w-full h-[200px] rounded-lg" />
          </div>

          {/* Services chart */}
          <div className="card p-5 space-y-3">
            <div className="space-y-2">
              <Shimmer className="w-40 h-5" />
              <Shimmer className="w-32 h-3" />
            </div>
            <Shimmer className="w-full h-[200px] rounded-lg" />
          </div>

          {/* Stock */}
          <div className="card p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Shimmer className="w-32 h-5" />
              <Shimmer className="w-16 h-5 rounded-full" />
            </div>
            <Shimmer className="w-48 h-3" />
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-border dark:border-border-dark last:border-b-0">
                <div className="space-y-1.5">
                  <Shimmer className="w-40 h-3.5" />
                  <Shimmer className="w-28 h-3" />
                </div>
                <div className="flex items-center gap-2">
                  <Shimmer className="w-16 h-3 rounded-full" />
                  <Shimmer className="w-8 h-4" />
                </div>
              </div>
            ))}
          </div>

          {/* Waitlist */}
          <div className="card p-5 space-y-3">
            <Shimmer className="w-28 h-5" />
            <Shimmer className="w-48 h-3" />
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-border dark:border-border-dark last:border-b-0">
                <div className="flex items-center gap-2.5">
                  <Shimmer className="w-8 h-8 rounded-full" />
                  <div className="space-y-1">
                    <Shimmer className="w-28 h-3.5" />
                    <Shimmer className="w-36 h-3" />
                  </div>
                </div>
                <Shimmer className="w-16 h-7 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Financial summary footer */}
      <div className="mt-6 card p-5 space-y-4">
        <div className="flex items-baseline justify-between">
          <Shimmer className="w-44 h-5" />
          <Shimmer className="w-24 h-3" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="space-y-2">
              <Shimmer className="w-16 h-3" />
              <Shimmer className="w-28 h-6" />
              <Shimmer className="w-full h-2 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function FinanceiroSkeleton() {
  return (
    <div className="animate-fade-in">
      {/* Logo + Header */}
      <div className="flex items-start gap-4 mb-7">
        <Shimmer className="w-14 h-14 rounded-2xl shrink-0" />
        <div className="flex-1 space-y-3 pt-1">
          <Shimmer className="w-28 h-3.5" />
          <Shimmer className="w-72 h-7" />
          <Shimmer className="w-80 h-4" />
        </div>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="card p-5 space-y-2.5">
            <Shimmer className="w-24 h-3" />
            <Shimmer className="w-32 h-7" />
            <Shimmer className="w-28 h-3" />
          </div>
        ))}
      </div>
      <div className="card overflow-hidden">
        <div className="flex items-baseline justify-between px-5 pt-5 pb-3">
          <div className="space-y-2">
            <Shimmer className="w-44 h-5" />
            <Shimmer className="w-36 h-3" />
          </div>
          <Shimmer className="w-28 h-3" />
        </div>
        <div className="overflow-x-auto px-5 pb-5">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="grid grid-cols-[2fr_1fr_0.7fr_0.7fr_0.7fr] gap-4 py-3.5 border-b border-border dark:border-border-dark last:border-b-0">
              <Shimmer className="w-full h-4" />
              <Shimmer className="w-20 h-4" />
              <Shimmer className="w-12 h-4" />
              <Shimmer className="w-16 h-4" />
              <Shimmer className="w-14 h-5 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function EstoqueSkeleton() {
  return (
    <div className="animate-fade-in">
      {/* Logo + Header */}
      <div className="flex items-start gap-4 mb-7">
        <Shimmer className="w-14 h-14 rounded-2xl shrink-0" />
        <div className="flex-1 space-y-3 pt-1">
          <Shimmer className="w-28 h-3.5" />
          <Shimmer className="w-72 h-7" />
          <Shimmer className="w-80 h-4" />
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="card p-4 space-y-2">
            <Shimmer className="w-20 h-3" />
            <Shimmer className="w-16 h-7" />
          </div>
        ))}
      </div>
      <div className="card overflow-hidden">
        <div className="overflow-x-auto px-5 pb-5 pt-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="grid grid-cols-[2fr_1fr_1.5fr_1fr_1fr] gap-4 py-3.5 border-b border-border dark:border-border-dark last:border-b-0">
              <Shimmer className="w-full h-4" />
              <Shimmer className="w-20 h-4" />
              <Shimmer className="w-24 h-4" />
              <Shimmer className="w-12 h-4" />
              <Shimmer className="w-14 h-5 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

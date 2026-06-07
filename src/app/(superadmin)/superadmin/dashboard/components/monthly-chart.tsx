"use client";

import { formatCurrency } from "@/lib/utils";

interface ChartData {
  month: string;
  companies: number;
  revenue: number;
}

export function MonthlyGrowthChart({ data }: { data: ChartData[] }) {
  const maxRevenue = Math.max(...data.map((d) => d.revenue), 1);
  const maxCompanies = Math.max(...data.map((d) => d.companies), 1);

  return (
    <div>
      {/* Revenue Bars */}
      <div className="flex items-end gap-4 h-48 px-2">
        {data.map((item, idx) => (
          <div key={idx} className="flex-1 flex flex-col items-center gap-2">
            {/* Revenue value */}
            <span className="text-xs font-medium text-gray-600 text-center leading-tight">
              {item.revenue > 0 ? formatCurrency(item.revenue) : "—"}
            </span>
            {/* Bar */}
            <div className="w-full relative">
              <div
                className="w-full bg-gradient-to-t from-primary-500 to-primary-300 rounded-t-lg transition-all hover:from-primary-600 hover:to-primary-400 min-h-[4px]"
                style={{ height: `${Math.max((item.revenue / maxRevenue) * 120, 4)}px` }}
              />
              {/* Company count badge */}
              {item.companies > 0 && (
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 -translate-y-full">
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-500 text-white text-[10px] font-bold">
                    {item.companies}
                  </span>
                </div>
              )}
            </div>
            {/* Month label */}
            <span className="text-xs text-gray-500 font-medium">{item.month}</span>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-primary-500" />
          <span className="text-xs text-gray-500">Tushum</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <span className="text-xs text-gray-500">Yangi kompaniyalar</span>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-100">
        <div className="text-center">
          <p className="text-lg font-bold text-gray-900">
            {formatCurrency(data.reduce((s, d) => s + d.revenue, 0))}
          </p>
          <p className="text-xs text-gray-500">6 oylik tushum</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-gray-900">
            {data.reduce((s, d) => s + d.companies, 0)}
          </p>
          <p className="text-xs text-gray-500">Yangi kompaniyalar</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-gray-900">
            {data.length > 0 ? formatCurrency(data.reduce((s, d) => s + d.revenue, 0) / data.length) : "0"}
          </p>
          <p className="text-xs text-gray-500">O'rtacha oylik</p>
        </div>
      </div>
    </div>
  );
}

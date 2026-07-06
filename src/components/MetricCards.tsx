import { DashboardStats } from "../types";
import { formatCurrency } from "../utils";
import { TrendingUp, ShoppingBag, DollarSign, Award } from "lucide-react";

interface MetricCardsProps {
  stats: DashboardStats;
}

export default function MetricCards({ stats }: MetricCardsProps) {
  const cards = [
    {
      label: "Total Revenue",
      value: formatCurrency(stats.totalRevenue),
      subtext: "Sum of filtered transactions",
      icon: DollarSign,
      textColor: "text-indigo-600",
      bgColor: "bg-indigo-50",
      borderColor: "border-indigo-100",
      gradient: "from-indigo-500/5 to-indigo-600/0",
    },
    {
      label: "Total Transactions",
      value: stats.totalOrders.toLocaleString(),
      subtext: "Filtered order volume",
      icon: ShoppingBag,
      textColor: "text-emerald-600",
      bgColor: "bg-emerald-50",
      borderColor: "border-emerald-100",
      gradient: "from-emerald-500/5 to-emerald-600/0",
    },
    {
      label: "Average Order Value",
      value: formatCurrency(stats.averageOrderValue),
      subtext: "Mean revenue per transaction",
      icon: TrendingUp,
      textColor: "text-amber-600",
      bgColor: "bg-amber-50",
      borderColor: "border-amber-100",
      gradient: "from-amber-500/5 to-amber-600/0",
    },
    {
      label: "Top Selling Product",
      value: stats.topProduct,
      subtext: "Most recurring filtered item",
      icon: Award,
      textColor: "text-violet-600",
      bgColor: "bg-violet-50",
      borderColor: "border-violet-100",
      gradient: "from-violet-500/5 to-violet-600/0",
      isCompact: true,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {cards.map((card, i) => {
        const IconComponent = card.icon;
        return (
          <div
            key={i}
            className={`relative overflow-hidden bg-white rounded-2xl border border-slate-100 p-5 shadow-xs transition hover:translate-y-[-2px] hover:shadow-md duration-300`}
          >
            {/* Subtle Gradient Spot */}
            <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient}`} />

            <div className="relative flex items-center justify-between gap-3">
              <div className="space-y-1">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest block">
                  {card.label}
                </span>
                <span
                  className={`text-xl font-bold text-slate-800 tracking-tight block ${
                    card.isCompact && card.value.length > 20 ? "text-sm leading-6" : ""
                  }`}
                >
                  {card.value}
                </span>
              </div>

              <div className={`p-3 rounded-xl ${card.bgColor} ${card.textColor} shrink-0`}>
                <IconComponent className="w-5 h-5" />
              </div>
            </div>

            <div className="relative mt-4 pt-3 border-t border-slate-50 flex items-center justify-between text-xs text-slate-400">
              <span>{card.subtext}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

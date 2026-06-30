"use client";

import { useMemo } from "react";
import { Receipt, Camera, Frame, Plus, Check } from "lucide-react";

interface PriceCalculatorProps {
  basePrice?: number;
  extraFrameFee?: number;
  frameName?: string;
  frameCategory?: string;
  frameFee?: number;
  compositionCount?: number;
  additionalFees?: { name: string; amount: number }[];
  onConfirm?: () => void;
  confirmLabel?: string;
  isConfirmed?: boolean;
}

export function PriceCalculator({
  basePrice = 0,
  extraFrameFee = 0,
  frameName,
  frameCategory,
  frameFee = 0,
  compositionCount = 1,
  additionalFees = [],
  onConfirm,
  confirmLabel = "Konfirmasi",
  isConfirmed = false,
}: PriceCalculatorProps) {
  const pricing = useMemo(() => {
    const frameTotal = frameFee * compositionCount;
    const extraFeeTotal = extraFrameFee;
    const additionalTotal = additionalFees.reduce((sum, f) => sum + f.amount, 0);
    const total = basePrice + frameTotal + extraFeeTotal + additionalTotal;

    return {
      basePrice,
      frameTotal,
      frameFee,
      compositionCount,
      extraFeeTotal,
      additionalTotal,
      additionalFees,
      total,
    };
  }, [basePrice, extraFrameFee, frameFee, compositionCount, additionalFees]);

  return (
    <div className="bg-cream-card rounded-2xl border border-amber/10 shadow-lg overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 bg-gradient-to-r from-espresso to-mahogany flex items-center gap-3">
        <Receipt className="w-5 h-5 text-amber" />
        <div>
          <h3 className="text-cream font-bold text-sm">Ringkasan Harga</h3>
          <p className="text-cream/60 text-[10px]">Estimasi total biaya</p>
        </div>
      </div>

      {/* Price Breakdown */}
      <div className="p-5 space-y-3">
        {/* Base Price */}
        <div className="flex justify-between items-center text-sm">
          <div className="flex items-center gap-2 text-mahogany/60">
            <Camera className="w-4 h-4" />
            <span>Biaya Dasar</span>
          </div>
          <span className="font-semibold text-espresso">
            Rp {pricing.basePrice.toLocaleString("id-ID")}
          </span>
        </div>

        {/* Frame Fee */}
        {frameFee > 0 && (
          <div className="flex justify-between items-center text-sm">
            <div className="flex items-center gap-2 text-mahogany/60">
              <Frame className="w-4 h-4" />
              <span>
                {frameName || "Frame"} {frameCategory && `(${frameCategory})`}
                {compositionCount > 1 && ` × ${compositionCount}`}
              </span>
            </div>
            <span className="font-semibold text-espresso">
              Rp {pricing.frameTotal.toLocaleString("id-ID")}
            </span>
          </div>
        )}

        {/* Extra Frame Fee */}
        {extraFrameFee > 0 && (
          <div className="flex justify-between items-center text-sm">
            <div className="flex items-center gap-2 text-mahogany/60">
              <Plus className="w-4 h-4" />
              <span>Biaya Frame Tambahan</span>
            </div>
            <span className="font-semibold text-espresso">
              Rp {pricing.extraFeeTotal.toLocaleString("id-ID")}
            </span>
          </div>
        )}

        {/* Additional Fees */}
        {pricing.additionalFees.map((fee, idx) => (
          <div key={idx} className="flex justify-between items-center text-sm">
            <div className="flex items-center gap-2 text-mahogany/60">
              <Plus className="w-4 h-4" />
              <span>{fee.name}</span>
            </div>
            <span className="font-semibold text-espresso">
              Rp {fee.amount.toLocaleString("id-ID")}
            </span>
          </div>
        ))}

        {/* Divider */}
        <div className="border-t border-amber/10 pt-3 mt-3" />

        {/* Total */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-espresso">Total</span>
            {isConfirmed && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-50 text-green-600 rounded-full text-[10px] font-semibold">
                <Check className="w-3 h-3" />
                Dikonfirmasi
              </span>
            )}
          </div>
          <span className="text-xl font-black text-amber">
            Rp {pricing.total.toLocaleString("id-ID")}
          </span>
        </div>
      </div>

      {/* Confirm Button */}
      {onConfirm && (
        <div className="px-5 pb-5">
          <button
            onClick={onConfirm}
            disabled={isConfirmed}
            className={`w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all duration-200 ${
              isConfirmed
                ? "bg-green-50 text-green-600 cursor-default"
                : "bg-espresso text-cream hover:bg-mahogany shadow-lg shadow-espresso/10 hover:shadow-xl hover:shadow-espresso/20 hover:-translate-y-0.5 active:scale-[0.98]"
            }`}
          >
            {isConfirmed ? (
              <>
                <Check className="w-4 h-4" />
                {confirmLabel} ✓
              </>
            ) : (
              confirmLabel
            )}
          </button>
        </div>
      )}
    </div>
  );
}

// Mini price badge for display next to frames
interface PriceBadgeProps {
  fee: number;
  size?: "sm" | "md";
}

export function PriceBadge({ fee, size = "md" }: PriceBadgeProps) {
  if (fee <= 0) return null;

  return (
    <div
      className={`inline-flex items-center gap-1 bg-amber/10 text-amber rounded-full font-semibold ${
        size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-3 py-1 text-xs"
      }`}
    >
      +Rp {fee.toLocaleString("id-ID")}
    </div>
  );
}

// Session pricing summary
interface SessionPricingProps {
  session: {
    basePrice: number;
    extraFrameFee: number;
    compositionCount: number;
    compositions?: Array<{
      frame: { name: string; additionalFee: number; category: string };
    }>;
  };
}

export function SessionPricing({ session }: SessionPricingProps) {
  const total = useMemo(() => {
    const basePrice = session.basePrice || 0;
    const extraFee = session.extraFrameFee || 0;
    const framesTotal = session.compositions?.reduce(
      (sum, c) => sum + (c.frame?.additionalFee || 0),
      0
    ) || 0;
    return basePrice + extraFee + framesTotal;
  }, [session]);

  return (
    <div className="flex items-center gap-4">
      <div className="text-right">
        <div className="text-[10px] text-mahogany/40 uppercase tracking-wider">Total</div>
        <div className="text-lg font-black text-amber">
          Rp {total.toLocaleString("id-ID")}
        </div>
      </div>
    </div>
  );
}

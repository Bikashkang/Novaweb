"use client";
import type { PaymentStatus } from "@/lib/payments/payments";
import { formatAmount } from "@/lib/payments/pricing";

type PaymentStatusProps = {
  status: PaymentStatus;
  amount?: number | null;
  currency?: string | null;
  refundAmount?: number | null;
};

export function PaymentStatusBadge({
  status,
  amount,
  currency,
  refundAmount,
}: PaymentStatusProps) {
  const getStatusStyles = () => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-700";
      case "pending":
        return "bg-yellow-100 text-yellow-700";
      case "failed":
        return "bg-red-100 text-red-700";
      case "refunded":
        return "bg-slate-100 text-slate-700";
      case "partial_refund":
        return "bg-blue-100 text-blue-700";
      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  const getStatusText = () => {
    switch (status) {
      case "paid":
        return "Paid";
      case "pending":
        return "Payment Pending";
      case "failed":
        return "Payment Failed";
      case "refunded":
        return "Refunded";
      case "partial_refund":
        return "Partially Refunded";
      default:
        return status;
    }
  };

  return (
    <div className="flex items-center gap-2">
      <span className={`inline-block rounded-full px-2 py-1 text-xs font-medium ${getStatusStyles()}`}>
        {getStatusText()}
      </span>
      {amount && status === "paid" && (
        <span className="text-sm text-slate-600">
          {formatAmount(amount, currency || "INR")}
        </span>
      )}
      {refundAmount && (status === "refunded" || status === "partial_refund") && (
        <span className="text-sm text-slate-600">
          Refunded: {formatAmount(refundAmount, currency || "INR")}
        </span>
      )}
    </div>
  );
}

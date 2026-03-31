import { cn } from "@/lib/utils";

type Status = "draft" | "submitted" | "approved" | "disputed";

const labels: Record<Status, string> = {
  draft: "مسودة",
  submitted: "مُرسل",
  approved: "مُعتمد",
  disputed: "خلاف",
};

const styles: Record<Status, string> = {
  draft: "bg-gray-100 text-gray-700 border-gray-300",
  submitted: "bg-blue-100 text-blue-700 border-blue-300",
  approved: "bg-green-100 text-green-700 border-green-300",
  disputed: "bg-red-100 text-red-700 border-red-300",
};

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const s = status as Status;
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border",
        styles[s] ?? "bg-gray-100 text-gray-700 border-gray-300",
        className
      )}
    >
      {labels[s] ?? status}
    </span>
  );
}

import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Clock } from "lucide-react";

interface StatusBadgeProps {
  status: "success" | "failed" | "pending";
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = {
    success: {
      label: "Success",
      icon: CheckCircle,
      className: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20",
    },
    failed: {
      label: "Failed",
      icon: XCircle,
      className: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
    },
    pending: {
      label: "Pending",
      icon: Clock,
      className: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20",
    },
  };

  const { label, icon: Icon, className } = config[status];

  return (
    <Badge className={className} data-testid={`badge-status-${status}`}>
      <Icon className="h-3 w-3 mr-1" />
      {label}
    </Badge>
  );
}

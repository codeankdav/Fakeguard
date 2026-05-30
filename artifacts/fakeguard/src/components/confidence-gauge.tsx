import { Progress } from "@/components/ui/progress";

interface ConfidenceGaugeProps {
  score: number; // 0 to 1
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function ConfidenceGauge({ score, className = "", size = "md" }: ConfidenceGaugeProps) {
  const percentage = Math.round(score * 100);
  
  let colorClass = "bg-primary";
  if (percentage >= 80) colorClass = "bg-green-500";
  else if (percentage <= 40) colorClass = "bg-destructive";
  else colorClass = "bg-amber-500";

  const heightClass = size === "sm" ? "h-2" : size === "md" ? "h-3" : "h-4";
  const textClass = size === "sm" ? "text-xs" : size === "md" ? "text-sm" : "text-base font-bold";

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <div className="flex justify-between items-center">
        <span className="text-muted-foreground text-xs font-mono uppercase tracking-wider">Confidence</span>
        <span className={`font-mono ${textClass}`}>{percentage}%</span>
      </div>
      <Progress value={percentage} className={`${heightClass} ${colorClass.replace('bg-', '[&>div]:bg-')}`} />
    </div>
  );
}
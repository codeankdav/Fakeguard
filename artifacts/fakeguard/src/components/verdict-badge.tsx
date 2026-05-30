import { Badge } from "@/components/ui/badge";
import { ArticleVerdict, ArticleSummaryVerdict } from "@workspace/api-client-react";

interface VerdictBadgeProps {
  verdict: ArticleVerdict | ArticleSummaryVerdict;
  className?: string;
}

export function VerdictBadge({ verdict, className }: VerdictBadgeProps) {
  let variant: "destructive" | "default" | "secondary" = "default";
  let text = "UNKNOWN";

  if (verdict === "fake") {
    variant = "destructive";
    text = "FAKE";
  } else if (verdict === "real") {
    variant = "default";
    text = "REAL";
  } else if (verdict === "uncertain") {
    variant = "secondary";
    text = "UNCERTAIN";
  }

  return (
    <Badge 
      variant={variant} 
      className={`font-mono font-bold tracking-wider ${
        verdict === "real" ? "bg-green-600 hover:bg-green-700 text-white" : 
        verdict === "uncertain" ? "bg-amber-500 hover:bg-amber-600 text-white" : ""
      } ${className}`}
    >
      {text}
    </Badge>
  );
}
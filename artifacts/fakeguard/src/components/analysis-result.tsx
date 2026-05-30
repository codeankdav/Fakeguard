import { Article } from "@workspace/api-client-react";
import { format } from "date-fns";
import { VerdictBadge } from "./verdict-badge";
import { ConfidenceGauge } from "./confidence-gauge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ShieldAlert, ShieldCheck, Info, FileText, Link as LinkIcon, Share2, Check, AlertTriangle, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface AnalysisResultProps {
  article: Article;
  onShare?: () => void;
  isSharing?: boolean;
}

export function AnalysisResult({ article, onShare, isSharing }: AnalysisResultProps) {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header / Summary Card */}
      <Card className="border-2 shadow-lg overflow-hidden relative">
        <div className={`absolute top-0 left-0 w-2 h-full ${
          article.verdict === 'fake' ? 'bg-destructive' : 
          article.verdict === 'real' ? 'bg-green-500' : 'bg-amber-500'
        }`} />
        <CardContent className="p-6 sm:p-8 pl-8 sm:pl-10">
          <div className="flex flex-col lg:flex-row justify-between gap-8">
            <div className="flex-1 space-y-4">
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="font-mono text-xs uppercase">Report ID: {article.id}</Badge>
                <span className="text-xs text-muted-foreground font-mono">
                  {format(new Date(article.analyzedAt), "yyyy-MM-dd HH:mm:ss 'UTC'")}
                </span>
              </div>
              
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                {article.title || "Untitled Article Analysis"}
              </h1>
              
              {article.url && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 w-fit px-3 py-1.5 rounded-md font-mono">
                  <LinkIcon className="h-4 w-4" />
                  <a href={article.url} target="_blank" rel="noopener noreferrer" className="hover:text-primary hover:underline max-w-[300px] sm:max-w-md truncate">
                    {article.url}
                  </a>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-6 lg:min-w-[250px] p-6 bg-muted/20 rounded-xl border">
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Final Verdict</h3>
                <VerdictBadge verdict={article.verdict} className="text-xl py-1.5 px-4 w-full justify-center" />
              </div>
              <Separator />
              <ConfidenceGauge score={article.confidenceScore} size="lg" />
              
              {onShare && (
                <Button 
                  variant="outline" 
                  className="w-full mt-2 gap-2" 
                  onClick={onShare}
                  disabled={isSharing}
                >
                  <Share2 className="h-4 w-4" />
                  {isSharing ? "Generating Link..." : "Share Report"}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Explanation */}
      <Card>
        <CardHeader className="bg-muted/30 pb-4">
          <div className="flex items-center gap-2">
            <Info className="h-5 w-5 text-primary" />
            <CardTitle>Executive Summary</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <p className="text-lg leading-relaxed">{article.explanation}</p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Red Flags */}
        <Card className="border-destructive/20 shadow-sm">
          <CardHeader className="bg-destructive/5 pb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <CardTitle>Red Flags</CardTitle>
            </div>
            <CardDescription>Negative indicators found in the text.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {article.redFlags.length > 0 ? (
              <ul className="space-y-3">
                {article.redFlags.map((flag, i) => (
                  <li key={i} className="flex gap-3 text-sm">
                    <ShieldAlert className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                    <span>{flag}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground italic">No significant red flags detected.</p>
            )}
          </CardContent>
        </Card>

        {/* Positive Indicators */}
        <Card className="border-green-500/20 shadow-sm">
          <CardHeader className="bg-green-500/5 pb-4">
            <div className="flex items-center gap-2">
              <Check className="h-5 w-5 text-green-500" />
              <CardTitle>Positive Indicators</CardTitle>
            </div>
            <CardDescription>Signs of credibility and rigorous reporting.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {article.positiveIndicators.length > 0 ? (
              <ul className="space-y-3">
                {article.positiveIndicators.map((indicator, i) => (
                  <li key={i} className="flex gap-3 text-sm">
                    <ShieldCheck className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                    <span>{indicator}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground italic">No strong positive indicators detected.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Evidence Base */}
      <Card>
        <CardHeader className="bg-muted/30 pb-4">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <CardTitle>Supporting Evidence</CardTitle>
          </div>
          <CardDescription>Specific claims and their factual assessment.</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          {article.evidence.length > 0 ? (
            <ul className="space-y-4">
              {article.evidence.map((item, i) => (
                <li key={i} className="flex gap-3 p-4 rounded-lg bg-muted/30 border">
                  <Lightbulb className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                  <span className="text-sm leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground italic">No specific evidence points extracted.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
import { useGetStatsOverview, useGetRecentAnalyses, getGetStatsOverviewQueryKey, getGetRecentAnalysesQueryKey } from "@workspace/api-client-react";
import { ShieldCheck, Activity, CheckCircle, AlertTriangle, HelpCircle, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { VerdictBadge } from "@/components/verdict-badge";
import { ConfidenceGauge } from "@/components/confidence-gauge";
import { Header } from "@/components/layout/header";
import { Link } from "wouter";
import { formatDistanceToNow } from "date-fns";

export default function Home() {
  const { data: stats, isLoading: statsLoading } = useGetStatsOverview({
    query: { queryKey: getGetStatsOverviewQueryKey() }
  });
  const normalizedStats = {
    totalAnalyzed: stats?.totalAnalyzed ?? 0,
    analyzedToday: stats?.analyzedToday ?? 0,
    realCount: stats?.realCount ?? 0,
    fakeCount: stats?.fakeCount ?? 0,
    uncertainCount: stats?.uncertainCount ?? 0,
  };

  const { data: recent, isLoading: recentLoading } = useGetRecentAnalyses(
    { limit: 5 },
    { query: { queryKey: getGetRecentAnalysesQueryKey({ limit: 5 }) } }
  );
  const recentAnalyses = Array.isArray(recent) ? recent : [];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-20 md:py-32 relative overflow-hidden">
          <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:32px_32px]" />
          <div className="absolute inset-0 bg-gradient-to-b from-background via-background/90 to-background" />
          
          <div className="container relative z-10 mx-auto px-4 text-center max-w-4xl">
            <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground mb-6">
              Precision Credibility Verification
            </div>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tighter mb-6">
              Distinguish <span className="text-primary">Fact</span> from Fiction.
            </h1>
            <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
              FakeGuard is a professional-grade analytical instrument for journalists, researchers, and truth-seekers to verify the credibility of news articles with AI-powered forensic analysis.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link href="/sign-up">
                <Button size="lg" className="h-12 px-8 text-base gap-2">
                  Start Analyzing <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button size="lg" variant="outline" className="h-12 px-8 text-base">
                  Go to Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-16 bg-muted/30 border-y">
          <div className="container mx-auto px-4">
            <div className="mb-10 flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold tracking-tight">Platform Metrics</h2>
                <p className="text-muted-foreground mt-2">Real-time aggregate analysis data.</p>
              </div>
            </div>

            {statsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 w-full" />)}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Analyzed</CardTitle>
                    <Activity className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold font-mono">{normalizedStats.totalAnalyzed.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      +{normalizedStats.analyzedToday} today
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Real Articles</CardTitle>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold font-mono text-green-500">{normalizedStats.realCount.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {Math.round((normalizedStats.realCount / Math.max(normalizedStats.totalAnalyzed, 1)) * 100)}% of total
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Fake Articles</CardTitle>
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold font-mono text-destructive">{normalizedStats.fakeCount.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {Math.round((normalizedStats.fakeCount / Math.max(normalizedStats.totalAnalyzed, 1)) * 100)}% of total
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Uncertain</CardTitle>
                    <HelpCircle className="h-4 w-4 text-amber-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold font-mono text-amber-500">{normalizedStats.uncertainCount.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {Math.round((normalizedStats.uncertainCount / Math.max(normalizedStats.totalAnalyzed, 1)) * 100)}% of total
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </section>

        {/* Recent Analyses Section */}
        <section className="py-20">
          <div className="container mx-auto px-4 max-w-5xl">
            <div className="mb-10 text-center">
              <h2 className="text-3xl font-bold tracking-tight">Recent Analyses</h2>
              <p className="text-muted-foreground mt-2">The latest articles processed by FakeGuard.</p>
            </div>

            {recentLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full" />)}
              </div>
            ) : recentAnalyses.length > 0 ? (
              <div className="space-y-4">
                {recentAnalyses.map((article) => (
                  <Card key={article.id} className="overflow-hidden hover:border-primary/50 transition-colors">
                    <CardContent className="p-0">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-5">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-lg truncate mb-1" title={article.title || "Untitled Article"}>
                            {article.title || "Untitled Article"}
                          </h3>
                          {article.url && (
                            <a href={article.url} target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:text-primary truncate block mb-2">
                              {new URL(article.url).hostname}
                            </a>
                          )}
                          <div className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(article.analyzedAt), { addSuffix: true })}
                          </div>
                        </div>
                        <div className="flex sm:flex-col items-center sm:items-end gap-4 sm:gap-2 w-full sm:w-auto mt-4 sm:mt-0 pt-4 sm:pt-0 border-t sm:border-0 border-border">
                          <VerdictBadge verdict={article.verdict} />
                          <ConfidenceGauge score={article.confidenceScore} size="sm" className="w-32" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 border rounded-lg bg-muted/20">
                <p className="text-muted-foreground">No recent analyses found.</p>
              </div>
            )}
          </div>
        </section>
      </main>
      
      <footer className="border-t py-8 bg-card">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2 font-bold text-foreground">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <span>FakeGuard</span>
          </div>
          <p>© {new Date().getFullYear()} FakeGuard. A professional credibility instrument.</p>
        </div>
      </footer>
    </div>
  );
}

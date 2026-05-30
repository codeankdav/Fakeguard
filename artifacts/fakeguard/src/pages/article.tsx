import { useRoute, useLocation } from "wouter";
import { useGetArticle, useShareArticle, getGetArticleQueryKey } from "@workspace/api-client-react";
import { AnalysisResult } from "@/components/analysis-result";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function ArticlePage() {
  const [, params] = useRoute("/articles/:id");
  const articleId = params?.id ? parseInt(params.id, 10) : 0;
  const { toast } = useToast();

  const { data: article, isLoading, isError } = useGetArticle(
    articleId,
    { query: { enabled: !!articleId, queryKey: getGetArticleQueryKey(articleId) } }
  );

  const shareMutation = useShareArticle({
    mutation: {
      onSuccess: (data) => {
        navigator.clipboard.writeText(data.shareUrl);
        toast({
          title: "Link Copied!",
          description: "A public share link has been copied to your clipboard.",
        });
      },
      onError: () => {
        toast({
          title: "Sharing failed",
          description: "Could not generate share link.",
          variant: "destructive"
        });
      }
    }
  });

  const handleShare = () => {
    shareMutation.mutate({ id: articleId });
  };

  if (isLoading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-10 w-24 bg-muted rounded-md mb-6" />
        <Skeleton className="h-64 w-full rounded-xl" />
        <Skeleton className="h-48 w-full rounded-xl" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Skeleton className="h-64 w-full rounded-xl" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (isError || !article) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold mb-2">Analysis Not Found</h2>
        <p className="text-muted-foreground mb-6">The record you are looking for does not exist or you don't have access.</p>
        <Link href="/dashboard">
          <Button>Return to Dashboard</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <Link href="/dashboard">
        <Button variant="ghost" size="sm" className="gap-2 mb-2 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Button>
      </Link>
      <AnalysisResult 
        article={article} 
        onShare={handleShare} 
        isSharing={shareMutation.isPending} 
      />
    </div>
  );
}
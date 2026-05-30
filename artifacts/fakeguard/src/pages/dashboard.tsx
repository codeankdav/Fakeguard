import { useState } from "react";
import { Link } from "wouter";
import { useListArticles, useDeleteArticle, getListArticlesQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Trash2, ExternalLink, Search, FileText, Shield } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { VerdictBadge } from "@/components/verdict-badge";
import { ConfidenceGauge } from "@/components/confidence-gauge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";

export default function Dashboard() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");

  const { data: articles, isLoading } = useListArticles(
    {}, 
    { query: { queryKey: getListArticlesQueryKey({}) } }
  );

  const deleteMutation = useDeleteArticle({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListArticlesQueryKey({}) });
        toast({ title: "Article deleted", description: "The analysis record has been removed." });
      },
      onError: () => {
        toast({ title: "Error", description: "Failed to delete article.", variant: "destructive" });
      }
    }
  });

  const filteredArticles = articles?.filter(a => 
    (a.title?.toLowerCase().includes(searchTerm.toLowerCase()) || '') || 
    (a.url?.toLowerCase().includes(searchTerm.toLowerCase()) || '')
  ) || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Your analysis history and records.</p>
        </div>
        <Link href="/analyze">
          <Button className="gap-2">
            <Search className="h-4 w-4" />
            New Analysis
          </Button>
        </Link>
      </div>

      <div className="flex items-center gap-2 max-w-sm">
        <Search className="h-4 w-4 text-muted-foreground absolute ml-3" />
        <Input 
          placeholder="Search history..." 
          className="pl-9"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 w-full" />)}
        </div>
      ) : filteredArticles.length > 0 ? (
        <div className="grid grid-cols-1 gap-4">
          {filteredArticles.map((article) => (
            <Card key={article.id} className="overflow-hidden transition-all hover:border-primary/40 group">
              <CardContent className="p-0">
                <div className="flex flex-col md:flex-row gap-4 p-5">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-semibold text-lg line-clamp-1" title={article.title || "Untitled"}>
                        {article.title || "Untitled Article"}
                      </h3>
                      <VerdictBadge verdict={article.verdict} className="md:hidden" />
                    </div>
                    
                    {article.url ? (
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-3">
                        <ExternalLink className="h-3.5 w-3.5" />
                        <a href={article.url} target="_blank" rel="noopener noreferrer" className="hover:text-primary truncate">
                          {article.url}
                        </a>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-3">
                        <FileText className="h-3.5 w-3.5" />
                        <span className="truncate">Direct text input</span>
                      </div>
                    )}

                    <div className="flex items-center gap-4 text-xs text-muted-foreground font-mono">
                      <span>ID: {article.id}</span>
                      <span>•</span>
                      <span>{format(new Date(article.analyzedAt), "MMM d, yyyy HH:mm")}</span>
                    </div>
                  </div>

                  <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-4 md:w-48 md:border-l pl-0 md:pl-4 pt-4 md:pt-0 border-t md:border-t-0 border-border">
                    <div className="hidden md:block w-full text-right mb-2">
                      <VerdictBadge verdict={article.verdict} />
                    </div>
                    
                    <ConfidenceGauge score={article.confidenceScore} size="sm" className="w-32 md:w-full mb-0 md:mb-2" />
                    
                    <div className="flex items-center gap-2 md:w-full md:justify-end">
                      <Link href={`/articles/${article.id}`}>
                        <Button variant="secondary" size="sm" className="w-full md:w-auto">
                          View
                        </Button>
                      </Link>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive shrink-0">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete analysis record?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will permanently delete the analysis record for "{article.title || "this article"}".
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => deleteMutation.mutate({ id: article.id })}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 border rounded-xl bg-card/50">
          <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-medium mb-2">No records found</h3>
          <p className="text-muted-foreground max-w-sm mx-auto mb-6">
            {searchTerm ? "No articles match your search." : "You haven't analyzed any articles yet."}
          </p>
          {!searchTerm && (
            <Link href="/analyze">
              <Button>Start Analysis</Button>
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
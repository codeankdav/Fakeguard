import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAnalyzeArticle } from "@workspace/api-client-react";
import { Loader2, Link as LinkIcon, FileText, AlertCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";

function normalizeUrlInput(value: unknown) {
  if (typeof value !== "string") return value;

  const trimmed = value.trim();
  if (trimmed === "") return "";
  if (/^[a-z][a-z\d+\-.]*:\/\//i.test(trimmed)) return trimmed;
  if (/\s/.test(trimmed) || trimmed.includes("@")) return trimmed;
  if (!/^([a-z\d-]+\.)+[a-z]{2,}([/:?#].*)?$/i.test(trimmed)) return trimmed;

  return `https://${trimmed}`;
}

const articleUrlSchema = z.string().url("Enter a valid article URL.").superRefine((value, ctx) => {
  if (value === "") return;

  const parsed = new URL(value);
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Article URL must start with http:// or https://.",
    });
  }
  if (parsed.username || parsed.password) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Article URL cannot include credentials.",
    });
  }
});

const analyzeSchema = z.object({
  title: z.string().optional(),
  type: z.enum(["url", "text"]),
  url: z.preprocess(
    normalizeUrlInput,
    articleUrlSchema.optional().or(z.literal("")),
  ),
  content: z.string().min(50, "Content must be at least 50 characters").optional().or(z.literal("")),
}).refine(data => {
  if (data.type === "url" && (!data.url || data.url.trim() === "")) return false;
  if (data.type === "text" && (!data.content || data.content.trim() === "")) return false;
  return true;
}, {
  message: "Please provide either a URL or text content based on selected type.",
  path: ["url"] // default error path
});

export default function Analyze() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"url" | "text">("url");

  const form = useForm<z.infer<typeof analyzeSchema>>({
    resolver: zodResolver(analyzeSchema),
    defaultValues: {
      title: "",
      type: "url",
      url: "",
      content: "",
    },
  });

  const analyzeMutation = useAnalyzeArticle({
    mutation: {
      onSuccess: (data) => {
        toast({ title: "Analysis complete", description: "Redirecting to results..." });
        setLocation(`/articles/${data.id}`);
      },
      onError: (error) => {
        toast({ 
          title: "Analysis failed", 
          description: error.data?.error || "An unexpected error occurred during analysis.", 
          variant: "destructive" 
        });
      }
    }
  });

  function onSubmit(values: z.infer<typeof analyzeSchema>) {
    analyzeMutation.mutate({
      data: {
        title: values.title?.trim() || undefined,
        ...(values.type === "url"
          ? { url: values.url }
          : { content: values.content?.trim() }),
      }
    });
  }

  const handleTabChange = (val: string) => {
    const newType = val as "url" | "text";
    setActiveTab(newType);
    form.setValue("type", newType);
    form.clearErrors();
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">New Analysis</h1>
        <p className="text-muted-foreground mt-1">Submit an article URL or text for AI credibility verification.</p>
      </div>

      <Card className="border-border shadow-md">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardHeader>
              <CardTitle>Article Details</CardTitle>
              <CardDescription>
                Provide the source material for forensic analysis.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter article headline..." {...field} className="font-mono text-sm" />
                    </FormControl>
                    <FormDescription>
                      Helps identify the record in your dashboard.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-3">
                <label className="text-sm font-medium leading-none">Source Material</label>
                <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="url" className="gap-2">
                      <LinkIcon className="h-4 w-4" /> URL
                    </TabsTrigger>
                    <TabsTrigger value="text" className="gap-2">
                      <FileText className="h-4 w-4" /> Direct Text
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="url" className="pt-4">
                    <FormField
                      control={form.control}
                      name="url"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input placeholder="https://example.com/article..." {...field} className="font-mono text-sm" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </TabsContent>
                  <TabsContent value="text" className="pt-4">
                    <FormField
                      control={form.control}
                      name="content"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Textarea 
                              placeholder="Paste the full text of the article here..." 
                              className="min-h-[250px] font-mono text-sm resize-y" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </TabsContent>
                </Tabs>
              </div>

              {analyzeMutation.isPending && (
                <Alert className="bg-primary/5 border-primary/20">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <AlertDescription className="ml-2 font-mono text-sm">
                    Forensic AI engine is running. Processing linguistic patterns, verifying claims, and computing confidence score...
                  </AlertDescription>
                </Alert>
              )}
              
              {form.formState.errors.root && (
                 <Alert variant="destructive">
                 <AlertCircle className="h-4 w-4" />
                 <AlertDescription>
                   {form.formState.errors.root.message}
                 </AlertDescription>
               </Alert>
              )}
            </CardContent>
            <CardFooter className="bg-muted/30 pt-6">
              <Button 
                type="submit" 
                size="lg" 
                className="w-full font-bold tracking-wide" 
                disabled={analyzeMutation.isPending}
                data-testid="button-analyze-submit"
              >
                {analyzeMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    ANALYZING...
                  </>
                ) : (
                  "INITIATE ANALYSIS"
                )}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}

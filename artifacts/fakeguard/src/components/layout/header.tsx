import { Link } from "wouter";
import { ShieldCheck, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between">
        <Link href="/">
          <div className="flex items-center gap-2 font-bold text-lg tracking-tight cursor-pointer">
            <ShieldCheck className="h-6 w-6 text-primary" />
            <span>FakeGuard</span>
          </div>
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/sign-in">
            <Button variant="ghost" className="hidden sm:flex">Sign In</Button>
          </Link>
          <Link href="/sign-up">
            <Button className="gap-2">
              Get Started <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
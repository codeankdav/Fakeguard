import { Link, useLocation } from "wouter";
import { useClerk, useUser } from "@clerk/react";
import { 
  LayoutDashboard, 
  Search, 
  LogOut, 
  ShieldCheck, 
  Menu,
  Moon,
  Sun
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/theme-provider";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { signOut } = useClerk();
  const { user } = useUser();
  const { theme, setTheme } = useTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/analyze", label: "Analyze", icon: Search },
  ];

  const handleSignOut = () => {
    signOut({ redirectUrl: import.meta.env.BASE_URL.replace(/\/$/, "") || "/" });
  };

  const NavLinks = () => (
    <>
      {navItems.map((item) => {
        const isActive = location === item.href;
        return (
          <Link key={item.href} href={item.href}>
            <div
              className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors cursor-pointer ${
                isActive 
                  ? "bg-primary text-primary-foreground font-medium" 
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <item.icon className="h-4 w-4" />
              <span>{item.label}</span>
            </div>
          </Link>
        );
      })}
    </>
  );

  return (
    <div className="flex min-h-[100dvh] w-full flex-col bg-background md:flex-row">
      {/* Mobile Header */}
      <header className="flex h-14 items-center justify-between border-b bg-card px-4 md:hidden">
        <Link href="/">
          <div className="flex items-center gap-2 font-bold text-lg tracking-tight cursor-pointer">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <span>FakeGuard</span>
          </div>
        </Link>
        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle Menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 sm:max-w-xs flex flex-col gap-6">
            <div className="flex items-center gap-2 font-bold text-lg tracking-tight pt-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <span>FakeGuard</span>
            </div>
            <nav className="flex flex-col gap-2 flex-1">
              <NavLinks />
            </nav>
            <div className="border-t pt-4 flex flex-col gap-4">
              <div className="flex items-center gap-3 px-3">
                <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                  {user?.firstName?.charAt(0) || user?.emailAddresses[0]?.emailAddress?.charAt(0) || "U"}
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium leading-none">{user?.fullName || "User"}</span>
                  <span className="text-xs text-muted-foreground max-w-[150px] truncate">{user?.primaryEmailAddress?.emailAddress}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1 justify-start gap-2" onClick={handleSignOut}>
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </Button>
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                >
                  {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </header>

      {/* Desktop Sidebar */}
      <aside className="hidden w-64 flex-col border-r bg-card md:flex">
        <div className="flex h-14 items-center border-b px-6">
          <Link href="/">
            <div className="flex items-center gap-2 font-bold text-lg tracking-tight cursor-pointer">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <span>FakeGuard</span>
            </div>
          </Link>
        </div>
        <div className="flex-1 overflow-auto py-4">
          <nav className="flex flex-col gap-1 px-3">
            <NavLinks />
          </nav>
        </div>
        <div className="border-t p-4 flex flex-col gap-4">
          <div className="flex items-center gap-3 px-2">
            <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold uppercase">
              {user?.firstName?.charAt(0) || user?.emailAddresses[0]?.emailAddress?.charAt(0) || "U"}
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium leading-none truncate max-w-[140px]">{user?.fullName || "User"}</span>
              <span className="text-xs text-muted-foreground truncate max-w-[140px]">{user?.primaryEmailAddress?.emailAddress}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="flex-1 justify-start gap-2 h-9" onClick={handleSignOut} data-testid="button-signout">
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
            <Button 
              variant="outline" 
              size="icon" 
              className="h-9 w-9"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto bg-background/50">
        <div className="container mx-auto p-4 md:p-8 max-w-6xl">
          {children}
        </div>
      </main>
    </div>
  );
}
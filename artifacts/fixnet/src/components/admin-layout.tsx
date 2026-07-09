import React, { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { 
  BarChart3, 
  LayoutDashboard, 
  LogOut, 
  Menu,
  Package, 
  Settings
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useGetAdminSession, useAdminLogout } from "@workspace/api-client-react";
import fixnetLogo from "@assets/generated_images/fixnet-logo.png";

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const [, setLocation] = useLocation();
  const { data: session, isLoading } = useGetAdminSession();
  const logout = useAdminLogout();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && (!session || !session.authenticated)) {
      setLocation("/admin/login");
    }
  }, [session, isLoading, setLocation]);

  if (isLoading || !session?.authenticated) {
    return <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="animate-pulse w-8 h-8 rounded-full bg-primary/50"></div>
    </div>;
  }

  const handleLogout = () => {
    logout.mutate(undefined, {
      onSuccess: () => {
        setLocation("/admin/login");
      }
    });
  };

  const NavLinks = () => (
    <>
      <Link href="/admin">
        <Button variant="ghost" className="w-full justify-start text-left" onClick={() => setMobileMenuOpen(false)}>
          <LayoutDashboard className="mr-2 h-4 w-4" />
          Dashboard
        </Button>
      </Link>
      <Link href="/admin/bundles">
        <Button variant="ghost" className="w-full justify-start text-left" onClick={() => setMobileMenuOpen(false)}>
          <Package className="mr-2 h-4 w-4" />
          Bundles
        </Button>
      </Link>
    </>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Mobile header */}
      <div className="md:hidden flex items-center justify-between p-4 border-b border-border bg-card">
        <div className="flex items-center gap-2 font-mono font-bold text-lg text-primary tracking-tighter">
          <img src={fixnetLogo} alt="FixNet" className="w-6 h-6" />
          FIXNET<span className="text-foreground">/ADMIN</span>
        </div>
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[240px] flex flex-col pt-10">
            <div className="flex-1 flex flex-col gap-2">
              <NavLinks />
            </div>
            <div className="pt-4 border-t border-border mt-auto">
              <Button 
                variant="destructive" 
                className="w-full justify-start" 
                onClick={handleLogout}
                disabled={logout.isPending}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r border-border bg-card">
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-2 font-mono font-bold text-xl text-primary tracking-tighter">
            <img src={fixnetLogo} alt="FixNet" className="w-7 h-7" />
            FIXNET<span className="text-foreground">/ADMIN</span>
          </div>
        </div>
        <div className="flex-1 p-4 flex flex-col gap-2">
          <NavLinks />
        </div>
        <div className="p-4 border-t border-border">
          <Button 
            variant="destructive" 
            className="w-full justify-start" 
            onClick={handleLogout}
            disabled={logout.isPending}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col min-h-0 overflow-auto">
        {children}
      </main>
    </div>
  );
}

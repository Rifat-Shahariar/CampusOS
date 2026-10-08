"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  Calendar,
  Compass,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  User as UserIcon,
  X,
} from "lucide-react";
import { useAuth } from "@/features/auth";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
}

const navItems: NavItem[] = [
  { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { name: "Clubs", href: "/clubs", icon: Compass },
  { name: "Events", href: "/events", icon: Calendar },
  { name: "Resource Hub", href: "/resources", icon: FileText },
  { name: "Profile", href: "/profile", icon: UserIcon },
];

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-muted/20">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 border-r border-border bg-card">
        <div className="flex h-16 items-center px-5 border-b border-border space-x-3">
          <Image
            src="/city-university-logo.png"
            alt="City University Logo"
            width={36}
            height={28}
            className="h-8 w-auto object-contain shrink-0"
            priority
          />
          <div className="flex flex-col min-w-0">
            <span className="font-bold text-base tracking-tight leading-tight">CampusOS</span>
            <span className="text-[10px] text-muted-foreground truncate leading-none">City University</span>
          </div>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <Icon className="size-4 shrink-0" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Card & Logout / Sign In */}
        <div className="p-3 border-t border-border">
          {user ? (
            <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-muted/40">
              <Link
                href="/profile"
                className="flex items-center gap-3 min-w-0 flex-1 hover:opacity-80 transition-opacity"
                title="View Profile"
              >
                <div className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <UserIcon className="size-4" />
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-xs font-semibold truncate">{user.name}</span>
                  <span className="text-[10px] text-muted-foreground truncate">
                    {user.role}
                  </span>
                </div>
              </Link>
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => logout()}
                title="Sign out"
                aria-label="Sign out"
                className="text-muted-foreground hover:text-destructive cursor-pointer"
              >
                <LogOut className="size-4" />
              </Button>
            </div>
          ) : (
            <Link
              href="/login"
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "w-full justify-center text-xs font-medium cursor-pointer",
              )}
            >
              Sign In
            </Link>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 md:pl-64">
        {/* Top Header */}
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-border bg-card px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle Navigation"
            >
              {mobileMenuOpen ? (
                <X className="size-5" />
              ) : (
                <Menu className="size-5" />
              )}
            </Button>
            <div className="flex items-center gap-2 md:hidden">
              <Image
                src="/city-university-logo.png"
                alt="City University Logo"
                width={26}
                height={20}
                className="h-6 w-auto object-contain shrink-0"
              />
              <span className="text-sm font-semibold">CampusOS</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <>
                <Link
                  href="/profile"
                  className="hidden sm:inline-block text-xs text-muted-foreground hover:text-foreground transition-colors"
                  title="View Profile"
                >
                  {user.email}
                </Link>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => logout()}
                  className="gap-2 text-xs cursor-pointer"
                >
                  <LogOut className="size-3.5" />
                  <span>Logout</span>
                </Button>
              </>
            ) : (
              <Link
                href="/login"
                className={cn(
                  buttonVariants({ variant: "outline", size: "sm" }),
                  "text-xs cursor-pointer",
                )}
              >
                Sign In
              </Link>
            )}
          </div>
        </header>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-border bg-card px-4 py-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  <Icon className="size-4 shrink-0" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>
        )}

        {/* Page Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}

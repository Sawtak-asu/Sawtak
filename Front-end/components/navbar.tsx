"use client";
import { Link } from "@/i18n/navigation";
import { Logo } from "@/components/logo";
import { Menu, X, LogOut, Shield, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import React from "react";
import { cn } from "@/lib/utils";
import { ModeToggle } from "@/components/mode-toggle";
import { LanguageSwitcher } from "@/components/language-switcher";
import { useAuth } from "@/lib/auth-context";
import { usePathname } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface NavbarProps {
  variant?: "floating" | "sticky";
}

// Truncate name to first 2 words
function truncateName(name: string | null | undefined): string {
  if (!name) return "User";
  const words = name.trim().split(/\s+/);
  return words.slice(0, 2).join(" ");
}

export function Navbar({ variant = "sticky" }: NavbarProps) {
  const [menuState, setMenuState] = React.useState(false);
  const [isScrolled, setIsScrolled] = React.useState(false);
  const [hasTeamAccess, setHasTeamAccess] = React.useState(false);
  const { logout, user, isLoggedIn, isLoading, token } = useAuth();
  const pathname = usePathname();
  const t = useTranslations("Navbar");
  const tCommon = useTranslations("Common");

  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Check if user has team membership (for non-platform admins)
  React.useEffect(() => {
    const checkTeamAccess = async () => {
      if (!token || !isLoggedIn || user?.role === "platform_admin") {
        setHasTeamAccess(false);
        return;
      }

      try {
                const res = await fetch(`/api/admin/teams/my-teams`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          const teams = data.data?.teams || [];
          setHasTeamAccess(teams.length > 0);
        }
      } catch (error) {
        console.error("Failed to check team access:", error);
      }
    };

    checkTeamAccess();
  }, [token, isLoggedIn, user?.role]);

  const isFloating = variant === "floating";

  // Check if user has any admin access
  const isAnyAdmin = user?.role === "admin" || user?.role === "platform_admin" || hasTeamAccess;

  const navLinks = [
    { href: "/feed", label: t("feed") },
    { href: "/file-complaint", label: t("fileComplaint") },
    { href: "/track", label: t("track") },
    { href: "/docs", label: t("docs") },
  ];

  if (isFloating) {
    // Floating navbar for homepage
    return (
      <header dir="ltr">
        <nav
          className="fixed z-20 w-full px-2 h-[5vh]">
          <div
            className={cn(
              "mx-auto mt-2 max-w-6xl px-6 transition-all duration-300 lg:px-12",
              isScrolled ?
                "bg-background/80 max-w-4xl rounded-2xl border backdrop-blur-lg lg:px-5" : "bg-transparent"
            )}>
            <div className="flex flex-wrap items-center justify-between py-3 lg:py-4">
              <div className="flex w-full items-center justify-between lg:w-auto">
                <Link
                  href="/"
                  aria-label="home"
                  className="flex items-center space-x-2">
                  <Logo />
                </Link>

                <button
                  onClick={() => setMenuState(!menuState)}
                  className="block p-2 text-muted-foreground hover:text-foreground lg:hidden"
                  aria-label="Toggle menu"
                >
                  {menuState ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                </button>
              </div>

              <div className="hidden lg:block relative">
                <ul className="flex gap-8 text-sm font-medium" dir='auto'>
                  {navLinks.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className={cn(
                          "block duration-150 hover:text-primary",
                          pathname === link.href ? "text-foreground" : "text-muted-foreground"
                        )}>
                        <span>{link.label}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="hidden lg:flex items-center gap-4">
                {isLoading ? (
                  <div className="h-9 w-20 animate-pulse rounded-md bg-muted" />
                ) : isLoggedIn ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-xs">
                            {user?.name?.[0] || user?.email?.[0] || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <span className="hidden sm:inline">{truncateName(user?.name) || user?.email}</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <Link href="/profile">
                        <DropdownMenuItem className="flex flex-col items-start">
                          <span className="font-medium">{truncateName(user?.name)}</span>
                          <span className="text-xs text-muted-foreground">{user?.email}</span>
                        </DropdownMenuItem>
                      </Link>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href="/profile" className="flex items-center">
                          <FileText className="me-2 h-4 w-4" />
                          {t("myComplaints")}
                        </Link>
                      </DropdownMenuItem>
                      {isAnyAdmin && (
                        <DropdownMenuItem asChild>
                          <Link href="/admin" className="flex items-center">
                            <Shield className="me-2 h-4 w-4" />
                            {t("adminDashboard")}
                          </Link>
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={logout} className="text-red-600">
                        <LogOut className="me-2 h-4 w-4" />
                        {tCommon("signOut")}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <div className="flex items-center gap-2">
                    <Button asChild size="sm">
                      <Link href="/login">{tCommon("getStarted")}</Link>
                    </Button>
                  </div>
                )}
                <LanguageSwitcher />
                <ModeToggle />
              </div>

              {/* Mobile Menu Content - Standardized */}
              {menuState && (
                <div className="w-full border-t border-border/10 mt-3 pt-4 lg:hidden animate-in slide-in-from-top-2 bg-background/95 backdrop-blur-md rounded-xl p-4 border shadow-lg absolute top-full left-0 right-0 mx-2">
                  <nav className="flex flex-col gap-4">
                    {navLinks.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        className={cn(
                          "text-base py-2 px-3 rounded-lg transition-colors hover:bg-muted",
                          pathname === link.href ? "text-foreground bg-muted" : "text-muted-foreground"
                        )}
                        onClick={() => setMenuState(false)}
                      >
                        {link.label}
                      </Link>
                    ))}

                    <div className="border-t border-border/50 pt-4 mt-2 mb-2">
                      {isLoggedIn ? (
                        <div className="space-y-3 px-3">
                          <div className="flex items-center gap-3 mb-4">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback>
                                {user?.name?.[0] || user?.email?.[0] || "U"}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                              <span className="font-medium">{truncateName(user?.name)}</span>
                              <span className="text-xs text-muted-foreground">{user?.email}</span>
                            </div>
                          </div>

                          <Link
                            href="/profile"
                            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                            onClick={() => setMenuState(false)}
                          >
                            <FileText className="h-4 w-4" />
                            {t("myComplaints")}
                          </Link>

                          {isAnyAdmin && (
                            <Link
                              href="/admin"
                              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                              onClick={() => setMenuState(false)}
                            >
                              <Shield className="h-4 w-4" />
                              {t("adminDashboard")}
                            </Link>
                          )}

                          <button
                            onClick={() => {
                              logout();
                              setMenuState(false);
                            }}
                            className="flex items-center gap-2 text-sm text-red-500 hover:text-red-600 w-full text-left"
                          >
                            <LogOut className="h-4 w-4" />
                            {tCommon("signOut")}
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-2 px-3">
                          <Button asChild className="w-full justify-center">
                            <Link href="/login" onClick={() => setMenuState(false)}>{tCommon("getStarted")}</Link>
                          </Button>
                        </div>
                      )}
                      <div className="mt-4 px-3 flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">{tCommon("theme")}</span>
                        <div className="flex items-center gap-2">
                          <LanguageSwitcher />
                          <ModeToggle />
                        </div>
                      </div>
                    </div>
                  </nav>
                </div>
              )}
            </div>
          </div>
        </nav>
      </header>
    );
  }

  // Sticky navbar for other pages
  return (
    <header dir="ltr" className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="container mx-auto px-6">
        <div className="flex flex-wrap items-center justify-between py-3">
          {/* Logo & Mobile Toggle */}
          <div className="flex w-full items-center justify-between md:w-auto">
            <Link href="/" className="flex items-center space-x-2">
              <Logo />
            </Link>
            <button
              onClick={() => setMenuState(!menuState)}
              className="block p-2 text-muted-foreground hover:text-foreground md:hidden"
              aria-label="Toggle menu"
            >
              {menuState ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6 text-sm" dir='auto'>
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "transition-colors hover:text-foreground",
                  pathname === link.href ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Desktop User Actions */}
          <div className="hidden md:flex items-center gap-4">
            {isLoading ? (
              <div className="h-8 w-20 animate-pulse rounded-md bg-muted" />
            ) : isLoggedIn ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="text-xs">
                        {user?.name?.[0] || user?.email?.[0] || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm">{truncateName(user?.name) || user?.email}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <Link href="/profile">
                    <DropdownMenuItem className="flex flex-col items-start">
                      <span className="font-medium">{truncateName(user?.name)}</span>
                      <span className="text-xs text-muted-foreground">{user?.email}</span>
                    </DropdownMenuItem>
                  </Link>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="flex items-center">
                      <FileText className="me-2 h-4 w-4" />
                      {t("myComplaints")}
                    </Link>
                  </DropdownMenuItem>
                  {isAnyAdmin && (
                    <DropdownMenuItem asChild>
                      <Link href="/admin" className="flex items-center">
                        <Shield className="me-2 h-4 w-4" />
                        {t("adminDashboard")}
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout} className="text-red-600">
                    <LogOut className="me-2 h-4 w-4" />
                    {tCommon("signOut")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-2">
                <Button asChild size="sm">
                  <Link href="/login">{tCommon("signIn")}</Link>
                </Button>
              </div>
            )}
            <LanguageSwitcher />
            <ModeToggle />
          </div>

          {/* Mobile Menu Content */}
          {menuState && (
            <div className="w-full border-t border-border/50 mt-3 pt-4 md:hidden animate-in slide-in-from-top-2">
              <nav className="flex flex-col gap-4">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      "text-base py-2 px-3 rounded-lg transition-colors hover:bg-muted",
                      pathname === link.href ? "text-foreground bg-muted" : "text-muted-foreground"
                    )}
                    onClick={() => setMenuState(false)}
                  >
                    {link.label}
                  </Link>
                ))}

                <div className="border-t border-border/50 pt-4 mt-2 mb-2">
                  {isLoggedIn ? (
                    <div className="space-y-3 px-3">
                      <div className="flex items-center gap-3 mb-4">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>
                            {user?.name?.[0] || user?.email?.[0] || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="font-medium">{truncateName(user?.name)}</span>
                          <span className="text-xs text-muted-foreground">{user?.email}</span>
                        </div>
                      </div>

                      <Link
                        href="/profile"
                        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                        onClick={() => setMenuState(false)}
                      >
                        <FileText className="h-4 w-4" />
                        {t("myComplaints")}
                      </Link>

                      {isAnyAdmin && (
                        <Link
                          href="/admin"
                          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                          onClick={() => setMenuState(false)}
                        >
                          <Shield className="h-4 w-4" />
                          {t("adminDashboard")}
                        </Link>
                      )}

                      <button
                        onClick={() => {
                          logout();
                          setMenuState(false);
                        }}
                        className="flex items-center gap-2 text-sm text-red-500 hover:text-red-600 w-full text-left"
                      >
                        <LogOut className="h-4 w-4" />
                        {tCommon("signOut")}
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2 px-3">
                      <Button asChild className="w-full justify-center">
                        <Link href="/login" onClick={() => setMenuState(false)}>{tCommon("getStarted")}</Link>
                      </Button>
                    </div>
                  )}
                  <div className="mt-4 px-3 flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">{tCommon("theme")}</span>
                    <div className="flex items-center gap-2">
                      <LanguageSwitcher />
                      <ModeToggle />
                    </div>
                  </div>
                </div>
              </nav>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

// Backwards compatibility alias
export const HeroHeader = () => <Navbar variant="floating" />;

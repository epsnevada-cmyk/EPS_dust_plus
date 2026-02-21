import React, { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "./utils";
import { Menu, X, ClipboardList, FolderOpen, FileText, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Layout({ children, currentPageName }) {
  const [menuOpen, setMenuOpen] = useState(false);

  const navItems = [
    { name: "Dashboard", page: "Dashboard", icon: Home },
    { name: "Projects", page: "Projects", icon: FolderOpen },
    { name: "Inspections", page: "Inspections", icon: ClipboardList },
    { name: "Settings", page: "Settings", icon: Menu },
  ];

  return (
    <div className="min-h-screen bg-stone-50">
      <style>{`
        :root {
          --brand: #1a3a2a;
          --brand-light: #2d5a3f;
          --accent: #d4a843;
          --accent-light: #f0dea0;
        }
      `}</style>

      {/* Top Nav */}
      <header className="bg-[var(--brand)] text-white sticky top-0 z-50 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to={createPageUrl("Dashboard")} className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[var(--accent)] flex items-center justify-center">
                <ClipboardList className="w-5 h-5 text-[var(--brand)]" />
              </div>
              <div>
                <span className="text-lg font-bold tracking-tight">EPS Dust+</span>
                <span className="hidden sm:inline text-xs text-stone-300 ml-2">Dust Control Inspector</span>
              </div>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentPageName === item.page;
                return (
                  <Link
                    key={item.page}
                    to={createPageUrl(item.page)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? "bg-white/15 text-[var(--accent)]"
                        : "text-stone-300 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden text-white hover:bg-white/10"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Nav */}
        {menuOpen && (
          <div className="md:hidden border-t border-white/10 pb-3 px-4">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPageName === item.page;
              return (
                <Link
                  key={item.page}
                  to={createPageUrl(item.page)}
                  onClick={() => setMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? "bg-white/15 text-[var(--accent)]"
                      : "text-stone-300 hover:text-white"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.name}
                </Link>
              );
            })}
          </div>
        )}
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {children}
      </main>
    </div>
  );
}
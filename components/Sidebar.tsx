"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, BookHeart, Map, LibraryBig, PanelLeftOpen, PanelLeftClose, Mail, MessageCircle, Mic } from "lucide-react";
import { getCurrentUser, logout } from "@/lib/appwrite";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface NavItem {
  title: string;
  href: string;
  icon: React.ReactNode;
  disabled?: boolean;
  external?: boolean;
}

interface DocsSidebarNavItemsProps {
  items: NavItem[];
  pathname: string;
  isPinned: boolean;
}

export function DocsSidebarNavItems({ items, pathname, isPinned }: DocsSidebarNavItemsProps) {
  return items?.length ? (
    <div className="grid grid-flow-row auto-rows-max text-sm z-100">
      {items.map((item, index) => {
        const isActive = pathname === item.href;
        const itemContent = (
          <div className={
            isActive
              ? "flex items-center rounded-md p-2 m-2 bg-sky-200 text-sky-600 font-medium"
              : "flex items-center rounded-md p-2 m-2 hover:underline text-white font-medium"
          }>
            <div className="h-6 w-6">{item.icon}</div>
            {isPinned && <span className="ml-4">{item.title}</span>}
          </div>
        );
        return !item.disabled && item.href ? (
          <Link
            key={index}
            href={item.href}
            className=""
            target={item.external ? "_blank" : ""}
            rel={item.external ? "noreferrer" : ""}
          >
            {itemContent}
          </Link>
        ) : (
          <span
            key={index}
            className="flex cursor-not-allowed items-center rounded-md p-2 opacity-60"
          >
            <div className="flex items-center">
              <div className="h-6 w-6">{item.icon}</div>
              {isPinned && <span className="ml-4">{item.title}</span>}
            </div>
          </span>
        );
      })}
    </div>
  ) : null;
}

type User = { name?: string; email?: string; prefs?: { avatarUrl?: string } } & Record<string, any>;

const Sidebar = () => {
  const pathname = usePathname();
  const [isPinned, setIsPinned] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsPinned(false);
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    getCurrentUser().then(setUser);
  }, []);

  const navItems: NavItem[] = [
    { title: "Contact", href: "/contact", icon: <Mail /> },
    { title: "Message", href: "/message", icon: <MessageCircle /> },
    { title: "Voice", href: "/voice", icon: <Mic /> },
  ];

  const handleMouseEnter = () => {
    if (!isPinned) {
      setIsHovered(true);
    }
  };

  const handleMouseLeave = () => {
    if (!isPinned) {
      setIsHovered(false);
    }
  };

  return (
    <div
      className={cn(
        "p-2 z-50 flex flex-col justify-between h-screen transition-all duration-300 bg-white",
        isPinned || isHovered ? "z-100 w-72 md:w-64" : "w-20"
      )}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="flex flex-col justify-between h-full bg-gradient-to-b from-sky-400 to-sky-600 rounded-3xl">
        <div>
          <div className="p-4 flex items-center justify-between">
            <h2 className={cn("text-2xl font-bold text-white", !isPinned && !isHovered && "hidden")}>Readily</h2>
            <button onClick={() => setIsPinned(!isPinned)} className="text-white">
              {isPinned ? <PanelLeftClose className="h-6 w-6" /> : <PanelLeftOpen className="h-6 w-6" />}
            </button>
          </div>

          <nav className="mt-4 flex flex-col justify-center">
            <DocsSidebarNavItems items={navItems} pathname={pathname} isPinned={isPinned || isHovered} />
          </nav>
        </div>

        {user && (
          <div className="p-3 md:p-4 flex flex-col">
            <div className="flex items-center space-x-2 mb-2">
              {user?.prefs?.avatarUrl ? (
                <img
                  src={user.prefs.avatarUrl}
                  alt={user?.name || "User"}
                  className="w-8 h-8 rounded-full"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-orange-400 flex items-center justify-center text-white font-bold">
                  {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
                </div>
              )}
              {(isPinned || isHovered) && (
                <div className="flex flex-col items-start">
                  <span className="text-sm text-white">{user?.name || "User"}</span>
                  <span className="text-[10px] text-white">{user?.email || ""}</span>
                </div>
              )}
            </div>
            <button
              onClick={async () => { await logout(); window.location.href = "/"; }}
              className={
                (isPinned || isHovered)
                  ? "flex items-center rounded-md p-2 m-2 w-full bg-white text-sky-600 font-medium hover:bg-sky-100 transition"
                  : "flex items-center rounded-md p-2 m-2 w-full justify-center bg-white text-sky-600 font-medium hover:bg-sky-100 transition"
              }
            >
              <LogOut className="h-6 w-6" />
              {(isPinned || isHovered) && <span className="ml-4">Sign out</span>}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar; 
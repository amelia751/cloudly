"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getCurrentUser } from "@/lib/appwrite";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const [checked, setChecked] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    getCurrentUser().then((user) => {
      if (!user && pathname !== "/signIn") {
        router.replace("/signIn");
      } else {
        setChecked(true);
      }
    });
  }, [router, pathname]);

  if (!checked && pathname !== "/signIn") {
    return null;
  }
  return <>{children}</>;
} 
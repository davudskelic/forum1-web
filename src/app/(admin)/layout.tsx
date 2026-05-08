"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, currentUser } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated || (!currentUser?.admin && !currentUser?.miniAdmin)) {
      router.replace("/");
    }
  }, [isAuthenticated, currentUser, router]);

  if (!isAuthenticated || (!currentUser?.admin && !currentUser?.miniAdmin)) return null;

  return <>{children}</>;
}

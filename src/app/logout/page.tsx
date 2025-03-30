"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function LogoutPage() {
  const router = useRouter();

  useEffect(() => {
    const handleLogout = async () => {
      // Wyczyść dane użytkownika z localStorage
      localStorage.removeItem('userData');
      
      // Wyczyść sesję
      await supabase.auth.signOut();
      
      // Przekieruj do strony logowania
      router.push("/");
    };

    handleLogout();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <p className="text-lg">Wylogowywanie...</p>
      </div>
    </div>
  );
}

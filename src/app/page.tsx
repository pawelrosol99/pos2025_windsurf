"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";

export default function Home() {
  const router = useRouter();
  const [login, setLogin] = useState("");
  const [haslo, setHaslo] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Sprawdź, czy użytkownik jest już zalogowany
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        // Przekieruj do odpowiedniej strony
        router.push("/firmy");
      }
    };
    
    checkSession();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Najpierw sprawdź, czy to superadmin
      const { data: superadminData, error: superadminError } = await supabase
        .from("uzytkownicy")
        .select("*")
        .eq("login", login)
        .eq("haslo", haslo)
        .single();

      if (superadminData) {
        // Zalogowano jako superadmin
        if (superadminData.rola === "superadmin") {
          // Zapisz dane użytkownika w localStorage
          localStorage.setItem('userData', JSON.stringify({
            login: superadminData.login,
            rola: superadminData.rola,
            imie_nazwisko: "Super Admin"
          }));
          
          router.push("/firmy");
          return;
        }
      }

      // Jeśli nie superadmin, sprawdź pracowników
      const { data: pracownikData, error: pracownikError } = await supabase
        .from("pracownicy")
        .select("*, firma_id")
        .eq("login", login)
        .eq("haslo", haslo)
        .single();

      if (pracownikError || !pracownikData) {
        throw new Error("Nieprawidłowy login lub hasło");
      }

      // Zapisz dane użytkownika w localStorage
      localStorage.setItem('userData', JSON.stringify({
        login: pracownikData.login,
        rola: pracownikData.rola,
        imie_nazwisko: pracownikData.imie_nazwisko,
        firma_id: pracownikData.firma_id
      }));

      // Przekieruj do panelu firmy
      router.push(`/firma/${pracownikData.firma_id}`);
    } catch (err: any) {
      setError(err.message || "Wystąpił błąd podczas logowania");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Panel Administracyjny</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="login">Login</Label>
              <Input
                id="login"
                value={login}
                onChange={(e) => setLogin(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="haslo">Hasło</Label>
              <Input
                id="haslo"
                type="password"
                value={haslo}
                onChange={(e) => setHaslo(e.target.value)}
                required
              />
            </div>

            {error && (
              <div className="text-destructive text-sm">{error}</div>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Logowanie..." : "Zaloguj się"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Navigation } from "@/components/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";

interface Firma {
  id: number;
  nazwa: string;
  ulica: string;
  miejscowosc: string;
  nr_tel: string;
  mail: string;
}

export default function FirmaPage() {
  const params = useParams();
  const firmaId = params.id as string;
  
  const [firma, setFirma] = useState<Firma | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFirma = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from("firmy")
          .select("*")
          .eq("id", firmaId)
          .single();

        if (error) throw error;
        setFirma(data);
      } catch (err: any) {
        setError(err.message || "Wystąpił błąd podczas pobierania danych firmy");
      } finally {
        setIsLoading(false);
      }
    };

    fetchFirma();
  }, [firmaId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation firmaId={firmaId} />
        <main className="container mx-auto py-8 px-4">
          <div className="text-center py-8">Ładowanie...</div>
        </main>
      </div>
    );
  }

  if (error || !firma) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation firmaId={firmaId} />
        <main className="container mx-auto py-8 px-4">
          <div className="text-destructive py-8">
            {error || "Nie znaleziono firmy"}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation firmaId={firmaId} />
      
      <main className="container mx-auto py-8 px-4">
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>{firma.nazwa} - Panel Firmy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p><strong>Adres:</strong> {firma.ulica}, {firma.miejscowosc}</p>
              <p><strong>Telefon:</strong> {firma.nr_tel}</p>
              <p><strong>Email:</strong> {firma.mail}</p>
            </div>
          </CardContent>
        </Card>
        
        <div className="text-center">
          <p className="text-muted-foreground">
            Wybierz opcję z menu, aby zarządzać firmą
          </p>
        </div>
      </main>
    </div>
  );
}

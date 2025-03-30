"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Navigation } from "@/components/navigation";
import { PracownikForm } from "@/components/pracownik-form";
import { PracownikEditForm } from "@/components/pracownik-edit-form";
import { PracownikDeleteDialog } from "@/components/pracownik-delete-dialog";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";

interface Pracownik {
  id: number;
  firma_id: number;
  imie_nazwisko: string;
  nr_tel: string;
  mail: string;
  login: string;
  haslo: string;
  rola: string;
}

export default function PracownicyPage() {
  const params = useParams();
  const firmaId = parseInt(params.id as string);
  
  const [pracownicy, setPracownicy] = useState<Pracownik[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPracownicy = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("pracownicy")
        .select("*")
        .eq("firma_id", firmaId)
        .order("imie_nazwisko");

      if (error) throw error;
      setPracownicy(data || []);
    } catch (err: any) {
      setError(err.message || "Wystąpił błąd podczas pobierania pracowników");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPracownicy();
  }, [firmaId]);

  const handlePracownikAdded = () => {
    fetchPracownicy();
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation firmaId={params.id as string} />
      
      <main className="container mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-8">Zarządzanie pracownikami</h1>
        
        <div className="mb-8">
          <PracownikForm firmaId={firmaId} onSuccess={handlePracownikAdded} />
        </div>
        
        <h2 className="text-2xl font-bold mb-4">Lista pracowników</h2>
        
        {isLoading ? (
          <div className="text-center py-8">Ładowanie...</div>
        ) : error ? (
          <div className="text-destructive py-8">{error}</div>
        ) : pracownicy.length === 0 ? (
          <div className="text-center py-8">Brak pracowników do wyświetlenia</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pracownicy.map((pracownik) => (
              <Card key={pracownik.id} className="overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-semibold">{pracownik.imie_nazwisko}</h3>
                        <p className="text-sm text-muted-foreground">
                          {pracownik.rola === "admin" ? "Administrator" : "Pracownik"}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <PracownikEditForm pracownik={pracownik} onSuccess={fetchPracownicy} />
                        <PracownikDeleteDialog 
                          pracownikId={pracownik.id} 
                          pracownikNazwa={pracownik.imie_nazwisko} 
                          onSuccess={fetchPracownicy} 
                        />
                      </div>
                    </div>
                    <div className="space-y-1 mt-2">
                      <p className="text-sm"><strong>Login:</strong> {pracownik.login}</p>
                      <p className="text-sm"><strong>Email:</strong> {pracownik.mail}</p>
                      <p className="text-sm"><strong>Telefon:</strong> {pracownik.nr_tel}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

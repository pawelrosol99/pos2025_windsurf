"use client";

import { useState, useEffect } from "react";
import { Navigation } from "@/components/navigation";
import { FirmaForm } from "@/components/firma-form";
import { PracownikForm } from "@/components/pracownik-form";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { supabase } from "@/lib/supabase";
import { FirmaEditForm } from "@/components/firma-edit-form";
import { FirmaDeleteDialog } from "@/components/firma-delete-dialog";
import { PracownikEditForm } from "@/components/pracownik-edit-form";
import { PracownikDeleteDialog } from "@/components/pracownik-delete-dialog";

interface Firma {
  id: number;
  nazwa: string;
  ulica: string;
  miejscowosc: string;
  nr_tel: string;
  mail: string;
}

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

export default function FirmyPage() {
  const [firmy, setFirmy] = useState<Firma[]>([]);
  const [pracownicy, setPracownicy] = useState<Record<number, Pracownik[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFirmy = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("firmy")
        .select("*")
        .order("nazwa");

      if (error) throw error;
      setFirmy(data || []);
    } catch (err: any) {
      setError(err.message || "Wystąpił błąd podczas pobierania firm");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPracownicy = async (firmaId: number) => {
    try {
      const { data, error } = await supabase
        .from("pracownicy")
        .select("*")
        .eq("firma_id", firmaId)
        .order("imie_nazwisko");

      if (error) throw error;
      
      setPracownicy(prev => ({
        ...prev,
        [firmaId]: data || []
      }));
    } catch (err: any) {
      console.error("Błąd podczas pobierania pracowników:", err);
    }
  };

  useEffect(() => {
    fetchFirmy();
  }, []);

  const handleFirmaAdded = () => {
    fetchFirmy();
  };

  const handlePracownikAdded = (firmaId: number) => {
    fetchPracownicy(firmaId);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation isSuperAdmin={true} />
      
      <main className="container mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-8">Zarządzanie firmami</h1>
        
        <div className="mb-8">
          <FirmaForm onSuccess={handleFirmaAdded} />
        </div>
        
        <h2 className="text-2xl font-bold mb-4">Lista firm</h2>
        
        {isLoading ? (
          <div className="text-center py-8">Ładowanie...</div>
        ) : error ? (
          <div className="text-destructive py-8">{error}</div>
        ) : firmy.length === 0 ? (
          <div className="text-center py-8">Brak firm do wyświetlenia</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {firmy.map((firma) => (
              <Accordion 
                key={firma.id} 
                type="single" 
                collapsible
                onValueChange={(value) => {
                  if (value) fetchPracownicy(firma.id);
                }}
              >
                <AccordionItem value={`firma-${firma.id}`} className="border rounded-lg overflow-hidden">
                  <Card className="border-0">
                    <CardHeader className="p-0">
                      <div className="flex justify-between items-center pr-4">
                        <AccordionTrigger className="px-6 py-4 w-full text-left">
                          <CardTitle>{firma.nazwa}</CardTitle>
                        </AccordionTrigger>
                        <div className="flex space-x-2">
                          <FirmaEditForm firma={firma} onSuccess={fetchFirmy} />
                          <FirmaDeleteDialog 
                            firmaId={firma.id} 
                            firmaNazwa={firma.nazwa} 
                            onSuccess={fetchFirmy} 
                          />
                        </div>
                      </div>
                    </CardHeader>
                    <AccordionContent>
                      <CardContent>
                        <div className="mb-4">
                          <CardDescription>
                            <div className="space-y-1">
                              <p><strong>Adres:</strong> {firma.ulica}, {firma.miejscowosc}</p>
                              <p><strong>Telefon:</strong> {firma.nr_tel}</p>
                              <p><strong>Email:</strong> {firma.mail}</p>
                            </div>
                          </CardDescription>
                        </div>
                        
                        <div className="mb-6">
                          <PracownikForm 
                            firmaId={firma.id} 
                            onSuccess={() => handlePracownikAdded(firma.id)} 
                          />
                        </div>
                        
                        <div>
                          <h3 className="text-lg font-semibold mb-3">Pracownicy firmy</h3>
                          
                          {!pracownicy[firma.id] ? (
                            <div className="text-center py-2">Ładowanie pracowników...</div>
                          ) : pracownicy[firma.id].length === 0 ? (
                            <div className="text-center py-2">Brak pracowników</div>
                          ) : (
                            <div className="space-y-3">
                              {pracownicy[firma.id].map((pracownik) => (
                                <Card key={pracownik.id} className="p-4">
                                  <div className="flex flex-col md:flex-row md:justify-between gap-2">
                                    <div>
                                      <p className="font-medium">{pracownik.imie_nazwisko}</p>
                                      <p className="text-sm text-muted-foreground">
                                        {pracownik.rola === "admin" ? "Administrator" : "Pracownik"}
                                      </p>
                                    </div>
                                    <div className="text-sm">
                                      <p>{pracownik.mail}</p>
                                      <p>{pracownik.nr_tel}</p>
                                    </div>
                                    <div className="flex space-x-2 md:ml-4">
                                      <PracownikEditForm 
                                        pracownik={pracownik} 
                                        onSuccess={() => handlePracownikAdded(firma.id)} 
                                      />
                                      <PracownikDeleteDialog 
                                        pracownikId={pracownik.id} 
                                        pracownikNazwa={pracownik.imie_nazwisko} 
                                        onSuccess={() => handlePracownikAdded(firma.id)} 
                                      />
                                    </div>
                                  </div>
                                </Card>
                              ))}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </AccordionContent>
                  </Card>
                </AccordionItem>
              </Accordion>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

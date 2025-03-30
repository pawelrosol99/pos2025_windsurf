"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";
import { Pencil, Trash2, ChevronDown, ChevronUp, Plus } from "lucide-react";
import { KategoriaEditDialog } from "./kategoria-edit-dialog";
import { KategoriaDeleteDialog } from "./kategoria-delete-dialog";
import { RozmiarForm } from "./rozmiar-form";
import { toast } from "@/components/ui/use-toast";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface Kategoria {
  id: number;
  nazwa: string;
  firma_id: number;
  data_utworzenia: string;
}

interface Rozmiar {
  id: number;
  nazwa: string;
  kategoria_id: number;
  data_utworzenia: string;
}

interface CenaRodzajuSkladnikow {
  id: number;
  rozmiar_id: number;
  rodzaj_skladnika_id: number;
  cena: number;
  rodzaj_nazwa?: string;
}

interface RodzajSkladnikow {
  id: number;
  nazwa: string;
}

interface KategorieTabProps {
  firmaId: string;
}

export function KategorieTab({ firmaId }: KategorieTabProps) {
  const [nazwa, setNazwa] = useState("");
  const [kategorie, setKategorie] = useState<Kategoria[]>([]);
  const [rozmiary, setRozmiary] = useState<Record<number, Rozmiar[]>>({});
  const [cenyRodzajow, setCenyRodzajow] = useState<Record<number, CenaRodzajuSkladnikow[]>>({});
  const [rodzajeSkladnikow, setRodzajeSkladnikow] = useState<RodzajSkladnikow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [openCategories, setOpenCategories] = useState<Record<number, boolean>>({});

  const fetchRodzajeSkladnikow = async () => {
    try {
      const { data, error } = await supabase
        .from("rodzaje_skladnikow")
        .select("id, nazwa")
        .eq("firma_id", firmaId)
        .order("nazwa");

      if (error) {
        throw error;
      }

      setRodzajeSkladnikow(data || []);
    } catch (error: any) {
      console.error("Błąd podczas pobierania rodzajów składników:", error.message);
      toast({
        title: "Błąd",
        description: "Nie udało się pobrać rodzajów składników",
        variant: "destructive",
      });
    }
  };

  const fetchKategorie = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("kategorie")
        .select("*")
        .eq("firma_id", firmaId)
        .order("nazwa");

      if (error) {
        throw error;
      }

      setKategorie(data || []);
      
      // Inicjalizuj stan otwartych kategorii
      const initialOpenState: Record<number, boolean> = {};
      data?.forEach(kategoria => {
        initialOpenState[kategoria.id] = false;
      });
      setOpenCategories(initialOpenState);
      
      // Pobierz rozmiary dla każdej kategorii
      await Promise.all(data?.map(kategoria => fetchRozmiaryForKategoria(kategoria.id)) || []);
    } catch (error: any) {
      console.error("Błąd podczas pobierania kategorii:", error.message);
      toast({
        title: "Błąd",
        description: "Nie udało się pobrać kategorii",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRozmiaryForKategoria = async (kategoriaId: number) => {
    try {
      const { data, error } = await supabase
        .from("rozmiary")
        .select("*")
        .eq("kategoria_id", kategoriaId)
        .order("nazwa");

      if (error) {
        throw error;
      }

      setRozmiary(prev => ({
        ...prev,
        [kategoriaId]: data || []
      }));

      // Pobierz ceny rodzajów składników dla każdego rozmiaru
      await Promise.all(data?.map(rozmiar => fetchCenyRodzajowForRozmiar(rozmiar.id)) || []);
    } catch (error: any) {
      console.error("Błąd podczas pobierania rozmiarów:", error.message);
    }
  };

  const fetchCenyRodzajowForRozmiar = async (rozmiarId: number) => {
    try {
      const { data, error } = await supabase
        .from("ceny_rodzajow_skladnikow")
        .select(`
          id, 
          rozmiar_id, 
          rodzaj_skladnika_id, 
          cena,
          rodzaje_skladnikow (nazwa)
        `)
        .eq("rozmiar_id", rozmiarId);

      if (error) {
        throw error;
      }

      // Przekształć dane, aby uzyskać nazwę rodzaju składnika
      const transformedData = data?.map(item => ({
        ...item,
        rodzaj_nazwa: item.rodzaje_skladnikow?.nazwa
      })) || [];

      setCenyRodzajow(prev => ({
        ...prev,
        [rozmiarId]: transformedData
      }));
    } catch (error: any) {
      console.error("Błąd podczas pobierania cen rodzajów składników:", error.message);
    }
  };

  useEffect(() => {
    fetchRodzajeSkladnikow();
    fetchKategorie();
  }, [firmaId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!nazwa.trim()) {
      toast({
        title: "Błąd",
        description: "Nazwa kategorii nie może być pusta",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const { data, error } = await supabase
        .from("kategorie")
        .insert([
          { nazwa, firma_id: firmaId }
        ])
        .select();

      if (error) {
        throw error;
      }

      toast({
        title: "Sukces",
        description: "Kategoria została dodana",
      });
      
      setNazwa("");
      fetchKategorie();
    } catch (error: any) {
      console.error("Błąd podczas dodawania kategorii:", error.message);
      toast({
        title: "Błąd",
        description: "Nie udało się dodać kategorii",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleCategory = (kategoriaId: number) => {
    setOpenCategories(prev => ({
      ...prev,
      [kategoriaId]: !prev[kategoriaId]
    }));
  };

  const handleRozmiarAdded = (kategoriaId: number) => {
    fetchRozmiaryForKategoria(kategoriaId);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card className="md:col-span-1">
        <CardHeader>
          <CardTitle>Dodaj nową kategorię</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nazwa">Nazwa</Label>
              <Input
                id="nazwa"
                value={nazwa}
                onChange={(e) => setNazwa(e.target.value)}
                placeholder="Np. Pizza, Burgery, Napoje"
                disabled={isSubmitting}
              />
            </div>
            <Button type="submit" disabled={isSubmitting || !nazwa.trim()}>
              {isSubmitting ? "Dodawanie..." : "Dodaj kategorię"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="md:col-span-2">
        <h2 className="text-2xl font-bold mb-4">Lista kategorii</h2>
        {isLoading ? (
          <div className="text-center py-4">Ładowanie...</div>
        ) : kategorie.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            Brak kategorii. Dodaj pierwszą kategorię.
          </div>
        ) : (
          <div className="space-y-4">
            {kategorie.map((kategoria) => (
              <Collapsible
                key={kategoria.id}
                open={openCategories[kategoria.id]}
                onOpenChange={() => toggleCategory(kategoria.id)}
                className="border rounded-lg"
              >
                <div className="bg-card p-4 rounded-t-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="sm" className="p-0 h-8 w-8">
                          {openCategories[kategoria.id] ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                      </CollapsibleTrigger>
                      <h3 className="text-lg font-semibold">{kategoria.nazwa}</h3>
                    </div>
                    <div className="flex space-x-2">
                      <KategoriaEditDialog 
                        kategoria={kategoria} 
                        onSuccess={fetchKategorie} 
                      />
                      <KategoriaDeleteDialog 
                        kategoriaId={kategoria.id} 
                        kategoriaNazwa={kategoria.nazwa} 
                        onSuccess={fetchKategorie} 
                      />
                    </div>
                  </div>
                </div>
                <CollapsibleContent className="p-4 border-t">
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-md font-medium mb-2">Rozmiary</h4>
                      <div className="space-y-4">
                        {rozmiary[kategoria.id]?.map((rozmiar) => (
                          <Card key={rozmiar.id} className="p-4">
                            <div className="flex justify-between items-center mb-2">
                              <h5 className="font-semibold">{rozmiar.nazwa}</h5>
                              <div className="flex space-x-2">
                                {/* Tutaj będą przyciski edycji i usuwania rozmiaru */}
                              </div>
                            </div>
                            <div className="space-y-2">
                              <h6 className="text-sm font-medium">Ceny dla rodzajów składników:</h6>
                              {cenyRodzajow[rozmiar.id]?.length > 0 ? (
                                <div className="grid grid-cols-2 gap-2">
                                  {cenyRodzajow[rozmiar.id]?.map((cena) => (
                                    <div key={cena.id} className="flex justify-between text-sm">
                                      <span>{cena.rodzaj_nazwa}:</span>
                                      <span className="font-medium">{cena.cena.toFixed(2)} zł</span>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-sm text-muted-foreground">
                                  Brak ustawionych cen dla rodzajów składników
                                </p>
                              )}
                            </div>
                          </Card>
                        ))}
                        
                        <RozmiarForm 
                          kategoriaId={kategoria.id} 
                          rodzajeSkladnikow={rodzajeSkladnikow}
                          onSuccess={() => handleRozmiarAdded(kategoria.id)} 
                        />
                      </div>
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

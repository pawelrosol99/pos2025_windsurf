"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/lib/supabase";
import { Check, X, Plus, Minus } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

interface Produkt {
  id: number;
  nazwa: string;
  kategoria_id: number;
}

interface Rozmiar {
  id: number;
  nazwa: string;
}

interface Skladnik {
  id: number;
  nazwa: string;
  rodzaj_id: number;
}

interface RodzajSkladnika {
  id: number;
  nazwa: string;
}

interface CenaSkladnika {
  rodzaj_skladnika_id: number;
  rozmiar_id: number;
  cena: number;
}

interface ProduktDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  produkt: Produkt | null;
  firmaId: string;
  onAddToOrder: (produkt: any) => void;
}

export function ProduktDialog({ open, onOpenChange, produkt, firmaId, onAddToOrder }: ProduktDialogProps) {
  const [step, setStep] = useState<'rozmiary' | 'skladniki'>('rozmiary');
  const [rozmiary, setRozmiary] = useState<Rozmiar[]>([]);
  const [wybranyRozmiar, setWybranyRozmiar] = useState<Rozmiar | null>(null);
  const [cenyProduktow, setCenyProduktow] = useState<Record<number, number>>({});
  
  const [skladnikiProduktu, setSkladnikiProduktu] = useState<Skladnik[]>([]);
  const [dostepneSkladniki, setDostepneSkladniki] = useState<Skladnik[]>([]);
  const [rodzajeSkladnikow, setRodzajeSkladnikow] = useState<Record<number, RodzajSkladnika>>({});
  const [cenySkladnikow, setCenySkladnikow] = useState<CenaSkladnika[]>([]);
  
  const [usunieteSkladniki, setUsunieteSkladniki] = useState<number[]>([]);
  const [dodaneSkladniki, setDodaneSkladniki] = useState<number[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Resetuj stan przy otwarciu dialogu
  useEffect(() => {
    if (open && produkt) {
      setStep('rozmiary');
      setWybranyRozmiar(null);
      setUsunieteSkladniki([]);
      setDodaneSkladniki([]);
      fetchRozmiaryForKategoria(produkt.kategoria_id);
      fetchCenyForProdukt(produkt.id);
    }
  }, [open, produkt]);
  
  // Pobierz rozmiary dla kategorii produktu
  const fetchRozmiaryForKategoria = async (kategoriaId: number) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("rozmiary")
        .select("*")
        .eq("kategoria_id", kategoriaId)
        .order("nazwa");

      if (error) throw error;
      setRozmiary(data || []);
    } catch (error: any) {
      console.error("Błąd podczas pobierania rozmiarów:", error.message);
      toast({
        title: "Błąd",
        description: "Nie udało się pobrać rozmiarów produktu",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Pobierz ceny dla produktu
  const fetchCenyForProdukt = async (produktId: number) => {
    try {
      const { data, error } = await supabase
        .from("ceny_produktow")
        .select("*")
        .eq("produkt_id", produktId);

      if (error) throw error;

      const cenyMap: Record<number, number> = {};
      for (const cena of data || []) {
        cenyMap[cena.rozmiar_id] = cena.cena_bazowa;
      }

      setCenyProduktow(cenyMap);
    } catch (error: any) {
      console.error("Błąd podczas pobierania cen produktu:", error.message);
    }
  };
  
  // Pobierz składniki produktu
  const fetchSkladnikiProduktu = async (produktId: number) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("skladniki_produktow")
        .select(`
          skladnik_id,
          skladniki (
            id,
            nazwa,
            rodzaj_id
          )
        `)
        .eq("produkt_id", produktId);

      if (error) throw error;

      const skladniki = data?.map(item => ({
        id: item.skladniki.id,
        nazwa: item.skladniki.nazwa,
        rodzaj_id: item.skladniki.rodzaj_id
      })) || [];

      setSkladnikiProduktu(skladniki);
      
      // Pobierz wszystkie dostępne składniki
      await fetchDostepneSkladniki();
      
      // Pobierz rodzaje składników
      await fetchRodzajeSkladnikow();
      
      // Pobierz ceny składników dla wybranego rozmiaru
      if (wybranyRozmiar) {
        await fetchCenySkladnikow(wybranyRozmiar.id);
      }
    } catch (error: any) {
      console.error("Błąd podczas pobierania składników produktu:", error.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Pobierz wszystkie dostępne składniki
  const fetchDostepneSkladniki = async () => {
    try {
      const { data, error } = await supabase
        .from("skladniki")
        .select("*")
        .eq("firma_id", firmaId)
        .order("nazwa");

      if (error) throw error;
      setDostepneSkladniki(data || []);
    } catch (error: any) {
      console.error("Błąd podczas pobierania dostępnych składników:", error.message);
    }
  };
  
  // Pobierz rodzaje składników
  const fetchRodzajeSkladnikow = async () => {
    try {
      const { data, error } = await supabase
        .from("rodzaje_skladnikow")
        .select("*")
        .eq("firma_id", firmaId);

      if (error) throw error;

      const rodzajeMap: Record<number, RodzajSkladnika> = {};
      for (const rodzaj of data || []) {
        rodzajeMap[rodzaj.id] = rodzaj;
      }

      setRodzajeSkladnikow(rodzajeMap);
    } catch (error: any) {
      console.error("Błąd podczas pobierania rodzajów składników:", error.message);
    }
  };
  
  // Pobierz ceny składników dla wybranego rozmiaru
  const fetchCenySkladnikow = async (rozmiarId: number) => {
    try {
      const { data, error } = await supabase
        .from("ceny_rodzajow_skladnikow")
        .select("*")
        .eq("rozmiar_id", rozmiarId);

      if (error) throw error;
      setCenySkladnikow(data || []);
    } catch (error: any) {
      console.error("Błąd podczas pobierania cen składników:", error.message);
    }
  };
  
  // Obsługa wyboru rozmiaru
  const handleRozmiarSelect = async (rozmiar: Rozmiar) => {
    setWybranyRozmiar(rozmiar);
    
    if (produkt) {
      await fetchSkladnikiProduktu(produkt.id);
      await fetchCenySkladnikow(rozmiar.id);
      setStep('skladniki');
    }
  };
  
  // Obsługa usunięcia składnika
  const handleUsunSkladnik = (skladnikId: number) => {
    if (dodaneSkladniki.includes(skladnikId)) {
      // Jeśli składnik był wcześniej dodany, po prostu usuń go z dodanych
      setDodaneSkladniki(prev => prev.filter(id => id !== skladnikId));
    } else {
      // W przeciwnym razie dodaj do usuniętych
      setUsunieteSkladniki(prev => [...prev, skladnikId]);
    }
  };
  
  // Obsługa dodania składnika
  const handleDodajSkladnik = (skladnikId: number) => {
    if (usunieteSkladniki.includes(skladnikId)) {
      // Jeśli składnik był wcześniej usunięty, po prostu usuń go z usuniętych
      setUsunieteSkladniki(prev => prev.filter(id => id !== skladnikId));
    } else {
      // W przeciwnym razie dodaj do dodanych
      setDodaneSkladniki(prev => [...prev, skladnikId]);
    }
  };
  
  // Sprawdź, czy składnik jest w produkcie
  const isInProdukt = (skladnikId: number) => {
    return skladnikiProduktu.some(s => s.id === skladnikId);
  };
  
  // Sprawdź, czy składnik jest usunięty
  const isRemoved = (skladnikId: number) => {
    return usunieteSkladniki.includes(skladnikId) && isInProdukt(skladnikId);
  };
  
  // Sprawdź, czy składnik jest dodany
  const isAdded = (skladnikId: number) => {
    return dodaneSkladniki.includes(skladnikId) && !isInProdukt(skladnikId);
  };
  
  // Oblicz cenę składnika na podstawie jego rodzaju i rozmiaru
  const getSkladnikPrice = (skladnikId: number): number => {
    const skladnik = dostepneSkladniki.find(s => s.id === skladnikId);
    if (!skladnik || !wybranyRozmiar) return 0;
    
    const cenaSkladnika = cenySkladnikow.find(
      c => c.rodzaj_skladnika_id === skladnik.rodzaj_id && c.rozmiar_id === wybranyRozmiar.id
    );
    
    return cenaSkladnika?.cena || 0;
  };
  
  // Oblicz łączną cenę produktu z modyfikacjami
  const calculateTotalPrice = (): number => {
    if (!wybranyRozmiar) return 0;
    
    // Cena bazowa produktu
    let totalPrice = cenyProduktow[wybranyRozmiar.id] || 0;
    
    // Dodaj ceny dodanych składników
    for (const skladnikId of dodaneSkladniki) {
      totalPrice += getSkladnikPrice(skladnikId);
    }
    
    // Nie odejmujemy cen usuniętych składników
    
    return totalPrice;
  };
  
  // Dodaj produkt do zamówienia
  const handleAddToOrder = () => {
    if (!produkt || !wybranyRozmiar) return;
    
    setIsSubmitting(true);
    
    try {
      const orderItem = {
        produkt_id: produkt.id,
        produkt_nazwa: produkt.nazwa,
        rozmiar_id: wybranyRozmiar.id,
        rozmiar_nazwa: wybranyRozmiar.nazwa,
        cena: calculateTotalPrice(),
        usunieteSkladniki: usunieteSkladniki.map(id => {
          const skladnik = dostepneSkladniki.find(s => s.id === id);
          return {
            id,
            nazwa: skladnik?.nazwa || '',
            akcja: 'usuniety',
            cena: 0 // Nie zmieniamy ceny przy usuwaniu
          };
        }),
        dodaneSkladniki: dodaneSkladniki.map(id => {
          const skladnik = dostepneSkladniki.find(s => s.id === id);
          return {
            id,
            nazwa: skladnik?.nazwa || '',
            akcja: 'dodany',
            cena: getSkladnikPrice(id)
          };
        })
      };
      
      onAddToOrder(orderItem);
      onOpenChange(false);
    } catch (error: any) {
      console.error("Błąd podczas dodawania produktu do zamówienia:", error.message);
      toast({
        title: "Błąd",
        description: "Nie udało się dodać produktu do zamówienia",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Powrót do wyboru rozmiaru
  const handleBackToSizes = () => {
    setStep('rozmiary');
    setUsunieteSkladniki([]);
    setDodaneSkladniki([]);
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {produkt?.nazwa}
            {step === 'skladniki' && wybranyRozmiar && (
              <span className="ml-2 text-sm text-muted-foreground">
                ({wybranyRozmiar.nazwa})
              </span>
            )}
          </DialogTitle>
          <DialogDescription>
            {step === 'rozmiary' ? 'Wybierz rozmiar produktu' : 'Modyfikuj składniki produktu'}
          </DialogDescription>
        </DialogHeader>
        
        {isLoading ? (
          <div className="flex justify-center py-8">Ładowanie...</div>
        ) : (
          <>
            {step === 'rozmiary' && (
              <div className="grid grid-cols-2 gap-3 py-4">
                {rozmiary.map((rozmiar) => (
                  <Card 
                    key={rozmiar.id}
                    className="cursor-pointer hover:bg-accent transition-colors"
                    onClick={() => handleRozmiarSelect(rozmiar)}
                  >
                    <CardContent className="p-4 flex flex-col items-center">
                      <div className="font-medium">{rozmiar.nazwa}</div>
                      <div className="text-lg font-bold mt-2">
                        {cenyProduktow[rozmiar.id]?.toFixed(2) || "-"} zł
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                {rozmiary.length === 0 && (
                  <div className="col-span-2 text-center py-4 text-muted-foreground">
                    Brak dostępnych rozmiarów dla tego produktu
                  </div>
                )}
              </div>
            )}
            
            {step === 'skladniki' && (
              <div className="py-4 space-y-4">
                {/* Składniki produktu */}
                <div>
                  <h3 className="text-sm font-medium mb-2">Składniki produktu:</h3>
                  <div className="space-y-2">
                    {skladnikiProduktu.length > 0 ? (
                      skladnikiProduktu.map((skladnik) => {
                        const isUsuniety = isRemoved(skladnik.id);
                        return (
                          <div 
                            key={skladnik.id}
                            className={`flex items-center justify-between p-2 rounded-md ${
                              isUsuniety ? 'bg-red-100 dark:bg-red-900/20' : 'bg-muted/50'
                            }`}
                          >
                            <div className="flex items-center">
                              {isUsuniety && (
                                <Badge variant="destructive" className="mr-2">
                                  <X className="h-3 w-3 mr-1" />
                                  Usunięty
                                </Badge>
                              )}
                              <span className={isUsuniety ? 'line-through opacity-70' : ''}>
                                {skladnik.nazwa}
                              </span>
                            </div>
                            <Button
                              variant={isUsuniety ? "outline" : "destructive"}
                              size="sm"
                              onClick={() => isUsuniety 
                                ? handleDodajSkladnik(skladnik.id) 
                                : handleUsunSkladnik(skladnik.id)
                              }
                            >
                              {isUsuniety ? (
                                <><Plus className="h-4 w-4 mr-1" /> Przywróć</>
                              ) : (
                                <><Minus className="h-4 w-4 mr-1" /> Usuń</>
                              )}
                            </Button>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-sm text-muted-foreground p-2 bg-muted/30 rounded-md">
                        Ten produkt nie ma składników do modyfikacji
                      </div>
                    )}
                  </div>
                </div>
                
                <Separator />
                
                {/* Dostępne składniki do dodania */}
                <div>
                  <h3 className="text-sm font-medium mb-2">Dodaj składniki:</h3>
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                    {dostepneSkladniki
                      .filter(s => !isInProdukt(s.id) || isRemoved(s.id))
                      .map((skladnik) => {
                        const isDodany = isAdded(skladnik.id);
                        const skladnikPrice = getSkladnikPrice(skladnik.id);
                        
                        return (
                          <div 
                            key={skladnik.id}
                            className={`flex items-center justify-between p-2 rounded-md ${
                              isDodany ? 'bg-green-100 dark:bg-green-900/20' : 'bg-muted/50'
                            }`}
                          >
                            <div className="flex items-center">
                              {isDodany && (
                                <Badge variant="success" className="mr-2 bg-green-600">
                                  <Check className="h-3 w-3 mr-1" />
                                  Dodany
                                </Badge>
                              )}
                              <span>
                                {skladnik.nazwa}
                                {skladnikPrice > 0 && (
                                  <span className="ml-2 text-sm text-muted-foreground">
                                    (+{skladnikPrice.toFixed(2)} zł)
                                  </span>
                                )}
                              </span>
                            </div>
                            <Button
                              variant={isDodany ? "outline" : "default"}
                              size="sm"
                              onClick={() => isDodany 
                                ? handleUsunSkladnik(skladnik.id) 
                                : handleDodajSkladnik(skladnik.id)
                              }
                            >
                              {isDodany ? (
                                <><Minus className="h-4 w-4 mr-1" /> Usuń</>
                              ) : (
                                <><Plus className="h-4 w-4 mr-1" /> Dodaj</>
                              )}
                            </Button>
                          </div>
                        );
                      })}
                      
                    {dostepneSkladniki.filter(s => !isInProdukt(s.id) || isRemoved(s.id)).length === 0 && (
                      <div className="text-sm text-muted-foreground p-2">
                        Brak dodatkowych składników do wyboru
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Podsumowanie */}
                <div className="bg-muted/50 p-3 rounded-md">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Cena łączna:</span>
                    <span className="text-lg font-bold">{calculateTotalPrice().toFixed(2)} zł</span>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
        
        <DialogFooter className="flex justify-between sm:justify-between">
          {step === 'rozmiary' ? (
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Anuluj
            </Button>
          ) : (
            <Button variant="outline" onClick={handleBackToSizes}>
              Wróć do rozmiarów
            </Button>
          )}
          
          {step === 'skladniki' && wybranyRozmiar && (
            <Button 
              onClick={handleAddToOrder}
              disabled={isSubmitting}
            >
              Dodaj do zamówienia
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

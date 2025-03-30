"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/lib/supabase";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

interface Kategoria {
  id: number;
  nazwa: string;
}

interface Rozmiar {
  id: number;
  nazwa: string;
  kategoria_id: number;
}

interface Skladnik {
  id: number;
  nazwa: string;
  rodzaj_id: number;
}

interface Produkt {
  id: number;
  nazwa: string;
  kategoria_id: number;
  firma_id: number;
  kategoria_nazwa?: string;
}

interface ProduktyTabProps {
  firmaId: string;
}

export function ProduktyTab({ firmaId }: ProduktyTabProps) {
  const [nazwa, setNazwa] = useState("");
  const [kategoriaId, setKategoriaId] = useState("");
  const [rozmiary, setRozmiary] = useState<Rozmiar[]>([]);
  const [cenyBazowe, setCenyBazowe] = useState<Record<number, string>>({});
  const [pokazSkladniki, setPokazSkladniki] = useState(false);
  const [wybraneSkladniki, setWybraneSkladniki] = useState<number[]>([]);
  
  const [kategorie, setKategorie] = useState<Kategoria[]>([]);
  const [skladniki, setSkladniki] = useState<Skladnik[]>([]);
  const [produkty, setProdukty] = useState<Produkt[]>([]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchKategorie = async () => {
    try {
      const { data, error } = await supabase
        .from("kategorie")
        .select("id, nazwa")
        .eq("firma_id", firmaId)
        .order("nazwa");

      if (error) {
        throw error;
      }

      setKategorie(data || []);
    } catch (error: any) {
      console.error("Błąd podczas pobierania kategorii:", error.message);
      toast({
        title: "Błąd",
        description: "Nie udało się pobrać kategorii",
        variant: "destructive",
      });
    }
  };

  const fetchRozmiaryForKategoria = async (kategoriaId: string) => {
    console.log("Pobieranie rozmiarów dla kategorii:", kategoriaId);
    try {
      const { data, error } = await supabase
        .from("rozmiary")
        .select("*")
        .eq("kategoria_id", kategoriaId)
        .order("nazwa");

      if (error) {
        throw error;
      }

      console.log("Pobrane rozmiary:", data);
      setRozmiary(data || []);
      
      // Zresetuj ceny bazowe
      const newCenyBazowe: Record<number, string> = {};
      data?.forEach((rozmiar: any) => {
        newCenyBazowe[rozmiar.id] = "";
      });
      setCenyBazowe(newCenyBazowe);
    } catch (error: any) {
      console.error("Błąd podczas pobierania rozmiarów:", error.message);
      toast({
        title: "Informacja",
        description: "Nie znaleziono rozmiarów dla wybranej kategorii. Dodaj rozmiary w zakładce Kategorie.",
      });
    }
  };

  const fetchSkladniki = async () => {
    try {
      const { data, error } = await supabase
        .from("skladniki")
        .select("id, nazwa, rodzaj_id")
        .eq("firma_id", firmaId)
        .order("nazwa");

      if (error) {
        throw error;
      }

      setSkladniki(data || []);
    } catch (error: any) {
      console.error("Błąd podczas pobierania składników:", error.message);
    }
  };

  const fetchProdukty = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("produkty")
        .select(`
          id, 
          nazwa, 
          kategoria_id, 
          firma_id,
          kategorie (nazwa)
        `)
        .eq("firma_id", firmaId)
        .order("nazwa");

      if (error) {
        throw error;
      }

      // Przekształć dane, aby uzyskać nazwę kategorii
      const transformedData = data?.map(item => ({
        ...item,
        kategoria_nazwa: item.kategorie?.nazwa
      })) || [];

      setProdukty(transformedData);
    } catch (error: any) {
      console.error("Błąd podczas pobierania produktów:", error.message);
      toast({
        title: "Błąd",
        description: "Nie udało się pobrać produktów",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchKategorie();
    fetchSkladniki();
    fetchProdukty();
  }, [firmaId]);

  useEffect(() => {
    if (kategoriaId) {
      console.log("Zmieniono kategorię na:", kategoriaId);
      fetchRozmiaryForKategoria(kategoriaId);
    } else {
      setRozmiary([]);
      setCenyBazowe({});
    }
  }, [kategoriaId]);

  const handleCenaChange = (rozmiarId: number, value: string) => {
    setCenyBazowe(prev => ({
      ...prev,
      [rozmiarId]: value
    }));
  };

  const handleSkladnikToggle = (skladnikId: number) => {
    setWybraneSkladniki(prev => {
      if (prev.includes(skladnikId)) {
        return prev.filter(id => id !== skladnikId);
      } else {
        return [...prev, skladnikId];
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!nazwa.trim() || !kategoriaId) {
      toast({
        title: "Błąd",
        description: "Nazwa produktu i kategoria są wymagane",
        variant: "destructive",
      });
      return;
    }

    // Sprawdź, czy wszystkie ceny są poprawne
    const cenaParsed: Record<number, number> = {};
    let hasInvalidCena = false;

    for (const rozmiarId in cenyBazowe) {
      if (cenyBazowe[rozmiarId].trim() === "") {
        hasInvalidCena = true;
        break;
      }
      
      const cenaValue = parseFloat(cenyBazowe[rozmiarId].replace(",", "."));
      if (isNaN(cenaValue) || cenaValue < 0) {
        hasInvalidCena = true;
        break;
      }
      cenaParsed[rozmiarId] = cenaValue;
    }

    if (hasInvalidCena || Object.keys(cenaParsed).length === 0) {
      toast({
        title: "Błąd",
        description: "Wszystkie ceny bazowe muszą być podane i być liczbami dodatnimi",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Dodaj produkt
      const { data: produktData, error: produktError } = await supabase
        .from("produkty")
        .insert([
          { 
            nazwa, 
            kategoria_id: kategoriaId, 
            firma_id: firmaId 
          }
        ])
        .select();

      if (produktError) {
        throw produktError;
      }

      const produktId = produktData[0].id;

      // Dodaj ceny bazowe dla rozmiarów
      const cenyToInsert = Object.entries(cenaParsed).map(([rozmiarIdStr, cena]) => ({
        produkt_id: produktId,
        rozmiar_id: parseInt(rozmiarIdStr),
        cena_bazowa: cena
      }));

      const { error: cenyError } = await supabase
        .from("ceny_produktow")
        .insert(cenyToInsert);

      if (cenyError) {
        throw cenyError;
      }

      // Dodaj składniki do produktu, jeśli są wybrane
      if (pokazSkladniki && wybraneSkladniki.length > 0) {
        const skladnikiToInsert = wybraneSkladniki.map(skladnikId => ({
          produkt_id: produktId,
          skladnik_id: skladnikId
        }));

        const { error: skladnikiError } = await supabase
          .from("skladniki_produktow")
          .insert(skladnikiToInsert);

        if (skladnikiError) {
          throw skladnikiError;
        }
      }

      toast({
        title: "Sukces",
        description: "Produkt został dodany",
      });
      
      // Zresetuj formularz
      setNazwa("");
      setKategoriaId("");
      setRozmiary([]);
      setCenyBazowe({});
      setPokazSkladniki(false);
      setWybraneSkladniki([]);
      
      fetchProdukty();
    } catch (error: any) {
      console.error("Błąd podczas dodawania produktu:", error.message);
      toast({
        title: "Błąd",
        description: "Nie udało się dodać produktu",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Dodaj nowy produkt</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nazwa">Nazwa produktu</Label>
              <Input
                id="nazwa"
                value={nazwa}
                onChange={(e) => setNazwa(e.target.value)}
                placeholder="Np. Pizza Margherita, Burger Classic"
                disabled={isSubmitting}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="kategoria">Kategoria</Label>
              <Select 
                value={kategoriaId} 
                onValueChange={setKategoriaId}
                disabled={isSubmitting || kategorie.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Wybierz kategorię" />
                </SelectTrigger>
                <SelectContent>
                  {kategorie.map((kategoria) => (
                    <SelectItem key={kategoria.id} value={kategoria.id.toString()}>
                      {kategoria.nazwa}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {kategorie.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Najpierw dodaj kategorie w zakładce "Kategorie"
                </p>
              )}
            </div>
            
            {kategoriaId && (
              <div className="space-y-2">
                <Label>Ceny bazowe dla rozmiarów</Label>
                {rozmiary.length > 0 ? (
                  <div className="grid grid-cols-1 gap-4">
                    {rozmiary.map((rozmiar) => (
                      <div key={rozmiar.id} className="flex items-center justify-between">
                        <Label htmlFor={`cena-${rozmiar.id}`} className="flex-grow">
                          {rozmiar.nazwa}:
                        </Label>
                        <Input
                          id={`cena-${rozmiar.id}`}
                          value={cenyBazowe[rozmiar.id] || ""}
                          onChange={(e) => handleCenaChange(rozmiar.id, e.target.value)}
                          placeholder="0.00"
                          className="w-24 ml-2"
                          disabled={isSubmitting}
                        />
                        <span className="ml-2">zł</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground p-4 border rounded-md">
                    <p>Brak rozmiarów dla wybranej kategorii.</p>
                    <p className="mt-2">Dodaj rozmiary w zakładce "Kategorie" dla tej kategorii.</p>
                  </div>
                )}
              </div>
            )}
            
            <div className="flex items-center space-x-2">
              <Switch
                id="pokaz-skladniki"
                checked={pokazSkladniki}
                onCheckedChange={setPokazSkladniki}
                disabled={isSubmitting}
              />
              <Label htmlFor="pokaz-skladniki">Składniki</Label>
            </div>
            
            {pokazSkladniki && (
              <div className="space-y-2">
                <Label>Wybierz składniki</Label>
                {skladniki.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Najpierw dodaj składniki w zakładce "Składniki"
                  </p>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {skladniki.map((skladnik) => (
                      <Button
                        key={skladnik.id}
                        type="button"
                        variant={wybraneSkladniki.includes(skladnik.id) ? "default" : "outline"}
                        onClick={() => handleSkladnikToggle(skladnik.id)}
                        className="justify-start"
                        disabled={isSubmitting}
                      >
                        {skladnik.nazwa}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            <Button 
              type="submit" 
              disabled={
                isSubmitting || 
                !nazwa.trim() || 
                !kategoriaId || 
                kategorie.length === 0 || 
                rozmiary.length === 0
              }
            >
              {isSubmitting ? "Dodawanie..." : "Dodaj produkt"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lista produktów</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-4">Ładowanie...</div>
          ) : produkty.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              Brak produktów. Dodaj pierwszy produkt.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nazwa</TableHead>
                  <TableHead>Kategoria</TableHead>
                  <TableHead className="text-right">Akcje</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {produkty.map((produkt) => (
                  <TableRow key={produkt.id}>
                    <TableCell>{produkt.nazwa}</TableCell>
                    <TableCell>{produkt.kategoria_nazwa}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        {/* Tutaj będą przyciski edycji i usuwania produktu */}
                        <Button variant="outline" size="icon" disabled>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="icon" disabled>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

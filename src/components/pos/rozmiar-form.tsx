"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/ui/use-toast";

interface RodzajSkladnikow {
  id: number;
  nazwa: string;
}

interface RozmiarFormProps {
  kategoriaId: number;
  rodzajeSkladnikow: RodzajSkladnikow[];
  onSuccess: () => void;
}

export function RozmiarForm({ kategoriaId, rodzajeSkladnikow, onSuccess }: RozmiarFormProps) {
  const [nazwa, setNazwa] = useState("");
  const [ceny, setCeny] = useState<Record<number, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const handleCenaChange = (rodzajId: number, value: string) => {
    setCeny(prev => ({
      ...prev,
      [rodzajId]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!nazwa.trim()) {
      toast({
        title: "Błąd",
        description: "Nazwa rozmiaru nie może być pusta",
        variant: "destructive",
      });
      return;
    }

    // Sprawdź, czy wszystkie ceny są poprawne
    const cenaParsed: Record<number, number> = {};
    let hasInvalidCena = false;

    for (const rodzajId in ceny) {
      if (ceny[rodzajId].trim() === "") continue;
      
      const cenaValue = parseFloat(ceny[rodzajId].replace(",", "."));
      if (isNaN(cenaValue) || cenaValue < 0) {
        hasInvalidCena = true;
        break;
      }
      cenaParsed[rodzajId] = cenaValue;
    }

    if (hasInvalidCena) {
      toast({
        title: "Błąd",
        description: "Ceny muszą być liczbami dodatnimi",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Dodaj rozmiar
      const { data: rozmiarData, error: rozmiarError } = await supabase
        .from("rozmiary")
        .insert([
          { nazwa, kategoria_id: kategoriaId }
        ])
        .select();

      if (rozmiarError) {
        throw rozmiarError;
      }

      const rozmiarId = rozmiarData[0].id;

      // Dodaj ceny dla rodzajów składników
      const cenyToInsert = Object.entries(cenaParsed).map(([rodzajIdStr, cena]) => ({
        rozmiar_id: rozmiarId,
        rodzaj_skladnika_id: parseInt(rodzajIdStr),
        cena
      }));

      if (cenyToInsert.length > 0) {
        const { error: cenyError } = await supabase
          .from("ceny_rodzajow_skladnikow")
          .insert(cenyToInsert);

        if (cenyError) {
          throw cenyError;
        }
      }

      toast({
        title: "Sukces",
        description: "Rozmiar został dodany",
      });
      
      setNazwa("");
      setCeny({});
      setShowForm(false);
      onSuccess();
    } catch (error: any) {
      console.error("Błąd podczas dodawania rozmiaru:", error.message);
      toast({
        title: "Błąd",
        description: "Nie udało się dodać rozmiaru",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!showForm) {
    return (
      <Button 
        variant="outline" 
        className="w-full flex items-center justify-center gap-2"
        onClick={() => setShowForm(true)}
      >
        <Plus className="h-4 w-4" />
        Dodaj nowy rozmiar
      </Button>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Dodaj nowy rozmiar</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nazwa-rozmiaru">Nazwa rozmiaru</Label>
            <Input
              id="nazwa-rozmiaru"
              value={nazwa}
              onChange={(e) => setNazwa(e.target.value)}
              placeholder="Np. Mała, Średnia, Duża"
              disabled={isSubmitting}
            />
          </div>
          
          {rodzajeSkladnikow.length > 0 && (
            <div className="space-y-2">
              <Label>Ceny dla rodzajów składników</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {rodzajeSkladnikow.map((rodzaj) => (
                  <div key={rodzaj.id} className="space-y-1">
                    <Label htmlFor={`cena-${rodzaj.id}`} className="text-sm">
                      {rodzaj.nazwa} (zł)
                    </Label>
                    <Input
                      id={`cena-${rodzaj.id}`}
                      value={ceny[rodzaj.id] || ""}
                      onChange={(e) => handleCenaChange(rodzaj.id, e.target.value)}
                      placeholder="0.00"
                      disabled={isSubmitting}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="flex justify-end space-x-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setShowForm(false)} 
              disabled={isSubmitting}
            >
              Anuluj
            </Button>
            <Button type="submit" disabled={isSubmitting || !nazwa.trim()}>
              {isSubmitting ? "Dodawanie..." : "Dodaj rozmiar"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

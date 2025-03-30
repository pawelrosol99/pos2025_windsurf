"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/lib/supabase";
import { Pencil, Trash2 } from "lucide-react";
import { StanowiskoEditDialog } from "./stanowisko-edit-dialog";
import { StanowiskoDeleteDialog } from "./stanowisko-delete-dialog";
import { toast } from "@/components/ui/use-toast";

interface Stanowisko {
  id: number;
  nazwa: string;
  stawka_godzinowa: number;
  firma_id: number;
  data_utworzenia: string;
}

interface StanowiskaTabProps {
  firmaId: string;
}

export function StanowiskaTab({ firmaId }: StanowiskaTabProps) {
  const [nazwa, setNazwa] = useState("");
  const [stawkaGodzinowa, setStawkaGodzinowa] = useState("");
  const [stanowiska, setStanowiska] = useState<Stanowisko[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchStanowiska = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("stanowiska")
        .select("*")
        .eq("firma_id", firmaId)
        .order("nazwa");

      if (error) {
        throw error;
      }

      setStanowiska(data || []);
    } catch (error: any) {
      console.error("Błąd podczas pobierania stanowisk:", error.message);
      toast({
        title: "Błąd",
        description: "Nie udało się pobrać stanowisk",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStanowiska();
  }, [firmaId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!nazwa.trim()) {
      toast({
        title: "Błąd",
        description: "Nazwa stanowiska nie może być pusta",
        variant: "destructive",
      });
      return;
    }

    const stawkaValue = parseFloat(stawkaGodzinowa.replace(",", "."));
    if (isNaN(stawkaValue) || stawkaValue <= 0) {
      toast({
        title: "Błąd",
        description: "Stawka godzinowa musi być liczbą dodatnią",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const { data, error } = await supabase
        .from("stanowiska")
        .insert([
          { 
            nazwa, 
            stawka_godzinowa: stawkaValue, 
            firma_id: firmaId 
          }
        ])
        .select();

      if (error) {
        throw error;
      }

      toast({
        title: "Sukces",
        description: "Stanowisko zostało dodane",
      });
      
      setNazwa("");
      setStawkaGodzinowa("");
      fetchStanowiska();
    } catch (error: any) {
      console.error("Błąd podczas dodawania stanowiska:", error.message);
      toast({
        title: "Błąd",
        description: "Nie udało się dodać stanowiska",
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
          <CardTitle>Dodaj nowe stanowisko</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nazwa">Nazwa</Label>
              <Input
                id="nazwa"
                value={nazwa}
                onChange={(e) => setNazwa(e.target.value)}
                placeholder="Np. Kelner, Kucharz, Kierowca"
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stawka">Stawka godzinowa (zł)</Label>
              <Input
                id="stawka"
                value={stawkaGodzinowa}
                onChange={(e) => setStawkaGodzinowa(e.target.value)}
                placeholder="Np. 20.00"
                disabled={isSubmitting}
              />
            </div>
            <Button 
              type="submit" 
              disabled={isSubmitting || !nazwa.trim() || !stawkaGodzinowa.trim()}
            >
              {isSubmitting ? "Dodawanie..." : "Dodaj stanowisko"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lista stanowisk</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-4">Ładowanie...</div>
          ) : stanowiska.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              Brak stanowisk. Dodaj pierwsze stanowisko.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nazwa</TableHead>
                  <TableHead>Stawka godzinowa</TableHead>
                  <TableHead className="text-right">Akcje</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stanowiska.map((stanowisko) => (
                  <TableRow key={stanowisko.id}>
                    <TableCell>{stanowisko.nazwa}</TableCell>
                    <TableCell>{stanowisko.stawka_godzinowa.toFixed(2)} zł</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <StanowiskoEditDialog 
                          stanowisko={stanowisko} 
                          onSuccess={fetchStanowiska} 
                        />
                        <StanowiskoDeleteDialog 
                          stanowiskoId={stanowisko.id} 
                          stanowiskoNazwa={stanowisko.nazwa} 
                          onSuccess={fetchStanowiska} 
                        />
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

"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/lib/supabase";
import { Pencil, Trash2 } from "lucide-react";
import { SkladnikEditDialog } from "./skladnik-edit-dialog";
import { SkladnikDeleteDialog } from "./skladnik-delete-dialog";
import { toast } from "@/components/ui/use-toast";

interface RodzajSkladnikow {
  id: number;
  nazwa: string;
}

interface Skladnik {
  id: number;
  nazwa: string;
  rodzaj_id: number;
  firma_id: number;
  data_utworzenia: string;
  rodzaj_nazwa?: string;
}

interface SkladnikiTabProps {
  firmaId: string;
}

export function SkladnikiTab({ firmaId }: SkladnikiTabProps) {
  const [nazwa, setNazwa] = useState("");
  const [rodzajId, setRodzajId] = useState("");
  const [rodzajeSkladnikow, setRodzajeSkladnikow] = useState<RodzajSkladnikow[]>([]);
  const [skladniki, setSkladniki] = useState<Skladnik[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const fetchSkladniki = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("skladniki")
        .select(`
          id, 
          nazwa, 
          rodzaj_id, 
          firma_id, 
          data_utworzenia,
          rodzaje_skladnikow (nazwa)
        `)
        .eq("firma_id", firmaId)
        .order("nazwa");

      if (error) {
        throw error;
      }

      // Przekształć dane, aby uzyskać nazwę rodzaju składnika
      const transformedData = data?.map(item => ({
        ...item,
        rodzaj_nazwa: item.rodzaje_skladnikow?.nazwa
      })) || [];

      setSkladniki(transformedData);
    } catch (error: any) {
      console.error("Błąd podczas pobierania składników:", error.message);
      toast({
        title: "Błąd",
        description: "Nie udało się pobrać składników",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRodzajeSkladnikow();
    fetchSkladniki();
  }, [firmaId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!nazwa.trim() || !rodzajId) {
      toast({
        title: "Błąd",
        description: "Nazwa składnika i rodzaj są wymagane",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const { data, error } = await supabase
        .from("skladniki")
        .insert([
          { 
            nazwa, 
            rodzaj_id: rodzajId, 
            firma_id: firmaId 
          }
        ])
        .select();

      if (error) {
        throw error;
      }

      toast({
        title: "Sukces",
        description: "Składnik został dodany",
      });
      
      setNazwa("");
      setRodzajId("");
      fetchSkladniki();
    } catch (error: any) {
      console.error("Błąd podczas dodawania składnika:", error.message);
      toast({
        title: "Błąd",
        description: "Nie udało się dodać składnika",
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
          <CardTitle>Dodaj nowy składnik</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nazwa">Nazwa</Label>
              <Input
                id="nazwa"
                value={nazwa}
                onChange={(e) => setNazwa(e.target.value)}
                placeholder="Np. Szynka, Pieczarki, Sos pomidorowy"
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rodzaj">Rodzaj składnika</Label>
              <Select 
                value={rodzajId} 
                onValueChange={setRodzajId}
                disabled={isSubmitting || rodzajeSkladnikow.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Wybierz rodzaj składnika" />
                </SelectTrigger>
                <SelectContent>
                  {rodzajeSkladnikow.map((rodzaj) => (
                    <SelectItem key={rodzaj.id} value={rodzaj.id.toString()}>
                      {rodzaj.nazwa}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {rodzajeSkladnikow.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Najpierw dodaj rodzaje składników w zakładce "Rodzaje składników"
                </p>
              )}
            </div>
            <Button 
              type="submit" 
              disabled={isSubmitting || !nazwa.trim() || !rodzajId || rodzajeSkladnikow.length === 0}
            >
              {isSubmitting ? "Dodawanie..." : "Dodaj składnik"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lista składników</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-4">Ładowanie...</div>
          ) : skladniki.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              Brak składników. Dodaj pierwszy składnik.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nazwa</TableHead>
                  <TableHead>Rodzaj</TableHead>
                  <TableHead className="text-right">Akcje</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {skladniki.map((skladnik) => (
                  <TableRow key={skladnik.id}>
                    <TableCell>{skladnik.nazwa}</TableCell>
                    <TableCell>{skladnik.rodzaj_nazwa}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <SkladnikEditDialog 
                          skladnik={skladnik} 
                          rodzajeSkladnikow={rodzajeSkladnikow}
                          onSuccess={fetchSkladniki} 
                        />
                        <SkladnikDeleteDialog 
                          skladnikId={skladnik.id} 
                          skladnikNazwa={skladnik.nazwa} 
                          onSuccess={fetchSkladniki} 
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

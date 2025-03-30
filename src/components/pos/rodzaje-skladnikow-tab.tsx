"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/lib/supabase";
import { Pencil, Trash2 } from "lucide-react";
import { RodzajSkladnikowEditDialog } from "./rodzaj-skladnikow-edit-dialog";
import { RodzajSkladnikowDeleteDialog } from "./rodzaj-skladnikow-delete-dialog";
import { toast } from "@/components/ui/use-toast";

interface RodzajSkladnikow {
  id: number;
  nazwa: string;
  firma_id: number;
  data_utworzenia: string;
}

interface RodzajeSkladnikowTabProps {
  firmaId: string;
}

export function RodzajeSkladnikowTab({ firmaId }: RodzajeSkladnikowTabProps) {
  const [nazwa, setNazwa] = useState("");
  const [rodzajeSkladnikow, setRodzajeSkladnikow] = useState<RodzajSkladnikow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchRodzajeSkladnikow = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("rodzaje_skladnikow")
        .select("*")
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
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRodzajeSkladnikow();
  }, [firmaId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!nazwa.trim()) {
      toast({
        title: "Błąd",
        description: "Nazwa rodzaju składnika nie może być pusta",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const { data, error } = await supabase
        .from("rodzaje_skladnikow")
        .insert([
          { nazwa, firma_id: firmaId }
        ])
        .select();

      if (error) {
        throw error;
      }

      toast({
        title: "Sukces",
        description: "Rodzaj składnika został dodany",
      });
      
      setNazwa("");
      fetchRodzajeSkladnikow();
    } catch (error: any) {
      console.error("Błąd podczas dodawania rodzaju składnika:", error.message);
      toast({
        title: "Błąd",
        description: "Nie udało się dodać rodzaju składnika",
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
          <CardTitle>Dodaj nowy rodzaj składnika</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nazwa">Nazwa</Label>
              <Input
                id="nazwa"
                value={nazwa}
                onChange={(e) => setNazwa(e.target.value)}
                placeholder="Np. Mięso, Warzywa, Sosy"
                disabled={isSubmitting}
              />
            </div>
            <Button type="submit" disabled={isSubmitting || !nazwa.trim()}>
              {isSubmitting ? "Dodawanie..." : "Dodaj rodzaj składnika"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lista rodzajów składników</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-4">Ładowanie...</div>
          ) : rodzajeSkladnikow.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              Brak rodzajów składników. Dodaj pierwszy rodzaj.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nazwa</TableHead>
                  <TableHead className="text-right">Akcje</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rodzajeSkladnikow.map((rodzaj) => (
                  <TableRow key={rodzaj.id}>
                    <TableCell>{rodzaj.nazwa}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <RodzajSkladnikowEditDialog 
                          rodzaj={rodzaj} 
                          onSuccess={fetchRodzajeSkladnikow} 
                        />
                        <RodzajSkladnikowDeleteDialog 
                          rodzajId={rodzaj.id} 
                          rodzajNazwa={rodzaj.nazwa} 
                          onSuccess={fetchRodzajeSkladnikow} 
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

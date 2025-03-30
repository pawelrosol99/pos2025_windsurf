"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/ui/use-toast";

interface NoweZamowienieDialogProps {
  firmaId: string;
  onSuccess: (zamowienieId: number) => void;
}

export function NoweZamowienieDialog({ firmaId, onSuccess }: NoweZamowienieDialogProps) {
  const [open, setOpen] = useState(false);
  const [rodzajZamowienia, setRodzajZamowienia] = useState<"sala" | "wynos" | "dowoz">("sala");
  const [numerStolika, setNumerStolika] = useState("");
  const [adresDostawy, setAdresDostawy] = useState("");
  const [telefonKlienta, setTelefonKlienta] = useState("");
  const [uwagi, setUwagi] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setRodzajZamowienia("sala");
    setNumerStolika("");
    setAdresDostawy("");
    setTelefonKlienta("");
    setUwagi("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Walidacja danych
      if (rodzajZamowienia === "sala" && !numerStolika.trim()) {
        throw new Error("Numer stolika jest wymagany dla zamówienia na sali");
      }

      if (rodzajZamowienia === "dowoz" && !adresDostawy.trim()) {
        throw new Error("Adres dostawy jest wymagany dla zamówienia z dowozem");
      }

      if ((rodzajZamowienia === "dowoz" || rodzajZamowienia === "wynos") && !telefonKlienta.trim()) {
        throw new Error("Numer telefonu klienta jest wymagany dla zamówienia na wynos lub z dowozem");
      }

      // Generowanie numeru zamówienia (format: RRMMDD-XXX)
      const now = new Date();
      const datePart = `${now.getFullYear().toString().slice(2)}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}`;
      
      // Pobierz ostatnie zamówienie z dzisiaj, aby wygenerować kolejny numer
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const { data: ostatnieZamowienia, error: errorZamowienia } = await supabase
        .from("zamowienia")
        .select("numer")
        .gte("godzina_utworzenia", startOfDay)
        .order("godzina_utworzenia", { ascending: false })
        .limit(1);

      if (errorZamowienia) {
        throw errorZamowienia;
      }

      let numerPorzadkowy = 1;
      if (ostatnieZamowienia && ostatnieZamowienia.length > 0) {
        const ostatniNumer = ostatnieZamowienia[0].numer;
        const ostatniNumerPorzadkowy = parseInt(ostatniNumer.split('-')[1]);
        if (!isNaN(ostatniNumerPorzadkowy)) {
          numerPorzadkowy = ostatniNumerPorzadkowy + 1;
        }
      }

      const numerZamowienia = `${datePart}-${numerPorzadkowy.toString().padStart(3, '0')}`;

      // Zapisz nowe zamówienie
      const { data, error } = await supabase
        .from("zamowienia")
        .insert([
          {
            firma_id: firmaId,
            numer: numerZamowienia,
            rodzaj: rodzajZamowienia,
            stolik: rodzajZamowienia === "sala" ? numerStolika : null,
            adres_dostawy: rodzajZamowienia === "dowoz" ? adresDostawy : null,
            telefon_klienta: rodzajZamowienia === "dowoz" || rodzajZamowienia === "wynos" ? telefonKlienta : null,
            uwagi: uwagi.trim() || null,
            status: "nowe",
            forma_platnosci: "gotowka", // Domyślna forma płatności
            status_platnosci: "do_zaplaty",
            godzina_utworzenia: new Date().toISOString(),
            kwota_calkowita: 0, // Początkowa kwota
          }
        ])
        .select();

      if (error) {
        throw error;
      }

      toast({
        title: "Sukces",
        description: `Utworzono nowe zamówienie #${numerZamowienia}`,
      });

      resetForm();
      setOpen(false);
      onSuccess(data[0].id);
    } catch (error: any) {
      console.error("Błąd podczas tworzenia zamówienia:", error.message);
      toast({
        title: "Błąd",
        description: error.message || "Nie udało się utworzyć zamówienia",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button onClick={() => {
          resetForm();
          setOpen(true);
        }}>
          <Plus className="mr-2 h-4 w-4" /> Nowe zamówienie
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Utwórz nowe zamówienie</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="rodzaj">Rodzaj zamówienia</Label>
            <Select 
              value={rodzajZamowienia} 
              onValueChange={(value) => setRodzajZamowienia(value as "sala" | "wynos" | "dowoz")}
            >
              <SelectTrigger>
                <SelectValue placeholder="Wybierz rodzaj zamówienia" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sala">Sala</SelectItem>
                <SelectItem value="wynos">Wynos</SelectItem>
                <SelectItem value="dowoz">Dowóz</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {rodzajZamowienia === "sala" && (
            <div className="space-y-2">
              <Label htmlFor="numerStolika">Numer stolika</Label>
              <Input
                id="numerStolika"
                value={numerStolika}
                onChange={(e) => setNumerStolika(e.target.value)}
                placeholder="Np. 1, 2, 3..."
                disabled={isSubmitting}
              />
            </div>
          )}

          {rodzajZamowienia === "dowoz" && (
            <div className="space-y-2">
              <Label htmlFor="adresDostawy">Adres dostawy</Label>
              <Input
                id="adresDostawy"
                value={adresDostawy}
                onChange={(e) => setAdresDostawy(e.target.value)}
                placeholder="Np. ul. Przykładowa 1/2, Warszawa"
                disabled={isSubmitting}
              />
            </div>
          )}

          {(rodzajZamowienia === "dowoz" || rodzajZamowienia === "wynos") && (
            <div className="space-y-2">
              <Label htmlFor="telefonKlienta">Telefon klienta</Label>
              <Input
                id="telefonKlienta"
                value={telefonKlienta}
                onChange={(e) => setTelefonKlienta(e.target.value)}
                placeholder="Np. 123-456-789"
                disabled={isSubmitting}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="uwagi">Uwagi</Label>
            <Input
              id="uwagi"
              value={uwagi}
              onChange={(e) => setUwagi(e.target.value)}
              placeholder="Dodatkowe informacje (opcjonalnie)"
              disabled={isSubmitting}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
            >
              Anuluj
            </Button>
            <Button 
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Tworzenie..." : "Utwórz zamówienie"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

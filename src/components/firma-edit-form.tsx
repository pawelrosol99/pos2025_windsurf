import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogTrigger 
} from "@/components/ui/dialog";
import { supabase } from "@/lib/supabase";
import { Edit2 } from "lucide-react";

interface Firma {
  id: number;
  nazwa: string;
  ulica: string;
  miejscowosc: string;
  nr_tel: string;
  mail: string;
}

interface FirmaEditFormProps {
  firma: Firma;
  onSuccess?: () => void;
}

export function FirmaEditForm({ firma, onSuccess }: FirmaEditFormProps) {
  const [formData, setFormData] = useState<Firma>({
    id: firma.id,
    nazwa: firma.nazwa,
    ulica: firma.ulica,
    miejscowosc: firma.miejscowosc,
    nr_tel: firma.nr_tel,
    mail: firma.mail
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // Aktualizuj dane formularza gdy zmienia się firma
    setFormData({
      id: firma.id,
      nazwa: firma.nazwa,
      ulica: firma.ulica,
      miejscowosc: firma.miejscowosc,
      nr_tel: firma.nr_tel,
      mail: firma.mail
    });
  }, [firma]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase
        .from("firmy")
        .update({
          nazwa: formData.nazwa,
          ulica: formData.ulica,
          miejscowosc: formData.miejscowosc,
          nr_tel: formData.nr_tel,
          mail: formData.mail
        })
        .eq("id", firma.id);

      if (error) throw error;

      setOpen(false);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message || "Wystąpił błąd podczas aktualizacji firmy");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" className="h-8 w-8">
          <Edit2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edytuj firmę</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nazwa">Nazwa</Label>
              <Input
                id="nazwa"
                name="nazwa"
                value={formData.nazwa}
                onChange={handleChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ulica">Ulica</Label>
              <Input
                id="ulica"
                name="ulica"
                value={formData.ulica}
                onChange={handleChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="miejscowosc">Miejscowość</Label>
              <Input
                id="miejscowosc"
                name="miejscowosc"
                value={formData.miejscowosc}
                onChange={handleChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nr_tel">Numer telefonu</Label>
              <Input
                id="nr_tel"
                name="nr_tel"
                value={formData.nr_tel}
                onChange={handleChange}
                required
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="mail">Email</Label>
              <Input
                id="mail"
                name="mail"
                type="email"
                value={formData.mail}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          {error && (
            <div className="text-destructive text-sm mt-2">{error}</div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Anuluj
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Zapisywanie..." : "Zapisz zmiany"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

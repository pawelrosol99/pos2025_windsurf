import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";

export function FirmaForm({ onSuccess }: { onSuccess?: () => void }) {
  const [formData, setFormData] = useState({
    nazwa: "",
    ulica: "",
    miejscowosc: "",
    nr_tel: "",
    mail: ""
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        .insert([formData]);

      if (error) throw error;

      // Resetuj formularz
      setFormData({
        nazwa: "",
        ulica: "",
        miejscowosc: "",
        nr_tel: "",
        mail: ""
      });

      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message || "Wystąpił błąd podczas dodawania firmy");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Dodaj nową firmę</CardTitle>
      </CardHeader>
      <CardContent>
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

          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Dodawanie..." : "Dodaj firmę"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Navigation } from "@/components/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { RodzajeSkladnikowTab } from "@/components/pos/rodzaje-skladnikow-tab";
import { SkladnikiTab } from "@/components/pos/skladniki-tab";
import { KategorieTab } from "@/components/pos/kategorie-tab";
import { StanowiskaTab } from "@/components/pos/stanowiska-tab";
import { ProduktyTab } from "@/components/pos/produkty-tab";

export default function UstawieniaPage() {
  const params = useParams();
  const firmaId = params.id as string;
  const [isLoading, setIsLoading] = useState(true);
  const [firmaData, setFirmaData] = useState<any>(null);

  useEffect(() => {
    const fetchFirmaData = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from("firmy")
          .select("*")
          .eq("id", firmaId)
          .single();

        if (error) {
          throw error;
        }

        setFirmaData(data);
      } catch (error) {
        console.error("Błąd podczas pobierania danych firmy:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (firmaId) {
      fetchFirmaData();
    }
  }, [firmaId]);

  if (isLoading) {
    return <div className="flex justify-center items-center min-h-screen">Ładowanie...</div>;
  }

  if (!firmaData) {
    return <div className="flex justify-center items-center min-h-screen">Nie znaleziono firmy</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation firmaId={firmaId} />
      <main className="container mx-auto py-6 px-4">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Ustawienia - {firmaData.nazwa}</CardTitle>
            <CardDescription>
              Zarządzaj ustawieniami systemu POS dla Twojej firmy
            </CardDescription>
          </CardHeader>
        </Card>

        <Tabs defaultValue="rodzaje-skladnikow" className="w-full">
          <TabsList className="grid grid-cols-5 mb-8">
            <TabsTrigger value="rodzaje-skladnikow">Rodzaje składników</TabsTrigger>
            <TabsTrigger value="skladniki">Składniki</TabsTrigger>
            <TabsTrigger value="kategorie">Kategorie</TabsTrigger>
            <TabsTrigger value="stanowiska">Stanowiska</TabsTrigger>
            <TabsTrigger value="produkty">Produkty</TabsTrigger>
          </TabsList>

          <TabsContent value="rodzaje-skladnikow">
            <RodzajeSkladnikowTab firmaId={firmaId} />
          </TabsContent>

          <TabsContent value="skladniki">
            <SkladnikiTab firmaId={firmaId} />
          </TabsContent>

          <TabsContent value="kategorie">
            <KategorieTab firmaId={firmaId} />
          </TabsContent>

          <TabsContent value="stanowiska">
            <StanowiskaTab firmaId={firmaId} />
          </TabsContent>

          <TabsContent value="produkty">
            <ProduktyTab firmaId={firmaId} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

import { createClient } from '@supabase/supabase-js';

// Zgodnie z zasadami projektu, nie implementujemy zaawansowanych zabezpieczeń
// Dane logowania przechowywane są w czystym tekście w bazie danych
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Sprawdzamy, czy mamy wymagane zmienne środowiskowe
if (!supabaseUrl || !supabaseKey) {
  console.error('Brak wymaganych zmiennych środowiskowych dla Supabase');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

// Funkcja pomocnicza do tworzenia klienta dla konkretnej firmy
export const createCompanyClient = (companyId: string) => {
  // W rzeczywistej implementacji, tutaj powinno być tworzenie połączenia do odpowiedniej bazy danych firmy
  // Dla uproszczenia, używamy tego samego klienta z dodatkowym parametrem
  return {
    ...supabase,
    companyId
  };
};

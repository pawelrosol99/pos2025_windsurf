import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

interface NavigationProps {
  isSuperAdmin?: boolean;
  firmaId?: string;
}

export function Navigation({ isSuperAdmin = false, firmaId }: NavigationProps) {
  const pathname = usePathname();
  const [userData, setUserData] = useState<{
    imie_nazwisko?: string;
    login?: string;
    rola?: string;
  }>({});

  useEffect(() => {
    // Pobierz dane zalogowanego użytkownika z localStorage
    const getUserData = () => {
      const storedUserData = localStorage.getItem('userData');
      if (storedUserData) {
        setUserData(JSON.parse(storedUserData));
      }
    };
    
    getUserData();
  }, []);
  
  return (
    <nav className="bg-card text-card-foreground">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Link href="/" className="text-xl font-bold">
              {isSuperAdmin ? "Panel Super Admina" : "Panel Firmy"}
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            {isSuperAdmin ? (
              <Link 
                href="/firmy" 
                className={cn(
                  "px-3 py-2 rounded-md text-sm font-medium",
                  pathname === "/firmy" 
                    ? "bg-card-foreground text-card" 
                    : "hover:bg-card-foreground/10"
                )}
              >
                Firmy
              </Link>
            ) : (
              <>
                <Link 
                  href={`/firma/${firmaId}/pracownicy`}
                  className={cn(
                    "px-3 py-2 rounded-md text-sm font-medium",
                    pathname.includes("/pracownicy") 
                      ? "bg-card-foreground text-card" 
                      : "hover:bg-card-foreground/10"
                  )}
                >
                  Pracownicy
                </Link>
                <Link 
                  href={`/firma/${firmaId}/kelner`}
                  className={cn(
                    "px-3 py-2 rounded-md text-sm font-medium",
                    pathname.includes("/kelner") 
                      ? "bg-card-foreground text-card" 
                      : "hover:bg-card-foreground/10"
                  )}
                >
                  Kelner
                </Link>
                <Link 
                  href={`/firma/${firmaId}/ustawienia`}
                  className={cn(
                    "px-3 py-2 rounded-md text-sm font-medium",
                    pathname.includes("/ustawienia") 
                      ? "bg-card-foreground text-card" 
                      : "hover:bg-card-foreground/10"
                  )}
                >
                  Ustawienia
                </Link>
              </>
            )}
            {userData.imie_nazwisko && (
              <div className="flex flex-col items-end mr-2">
                <span className="font-bold text-sm">{userData.imie_nazwisko}</span>
                <span className="text-xs text-muted-foreground">
                  {userData.rola === "superadmin" 
                    ? "Super Admin" 
                    : userData.rola === "admin" 
                      ? "Administrator" 
                      : "Pracownik"}
                </span>
              </div>
            )}
            <Link 
              href="/logout" 
              className="px-3 py-2 rounded-md text-sm font-medium hover:bg-card-foreground/10"
            >
              Wyloguj
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}

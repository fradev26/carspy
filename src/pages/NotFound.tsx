import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { SEOHead } from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Car } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <main className="flex min-h-[60vh] items-center justify-center">
      <SEOHead
        title="Pagina niet gevonden — VATUUR."
        description="De pagina die je zoekt bestaat niet of is verplaatst."
        noindex
      />
      <div className="text-center space-y-4">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
          <Car className="h-8 w-8 text-muted-foreground" />
        </div>
        <h1 className="text-4xl font-bold">404</h1>
        <p className="text-xl text-muted-foreground">Pagina niet gevonden</p>
        <p className="text-sm text-muted-foreground max-w-md">
          De pagina die je zoekt bestaat niet of is verplaatst.
        </p>
        <Button asChild className="mt-2">
          <Link to="/">Terug naar home</Link>
        </Button>
      </div>
    </main>
  );
};

export default NotFound;

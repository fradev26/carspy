import { SEOHead } from '@/components/SEOHead';

export default function Terms() {
  return (
    <div className="container max-w-3xl py-12">
      <SEOHead
        title="Algemene voorwaarden - AutoSpy"
        description="Lees de algemene voorwaarden van AutoSpy."
        canonical="https://autospy.nl/voorwaarden"
      />
      <h1 className="text-3xl font-bold">Algemene voorwaarden</h1>
      <div className="mt-8 space-y-6 text-muted-foreground leading-relaxed">
        <section>
          <h2 className="text-lg font-semibold text-foreground">1. Definities</h2>
          <p className="mt-2">
            In deze algemene voorwaarden wordt verstaan onder "AutoSpy": het platform voor het kopen en verkopen van tweedehands auto's. "Gebruiker": iedere bezoeker of geregistreerde gebruiker van het platform.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-foreground">2. Toepasselijkheid</h2>
          <p className="mt-2">
            Deze voorwaarden zijn van toepassing op elk gebruik van AutoSpy en alle overeenkomsten die via het platform tot stand komen.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-foreground">3. Gebruik van het platform</h2>
          <p className="mt-2">
            Gebruikers zijn verantwoordelijk voor de juistheid van de door hen verstrekte informatie. AutoSpy is een bemiddelingsplatform en is geen partij bij transacties tussen kopers en verkopers.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-foreground">4. Aansprakelijkheid</h2>
          <p className="mt-2">
            AutoSpy spant zich in voor een betrouwbaar platform maar kan niet garanderen dat alle informatie op het platform juist en volledig is.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-foreground">5. Contact</h2>
          <p className="mt-2">
            Voor vragen over deze voorwaarden kunt u contact opnemen via{' '}
            <a href="mailto:info@autospy.nl" className="text-primary underline">info@autospy.nl</a>.
          </p>
        </section>
      </div>
    </div>
  );
}

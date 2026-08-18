import { SEOHead } from '@/components/SEOHead';

export default function Privacy() {
  return (
    <div className="container max-w-3xl py-12">
      <SEOHead
        title="Privacybeleid - VATUUR."
        description="Lees het privacybeleid van VATUUR. Hoe wij omgaan met je persoonsgegevens."
        canonical="https://vatuur.be/privacy"
      />
      <h1 className="text-3xl font-bold">Privacybeleid</h1>
      <div className="mt-8 space-y-6 text-muted-foreground leading-relaxed">
        <section>
          <h2 className="text-lg font-semibold text-foreground">1. Inleiding</h2>
          <p className="mt-2">
            VATUUR. respecteert de privacy van alle gebruikers en draagt er zorg voor dat persoonlijke informatie vertrouwelijk wordt behandeld. Dit privacybeleid is van toepassing op alle diensten van VATUUR.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-foreground">2. Gegevensverzameling</h2>
          <p className="mt-2">
            Wij verzamelen alleen gegevens die nodig zijn voor het functioneren van onze dienst, waaronder accountgegevens, zoekvoorkeuren en advertentie-informatie.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-foreground">3. Gebruik van gegevens</h2>
          <p className="mt-2">
            Uw gegevens worden uitsluitend gebruikt voor het verlenen van onze diensten, het verbeteren van de gebruikerservaring en het nakomen van wettelijke verplichtingen.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-foreground">4. Contact</h2>
          <p className="mt-2">
            Voor vragen over dit privacybeleid kunt u contact opnemen via{' '}
            <a href="mailto:info@vatuur.be" className="text-primary-strong underline">info@vatuur.be</a>.
          </p>
        </section>
      </div>
    </div>
  );
}

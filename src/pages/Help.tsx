import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { HelpCircle, Search, Mail } from 'lucide-react';
import { SEOHead } from '@/components/SEOHead';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { FAQS, FAQ_CATEGORIES, type FaqCategory } from '@/data/faq';

export default function Help() {
  const [q, setQ] = useState('');
  const [cat, setCat] = useState<FaqCategory>('kopen');

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return FAQS.filter((f) => f.category === cat).filter(
      (f) => !term || f.q.toLowerCase().includes(term) || f.a.toLowerCase().includes(term),
    );
  }, [q, cat]);

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQS.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };

  return (
    <div className="container py-8">
      <SEOHead title="Helpcentrum — VATUUR." description="Antwoorden op de meest gestelde vragen over kopen, verkopen en je VATUUR-account." jsonLd={faqJsonLd as any} />

      <div className="mx-auto max-w-3xl text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary-strong"><HelpCircle className="h-6 w-6" /></div>
        <h1 className="mt-4 text-3xl font-bold">Helpcentrum</h1>
        <p className="mt-2 text-muted-foreground">Vind snel antwoorden op je vragen over VATUUR.</p>
        <div className="relative mt-6">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Zoek een vraag..." className="pl-10 h-12" />
        </div>
      </div>

      <Tabs value={cat} onValueChange={(v) => setCat(v as FaqCategory)} className="mt-8">
        <TabsList className="flex w-full flex-wrap justify-center gap-1">
          {FAQ_CATEGORIES.map((c) => (
            <TabsTrigger key={c.value} value={c.value}>{c.label}</TabsTrigger>
          ))}
        </TabsList>
        {FAQ_CATEGORIES.map((c) => (
          <TabsContent key={c.value} value={c.value} className="mt-6 mx-auto max-w-3xl">
            {filtered.length === 0 ? (
              <Card><CardContent className="py-10 text-center text-muted-foreground">Geen resultaten voor "{q}"</CardContent></Card>
            ) : (
              <Accordion type="single" collapsible className="w-full">
                {filtered.map((f, i) => (
                  <AccordionItem value={`item-${i}`} key={i}>
                    <AccordionTrigger className="text-left">{f.q}</AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">{f.a}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )}
          </TabsContent>
        ))}
      </Tabs>

      <Card className="mx-auto mt-10 max-w-3xl bg-muted/40">
        <CardContent className="flex flex-col items-center gap-3 py-8 text-center sm:flex-row sm:text-left">
          <Mail className="h-8 w-8 text-primary-strong" />
          <div className="flex-1">
            <h3 className="font-semibold">Geen antwoord gevonden?</h3>
            <p className="text-sm text-muted-foreground">Ons supportteam helpt je graag verder binnen één werkdag.</p>
          </div>
          <Button asChild><Link to="/contact">Contacteer support</Link></Button>
        </CardContent>
      </Card>
    </div>
  );
}

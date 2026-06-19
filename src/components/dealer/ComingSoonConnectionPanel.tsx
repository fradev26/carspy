import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import ConnectionPublicationCard, { DEFAULT_PUBLICATION_SETTINGS } from './ConnectionPublicationCard';

interface Props {
  name: string;
  description: string;
}

export default function ComingSoonConnectionPanel({ name, description }: Props) {
  const [value, setValue] = useState(DEFAULT_PUBLICATION_SETTINGS);

  return (
    <div className="space-y-6">
      <Card className="border-border/60">
        <CardHeader>
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <CardTitle>{name}-koppeling</CardTitle>
            <Badge variant="secondary">Binnenkort</Badge>
          </div>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Deze koppeling is nog niet actief. Hieronder zie je vast de instellingen die je later per
            koppeling zelf kan beheren.
          </p>
        </CardContent>
      </Card>

      <ConnectionPublicationCard
        value={value}
        onChange={setValue}
        disabled
        disabledMessage="Verbind eerst je account met deze koppeling om deze instellingen op te slaan."
      />
    </div>
  );
}

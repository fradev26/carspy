/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Props {
  link?: string
  full_name?: string
  invited_email?: string
  role?: 'manager' | 'seller' | 'marketing' | string
  company_name?: string
  inviter_name?: string
}

const ROLE_LABEL: Record<string, string> = {
  manager: 'Manager',
  seller: 'Verkoper',
  marketing: 'Marketing',
}

const ROLE_DESCRIPTION: Record<string, string> = {
  manager: 'Beheer voorraad, advertenties en leads voor het volledige bedrijf.',
  seller: 'Maak en beheer eigen advertenties en volg leads op.',
  marketing: 'Boost advertenties en optimaliseer marketingcampagnes.',
}

const Email = ({
  link = 'https://vatuur.be',
  full_name,
  invited_email,
  role = 'seller',
  company_name,
  inviter_name,
}: Props) => {
  const roleLabel = ROLE_LABEL[role] ?? role
  const roleDescription = ROLE_DESCRIPTION[role] ?? ''
  const greetingName = full_name?.split(' ')[0] ?? null

  return (
    <Html lang="nl" dir="ltr">
      <Head />
      <Preview>
        Je bent uitgenodigd om mee te werken in {company_name ?? 'het VATUUR-dealeraccount'} op VATUUR
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Text style={brand}>
              VATUUR<span style={brandDot}>.</span>
            </Text>
          </Section>

          <Section style={card}>
            <Heading style={h1}>Welkom bij het team{greetingName ? `, ${greetingName}` : ''}</Heading>
            <Text style={paragraph}>
              {inviter_name ? <strong>{inviter_name}</strong> : 'Een collega'} heeft je uitgenodigd om{' '}
              samen te werken in{' '}
              <strong>{company_name ?? 'het VATUUR-dealeraccount'}</strong> op VATUUR — het AI-gedreven
              voertuigplatform voor de Benelux.
            </Text>

            <Section style={roleBox}>
              <Text style={roleEyebrow}>Jouw rol</Text>
              <Text style={roleTitle}>{roleLabel}</Text>
              {roleDescription && <Text style={roleDesc}>{roleDescription}</Text>}
            </Section>

            <Section style={buttonWrap}>
              <Button href={link} style={button}>
                Uitnodiging accepteren
              </Button>
            </Section>

            <Text style={smallMuted}>
              Of plak deze link in je browser:
              <br />
              <span style={mono}>{link}</span>
            </Text>

            <Hr style={hr} />

            <Text style={fineprint}>
              Deze uitnodiging is 7 dagen geldig en gekoppeld aan{' '}
              <strong>{invited_email ?? 'je e-mailadres'}</strong>. Heb je deze uitnodiging niet
              verwacht? Dan kan je deze e-mail veilig negeren — er gebeurt niets met je gegevens.
            </Text>
          </Section>

          <Text style={footer}>
            VATUUR — slimmer kopen en verkopen in de Benelux.
            <br />
            <a href="https://vatuur.be" style={footerLink}>vatuur.be</a>
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: Email,
  subject: (data: Record<string, unknown>) => {
    const company = (data?.company_name as string) || 'VATUUR'
    return `Uitnodiging om samen te werken in ${company}`
  },
  displayName: 'Medewerker-uitnodiging',
  previewData: {
    link: 'https://vatuur.be/uitnodiging?token=preview',
    full_name: 'Jana De Smet',
    invited_email: 'jana@autohuysdesmet.be',
    role: 'manager',
    company_name: 'Autohuys De Smet',
    inviter_name: 'Tom De Smet',
  },
  to: (data: Record<string, unknown>) => (data?.invited_email as string) ?? '',
} satisfies TemplateEntry

// ---------- styles ----------
const PRIMARY = '#E11D48'
const TEXT = '#0F172A'
const MUTED = '#64748B'
const BORDER = '#E2E8F0'
const SURFACE = '#F8FAFC'

const main: React.CSSProperties = {
  backgroundColor: '#ffffff',
  fontFamily:
    "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
  color: TEXT,
  margin: 0,
  padding: 0,
}

const container: React.CSSProperties = {
  maxWidth: '560px',
  margin: '0 auto',
  padding: '32px 20px 48px',
}

const header: React.CSSProperties = {
  textAlign: 'center',
  marginBottom: '20px',
}

const brand: React.CSSProperties = {
  fontFamily: "Montserrat, Inter, sans-serif",
  fontWeight: 700,
  fontSize: '22px',
  letterSpacing: '0.04em',
  color: TEXT,
  margin: 0,
}

const brandDot: React.CSSProperties = { color: PRIMARY }

const card: React.CSSProperties = {
  border: `1px solid ${BORDER}`,
  borderRadius: '12px',
  padding: '32px',
  backgroundColor: '#ffffff',
}

const h1: React.CSSProperties = {
  fontSize: '22px',
  lineHeight: '30px',
  margin: '0 0 12px',
  color: TEXT,
  fontWeight: 600,
}

const paragraph: React.CSSProperties = {
  fontSize: '15px',
  lineHeight: '24px',
  color: TEXT,
  margin: '0 0 20px',
}

const roleBox: React.CSSProperties = {
  border: `1px solid ${BORDER}`,
  borderRadius: '10px',
  padding: '14px 16px',
  backgroundColor: SURFACE,
  margin: '0 0 24px',
}

const roleEyebrow: React.CSSProperties = {
  fontSize: '11px',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: MUTED,
  margin: 0,
}

const roleTitle: React.CSSProperties = {
  fontSize: '16px',
  fontWeight: 600,
  color: TEXT,
  margin: '4px 0 4px',
}

const roleDesc: React.CSSProperties = {
  fontSize: '13px',
  color: MUTED,
  margin: 0,
  lineHeight: '20px',
}

const buttonWrap: React.CSSProperties = { textAlign: 'center', margin: '8px 0 16px' }

const button: React.CSSProperties = {
  backgroundColor: PRIMARY,
  color: '#ffffff',
  borderRadius: '12px',
  padding: '14px 28px',
  fontSize: '15px',
  fontWeight: 600,
  textDecoration: 'none',
  display: 'inline-block',
}

const smallMuted: React.CSSProperties = {
  fontSize: '12px',
  color: MUTED,
  textAlign: 'center',
  margin: '8px 0 0',
  wordBreak: 'break-all',
}

const mono: React.CSSProperties = {
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
  color: TEXT,
}

const hr: React.CSSProperties = { borderColor: BORDER, margin: '24px 0' }

const fineprint: React.CSSProperties = {
  fontSize: '12px',
  color: MUTED,
  lineHeight: '18px',
  margin: 0,
}

const footer: React.CSSProperties = {
  fontSize: '12px',
  color: MUTED,
  textAlign: 'center',
  marginTop: '24px',
  lineHeight: '18px',
}

const footerLink: React.CSSProperties = { color: MUTED, textDecoration: 'underline' }

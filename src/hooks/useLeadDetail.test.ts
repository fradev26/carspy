import { describe, it, expect } from 'vitest';
import { buildTimeline, isConversationLeadId } from './useLeadDetail';

describe('isConversationLeadId', () => {
  it('herkent gespreksleads aan het conv- prefix', () => {
    expect(isConversationLeadId('conv-123')).toBe(true);
    expect(isConversationLeadId('1b2c3d')).toBe(false);
  });
});

describe('buildTimeline', () => {
  it('combineert aanmaak, statussen en berichten van nieuw naar oud', () => {
    const events = buildTimeline({
      createdAt: '2026-08-20T08:00:00Z',
      createdLabelType: 'bericht',
      auditRows: [
        { id: 'a1', action: 'lead_status_changed', metadata: { from: 'new', to: 'in_progress' }, created_at: '2026-08-20T10:00:00Z' },
        { id: 'a2', action: 'listing_updated', metadata: {}, created_at: '2026-08-20T11:00:00Z' }, // wordt genegeerd
      ],
      messages: {
        buyerId: 'buyer-1',
        buyerName: 'Sofie',
        dealerName: 'Snabba Cars',
        rows: [
          { id: 'm1', sender_id: 'buyer-1', content: 'Is deze nog beschikbaar?', created_at: '2026-08-20T09:00:00Z' },
          { id: 'm2', sender_id: 'dealer-1', content: 'Ja, zeker!', created_at: '2026-08-20T09:30:00Z' },
        ],
      },
    });

    expect(events.map((e) => e.id)).toEqual(['audit-a1', 'msg-m2', 'msg-m1', 'created']);
    expect(events[1].senderIsDealer).toBe(true);
    expect(events[1].senderName).toBe('Snabba Cars');
    expect(events[2].senderIsDealer).toBe(false);
    expect(events[2].senderName).toBe('Sofie');
  });

  it('werkt zonder berichten en zonder statussen', () => {
    const events = buildTimeline({
      createdAt: '2026-08-20T08:00:00Z',
      createdLabelType: 'contactaanvraag',
      auditRows: [],
    });
    expect(events).toHaveLength(1);
    expect(events[0].content).toBe('Contactaanvraag ontvangen');
  });

  it('labelt het aanmaakevent voor gesprekken anders', () => {
    const events = buildTimeline({
      createdAt: '2026-08-20T08:00:00Z',
      createdLabelType: 'bericht',
      auditRows: [],
    });
    expect(events[0].content).toBe('Gesprek gestart');
  });
});

import base from './allocation-design.json' with { type: 'json' };

export default {
  ...base,
  enabled: true,
  recruitmentSource: 'prolific',
  campaign: 'prolific-remaining95-v1-' + base.fingerprint,
  excludedBlocks: ['B01'],
  blockTargets: Object.fromEntries(base.blocks.map(b => [b.id, b.id === 'B01' ? 0 : b.id === 'B25' ? 3 : 4])),
  // Long leases avoid reallocating a paid participant's place during ordinary breaks.
  leaseMs: 24 * 60 * 60 * 1000,
  maximumLeaseMs: 24 * 60 * 60 * 1000
};

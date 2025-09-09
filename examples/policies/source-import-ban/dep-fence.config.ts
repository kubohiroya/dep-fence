import type { Policy } from 'dep-fence/types';
import { any, isPublishable, isUI } from 'dep-fence/conditions';

export const policies: Policy[] = [
  {
    id: 'ban-entityid-from-common-type',
    when: any(isPublishable(), isUI()),
    because: 'Deprecate legacy EntityId APIs (migrate to unified NodeId/TagId).',
    rules: ['source-import-ban'],
    severityOverride: { 'source-import-ban': 'ERROR' },
    options: {
      'source-import-ban': {
        from: '@hierarchidb/common-type',
        names: ['EntityId', 'toEntityId', 'generateEntityId']
      }
    }
  }
];

// Guidance
// OK: import { NodeId } from '@hierarchidb/common-type';  // Not banned; preferred replacement
// NG: import { EntityId } from '@hierarchidb/common-type'; // Banned named import; will be flagged as ERROR
// Reason: prevents new usage of deprecated APIs and keeps the migration path consistent.

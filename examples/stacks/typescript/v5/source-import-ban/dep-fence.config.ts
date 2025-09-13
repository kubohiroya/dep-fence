// Project-specific ban on named imports from certain modules
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

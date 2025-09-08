import type { Policy } from 'dep-fence/types';
import { any, isPublishable, isUI } from 'dep-fence/conditions';

export const policies: Policy[] = [
  {
    id: 'ban-entityid-from-common-type',
    when: any(isPublishable(), isUI()),
    because: 'ID 廃止（NodeId/TagId 統一）のため、旧 EntityId 系 API を禁止',
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


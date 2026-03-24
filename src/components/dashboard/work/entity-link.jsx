import Link from '@mui/material/Link'

import { paths } from '@/paths'
import { RouterLink } from '@/components/core/link'

const entityPathMap = {
  cux_Contract__c: (id) => paths.dashboard.contracts.details(id),
  cux_TaskOrder__c: (id) => paths.dashboard.taskOrders.details(id),
  cux_Invoice__c: (id) => paths.dashboard.invoices.details(id),
  cux_Case__c: (id) => paths.dashboard.cases.details(id),
  cux_Timesheet__c: (id) => paths.dashboard.timesheets.details(id),
}

const entityLabelMap = {
  cux_Contract__c: 'Contract',
  cux_TaskOrder__c: 'Task Order',
  cux_Invoice__c: 'Invoice',
  cux_Case__c: 'Case',
  cux_Timesheet__c: 'Timesheet',
}

export function EntityLink({ entityType, entityId, label, ...props }) {
  const pathFn = entityPathMap[entityType]
  if (!pathFn || !entityId) {
    return label || entityLabelMap[entityType] || entityType || '\u2014'
  }

  return (
    <Link
      component={RouterLink}
      href={pathFn(entityId)}
      variant="body2"
      underline="hover"
      {...props}
    >
      {label || entityLabelMap[entityType] || entityType}
    </Link>
  )
}

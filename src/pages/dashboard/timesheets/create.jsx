import * as React from 'react'
import Box from '@mui/material/Box'
import Link from '@mui/material/Link'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { ArrowLeftIcon } from '@phosphor-icons/react/dist/ssr/ArrowLeft'
import { Helmet } from 'react-helmet-async'

import { appConfig } from '@/config/app'
import { paths } from '@/paths'
import { RouterLink } from '@/components/core/link'
import { TimesheetCreateForm } from '@/components/dashboard/timesheet/timesheet-create-form'
import { AnimatedPage } from '@/components/core/animations'

const metadata = { title: `Create | Timesheets | Dashboard | ${appConfig.name}` }

export function Page() {
  return (
    <React.Fragment>
      <Helmet><title>{metadata.title}</title></Helmet>
      <AnimatedPage>
      <Box sx={{ maxWidth: 'var(--Content-maxWidth)', m: 'var(--Content-margin)', p: 'var(--Content-padding)', width: 'var(--Content-width)' }}>
        <Stack spacing={4}>
          <Stack spacing={3}>
            <div>
              <Link color="text.primary" component={RouterLink} href={paths.dashboard.timesheets.list} sx={{ alignItems: 'center', display: 'inline-flex', gap: 1 }} variant="subtitle2">
                <ArrowLeftIcon fontSize="var(--icon-fontSize-md)" />
                Timesheets
              </Link>
            </div>
            <div><Typography variant="h4">New Timesheet</Typography></div>
          </Stack>
          <TimesheetCreateForm />
        </Stack>
      </Box>
      </AnimatedPage>
    </React.Fragment>
  )
}

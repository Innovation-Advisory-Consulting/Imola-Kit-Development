import Box from '@mui/material/Box'
import Link from '@mui/material/Link'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

const links = [
  { label: 'EULA', href: '#eula' },
  { label: 'Privacy Policy', href: '#privacy' },
  { label: 'AI Policy', href: '#ai-policy' },
  { label: 'SLA', href: '#sla' },
  { label: 'Third-Party Notice', href: '#third-party-notice' },
]

export function DashboardFooter() {
  return (
    <Box
      component="footer"
      sx={{
        borderTop: '1px solid var(--mui-palette-divider)',
        px: 3,
        py: 2,
        mt: 'auto',
      }}
    >
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        sx={{ alignItems: { sm: 'center' }, justifyContent: 'space-between' }}
      >
        <Typography variant="caption" color="text.secondary">
          &copy; {new Date().getFullYear()} Imola Kit. All rights reserved.
        </Typography>
        <Stack direction="row" spacing={2}>
          {links.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              variant="caption"
              color="text.secondary"
              underline="hover"
            >
              {link.label}
            </Link>
          ))}
        </Stack>
      </Stack>
    </Box>
  )
}

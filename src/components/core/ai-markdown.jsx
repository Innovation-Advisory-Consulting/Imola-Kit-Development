import * as React from 'react'
import Box from '@mui/material/Box'
import Link from '@mui/material/Link'
import Typography from '@mui/material/Typography'
import Markdown from 'react-markdown'
import { useNavigate } from 'react-router-dom'

function InternalAwareLink({ href, children }) {
  const navigate = useNavigate()
  const isInternal = href && (href.startsWith('/') || href.startsWith(window.location.origin))
  const handleClick = React.useCallback(
    (e) => {
      if (isInternal) {
        e.preventDefault()
        const path = href.startsWith(window.location.origin) ? href.slice(window.location.origin.length) : href
        navigate(path)
      }
    },
    [isInternal, href, navigate]
  )
  return (
    <Link
      href={href}
      onClick={handleClick}
      target={isInternal ? undefined : '_blank'}
      rel={isInternal ? undefined : 'noopener noreferrer'}
      underline="always"
      color="inherit"
      sx={{ fontWeight: 600 }}
    >
      {children}
    </Link>
  )
}

const components = {
  p: ({ children }) => (
    <Typography variant="body2" sx={{ mb: 1.5, lineHeight: 1.7, '&:last-child': { mb: 0 } }}>
      {children}
    </Typography>
  ),
  h1: ({ children }) => <Typography variant="h6" sx={{ mb: 1, mt: 2 }}>{children}</Typography>,
  h2: ({ children }) => <Typography variant="subtitle1" sx={{ mb: 1, mt: 2, fontWeight: 600 }}>{children}</Typography>,
  h3: ({ children }) => <Typography variant="subtitle2" sx={{ mb: 0.5, mt: 1.5 }}>{children}</Typography>,
  strong: ({ children }) => <Box component="strong" sx={{ fontWeight: 600 }}>{children}</Box>,
  em: ({ children }) => <Box component="em">{children}</Box>,
  ul: ({ children }) => (
    <Box component="ul" sx={{ pl: 2.5, mb: 1.5, '& li': { mb: 0.5 } }}>{children}</Box>
  ),
  ol: ({ children }) => (
    <Box component="ol" sx={{ pl: 2.5, mb: 1.5, '& li': { mb: 0.5 } }}>{children}</Box>
  ),
  li: ({ children }) => (
    <Typography component="li" variant="body2" sx={{ lineHeight: 1.7 }}>{children}</Typography>
  ),
  a: ({ href, children }) => <InternalAwareLink href={href}>{children}</InternalAwareLink>,
  code: ({ children, className }) => {
    const isBlock = className?.startsWith('language-')
    if (isBlock) {
      return (
        <Box
          component="pre"
          sx={{
            p: 1.5,
            mb: 1.5,
            borderRadius: 1,
            bgcolor: 'var(--mui-palette-background-level1)',
            border: '1px solid var(--mui-palette-divider)',
            overflow: 'auto',
            fontSize: '0.8125rem',
            fontFamily: 'monospace',
          }}
        >
          <code>{children}</code>
        </Box>
      )
    }
    return (
      <Box
        component="code"
        sx={{
          px: 0.5,
          py: 0.25,
          borderRadius: 0.5,
          bgcolor: 'var(--mui-palette-background-level1)',
          fontSize: '0.8125rem',
          fontFamily: 'monospace',
        }}
      >
        {children}
      </Box>
    )
  },
  blockquote: ({ children }) => (
    <Box
      sx={{
        pl: 2,
        ml: 0,
        mb: 1.5,
        borderLeft: '3px solid var(--mui-palette-primary-main)',
        color: 'text.secondary',
      }}
    >
      {children}
    </Box>
  ),
  hr: () => <Box component="hr" sx={{ border: 'none', borderTop: '1px solid var(--mui-palette-divider)', my: 2 }} />,
}

export function AiMarkdown({ children }) {
  if (!children) return null
  return <Markdown components={components}>{children}</Markdown>
}

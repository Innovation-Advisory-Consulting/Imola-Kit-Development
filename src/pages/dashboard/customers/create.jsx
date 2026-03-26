import * as React from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Divider from '@mui/material/Divider'
import FormControl from '@mui/material/FormControl'
import FormHelperText from '@mui/material/FormHelperText'
import Grid from '@mui/material/Grid'
import InputLabel from '@mui/material/InputLabel'
import Link from '@mui/material/Link'
import MenuItem from '@mui/material/MenuItem'
import OutlinedInput from '@mui/material/OutlinedInput'
import Select from '@mui/material/Select'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { ArrowLeftIcon } from '@phosphor-icons/react/dist/ssr/ArrowLeft'
import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { z as zod } from 'zod'

import { appConfig } from '@/config/app'
import { paths } from '@/paths'
import { RouterLink } from '@/components/core/link'
import { AnimatedPage } from '@/components/core/animations'
import { toast } from '@/components/core/toaster'
import { createAccount } from '@/lib/dataverse/client'

const metadata = { title: `New Customer | Dashboard | ${appConfig.name}` }

const INDUSTRY_OPTIONS = [
  { value: 1, label: 'Accounting' },
  { value: 2, label: 'Agriculture' },
  { value: 3, label: 'Broadcasting / Publishing' },
  { value: 4, label: 'Brokers' },
  { value: 5, label: 'Building Supply Retail' },
  { value: 6, label: 'Business Services' },
  { value: 7, label: 'Consulting' },
  { value: 8, label: 'Consumer Services' },
  { value: 9, label: 'Design / Creative Management' },
  { value: 10, label: 'Distributors' },
  { value: 11, label: "Doctor's Offices & Clinics" },
  { value: 12, label: 'Durable Manufacturing' },
  { value: 13, label: 'Eating & Drinking Places' },
  { value: 14, label: 'Entertainment Retail' },
  { value: 15, label: 'Equipment Rental & Leasing' },
  { value: 16, label: 'Financial' },
  { value: 17, label: 'Food & Tobacco Processing' },
  { value: 18, label: 'Inbound Capital Intensive Processing' },
  { value: 19, label: 'Inbound Repair & Services' },
  { value: 20, label: 'Insurance' },
  { value: 21, label: 'Legal Services' },
  { value: 22, label: 'Non-Durable Merchandise Retail' },
  { value: 23, label: 'Outbound Consumer Service' },
  { value: 24, label: 'Petrochemical' },
  { value: 25, label: 'Service Retail' },
  { value: 26, label: 'SIG Affiliations' },
  { value: 27, label: 'Social Services' },
  { value: 28, label: 'Special Outbound Trade Contractors' },
  { value: 29, label: 'Specialty Realty' },
  { value: 30, label: 'Transportation' },
  { value: 31, label: 'Utility Creation & Distribution' },
  { value: 32, label: 'Vehicle Retail' },
  { value: 33, label: 'Wholesale' },
]

const CUSTOMER_TYPE_OPTIONS = [
  { value: 1, label: 'Competitor' },
  { value: 2, label: 'Consultant' },
  { value: 3, label: 'Customer' },
  { value: 4, label: 'Investor' },
  { value: 5, label: 'Partner' },
  { value: 6, label: 'Influencer' },
  { value: 7, label: 'Press' },
  { value: 8, label: 'Prospect' },
  { value: 9, label: 'Reseller' },
  { value: 10, label: 'Supplier' },
  { value: 11, label: 'Vendor' },
  { value: 12, label: 'Other' },
]

const schema = zod.object({
  name: zod.string().min(1, 'Company name is required').max(160),
  accountnumber: zod.string().max(20).optional(),
  telephone1: zod.string().max(50).optional(),
  emailaddress1: zod
    .string()
    .max(100)
    .optional()
    .refine((v) => !v || zod.string().email().safeParse(v).success, { message: 'Must be a valid email' }),
  websiteurl: zod.string().max(200).optional(),
  industrycode: zod.preprocess((v) => (v === '' || v === null || v === undefined ? undefined : Number(v)), zod.number().int().optional()),
  customertypecode: zod.preprocess((v) => (v === '' || v === null || v === undefined ? undefined : Number(v)), zod.number().int().optional()),
  numberofemployees: zod.preprocess((v) => (v === '' || v === null || v === undefined ? undefined : Number(v)), zod.number().int().min(0).optional()),
  address1_line1: zod.string().max(250).optional(),
  address1_city: zod.string().max(80).optional(),
  address1_stateorprovince: zod.string().max(50).optional(),
  address1_postalcode: zod.string().max(20).optional(),
  address1_country: zod.string().max(80).optional(),
  description: zod.string().optional(),
})

const defaultValues = {
  name: '',
  accountnumber: '',
  telephone1: '',
  emailaddress1: '',
  websiteurl: '',
  industrycode: '',
  customertypecode: '',
  numberofemployees: '',
  address1_line1: '',
  address1_city: '',
  address1_stateorprovince: '',
  address1_postalcode: '',
  address1_country: '',
  description: '',
}

export function Page() {
  const navigate = useNavigate()
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues, resolver: zodResolver(schema) })

  const onSubmit = React.useCallback(
    async (values) => {
      try {
        const payload = Object.fromEntries(
          Object.entries(values).filter(([, v]) => v !== '' && v !== null && v !== undefined)
        )
        await createAccount(payload)
        toast.success('Customer created successfully')
        navigate(paths.dashboard.customers.list)
      } catch (err) {
        toast.error(err.message || 'Something went wrong')
      }
    },
    [navigate]
  )

  return (
    <React.Fragment>
      <Helmet>
        <title>{metadata.title}</title>
      </Helmet>
      <AnimatedPage>
        <Box sx={{ maxWidth: 'var(--Content-maxWidth)', m: 'var(--Content-margin)', p: 'var(--Content-padding)', width: 'var(--Content-width)' }}>
          <Stack spacing={4}>
            <Stack spacing={3}>
              <div>
                <Link
                  color="text.primary"
                  component={RouterLink}
                  href={paths.dashboard.customers.list}
                  sx={{ alignItems: 'center', display: 'inline-flex', gap: 1 }}
                  variant="subtitle2"
                >
                  <ArrowLeftIcon fontSize="var(--icon-fontSize-md)" />
                  Customers
                </Link>
              </div>
              <div>
                <Typography variant="h4">New Customer</Typography>
              </div>
            </Stack>

            <form onSubmit={handleSubmit(onSubmit)}>
              <Stack spacing={3}>
                {/* Company Information */}
                <Card>
                  <CardHeader title="Company Information" />
                  <Divider />
                  <CardContent>
                    <Grid container spacing={3}>
                      <Grid size={{ xs: 12, md: 6 }}>
                        <Controller
                          control={control}
                          name="name"
                          render={({ field }) => (
                            <FormControl error={Boolean(errors.name)} fullWidth>
                              <InputLabel required>Company Name</InputLabel>
                              <OutlinedInput {...field} />
                              {errors.name && <FormHelperText>{errors.name.message}</FormHelperText>}
                            </FormControl>
                          )}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, md: 6 }}>
                        <Controller
                          control={control}
                          name="accountnumber"
                          render={({ field }) => (
                            <FormControl fullWidth>
                              <InputLabel>Account Number</InputLabel>
                              <OutlinedInput {...field} />
                            </FormControl>
                          )}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, md: 6 }}>
                        <Controller
                          control={control}
                          name="telephone1"
                          render={({ field }) => (
                            <FormControl fullWidth>
                              <InputLabel>Phone</InputLabel>
                              <OutlinedInput {...field} type="tel" />
                            </FormControl>
                          )}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, md: 6 }}>
                        <Controller
                          control={control}
                          name="emailaddress1"
                          render={({ field }) => (
                            <FormControl error={Boolean(errors.emailaddress1)} fullWidth>
                              <InputLabel>Email Address</InputLabel>
                              <OutlinedInput {...field} type="email" />
                              {errors.emailaddress1 && <FormHelperText>{errors.emailaddress1.message}</FormHelperText>}
                            </FormControl>
                          )}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, md: 6 }}>
                        <Controller
                          control={control}
                          name="websiteurl"
                          render={({ field }) => (
                            <FormControl fullWidth>
                              <InputLabel>Website URL</InputLabel>
                              <OutlinedInput {...field} placeholder="https://example.com" />
                            </FormControl>
                          )}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, md: 6 }}>
                        <Controller
                          control={control}
                          name="numberofemployees"
                          render={({ field }) => (
                            <FormControl fullWidth>
                              <InputLabel>Number of Employees</InputLabel>
                              <OutlinedInput {...field} type="number" inputProps={{ min: 0 }} />
                            </FormControl>
                          )}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, md: 6 }}>
                        <Controller
                          control={control}
                          name="industrycode"
                          render={({ field }) => (
                            <FormControl fullWidth>
                              <InputLabel>Industry</InputLabel>
                              <Select {...field} label="Industry">
                                <MenuItem value=""><em>None</em></MenuItem>
                                {INDUSTRY_OPTIONS.map((o) => (
                                  <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                          )}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, md: 6 }}>
                        <Controller
                          control={control}
                          name="customertypecode"
                          render={({ field }) => (
                            <FormControl fullWidth>
                              <InputLabel>Customer Type</InputLabel>
                              <Select {...field} label="Customer Type">
                                <MenuItem value=""><em>None</em></MenuItem>
                                {CUSTOMER_TYPE_OPTIONS.map((o) => (
                                  <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                          )}
                        />
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>

                {/* Address */}
                <Card>
                  <CardHeader title="Address" />
                  <Divider />
                  <CardContent>
                    <Grid container spacing={3}>
                      <Grid size={{ xs: 12 }}>
                        <Controller
                          control={control}
                          name="address1_line1"
                          render={({ field }) => (
                            <FormControl fullWidth>
                              <InputLabel>Street</InputLabel>
                              <OutlinedInput {...field} />
                            </FormControl>
                          )}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, md: 6 }}>
                        <Controller
                          control={control}
                          name="address1_city"
                          render={({ field }) => (
                            <FormControl fullWidth>
                              <InputLabel>City</InputLabel>
                              <OutlinedInput {...field} />
                            </FormControl>
                          )}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, md: 3 }}>
                        <Controller
                          control={control}
                          name="address1_stateorprovince"
                          render={({ field }) => (
                            <FormControl fullWidth>
                              <InputLabel>State / Province</InputLabel>
                              <OutlinedInput {...field} />
                            </FormControl>
                          )}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, md: 3 }}>
                        <Controller
                          control={control}
                          name="address1_postalcode"
                          render={({ field }) => (
                            <FormControl fullWidth>
                              <InputLabel>Postal Code</InputLabel>
                              <OutlinedInput {...field} />
                            </FormControl>
                          )}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, md: 6 }}>
                        <Controller
                          control={control}
                          name="address1_country"
                          render={({ field }) => (
                            <FormControl fullWidth>
                              <InputLabel>Country</InputLabel>
                              <OutlinedInput {...field} />
                            </FormControl>
                          )}
                        />
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>

                {/* Additional Information */}
                <Card>
                  <CardHeader title="Additional Information" />
                  <Divider />
                  <CardContent>
                    <Controller
                      control={control}
                      name="description"
                      render={({ field }) => (
                        <FormControl fullWidth>
                          <InputLabel>Description</InputLabel>
                          <OutlinedInput {...field} multiline rows={4} />
                        </FormControl>
                      )}
                    />
                  </CardContent>
                </Card>

                <Stack direction="row" spacing={2} sx={{ justifyContent: 'flex-end' }}>
                  <Button color="secondary" component={RouterLink} href={paths.dashboard.customers.list} disabled={isSubmitting}>
                    Cancel
                  </Button>
                  <Button type="submit" variant="contained" disabled={isSubmitting}>
                    {isSubmitting ? 'Creating...' : 'Create Customer'}
                  </Button>
                </Stack>
              </Stack>
            </form>
          </Stack>
        </Box>
      </AnimatedPage>
    </React.Fragment>
  )
}

import { z } from 'zod';

export const CurrencyEnum = z.enum(['BDT', 'USD', 'EUR', 'GBP']);

export const AddressSchema = z.object({
  street: z.string().min(1, 'Street is required'),
  city: z.string().min(1, 'City is required'),
  region: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().min(1, 'Country is required'),
});

export const BusinessProfileSchema = z.object({
  name: z.string().min(1, 'Business name is required'),
  currency: CurrencyEnum.default('BDT'),
  logoUrl: z.string().url('Invalid logo URL').optional().or(z.literal('')),
  address: AddressSchema,
  onboardingComplete: z.boolean().optional(),
});

export const BusinessProfileUpdateSchema = BusinessProfileSchema.omit({ onboardingComplete: true });

export const DraftSaveSchema = z.object({
  field: z.enum(['name', 'currency', 'address', 'logoUrl']),
  value: z.unknown(),
});

export const BusinessResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    name: z.string(),
    currency: CurrencyEnum,
    logoUrl: z.string().url().nullable(),
    address: AddressSchema.nullable(),
    onboardingComplete: z.boolean(),
  }),
  message: z.string(),
});

export type Currency = z.infer<typeof CurrencyEnum>;
export type Address = z.infer<typeof AddressSchema>;
export type BusinessProfile = z.infer<typeof BusinessProfileSchema>;
export type BusinessProfileUpdate = z.infer<typeof BusinessProfileUpdateSchema>;
export type DraftSaveRequest = z.infer<typeof DraftSaveSchema>;
export type BusinessResponse = z.infer<typeof BusinessResponseSchema>;

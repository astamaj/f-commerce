'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Field, FormMessage, Input, Select } from '@/components/ui/primitives';
import type { BusinessProfile } from '@f-commerce/contracts';

type Step = 1 | 2 | 3 | 4;

type Address = {
  street: string;
  city: string;
  region?: string;
  postalCode?: string;
  country: string;
};

type OnboardingForm = {
  name: string;
  currency: BusinessProfile['currency'];
  address: Address;
  logoUrl: string;
};

type BusinessData = {
  name: string;
  currency: string;
  logoUrl: string | null;
  address: Address | null;
  onboardingComplete: boolean;
  onboardingDraft?: OnboardingForm | null;
};

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [submitting, setSubmitting] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoUploading, setLogoUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [business, setBusiness] = useState<BusinessData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [form, setForm] = useState<OnboardingForm>({
    name: '',
    currency: 'BDT',
    address: {
      street: '',
      city: '',
      region: '',
      postalCode: '',
      country: 'Bangladesh',
    },
    logoUrl: '',
  });

  useEffect(() => {
    let cancelled = false;
    void cancelled;

    fetch('/api/business/me', {
      method: 'GET',
      credentials: 'include',
    })
      .then(async (res) => {
        if (res.status === 403 && res.headers.get('content-type')?.includes('json')) {
          return res.json().then((data) => {
            if (data.error?.includes('Onboarding') || data.message?.includes('Onboarding')) {
              return null;
            }
            throw new Error('Access denied');
          });
        }
        if (!res.ok) throw new Error('Failed to load business');
        return res.json();
      })
      .then((data) => {
        if (!cancelled && data) {
          setBusiness(data.data);
          if (data.data.onboardingComplete) {
            router.replace('/dashboard');
          }
          if (data.data.onboardingDraft) {
            const draft = data.data.onboardingDraft;
            setForm({
              name: draft.name || data.data.name || '',
              currency: (draft.currency || data.data.currency || 'BDT') as BusinessProfile['currency'],
              address: draft.address || data.data.address || form.address,
              logoUrl: draft.logoUrl || data.data.logoUrl || '',
            });
            if (draft.logoUrl || data.data.logoUrl) {
              setLogoPreview(draft.logoUrl || data.data.logoUrl || null);
            }
          }
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message);
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [router]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Only image files are allowed');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('File must be under 5MB');
      return;
    }

    setLogoPreview(URL.createObjectURL(file));
    setLogoUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('image', file);

      const res = await fetch('/api/business/logo', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Upload failed');
      }

      const result = await res.json();
      setForm({ ...form, logoUrl: result.data.logoUrl });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setLogoUploading(false);
    }
  };

  const completeOnboarding = async () => {
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/business/onboarding', {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          currency: form.currency,
          address: form.address,
          logoUrl: form.logoUrl,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to complete onboarding');
      }

      router.replace('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="p-8">Loading your profile...</div>;
  }

  if (business?.onboardingComplete) {
    return null;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas p-4">
      <div className="w-full max-w-lg">
        <StepIndicator step={step} />

        {error && <FormMessage id="onboarding-error">{error}</FormMessage>}

        {step === 1 && (
          <StepOne form={form} setForm={setForm} onNext={() => setStep(2)} />
        )}
        {step === 2 && (
          <StepTwo form={form} setForm={setForm} onNext={() => setStep(3)} onBack={() => setStep(1)} />
        )}
        {step === 3 && (
          <StepThree
            form={form}
            setForm={setForm}
            onNext={() => setStep(4)}
            onBack={() => setStep(2)}
            logoPreview={logoPreview}
            logoUploading={logoUploading}
            onFileChange={handleFileChange}
          />
        )}
        {step === 4 && (
          <StepFour form={form} onBack={() => setStep(3)} onSubmit={completeOnboarding} submitting={submitting} />
        )}
      </div>
    </div>
  );
}

function StepIndicator({ step }: { step: Step }) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        {[1, 2, 3, 4].map((s) => (
          <div key={s} className="flex items-center">
            <div
              aria-hidden="true"
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${
                s <= step ? 'bg-sky text-on-sky' : 'bg-surface-muted text-body'
              }`}
            >
              {s}
            </div>
            {s < 4 && <div className={`ml-2 h-1 w-8 ${s < step ? 'bg-sky' : 'bg-surface-muted'}`} />}
          </div>
        ))}
      </div>
      <p className="mt-2 text-sm text-muted">Step {step} of 4</p>
    </div>
  );
}

function StepOne({
  form,
  setForm,
  onNext,
}: {
  form: OnboardingForm;
  setForm: React.Dispatch<React.SetStateAction<OnboardingForm>>;
  onNext: () => void;
}) {
  const valid = form.name.trim().length > 0;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-ink">Tell us about your business</h1>
      <p className="text-sm text-body">We will use this information to set up your order desk.</p>

      <Field
        label="Business name"
        htmlFor="business-name"
        error={form.name ? undefined : 'Business name is required'}
      >
        <Input
          id="business-name"
          type="text"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="Maya Traders"
          aria-invalid={Boolean(form.name)}
        />
      </Field>

      <Button onClick={onNext} disabled={!valid}>
        Continue
      </Button>
    </div>
  );
}

function StepTwo({
  form,
  setForm,
  onNext,
  onBack,
}: {
  form: OnboardingForm;
  setForm: React.Dispatch<React.SetStateAction<OnboardingForm>>;
  onNext: () => void;
  onBack: () => void;
}) {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-ink">Billing address</h1>
      <p className="text-sm text-body">Where should we send invoices and receipts?</p>

      <Field label="Street" htmlFor="street">
        <Input
          id="street"
          type="text"
          value={form.address.street}
          onChange={(e) => setForm({ ...form, address: { ...form.address, street: e.target.value } })}
          placeholder="123 Main Street"
        />
      </Field>

      <Field label="City" htmlFor="city">
        <Input
          id="city"
          type="text"
          value={form.address.city}
          onChange={(e) => setForm({ ...form, address: { ...form.address, city: e.target.value } })}
          placeholder="Dhaka"
        />
      </Field>

      <Field label="Region / State" htmlFor="region" description="Optional">
        <Input
          id="region"
          type="text"
          value={form.address.region || ''}
          onChange={(e) => setForm({ ...form, address: { ...form.address, region: e.target.value } })}
          placeholder="Dhaka Division"
        />
      </Field>

      <Field label="Postal code" htmlFor="postal-code" description="Optional">
        <Input
          id="postal-code"
          type="text"
          value={form.address.postalCode || ''}
          onChange={(e) => setForm({ ...form, address: { ...form.address, postalCode: e.target.value } })}
          placeholder="1000"
        />
      </Field>

      <Field label="Country" htmlFor="country">
        <Input
          id="country"
          type="text"
          value={form.address.country}
          onChange={(e) => setForm({ ...form, address: { ...form.address, country: e.target.value } })}
        />
      </Field>

      <div className="flex gap-3">
        <Button variant="secondary" onClick={onBack}>
          Back
        </Button>
        <Button onClick={onNext}>Continue</Button>
      </div>
    </div>
  );
}

function StepThree({
  form,
  setForm,
  onNext,
  onBack,
  logoPreview,
  logoUploading,
  onFileChange,
}: {
  form: OnboardingForm;
  setForm: React.Dispatch<React.SetStateAction<OnboardingForm>>;
  onNext: () => void;
  onBack: () => void;
  logoPreview: string | null;
  logoUploading: boolean;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  void setForm;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-ink">Your currency and logo</h1>
      <p className="text-sm text-body">
        This is how your customers will see prices and identify your business.
      </p>

      <Field label="Currency" htmlFor="currency">
        <Select
          id="currency"
          value={form.currency}
          onChange={(e) => setForm({ ...form, currency: e.target.value as BusinessProfile['currency'] })}
        >
          <option value="BDT">BDT - Bangladeshi Taka</option>
          <option value="USD">USD - US Dollar</option>
          <option value="EUR">EUR - Euro</option>
          <option value="GBP">GBP - British Pound</option>
        </Select>
      </Field>

      <Field label="Business logo" htmlFor="logo-upload" description="JPEG, PNG, or WebP. Max 5MB.">
        <label
          className="flex h-24 cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-border bg-surface-muted text-center hover:bg-surface"
          htmlFor="logo-upload"
        >
          {logoPreview ? (
            <img alt="Logo preview" className="h-20 w-20 rounded object-contain" src={logoPreview} />
          ) : (
            <span className="text-sm text-muted">
              {logoUploading ? 'Uploading...' : 'Click to upload a logo'}
            </span>
          )}
          <input
            accept="image/*"
            className="sr-only"
            id="logo-upload"
            onChange={onFileChange}
            type="file"
          />
        </label>
        {logoUploading && <p className="text-xs text-muted">Uploading...</p>}
      </Field>

      <div className="flex gap-3">
        <Button variant="secondary" onClick={onBack}>
          Back
        </Button>
        <Button onClick={onNext}>Continue</Button>
      </div>
    </div>
  );
}

function StepFour({
  form,
  onBack,
  onSubmit,
  submitting,
}: {
  form: OnboardingForm;
  onBack: () => void;
  onSubmit: () => void;
  submitting: boolean;
}) {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-ink">Review and finish</h1>
      <p className="text-sm text-body">Check your details before entering the order desk.</p>

      <div className="space-y-4 rounded-lg border border-border bg-surface p-4">
        <div className="flex items-center gap-4">
          {form.logoUrl ? (
            <img alt="Logo" className="h-12 w-12 rounded object-contain" src={form.logoUrl} />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded bg-sky-soft text-sky-strong font-mono">
              {form.name.slice(0, 2).toUpperCase() || 'BT'}
            </div>
          )}
          <div>
            <p className="font-semibold text-ink">{form.name || 'Unnamed business'}</p>
            <p className="text-sm text-muted">{form.currency}</p>
          </div>
        </div>

        {form.address.street && (
          <div className="grid gap-1 text-sm">
            <p className="text-body">{form.address.street}</p>
            <p className="text-body">
              {form.address.city}
              {form.address.region && `, ${form.address.region}`}
              {form.address.postalCode && ` ${form.address.postalCode}`}
            </p>
            <p className="text-body">{form.address.country}</p>
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <Button variant="secondary" onClick={onBack} disabled={submitting}>
          Back
        </Button>
        <Button onClick={onSubmit} disabled={submitting}>
          {submitting ? 'Finishing...' : 'Enter order desk'}
        </Button>
      </div>
    </div>
  );
}

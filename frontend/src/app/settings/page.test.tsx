import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ThemeBoundary } from '@/components/theme/theme';
import { setAuth } from '@/lib/auth-client';

const replaceMock = vi.fn();
const stableRouter = { replace: replaceMock };
// eslint-disable-next-line @typescript-eslint/no-require-imports
vi.mock('next/navigation', () => ({
  useRouter: () => stableRouter,
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
import SettingsPage from './page';

function jsonResponse(status: number, body: object): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

const completeBusiness = {
  name: 'Maya Traders',
  currency: 'USD',
  logoUrl: '',
  address: { street: '123 Main St', city: 'Dhaka', country: 'Bangladesh' },
  onboardingComplete: true,
};

describe('SettingsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
    // SettingsPage now guards on auth before fetching; seed a session so
    // the form-based tests render past the guard.
    setAuth({ accessToken: 'tok', businessId: 'biz-1' });
  });

  it('shows a loading state before the profile resolves', () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(() => new Promise(() => {})),
    );

    render(
      <ThemeBoundary>
        <SettingsPage />
      </ThemeBoundary>,
    );

    expect(screen.getByText(/loading/i)).toBeVisible();
  });

  it('shows an error when the profile fails to load', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(jsonResponse(500, { message: 'Server down' })),
    );

    render(
      <ThemeBoundary>
        <SettingsPage />
      </ThemeBoundary>,
    );

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(/server down/i);
  });

  it('fills the form from a loaded profile with an address', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(jsonResponse(200, { success: true, data: completeBusiness })),
    );

    render(
      <ThemeBoundary>
        <SettingsPage />
      </ThemeBoundary>,
    );

    expect(await screen.findByRole('heading', { name: /business profile/i })).toBeVisible();
    expect(screen.getByRole('textbox', { name: /business name/i })).toHaveValue('Maya Traders');
    expect(screen.getByRole('textbox', { name: /street/i })).toHaveValue('123 Main St');
    expect(screen.getByRole('textbox', { name: /city/i })).toHaveValue('Dhaka');
    expect(screen.getByRole('textbox', { name: /country/i })).toHaveValue('Bangladesh');
    const currency = screen.getByRole('combobox', { name: /currency/i });
    expect(currency).toHaveValue('USD');
  });

  it('fills empty fields when the profile has no address', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        jsonResponse(200, {
          success: true,
          data: { ...completeBusiness, address: null, currency: '' },
        }),
      ),
    );

    render(
      <ThemeBoundary>
        <SettingsPage />
      </ThemeBoundary>,
    );

    expect(await screen.findByRole('textbox', { name: /street/i })).toHaveValue('');
    expect(screen.getByRole('textbox', { name: /country/i })).toHaveValue('Bangladesh');
    expect(screen.getByRole('combobox', { name: /currency/i })).toHaveValue('BDT');
  });

  it('covers AC-5: owner saves the profile and sees a success message', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(200, { success: true, data: completeBusiness }))
      .mockResolvedValueOnce(jsonResponse(200, { success: true, data: completeBusiness }));
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();

    render(
      <ThemeBoundary>
        <SettingsPage />
      </ThemeBoundary>,
    );

    const nameField = await screen.findByRole('textbox', { name: /business name/i });
    await user.clear(nameField);
    await user.type(nameField, 'Renamed Biz');
    await user.click(screen.getByRole('button', { name: /save changes/i }));

    const status = await screen.findByRole('status');
    expect(status).toHaveTextContent(/profile updated/i);
    const saveCall = fetchMock.mock.calls[1];
    expect(saveCall[0]).toBe('http://localhost:4000/api/business/me');
    const body = JSON.parse((saveCall[1] as RequestInit).body as string);
    expect(body.name).toBe('Renamed Biz');
  });

  it('covers AC-5: shows an error when a write is rejected (staff or invalid)', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(200, { success: true, data: completeBusiness }))
      .mockResolvedValueOnce(jsonResponse(403, { message: 'Insufficient permissions' }));
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();

    render(
      <ThemeBoundary>
        <SettingsPage />
      </ThemeBoundary>,
    );

    await screen.findByRole('textbox', { name: /business name/i });
    await user.click(screen.getByRole('button', { name: /save changes/i }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(/insufficient permissions/i);
  });
});

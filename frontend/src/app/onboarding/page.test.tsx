import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ThemeBoundary } from '@/components/theme/theme';

const replaceMock = vi.fn();
// a stable router object, so the page's [router]-dependent effect does not re-run on every render
const stableRouter = { replace: replaceMock };
vi.mock('next/navigation', () => ({
  usePathname: () => '/onboarding',
  useRouter: () => stableRouter,
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
import OnboardingPage from './page';

function jsonResponse(status: number, body: object): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

const incompleteBusiness = {
  name: 'Maya Traders',
  currency: 'BDT',
  logoUrl: '',
  address: null,
  onboardingComplete: false,
};

// jsdom does not implement URL.createObjectURL, used for the logo preview
function setupObjectUrl() {
  if (typeof URL.createObjectURL !== 'function') {
    Object.defineProperty(URL, 'createObjectURL', {
      value: (file: File) => `blob:mock-${file.name}`,
      configurable: true,
    });
  }
}

describe('OnboardingPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
    setupObjectUrl();
  });

  it('shows a loading state before the business profile resolves', () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(
        () => new Promise(() => {}), // never settles
      ),
    );

    render(
      <ThemeBoundary>
        <OnboardingPage />
      </ThemeBoundary>,
    );

    expect(screen.getByText(/loading your profile/i)).toBeVisible();
  });

  it('shows an error when the business profile cannot be loaded', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(500, {})));

    render(
      <ThemeBoundary>
        <OnboardingPage />
      </ThemeBoundary>,
    );

    // the load failure shows a banner; step 1 also renders its own required-name alert
    const alerts = await screen.findAllByRole('alert');
    expect(alerts.some((el) => /failed to load business/i.test(el.textContent ?? ''))).toBe(true);
  });

  it('covers AC-1: renders the wizard on step one for an incomplete business', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(jsonResponse(200, { success: true, data: incompleteBusiness })),
    );

    render(
      <ThemeBoundary>
        <OnboardingPage />
      </ThemeBoundary>,
    );

    expect(await screen.findByRole('heading', { name: /tell us about your business/i })).toBeVisible();
    expect(screen.getByText('Step 1 of 4')).toBeVisible();
    expect(screen.getByRole('button', { name: /continue/i })).toBeDisabled();
  });

  it('blocks continuing on step one until the business name is entered', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(jsonResponse(200, { success: true, data: incompleteBusiness })),
    );
    const user = userEvent.setup();

    render(
      <ThemeBoundary>
        <OnboardingPage />
      </ThemeBoundary>,
    );

    const nameField = await screen.findByRole('textbox', { name: /business name/i });
    const continueBtn = screen.getByRole('button', { name: /continue/i });
    expect(continueBtn).toBeDisabled();

    await user.type(nameField, 'Maya Traders');
    expect(continueBtn).toBeEnabled();

    await user.click(continueBtn);
    expect(screen.getByText('Step 2 of 4')).toBeVisible();
  });

  it('walks back and forth through the address step', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(jsonResponse(200, { success: true, data: incompleteBusiness })),
    );
    const user = userEvent.setup();

    render(
      <ThemeBoundary>
        <OnboardingPage />
      </ThemeBoundary>,
    );

    await user.type(await screen.findByRole('textbox', { name: /business name/i }), 'Maya');
    await user.click(screen.getByRole('button', { name: /^continue$/i }));
    // now on step 2; Back returns to step 1
    await user.click(screen.getByRole('button', { name: /back/i }));
    expect(screen.getByText('Step 1 of 4')).toBeVisible();
  });

  it('covers AC-1: restores a saved draft when the profile has one', async () => {
    const withDraft = {
      ...incompleteBusiness,
      onboardingDraft: {
        name: 'Draft Biz',
        currency: 'USD',
        address: { street: '9 Draft St', city: 'Chittagong', country: 'Bangladesh' },
        logoUrl: '',
      },
    };
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(jsonResponse(200, { success: true, data: withDraft })),
    );

    render(
      <ThemeBoundary>
        <OnboardingPage />
      </ThemeBoundary>,
    );

    const nameField = await screen.findByRole('textbox', { name: /business name/i });
    expect(nameField).toHaveValue('Draft Biz');
  });

  it('pre-fills business name from auth profile when business/me returns 403', async () => {
    const fetchMock = vi
      .fn()
      // First call: GET /api/business/me returns 403 (onboarding required)
      .mockResolvedValueOnce(
        jsonResponse(403, {
          error: 'Onboarding required',
          message: 'Please complete your business profile before accessing this resource',
        }),
      )
      // Second call: GET /api/auth/me returns business name from registration
      .mockResolvedValueOnce(
        jsonResponse(200, {
          user: { id: 'u1', email: 'test@example.com', name: 'Test User', isActive: true },
          businesses: [{ businessId: { _id: 'b1', name: 'Registered Biz Name' } }],
        }),
      );
    vi.stubGlobal('fetch', fetchMock);

    render(
      <ThemeBoundary>
        <OnboardingPage />
      </ThemeBoundary>,
    );

    // The name field should be pre-filled from the auth profile, not empty
    const nameField = await screen.findByRole('textbox', { name: /business name/i });
    expect(nameField).toHaveValue('Registered Biz Name');
    // Continue button should be enabled because the name is pre-filled
    expect(screen.getByRole('button', { name: /continue/i })).toBeEnabled();
  });

  it('covers AC-3: rejects a non-image file upload', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(jsonResponse(200, { success: true, data: incompleteBusiness })),
    );
    const user = userEvent.setup();

    render(
      <ThemeBoundary>
        <OnboardingPage />
      </ThemeBoundary>,
    );

    await user.type(await screen.findByRole('textbox', { name: /business name/i }), 'Maya');
    await user.click(screen.getByRole('button', { name: /^continue$/i }));
    await user.click(screen.getByRole('button', { name: /^continue$/i }));
    // now on step 3
    const input = document.getElementById('logo-upload') as HTMLInputElement;
    const textFile = new File(['not an image'], 'notes.txt', { type: 'text/plain' });
    // jsdom file inputs don't retain File type reliably, so drive the handler directly
    const changeEvent = new Event('change', { bubbles: true });
    Object.defineProperty(input, 'files', { value: [textFile], configurable: true });
    input.dispatchEvent(changeEvent);

    await screen.findByText(/only image files are allowed/i);
  });

  it('covers AC-3: uploads an image and shows a preview', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(200, { success: true, data: incompleteBusiness }))
      .mockResolvedValueOnce(
        jsonResponse(200, { success: true, data: { logoUrl: 'https://cdn/logo.png' } }),
      );
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();

    render(
      <ThemeBoundary>
        <OnboardingPage />
      </ThemeBoundary>,
    );

    await user.type(await screen.findByRole('textbox', { name: /business name/i }), 'Maya');
    await user.click(screen.getByRole('button', { name: /^continue$/i }));
    await user.click(screen.getByRole('button', { name: /^continue$/i }));

    const input = document.getElementById('logo-upload') as HTMLInputElement;
    const png = new File([new Uint8Array([0x89, 0x50, 0x4e, 0x47])], 'logo.png', {
      type: 'image/png',
    });
    Object.defineProperty(input, 'files', { value: [png], configurable: true });
    input.dispatchEvent(new Event('change', { bubbles: true }));

    // a successful upload POSTs to the logo endpoint and shows the preview img
    await waitFor(() => {
      expect(fetchMock.mock.calls.some((c) => c[0] === 'http://localhost:4000/api/business/logo')).toBe(true);
    });
    expect(screen.getByRole('img', { name: /logo preview/i })).toBeVisible();
  });

  it('covers AC-4: completes onboarding and redirects to the dashboard', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(200, { success: true, data: incompleteBusiness }))
      .mockResolvedValueOnce(jsonResponse(200, { success: true, data: { onboardingComplete: true } }));
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();

    render(
      <ThemeBoundary>
        <OnboardingPage />
      </ThemeBoundary>,
    );

    // walk to the review step, awaiting each transition
    await user.type(await screen.findByRole('textbox', { name: /business name/i }), 'Maya Traders');
    await user.click(screen.getByRole('button', { name: /^continue$/i }));
    await user.click(screen.getByRole('button', { name: /^continue$/i }));
    await user.click(screen.getByRole('button', { name: /^continue$/i }));

    const finishBtn = screen.getByRole('button', { name: /enter order desk/i });
    expect(finishBtn).toBeEnabled();
    await user.click(finishBtn);

    await waitFor(() => expect(replaceMock).toHaveBeenCalledWith('/dashboard'));
    const lastCall = fetchMock.mock.calls[fetchMock.mock.calls.length - 1];
    expect(lastCall[0]).toBe('http://localhost:4000/api/business/onboarding');
  });

  it('shows an error when onboarding completion fails', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(200, { success: true, data: incompleteBusiness }))
      .mockResolvedValueOnce(jsonResponse(400, { message: 'Validation failed' }));
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();

    render(
      <ThemeBoundary>
        <OnboardingPage />
      </ThemeBoundary>,
    );

    await user.type(await screen.findByRole('textbox', { name: /business name/i }), 'Maya Traders');
    await user.click(screen.getByRole('button', { name: /^continue$/i }));
    await user.click(screen.getByRole('button', { name: /^continue$/i }));
    await user.click(screen.getByRole('button', { name: /^continue$/i }));
    await user.click(screen.getByRole('button', { name: /enter order desk/i }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(/validation failed/i);
    expect(replaceMock).not.toHaveBeenCalled();
  });
});

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ThemeBoundary } from '@/components/theme/theme';

const replaceMock = vi.fn();
vi.mock('next/navigation', () => ({
  usePathname: () => '/login',
  useRouter: () => ({
    replace: replaceMock,
  }),
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
import LoginPage from './page';

function tokenWith(businessId?: string): string {
  const payload = businessId
    ? { memberships: [{ businessId, role: 'OWNER' }] }
    : { memberships: [] };
  const b64 = Buffer.from(JSON.stringify(payload)).toString('base64');
  return ['hmac-sha256', b64, 'sig'].join('.');
}

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status: 200 })));
  });

  it('renders the sign in form by default', () => {
    render(
      <ThemeBoundary>
        <LoginPage />
      </ThemeBoundary>,
    );

    expect(screen.getByRole('heading', { name: /welcome back/i })).toBeVisible();
    expect(screen.getByLabelText(/email/i)).toBeVisible();
    expect(screen.getByLabelText(/password/i)).toBeVisible();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeVisible();
  });

  it('switches to the register form and shows the business name field', async () => {
    const user = userEvent.setup();
    render(
      <ThemeBoundary>
        <LoginPage />
      </ThemeBoundary>,
    );

    await user.click(screen.getByRole('button', { name: /register/i }));

    expect(screen.getByRole('heading', { name: /create your account/i })).toBeVisible();
    expect(screen.getByRole('textbox', { name: /business name/i })).toBeVisible();
  });

  it('covers AC-4: submits login and routes the owner to onboarding', async () => {
    const token = tokenWith('biz-1');
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ accessToken: token }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      ),
    );
    const user = userEvent.setup();
    render(
      <ThemeBoundary>
        <LoginPage />
      </ThemeBoundary>,
    );

    await user.type(screen.getByLabelText(/email/i), 'owner@example.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    expect(replaceMock).toHaveBeenCalledWith('/onboarding');
    expect(window.localStorage.getItem('accessToken')).toBe(token);
  });

  it('shows an error when the auth token has no business membership', async () => {
    const tokenNoBiz = tokenWith();
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ accessToken: tokenNoBiz }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      ),
    );
    const user = userEvent.setup();
    render(
      <ThemeBoundary>
        <LoginPage />
      </ThemeBoundary>,
    );

    await user.type(screen.getByLabelText(/email/i), 'owner@example.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent(/no business association found/i);
    expect(replaceMock).not.toHaveBeenCalled();
  });

  it('shows an error message on failed sign in', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ error: 'Invalid credentials' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }),
      ),
    );
    const user = userEvent.setup();
    render(
      <ThemeBoundary>
        <LoginPage />
      </ThemeBoundary>,
    );

    await user.type(screen.getByLabelText(/email/i), 'owner@example.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent(/invalid credentials/i);
    expect(replaceMock).not.toHaveBeenCalled();
  });
});

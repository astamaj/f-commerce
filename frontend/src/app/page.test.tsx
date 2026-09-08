import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import Home from './page';

describe('frontend scaffold', () => {
  it('renders the home page content', () => {
    render(<Home />);

    expect(screen.getByRole('heading', { name: /to get started/i })).toBeVisible();
    expect(screen.getByAltText('Next.js logo')).toBeVisible();
  });

  it('exposes the documented learning link', () => {
    render(<Home />);

    expect(screen.getByRole('link', { name: 'Learning' })).toHaveAttribute(
      'href',
      'https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app',
    );
  });
});

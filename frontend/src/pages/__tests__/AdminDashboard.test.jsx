import React from 'react';
import { describe, it, expect } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import AdminDashboard from '../AdminDashboard';
import { renderWithRouter } from '../../test/utils';
import { server } from '../../test/handlers';

describe('AdminDashboard page', () => {
  it('redirects to /login when not authenticated as ADMIN', async () => {
    renderWithRouter(<AdminDashboard />, { route: '/admin' });
    await waitFor(() => {
      expect(screen.getByTestId('login-page')).toBeInTheDocument();
    });
  });

  it('renders Admin Portal heading and both section headings for ADMIN', async () => {
    renderWithRouter(<AdminDashboard />, { route: '/admin', authRole: 'ADMIN' });
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /admin portal/i })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /doctor management/i })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /patient details/i })).toBeInTheDocument();
    });
  });
});

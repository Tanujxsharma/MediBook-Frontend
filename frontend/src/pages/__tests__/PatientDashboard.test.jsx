import React from 'react';
import { describe, it, expect } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import PatientDashboard from '../PatientDashboard';
import { renderWithRouter } from '../../test/utils';

describe('PatientDashboard page', () => {
  it('redirects to /login when not authenticated', async () => {
    renderWithRouter(<PatientDashboard />, { route: '/patient' });
    await waitFor(() => {
      expect(screen.getByTestId('login-page')).toBeInTheDocument();
    });
  });

  it('renders Patient Portal heading for authenticated PATIENT', async () => {
    renderWithRouter(<PatientDashboard />, { route: '/patient', authRole: 'PATIENT' });
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /patient portal/i })).toBeInTheDocument();
    });
  });
});

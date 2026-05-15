import React from 'react';
import { describe, it, expect } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import DoctorDashboard from '../DoctorDashboard';
import { renderWithRouter } from '../../test/utils';
import { server, mockSlot } from '../../test/handlers';

describe('DoctorDashboard page', () => {
  it('redirects to /login when not authenticated', async () => {
    renderWithRouter(<DoctorDashboard />, { route: '/doctor' });
    await waitFor(() => {
      expect(screen.getByTestId('login-page')).toBeInTheDocument();
    });
  });

  it('renders Doctor Portal heading for DOCTOR role', async () => {
    renderWithRouter(<DoctorDashboard />, { route: '/doctor', authRole: 'DOCTOR' });
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /doctor portal/i })).toBeInTheDocument();
    });
  });
});

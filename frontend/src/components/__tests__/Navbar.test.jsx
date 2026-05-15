import React from 'react';
import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Navbar from '../Navbar';
import { renderWithRouter, mockAuthToken } from '../../test/utils';

describe('Navbar component', () => {
  it('shows Login and Sign Up links when no user is logged in', () => {
    renderWithRouter(<Navbar />, { route: '/' });
    expect(screen.getByRole('link', { name: /login/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /sign up/i })).toBeInTheDocument();
  });

  it('shows Doctor Portal link for DOCTOR role', () => {
    renderWithRouter(<Navbar />, { route: '/', authRole: 'DOCTOR' });
    expect(screen.getByRole('link', { name: /doctor portal/i })).toBeInTheDocument();
  });

  it('shows My Appointments link for PATIENT role', () => {
    renderWithRouter(<Navbar />, { route: '/', authRole: 'PATIENT' });
    expect(screen.getByRole('link', { name: /my appointments/i })).toBeInTheDocument();
  });

  it('shows Admin Portal link for ADMIN role', () => {
    renderWithRouter(<Navbar />, { route: '/', authRole: 'ADMIN' });
    expect(screen.getByRole('link', { name: /admin portal/i })).toBeInTheDocument();
  });

  it('clears the auth token and navigates to / on logout', async () => {
    const user = userEvent.setup();
    mockAuthToken('PATIENT');
    renderWithRouter(<Navbar />, { route: '/patient', authRole: 'PATIENT' });
    await user.click(screen.getByRole('button', { name: /logout/i }));
    expect(localStorage.getItem('token')).toBeNull();
    expect(screen.getByTestId('home-page')).toBeInTheDocument();
  });
});

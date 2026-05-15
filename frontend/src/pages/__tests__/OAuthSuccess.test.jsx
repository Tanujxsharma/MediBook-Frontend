import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import OAuthSuccess from '../OAuthSuccess';
import { makeFakeToken } from '../../test/handlers';

function renderOAuth(url = '/oauth-success') {
  return render(
    <MemoryRouter initialEntries={[url]}>
      <Routes>
        <Route path="/oauth-success" element={<OAuthSuccess />} />
        <Route path="/patient" element={<div data-testid="patient-page">Patient</div>} />
        <Route path="/doctor" element={<div data-testid="doctor-page">Doctor</div>} />
        <Route path="/login" element={<div data-testid="login-page">Login</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe('OAuthSuccess page', () => {
  it('redirects to /login when no token is present in query string', async () => {
    renderOAuth('/oauth-success');
    await waitFor(() => {
      expect(screen.getByTestId('login-page')).toBeInTheDocument();
    });
  });

  it('stores the token and redirects PATIENT to /patient', async () => {
    const token = makeFakeToken({ role: 'PATIENT', email: 'p@example.com' });
    renderOAuth(`/oauth-success?token=${token}`);
    await waitFor(() => {
      expect(screen.getByTestId('patient-page')).toBeInTheDocument();
    });
    expect(localStorage.getItem('token')).toBe(token);
  });
});

import React from 'react';
import { render } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { makeFakeToken } from './handlers';

/**
 * Render a component inside a MemoryRouter.
 *
 * @param {React.ReactElement} ui - The component to render
 * @param {object} options
 * @param {string} [options.route='/'] - Initial URL path
 * @param {string|null} [options.authRole=null] - If set, loads a fake token for that role into localStorage
 * @param {Array} [options.additionalRoutes=[]] - Extra <Route> elements to add alongside the component
 */
export function renderWithRouter(ui, { route = '/', authRole = null, additionalRoutes = [] } = {}) {
  if (authRole) {
    localStorage.setItem('token', makeFakeToken({ role: authRole, email: `${authRole.toLowerCase()}@example.com` }));
  }

  return render(
    <MemoryRouter initialEntries={[route]}>
      <Routes>
        <Route path={route} element={ui} />
        <Route path="/login" element={<div data-testid="login-page">Login Page</div>} />
        <Route path="/doctor" element={<div data-testid="doctor-page">Doctor Page</div>} />
        <Route path="/patient" element={<div data-testid="patient-page">Patient Page</div>} />
        <Route path="/admin" element={<div data-testid="admin-page">Admin Page</div>} />
        <Route path="/" element={<div data-testid="home-page">Home Page</div>} />
        {additionalRoutes}
      </Routes>
    </MemoryRouter>
  );
}

/**
 * Set a fake auth token directly in localStorage.
 * @param {string} role - DOCTOR | PATIENT | ADMIN
 * @param {object} [extra={}] - Additional JWT payload fields
 */
export function mockAuthToken(role, extra = {}) {
  const token = makeFakeToken({ role, email: `${role.toLowerCase()}@example.com`, ...extra });
  localStorage.setItem('token', token);
  return token;
}

/**
 * Clear auth from localStorage.
 */
export function clearAuth() {
  localStorage.removeItem('token');
}

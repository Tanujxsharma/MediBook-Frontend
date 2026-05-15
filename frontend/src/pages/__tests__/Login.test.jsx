import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import Login from '../Login';
import { renderWithRouter } from '../../test/utils';

describe('Login page', () => {
  it('renders email input, password input and the Log In button', () => {
    renderWithRouter(<Login />, { route: '/login' });
    expect(document.querySelector('input[name="email"]')).toBeInTheDocument();
    expect(document.querySelector('input[name="password"]')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /log in/i })).toBeInTheDocument();
  });

  it('shows "Account created!" banner when ?registered=true is in URL', () => {
    render(
      <MemoryRouter initialEntries={['/login?registered=true']}>
        <Routes>
          <Route path="/login" element={<Login />} />
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByText(/account created/i)).toBeInTheDocument();
  });
});

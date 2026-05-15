import React from 'react';
import { describe, it, expect } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import Home from '../Home';
import { renderWithRouter } from '../../test/utils';
import { server } from '../../test/handlers';

describe('Home page', () => {
  it('renders the hero heading', () => {
    renderWithRouter(<Home />, { route: '/' });
    expect(screen.getByRole('heading', { name: /find & book the best doctors/i })).toBeInTheDocument();
  });

  it('fetches and displays a provider card on mount', async () => {
    renderWithRouter(<Home />, { route: '/' });
    await waitFor(() => {
      expect(screen.getByText(/Dr\. John Smith/i)).toBeInTheDocument();
    });
  });

  it('shows "No doctors found" when provider list is empty', async () => {
    server.use(
      http.get('http://localhost:8080/providers', () => HttpResponse.json([]))
    );
    renderWithRouter(<Home />, { route: '/' });
    await waitFor(() => {
      expect(screen.getByText(/no doctors found/i)).toBeInTheDocument();
    });
  });
});

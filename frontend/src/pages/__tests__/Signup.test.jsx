import React from 'react';
import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Signup from '../Signup';
import { renderWithRouter } from '../../test/utils';

describe('Signup page', () => {
  it('renders the role selector defaulting to PATIENT', () => {
    renderWithRouter(<Signup />, { route: '/signup' });
    const select = screen.getByRole('combobox');
    expect(select).toBeInTheDocument();
    expect(select.value).toBe('PATIENT');
  });

  it('shows Specialization and Clinic Name fields when role is changed to DOCTOR', async () => {
    const user = userEvent.setup();
    renderWithRouter(<Signup />, { route: '/signup' });
    await user.selectOptions(screen.getByRole('combobox'), 'DOCTOR');
    expect(document.querySelector('input[name="specialization"]')).toBeInTheDocument();
    expect(document.querySelector('input[name="clinicName"]')).toBeInTheDocument();
  });
});

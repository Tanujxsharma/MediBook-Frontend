# Frontend Testing Guide

This document outlines the frontend testing strategy, tools, and execution steps for the MediBook React application.

## Testing Stack

The frontend utilizes a modern, Vite-native testing stack designed for speed and reliability:

- **[Vitest](https://vitest.dev/)**: The core test runner. It integrates seamlessly with our Vite configuration, eliminating the need for complex Jest setups.
- **[React Testing Library (RTL)](https://testing-library.com/docs/react-testing-library/intro/)**: Used for rendering React components and asserting on the DOM from a user's perspective.
- **[user-event](https://testing-library.com/docs/user-event/intro/)**: Simulates realistic user interactions (typing, clicking) within the DOM.
- **[jsdom](https://github.com/jsdom/jsdom)**: Provides a browser-like environment in Node.js for rendering components during tests.
- **[MSW (Mock Service Worker)](https://mswjs.io/)**: Mocks network requests at the network level. This allows us to test components that fetch data without actually hitting a backend server.

## Types of Testing Applied

We have applied two main levels of frontend testing in this project:

1. **Unit Testing**: Applied to pure logic files and services (e.g., `src/services/auth.js` and `api.js`). These tests ensure that individual functions return the correct values, parse tokens correctly, and handle errors properly in isolation.
2. **Integration Testing**: Applied to React components and full pages (e.g., `Navbar.jsx`, `Login.jsx`, `PatientDashboard.jsx`). These tests render the component in a virtual DOM, simulate user interactions (clicking, typing), and use MSW to mock backend API responses, ensuring all parts work together seamlessly.

## Test Structure

Tests are co-located or placed in `__tests__` directories near the code they test:

- **Service Tests** (`src/services/__tests__/`): **Unit tests** for pure logic.
- **Component Tests** (`src/components/__tests__/`): Tests for reusable UI components.
- **Page Tests** (`src/pages/__tests__/`): **Integration tests** for full page views, verifying complex user flows, role-based access, and data fetching integration (using MSW).

## Key Concepts & Utilities

- **`renderWithRouter` (`src/test/utils.jsx`)**: A helper function that wraps components in a `MemoryRouter`. This is essential for testing components that use React Router hooks (like `useNavigate` or `Link`). It also allows seeding a mock authentication state.
- **MSW Handlers (`src/test/handlers.js`)**: Defines the mock backend responses for our API endpoints. Tests can override these handlers on a per-test basis to simulate specific scenarios (like errors or empty lists).

## How to Run Tests Manually

You can run the tests using standard npm scripts defined in `package.json`.

1.  **Open a terminal** in the `frontend` directory:
    ```bash
    cd frontend
    ```

2.  **Run tests in Watch Mode (Recommended for development)**
    This command starts Vitest in watch mode. It will automatically re-run tests whenever you save a file.
    ```bash
    npm run test
    ```

3.  **Run all tests once (CI/CD style)**
    This command runs the test suite a single time and exits.
    ```bash
    npm run test:run
    ```

4.  **Generate Coverage Report**
    This command runs the tests and generates a code coverage report using the v8 provider.
    ```bash
    npm run test:coverage
    ```
    After running this, an HTML report will be generated in the `frontend/coverage` directory. You can open `coverage/index.html` in your browser to view detailed coverage metrics.

## Example: Writing a new test

When writing a new test, especially for a page that makes API calls or uses routing:

```jsx
import { describe, it, expect } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import MyPage from '../MyPage';
import { renderWithRouter } from '../../test/utils';

describe('MyPage', () => {
  it('renders correctly', async () => {
    // 1. Render the component with router context
    renderWithRouter(<MyPage />, { route: '/my-page' });
    
    // 2. Wait for async operations (like data fetching) to complete
    await waitFor(() => {
      // 3. Assert on the DOM
      expect(screen.getByText('Expected Content')).toBeInTheDocument();
    });
  });
});
```

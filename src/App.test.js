import '@testing-library/jest-dom/extend-expect'

import { render } from '@testing-library/svelte'

import App from './App'

describe('All of App', () => {
  let app;
  beforeEach(() => {
    app = render(App, {});
  })

  test('shows There and Here on the page', () => {
    const { getByText } = app;
  
    expect(getByText('There and Here')).toBeInTheDocument();
  });
  test('shows content should go here on page', () => {
    const { getByText } = app;

    expect(getByText('content goes here.')).toBeInTheDocument();
  })
})
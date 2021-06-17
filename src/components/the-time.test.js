import '@testing-library/jest-dom/extend-expect';

import { render, screen } from '@testing-library/svelte';

import TheTime from './the-time';

describe('All of TheTime', () => {
  let theTime;
  beforeEach(() => {
    theTime = render(TheTime, { props: { offset: 0, place: "there" }});
  })

  test('should have element for time', () => {
    expect(screen.queryByTestId('clock')).toBeVisible();
  });

  test('should display place', () => {
    const { getByText } = theTime;
    expect(getByText('there')).toBeInTheDocument();
  })
});
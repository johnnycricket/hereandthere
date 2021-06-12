import '@testing-library/jest-dom/extend-expect'

import { render } from '@testing-library/svelte'

import App from './App'

test('shows proper heading when rendered', () => {
  const { getByText } = render(App, {})

  expect(getByText('Hello World')).toBeInTheDocument()
})
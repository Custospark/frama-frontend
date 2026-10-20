import { describe, expect, it, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { PinInput } from '../PinInput';

afterEach(() => {
  cleanup();
});

function getInput(container: HTMLElement): HTMLInputElement {
  const el = container.querySelector('input');
  if (!el) throw new Error('input not found');
  return el;
}

describe('PinInput', () => {
  it('renders a password field by default', () => {
    const { container } = render(<PinInput />);
    expect(getInput(container).getAttribute('type')).toBe('password');
  });

  it('toggles visibility when the show/hide button is clicked', () => {
    const { container } = render(<PinInput />);
    const input = getInput(container);

    fireEvent.click(screen.getByRole('button', { name: /show pin/i }));
    expect(input.getAttribute('type')).toBe('text');

    fireEvent.click(screen.getByRole('button', { name: /hide pin/i }));
    expect(input.getAttribute('type')).toBe('password');
  });

  it('renders a label when provided', () => {
    render(<PinInput label="Access PIN" />);
    expect(screen.getByLabelText('Access PIN')).toBeTruthy();
  });

  it('shows an error message when provided', () => {
    render(<PinInput label="PIN" error="PIN is required" />);
    expect(screen.getByText('PIN is required')).toBeTruthy();
  });

  it('limits input to six characters', () => {
    const { container } = render(<PinInput />);
    expect(getInput(container).getAttribute('maxlength')).toBe('6');
  });
});

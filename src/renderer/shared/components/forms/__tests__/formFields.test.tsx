import { describe, expect, it, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { Users, Tag } from 'lucide-react';
import { FormField, FormFooter, FormHero, FormSection } from '../formFields';

afterEach(() => {
  cleanup();
});

describe('FormHero', () => {
  it('renders the title and description', () => {
    render(<FormHero icon={Users} title="New user" description="Add someone to the platform." />);
    expect(screen.getByText('New user')).toBeTruthy();
    expect(screen.getByText('Add someone to the platform.')).toBeTruthy();
  });
});

describe('FormSection', () => {
  it('renders its title, description and children', () => {
    render(
      <FormSection title="Account" icon={Users} description="Identity fields">
        <p>child content</p>
      </FormSection>,
    );
    expect(screen.getByText('Account')).toBeTruthy();
    expect(screen.getByText('Identity fields')).toBeTruthy();
    expect(screen.getByText('child content')).toBeTruthy();
  });
});

describe('FormField', () => {
  it('renders the label and an asterisk when required', () => {
    render(
      <FormField label="Name" icon={Tag} required>
        <input aria-label="name" />
      </FormField>,
    );
    expect(screen.getByText('Name')).toBeTruthy();
    expect(screen.getByText('*')).toBeTruthy();
  });

  it('shows a hint when there is no error', () => {
    render(
      <FormField label="Name" icon={Tag} hint="Between 4 and 6 digits">
        <input aria-label="name" />
      </FormField>,
    );
    expect(screen.getByText('Between 4 and 6 digits')).toBeTruthy();
  });

  it('prefers the error over the hint', () => {
    render(
      <FormField label="Name" icon={Tag} hint="A hint" error="Required">
        <input aria-label="name" />
      </FormField>,
    );
    expect(screen.getByText('Required')).toBeTruthy();
    expect(screen.queryByText('A hint')).toBeNull();
  });
});

describe('FormFooter', () => {
  it('renders its children', () => {
    render(
      <FormFooter>
        <button type="button">Save</button>
      </FormFooter>,
    );
    expect(screen.getByRole('button', { name: 'Save' })).toBeTruthy();
  });
});

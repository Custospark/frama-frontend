import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { Pagination } from '../Pagination';

afterEach(() => {
  cleanup();
});

describe('Pagination', () => {
  it('shows the visible report range', () => {
    render(
      <Pagination page={2} lastPage={3} total={25} perPage={10} onPageChange={() => {}} />,
    );

    expect(screen.getByText('11–20')).toBeTruthy();
    expect(screen.getByText('25')).toBeTruthy();
  });

  it('moves to the next and previous page', () => {
    const onPageChange = vi.fn();
    render(
      <Pagination page={2} lastPage={3} total={25} perPage={10} onPageChange={onPageChange} />,
    );

    fireEvent.click(screen.getByRole('button', { name: /next page/i }));
    fireEvent.click(screen.getByRole('button', { name: /previous page/i }));

    expect(onPageChange).toHaveBeenNthCalledWith(1, 3);
    expect(onPageChange).toHaveBeenNthCalledWith(2, 1);
  });

  it('disables controls on the first page', () => {
    render(
      <Pagination page={1} lastPage={1} total={4} perPage={10} onPageChange={() => {}} />,
    );

    expect((screen.getByRole('button', { name: /previous page/i }) as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByRole('button', { name: /next page/i }) as HTMLButtonElement).disabled).toBe(true);
  });

  it('renders an ellipsis window for many pages', () => {
    render(
      <Pagination page={8} lastPage={20} total={195} perPage={10} onPageChange={() => {}} />,
    );

    expect(screen.getAllByText('…')).toHaveLength(2);
    expect(screen.getByRole('button', { name: 'Page 8' }).getAttribute('aria-current')).toBe('page');
  });
});

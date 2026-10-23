import { describe, expect, it } from 'vitest';
import { homeRouteFor, ROUTES } from '../shared.paths';

describe('homeRouteFor', () => {
  it('sends managers to the manager dashboard', () => {
    expect(homeRouteFor('manager')).toBe(ROUTES.MANAGER.DASHBOARD);
  });

  it('sends executives straight to /admin', () => {
    expect(homeRouteFor('executive')).toBe('/admin');
  });

  it('sends platform admins to /admin', () => {
    expect(homeRouteFor('platform_admin')).toBe('/admin');
  });
});

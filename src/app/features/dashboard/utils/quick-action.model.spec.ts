import { getQuickActionsForRole } from './quick-action.model';

describe('getQuickActionsForRole', () => {
  const ids = (role: Parameters<typeof getQuickActionsForRole>[0]) =>
    getQuickActionsForRole(role).map((a) => a.id);

  it('ADMIN ve las cinco acciones', () => {
    expect(ids('ADMIN')).toEqual(['upload', 'search', 'list', 'users', 'categories']);
  });

  it('EDITOR puede subir, pero no administrar', () => {
    expect(ids('EDITOR')).toEqual(['upload', 'search', 'list']);
  });

  it('READER solo consulta', () => {
    expect(ids('READER')).toEqual(['search', 'list']);
  });
});

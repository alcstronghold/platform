import { describe, expect, it } from 'vitest';

import { computeDisplayName, toAuthenticatedUser, type User } from './user.entity';

describe('computeDisplayName', () => {
  it('should use full name when both firstName and lastName exist', () => {
    const user: User = {
      id: '1',
      email: 'john@example.com',
      firstName: 'John',
      lastName: 'Doe',
      avatar: null,
    };

    expect(computeDisplayName(user)).toBe('John Doe');
  });

  it('should use firstName only when lastName is null', () => {
    const user: User = {
      id: '1',
      email: 'john@example.com',
      firstName: 'John',
      lastName: null,
      avatar: null,
    };

    expect(computeDisplayName(user)).toBe('John');
  });

  it('should use email username when no firstName', () => {
    const user: User = {
      id: '1',
      email: 'john.doe@example.com',
      firstName: null,
      lastName: null,
      avatar: null,
    };

    expect(computeDisplayName(user)).toBe('john.doe');
  });

  it('should use email username when firstName is empty string', () => {
    const user: User = {
      id: '1',
      email: 'jane@example.com',
      firstName: '',
      lastName: null,
      avatar: null,
    };

    expect(computeDisplayName(user)).toBe('jane');
  });
});

describe('toAuthenticatedUser', () => {
  it('should add displayName to user', () => {
    const user: User = {
      id: '1',
      email: 'john@example.com',
      firstName: 'John',
      lastName: 'Doe',
      avatar: null,
    };

    const authUser = toAuthenticatedUser(user);

    expect(authUser).toEqual({
      ...user,
      displayName: 'John Doe',
    });
  });

  it('should preserve all user properties', () => {
    const user: User = {
      id: '123',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: null,
      avatar: 'https://example.com/avatar.png',
    };

    const authUser = toAuthenticatedUser(user);

    expect(authUser.id).toBe('123');
    expect(authUser.email).toBe('test@example.com');
    expect(authUser.firstName).toBe('Test');
    expect(authUser.lastName).toBeNull();
    expect(authUser.avatar).toBe('https://example.com/avatar.png');
    expect(authUser.displayName).toBe('Test');
  });
});

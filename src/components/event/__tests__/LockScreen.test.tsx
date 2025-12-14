/**
 * LockScreen Component Tests
 * Based on FEATURE_SPECS.md - FR-002
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LockScreen } from '../LockScreen';
import * as crypto from '@/services/crypto';
import * as storage from '@/services/storage';

// Mock the crypto service
vi.mock('@/services/crypto', () => ({
  verifyPassword: vi.fn(),
}));

// Mock the storage service
vi.mock('@/services/storage', () => ({
  getLockState: vi.fn(),
  recordFailedAttempt: vi.fn(),
}));

describe('LockScreen', () => {
  const mockOnUnlock = vi.fn();
  const mockPasswordHash = 'test-hash-12345';
  const mockEventId = 'test1234';

  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock implementations
    (storage.getLockState as any).mockReturnValue({
      isLocked: false,
      failedAttempts: 0,
      lockedUntil: null,
    });
  });

  it('should render lock screen with password input', () => {
    render(
      <LockScreen
        eventId={mockEventId}
        passwordHash={mockPasswordHash}
        onUnlock={mockOnUnlock}
      />
    );

    expect(screen.getByText('Password Protected')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /unlock/i })).toBeInTheDocument();
  });

  it('should call onUnlock when correct password is entered', async () => {
    const user = userEvent.setup();
    (crypto.verifyPassword as any).mockResolvedValue(true);

    render(
      <LockScreen
        eventId={mockEventId}
        passwordHash={mockPasswordHash}
        onUnlock={mockOnUnlock}
      />
    );

    const input = screen.getByPlaceholderText('Enter password');
    const button = screen.getByRole('button', { name: /unlock/i });

    await user.type(input, 'correctpassword');
    await user.click(button);

    await waitFor(() => {
      expect(crypto.verifyPassword).toHaveBeenCalledWith('correctpassword', mockPasswordHash);
      expect(mockOnUnlock).toHaveBeenCalled();
    });
  });

  it('should show error message for incorrect password', async () => {
    const user = userEvent.setup();
    (crypto.verifyPassword as any).mockResolvedValue(false);
    (storage.recordFailedAttempt as any).mockReturnValue({
      isLocked: false,
      failedAttempts: 1,
      lockedUntil: null,
    });

    render(
      <LockScreen
        eventId={mockEventId}
        passwordHash={mockPasswordHash}
        onUnlock={mockOnUnlock}
      />
    );

    const input = screen.getByPlaceholderText('Enter password');
    const button = screen.getByRole('button', { name: /unlock/i });

    await user.type(input, 'wrongpassword');
    await user.click(button);

    await waitFor(() => {
      expect(screen.getByText(/incorrect password/i)).toBeInTheDocument();
      expect(screen.getByText(/4 attempts remaining/i)).toBeInTheDocument();
    });
  });

  it('should show remaining attempts warning', async () => {
    const user = userEvent.setup();
    (crypto.verifyPassword as any).mockResolvedValue(false);
    (storage.getLockState as any).mockReturnValue({
      isLocked: false,
      failedAttempts: 2,
      lockedUntil: null,
    });
    (storage.recordFailedAttempt as any).mockReturnValue({
      isLocked: false,
      failedAttempts: 3,
      lockedUntil: null,
    });

    render(
      <LockScreen
        eventId={mockEventId}
        passwordHash={mockPasswordHash}
        onUnlock={mockOnUnlock}
      />
    );

    // Should show initial warning
    expect(screen.getByText(/3 attempts remaining/i)).toBeInTheDocument();

    const input = screen.getByPlaceholderText('Enter password');
    const button = screen.getByRole('button', { name: /unlock/i });

    await user.type(input, 'wrongpassword');
    await user.click(button);

    await waitFor(() => {
      expect(screen.getByText(/2 attempts remaining/i)).toBeInTheDocument();
    });
  });

  it('should lock account after 5 failed attempts', async () => {
    const user = userEvent.setup();
    const lockedUntil = new Date(Date.now() + 30 * 60 * 1000).toISOString();

    (crypto.verifyPassword as any).mockResolvedValue(false);
    (storage.recordFailedAttempt as any).mockReturnValue({
      isLocked: true,
      failedAttempts: 5,
      lockedUntil,
    });

    render(
      <LockScreen
        eventId={mockEventId}
        passwordHash={mockPasswordHash}
        onUnlock={mockOnUnlock}
      />
    );

    const input = screen.getByPlaceholderText('Enter password');
    const button = screen.getByRole('button', { name: /unlock/i });

    await user.type(input, 'wrongpassword');
    await user.click(button);

    await waitFor(() => {
      // Check that recordFailedAttempt was called
      expect(storage.recordFailedAttempt).toHaveBeenCalledWith(mockEventId);
      // Check that onUnlock was NOT called (account is locked)
      expect(mockOnUnlock).not.toHaveBeenCalled();
    });
  });

  it('should display locked state with time remaining', () => {
    const lockedUntil = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 minutes from now

    (storage.getLockState as any).mockReturnValue({
      isLocked: true,
      failedAttempts: 5,
      lockedUntil,
    });

    render(
      <LockScreen
        eventId={mockEventId}
        passwordHash={mockPasswordHash}
        onUnlock={mockOnUnlock}
      />
    );

    expect(screen.getByText('Account Locked')).toBeInTheDocument();
    expect(screen.getByText(/please try again in/i)).toBeInTheDocument();

    // Password input should not be visible when locked
    expect(screen.queryByPlaceholderText('Enter password')).not.toBeInTheDocument();
  });

  it('should disable submit button when password is empty', () => {
    render(
      <LockScreen
        eventId={mockEventId}
        passwordHash={mockPasswordHash}
        onUnlock={mockOnUnlock}
      />
    );

    const button = screen.getByRole('button', { name: /unlock/i });
    expect(button).toBeDisabled();
  });

  it('should clear password field after failed attempt', async () => {
    const user = userEvent.setup();
    (crypto.verifyPassword as any).mockResolvedValue(false);
    (storage.recordFailedAttempt as any).mockReturnValue({
      isLocked: false,
      failedAttempts: 1,
      lockedUntil: null,
    });

    render(
      <LockScreen
        eventId={mockEventId}
        passwordHash={mockPasswordHash}
        onUnlock={mockOnUnlock}
      />
    );

    const input = screen.getByPlaceholderText('Enter password') as HTMLInputElement;
    const button = screen.getByRole('button', { name: /unlock/i });

    await user.type(input, 'wrongpassword');
    expect(input.value).toBe('wrongpassword');

    await user.click(button);

    await waitFor(() => {
      expect(input.value).toBe('');
    });
  });

  it('should record failed attempt when password is incorrect', async () => {
    const user = userEvent.setup();
    (crypto.verifyPassword as any).mockResolvedValue(false);
    (storage.recordFailedAttempt as any).mockReturnValue({
      isLocked: false,
      failedAttempts: 1,
      lockedUntil: null,
    });

    render(
      <LockScreen
        eventId={mockEventId}
        passwordHash={mockPasswordHash}
        onUnlock={mockOnUnlock}
      />
    );

    const input = screen.getByPlaceholderText('Enter password');
    const button = screen.getByRole('button', { name: /unlock/i });

    await user.type(input, 'wrongpassword');
    await user.click(button);

    await waitFor(() => {
      expect(storage.recordFailedAttempt).toHaveBeenCalledWith(mockEventId);
    });
  });

  it('should not record failed attempt when password is correct', async () => {
    const user = userEvent.setup();
    (crypto.verifyPassword as any).mockResolvedValue(true);

    render(
      <LockScreen
        eventId={mockEventId}
        passwordHash={mockPasswordHash}
        onUnlock={mockOnUnlock}
      />
    );

    const input = screen.getByPlaceholderText('Enter password');
    const button = screen.getByRole('button', { name: /unlock/i });

    await user.type(input, 'correctpassword');
    await user.click(button);

    await waitFor(() => {
      expect(storage.recordFailedAttempt).not.toHaveBeenCalled();
      expect(mockOnUnlock).toHaveBeenCalled();
    });
  });
});

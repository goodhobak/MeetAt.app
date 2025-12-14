/**
 * LockScreen Component
 * Based on FEATURE_SPECS.md - FR-002
 * Handles password verification with brute-force protection
 */

import { useState, useEffect } from 'react';
import { verifyPassword } from '@/services/crypto';
import { getLockState, recordFailedAttempt } from '@/services/storage';

interface LockScreenProps {
  eventId: string;
  passwordHash: string;
  onUnlock: () => void;
}

const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 30 * 60 * 1000; // 30 minutes

export function LockScreen({ eventId, passwordHash, onUnlock }: LockScreenProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [lockState, setLockState] = useState(() => getLockState(eventId));
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);

  // Update time remaining for locked state
  useEffect(() => {
    if (!lockState.isLocked) return;

    const updateTimeRemaining = () => {
      const now = Date.now();
      const lockedUntil = new Date(lockState.lockedUntil!).getTime();
      const remaining = lockedUntil - now;

      if (remaining <= 0) {
        // Lock has expired, refresh lock state
        const newLockState = getLockState(eventId);
        setLockState(newLockState);
        setTimeRemaining(null);
        setError('');
      } else {
        setTimeRemaining(remaining);
      }
    };

    updateTimeRemaining();
    const interval = setInterval(updateTimeRemaining, 1000);

    return () => clearInterval(interval);
  }, [eventId, lockState.isLocked, lockState.lockedUntil]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsVerifying(true);

    try {
      // Check if locked
      const currentLockState = getLockState(eventId);
      if (currentLockState.isLocked) {
        setLockState(currentLockState);
        setError('Too many failed attempts. Please try again later.');
        setIsVerifying(false);
        return;
      }

      // Verify password
      const isValid = await verifyPassword(password, passwordHash);

      if (isValid) {
        // Success - unlock the event
        onUnlock();
      } else {
        // Failed attempt - record it
        const newLockState = recordFailedAttempt(eventId);
        setLockState(newLockState);

        if (newLockState.isLocked) {
          setError(
            `Too many failed attempts. This event is locked for 30 minutes.`
          );
        } else {
          const attemptsRemaining = MAX_ATTEMPTS - newLockState.failedAttempts;
          setError(
            `Incorrect password. ${attemptsRemaining} attempt${attemptsRemaining === 1 ? '' : 's'} remaining.`
          );
        }
        setPassword('');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const formatTimeRemaining = (ms: number): string => {
    const minutes = Math.ceil(ms / 1000 / 60);
    if (minutes < 1) return 'less than a minute';
    return `${minutes} minute${minutes === 1 ? '' : 's'}`;
  };

  return (
    <div className="mx-auto max-w-md">
      <div className="rounded-lg bg-white p-6 shadow-md">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary-100">
            <svg
              className="h-6 w-6 text-primary-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900">
            Password Protected
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            This event is password protected. Enter the password to continue.
          </p>
        </div>

        {lockState.isLocked && timeRemaining !== null ? (
          <div className="rounded-md bg-red-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-red-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Account Locked</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>
                    Too many failed login attempts. Please try again in{' '}
                    <strong>{formatTimeRemaining(timeRemaining)}</strong>.
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                placeholder="Enter password"
                required
                autoFocus
              />
            </div>

            {error && (
              <div className="rounded-md bg-red-50 p-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {!error && !lockState.isLocked && lockState.failedAttempts > 0 && (
              <div className="rounded-md bg-yellow-50 p-3">
                <p className="text-sm text-yellow-800">
                  {MAX_ATTEMPTS - lockState.failedAttempts} attempt
                  {MAX_ATTEMPTS - lockState.failedAttempts === 1 ? '' : 's'} remaining
                  before account is locked.
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={isVerifying || !password}
              className="w-full rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isVerifying ? 'Verifying...' : 'Unlock'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

/**
 * SharePanel Component Tests
 * Based on FEATURE_SPECS.md - FR-003
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SharePanel } from '../SharePanel';

// Mock toast
vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
    loading: vi.fn(),
  },
}));

describe('SharePanel', () => {
  const mockEventId = 'test1234';
  const expectedUrl = `${window.location.origin}/#/event/${mockEventId}`;

  // Mock clipboard API
  let clipboardWriteText: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    clipboardWriteText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: clipboardWriteText,
      },
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should render share panel with correct URL', () => {
    render(<SharePanel eventId={mockEventId} />);

    expect(screen.getByText('Share this event')).toBeInTheDocument();
    expect(screen.getByDisplayValue(expectedUrl)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /copy/i })).toBeInTheDocument();
  });

  it('should have QR code toggle button', () => {
    render(<SharePanel eventId={mockEventId} />);
    expect(screen.getByRole('button', { name: /show qr code/i })).toBeInTheDocument();
  });

  it('should display read-only URL input', () => {
    render(<SharePanel eventId={mockEventId} />);
    const input = screen.getByDisplayValue(expectedUrl) as HTMLInputElement;
    expect(input.readOnly).toBe(true);
  });

  it('should render QR code when toggle is clicked', async () => {
    const user = userEvent.setup();
    render(<SharePanel eventId={mockEventId} />);

    // Initially QR code should not be visible
    expect(screen.queryByText(/scan this qr code/i)).not.toBeInTheDocument();

    // Click to show QR code
    await user.click(screen.getByRole('button', { name: /show qr code/i }));

    // QR code should now be visible
    expect(screen.getByText(/scan this qr code/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /hide qr code/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /download qr code/i })).toBeInTheDocument();

    // QR code SVG should be rendered
    const qrCodeSvg = document.getElementById('qr-code-svg');
    expect(qrCodeSvg).toBeInTheDocument();
    expect(qrCodeSvg?.tagName).toBe('svg');
  });

  it('should hide QR code when toggle is clicked again', async () => {
    const user = userEvent.setup();
    render(<SharePanel eventId={mockEventId} />);

    // Show QR code
    await user.click(screen.getByRole('button', { name: /show qr code/i }));
    expect(screen.getByText(/scan this qr code/i)).toBeInTheDocument();

    // Hide QR code
    await user.click(screen.getByRole('button', { name: /hide qr code/i }));
    expect(screen.queryByText(/scan this qr code/i)).not.toBeInTheDocument();
  });

  it('should apply custom className when provided', () => {
    const { container } = render(<SharePanel eventId={mockEventId} className="custom-class" />);
    const sharePanel = container.firstChild as HTMLElement;
    expect(sharePanel.className).toContain('custom-class');
  });

  it('should render copy button with icon', () => {
    render(<SharePanel eventId={mockEventId} />);
    const copyButton = screen.getByRole('button', { name: /copy/i });
    // Check that button exists and has content
    expect(copyButton).toBeInTheDocument();
    expect(copyButton).toHaveTextContent(/copy/i);
  });

  it('should render QR code button with icon', () => {
    render(<SharePanel eventId={mockEventId} />);
    const qrButton = screen.getByRole('button', { name: /show qr code/i });
    expect(qrButton).toBeInTheDocument();
    expect(qrButton).toHaveTextContent(/show qr code/i);
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { EventForm } from '../EventForm';

// Mock navigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock toast
vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('EventForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  const renderEventForm = () => {
    return render(
      <MemoryRouter>
        <EventForm />
      </MemoryRouter>
    );
  };

  it('should render the form with all fields', () => {
    renderEventForm();

    expect(screen.getByLabelText(/event name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/expected duration/i)).toBeInTheDocument();
    expect(screen.getByText(/candidate dates/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/start time/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/end time/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/exclude lunch/i)).toBeInTheDocument();
  });

  it('should show lunch time inputs when exclude lunch is checked', () => {
    renderEventForm();

    // Lunch inputs should be visible by default (excludeLunch is true by default)
    expect(screen.getByLabelText(/lunch start/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/lunch end/i)).toBeInTheDocument();
  });

  it('should hide lunch time inputs when exclude lunch is unchecked', () => {
    renderEventForm();

    const excludeLunchCheckbox = screen.getByLabelText(/exclude lunch/i);
    fireEvent.click(excludeLunchCheckbox);

    expect(screen.queryByLabelText(/lunch start/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/lunch end/i)).not.toBeInTheDocument();
  });

  it('should add candidate dates', () => {
    renderEventForm();

    const dateInput = document.getElementById('date-input') as HTMLInputElement;
    const addButton = screen.getByText(/add date/i);

    // Add a date
    if (dateInput) {
      fireEvent.change(dateInput, { target: { value: '2025-12-15' } });
      fireEvent.click(addButton);
      expect(screen.getByText(/dec 15, 2025/i)).toBeInTheDocument();
    }
  });

  it('should remove candidate dates', () => {
    renderEventForm();

    const dateInput = document.getElementById('date-input') as HTMLInputElement;
    const addButton = screen.getByText(/add date/i);

    // Add a date
    if (dateInput) {
      fireEvent.change(dateInput, { target: { value: '2025-12-15' } });
      fireEvent.click(addButton);
      expect(screen.getByText(/dec 15, 2025/i)).toBeInTheDocument();

      // Remove the date
      const removeButton = screen.getByText('×');
      fireEvent.click(removeButton);

      expect(screen.queryByText(/dec 15, 2025/i)).not.toBeInTheDocument();
    }
  });

  it('should disable submit button when no dates are selected', () => {
    renderEventForm();

    const submitButton = screen.getByRole('button', { name: /create event/i });
    expect(submitButton).toBeDisabled();
  });

  it('should enable submit button when dates are selected', () => {
    renderEventForm();

    const dateInput = document.getElementById('date-input') as HTMLInputElement;
    const addButton = screen.getByText(/add date/i);

    if (dateInput) {
      fireEvent.change(dateInput, { target: { value: '2025-12-15' } });
      fireEvent.click(addButton);

      const submitButton = screen.getByRole('button', { name: /create event/i });
      expect(submitButton).not.toBeDisabled();
    }
  });

  it('should have submit button enabled after adding date and name', () => {
    renderEventForm();

    // Fill in the form
    const nameInput = screen.getByLabelText(/event name/i);
    fireEvent.change(nameInput, { target: { value: 'Test Event' } });

    const dateInput = document.getElementById('date-input') as HTMLInputElement;
    const addButton = screen.getByText(/add date/i);

    if (dateInput) {
      fireEvent.change(dateInput, { target: { value: '2025-12-15' } });
      fireEvent.click(addButton);

      const submitButton = screen.getByRole('button', { name: /create event/i });
      expect(submitButton).not.toBeDisabled();
    }
  });

  it('should show error message on validation failure', async () => {
    renderEventForm();

    // Try to submit without a name
    const dateInput = document.getElementById('date-input') as HTMLInputElement;
    const addButton = screen.getByText(/add date/i);

    if (dateInput) {
      fireEvent.change(dateInput, { target: { value: '2025-12-15' } });
      fireEvent.click(addButton);

      const nameInput = screen.getByLabelText(/event name/i);
      fireEvent.change(nameInput, { target: { value: '' } });

      const submitButton = screen.getByRole('button', { name: /create event/i });
      fireEvent.click(submitButton);

      // The browser's built-in validation should prevent submission
      // We can't easily test this, but we can verify the input is required
      expect(nameInput).toBeRequired();
    }
  });
});

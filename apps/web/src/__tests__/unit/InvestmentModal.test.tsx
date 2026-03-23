import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { InvestmentModal } from '../../components/investments/InvestmentModal';

const noop = vi.fn();

afterEach(() => vi.clearAllMocks());

describe('InvestmentModal — Add mode', () => {
  it('renders "Add Investment" title when no id is provided', () => {
    render(<InvestmentModal investment={{}} onSave={noop} onCancel={noop} />);
    expect(screen.getByText('Add Investment')).toBeInTheDocument();
  });

  it('renders the modal overlay', () => {
    render(<InvestmentModal investment={{}} onSave={noop} onCancel={noop} />);
    expect(screen.getByTestId('investment-modal')).toBeInTheDocument();
  });

  it('name input is empty by default', () => {
    render(<InvestmentModal investment={{}} onSave={noop} onCancel={noop} />);
    expect(screen.getByTestId('investment-name-input')).toHaveValue('');
  });

  it('annual return input defaults to 12', () => {
    render(<InvestmentModal investment={{}} onSave={noop} onCancel={noop} />);
    expect(screen.getByTestId('annual-return-input')).toHaveValue(12);
  });

  it('calls onCancel when cancel button is clicked', () => {
    const onCancel = vi.fn();
    render(<InvestmentModal investment={{}} onSave={noop} onCancel={onCancel} />);
    fireEvent.click(screen.getByText('Cancel'));
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it('calls onCancel when X button is clicked', () => {
    const onCancel = vi.fn();
    render(<InvestmentModal investment={{}} onSave={noop} onCancel={onCancel} />);
    // The X button is in the header — it's the only button before "Basic/Advanced"
    const closeBtn = screen.getByRole('button', { name: '' }); // lucide X has no text
    // Find by proximity — click first button in header
    const allButtons = screen.getAllByRole('button');
    fireEvent.click(allButtons[0]!); // first button is the X
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it('calls onSave with form data when Save is clicked', () => {
    const onSave = vi.fn();
    render(<InvestmentModal investment={{}} onSave={onSave} onCancel={noop} />);
    fireEvent.change(screen.getByTestId('investment-name-input'), {
      target: { value: 'Nifty 50' },
    });
    fireEvent.click(screen.getByTestId('save-investment-button'));
    expect(onSave).toHaveBeenCalledOnce();
    expect(onSave.mock.calls[0][0]).toMatchObject({ name: 'Nifty 50' });
  });

  it('onSave includes returnType in the saved data', () => {
    const onSave = vi.fn();
    render(<InvestmentModal investment={{}} onSave={onSave} onCancel={noop} />);
    fireEvent.click(screen.getByTestId('save-investment-button'));
    expect(onSave.mock.calls[0][0]).toMatchObject({ returnType: 'basic' });
  });

  it('updating annual return is reflected in onSave', () => {
    const onSave = vi.fn();
    render(<InvestmentModal investment={{}} onSave={onSave} onCancel={noop} />);
    fireEvent.change(screen.getByTestId('annual-return-input'), {
      target: { value: '15' },
    });
    fireEvent.click(screen.getByTestId('save-investment-button'));
    expect(onSave.mock.calls[0][0]).toMatchObject({ annualReturn: 15 });
  });
});

describe('InvestmentModal — Edit mode', () => {
  const existing = {
    id: 42,
    name: 'Gold ETF',
    assetClass: 'Gold',
    annualReturn: 8,
    returnType: 'basic' as const,
    variableReturns: [],
  };

  it('renders "Edit Investment" title when id is present', () => {
    render(<InvestmentModal investment={existing} onSave={noop} onCancel={noop} />);
    expect(screen.getByText('Edit Investment')).toBeInTheDocument();
  });

  it('pre-fills name input with existing investment name', () => {
    render(<InvestmentModal investment={existing} onSave={noop} onCancel={noop} />);
    expect(screen.getByTestId('investment-name-input')).toHaveValue('Gold ETF');
  });

  it('pre-fills annual return with existing value', () => {
    render(<InvestmentModal investment={existing} onSave={noop} onCancel={noop} />);
    expect(screen.getByTestId('annual-return-input')).toHaveValue(8);
  });
});

describe('InvestmentModal — Advanced return tab', () => {
  it('switching to Advanced tab hides the annual return input', () => {
    render(<InvestmentModal investment={{}} onSave={noop} onCancel={noop} />);
    fireEvent.click(screen.getByText('Advanced'));
    expect(screen.queryByTestId('annual-return-input')).not.toBeInTheDocument();
  });

  it('shows "Add Period" button in advanced mode', () => {
    render(<InvestmentModal investment={{}} onSave={noop} onCancel={noop} />);
    fireEvent.click(screen.getByText('Advanced'));
    expect(screen.getByText('Add Period')).toBeInTheDocument();
  });

  it('clicking Add Period adds a variable return row', () => {
    render(<InvestmentModal investment={{}} onSave={noop} onCancel={noop} />);
    fireEvent.click(screen.getByText('Advanced'));
    fireEvent.click(screen.getByText('Add Period'));
    // Should now show From / to / at inputs
    expect(screen.getAllByText('From').length).toBeGreaterThan(0);
  });

  it('can add multiple periods', () => {
    render(<InvestmentModal investment={{}} onSave={noop} onCancel={noop} />);
    fireEvent.click(screen.getByText('Advanced'));
    fireEvent.click(screen.getByText('Add Period'));
    fireEvent.click(screen.getByText('Add Period'));
    expect(screen.getAllByText('From')).toHaveLength(2);
  });

  it('onSave includes returnType: advanced when Advanced tab is active', () => {
    const onSave = vi.fn();
    render(<InvestmentModal investment={{}} onSave={onSave} onCancel={noop} />);
    fireEvent.click(screen.getByText('Advanced'));
    fireEvent.click(screen.getByTestId('save-investment-button'));
    expect(onSave.mock.calls[0][0]).toMatchObject({ returnType: 'advanced' });
  });

  it('switching back to Basic tab shows annual return input again', () => {
    render(<InvestmentModal investment={{}} onSave={noop} onCancel={noop} />);
    fireEvent.click(screen.getByText('Advanced'));
    fireEvent.click(screen.getByText('Basic'));
    expect(screen.getByTestId('annual-return-input')).toBeInTheDocument();
  });
});

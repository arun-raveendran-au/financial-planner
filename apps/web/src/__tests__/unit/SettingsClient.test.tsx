import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SettingsClient } from '../../app/(dashboard)/settings/SettingsClient';
import { usePlannerStore } from '@financial-planner/store';

// ── Browser API mocks ──────────────────────────────────────────────────────────

// URL.createObjectURL is not implemented in jsdom
Object.defineProperty(URL, 'createObjectURL', {
  writable: true,
  value: vi.fn(() => 'blob:mock-url'),
});

// FileReader mock — runs onload synchronously so no waitFor needed
let _fileReadResult = '';

const MockFileReader = vi.fn().mockImplementation(() => ({
  result: '',
  onload: null as ((ev: { target: { result: string } }) => void) | null,
  readAsText() {
    this.result = _fileReadResult;
    this.onload?.({ target: this });
  },
}));
vi.stubGlobal('FileReader', MockFileReader);

// alert mock
const alertMock = vi.fn();
vi.stubGlobal('alert', alertMock);

// ── Store helpers ──────────────────────────────────────────────────────────────

const baseProfile = {
  id: 1,
  name: 'My Portfolio',
  investments: [],
  sips: [],
  lumpsums: [],
  swps: [],
  oneTimeWithdrawals: [],
  goals: [],
  rebalancingEvents: [],
};

const resetStore = () =>
  usePlannerStore.setState({
    profiles: [{ ...baseProfile }],
    activeProfileId: 1,
    globalSettings: { timelineYears: 30, startYear: 2024 },
  });

beforeEach(() => {
  resetStore();
  vi.clearAllMocks();
  _fileReadResult = '';
});

// ── Helper: trigger a file import ─────────────────────────────────────────────

function triggerImport(content: string) {
  _fileReadResult = content;
  const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
  const file = new File([content], 'plan.json', { type: 'application/json' });
  Object.defineProperty(fileInput, 'files', { value: [file], configurable: true });
  fireEvent.change(fileInput);
}

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('SettingsClient — renders', () => {
  it('shows the Settings heading', () => {
    render(<SettingsClient />);
    expect(screen.getByRole('heading', { name: 'Settings' })).toBeInTheDocument();
  });

  it('shows Timeline, Data, and Profiles sections', () => {
    render(<SettingsClient />);
    expect(screen.getByRole('heading', { name: 'Timeline' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Data' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Profiles' })).toBeInTheDocument();
  });
});

describe('SettingsClient — timeline settings', () => {
  it('displays current start year', () => {
    render(<SettingsClient />);
    expect(screen.getByTestId('start-year-input')).toHaveValue(2024);
  });

  it('displays current timeline duration', () => {
    render(<SettingsClient />);
    expect(screen.getByTestId('timeline-years-input')).toHaveValue(30);
  });

  it('changing start year updates the store', () => {
    render(<SettingsClient />);
    fireEvent.change(screen.getByTestId('start-year-input'), { target: { value: '2025' } });
    expect(usePlannerStore.getState().globalSettings.startYear).toBe(2025);
  });

  it('changing timeline years updates the store', () => {
    render(<SettingsClient />);
    fireEvent.change(screen.getByTestId('timeline-years-input'), { target: { value: '20' } });
    expect(usePlannerStore.getState().globalSettings.timelineYears).toBe(20);
  });

  it('invalid start year (empty/NaN) falls back to current year', () => {
    render(<SettingsClient />);
    fireEvent.change(screen.getByTestId('start-year-input'), { target: { value: '' } });
    expect(usePlannerStore.getState().globalSettings.startYear).toBe(new Date().getFullYear());
  });

  it('invalid timeline years (empty/NaN) falls back to 30', () => {
    render(<SettingsClient />);
    fireEvent.change(screen.getByTestId('timeline-years-input'), { target: { value: '' } });
    expect(usePlannerStore.getState().globalSettings.timelineYears).toBe(30);
  });
});

describe('SettingsClient — Export', () => {
  it('renders the Export button', () => {
    render(<SettingsClient />);
    expect(screen.getByTestId('export-button')).toBeInTheDocument();
  });

  it('clicking Export triggers a file download (link.click called)', () => {
    render(<SettingsClient />);
    const mockClick = vi.fn();
    const mockLink = { href: '', download: '', click: mockClick };
    vi.spyOn(document, 'createElement').mockReturnValueOnce(
      mockLink as unknown as HTMLAnchorElement
    );
    fireEvent.click(screen.getByTestId('export-button'));
    expect(mockClick).toHaveBeenCalledOnce();
  });

  it('exported filename contains today\'s date', () => {
    render(<SettingsClient />);
    const mockLink = { href: '', download: '', click: vi.fn() };
    vi.spyOn(document, 'createElement').mockReturnValueOnce(
      mockLink as unknown as HTMLAnchorElement
    );
    fireEvent.click(screen.getByTestId('export-button'));
    const today = new Date().toISOString().split('T')[0];
    expect(mockLink.download).toContain(today);
  });

  it('exported JSON includes profiles and globalSettings (createObjectURL called)', () => {
    render(<SettingsClient />);
    const mockLink = { href: '', download: '', click: vi.fn() };
    vi.spyOn(document, 'createElement').mockReturnValueOnce(
      mockLink as unknown as HTMLAnchorElement
    );
    fireEvent.click(screen.getByTestId('export-button'));
    expect(URL.createObjectURL).toHaveBeenCalledOnce();
  });
});

describe('SettingsClient — Import', () => {
  it('renders the Import button', () => {
    render(<SettingsClient />);
    expect(screen.getByTestId('import-button')).toBeInTheDocument();
  });

  it('valid JSON file calls loadFromData and updates the store', () => {
    const newProfiles = [{ ...baseProfile, id: 99, name: 'Imported Profile' }];
    const newSettings = { timelineYears: 25, startYear: 2022 };
    render(<SettingsClient />);
    triggerImport(JSON.stringify({ profiles: newProfiles, globalSettings: newSettings }));
    expect(usePlannerStore.getState().profiles[0]!.name).toBe('Imported Profile');
    expect(usePlannerStore.getState().globalSettings.timelineYears).toBe(25);
  });

  it('JSON missing profiles key shows "Invalid file format." alert', () => {
    render(<SettingsClient />);
    triggerImport(JSON.stringify({ globalSettings: { timelineYears: 10, startYear: 2024 } }));
    expect(alertMock).toHaveBeenCalledWith('Invalid file format.');
  });

  it('JSON missing globalSettings key shows "Invalid file format." alert', () => {
    render(<SettingsClient />);
    triggerImport(JSON.stringify({ profiles: [] }));
    expect(alertMock).toHaveBeenCalledWith('Invalid file format.');
  });

  it('malformed JSON shows "Could not parse file." alert', () => {
    render(<SettingsClient />);
    triggerImport('{ this is not valid json }');
    expect(alertMock).toHaveBeenCalledWith('Could not parse file.');
  });

  it('malformed JSON does not modify the store', () => {
    render(<SettingsClient />);
    triggerImport('not json at all');
    expect(usePlannerStore.getState().profiles[0]!.name).toBe('My Portfolio');
  });

  it('empty file selection does nothing', () => {
    render(<SettingsClient />);
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    // No files — e.target.files is empty
    Object.defineProperty(fileInput, 'files', { value: [], configurable: true });
    fireEvent.change(fileInput);
    expect(alertMock).not.toHaveBeenCalled();
    expect(usePlannerStore.getState().profiles[0]!.name).toBe('My Portfolio');
  });
});

describe('SettingsClient — Profiles list', () => {
  it('shows all profile names', () => {
    usePlannerStore.getState().addProfile('Profile 2');
    render(<SettingsClient />);
    expect(screen.getByText('My Portfolio')).toBeInTheDocument();
    expect(screen.getByText('Profile 2')).toBeInTheDocument();
  });

  it('does not show delete button when only one profile exists', () => {
    render(<SettingsClient />);
    expect(screen.queryByTitle('Remove profile')).not.toBeInTheDocument();
  });

  it('shows delete buttons when multiple profiles exist', () => {
    usePlannerStore.getState().addProfile('Profile 2');
    render(<SettingsClient />);
    expect(screen.getAllByTitle('Remove profile')).toHaveLength(2);
  });

  it('clicking delete removes the profile from the store', () => {
    usePlannerStore.getState().addProfile('Profile 2');
    render(<SettingsClient />);
    const deleteButtons = screen.getAllByTitle('Remove profile');
    fireEvent.click(deleteButtons[1]!); // delete Profile 2
    expect(usePlannerStore.getState().profiles).toHaveLength(1);
    expect(usePlannerStore.getState().profiles[0]!.name).toBe('My Portfolio');
  });

  it('after deleting down to one profile the delete button disappears', () => {
    usePlannerStore.getState().addProfile('Profile 2');
    render(<SettingsClient />);
    fireEvent.click(screen.getAllByTitle('Remove profile')[1]!);
    expect(screen.queryByTitle('Remove profile')).not.toBeInTheDocument();
  });
});

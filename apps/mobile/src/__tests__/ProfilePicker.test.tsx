/**
 * Tests for the ProfilePicker component — tab rendering, profile switching,
 * adding profiles, and inline rename.
 */
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ProfilePicker } from '../components/ui/ProfilePicker';
import { usePlannerStore } from '@financial-planner/store';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const EMPTY_PROFILE = (id: number, name: string) => ({
  id,
  name,
  investments: [],
  sips: [],
  lumpsums: [],
  swps: [],
  oneTimeWithdrawals: [],
  goals: [],
  rebalancingEvents: [],
});

beforeEach(() => {
  usePlannerStore.setState({
    profiles: [EMPTY_PROFILE(1, 'My Portfolio')],
    activeProfileId: 1,
    globalSettings: { timelineYears: 30, startYear: 2024 },
  });
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('ProfilePicker — rendering', () => {
  it('renders a tab for each profile and the "All" tab', () => {
    const { getByText } = render(<ProfilePicker />);
    expect(getByText('My Portfolio')).toBeTruthy();
    expect(getByText('All')).toBeTruthy();
  });

  it('renders the "+" button to add a profile', () => {
    const { getByText } = render(<ProfilePicker />);
    expect(getByText('+')).toBeTruthy();
  });

  it('renders multiple profiles when the store has several', () => {
    usePlannerStore.setState({
      profiles: [
        EMPTY_PROFILE(1, 'Portfolio A'),
        EMPTY_PROFILE(2, 'Portfolio B'),
      ],
      activeProfileId: 1,
      globalSettings: { timelineYears: 30, startYear: 2024 },
    });
    const { getByText } = render(<ProfilePicker />);
    expect(getByText('Portfolio A')).toBeTruthy();
    expect(getByText('Portfolio B')).toBeTruthy();
  });
});

describe('ProfilePicker — switching active profile', () => {
  it('sets the tapped profile as active', () => {
    usePlannerStore.setState({
      profiles: [EMPTY_PROFILE(1, 'A'), EMPTY_PROFILE(2, 'B')],
      activeProfileId: 1,
      globalSettings: { timelineYears: 30, startYear: 2024 },
    });
    const { getByText } = render(<ProfilePicker />);
    fireEvent.press(getByText('B'));
    expect(usePlannerStore.getState().activeProfileId).toBe(2);
  });

  it('sets activeProfileId to "all" when the All tab is pressed', () => {
    const { getByText } = render(<ProfilePicker />);
    fireEvent.press(getByText('All'));
    expect(usePlannerStore.getState().activeProfileId).toBe('all');
  });
});

describe('ProfilePicker — adding profiles', () => {
  it('adds a new profile when "+" is pressed', () => {
    const { getByText } = render(<ProfilePicker />);
    fireEvent.press(getByText('+'));
    expect(usePlannerStore.getState().profiles).toHaveLength(2);
  });

  it('names the new profile based on the current count', () => {
    const { getByText } = render(<ProfilePicker />);
    fireEvent.press(getByText('+'));
    const names = usePlannerStore.getState().profiles.map((p) => p.name);
    expect(names).toContain('Profile 2');
  });
});

describe('ProfilePicker — inline rename', () => {
  it('shows a text input when a tab is long-pressed', () => {
    const { getByText, queryByDisplayValue } = render(<ProfilePicker />);
    fireEvent(getByText('My Portfolio'), 'longPress');
    expect(queryByDisplayValue('My Portfolio')).toBeTruthy();
  });

  it('commits the new name on submit', () => {
    const { getByText, getByDisplayValue } = render(<ProfilePicker />);
    fireEvent(getByText('My Portfolio'), 'longPress');
    const input = getByDisplayValue('My Portfolio');
    fireEvent.changeText(input, 'Renamed');
    fireEvent(input, 'submitEditing');
    expect(usePlannerStore.getState().profiles[0]?.name).toBe('Renamed');
  });
});

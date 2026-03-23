import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProfileTabs } from '../../components/ui/ProfileTabs';
import { usePlannerStore } from '../../store/plannerStore';

const resetStore = () =>
  usePlannerStore.setState({
    profiles: [
      {
        id: 1,
        name: 'My Portfolio',
        investments: [],
        sips: [],
        lumpsums: [],
        swps: [],
        oneTimeWithdrawals: [],
        goals: [],
        rebalancingEvents: [],
      },
    ],
    activeProfileId: 1,
    globalSettings: { timelineYears: 30, startYear: 2024 },
  });

beforeEach(resetStore);

describe('ProfileTabs', () => {
  it('renders the default profile tab', () => {
    render(<ProfileTabs />);
    expect(screen.getByTestId('profile-tab-1')).toBeInTheDocument();
    expect(screen.getByText('My Portfolio')).toBeInTheDocument();
  });

  it('renders the All Profiles tab', () => {
    render(<ProfileTabs />);
    expect(screen.getByTestId('profile-tab-all')).toBeInTheDocument();
    expect(screen.getByText('All Profiles')).toBeInTheDocument();
  });

  it('clicking All Profiles sets activeProfileId to "all"', () => {
    render(<ProfileTabs />);
    fireEvent.click(screen.getByTestId('profile-tab-all'));
    expect(usePlannerStore.getState().activeProfileId).toBe('all');
  });

  it('clicking a profile tab sets it as active', () => {
    usePlannerStore.getState().addProfile('Second Profile');
    const id2 = usePlannerStore.getState().profiles[1]!.id;
    // Active is now id2 (addProfile switches to new profile)
    render(<ProfileTabs />);
    // Click back to profile 1
    fireEvent.click(screen.getByTestId('profile-tab-1'));
    expect(usePlannerStore.getState().activeProfileId).toBe(1);
  });

  it('add profile button creates a new profile', () => {
    render(<ProfileTabs />);
    fireEvent.click(screen.getByTestId('add-profile-button'));
    expect(usePlannerStore.getState().profiles).toHaveLength(2);
  });

  it('new profile is named "Profile 2" when one profile exists', () => {
    render(<ProfileTabs />);
    fireEvent.click(screen.getByTestId('add-profile-button'));
    expect(usePlannerStore.getState().profiles[1]?.name).toBe('Profile 2');
  });

  it('new profile becomes the active profile', () => {
    render(<ProfileTabs />);
    fireEvent.click(screen.getByTestId('add-profile-button'));
    const newId = usePlannerStore.getState().profiles[1]!.id;
    expect(usePlannerStore.getState().activeProfileId).toBe(newId);
  });

  it('clicking edit button enters edit mode for that profile', () => {
    render(<ProfileTabs />);
    // Find the edit button for profile 1 and click it
    fireEvent.click(screen.getByTestId('profile-tab-1').querySelector('button')!);
    // An input should appear
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('editing a profile name and pressing Enter updates the name', () => {
    render(<ProfileTabs />);
    fireEvent.click(screen.getByTestId('profile-tab-1').querySelector('button')!);
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'Retirement Fund' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(usePlannerStore.getState().profiles[0]?.name).toBe('Retirement Fund');
  });

  it('pressing Escape in edit mode cancels without saving', () => {
    render(<ProfileTabs />);
    fireEvent.click(screen.getByTestId('profile-tab-1').querySelector('button')!);
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'Changed Name' } });
    fireEvent.keyDown(input, { key: 'Escape' });
    expect(usePlannerStore.getState().profiles[0]?.name).toBe('My Portfolio');
  });

  it('multiple profiles all render as tabs', () => {
    usePlannerStore.getState().addProfile('Profile 2');
    usePlannerStore.getState().addProfile('Profile 3');
    render(<ProfileTabs />);
    expect(screen.getByText('My Portfolio')).toBeInTheDocument();
    expect(screen.getByText('Profile 2')).toBeInTheDocument();
    expect(screen.getByText('Profile 3')).toBeInTheDocument();
  });
});

/**
 * @vitest-environment jsdom
 */
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { CompanyOnboardingWidget } from './CompanyOnboardingWidget';

// Mock dependencies
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

let mockContextValue: unknown = null;

vi.mock('@/components/providers/CompanyContextProvider', () => ({
  useCompanyContext: () => mockContextValue,
}));

vi.mock('@/features/company/services/CompanyCompletionService', () => {
  return {
    CompanyCompletionService: {
      calculateCompletion: (company: Record<string, unknown>) => {
        // Return exactly what we want for each test
        return company.__mockCompletion;
      },
    },
  };
});

describe('CompanyOnboardingWidget', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const setupContext = (
    percentage: number,
    items: unknown[] = [],
    nextRecommendedAction?: string,
  ) => {
    mockContextValue = {
      context: {
        company: {
          __mockCompletion: {
            percentage,
            items,
            nextRecommendedAction,
          },
        },
      },
    };
  };

  it('should render State A (0%) correctly', () => {
    setupContext(0, [
      { key: 'legalName', label: 'Legal name', completed: false, route: '/route-legal' },
    ]);
    render(<CompanyOnboardingWidget />);

    expect(screen.getByText('Welcome to Vyora 👋')).toBeDefined();
    expect(screen.getByText("Let's finish setting up your company profile.")).toBeDefined();
    expect(screen.getByText('0%')).toBeDefined();
  });

  it('should render State A (25%) correctly', () => {
    setupContext(25, []);
    render(<CompanyOnboardingWidget />);

    expect(screen.getByText('Welcome to Vyora 👋')).toBeDefined();
    expect(screen.getByText("Let's finish setting up your company profile.")).toBeDefined();
    expect(screen.getByText('25%')).toBeDefined();
  });

  it('should render State B (26%) correctly', () => {
    setupContext(26, []);
    render(<CompanyOnboardingWidget />);

    expect(screen.getByText('Company Profile Setup')).toBeDefined();
    expect(screen.getByText('Your company profile is 26% complete.')).toBeDefined();
    expect(screen.getByText('26%')).toBeDefined();
  });

  it('should render State B (50%) correctly', () => {
    setupContext(50, []);
    render(<CompanyOnboardingWidget />);

    expect(screen.getByText('Company Profile Setup')).toBeDefined();
    expect(screen.getByText('Your company profile is 50% complete.')).toBeDefined();
    expect(screen.getByText('50%')).toBeDefined();
  });

  it('should render State B (99%) correctly', () => {
    setupContext(99, []);
    render(<CompanyOnboardingWidget />);

    expect(screen.getByText('Company Profile Setup')).toBeDefined();
    expect(screen.getByText('Your company profile is 99% complete.')).toBeDefined();
    expect(screen.getByText('99%')).toBeDefined();
  });

  it('should completely unmount and return null at 100% completion', () => {
    setupContext(100, []);
    const { container } = render(<CompanyOnboardingWidget />);
    expect(container.firstChild).toBeNull();
  });

  it('should render completed and missing items', () => {
    setupContext(50, [
      { key: 'legalName', label: 'Legal name', completed: true, route: '/test-route' },
      { key: 'email', label: 'Email', completed: false, route: '/test-route-2' },
    ]);
    render(<CompanyOnboardingWidget />);

    expect(screen.getByText('Legal name')).toBeDefined();
    expect(screen.getByText('Email')).toBeDefined();

    // Check if clicking them navigates
    fireEvent.click(screen.getByText('Legal name'));
    expect(mockPush).toHaveBeenCalledWith('/test-route');
  });

  it('should render action button for next recommended action', () => {
    setupContext(
      30,
      [
        { key: 'legalName', label: 'Legal name', completed: true, route: '/test-route' },
        { key: 'tradeName', label: 'Company name', completed: false, route: '/action-route' },
      ],
      'tradeName',
    );
    render(<CompanyOnboardingWidget />);

    const btn = screen.getByText(/Complete Company name/i);
    expect(btn).toBeDefined();

    fireEvent.click(btn);
    expect(mockPush).toHaveBeenCalledWith('/action-route');
  });
});

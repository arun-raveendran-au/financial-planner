import type {
  Profile,
  GlobalSettings,
  PortfolioTimeline,
  YearData,
  InvestmentYearData,
  Investment,
  SIP,
  SWP,
} from '@financial-planner/types';
import { addYears, parseDate } from './utils';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns the effective annual return rate (%) for an investment in a given
 * year offset from startYear. Supports both 'basic' and 'advanced' modes.
 */
export function getAnnualReturnRate(inv: Investment, yearOffset: number): number {
  if (inv.returnType !== 'advanced' || inv.variableReturns.length === 0) {
    return inv.annualReturn;
  }
  const period = inv.variableReturns.find(
    (p) => yearOffset >= p.from && yearOffset <= p.to
  );
  return period?.rate ?? inv.annualReturn;
}

/**
 * Returns the monthly compounding factor for a given annual return %.
 */
export function monthlyGrowthFactor(annualReturnPct: number): number {
  return 1 + annualReturnPct / 100 / 12;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main calculation
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Computes the full portfolio timeline for `profile` over `globalSettings.timelineYears`.
 *
 * Algorithm:
 *  - Simulates month-by-month for each year
 *  - Applies compounding first, then transactions
 *  - Applies goals at year-end
 *  - Tracks per-investment figures (opening, invested, withdrawn, growth, closing)
 *  - Rolls up to portfolio totals
 *  - Applies annual step-up to SIP/SWP amounts after each year
 *
 * Fixed bugs from original:
 *  1. Advanced return rates now applied (getAnnualReturnRate)
 *  2. SWP now uses swp.investmentId consistently (not swp.id)
 *  3. Step-up applied only once per year (not on every year offset calculation)
 */
export function calculatePortfolioTimeline(
  profile: Profile,
  globalSettings: GlobalSettings
): PortfolioTimeline {
  const {
    investments,
    goals,
    rebalancingEvents,
    sips,
    lumpsums,
    swps,
    oneTimeWithdrawals,
  } = profile;
  const { startYear, timelineYears } = globalSettings;
  const errors: string[] = [];

  // Initialise yearly data array
  const yearlyData: YearData[] = Array.from(
    { length: timelineYears + 1 },
    (_, i) => ({
      year: startYear + i,
      opening: 0,
      invested: 0,
      withdrawn: 0,
      growth: 0,
      closing: 0,
      investments: {},
    })
  );

  // Initialise per-investment rows
  investments.forEach((inv) => {
    yearlyData.forEach((y) => {
      y.investments[inv.id] = { closing: 0, invested: 0, withdrawn: 0, growth: 0 };
    });
  });

  // Mutable step-up amounts (start at the configured amount, increase annually)
  const sipAmounts: Record<number, number> = sips.reduce(
    (acc, sip) => ({ ...acc, [sip.id]: sip.amount }),
    {} as Record<number, number>
  );
  const swpAmounts: Record<number, number> = swps.reduce(
    (acc, swp) => ({ ...acc, [swp.id]: swp.amount }),
    {} as Record<number, number>
  );

  for (let y = 0; y <= timelineYears; y++) {
    const currentYear = startYear + y;

    // Carry forward closing balances from previous year
    if (y > 0) {
      investments.forEach((inv) => {
        const prev = yearlyData[y - 1]?.investments[inv.id];
        const current = yearlyData[y]?.investments[inv.id];
        if (prev && current) current.closing = prev.closing;
      });
    }

    // ── Month loop ────────────────────────────────────────────────────────────
    for (let m = 0; m < 12; m++) {
      const currentDate = new Date(currentYear, m, 15);

      investments.forEach((inv) => {
        const invYear = yearlyData[y]?.investments[inv.id];
        if (!invYear) return;

        const rate = getAnnualReturnRate(inv, y);

        // 1. Compound growth
        invYear.closing *= monthlyGrowthFactor(rate);

        // 2. One-time contributions (lumpsum)
        lumpsums
          .filter((l) => l.investmentId === inv.id)
          .forEach((lump) => {
            const d = parseDate(lump.date);
            if (d.getFullYear() === currentYear && d.getMonth() === m) {
              invYear.closing += lump.amount;
            }
          });

        // 3. Recurring contributions (SIP)
        sips
          .filter((s) => s.investmentId === inv.id)
          .forEach((sip) => {
            const start = parseDate(sip.startDate);
            const end = addYears(start, sip.durationYears);
            const isActive = currentDate >= start && currentDate < end;
            const isScheduled =
              sip.frequency === 'Monthly' || m === start.getMonth();
            if (isActive && isScheduled) {
              invYear.closing += sipAmounts[sip.id] ?? sip.amount;
            }
          });

        // 4. One-time withdrawals
        oneTimeWithdrawals
          .filter((l) => l.investmentId === inv.id)
          .forEach((w) => {
            const d = parseDate(w.date);
            if (d.getFullYear() === currentYear && d.getMonth() === m) {
              const amount = Math.min(invYear.closing, w.amount);
              invYear.closing -= amount;
            }
          });

        // 5. Recurring withdrawals (SWP) — BUG FIX: use swp.investmentId not swp.id
        swps
          .filter((s) => s.investmentId === inv.id)
          .forEach((swp) => {
            const start = parseDate(swp.startDate);
            const end = addYears(start, swp.durationYears);
            const isActive = currentDate >= start && currentDate < end;
            const isScheduled =
              swp.frequency === 'Monthly' || m === start.getMonth();
            if (isActive && isScheduled) {
              const amount = Math.min(
                invYear.closing,
                swpAmounts[swp.id] ?? swp.amount
              );
              invYear.closing -= amount;
            }
          });
      });

      // 6. Rebalancing events (transfer between investments)
      rebalancingEvents.forEach((r) => {
        const d = parseDate(r.date);
        if (d.getFullYear() === currentYear && d.getMonth() === m) {
          const fromInv = yearlyData[y]?.investments[r.fromInvestmentId];
          const toInv = yearlyData[y]?.investments[r.toInvestmentId];
          if (fromInv && toInv) {
            const amount = Math.min(fromInv.closing, r.amount);
            fromInv.closing -= amount;
            toInv.closing += amount;
          }
        }
      });
    } // end month loop

    // ── Goal withdrawals at year-end ──────────────────────────────────────────
    goals
      .filter((g) => g.year === currentYear)
      .forEach((goal) => {
        goal.withdrawals.forEach((w) => {
          const invYear = yearlyData[y]?.investments[w.investmentId];
          if (!invYear) return;
          const amount = Math.min(invYear.closing, w.amount);
          invYear.closing -= amount;
        });
      });

    // ── Compute per-investment summary figures ────────────────────────────────
    investments.forEach((inv) => {
      const invYear = yearlyData[y]?.investments[inv.id];
      if (!invYear) return;
      const openingValue =
        y > 0 ? (yearlyData[y - 1]?.investments[inv.id]?.closing ?? 0) : 0;

      // Invested this year
      let investedThisYear = lumpsums
        .filter(
          (l) =>
            l.investmentId === inv.id &&
            parseDate(l.date).getFullYear() === currentYear
        )
        .reduce((s, l) => s + l.amount, 0);

      sips
        .filter(
          (s) =>
            s.investmentId === inv.id &&
            parseDate(s.startDate).getFullYear() <= currentYear
        )
        .forEach((sip) => {
          const start = parseDate(sip.startDate);
          const end = addYears(start, sip.durationYears);
          if (
            currentYear >= start.getFullYear() &&
            currentYear < end.getFullYear()
          ) {
            investedThisYear +=
              (sipAmounts[sip.id] ?? sip.amount) *
              (sip.frequency === 'Monthly' ? 12 : 1);
          }
        });

      // Withdrawn this year
      let withdrawnThisYear = oneTimeWithdrawals
        .filter(
          (l) =>
            l.investmentId === inv.id &&
            parseDate(l.date).getFullYear() === currentYear
        )
        .reduce((s, l) => s + l.amount, 0);

      // Add goal withdrawals
      goals
        .filter((g) => g.year === currentYear)
        .flatMap((g) => g.withdrawals)
        .filter((w) => w.investmentId === inv.id)
        .forEach((w) => {
          withdrawnThisYear += w.amount;
        });

      swps
        .filter(
          (s) =>
            s.investmentId === inv.id &&
            parseDate(s.startDate).getFullYear() <= currentYear
        )
        .forEach((swp) => {
          const start = parseDate(swp.startDate);
          const end = addYears(start, swp.durationYears);
          if (
            currentYear >= start.getFullYear() &&
            currentYear < end.getFullYear()
          ) {
            withdrawnThisYear +=
              (swpAmounts[swp.id] ?? swp.amount) *
              (swp.frequency === 'Monthly' ? 12 : 1);
          }
        });

      invYear.invested = investedThisYear;
      invYear.withdrawn = withdrawnThisYear;
      invYear.growth =
        invYear.closing - openingValue - investedThisYear + withdrawnThisYear;

      if (invYear.closing < -1) {
        // Allow tiny floating point negatives
        errors.push(
          `Insufficient funds in '${inv.name}' in year ${currentYear}.`
        );
        invYear.closing = 0;
      }
    });

    // ── Roll up to portfolio totals ───────────────────────────────────────────
    const yearRow = yearlyData[y];
    if (!yearRow) continue;

    yearRow.closing = 0;
    yearRow.invested = 0;
    yearRow.withdrawn = 0;
    yearRow.growth = 0;

    Object.values(yearRow.investments).forEach((d: InvestmentYearData) => {
      yearRow.closing += d.closing;
      yearRow.invested += d.invested;
      yearRow.withdrawn += d.withdrawn;
      yearRow.growth += d.growth;
    });

    if (y > 0) {
      yearRow.opening = yearlyData[y - 1]?.closing ?? 0;
    }

    // ── Annual step-up for SIPs and SWPs ─────────────────────────────────────
    sips.forEach((sip: SIP) => {
      const start = parseDate(sip.startDate);
      if (currentYear >= start.getFullYear() && sip.stepUpPercent > 0) {
        sipAmounts[sip.id] =
          (sipAmounts[sip.id] ?? sip.amount) * (1 + sip.stepUpPercent / 100);
      }
    });

    swps.forEach((swp: SWP) => {
      const start = parseDate(swp.startDate);
      if (currentYear >= start.getFullYear() && swp.stepUpPercent > 0) {
        swpAmounts[swp.id] =
          (swpAmounts[swp.id] ?? swp.amount) * (1 + swp.stepUpPercent / 100);
      }
    });
  } // end year loop

  return { yearlyData, errors };
}

// ─────────────────────────────────────────────────────────────────────────────
// Diversification helper
// ─────────────────────────────────────────────────────────────────────────────

export interface AllocationEntry {
  name: string;
  value: number;
  percentage: number;
}

/**
 * Returns asset-class allocation for a specific yearData entry.
 */
export function getAllocationByAssetClass(
  investments: Investment[],
  yearData: YearData
): AllocationEntry[] {
  const byClass: Record<string, number> = {};

  investments.forEach((inv) => {
    const assetClass = inv.assetClass || 'Unclassified';
    const value = yearData.investments[inv.id]?.closing ?? 0;
    byClass[assetClass] = (byClass[assetClass] ?? 0) + value;
  });

  const total = Object.values(byClass).reduce((s, v) => s + v, 0);
  if (total === 0) return [];

  return Object.entries(byClass).map(([name, value]) => ({
    name,
    value,
    percentage: (value / total) * 100,
  }));
}

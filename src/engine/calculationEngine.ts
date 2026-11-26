import {
  BazaarExpense,
  DailyMealRecord,
  Deposit,
  FinalOrderSummary,
  MealAttendanceEntry,
  MealBookingEntry,
  Member,
  MemberSettlement,
  MessSummary,
  SharedBill,
  UtilityBill,
  createDefaultBooking,
  getSharedBillMemberPaid,
  getSharedBillMemberShare,
  getSharedBillTotalCollected,
  getSharedBillOutstandingBalance,
} from '../types/mess';
import { DhakaTimeHelper } from '../utils/dhakaTime';

export const MessCalculationEngine = {
  roundTwoDecimals(value: number): number {
    return Math.round(value * 100) / 100;
  },

  calculateBookingUnits(params: {
    date: string;
    isFriday: boolean;
    lunchServiceStatus: string;
    nightServiceStatus: string;
    lunchDeadline: string;
    nightDeadline: string;
    booking: MealBookingEntry;
    lunchFinalOrder?: FinalOrderSummary | null;
    nightFinalOrder?: FinalOrderSummary | null;
  }): [number, number] {
    const {
      date,
      isFriday,
      lunchServiceStatus,
      nightServiceStatus,
      lunchDeadline,
      nightDeadline,
      booking,
      lunchFinalOrder,
      nightFinalOrder,
    } = params;

    const lunchActive = lunchServiceStatus !== 'CANCELLED';
    const nightActive = isFriday ? false : nightServiceStatus !== 'CANCELLED';

    const totalServedMeals = (lunchActive ? 1 : 0) + (nightActive ? 1 : 0);
    if (totalServedMeals === 0) return [0, 0];

    const isLunchLocked =
      DhakaTimeHelper.isDeadlinePassed(date, lunchDeadline) ||
      lunchFinalOrder?.isLocked === true;
    const isNightLocked = isFriday
      ? true
      : DhakaTimeHelper.isDeadlinePassed(date, nightDeadline) ||
        nightFinalOrder?.isLocked === true;

    const confirmedLunch =
      lunchActive && isLunchLocked && booking.statusLunch === 'BOOKED';
    const confirmedNight =
      nightActive && isNightLocked && booking.statusNight === 'BOOKED';

    const computePersonUnits = (hasL: boolean, hasN: boolean): number => {
      if (totalServedMeals === 2) {
        if (hasL && hasN) return 2.0;
        if (hasL && !hasN) return 1.5;
        if (!hasL && hasN) return 1.0;
        return 0.0;
      }
      if (totalServedMeals === 1) {
        const hasServed = (lunchActive && hasL) || (nightActive && hasN);
        return hasServed ? 1.0 : 0.0;
      }
      return 0.0;
    };

    const memberUnits = computePersonUnits(confirmedLunch, confirmedNight);

    const confirmedGuestLunch =
      lunchActive && isLunchLocked ? Math.max(0, booking.guestLunch) : 0;
    const confirmedGuestNight =
      nightActive && isNightLocked ? Math.max(0, booking.guestNight) : 0;

    const guestsBoth = Math.min(confirmedGuestLunch, confirmedGuestNight);
    const guestsOnlyLunch = confirmedGuestLunch - guestsBoth;
    const guestsOnlyNight = confirmedGuestNight - guestsBoth;

    const guestUnits =
      guestsBoth * computePersonUnits(true, true) +
      guestsOnlyLunch * computePersonUnits(true, false) +
      guestsOnlyNight * computePersonUnits(false, true);

    return [
      this.roundTwoDecimals(memberUnits),
      this.roundTwoDecimals(guestUnits),
    ];
  },

  calculateAttendanceUnitsDetailed(params: {
    isFriday: boolean;
    lunchServiceStatus: string;
    nightServiceStatus: string;
    attendance: MealAttendanceEntry;
  }): [number, number] {
    const { isFriday, lunchServiceStatus, nightServiceStatus, attendance } = params;
    const lunchActive = lunchServiceStatus === 'ACTIVE';
    const nightActive = isFriday ? false : nightServiceStatus === 'ACTIVE';
    const totalServedMeals = (lunchActive ? 1 : 0) + (nightActive ? 1 : 0);

    const computePersonUnits = (ateLunch: boolean, ateNight: boolean): number => {
      if (totalServedMeals === 2) {
        if (ateLunch && ateNight) return 2.0;
        if (ateLunch && !ateNight) return 1.5;
        if (!ateLunch && ateNight) return 1.0;
        return 0.0;
      }
      if (totalServedMeals === 1) {
        const ateServed = (lunchActive && ateLunch) || (nightActive && ateNight);
        return ateServed ? 1.0 : 0.0;
      }
      return 0.0;
    };

    const memberUnits = computePersonUnits(
      attendance.attendedLunch,
      attendance.attendedNight,
    );

    const guestsBoth = Math.min(
      attendance.guestLunchAttended,
      attendance.guestNightAttended,
    );
    const guestsOnlyLunch = attendance.guestLunchAttended - guestsBoth;
    const guestsOnlyNight = attendance.guestNightAttended - guestsBoth;

    const guestUnits =
      guestsBoth * computePersonUnits(true, true) +
      guestsOnlyLunch * computePersonUnits(true, false) +
      guestsOnlyNight * computePersonUnits(false, true);

    return [
      this.roundTwoDecimals(memberUnits),
      this.roundTwoDecimals(guestUnits),
    ];
  },

  calculateAttendanceUnits(params: {
    isFriday: boolean;
    lunchServiceStatus: string;
    nightServiceStatus: string;
    attendance: MealAttendanceEntry;
  }): number {
    const [mUnits, gUnits] = this.calculateAttendanceUnitsDetailed(params);
    return this.roundTwoDecimals(mUnits + gUnits);
  },

  resolveEffectiveBooking(
    member: Member,
    explicitBooking: MealBookingEntry | undefined | null,
    date: string,
    isFriday: boolean,
  ): MealBookingEntry {
    const base = explicitBooking ?? createDefaultBooking();
    if (!member.autoBookEnabled || !member.isActive) return base;
    if (member.autoBookUpdatedAt && date < member.autoBookUpdatedAt) return base;

    const lunchNeedsAuto = base.statusLunch === 'NO_RESPONSE';
    const nightNeedsAuto = !isFriday && base.statusNight === 'NO_RESPONSE';
    if (!lunchNeedsAuto && !nightNeedsAuto) return base;

    const effectiveLunch = lunchNeedsAuto
      ? member.autoBookLunch
        ? 'BOOKED'
        : 'CANCELLED'
      : base.statusLunch;

    const effectiveNight = isFriday
      ? 'CANCELLED'
      : nightNeedsAuto
        ? member.autoBookNight
          ? 'BOOKED'
          : 'CANCELLED'
        : base.statusNight;

    return {
      ...base,
      statusLunch: effectiveLunch,
      statusNight: effectiveNight,
      autoBooked: base.autoBooked || lunchNeedsAuto || nightNeedsAuto,
    };
  },

  calculateDayTotalUnits(params: {
    record: DailyMealRecord;
    members: Member[];
    lunchDeadline?: string;
    nightDeadline?: string;
  }): number {
    const {
      record,
      members,
      lunchDeadline = '09:00',
      nightDeadline = '17:00',
    } = params;
    const isFriday = record.isFriday || DhakaTimeHelper.isFriday(record.date);

    const attendances = Object.values(record.attendances);
    if (attendances.length > 0) {
      const sum = attendances.reduce(
        (acc, attendance) =>
          acc +
          this.calculateAttendanceUnits({
            isFriday,
            lunchServiceStatus: record.lunchServiceStatus,
            nightServiceStatus: record.nightServiceStatus,
            attendance,
          }),
        0,
      );
      return this.roundTwoDecimals(sum);
    }

    let total = 0;
    for (const member of members) {
      const booking = this.resolveEffectiveBooking(
        member,
        record.bookings[member.id],
        record.date,
        isFriday,
      );
      const [mUnits, gUnits] = this.calculateBookingUnits({
        date: record.date,
        isFriday,
        lunchServiceStatus: record.lunchServiceStatus,
        nightServiceStatus: record.nightServiceStatus,
        lunchDeadline,
        nightDeadline,
        booking,
        lunchFinalOrder: record.lunchFinalOrder,
        nightFinalOrder: record.nightFinalOrder,
      });
      total += mUnits + gUnits;
    }
    return this.roundTwoDecimals(total);
  },

  calculateSummary(params: {
    members: Member[];
    dailyMeals: DailyMealRecord[];
    bazaarExpenses: BazaarExpense[];
    deposits: Deposit[];
    utilityBills: UtilityBill[];
    sharedBills?: SharedBill[];
    lunchDeadline?: string;
    nightDeadline?: string;
  }): MessSummary {
    const {
      members,
      dailyMeals,
      bazaarExpenses,
      deposits,
      utilityBills,
      sharedBills = [],
      lunchDeadline = '09:00',
      nightDeadline = '17:00',
    } = params;

    const activeMembers = members.filter((m) => m.isActive);
    const memberCount = activeMembers.length > 0 ? activeMembers.length : 1;

    // 1. Total Bazaar Cost (strictly grocery expenses - isolated from shared bills)
    const totalBazaarCost = bazaarExpenses.reduce(
      (sum, e) => sum + (e.amount || 0),
      0,
    );

    // 2. Total units per member & total mess units
    const memberUnitsMap: Record<string, number> = {};
    const memberOnlyUnitsMap: Record<string, number> = {};
    const guestOnlyUnitsMap: Record<string, number> = {};

    for (const member of members) {
      memberUnitsMap[member.id] = 0;
      memberOnlyUnitsMap[member.id] = 0;
      guestOnlyUnitsMap[member.id] = 0;
    }

    let totalMessUnits = 0;

    for (const record of dailyMeals) {
      const isFriday = record.isFriday || DhakaTimeHelper.isFriday(record.date);
      const attendanceEntries = Object.entries(record.attendances);

      if (attendanceEntries.length > 0) {
        for (const [memberId, attendance] of attendanceEntries) {
          const [mUnits, gUnits] = this.calculateAttendanceUnitsDetailed({
            isFriday,
            lunchServiceStatus: record.lunchServiceStatus,
            nightServiceStatus: record.nightServiceStatus,
            attendance,
          });
          const dayTotal = mUnits + gUnits;
          memberUnitsMap[memberId] = (memberUnitsMap[memberId] ?? 0) + dayTotal;
          memberOnlyUnitsMap[memberId] = (memberOnlyUnitsMap[memberId] ?? 0) + mUnits;
          guestOnlyUnitsMap[memberId] = (guestOnlyUnitsMap[memberId] ?? 0) + gUnits;
          totalMessUnits += dayTotal;
        }
      } else if (
        Object.keys(record.bookings).length > 0 ||
        members.some(
          (m) =>
            m.autoBookEnabled &&
            m.isActive &&
            (!m.autoBookUpdatedAt || record.date >= m.autoBookUpdatedAt),
        )
      ) {
        for (const member of members) {
          const booking = this.resolveEffectiveBooking(
            member,
            record.bookings[member.id],
            record.date,
            isFriday,
          );
          const [mUnits, gUnits] = this.calculateBookingUnits({
            date: record.date,
            isFriday,
            lunchServiceStatus: record.lunchServiceStatus,
            nightServiceStatus: record.nightServiceStatus,
            lunchDeadline,
            nightDeadline,
            booking,
            lunchFinalOrder: record.lunchFinalOrder,
            nightFinalOrder: record.nightFinalOrder,
          });
          const dayTotal = mUnits + gUnits;
          memberUnitsMap[member.id] = (memberUnitsMap[member.id] ?? 0) + dayTotal;
          memberOnlyUnitsMap[member.id] = (memberOnlyUnitsMap[member.id] ?? 0) + mUnits;
          guestOnlyUnitsMap[member.id] = (guestOnlyUnitsMap[member.id] ?? 0) + gUnits;
          totalMessUnits += dayTotal;
        }
      }
    }

    // 3. Meal Rate
    const mealRate = totalMessUnits > 0 ? totalBazaarCost / totalMessUnits : 0;

    // 4. Legacy Utilities split equally
    const totalUtilities = utilityBills.reduce((sum, u) => sum + (u.amount || 0), 0);
    const perHeadUtility = memberCount > 0 ? totalUtilities / memberCount : 0;

    // 5. Shared Bills totals
    const totalSharedBills = sharedBills.reduce(
      (sum, b) => sum + (b.totalAmount || 0),
      0,
    );
    const totalSharedBillsCollected = sharedBills.reduce(
      (sum, b) => sum + getSharedBillTotalCollected(b),
      0,
    );
    const totalSharedBillsUnpaid = sharedBills.reduce(
      (sum, b) => sum + getSharedBillOutstandingBalance(b),
      0,
    );

    // 6. Total deposits per member
    const memberDepositsMap: Record<string, number> = {};
    let totalDeposits = 0;
    for (const deposit of deposits) {
      memberDepositsMap[deposit.memberId] =
        (memberDepositsMap[deposit.memberId] ?? 0) + (deposit.amount || 0);
      totalDeposits += deposit.amount || 0;
    }

    // 7. Build individual member settlements
    const memberSettlements: MemberSettlement[] = members.map((member) => {
      const totalUnits = memberUnitsMap[member.id] ?? 0;
      const mUnits = memberOnlyUnitsMap[member.id] ?? totalUnits;
      const gUnits = guestOnlyUnitsMap[member.id] ?? 0;
      const mealCost = totalUnits * mealRate;
      const utilityShare = member.isActive ? perHeadUtility : 0;

      const memberSharedBillsShare = sharedBills.reduce(
        (sum, bill) => sum + getSharedBillMemberShare(bill, member.id),
        0,
      );
      const memberSharedBillsPaid = sharedBills.reduce(
        (sum, bill) => sum + getSharedBillMemberPaid(bill, member.id),
        0,
      );
      const memberSharedBillsUnpaid = Math.max(
        0,
        memberSharedBillsShare - memberSharedBillsPaid,
      );

      const totalCost = mealCost + utilityShare + memberSharedBillsUnpaid;
      const deposit = memberDepositsMap[member.id] ?? 0;
      const netBalance = deposit - totalCost;
      const roundedBalance = this.roundTwoDecimals(netBalance);

      return {
        memberId: member.id,
        memberName: member.displayName.trim() || 'Member',
        totalUnits: this.roundTwoDecimals(totalUnits),
        memberUnits: this.roundTwoDecimals(mUnits),
        guestUnits: this.roundTwoDecimals(gUnits),
        mealCost: this.roundTwoDecimals(mealCost),
        utilityCost: this.roundTwoDecimals(utilityShare),
        sharedBillsUnpaid: this.roundTwoDecimals(memberSharedBillsUnpaid),
        sharedBillsPaid: this.roundTwoDecimals(memberSharedBillsPaid),
        sharedBillsTotalShare: this.roundTwoDecimals(
          memberSharedBillsUnpaid + memberSharedBillsPaid,
        ),
        totalCost: this.roundTwoDecimals(totalCost),
        totalDeposit: this.roundTwoDecimals(deposit),
        netBalance: roundedBalance,
        isRefund: roundedBalance >= 0,
      };
    });

    const remainingFund = totalDeposits - totalBazaarCost - totalUtilities;

    return {
      totalUnits: this.roundTwoDecimals(totalMessUnits),
      totalBazaarCost: this.roundTwoDecimals(totalBazaarCost),
      mealRate: this.roundTwoDecimals(mealRate),
      totalDeposits: this.roundTwoDecimals(totalDeposits),
      totalUtilities: this.roundTwoDecimals(totalUtilities),
      totalSharedBills: this.roundTwoDecimals(totalSharedBills),
      totalSharedBillsCollected: this.roundTwoDecimals(totalSharedBillsCollected),
      totalSharedBillsUnpaid: this.roundTwoDecimals(totalSharedBillsUnpaid),
      remainingFund: this.roundTwoDecimals(remainingFund),
      memberSettlements,
    };
  },
};

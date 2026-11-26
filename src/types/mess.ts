export enum Screen {
  DASHBOARD = 'DASHBOARD',
  DAILY_MEALS = 'DAILY_MEALS',
  BAZAAR_LOG = 'BAZAAR_LOG',
  SHARED_BILLS = 'SHARED_BILLS',
  DEPOSITS = 'DEPOSITS',
  SETTLEMENT = 'SETTLEMENT',
  MESS_SELECT = 'MESS_SELECT',
}

export enum BillAllocationType {
  FIXED_PER_MEMBER = 'FIXED_PER_MEMBER',
  DIVIDED_EQUALLY = 'DIVIDED_EQUALLY',
  CUSTOM_PER_MEMBER = 'CUSTOM_PER_MEMBER',
}

export enum BillPaymentStatus {
  UNPAID = 'UNPAID',
  PARTIALLY_PAID = 'PARTIALLY_PAID',
  PAID = 'PAID',
}

export type BookingStatus = 'NO_RESPONSE' | 'BOOKED' | 'CANCELLED';
export type ServiceStatus = 'ACTIVE' | 'CANCELLED';
export type MemberRole = 'MANAGER' | 'MEMBER';

export interface UserProfile {
  id: string;
  displayName: string;
  email: string;
  currentMessId: string;
  createdAt?: number;
  updatedAt?: number;
}

export interface Mess {
  id: string;
  name: string;
  managerUid: string;
  adminUids: string[];
  memberUids: string[];
  activeMonth: string; // e.g. "2026-11"
  lunchBookingDeadline: string; // HH:mm (24-hr) in Asia/Dhaka
  nightBookingDeadline: string; // HH:mm (24-hr) in Asia/Dhaka
  createdAt?: number;
  updatedAt?: number;
}

export function isUserMessManager(mess: Mess | null | undefined, userId: string): boolean {
  if (!mess || !userId) return false;
  return mess.managerUid === userId || mess.adminUids.includes(userId);
}

export interface Member {
  id: string;
  userId: string;
  displayName: string;
  room: string;
  role: MemberRole;
  isActive: boolean;
  autoBookEnabled: boolean;
  autoBookLunch: boolean;
  autoBookNight: boolean;
  autoBookUpdatedAt: string; // YYYY-MM-DD (Asia/Dhaka)
  createdAt?: number;
}

export interface MealBookingEntry {
  statusLunch: BookingStatus;
  statusNight: BookingStatus;
  guestLunch: number;
  guestNight: number;
  updatedBy: string;
  managerOverrideReason: string;
  autoBooked: boolean;
}

export function createDefaultBooking(): MealBookingEntry {
  return {
    statusLunch: 'NO_RESPONSE',
    statusNight: 'NO_RESPONSE',
    guestLunch: 0,
    guestNight: 0,
    updatedBy: '',
    managerOverrideReason: '',
    autoBooked: false,
  };
}

export interface MealAttendanceEntry {
  attendedLunch: boolean;
  attendedNight: boolean;
  guestLunchAttended: number;
  guestNightAttended: number;
  calculatedUnits: number;
}

export interface FinalOrderSummary {
  mealType: 'LUNCH' | 'NIGHT';
  date: string;
  totalPortions: number;
  memberCount: number;
  guestCount: number;
  deadline: string;
  isLocked: boolean;
  lockedAtDhakaTime: string;
  savedAt?: number;
}

export interface DailyMealRecord {
  id: string; // date format YYYY-MM-DD
  date: string;
  isFriday: boolean;
  lunchServiceStatus: ServiceStatus;
  nightServiceStatus: ServiceStatus;
  cancellationReason: string;
  bookings: Record<string, MealBookingEntry>;
  attendances: Record<string, MealAttendanceEntry>;
  lunchFinalOrder?: FinalOrderSummary | null;
  nightFinalOrder?: FinalOrderSummary | null;
  totalDayUnits: number;
  totalDayMeals?: number;
  updatedBy: string;
  updatedAt?: number;
}

export interface AuditLog {
  id: string;
  action: string;
  performedByUid: string;
  performedByName: string;
  targetMemberId: string;
  targetMemberName: string;
  details: string;
  reason: string;
  timestamp: number;
  timestampFormatted: string;
}

export interface BazaarExpense {
  id: string;
  buyerMemberId: string;
  buyerName: string;
  amount: number;
  itemsDescription: string;
  category: string; // Groceries, Meat & Fish, Vegetables, Spices, Misc
  date: string; // YYYY-MM-DD
  createdAt?: number;
}

export interface Deposit {
  id: string;
  memberId: string;
  memberName: string;
  amount: number;
  date: string; // YYYY-MM-DD
  paymentMethod: string; // Cash, bKash / Mobile, Bank Transfer, UPI
  notes: string;
  recordedBy: string;
  createdAt?: number;
}

export interface UtilityBill {
  id: string;
  title: string;
  amount: number;
  month: string;
  createdAt?: number;
}

export interface BillPaymentRecord {
  memberId: string;
  memberName: string;
  amountPaid: number;
  status: BillPaymentStatus;
  paymentDate: string;
  paymentMethod: string;
  notes: string;
  recordedByUid: string;
  recordedByName: string;
  updatedAt?: number;
}

export interface SharedBill {
  id: string;
  title: string;
  allocationType: BillAllocationType;
  totalAmount: number;
  perMemberAmount: number;
  month: string;
  deadline: string;
  notes: string;
  assignedMemberIds: string[];
  memberShares: Record<string, number>;
  memberNames: Record<string, string>;
  payments: Record<string, BillPaymentRecord>;
  createdByUid: string;
  createdByName: string;
  createdAt?: number;
  updatedAt?: number;
}

export interface InAppNotification {
  id: string;
  messId: string;
  targetMemberId: string;
  targetMemberName: string;
  title: string;
  message: string;
  billId: string;
  amount: number;
  deadline: string;
  isRead: boolean;
  createdAt: number;
  timestampFormatted: string;
}

export interface MemberSettlement {
  memberId: string;
  memberName: string;
  totalUnits: number;
  memberUnits: number;
  guestUnits: number;
  mealCost: number;
  utilityCost: number;
  sharedBillsUnpaid: number;
  sharedBillsPaid: number;
  sharedBillsTotalShare: number;
  totalCost: number;
  totalDeposit: number;
  netBalance: number;
  isRefund: boolean;
}

export interface MessSummary {
  totalUnits: number;
  totalBazaarCost: number;
  mealRate: number;
  totalDeposits: number;
  totalUtilities: number;
  totalSharedBills: number;
  totalSharedBillsCollected: number;
  totalSharedBillsUnpaid: number;
  remainingFund: number;
  memberSettlements: MemberSettlement[];
}

export interface KitchenOrderSummary {
  lunchTotalPortions: number;
  lunchMemberCount: number;
  lunchGuestCount: number;
  nightTotalPortions: number;
  nightMemberCount: number;
  nightGuestCount: number;
  attendedLunchCount: number;
  attendedNightCount: number;
  lunchActive: boolean;
  nightActive: boolean;
  isFriday: boolean;
  cancellationReason: string;
  isLunchLocked: boolean;
  isNightLocked: boolean;
  lunchFinalOrder?: FinalOrderSummary | null;
  nightFinalOrder?: FinalOrderSummary | null;
}

// Helper methods mirroring SharedBill methods in MessModels.kt
export function getSharedBillTotalCollected(bill: SharedBill): number {
  return Object.values(bill.payments).reduce((acc, p) => acc + (p.amountPaid || 0), 0);
}

export function getSharedBillOutstandingBalance(bill: SharedBill): number {
  return Math.max(0, bill.totalAmount - getSharedBillTotalCollected(bill));
}

export function getSharedBillMemberShare(bill: SharedBill, memberId: string): number {
  if (bill.assignedMemberIds.length > 0 && !bill.assignedMemberIds.includes(memberId)) {
    return 0;
  }
  return bill.memberShares[memberId] ?? bill.perMemberAmount;
}

export function getSharedBillMemberPaid(bill: SharedBill, memberId: string): number {
  return bill.payments[memberId]?.amountPaid ?? 0;
}

export function getSharedBillMemberDue(bill: SharedBill, memberId: string): number {
  const share = getSharedBillMemberShare(bill, memberId);
  const paid = getSharedBillMemberPaid(bill, memberId);
  return Math.max(0, share - paid);
}

export function getSharedBillMemberStatus(bill: SharedBill, memberId: string): BillPaymentStatus {
  const share = getSharedBillMemberShare(bill, memberId);
  const paid = getSharedBillMemberPaid(bill, memberId);
  if (share <= 0) return BillPaymentStatus.PAID;
  if (paid >= share && share > 0) return BillPaymentStatus.PAID;
  if (paid > 0) return BillPaymentStatus.PARTIALLY_PAID;
  return BillPaymentStatus.UNPAID;
}

export function getSharedBillStatusCounts(bill: SharedBill): {
  paid: number;
  partial: number;
  unpaid: number;
} {
  let paid = 0;
  let partial = 0;
  let unpaid = 0;
  for (const id of bill.assignedMemberIds) {
    const share = bill.memberShares[id] ?? bill.perMemberAmount;
    const paidAmt = bill.payments[id]?.amountPaid ?? 0;
    if (paidAmt >= share && share > 0) {
      paid++;
    } else if (paidAmt > 0 && paidAmt < share) {
      partial++;
    } else if (paidAmt === 0) {
      unpaid++;
    }
  }
  return { paid, partial, unpaid };
}

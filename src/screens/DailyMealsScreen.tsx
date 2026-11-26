import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Calendar,
  Check,
  ChefHat,
  ChevronLeft,
  ChevronRight,
  Clock,
  Lock,
  Minus,
  Plus,
  Settings,
  ShieldAlert,
  Sparkles,
  Utensils,
} from 'lucide-react';
import { Modal } from '../components/Modal';
import { useMess } from '../context/MessContext';
import { MessCalculationEngine } from '../engine/calculationEngine';
import {
  DailyMealRecord,
  Member,
  ServiceStatus,
  createDefaultBooking,
} from '../types/mess';
import { DhakaTimeHelper, formatUnits } from '../utils/dhakaTime';

export const DailyMealsScreen: React.FC = () => {
  const {
    currentMess,
    currentUserId,
    isManager,
    members,
    dailyMeals,
    kitchenSummary,
    todayDhakaDate,
    selectedDate,
    setSelectedDate,
    configureDeadlines,
    updateMealServiceStatus,
    saveMyBooking,
    setAutoBooking,
    managerOverrideBooking,
    saveFinalOrderSummary,
  } = useMess();

  const [activeTab, setActiveTab] = useState<'MY_BOOKING' | 'KITCHEN' | 'ATTENDANCE'>('MY_BOOKING');
  const [showDeadlineModal, setShowDeadlineModal] = useState(false);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [overrideTarget, setOverrideTarget] = useState<Member | null>(null);

  const currentMember = members.find((m) => m.userId === currentUserId);
  const myMemberId = currentMember?.id || currentUserId;
  const record = dailyMeals.find((r) => r.id === selectedDate || r.date === selectedDate);
  const isFriday = record?.isFriday ?? DhakaTimeHelper.isFriday(selectedDate);
  const hasHistoricalAttendance = Boolean(record && Object.keys(record.attendances).length > 0);

  const lunchDeadline = currentMess?.lunchBookingDeadline ?? '09:00';
  const nightDeadline = currentMess?.nightBookingDeadline ?? '17:00';

  const effectiveTab =
    activeTab === 'ATTENDANCE' && !hasHistoricalAttendance ? 'MY_BOOKING' : activeTab;

  return (
    <div className="mx-auto max-w-5xl space-y-5 p-4 md:p-6">
      {/* Header & Manager Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-on-surface">
            Daily Meal &amp; Booking System
          </h1>
          <p className="text-xs text-on-surface-variant">
            Weighting: Full Day = 2.0 · Lunch Only = 1.5 · Night Only = 1.0 · Friday = 1.0
          </p>
        </div>

        {isManager && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setShowDeadlineModal(true)}
              className="inline-flex items-center gap-1.5 rounded-2xl border border-outline-variant bg-surface px-3.5 py-2 text-xs font-bold text-on-surface transition-colors hover:bg-surface-low"
            >
              <Clock className="h-4 w-4 text-primary" />
              <span>Cutoffs</span>
            </button>
            <button
              type="button"
              onClick={() => setShowServiceModal(true)}
              className="inline-flex items-center gap-1.5 rounded-2xl bg-primary-container px-3.5 py-2 text-xs font-bold text-on-primary-container transition-opacity hover:opacity-90"
            >
              <Settings className="h-4 w-4" />
              <span>Service Status</span>
            </button>
          </div>
        )}
      </div>

      {/* Date Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-outline-variant/80 bg-surface px-4 py-3 shadow-xs">
        <button
          type="button"
          onClick={() => setSelectedDate(DhakaTimeHelper.shiftDate(selectedDate, -1))}
          className="inline-flex items-center gap-1 rounded-xl border border-outline-variant bg-surface-low px-3 py-1.5 text-xs font-bold text-on-surface hover:border-primary"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>Prev</span>
        </button>

        <div className="flex items-center gap-2 text-center">
          <Calendar className="h-4 w-4 text-primary" />
          <span className="text-sm font-extrabold text-on-surface">
            {DhakaTimeHelper.formatReadableDate(selectedDate)}
          </span>
          {isFriday && (
            <span className="rounded-lg bg-tertiary-container px-2 py-0.5 text-[11px] font-bold text-on-tertiary-container">
              Fri
            </span>
          )}
          {selectedDate !== todayDhakaDate && (
            <button
              type="button"
              onClick={() => setSelectedDate(todayDhakaDate)}
              className="rounded-lg bg-primary-container px-2 py-0.5 text-[11px] font-bold text-on-primary-container hover:opacity-90"
            >
              Today
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={() => setSelectedDate(DhakaTimeHelper.shiftDate(selectedDate, 1))}
          className="inline-flex items-center gap-1 rounded-xl border border-outline-variant bg-surface-low px-3 py-1.5 text-xs font-bold text-on-surface hover:border-primary"
        >
          <span>Next</span>
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Cancellation Banner if any service off */}
      {(!kitchenSummary.lunchActive || (!isFriday && !kitchenSummary.nightActive)) && (
        <div className="flex items-start gap-3 rounded-2xl border border-error/40 bg-error-container/35 px-4 py-3 text-xs text-on-error-container">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-error" />
          <div>
            <p className="font-bold">
              Service Update:{' '}
              {!kitchenSummary.lunchActive && !kitchenSummary.nightActive
                ? 'Both Lunch and Night meals cancelled'
                : !kitchenSummary.lunchActive
                  ? 'Lunch cancelled'
                  : 'Night dinner cancelled'}
            </p>
            {kitchenSummary.cancellationReason && (
              <p className="mt-0.5 opacity-90">Reason: {kitchenSummary.cancellationReason}</p>
            )}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-outline-variant/60 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('MY_BOOKING')}
          className={`rounded-xl px-4 py-2 text-xs font-bold transition-colors ${
            effectiveTab === 'MY_BOOKING'
              ? 'bg-primary text-on-primary'
              : 'bg-surface-low text-on-surface-variant hover:text-on-surface'
          }`}
        >
          My Booking
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('KITCHEN')}
          className={`rounded-xl px-4 py-2 text-xs font-bold transition-colors ${
            effectiveTab === 'KITCHEN'
              ? 'bg-primary text-on-primary'
              : 'bg-surface-low text-on-surface-variant hover:text-on-surface'
          }`}
        >
          Kitchen &amp; Bookings
        </button>
        {hasHistoricalAttendance && (
          <button
            type="button"
            onClick={() => setActiveTab('ATTENDANCE')}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition-colors ${
              effectiveTab === 'ATTENDANCE'
                ? 'bg-primary text-on-primary'
                : 'bg-surface-low text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Historical Attendance
          </button>
        )}
      </div>

      {/* Tab Content */}
      {effectiveTab === 'MY_BOOKING' && (
        <MyBookingTab
          key={`${selectedDate}-${myMemberId}-${record?.updatedAt ?? 0}`}
          selectedDate={selectedDate}
          isFriday={isFriday}
          currentMember={currentMember}
          record={record}
          lunchDeadline={lunchDeadline}
          nightDeadline={nightDeadline}
          lunchActive={kitchenSummary.lunchActive}
          nightActive={kitchenSummary.nightActive}
          isLunchLocked={kitchenSummary.isLunchLocked}
          isNightLocked={kitchenSummary.isNightLocked}
          onSave={saveMyBooking}
          onToggleAutoBook={setAutoBooking}
        />
      )}

      {effectiveTab === 'KITCHEN' && (
        <KitchenOrdersTab
          selectedDate={selectedDate}
          isFriday={isFriday}
          isManager={isManager}
          members={members}
          record={record}
          kitchenSummary={kitchenSummary}
          lunchDeadline={lunchDeadline}
          nightDeadline={nightDeadline}
          onLockFinalOrder={saveFinalOrderSummary}
          onOpenOverride={(m) => setOverrideTarget(m)}
        />
      )}

      {effectiveTab === 'ATTENDANCE' && record && (
        <HistoricalAttendanceTab record={record} members={members} isFriday={isFriday} />
      )}

      {/* Deadline Modal */}
      {showDeadlineModal && (
        <ConfigureDeadlineModal
          open={true}
          onClose={() => setShowDeadlineModal(false)}
          lunchDeadline={lunchDeadline}
          nightDeadline={nightDeadline}
          onSave={(l, n) => {
            configureDeadlines(l, n);
            setShowDeadlineModal(false);
          }}
        />
      )}

      {/* Service Status Modal */}
      {showServiceModal && (
        <ServiceStatusModal
          open={true}
          onClose={() => setShowServiceModal(false)}
          selectedDate={selectedDate}
          isFriday={isFriday}
          initialLunch={record?.lunchServiceStatus ?? 'ACTIVE'}
          initialNight={record?.nightServiceStatus ?? (isFriday ? 'CANCELLED' : 'ACTIVE')}
          initialReason={record?.cancellationReason ?? ''}
          onSave={(l, n, r) => {
            updateMealServiceStatus(selectedDate, l, n, r);
            setShowServiceModal(false);
          }}
        />
      )}

      {/* Manager Override Modal */}
      {overrideTarget && (
        <ManagerOverrideModal
          open={true}
          onClose={() => setOverrideTarget(null)}
          member={overrideTarget}
          selectedDate={selectedDate}
          isFriday={isFriday}
          initialBooking={MessCalculationEngine.resolveEffectiveBooking(
            overrideTarget,
            record?.bookings[overrideTarget.id],
            selectedDate,
            isFriday,
          )}
          onConfirm={(sL, sN, gL, gN, reason) => {
            managerOverrideBooking(
              selectedDate,
              overrideTarget.id,
              overrideTarget.displayName,
              sL,
              sN,
              gL,
              gN,
              reason,
            );
            setOverrideTarget(null);
          }}
        />
      )}
    </div>
  );
};

interface MyBookingTabProps {
  selectedDate: string;
  isFriday: boolean;
  currentMember: Member | undefined;
  record: DailyMealRecord | undefined;
  lunchDeadline: string;
  nightDeadline: string;
  lunchActive: boolean;
  nightActive: boolean;
  isLunchLocked: boolean;
  isNightLocked: boolean;
  onSave: (
    date: string,
    statusLunch: 'BOOKED' | 'CANCELLED',
    statusNight: 'BOOKED' | 'CANCELLED',
    guestLunch: number,
    guestNight: number,
  ) => void;
  onToggleAutoBook: (enabled: boolean, bookLunch?: boolean, bookNight?: boolean) => void;
}

const MyBookingTab: React.FC<MyBookingTabProps> = ({
  selectedDate,
  isFriday,
  currentMember,
  record,
  lunchDeadline,
  nightDeadline,
  lunchActive,
  nightActive,
  isLunchLocked,
  isNightLocked,
  onSave,
  onToggleAutoBook,
}) => {
  const existing = currentMember
    ? MessCalculationEngine.resolveEffectiveBooking(
        currentMember,
        record?.bookings[currentMember.id],
        selectedDate,
        isFriday,
      )
    : createDefaultBooking();

  const [lunchStatus, setLunchStatus] = useState<'BOOKED' | 'CANCELLED'>(
    existing.statusLunch === 'CANCELLED' ? 'CANCELLED' : 'BOOKED',
  );
  const [nightStatus, setNightStatus] = useState<'BOOKED' | 'CANCELLED'>(
    isFriday || existing.statusNight === 'CANCELLED' ? 'CANCELLED' : 'BOOKED',
  );
  const [guestLunch, setGuestLunch] = useState<number>(existing.guestLunch);
  const [guestNight, setGuestNight] = useState<number>(isFriday ? 0 : existing.guestNight);

  const autoEnabled = currentMember?.autoBookEnabled ?? false;
  const autoLunch = currentMember?.autoBookLunch ?? true;
  const autoNight = currentMember?.autoBookNight ?? true;

  const bothLocked = isLunchLocked && (isFriday || isNightLocked);

  return (
    <div className="space-y-4">
      {/* Auto-Book Preference Card */}
      <div className="rounded-3xl border border-outline-variant/80 bg-surface p-4 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <div className="rounded-xl bg-secondary-container p-2 text-on-secondary-container">
              <Sparkles className="h-4.5 w-4.5" />
            </div>
            <div>
              <p className="text-sm font-bold text-on-surface">Auto-Book Meals</p>
              <p className="text-xs text-on-surface-variant">
                Automatically book upcoming meals before cutoff if you haven&apos;t responded yet.
              </p>
            </div>
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={autoEnabled}
            onClick={() => onToggleAutoBook(!autoEnabled, autoLunch, autoNight)}
            className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors ${
              autoEnabled ? 'bg-secondary' : 'bg-surface-variant'
            }`}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                autoEnabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {autoEnabled && (
          <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-outline-variant/50 pt-3">
            <span className="text-xs font-semibold text-on-surface-variant">Auto-book scope:</span>
            <button
              type="button"
              onClick={() => onToggleAutoBook(true, !autoLunch, autoNight)}
              className={`inline-flex items-center gap-1 rounded-xl px-3 py-1 text-xs font-bold ${
                autoLunch
                  ? 'bg-secondary text-on-secondary'
                  : 'border border-outline-variant bg-surface-low text-on-surface-variant'
              }`}
            >
              {autoLunch && <Check className="h-3 w-3" />}
              Lunch
            </button>
            <button
              type="button"
              onClick={() => onToggleAutoBook(true, autoLunch, !autoNight)}
              className={`inline-flex items-center gap-1 rounded-xl px-3 py-1 text-xs font-bold ${
                autoNight
                  ? 'bg-secondary text-on-secondary'
                  : 'border border-outline-variant bg-surface-low text-on-surface-variant'
              }`}
            >
              {autoNight && <Check className="h-3 w-3" />}
              Night
            </button>
          </div>
        )}
      </div>

      {/* Override Notice if Manager edited */}
      {existing.managerOverrideReason && (
        <div className="flex items-start gap-2.5 rounded-2xl border border-tertiary/40 bg-tertiary-container/30 px-4 py-3 text-xs text-on-tertiary-container">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="font-bold">Manager Override Applied</p>
            <p className="mt-0.5">Reason: {existing.managerOverrideReason}</p>
          </div>
        </div>
      )}

      {/* Lunch & Night Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <MealBookingCard
          title="Lunch Service"
          cutoffLabel={`Cutoff: ${DhakaTimeHelper.format12Hour(lunchDeadline)} (Asia/Dhaka)`}
          isActive={lunchActive}
          isLocked={isLunchLocked}
          status={lunchStatus}
          guestCount={guestLunch}
          onStatusChange={setLunchStatus}
          onGuestChange={setGuestLunch}
        />

        <MealBookingCard
          title={isFriday ? 'Night Dinner (Friday Off)' : 'Night Dinner'}
          cutoffLabel={
            isFriday
              ? 'Standard Friday evening meal is off'
              : `Cutoff: ${DhakaTimeHelper.format12Hour(nightDeadline)} (Asia/Dhaka)`
          }
          isActive={nightActive && !isFriday}
          isLocked={isFriday || isNightLocked}
          status={isFriday ? 'CANCELLED' : nightStatus}
          guestCount={isFriday ? 0 : guestNight}
          onStatusChange={setNightStatus}
          onGuestChange={setGuestNight}
        />
      </div>

      {/* Save CTA */}
      <button
        type="button"
        disabled={bothLocked}
        onClick={() => onSave(selectedDate, lunchStatus, nightStatus, guestLunch, guestNight)}
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3.5 text-sm font-bold text-on-primary shadow-sm transition-opacity hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {bothLocked ? <Lock className="h-4.5 w-4.5" /> : <Utensils className="h-4.5 w-4.5" />}
        <span>
          {bothLocked
            ? 'Cutoffs Passed — Contact Manager for Override'
            : 'Confirm / Save Meal Booking'}
        </span>
      </button>
    </div>
  );
};

interface MealBookingCardProps {
  title: string;
  cutoffLabel: string;
  isActive: boolean;
  isLocked: boolean;
  status: 'BOOKED' | 'CANCELLED';
  guestCount: number;
  onStatusChange: (status: 'BOOKED' | 'CANCELLED') => void;
  onGuestChange: (count: number) => void;
}

const MealBookingCard: React.FC<MealBookingCardProps> = ({
  title,
  cutoffLabel,
  isActive,
  isLocked,
  status,
  guestCount,
  onStatusChange,
  onGuestChange,
}) => {
  const disabled = !isActive || isLocked;

  return (
    <div className="rounded-3xl border border-outline-variant/80 bg-surface p-5 shadow-xs">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-base font-extrabold text-on-surface">{title}</h3>
          <p className="mt-0.5 text-xs text-on-surface-variant">{cutoffLabel}</p>
        </div>
        <span
          className={`rounded-lg px-2 py-0.5 text-[10px] font-bold ${
            !isActive
              ? 'bg-error-container text-on-error-container'
              : isLocked
                ? 'bg-surface-variant text-on-surface-variant'
                : 'bg-secondary-container text-on-secondary-container'
          }`}
        >
          {!isActive ? 'CANCELLED' : isLocked ? 'LOCKED' : 'OPEN'}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <button
          type="button"
          disabled={disabled}
          onClick={() => onStatusChange('BOOKED')}
          className={`rounded-2xl border py-2.5 text-xs font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-55 ${
            status === 'BOOKED' && isActive
              ? 'border-secondary bg-secondary text-on-secondary'
              : 'border-outline-variant bg-surface-low text-on-surface-variant'
          }`}
        >
          Booked (ON)
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => onStatusChange('CANCELLED')}
          className={`rounded-2xl border py-2.5 text-xs font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-55 ${
            status === 'CANCELLED' || !isActive
              ? 'border-error bg-error text-on-error'
              : 'border-outline-variant bg-surface-low text-on-surface-variant'
          }`}
        >
          Cancelled (OFF)
        </button>
      </div>

      {isLocked && isActive && (
        <div className="mt-3 flex items-center gap-1.5 rounded-xl bg-surface-low px-3 py-2 text-[11px] font-semibold text-on-surface-variant">
          <Lock className="h-3.5 w-3.5 shrink-0" />
          <span>Cutoff passed. Meal order locked for kitchen.</span>
        </div>
      )}

      {/* Guest Meals Stepper */}
      <div className="mt-4 flex items-center justify-between border-t border-outline-variant/50 pt-3">
        <div>
          <p className="text-xs font-bold text-on-surface">Guest Meals</p>
          <p className="text-[11px] text-on-surface-variant">Extra portions for guests</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={disabled || guestCount <= 0}
            onClick={() => onGuestChange(Math.max(0, guestCount - 1))}
            aria-label="Decrease guests"
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-outline-variant bg-surface-low text-on-surface disabled:opacity-40"
          >
            <Minus className="h-3.5 w-3.5" />
          </button>
          <span className="w-6 text-center tabular-nums text-sm font-extrabold text-on-surface">
            {guestCount}
          </span>
          <button
            type="button"
            disabled={disabled}
            onClick={() => onGuestChange(guestCount + 1)}
            aria-label="Increase guests"
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-outline-variant bg-surface-low text-on-surface disabled:opacity-40"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

interface KitchenOrdersTabProps {
  selectedDate: string;
  isFriday: boolean;
  isManager: boolean;
  members: Member[];
  record: DailyMealRecord | undefined;
  kitchenSummary: ReturnType<typeof useMess>['kitchenSummary'];
  lunchDeadline: string;
  nightDeadline: string;
  onLockFinalOrder: (date: string, mealType: 'LUNCH' | 'NIGHT') => void;
  onOpenOverride: (member: Member) => void;
}

const KitchenOrdersTab: React.FC<KitchenOrdersTabProps> = ({
  selectedDate,
  isFriday,
  isManager,
  members,
  record,
  kitchenSummary,
  lunchDeadline,
  nightDeadline,
  onLockFinalOrder,
  onOpenOverride,
}) => {
  const [filter, setFilter] = useState<'ALL' | 'LUNCH' | 'NIGHT' | 'NOT_EATING'>('ALL');

  const memberRows = useMemo(() => {
    return members.map((member) => {
      const booking = MessCalculationEngine.resolveEffectiveBooking(
        member,
        record?.bookings[member.id],
        selectedDate,
        isFriday,
      );
      const lunchStatus = kitchenSummary.lunchActive ? booking.statusLunch : 'CANCELLED';
      const nightStatus =
        kitchenSummary.nightActive && !isFriday ? booking.statusNight : 'CANCELLED';

      const [mUnits, gUnits] = MessCalculationEngine.calculateBookingUnits({
        date: selectedDate,
        isFriday,
        lunchServiceStatus: record?.lunchServiceStatus ?? 'ACTIVE',
        nightServiceStatus: record?.nightServiceStatus ?? (isFriday ? 'CANCELLED' : 'ACTIVE'),
        lunchDeadline,
        nightDeadline,
        booking,
        lunchFinalOrder: record?.lunchFinalOrder,
        nightFinalOrder: record?.nightFinalOrder,
      });

      return {
        member,
        booking,
        lunchBooked: lunchStatus === 'BOOKED',
        nightBooked: nightStatus === 'BOOKED',
        totalUnits: mUnits + gUnits,
      };
    });
  }, [
    members,
    record,
    selectedDate,
    isFriday,
    kitchenSummary.lunchActive,
    kitchenSummary.nightActive,
    lunchDeadline,
    nightDeadline,
  ]);

  const filteredRows = useMemo(() => {
    if (filter === 'LUNCH') return memberRows.filter((r) => r.lunchBooked);
    if (filter === 'NIGHT') return memberRows.filter((r) => r.nightBooked);
    if (filter === 'NOT_EATING') return memberRows.filter((r) => !r.lunchBooked && !r.nightBooked);
    return memberRows;
  }, [filter, memberRows]);

  return (
    <div className="space-y-4">
      {/* Preparation Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-3xl border border-outline-variant/80 bg-surface p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ChefHat className="h-5 w-5 text-primary" />
              <h3 className="text-base font-extrabold text-on-surface">Lunch Preparation</h3>
            </div>
            {kitchenSummary.lunchFinalOrder?.isLocked && (
              <span className="inline-flex items-center gap-1 rounded-lg bg-secondary-container px-2 py-0.5 text-[10px] font-bold text-on-secondary-container">
                <Lock className="h-3 w-3" />
                LOCKED
              </span>
            )}
          </div>
          <p className="mt-2 tabular-nums text-3xl font-extrabold text-primary">
            {kitchenSummary.lunchActive ? kitchenSummary.lunchTotalPortions : 0}{' '}
            <span className="text-sm font-semibold text-on-surface-variant">portions</span>
          </p>
          <p className="mt-0.5 text-xs text-on-surface-variant">
            {kitchenSummary.lunchMemberCount} members + {kitchenSummary.lunchGuestCount} guests
          </p>
          {isManager && kitchenSummary.lunchActive && (
            <button
              type="button"
              onClick={() => onLockFinalOrder(selectedDate, 'LUNCH')}
              className="mt-3 inline-flex items-center gap-1.5 rounded-xl border border-primary/40 bg-primary-container/35 px-3 py-1.5 text-xs font-bold text-on-primary-container hover:bg-primary-container/55"
            >
              <Lock className="h-3.5 w-3.5" />
              <span>
                {kitchenSummary.lunchFinalOrder?.isLocked
                  ? 'Re-Archive Final Order'
                  : 'Archive / Lock Final Summary'}
              </span>
            </button>
          )}
        </div>

        <div className="rounded-3xl border border-outline-variant/80 bg-surface p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ChefHat className="h-5 w-5 text-tertiary" />
              <h3 className="text-base font-extrabold text-on-surface">
                {isFriday ? 'Night Dinner (Fri Off)' : 'Night Preparation'}
              </h3>
            </div>
            {kitchenSummary.nightFinalOrder?.isLocked && !isFriday && (
              <span className="inline-flex items-center gap-1 rounded-lg bg-secondary-container px-2 py-0.5 text-[10px] font-bold text-on-secondary-container">
                <Lock className="h-3 w-3" />
                LOCKED
              </span>
            )}
          </div>
          <p className="mt-2 tabular-nums text-3xl font-extrabold text-tertiary">
            {kitchenSummary.nightActive && !isFriday ? kitchenSummary.nightTotalPortions : 0}{' '}
            <span className="text-sm font-semibold text-on-surface-variant">portions</span>
          </p>
          <p className="mt-0.5 text-xs text-on-surface-variant">
            {isFriday
              ? 'Standard Friday night off'
              : `${kitchenSummary.nightMemberCount} members + ${kitchenSummary.nightGuestCount} guests`}
          </p>
          {isManager && kitchenSummary.nightActive && !isFriday && (
            <button
              type="button"
              onClick={() => onLockFinalOrder(selectedDate, 'NIGHT')}
              className="mt-3 inline-flex items-center gap-1.5 rounded-xl border border-tertiary/40 bg-tertiary-container/35 px-3 py-1.5 text-xs font-bold text-on-tertiary-container hover:bg-tertiary-container/55"
            >
              <Lock className="h-3.5 w-3.5" />
              <span>
                {kitchenSummary.nightFinalOrder?.isLocked
                  ? 'Re-Archive Final Order'
                  : 'Archive / Lock Final Summary'}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Chips */}
      <div className="flex flex-wrap gap-2">
        {(
          [
            ['ALL', `All (${memberRows.length})`],
            ['LUNCH', 'Lunch'],
            ['NIGHT', 'Dinner'],
            ['NOT_EATING', 'Not Eating'],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key)}
            className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition-colors ${
              filter === key
                ? 'bg-primary text-on-primary'
                : 'border border-outline-variant bg-surface text-on-surface-variant hover:text-on-surface'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Member Bookings List */}
      <div className="space-y-2.5">
        {filteredRows.map(({ member, booking, lunchBooked, nightBooked, totalUnits }) => (
          <div
            key={member.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-outline-variant/80 bg-surface px-4 py-3"
          >
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-bold text-on-surface">{member.displayName}</p>
                {booking.autoBooked && (
                  <span className="rounded-md bg-secondary-container px-1.5 py-0.5 text-[10px] font-bold text-on-secondary-container">
                    AUTO
                  </span>
                )}
                {booking.managerOverrideReason && (
                  <span className="rounded-md bg-tertiary-container px-1.5 py-0.5 text-[10px] font-bold text-on-tertiary-container">
                    OVERRIDE
                  </span>
                )}
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                <span
                  className={`font-semibold ${lunchBooked ? 'text-secondary' : 'text-on-surface-variant'}`}
                >
                  Lunch: {lunchBooked ? 'ON' : booking.statusLunch === 'NO_RESPONSE' ? 'Pending' : 'OFF'}
                  {booking.guestLunch > 0 ? ` (+${booking.guestLunch}G)` : ''}
                </span>
                <span className="text-outline">·</span>
                <span
                  className={`font-semibold ${nightBooked ? 'text-tertiary' : 'text-on-surface-variant'}`}
                >
                  Night:{' '}
                  {isFriday
                    ? 'Fri Off'
                    : nightBooked
                      ? 'ON'
                      : booking.statusNight === 'NO_RESPONSE'
                        ? 'Pending'
                        : 'OFF'}
                  {!isFriday && booking.guestNight > 0 ? ` (+${booking.guestNight}G)` : ''}
                </span>
              </div>
              {booking.managerOverrideReason && (
                <p className="mt-0.5 text-[11px] text-tertiary">
                  Override note: {booking.managerOverrideReason}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className="rounded-xl bg-surface-low px-2.5 py-1 tabular-nums text-xs font-bold text-on-surface">
                {formatUnits(totalUnits)} u
              </span>
              {isManager && (
                <button
                  type="button"
                  onClick={() => onOpenOverride(member)}
                  className="rounded-xl border border-outline-variant bg-surface-low px-3 py-1.5 text-xs font-bold text-primary hover:border-primary"
                >
                  Override
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const HistoricalAttendanceTab: React.FC<{
  record: DailyMealRecord;
  members: Member[];
  isFriday: boolean;
}> = ({ record, members, isFriday }) => {
  return (
    <div className="space-y-2.5">
      {Object.entries(record.attendances).map(([memberId, att]) => {
        const mem = members.find((m) => m.id === memberId);
        const units = MessCalculationEngine.calculateAttendanceUnits({
          isFriday,
          lunchServiceStatus: record.lunchServiceStatus,
          nightServiceStatus: record.nightServiceStatus,
          attendance: att,
        });
        return (
          <div
            key={memberId}
            className="flex items-center justify-between rounded-2xl border border-outline-variant/80 bg-surface px-4 py-3"
          >
            <div>
              <p className="text-sm font-bold text-on-surface">{mem?.displayName || memberId}</p>
              <p className="text-xs text-on-surface-variant">
                Lunch: {att.attendedLunch ? 'Yes' : 'No'}
                {att.guestLunchAttended > 0 ? ` (+${att.guestLunchAttended}G)` : ''} · Night:{' '}
                {att.attendedNight ? 'Yes' : 'No'}
                {att.guestNightAttended > 0 ? ` (+${att.guestNightAttended}G)` : ''}
              </p>
            </div>
            <span className="rounded-xl bg-secondary-container px-2.5 py-1 tabular-nums text-xs font-bold text-on-secondary-container">
              {formatUnits(units)} units
            </span>
          </div>
        );
      })}
    </div>
  );
};

const ConfigureDeadlineModal: React.FC<{
  open: boolean;
  onClose: () => void;
  lunchDeadline: string;
  nightDeadline: string;
  onSave: (lunch: string, night: string) => void;
}> = ({ open, onClose, lunchDeadline, nightDeadline, onSave }) => {
  const [lunch, setLunch] = useState(lunchDeadline);
  const [night, setNight] = useState(nightDeadline);

  return (
    <Modal open={open} onClose={onClose} title="Configure Booking Cutoffs (Asia/Dhaka)" maxWidthClass="max-w-sm">
      <div className="space-y-4">
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-on-surface-variant">
            Lunch Deadline (24-hr HH:mm)
          </label>
          <input
            type="time"
            value={lunch}
            onChange={(e) => setLunch(e.target.value)}
            className="w-full rounded-xl border border-outline-variant bg-surface-low px-3.5 py-2 text-sm text-on-surface"
          />
        </div>
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-on-surface-variant">
            Night Dinner Deadline (24-hr HH:mm)
          </label>
          <input
            type="time"
            value={night}
            onChange={(e) => setNight(e.target.value)}
            className="w-full rounded-xl border border-outline-variant bg-surface-low px-3.5 py-2 text-sm text-on-surface"
          />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-outline-variant px-4 py-2 text-xs font-semibold text-on-surface"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onSave(lunch, night)}
            className="rounded-xl bg-primary px-4 py-2 text-xs font-bold text-on-primary"
          >
            Save Cutoffs
          </button>
        </div>
      </div>
    </Modal>
  );
};

const ServiceStatusModal: React.FC<{
  open: boolean;
  onClose: () => void;
  selectedDate: string;
  isFriday: boolean;
  initialLunch: ServiceStatus;
  initialNight: ServiceStatus;
  initialReason: string;
  onSave: (lunch: ServiceStatus, night: ServiceStatus, reason: string) => void;
}> = ({
  open,
  onClose,
  selectedDate,
  isFriday,
  initialLunch,
  initialNight,
  initialReason,
  onSave,
}) => {
  const [lunchOn, setLunchOn] = useState(initialLunch !== 'CANCELLED');
  const [nightOn, setNightOn] = useState(!isFriday && initialNight !== 'CANCELLED');
  const [reason, setReason] = useState(initialReason);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Daily Meal Service Status"
      subtitle={DhakaTimeHelper.formatReadableDate(selectedDate)}
      maxWidthClass="max-w-sm"
    >
      <div className="space-y-4">
        <label className="flex items-center justify-between rounded-2xl border border-outline-variant bg-surface-low px-4 py-3">
          <span className="text-sm font-bold text-on-surface">Lunch Service Active</span>
          <input
            type="checkbox"
            checked={lunchOn}
            onChange={(e) => setLunchOn(e.target.checked)}
            className="h-4 w-4 accent-primary"
          />
        </label>

        <label className="flex items-center justify-between rounded-2xl border border-outline-variant bg-surface-low px-4 py-3">
          <span className="text-sm font-bold text-on-surface">
            {isFriday ? 'Night Service (Friday Off)' : 'Night Service Active'}
          </span>
          <input
            type="checkbox"
            disabled={isFriday}
            checked={nightOn}
            onChange={(e) => setNightOn(e.target.checked)}
            className="h-4 w-4 accent-primary"
          />
        </label>

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-on-surface-variant">
            Cancellation / Service Note
          </label>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g., Holiday / Cook unavailable"
            className="w-full rounded-xl border border-outline-variant bg-surface-low px-3.5 py-2 text-sm text-on-surface"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-outline-variant px-4 py-2 text-xs font-semibold text-on-surface"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() =>
              onSave(
                lunchOn ? 'ACTIVE' : 'CANCELLED',
                !isFriday && nightOn ? 'ACTIVE' : 'CANCELLED',
                reason.trim(),
              )
            }
            className="rounded-xl bg-primary px-4 py-2 text-xs font-bold text-on-primary"
          >
            Update Service
          </button>
        </div>
      </div>
    </Modal>
  );
};

const ManagerOverrideModal: React.FC<{
  open: boolean;
  onClose: () => void;
  member: Member;
  selectedDate: string;
  isFriday: boolean;
  initialBooking: ReturnType<typeof createDefaultBooking>;
  onConfirm: (
    sL: 'BOOKED' | 'CANCELLED',
    sN: 'BOOKED' | 'CANCELLED',
    gL: number,
    gN: number,
    reason: string,
  ) => void;
}> = ({ open, onClose, member, selectedDate, isFriday, initialBooking, onConfirm }) => {
  const [lunchStatus, setLunchStatus] = useState<'BOOKED' | 'CANCELLED'>(
    initialBooking.statusLunch === 'BOOKED' ? 'BOOKED' : 'CANCELLED',
  );
  const [nightStatus, setNightStatus] = useState<'BOOKED' | 'CANCELLED'>(
    !isFriday && initialBooking.statusNight === 'BOOKED' ? 'BOOKED' : 'CANCELLED',
  );
  const [guestLunch, setGuestLunch] = useState(initialBooking.guestLunch);
  const [guestNight, setGuestNight] = useState(isFriday ? 0 : initialBooking.guestNight);
  const [reason, setReason] = useState(initialBooking.managerOverrideReason || '');
  const [error, setError] = useState('');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('Audit reason is required for manager overrides.');
      return;
    }
    setError('');
    onConfirm(lunchStatus, nightStatus, guestLunch, guestNight, reason.trim());
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Admin Override: ${member.displayName}`}
      subtitle={DhakaTimeHelper.formatReadableDate(selectedDate)}
      maxWidthClass="max-w-md"
    >
      <form onSubmit={handleSave} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <p className="text-xs font-bold text-on-surface">Lunch</p>
            <select
              value={lunchStatus}
              onChange={(e) => setLunchStatus(e.target.value as 'BOOKED' | 'CANCELLED')}
              className="w-full rounded-xl border border-outline-variant bg-surface-low px-3 py-2 text-xs text-on-surface"
            >
              <option value="BOOKED">BOOKED</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>
            <label className="block text-[11px] text-on-surface-variant">
              Guests:
              <input
                type="number"
                min={0}
                value={guestLunch}
                onChange={(e) => setGuestLunch(Math.max(0, Number.parseInt(e.target.value || '0', 10)))}
                className="mt-1 w-full rounded-xl border border-outline-variant bg-surface-low px-3 py-1.5 text-xs text-on-surface"
              />
            </label>
          </div>

          <div className="space-y-1.5">
            <p className="text-xs font-bold text-on-surface">
              {isFriday ? 'Night (Fri Off)' : 'Night'}
            </p>
            <select
              disabled={isFriday}
              value={nightStatus}
              onChange={(e) => setNightStatus(e.target.value as 'BOOKED' | 'CANCELLED')}
              className="w-full rounded-xl border border-outline-variant bg-surface-low px-3 py-2 text-xs text-on-surface disabled:opacity-50"
            >
              <option value="BOOKED">BOOKED</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>
            <label className="block text-[11px] text-on-surface-variant">
              Guests:
              <input
                type="number"
                min={0}
                disabled={isFriday}
                value={guestNight}
                onChange={(e) => setGuestNight(Math.max(0, Number.parseInt(e.target.value || '0', 10)))}
                className="mt-1 w-full rounded-xl border border-outline-variant bg-surface-low px-3 py-1.5 text-xs text-on-surface disabled:opacity-50"
              />
            </label>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-on-surface-variant">
            Override Reason (Recorded in Audit History)
          </label>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g., Member called late before cooking started"
            className="w-full rounded-xl border border-outline-variant bg-surface-low px-3.5 py-2 text-sm text-on-surface"
          />
        </div>

        {error && (
          <p className="rounded-xl bg-error-container px-3 py-2 text-xs font-semibold text-on-error-container">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-outline-variant px-4 py-2 text-xs font-semibold text-on-surface"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="rounded-xl bg-primary px-4 py-2 text-xs font-bold text-on-primary"
          >
            Apply Override
          </button>
        </div>
      </form>
    </Modal>
  );
};

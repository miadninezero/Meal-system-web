import React, { useState } from 'react';
import {
  Bell,
  CalendarDays,
  CheckCircle2,
  ChefHat,
  Copy,
  Receipt,
  Scale,
  ShieldCheck,
  ShoppingCart,
  UserCog,
  Utensils,
  Wallet,
} from 'lucide-react';
import { Modal } from '../components/Modal';
import { NotificationsDialog } from '../components/NotificationsDialog';
import { useMess } from '../context/MessContext';
import { Member, Screen, getSharedBillMemberDue, getSharedBillMemberShare } from '../types/mess';
import { DhakaTimeHelper, formatTaka, formatUnits } from '../utils/dhakaTime';

interface DashboardScreenProps {
  onNavigate: (screen: Screen) => void;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({ onNavigate }) => {
  const {
    currentMess,
    currentUserId,
    isManager,
    members,
    summary,
    kitchenSummary,
    sharedBills,
    notifications,
    unreadNotificationsCount,
    todayDhakaDate,
    showUiMessage,
    promoteMemberToManager,
    demoteManagerToMember,
    resignAsManager,
    markNotificationAsRead,
    markAllNotificationsAsRead,
  } = useMess();

  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [showNotifDialog, setShowNotifDialog] = useState(false);

  const currentMember = members.find((m) => m.userId === currentUserId);
  const myMemberId = currentMember?.id || currentUserId;
  const mySettlement = summary.memberSettlements.find((s) => s.memberId === myMemberId);

  const myUnpaidBills = sharedBills.filter((bill) => {
    const share = getSharedBillMemberShare(bill, myMemberId);
    const due = getSharedBillMemberDue(bill, myMemberId);
    return share > 0 && due > 0;
  });
  const totalMyBillDue = myUnpaidBills.reduce(
    (sum, bill) => sum + getSharedBillMemberDue(bill, myMemberId),
    0,
  );

  const handleCopyCode = async () => {
    if (!currentMess?.id) return;
    try {
      await navigator.clipboard.writeText(currentMess.id);
      showUiMessage('Mess Code copied to clipboard!');
    } catch {
      showUiMessage(`Mess Code: ${currentMess.id}`);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-5 p-4 md:p-6">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-primary">
            {DhakaTimeHelper.formatReadableDate(todayDhakaDate)}
            {DhakaTimeHelper.isFriday(todayDhakaDate) ? ' · Friday' : ''} (Asia/Dhaka)
          </p>
          <h1 className="text-2xl font-extrabold tracking-tight text-on-surface">
            {currentMess?.name || 'Mess Dashboard'}
          </h1>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-on-surface-variant">
            <button
              type="button"
              onClick={handleCopyCode}
              className="inline-flex items-center gap-1.5 rounded-lg border border-outline-variant bg-surface-low px-2.5 py-1 font-mono font-bold text-on-surface transition-colors hover:border-primary"
            >
              <span>Code: {currentMess?.id}</span>
              <Copy className="h-3.5 w-3.5 text-primary" />
            </button>
            <span>· {members.length} Active Members</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowNotifDialog(true)}
            className="relative inline-flex items-center gap-1.5 rounded-2xl border border-outline-variant bg-surface px-3.5 py-2 text-xs font-bold text-on-surface transition-colors hover:bg-surface-low"
          >
            <Bell className="h-4 w-4 text-primary" />
            <span>Alerts</span>
            {unreadNotificationsCount > 0 && (
              <span className="rounded-full bg-error px-1.5 py-0.5 text-[10px] font-bold text-on-error">
                {unreadNotificationsCount}
              </span>
            )}
          </button>
          {isManager && (
            <button
              type="button"
              onClick={() => setShowRoleDialog(true)}
              className="inline-flex items-center gap-1.5 rounded-2xl bg-primary-container px-3.5 py-2 text-xs font-bold text-on-primary-container transition-opacity hover:opacity-90"
            >
              <UserCog className="h-4 w-4" />
              <span>Manage Roles</span>
            </button>
          )}
        </div>
      </div>

      {/* Meal Rate & Fund Hero Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-3xl bg-primary p-5 text-on-primary shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider opacity-85">
                CURRENT LIVE MEAL RATE
              </p>
              <p className="mt-1 tabular-nums text-3xl font-extrabold">
                {formatTaka(summary.mealRate)}
                <span className="ml-1 text-sm font-medium opacity-85">/ unit</span>
              </p>
            </div>
            <div className="rounded-2xl bg-white/15 p-2.5">
              <Utensils className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 border-t border-white/20 pt-3 text-xs">
            <div>
              <p className="opacity-80">Total Bazaar</p>
              <p className="tabular-nums font-bold">{formatTaka(summary.totalBazaarCost)}</p>
            </div>
            <div>
              <p className="opacity-80">Total Meal Units</p>
              <p className="tabular-nums font-bold">{formatUnits(summary.totalUnits)} units</p>
            </div>
          </div>
        </div>

        {/* My Balance Card */}
        <div className="rounded-3xl border border-outline-variant/80 bg-surface p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                MY CURRENT BALANCE ({currentMember?.displayName || 'Member'})
              </p>
              <p
                className={`mt-1 tabular-nums text-3xl font-extrabold ${
                  (mySettlement?.netBalance ?? 0) >= 0 ? 'text-secondary' : 'text-error'
                }`}
              >
                {(mySettlement?.netBalance ?? 0) >= 0 ? '+' : '-'}
                {formatTaka(Math.abs(mySettlement?.netBalance ?? 0))}
              </p>
              <p className="mt-0.5 text-xs font-semibold text-on-surface-variant">
                {(mySettlement?.netBalance ?? 0) >= 0
                  ? 'Refundable / Surplus'
                  : 'Due to Mess Fund'}
              </p>
            </div>
            <span
              className={`rounded-xl px-2.5 py-1 text-xs font-bold ${
                (mySettlement?.netBalance ?? 0) >= 0
                  ? 'bg-secondary-container text-on-secondary-container'
                  : 'bg-error-container text-on-error-container'
              }`}
            >
              {(mySettlement?.netBalance ?? 0) >= 0 ? 'SURPLUS' : 'DUE'}
            </span>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2 border-t border-outline-variant/60 pt-3 text-xs">
            <div>
              <p className="text-on-surface-variant">Deposited</p>
              <p className="tabular-nums font-bold text-on-surface">
                {formatTaka(mySettlement?.totalDeposit ?? 0)}
              </p>
            </div>
            <div>
              <p className="text-on-surface-variant">Meal Units</p>
              <p className="tabular-nums font-bold text-on-surface">
                {formatUnits(mySettlement?.totalUnits ?? 0)}
              </p>
            </div>
            <div>
              <p className="text-on-surface-variant">Total Cost</p>
              <p className="tabular-nums font-bold text-on-surface">
                {formatTaka(mySettlement?.totalCost ?? 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Pending Shared Bills Banner (if member has unpaid shares) */}
      {myUnpaidBills.length > 0 && (
        <button
          type="button"
          onClick={() => onNavigate(Screen.SHARED_BILLS)}
          className="flex w-full items-center justify-between gap-3 rounded-3xl border border-primary/40 bg-primary-container/35 px-5 py-4 text-left transition-colors hover:bg-primary-container/50"
        >
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-primary p-2.5 text-on-primary">
              <Receipt className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-on-surface">
                {myUnpaidBills.length} Shared Bill{myUnpaidBills.length > 1 ? 's' : ''} Pending
              </p>
              <p className="text-xs text-on-surface-variant">
                Your outstanding bill due: <strong className="tabular-nums">{formatTaka(totalMyBillDue)}</strong>
              </p>
            </div>
          </div>
          <span className="shrink-0 rounded-xl bg-primary px-3 py-1.5 text-xs font-bold text-on-primary">
            View Bills
          </span>
        </button>
      )}

      {/* Today's Kitchen & Mess Overview */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Today's Kitchen Summary */}
        <div className="rounded-3xl border border-outline-variant/80 bg-surface p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ChefHat className="h-5 w-5 text-primary" />
              <h2 className="text-base font-bold text-on-surface">Today&apos;s Kitchen Orders</h2>
            </div>
            <button
              type="button"
              onClick={() => onNavigate(Screen.DAILY_MEALS)}
              className="text-xs font-bold text-primary hover:underline"
            >
              Manage Meals
            </button>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-surface-low p-3.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-on-surface-variant">Lunch</span>
                <span
                  className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${
                    !kitchenSummary.lunchActive
                      ? 'bg-error-container text-on-error-container'
                      : kitchenSummary.isLunchLocked
                        ? 'bg-secondary-container text-on-secondary-container'
                        : 'bg-tertiary-container text-on-tertiary-container'
                  }`}
                >
                  {!kitchenSummary.lunchActive
                    ? 'OFF'
                    : kitchenSummary.isLunchLocked
                      ? 'LOCKED'
                      : 'OPEN'}
                </span>
              </div>
              <p className="mt-2 tabular-nums text-2xl font-extrabold text-on-surface">
                {kitchenSummary.lunchActive ? kitchenSummary.lunchTotalPortions : 0}
              </p>
              <p className="text-[11px] text-on-surface-variant">
                {kitchenSummary.lunchMemberCount} members + {kitchenSummary.lunchGuestCount} guests
              </p>
            </div>

            <div className="rounded-2xl bg-surface-low p-3.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-on-surface-variant">
                  {kitchenSummary.isFriday ? 'Night (Fri)' : 'Night'}
                </span>
                <span
                  className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${
                    kitchenSummary.isFriday || !kitchenSummary.nightActive
                      ? 'bg-error-container text-on-error-container'
                      : kitchenSummary.isNightLocked
                        ? 'bg-secondary-container text-on-secondary-container'
                        : 'bg-tertiary-container text-on-tertiary-container'
                  }`}
                >
                  {kitchenSummary.isFriday
                    ? 'OFF (FRI)'
                    : !kitchenSummary.nightActive
                      ? 'OFF'
                      : kitchenSummary.isNightLocked
                        ? 'LOCKED'
                        : 'OPEN'}
                </span>
              </div>
              <p className="mt-2 tabular-nums text-2xl font-extrabold text-on-surface">
                {kitchenSummary.nightActive && !kitchenSummary.isFriday
                  ? kitchenSummary.nightTotalPortions
                  : 0}
              </p>
              <p className="text-[11px] text-on-surface-variant">
                {kitchenSummary.isFriday
                  ? 'No Friday dinner service'
                  : `${kitchenSummary.nightMemberCount} members + ${kitchenSummary.nightGuestCount} guests`}
              </p>
            </div>
          </div>

          <p className="mt-3 text-xs text-on-surface-variant">
            Cutoffs (Asia/Dhaka): Lunch{' '}
            <strong>{DhakaTimeHelper.format12Hour(currentMess?.lunchBookingDeadline || '09:00')}</strong>{' '}
            · Night{' '}
            <strong>{DhakaTimeHelper.format12Hour(currentMess?.nightBookingDeadline || '17:00')}</strong>
          </p>
        </div>

        {/* Mess Fund Health */}
        <div className="rounded-3xl border border-outline-variant/80 bg-surface p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Scale className="h-5 w-5 text-secondary" />
              <h2 className="text-base font-bold text-on-surface">Mess Fund Health</h2>
            </div>
            <button
              type="button"
              onClick={() => onNavigate(Screen.SETTLEMENT)}
              className="text-xs font-bold text-secondary hover:underline"
            >
              Settlements
            </button>
          </div>

          <div className="mt-4 space-y-2.5 text-sm">
            <div className="flex items-center justify-between rounded-xl bg-surface-low px-3.5 py-2">
              <span className="text-on-surface-variant">Total Advance Deposits</span>
              <span className="tabular-nums font-bold text-secondary">
                {formatTaka(summary.totalDeposits)}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-surface-low px-3.5 py-2">
              <span className="text-on-surface-variant">Total Bazaar + Utilities</span>
              <span className="tabular-nums font-bold text-on-surface">
                {formatTaka(summary.totalBazaarCost + summary.totalUtilities)}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-surface-low px-3.5 py-2">
              <span className="text-on-surface-variant">Cash Remaining in Hand</span>
              <span
                className={`tabular-nums font-extrabold ${
                  summary.remainingFund >= 0 ? 'text-secondary' : 'text-error'
                }`}
              >
                {formatTaka(summary.remainingFund)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Navigation Shortcuts */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <button
          type="button"
          onClick={() => onNavigate(Screen.DAILY_MEALS)}
          className="flex flex-col items-start gap-2 rounded-2xl border border-outline-variant/80 bg-surface p-4 text-left transition-colors hover:border-primary/60 hover:bg-surface-low"
        >
          <CalendarDays className="h-5 w-5 text-primary" />
          <div>
            <p className="text-sm font-bold text-on-surface">Book Meals</p>
            <p className="text-[11px] text-on-surface-variant">Lunch, night &amp; guests</p>
          </div>
        </button>
        <button
          type="button"
          onClick={() => onNavigate(Screen.BAZAAR_LOG)}
          className="flex flex-col items-start gap-2 rounded-2xl border border-outline-variant/80 bg-surface p-4 text-left transition-colors hover:border-primary/60 hover:bg-surface-low"
        >
          <ShoppingCart className="h-5 w-5 text-primary" />
          <div>
            <p className="text-sm font-bold text-on-surface">Bazaar Log</p>
            <p className="text-[11px] text-on-surface-variant">Grocery &amp; market spends</p>
          </div>
        </button>
        <button
          type="button"
          onClick={() => onNavigate(Screen.SHARED_BILLS)}
          className="flex flex-col items-start gap-2 rounded-2xl border border-outline-variant/80 bg-surface p-4 text-left transition-colors hover:border-primary/60 hover:bg-surface-low"
        >
          <Receipt className="h-5 w-5 text-tertiary" />
          <div>
            <p className="text-sm font-bold text-on-surface">Shared Bills</p>
            <p className="text-[11px] text-on-surface-variant">Rent, WiFi, Gas &amp; Maid</p>
          </div>
        </button>
        <button
          type="button"
          onClick={() => onNavigate(Screen.DEPOSITS)}
          className="flex flex-col items-start gap-2 rounded-2xl border border-outline-variant/80 bg-surface p-4 text-left transition-colors hover:border-primary/60 hover:bg-surface-low"
        >
          <Wallet className="h-5 w-5 text-secondary" />
          <div>
            <p className="text-sm font-bold text-on-surface">Deposits</p>
            <p className="text-[11px] text-on-surface-variant">Advance fund ledger</p>
          </div>
        </button>
      </div>

      {/* Manage Roles Modal */}
      <ManageRolesModal
        open={showRoleDialog}
        onClose={() => setShowRoleDialog(false)}
        members={members}
        currentUserId={currentUserId}
        adminUids={currentMess?.adminUids ?? []}
        managerUid={currentMess?.managerUid ?? ''}
        onPromote={promoteMemberToManager}
        onDemote={demoteManagerToMember}
        onResign={resignAsManager}
      />

      {/* Notifications Modal */}
      <NotificationsDialog
        open={showNotifDialog}
        onClose={() => setShowNotifDialog(false)}
        notifications={notifications}
        unreadCount={unreadNotificationsCount}
        onMarkAsRead={markNotificationAsRead}
        onMarkAllRead={markAllNotificationsAsRead}
      />
    </div>
  );
};

interface ManageRolesModalProps {
  open: boolean;
  onClose: () => void;
  members: Member[];
  currentUserId: string;
  adminUids: string[];
  managerUid: string;
  onPromote: (m: Member) => void;
  onDemote: (m: Member) => void;
  onResign: (successor: Member | null) => void;
}

const ManageRolesModal: React.FC<ManageRolesModalProps> = ({
  open,
  onClose,
  members,
  currentUserId,
  adminUids,
  managerUid,
  onPromote,
  onDemote,
  onResign,
}) => {
  const [selectedSuccessorId, setSelectedSuccessorId] = useState<string>('');
  const [confirmResign, setConfirmResign] = useState(false);

  const otherManagers = members.filter(
    (m) =>
      m.userId !== currentUserId &&
      (m.role === 'MANAGER' || adminUids.includes(m.userId) || m.userId === managerUid),
  );
  const nonManagerMembers = members.filter(
    (m) =>
      m.userId !== currentUserId &&
      m.role !== 'MANAGER' &&
      !adminUids.includes(m.userId) &&
      m.userId !== managerUid,
  );

  const isSoleManager = otherManagers.length === 0;
  const successor = nonManagerMembers.find((m) => m.id === selectedSuccessorId) ?? null;

  return (
    <Modal
      open={open}
      onClose={() => {
        setConfirmResign(false);
        onClose();
      }}
      title="Manage Mess Roles & Governance"
      subtitle="Promote members to Manager, demote, or transfer leadership."
      maxWidthClass="max-w-lg"
      footer={
        <button
          type="button"
          onClick={() => {
            setConfirmResign(false);
            onClose();
          }}
          className="rounded-xl bg-surface-variant px-4 py-2 text-sm font-semibold text-on-surface"
        >
          Close
        </button>
      }
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
            Members ({members.length})
          </p>
          {members.map((m) => {
            const isSelf = m.userId === currentUserId;
            const mIsManager =
              m.role === 'MANAGER' || adminUids.includes(m.userId) || m.userId === managerUid;
            return (
              <div
                key={m.id}
                className="flex items-center justify-between gap-3 rounded-2xl border border-outline-variant/70 bg-surface-low px-3.5 py-2.5"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-bold text-on-surface">
                      {m.displayName} {isSelf ? '(You)' : ''}
                    </p>
                    <span
                      className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold ${
                        mIsManager
                          ? 'bg-primary-container text-on-primary-container'
                          : 'bg-surface-variant text-on-surface-variant'
                      }`}
                    >
                      {mIsManager && <ShieldCheck className="h-3 w-3" />}
                      {mIsManager ? 'MANAGER' : 'MEMBER'}
                    </span>
                  </div>
                  <p className="text-xs text-on-surface-variant">{m.room || 'Member'}</p>
                </div>

                {!isSelf && (
                  <div className="shrink-0">
                    {mIsManager ? (
                      <button
                        type="button"
                        onClick={() => onDemote(m)}
                        className="rounded-xl border border-outline-variant bg-surface px-2.5 py-1.5 text-xs font-semibold text-on-surface-variant hover:border-error hover:text-error"
                      >
                        Demote
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onPromote(m)}
                        className="rounded-xl bg-primary px-2.5 py-1.5 text-xs font-bold text-on-primary hover:opacity-90"
                      >
                        Make Manager
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Resign as Manager Section */}
        <div className="rounded-2xl border border-error/30 bg-error-container/25 p-4">
          <h3 className="text-sm font-bold text-on-surface">Step Down / Resign as Manager</h3>
          <p className="mt-1 text-xs text-on-surface-variant">
            {isSoleManager
              ? 'You are currently the sole Manager. Select a successor before stepping down.'
              : 'Another manager is already active, so you can resign immediately or pick a successor.'}
          </p>

          {nonManagerMembers.length > 0 && (
            <div className="mt-3">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                Handover To (Optional unless sole manager)
              </label>
              <select
                value={selectedSuccessorId}
                onChange={(e) => setSelectedSuccessorId(e.target.value)}
                className="mt-1 w-full rounded-xl border border-outline-variant bg-surface px-3 py-2 text-xs text-on-surface outline-none focus:border-primary"
              >
                <option value="">-- No successor selected --</option>
                {nonManagerMembers.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.displayName} ({m.room || 'Member'})
                  </option>
                ))}
              </select>
            </div>
          )}

          {!confirmResign ? (
            <button
              type="button"
              disabled={isSoleManager && !successor}
              onClick={() => setConfirmResign(true)}
              className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-error px-3.5 py-2 text-xs font-bold text-on-error disabled:cursor-not-allowed disabled:opacity-45"
            >
              Resign Manager Role
            </button>
          ) : (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  onResign(successor);
                  setConfirmResign(false);
                  onClose();
                }}
                className="inline-flex items-center gap-1.5 rounded-xl bg-error px-3.5 py-2 text-xs font-bold text-on-error"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                Confirm Resignation
              </button>
              <button
                type="button"
                onClick={() => setConfirmResign(false)}
                className="rounded-xl border border-outline-variant bg-surface px-3 py-2 text-xs font-semibold text-on-surface"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

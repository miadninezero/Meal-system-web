import React, { useMemo, useState } from 'react';
import {
  Bell,
  ChevronDown,
  ChevronUp,
  Edit2,
  Plus,
  Receipt,
  Trash2,
} from 'lucide-react';
import { Modal } from '../components/Modal';
import { NotificationsDialog } from '../components/NotificationsDialog';
import { useMess } from '../context/MessContext';
import {
  BillAllocationType,
  BillPaymentStatus,
  Member,
  SharedBill,
  getSharedBillMemberDue,
  getSharedBillMemberPaid,
  getSharedBillMemberShare,
  getSharedBillMemberStatus,
  getSharedBillOutstandingBalance,
  getSharedBillStatusCounts,
  getSharedBillTotalCollected,
} from '../types/mess';
import { DhakaTimeHelper, formatTaka } from '../utils/dhakaTime';

const QUICK_BILL_TITLES = [
  'Chef Bill',
  'Gas Bill',
  'WiFi Bill',
  'Electricity',
  'Housemaid',
  'Filter Water',
];

const PAYMENT_METHODS = ['Cash', 'bKash', 'Nagad', 'Bank'];

export const SharedBillsScreen: React.FC = () => {
  const {
    isManager,
    members,
    sharedBills,
    summary,
    notifications,
    unreadNotificationsCount,
    currentUserId,
    todayDhakaDate,
    createSharedBill,
    updateSharedBill,
    deleteSharedBill,
    recordBillPayment,
    markNotificationAsRead,
    markAllNotificationsAsRead,
  } = useMess();

  const [filterMode, setFilterMode] = useState<'ALL' | 'DUE' | 'PAID'>('ALL');
  const [expandedBills, setExpandedBills] = useState<Record<string, boolean>>({});
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [billToEdit, setBillToEdit] = useState<SharedBill | null>(null);
  const [billToDelete, setBillToDelete] = useState<SharedBill | null>(null);
  const [paymentTarget, setPaymentTarget] = useState<{
    bill: SharedBill;
    memberId: string;
    memberName: string;
    share: number;
    currentPaid: number;
  } | null>(null);
  const [showNotifModal, setShowNotifModal] = useState(false);

  const currentMember = members.find((m) => m.userId === currentUserId);
  const myMemberId = currentMember?.id || currentUserId;

  const myDueTotal = useMemo(
    () => sharedBills.reduce((s, b) => s + getSharedBillMemberDue(b, myMemberId), 0),
    [sharedBills, myMemberId],
  );
  const myPaidTotal = useMemo(
    () => sharedBills.reduce((s, b) => s + getSharedBillMemberPaid(b, myMemberId), 0),
    [sharedBills, myMemberId],
  );
  const myShareTotal = useMemo(
    () => sharedBills.reduce((s, b) => s + getSharedBillMemberShare(b, myMemberId), 0),
    [sharedBills, myMemberId],
  );

  const filteredBills = useMemo(() => {
    if (filterMode === 'DUE') {
      return sharedBills.filter((b) => getSharedBillOutstandingBalance(b) > 0.01);
    }
    if (filterMode === 'PAID') {
      return sharedBills.filter((b) => getSharedBillOutstandingBalance(b) <= 0.01);
    }
    return sharedBills;
  }, [sharedBills, filterMode]);

  const collectionPercent =
    summary.totalSharedBills > 0
      ? Math.min(100, Math.round((summary.totalSharedBillsCollected / summary.totalSharedBills) * 100))
      : 0;

  return (
    <div className="mx-auto max-w-5xl space-y-5 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-on-surface">
            Shared Mess Bills
          </h1>
          <p className="text-xs text-on-surface-variant">
            Publish fixed, equal, or custom member bills and track individual collection.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowNotifModal(true)}
            className="relative inline-flex items-center gap-1.5 rounded-2xl border border-outline-variant bg-surface px-3.5 py-2 text-xs font-bold text-on-surface hover:bg-surface-low"
          >
            <Bell className="h-4 w-4 text-primary" />
            <span>Inbox</span>
            {unreadNotificationsCount > 0 && (
              <span className="rounded-full bg-error px-1.5 py-0.5 text-[10px] font-bold text-on-error">
                {unreadNotificationsCount}
              </span>
            )}
          </button>

          {isManager && (
            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-1.5 rounded-2xl bg-primary px-4 py-2.5 text-sm font-bold text-on-primary shadow-sm transition-opacity hover:opacity-95"
            >
              <Plus className="h-4.5 w-4.5" />
              <span>Create Bill</span>
            </button>
          )}
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-3xl border border-outline-variant/80 bg-surface p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
              COLLECTION OVERVIEW
            </p>
            <span className="rounded-lg bg-tertiary-container px-2 py-0.5 tabular-nums text-xs font-bold text-on-tertiary-container">
              {collectionPercent}% Collected
            </span>
          </div>
          <p className="mt-1 tabular-nums text-3xl font-extrabold text-on-surface">
            {formatTaka(summary.totalSharedBills)}
          </p>
          <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-surface-low">
            <div
              className="h-full rounded-full bg-secondary transition-all"
              style={{ width: `${collectionPercent}%` }}
            />
          </div>
          <div className="mt-3 flex justify-between text-xs text-on-surface-variant">
            <span>
              Collected:{' '}
              <strong className="tabular-nums text-secondary">
                {formatTaka(summary.totalSharedBillsCollected)}
              </strong>
            </span>
            <span>
              Outstanding:{' '}
              <strong className="tabular-nums text-error">
                {formatTaka(summary.totalSharedBillsUnpaid)}
              </strong>
            </span>
          </div>
        </div>

        <div className="rounded-3xl border border-outline-variant/80 bg-surface p-5 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
            MY BILL STATUS
          </p>
          <p
            className={`mt-1 tabular-nums text-3xl font-extrabold ${
              myDueTotal > 0.01 ? 'text-error' : 'text-secondary'
            }`}
          >
            {myDueTotal > 0.01 ? `${formatTaka(myDueTotal)} Due` : 'All Clear'}
          </p>
          <div className="mt-4 grid grid-cols-2 gap-3 border-t border-outline-variant/60 pt-3 text-xs">
            <div>
              <p className="text-on-surface-variant">My Total Share</p>
              <p className="tabular-nums font-bold text-on-surface">{formatTaka(myShareTotal)}</p>
            </div>
            <div>
              <p className="text-on-surface-variant">My Total Paid</p>
              <p className="tabular-nums font-bold text-secondary">{formatTaka(myPaidTotal)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-base font-extrabold text-on-surface">
          Published Bills ({filteredBills.length})
        </h2>
        <div className="flex gap-2">
          {(['ALL', 'DUE', 'PAID'] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setFilterMode(mode)}
              className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition-colors ${
                filterMode === mode
                  ? 'bg-primary text-on-primary'
                  : 'border border-outline-variant bg-surface text-on-surface-variant'
              }`}
            >
              {mode === 'ALL' ? 'All' : mode === 'DUE' ? 'Due' : 'Paid'}
            </button>
          ))}
        </div>
      </div>

      {/* Bills List */}
      {filteredBills.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-outline-variant bg-surface-low/60 px-6 py-12 text-center">
          <Receipt className="h-9 w-9 text-on-surface-variant/60" />
          <p className="mt-3 text-sm font-bold text-on-surface">No shared bills found</p>
          <p className="mt-1 text-xs text-on-surface-variant">
            {isManager
              ? 'Use "Create Bill" to publish Gas, WiFi, Chef, or Utility bills to members.'
              : 'Managers will publish shared utility bills here.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredBills.map((bill) => {
            const collected = getSharedBillTotalCollected(bill);
            const outstanding = getSharedBillOutstandingBalance(bill);
            const counts = getSharedBillStatusCounts(bill);
            const isExpanded = Boolean(expandedBills[bill.id]);
            const myShare = getSharedBillMemberShare(bill, myMemberId);
            const myStatus = getSharedBillMemberStatus(bill, myMemberId);

            return (
              <div
                key={bill.id}
                className="overflow-hidden rounded-3xl border border-outline-variant/80 bg-surface shadow-xs"
              >
                <div className="p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-extrabold text-on-surface">{bill.title}</h3>
                        <span className="rounded-lg bg-tertiary-container px-2 py-0.5 text-[10px] font-bold text-on-tertiary-container">
                          {bill.allocationType === BillAllocationType.FIXED_PER_MEMBER
                            ? 'Fixed/Member'
                            : bill.allocationType === BillAllocationType.CUSTOM_PER_MEMBER
                              ? 'Custom'
                              : 'Equal Split'}
                        </span>
                        {myShare > 0 && (
                          <span
                            className={`rounded-lg px-2 py-0.5 text-[10px] font-bold ${
                              myStatus === BillPaymentStatus.PAID
                                ? 'bg-secondary-container text-on-secondary-container'
                                : myStatus === BillPaymentStatus.PARTIALLY_PAID
                                  ? 'bg-primary-container text-on-primary-container'
                                  : 'bg-error-container text-on-error-container'
                            }`}
                          >
                            My Share: {formatTaka(myShare)} ({myStatus.replace('_', ' ')})
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-on-surface-variant">
                        Deadline: {DhakaTimeHelper.formatReadableDate(bill.deadline)} · {counts.paid} paid ·{' '}
                        {counts.partial} partial · {counts.unpaid} unpaid
                      </p>
                      {bill.notes && (
                        <p className="mt-1 text-xs text-on-surface-variant">{bill.notes}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <p className="tabular-nums text-lg font-extrabold text-on-surface">
                          {formatTaka(bill.totalAmount)}
                        </p>
                        <p className="tabular-nums text-[11px] font-semibold text-secondary">
                          {formatTaka(collected)} collected
                          {outstanding > 0.01 ? ` · ${formatTaka(outstanding)} due` : ''}
                        </p>
                      </div>
                      {isManager && (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setBillToEdit(bill)}
                            aria-label="Edit shared bill"
                            className="rounded-xl p-2 text-on-surface-variant hover:bg-surface-low hover:text-primary"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setBillToDelete(bill)}
                            aria-label="Delete shared bill"
                            className="rounded-xl p-2 text-on-surface-variant hover:bg-error-container/40 hover:text-error"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setExpandedBills((prev) => ({ ...prev, [bill.id]: !isExpanded }))
                    }
                    className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline"
                  >
                    <span>Member Shares &amp; Payments ({bill.assignedMemberIds.length})</span>
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </button>
                </div>

                {isExpanded && (
                  <div className="space-y-2 border-t border-outline-variant/60 bg-surface-low/60 px-5 py-4">
                    {bill.assignedMemberIds.map((memId) => {
                      const name =
                        bill.memberNames[memId] ||
                        members.find((m) => m.id === memId)?.displayName ||
                        'Member';
                      const share = getSharedBillMemberShare(bill, memId);
                      const paid = getSharedBillMemberPaid(bill, memId);
                      const status = getSharedBillMemberStatus(bill, memId);
                      const payRec = bill.payments[memId];

                      return (
                        <div
                          key={memId}
                          className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-outline-variant/70 bg-surface px-3.5 py-2.5"
                        >
                          <div>
                            <p className="text-xs font-bold text-on-surface">{name}</p>
                            <p className="text-[11px] text-on-surface-variant">
                              Share: <strong className="tabular-nums">{formatTaka(share)}</strong> · Paid:{' '}
                              <strong className="tabular-nums">{formatTaka(paid)}</strong>
                              {payRec?.paymentMethod && paid > 0 ? ` (${payRec.paymentMethod})` : ''}
                            </p>
                          </div>

                          <div className="flex items-center gap-2">
                            <span
                              className={`rounded-lg px-2 py-0.5 text-[10px] font-bold ${
                                status === BillPaymentStatus.PAID
                                  ? 'bg-secondary-container text-on-secondary-container'
                                  : status === BillPaymentStatus.PARTIALLY_PAID
                                    ? 'bg-primary-container text-on-primary-container'
                                    : 'bg-error-container text-on-error-container'
                              }`}
                            >
                              {status.replace('_', ' ')}
                            </span>
                            {isManager && (
                              <button
                                type="button"
                                onClick={() =>
                                  setPaymentTarget({
                                    bill,
                                    memberId: memId,
                                    memberName: name,
                                    share,
                                    currentPaid: paid,
                                  })
                                }
                                className="rounded-xl bg-primary px-2.5 py-1 text-xs font-bold text-on-primary hover:opacity-90"
                              >
                                Record
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Create Shared Bill Modal */}
      {showCreateModal && (
        <CreateSharedBillModal
          open={true}
          onClose={() => setShowCreateModal(false)}
          activeMembers={members.filter((m) => m.isActive)}
          todayDhakaDate={todayDhakaDate}
          onSubmit={(title, alloc, amount, deadline, notes, customShares) => {
            createSharedBill(title, alloc, amount, deadline, notes, customShares);
            setShowCreateModal(false);
          }}
        />
      )}

      {/* Edit Shared Bill Modal */}
      {billToEdit && (
        <EditSharedBillModal
          open={true}
          onClose={() => setBillToEdit(null)}
          bill={billToEdit}
          members={members}
          onSubmit={(updated, shares) => {
            updateSharedBill(updated, shares);
            setBillToEdit(null);
          }}
        />
      )}

      {/* Record Payment Modal */}
      {paymentTarget && (
        <RecordPaymentModal
          open={true}
          onClose={() => setPaymentTarget(null)}
          target={paymentTarget}
          todayDhakaDate={todayDhakaDate}
          onSubmit={(amountPaid, method, date, notes) => {
            recordBillPayment(
              paymentTarget.bill.id,
              paymentTarget.memberId,
              paymentTarget.memberName,
              paymentTarget.share,
              amountPaid,
              method,
              date,
              notes,
            );
            setPaymentTarget(null);
          }}
        />
      )}

      {/* Delete Confirmation */}
      <Modal
        open={Boolean(billToDelete)}
        onClose={() => setBillToDelete(null)}
        title="Delete Shared Bill?"
        maxWidthClass="max-w-sm"
        footer={
          <>
            <button
              type="button"
              onClick={() => setBillToDelete(null)}
              className="rounded-xl border border-outline-variant px-4 py-2 text-xs font-semibold text-on-surface"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                if (billToDelete) {
                  deleteSharedBill(billToDelete);
                  setBillToDelete(null);
                }
              }}
              className="rounded-xl bg-error px-4 py-2 text-xs font-bold text-on-error"
            >
              Delete
            </button>
          </>
        }
      >
        <p className="text-sm text-on-surface-variant">
          Delete <strong className="text-on-surface">{billToDelete?.title}</strong> (
          <strong className="tabular-nums text-on-surface">
            {formatTaka(billToDelete?.totalAmount ?? 0)}
          </strong>
          )? Payment tracking for this bill will also be removed.
        </p>
      </Modal>

      {/* Notifications Modal */}
      <NotificationsDialog
        open={showNotifModal}
        onClose={() => setShowNotifModal(false)}
        notifications={notifications}
        unreadCount={unreadNotificationsCount}
        onMarkAsRead={markNotificationAsRead}
        onMarkAllRead={markAllNotificationsAsRead}
      />
    </div>
  );
};

const CreateSharedBillModal: React.FC<{
  open: boolean;
  onClose: () => void;
  activeMembers: Member[];
  todayDhakaDate: string;
  onSubmit: (
    title: string,
    allocationType: BillAllocationType,
    amountInput: number,
    deadline: string,
    notes: string,
    customShares: Record<string, number>,
  ) => void;
}> = ({ open, onClose, activeMembers, todayDhakaDate, onSubmit }) => {
  const [title, setTitle] = useState('');
  const [allocationType, setAllocationType] = useState<BillAllocationType>(
    BillAllocationType.DIVIDED_EQUALLY,
  );
  const [amountStr, setAmountStr] = useState('');
  const [bulkCustomStr, setBulkCustomStr] = useState('');
  const [customShareStrings, setCustomShareStrings] = useState<Record<string, string>>(() =>
    Object.fromEntries(activeMembers.map((m) => [m.id, ''])),
  );
  const [deadline, setDeadline] = useState(DhakaTimeHelper.shiftDate(todayDhakaDate, 7));
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  const parsedAmount = Number.parseFloat(amountStr) || 0;
  const customSharesNumeric = useMemo(() => {
    const out: Record<string, number> = {};
    for (const m of activeMembers) {
      const val = Number.parseFloat(customShareStrings[m.id] ?? '');
      out[m.id] = Number.isNaN(val) || val < 0 ? 0 : val;
    }
    return out;
  }, [activeMembers, customShareStrings]);

  const previewTotal =
    allocationType === BillAllocationType.CUSTOM_PER_MEMBER
      ? Object.values(customSharesNumeric).reduce((a, b) => a + b, 0)
      : allocationType === BillAllocationType.FIXED_PER_MEMBER
        ? parsedAmount * activeMembers.length
        : parsedAmount;

  const previewPerMember =
    activeMembers.length > 0 ? previewTotal / activeMembers.length : 0;

  const handleApplyAllCustom = () => {
    const val = Number.parseFloat(bulkCustomStr);
    if (Number.isNaN(val) || val < 0) return;
    setCustomShareStrings(
      Object.fromEntries(activeMembers.map((m) => [m.id, String(val)])),
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Enter a bill title.');
      return;
    }
    if (
      allocationType !== BillAllocationType.CUSTOM_PER_MEMBER &&
      (Number.isNaN(parsedAmount) || parsedAmount <= 0)
    ) {
      setError('Enter a valid positive amount.');
      return;
    }
    if (allocationType === BillAllocationType.CUSTOM_PER_MEMBER && previewTotal <= 0) {
      setError('Enter positive member share amounts.');
      return;
    }
    setError('');
    onSubmit(
      title.trim(),
      allocationType,
      parsedAmount,
      deadline,
      notes.trim(),
      customSharesNumeric,
    );
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Publish Shared Bill"
      subtitle={`Assigns shares to ${activeMembers.length} active members`}
      maxWidthClass="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-on-surface-variant">Bill Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Chef Bill"
            className="w-full rounded-xl border border-outline-variant bg-surface-low px-3.5 py-2 text-sm text-on-surface"
          />
          <div className="flex flex-wrap gap-1.5 pt-1">
            {QUICK_BILL_TITLES.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTitle(t)}
                className="rounded-lg border border-outline-variant bg-surface-low px-2.5 py-1 text-[11px] font-semibold text-on-surface-variant hover:border-primary hover:text-primary"
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-on-surface-variant">
            Allocation Mode
          </label>
          <div className="grid grid-cols-3 gap-1.5">
            {(
              [
                [BillAllocationType.DIVIDED_EQUALLY, 'Divide Equally'],
                [BillAllocationType.FIXED_PER_MEMBER, 'Fixed / Member'],
                [BillAllocationType.CUSTOM_PER_MEMBER, 'Custom Shares'],
              ] as const
            ).map(([type, label]) => (
              <button
                key={type}
                type="button"
                onClick={() => setAllocationType(type)}
                className={`rounded-xl py-2 text-[11px] font-bold transition-colors ${
                  allocationType === type
                    ? 'bg-primary text-on-primary'
                    : 'border border-outline-variant bg-surface-low text-on-surface-variant'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {allocationType !== BillAllocationType.CUSTOM_PER_MEMBER ? (
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-on-surface-variant">
              {allocationType === BillAllocationType.FIXED_PER_MEMBER
                ? 'Amount Per Member (৳)'
                : 'Total Bill Amount (৳)'}
            </label>
            <input
              type="number"
              step="any"
              min="0"
              value={amountStr}
              onChange={(e) => setAmountStr(e.target.value)}
              placeholder="e.g., 3000"
              className="w-full rounded-xl border border-outline-variant bg-surface-low px-3.5 py-2 text-sm text-on-surface"
            />
          </div>
        ) : (
          <div className="space-y-2.5 rounded-2xl border border-outline-variant/70 bg-surface-low p-3">
            <div className="flex items-center gap-2">
              <input
                type="number"
                step="any"
                min="0"
                value={bulkCustomStr}
                onChange={(e) => setBulkCustomStr(e.target.value)}
                placeholder="Bulk amount"
                className="flex-1 rounded-xl border border-outline-variant bg-surface px-3 py-1.5 text-xs text-on-surface"
              />
              <button
                type="button"
                onClick={handleApplyAllCustom}
                className="rounded-xl bg-secondary px-3 py-1.5 text-xs font-bold text-on-secondary"
              >
                Set All
              </button>
            </div>
            <div className="max-h-40 space-y-1.5 overflow-y-auto pr-1">
              {activeMembers.map((m) => (
                <div key={m.id} className="flex items-center justify-between gap-2">
                  <span className="truncate text-xs font-semibold text-on-surface">
                    {m.displayName}
                  </span>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={customShareStrings[m.id] ?? ''}
                    onChange={(e) =>
                      setCustomShareStrings((prev) => ({ ...prev, [m.id]: e.target.value }))
                    }
                    placeholder="0"
                    className="w-28 rounded-lg border border-outline-variant bg-surface px-2.5 py-1 text-right text-xs text-on-surface"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Live Calculation Preview */}
        <div className="rounded-2xl bg-primary-container/35 px-4 py-2.5 text-xs">
          <div className="flex justify-between font-bold text-on-primary-container">
            <span>Total Bill: {formatTaka(previewTotal)}</span>
            <span>Avg/Member: {formatTaka(previewPerMember)}</span>
          </div>
        </div>

        {/* Deadline */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-on-surface-variant">
            Payment Deadline
          </label>
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setDeadline(DhakaTimeHelper.shiftDate(todayDhakaDate, 7))}
              className="rounded-lg border border-outline-variant bg-surface-low px-2.5 py-1 text-[11px] font-bold text-on-surface"
            >
              +7 Days
            </button>
            <button
              type="button"
              onClick={() => setDeadline(DhakaTimeHelper.shiftDate(todayDhakaDate, 14))}
              className="rounded-lg border border-outline-variant bg-surface-low px-2.5 py-1 text-[11px] font-bold text-on-surface"
            >
              +14 Days
            </button>
            <button
              type="button"
              onClick={() => setDeadline(DhakaTimeHelper.getMonthEndDhakaDate())}
              className="rounded-lg border border-outline-variant bg-surface-low px-2.5 py-1 text-[11px] font-bold text-on-surface"
            >
              Month End
            </button>
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="flex-1 rounded-xl border border-outline-variant bg-surface-low px-3 py-1 text-xs text-on-surface"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-on-surface-variant">
            Notes (Optional)
          </label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g., Pay via bKash or Cash to Manager"
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
            className="rounded-xl bg-primary px-5 py-2 text-xs font-bold text-on-primary"
          >
            Publish Bill
          </button>
        </div>
      </form>
    </Modal>
  );
};

const EditSharedBillModal: React.FC<{
  open: boolean;
  onClose: () => void;
  bill: SharedBill;
  members: Member[];
  onSubmit: (updatedBill: SharedBill, updatedShares: Record<string, number> | null) => void;
}> = ({ open, onClose, bill, members, onSubmit }) => {
  const [title, setTitle] = useState(bill.title);
  const [deadline, setDeadline] = useState(bill.deadline);
  const [notes, setNotes] = useState(bill.notes);
  const [shareStrings, setShareStrings] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      bill.assignedMemberIds.map((id) => [
        id,
        String(bill.memberShares[id] ?? bill.perMemberAmount),
      ]),
    ),
  );

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    const numericShares: Record<string, number> = {};
    for (const id of bill.assignedMemberIds) {
      const val = Number.parseFloat(shareStrings[id] ?? '0');
      numericShares[id] = Number.isNaN(val) || val < 0 ? 0 : val;
    }
    onSubmit(
      { ...bill, title: title.trim(), deadline, notes: notes.trim() },
      numericShares,
    );
  };

  return (
    <Modal open={open} onClose={onClose} title="Edit Shared Bill" maxWidthClass="max-w-md">
      <form onSubmit={handleSave} className="space-y-4">
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-on-surface-variant">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-xl border border-outline-variant bg-surface-low px-3.5 py-2 text-sm text-on-surface"
          />
        </div>
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-on-surface-variant">Deadline</label>
          <input
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            className="w-full rounded-xl border border-outline-variant bg-surface-low px-3.5 py-2 text-sm text-on-surface"
          />
        </div>
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-on-surface-variant">Notes</label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full rounded-xl border border-outline-variant bg-surface-low px-3.5 py-2 text-sm text-on-surface"
          />
        </div>

        <div className="space-y-2 rounded-2xl border border-outline-variant/70 bg-surface-low p-3">
          <p className="text-xs font-bold text-on-surface">Member Shares (৳)</p>
          <div className="max-h-44 space-y-1.5 overflow-y-auto pr-1">
            {bill.assignedMemberIds.map((id) => {
              const name =
                bill.memberNames[id] ||
                members.find((m) => m.id === id)?.displayName ||
                id;
              return (
                <div key={id} className="flex items-center justify-between gap-2">
                  <span className="truncate text-xs text-on-surface">{name}</span>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={shareStrings[id] ?? ''}
                    onChange={(e) =>
                      setShareStrings((prev) => ({ ...prev, [id]: e.target.value }))
                    }
                    className="w-28 rounded-lg border border-outline-variant bg-surface px-2.5 py-1 text-right text-xs text-on-surface"
                  />
                </div>
              );
            })}
          </div>
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
            type="submit"
            className="rounded-xl bg-primary px-5 py-2 text-xs font-bold text-on-primary"
          >
            Save Changes
          </button>
        </div>
      </form>
    </Modal>
  );
};

const RecordPaymentModal: React.FC<{
  open: boolean;
  onClose: () => void;
  target: {
    bill: SharedBill;
    memberId: string;
    memberName: string;
    share: number;
    currentPaid: number;
  };
  todayDhakaDate: string;
  onSubmit: (amountPaid: number, method: string, date: string, notes: string) => void;
}> = ({ open, onClose, target, todayDhakaDate, onSubmit }) => {
  const [amountStr, setAmountStr] = useState(
    target.currentPaid > 0 ? String(target.currentPaid) : String(target.share),
  );
  const [method, setMethod] = useState(
    target.bill.payments[target.memberId]?.paymentMethod || 'Cash',
  );
  const [date, setDate] = useState(
    target.bill.payments[target.memberId]?.paymentDate || todayDhakaDate,
  );
  const [notes, setNotes] = useState(
    target.bill.payments[target.memberId]?.notes || '',
  );

  const amountPaid = Math.max(0, Number.parseFloat(amountStr) || 0);
  const liveStatus =
    amountPaid >= target.share && target.share > 0
      ? 'PAID'
      : amountPaid > 0
        ? 'PARTIALLY PAID'
        : 'UNPAID';

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Record Payment: ${target.memberName}`}
      subtitle={`${target.bill.title} · Assigned Share: ${formatTaka(target.share)}`}
      maxWidthClass="max-w-md"
    >
      <div className="space-y-4">
        <div
          className={`rounded-2xl px-4 py-2.5 text-xs font-bold ${
            liveStatus === 'PAID'
              ? 'bg-secondary-container text-on-secondary-container'
              : liveStatus === 'PARTIALLY PAID'
                ? 'bg-primary-container text-on-primary-container'
                : 'bg-error-container text-on-error-container'
          }`}
        >
          Status Preview: {liveStatus}
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setAmountStr(String(target.share))}
            className="flex-1 rounded-xl border border-secondary/50 bg-secondary-container/40 py-2 text-xs font-bold text-on-secondary-container"
          >
            Pay Full ({formatTaka(target.share)})
          </button>
          <button
            type="button"
            onClick={() => setAmountStr('0')}
            className="flex-1 rounded-xl border border-error/40 bg-error-container/35 py-2 text-xs font-bold text-on-error-container"
          >
            Mark Unpaid (৳0)
          </button>
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-on-surface-variant">
            Amount Paid (৳)
          </label>
          <input
            type="number"
            step="any"
            min="0"
            value={amountStr}
            onChange={(e) => setAmountStr(e.target.value)}
            className="w-full rounded-xl border border-outline-variant bg-surface-low px-3.5 py-2 text-sm text-on-surface"
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-on-surface-variant">Method</label>
          <div className="flex flex-wrap gap-1.5">
            {PAYMENT_METHODS.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMethod(m)}
                className={`rounded-xl px-3 py-1.5 text-xs font-bold ${
                  method === m
                    ? 'bg-primary text-on-primary'
                    : 'border border-outline-variant bg-surface-low text-on-surface-variant'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-on-surface-variant">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-xl border border-outline-variant bg-surface-low px-3 py-1.5 text-xs text-on-surface"
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-on-surface-variant">Notes</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional"
              className="w-full rounded-xl border border-outline-variant bg-surface-low px-3 py-1.5 text-xs text-on-surface"
            />
          </div>
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
            onClick={() => onSubmit(amountPaid, method, date, notes.trim())}
            className="rounded-xl bg-primary px-5 py-2 text-xs font-bold text-on-primary"
          >
            Save Payment
          </button>
        </div>
      </div>
    </Modal>
  );
};

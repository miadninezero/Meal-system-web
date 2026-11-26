import React, { useState } from 'react';
import { Edit2, Info, Plus, Trash2, Wallet } from 'lucide-react';
import { Modal } from '../components/Modal';
import { useMess } from '../context/MessContext';
import { Deposit, Member } from '../types/mess';
import { DhakaTimeHelper, formatTaka } from '../utils/dhakaTime';

const DEPOSIT_METHODS = ['Cash', 'bKash / Mobile', 'Bank Transfer', 'UPI'];

export const DepositsScreen: React.FC = () => {
  const {
    isManager,
    members,
    deposits,
    summary,
    todayDhakaDate,
    addDeposit,
    updateDeposit,
    deleteDeposit,
  } = useMess();

  const [showAddModal, setShowAddModal] = useState(false);
  const [depositToEdit, setDepositToEdit] = useState<Deposit | null>(null);
  const [depositToDelete, setDepositToDelete] = useState<Deposit | null>(null);

  return (
    <div className="mx-auto max-w-5xl space-y-5 p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-on-surface">
            Advance Deposits Ledger
          </h1>
          <p className="text-xs text-on-surface-variant">
            Advance cash &amp; mobile funds contributed by mess members.
          </p>
        </div>
        {isManager && (
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-1.5 rounded-2xl bg-secondary px-4 py-2.5 text-sm font-bold text-on-secondary shadow-sm transition-opacity hover:opacity-95"
          >
            <Plus className="h-4.5 w-4.5" />
            <span>Add Deposit</span>
          </button>
        )}
      </div>

      {!isManager && (
        <div className="flex items-center gap-2.5 rounded-2xl border border-tertiary/40 bg-tertiary-container/30 px-4 py-3 text-xs font-semibold text-on-tertiary-container">
          <Info className="h-4 w-4 shrink-0" />
          <span>Read-only ledger view. Only Mess Managers can record or edit deposits.</span>
        </div>
      )}

      {/* Hero Card */}
      <div className="rounded-3xl bg-secondary p-5 text-on-secondary shadow-sm">
        <p className="text-[11px] font-bold uppercase tracking-wider opacity-85">
          TOTAL POOLED ADVANCE DEPOSITS
        </p>
        <p className="mt-1 tabular-nums text-3xl font-extrabold">
          {formatTaka(summary.totalDeposits)}
        </p>
        <p className="mt-1 text-xs opacity-85">
          {deposits.length} deposit record{deposits.length === 1 ? '' : 's'}
        </p>
      </div>

      {/* Deposits List */}
      {deposits.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-outline-variant bg-surface-low/60 px-6 py-12 text-center">
          <Wallet className="h-9 w-9 text-on-surface-variant/60" />
          <p className="mt-3 text-sm font-bold text-on-surface">No deposits recorded yet</p>
          <p className="mt-1 text-xs text-on-surface-variant">
            {isManager
              ? 'Use "Add Deposit" whenever a member submits advance mess money.'
              : 'Your advance deposits recorded by the manager will appear here.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {deposits.map((dep) => (
            <div
              key={dep.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-outline-variant/80 bg-surface p-4 shadow-xs"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-extrabold text-on-surface">{dep.memberName}</span>
                  <span className="rounded-lg bg-secondary-container px-2 py-0.5 text-[10px] font-bold text-on-secondary-container">
                    {dep.paymentMethod}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-on-surface-variant">
                  {DhakaTimeHelper.formatReadableDate(dep.date)}
                  {dep.notes ? ` · ${dep.notes}` : ''}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span className="tabular-nums text-lg font-extrabold text-secondary">
                  {formatTaka(dep.amount)}
                </span>
                {isManager && (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setDepositToEdit(dep)}
                      aria-label="Edit deposit"
                      className="rounded-xl p-2 text-on-surface-variant hover:bg-surface-low hover:text-primary"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDepositToDelete(dep)}
                      aria-label="Delete deposit"
                      className="rounded-xl p-2 text-on-surface-variant hover:bg-error-container/40 hover:text-error"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showAddModal && (
        <DepositFormModal
          open={true}
          onClose={() => setShowAddModal(false)}
          title="Record Member Deposit"
          members={members}
          todayDhakaDate={todayDhakaDate}
          onSubmit={(memberId, memberName, amount, method, notes, date) => {
            addDeposit(memberId, memberName, amount, method, notes, date);
            setShowAddModal(false);
          }}
        />
      )}

      {depositToEdit && (
        <DepositFormModal
          open={true}
          onClose={() => setDepositToEdit(null)}
          title="Edit Deposit Record"
          members={members}
          todayDhakaDate={todayDhakaDate}
          initialDeposit={depositToEdit}
          onSubmit={(memberId, memberName, amount, method, notes, date) => {
            updateDeposit({
              ...depositToEdit,
              memberId,
              memberName,
              amount,
              paymentMethod: method,
              notes,
              date,
            });
            setDepositToEdit(null);
          }}
        />
      )}

      <Modal
        open={Boolean(depositToDelete)}
        onClose={() => setDepositToDelete(null)}
        title="Delete Deposit?"
        maxWidthClass="max-w-sm"
        footer={
          <>
            <button
              type="button"
              onClick={() => setDepositToDelete(null)}
              className="rounded-xl border border-outline-variant px-4 py-2 text-xs font-semibold text-on-surface"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                if (depositToDelete) {
                  deleteDeposit(depositToDelete);
                  setDepositToDelete(null);
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
          Remove deposit of{' '}
          <strong className="tabular-nums text-on-surface">
            {formatTaka(depositToDelete?.amount ?? 0)}
          </strong>{' '}
          for <strong className="text-on-surface">{depositToDelete?.memberName}</strong>?
        </p>
      </Modal>
    </div>
  );
};

const DepositFormModal: React.FC<{
  open: boolean;
  onClose: () => void;
  title: string;
  members: Member[];
  todayDhakaDate: string;
  initialDeposit?: Deposit;
  onSubmit: (
    memberId: string,
    memberName: string,
    amount: number,
    method: string,
    notes: string,
    date: string,
  ) => void;
}> = ({ open, onClose, title, members, todayDhakaDate, initialDeposit, onSubmit }) => {
  const [selectedMemberId, setSelectedMemberId] = useState(
    initialDeposit?.memberId || members[0]?.id || '',
  );
  const [amountStr, setAmountStr] = useState(
    initialDeposit ? String(initialDeposit.amount) : '',
  );
  const [method, setMethod] = useState(initialDeposit?.paymentMethod || DEPOSIT_METHODS[0]);
  const [date, setDate] = useState(initialDeposit?.date || todayDhakaDate);
  const [notes, setNotes] = useState(initialDeposit?.notes || '');
  const [error, setError] = useState('');

  const yesterdayDate = DhakaTimeHelper.shiftDate(todayDhakaDate, -1);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const member = members.find((m) => m.id === selectedMemberId);
    if (!member) {
      setError('Select a member.');
      return;
    }
    const amount = Number.parseFloat(amountStr);
    if (Number.isNaN(amount) || amount <= 0) {
      setError('Enter a valid positive deposit amount.');
      return;
    }
    setError('');
    onSubmit(member.id, member.displayName, amount, method, notes.trim(), date);
  };

  return (
    <Modal open={open} onClose={onClose} title={title} maxWidthClass="max-w-md">
      <form onSubmit={handleSave} className="space-y-4">
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-on-surface-variant">Member</label>
          <select
            value={selectedMemberId}
            onChange={(e) => setSelectedMemberId(e.target.value)}
            className="w-full rounded-xl border border-outline-variant bg-surface-low px-3.5 py-2.5 text-sm text-on-surface"
          >
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.displayName} ({m.room || 'Member'})
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-on-surface-variant">
            Deposit Amount (৳)
          </label>
          <input
            type="number"
            step="any"
            min="0"
            value={amountStr}
            onChange={(e) => setAmountStr(e.target.value)}
            placeholder="e.g., 3000"
            className="w-full rounded-xl border border-outline-variant bg-surface-low px-3.5 py-2.5 text-sm text-on-surface"
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-on-surface-variant">
            Payment Method
          </label>
          <div className="flex flex-wrap gap-1.5">
            {DEPOSIT_METHODS.map((pm) => (
              <button
                key={pm}
                type="button"
                onClick={() => setMethod(pm)}
                className={`rounded-xl px-3 py-1.5 text-xs font-bold ${
                  method === pm
                    ? 'bg-secondary text-on-secondary'
                    : 'border border-outline-variant bg-surface-low text-on-surface-variant'
                }`}
              >
                {pm}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-on-surface-variant">Date</label>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setDate(todayDhakaDate)}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold ${
                date === todayDhakaDate
                  ? 'bg-primary text-on-primary'
                  : 'border border-outline-variant bg-surface-low text-on-surface-variant'
              }`}
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => setDate(yesterdayDate)}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold ${
                date === yesterdayDate
                  ? 'bg-primary text-on-primary'
                  : 'border border-outline-variant bg-surface-low text-on-surface-variant'
              }`}
            >
              Yesterday
            </button>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="flex-1 rounded-xl border border-outline-variant bg-surface-low px-3 py-1.5 text-xs text-on-surface"
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
            placeholder="e.g., November advance installment"
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
            className="rounded-xl bg-secondary px-5 py-2 text-xs font-bold text-on-secondary"
          >
            Save Deposit
          </button>
        </div>
      </form>
    </Modal>
  );
};

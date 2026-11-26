import React, { useMemo, useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  ClipboardCopy,
  Edit2,
  History,
  Plus,
  Receipt,
  Trash2,
} from 'lucide-react';
import { Modal } from '../components/Modal';
import { useMess } from '../context/MessContext';
import { Screen, UtilityBill } from '../types/mess';
import { formatTaka, formatUnits } from '../utils/dhakaTime';

interface SettlementScreenProps {
  onNavigate: (screen: Screen) => void;
}

export const SettlementScreen: React.FC<SettlementScreenProps> = ({ onNavigate }) => {
  const {
    currentMess,
    isManager,
    summary,
    utilityBills,
    sharedBills,
    auditLogs,
    showUiMessage,
    addUtilityBill,
    updateUtilityBill,
    deleteUtilityBill,
  } = useMess();

  const [filterMode, setFilterMode] = useState<'ALL' | 'REFUND' | 'DUE'>('ALL');
  const [auditOpen, setAuditOpen] = useState(false);
  const [showAddUtility, setShowAddUtility] = useState(false);
  const [billToEdit, setBillToEdit] = useState<UtilityBill | null>(null);
  const [billToDelete, setBillToDelete] = useState<UtilityBill | null>(null);

  const filteredSettlements = useMemo(() => {
    if (filterMode === 'REFUND') {
      return summary.memberSettlements.filter((s) => s.netBalance >= 0);
    }
    if (filterMode === 'DUE') {
      return summary.memberSettlements.filter((s) => s.netBalance < 0);
    }
    return summary.memberSettlements;
  }, [summary.memberSettlements, filterMode]);

  const handleExportClipboard = async () => {
    const lines = [
      `=== ${currentMess?.name || 'Mess'} Monthly Settlement ===`,
      `Meal Rate: ${formatTaka(summary.mealRate)} / unit`,
      `Total Bazaar Cost: ${formatTaka(summary.totalBazaarCost)}`,
      `Total Meal Units: ${formatUnits(summary.totalUnits)}`,
      `Total Deposits: ${formatTaka(summary.totalDeposits)}`,
      `Shared Bills: ${formatTaka(summary.totalSharedBills)} (Collected: ${formatTaka(summary.totalSharedBillsCollected)})`,
      `Legacy Utilities: ${formatTaka(summary.totalUtilities)}`,
      `Remaining Fund: ${formatTaka(summary.remainingFund)}`,
      '',
      '--- Member Balances ---',
      ...summary.memberSettlements.map(
        (m) =>
          `${m.memberName}: Units=${formatUnits(m.totalUnits)} (M:${formatUnits(m.memberUnits)}/G:${formatUnits(m.guestUnits)}), Cost=${formatTaka(m.totalCost)}, Deposit=${formatTaka(m.totalDeposit)}, Net=${m.isRefund ? '+' : '-'}${formatTaka(Math.abs(m.netBalance))} (${m.isRefund ? 'REFUND' : 'DUE'})`,
      ),
    ];
    try {
      await navigator.clipboard.writeText(lines.join('\n'));
      showUiMessage('Monthly settlement statement copied to clipboard!');
    } catch {
      showUiMessage('Could not access clipboard automatically.');
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-5 p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-on-surface">
            Monthly Settlement &amp; Balance Sheet
          </h1>
          <p className="text-xs text-on-surface-variant">
            Final per-member meal cost, shared bill dues, deposits, and refunds.
          </p>
        </div>
        <button
          type="button"
          onClick={handleExportClipboard}
          className="inline-flex items-center gap-1.5 rounded-2xl bg-primary px-4 py-2.5 text-xs font-bold text-on-primary shadow-sm transition-opacity hover:opacity-95"
        >
          <ClipboardCopy className="h-4 w-4" />
          <span>Copy Statement</span>
        </button>
      </div>

      {/* Monthly Balance Sheet */}
      <div className="rounded-3xl border border-outline-variant/80 bg-surface p-5 shadow-xs">
        <h2 className="text-base font-extrabold text-on-surface">Monthly Mess Balance Sheet</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl bg-surface-low p-3.5">
            <p className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
              Final Meal Rate
            </p>
            <p className="mt-1 tabular-nums text-xl font-extrabold text-primary">
              {formatTaka(summary.mealRate)}
              <span className="text-xs font-medium text-on-surface-variant"> / unit</span>
            </p>
          </div>
          <div className="rounded-2xl bg-surface-low p-3.5">
            <p className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
              Total Bazaar Cost
            </p>
            <p className="mt-1 tabular-nums text-xl font-extrabold text-on-surface">
              {formatTaka(summary.totalBazaarCost)}
            </p>
          </div>
          <div className="rounded-2xl bg-surface-low p-3.5">
            <p className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
              Total Deposits
            </p>
            <p className="mt-1 tabular-nums text-xl font-extrabold text-secondary">
              {formatTaka(summary.totalDeposits)}
            </p>
          </div>
          <div className="rounded-2xl bg-surface-low p-3.5">
            <p className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
              Cash in Hand
            </p>
            <p
              className={`mt-1 tabular-nums text-xl font-extrabold ${
                summary.remainingFund >= 0 ? 'text-secondary' : 'text-error'
              }`}
            >
              {formatTaka(summary.remainingFund)}
            </p>
          </div>
        </div>
      </div>

      {/* Shared Bills & Legacy Utilities Bridge */}
      <div className="rounded-3xl border border-outline-variant/80 bg-surface p-5 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-extrabold text-on-surface">
              Shared Bills &amp; Utilities
            </h2>
            <p className="text-xs text-on-surface-variant">
              Unpaid shared bills are automatically factored into member settlements.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {isManager && (
              <button
                type="button"
                onClick={() => setShowAddUtility(true)}
                className="inline-flex items-center gap-1 rounded-xl border border-outline-variant bg-surface-low px-3 py-1.5 text-xs font-bold text-on-surface hover:border-primary"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Utility</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => onNavigate(Screen.SHARED_BILLS)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-tertiary-container px-3 py-1.5 text-xs font-bold text-on-tertiary-container"
            >
              <Receipt className="h-3.5 w-3.5" />
              <span>Manage Bills ({sharedBills.length})</span>
            </button>
          </div>
        </div>

        {utilityBills.length > 0 && (
          <div className="mt-4 space-y-2">
            {utilityBills.map((u) => (
              <div
                key={u.id}
                className="flex items-center justify-between rounded-2xl bg-surface-low px-3.5 py-2.5 text-xs"
              >
                <div>
                  <p className="font-bold text-on-surface">{u.title}</p>
                  <p className="text-on-surface-variant">Month: {u.month}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="tabular-nums font-extrabold text-on-surface">
                    {formatTaka(u.amount)}
                  </span>
                  {isManager && (
                    <>
                      <button
                        type="button"
                        onClick={() => setBillToEdit(u)}
                        aria-label="Edit utility bill"
                        className="rounded-lg p-1.5 text-on-surface-variant hover:text-primary"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setBillToDelete(u)}
                        aria-label="Delete utility bill"
                        className="rounded-lg p-1.5 text-on-surface-variant hover:text-error"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Individual Member Balances */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-base font-extrabold text-on-surface">
            Individual Member Balances ({filteredSettlements.length})
          </h2>
          <div className="flex gap-2">
            {(
              [
                ['ALL', 'All'],
                ['REFUND', 'Refund Due'],
                ['DUE', 'Payment Due'],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setFilterMode(key)}
                className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition-colors ${
                  filterMode === key
                    ? 'bg-primary text-on-primary'
                    : 'border border-outline-variant bg-surface text-on-surface-variant'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          {filteredSettlements.map((m) => (
            <div
              key={m.memberId}
              className="rounded-3xl border border-outline-variant/80 bg-surface p-4 shadow-xs"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-base font-extrabold text-on-surface">{m.memberName}</p>
                  <p className="tabular-nums text-xs text-on-surface-variant">
                    {formatUnits(m.totalUnits)} units (Member: {formatUnits(m.memberUnits)}, Guest:{' '}
                    {formatUnits(m.guestUnits)})
                  </p>
                </div>
                <div className="text-right">
                  <p
                    className={`tabular-nums text-lg font-extrabold ${
                      m.isRefund ? 'text-secondary' : 'text-error'
                    }`}
                  >
                    {m.isRefund ? '+' : '-'}
                    {formatTaka(Math.abs(m.netBalance))}
                  </p>
                  <span
                    className={`inline-block rounded-lg px-2 py-0.5 text-[10px] font-bold ${
                      m.isRefund
                        ? 'bg-secondary-container text-on-secondary-container'
                        : 'bg-error-container text-on-error-container'
                    }`}
                  >
                    {m.isRefund ? 'REFUND DUE' : 'PAYMENT DUE'}
                  </span>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 border-t border-outline-variant/50 pt-3 text-xs">
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Meal Cost</span>
                  <span className="tabular-nums font-bold">{formatTaka(m.mealCost)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Deposited</span>
                  <span className="tabular-nums font-bold text-secondary">
                    {formatTaka(m.totalDeposit)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Unpaid Bills</span>
                  <span className="tabular-nums font-bold">{formatTaka(m.sharedBillsUnpaid)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Utilities</span>
                  <span className="tabular-nums font-bold">{formatTaka(m.utilityCost)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Audit History & Governance Accordion */}
      <div className="rounded-3xl border border-outline-variant/80 bg-surface shadow-xs">
        <button
          type="button"
          onClick={() => setAuditOpen((o) => !o)}
          className="flex w-full items-center justify-between px-5 py-4 text-left"
        >
          <div className="flex items-center gap-2">
            <History className="h-4.5 w-4.5 text-primary" />
            <span className="text-sm font-extrabold text-on-surface">
              Audit History &amp; Governance ({auditLogs.length})
            </span>
          </div>
          {auditOpen ? (
            <ChevronUp className="h-4.5 w-4.5 text-on-surface-variant" />
          ) : (
            <ChevronDown className="h-4.5 w-4.5 text-on-surface-variant" />
          )}
        </button>

        {auditOpen && (
          <div className="space-y-2 border-t border-outline-variant/60 px-5 py-4">
            {auditLogs.length === 0 ? (
              <p className="text-xs text-on-surface-variant">No audit actions recorded yet.</p>
            ) : (
              auditLogs.slice(0, 20).map((log) => (
                <div
                  key={log.id}
                  className="rounded-2xl border border-outline-variant/60 bg-surface-low px-3.5 py-2.5 text-xs"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-bold text-primary">{log.action}</span>
                    <span className="text-[11px] text-on-surface-variant">
                      {log.timestampFormatted}
                    </span>
                  </div>
                  <p className="mt-1 text-on-surface">{log.details}</p>
                  <p className="mt-0.5 text-[11px] text-on-surface-variant">
                    By: {log.performedByName}
                    {log.reason ? ` · Reason: ${log.reason}` : ''}
                  </p>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Bottom Export Button */}
      <button
        type="button"
        onClick={handleExportClipboard}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-primary/50 bg-primary-container/30 px-4 py-3 text-sm font-bold text-on-primary-container hover:bg-primary-container/50"
      >
        <ClipboardCopy className="h-4.5 w-4.5" />
        <span>Copy &amp; Export Statement to Clipboard</span>
      </button>

      {/* Legacy Utility Bill Modals */}
      {showAddUtility && (
        <UtilityBillModal
          open={true}
          onClose={() => setShowAddUtility(false)}
          title="Add Equal Utility Bill"
          onSubmit={(t, a) => {
            addUtilityBill(t, a);
            setShowAddUtility(false);
          }}
        />
      )}

      {billToEdit && (
        <UtilityBillModal
          open={true}
          onClose={() => setBillToEdit(null)}
          title="Edit Utility Bill"
          initialBill={billToEdit}
          onSubmit={(t, a) => {
            updateUtilityBill({ ...billToEdit, title: t, amount: a });
            setBillToEdit(null);
          }}
        />
      )}

      <Modal
        open={Boolean(billToDelete)}
        onClose={() => setBillToDelete(null)}
        title="Delete Utility Bill?"
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
                  deleteUtilityBill(billToDelete);
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
          Remove <strong className="text-on-surface">{billToDelete?.title}</strong> (
          <strong className="tabular-nums text-on-surface">
            {formatTaka(billToDelete?.amount ?? 0)}
          </strong>
          )?
        </p>
      </Modal>
    </div>
  );
};

const UtilityBillModal: React.FC<{
  open: boolean;
  onClose: () => void;
  title: string;
  initialBill?: UtilityBill;
  onSubmit: (title: string, amount: number) => void;
}> = ({ open, onClose, title, initialBill, onSubmit }) => {
  const [billTitle, setBillTitle] = useState(initialBill?.title || '');
  const [amountStr, setAmountStr] = useState(initialBill ? String(initialBill.amount) : '');
  const [error, setError] = useState('');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number.parseFloat(amountStr);
    if (!billTitle.trim() || Number.isNaN(amount) || amount <= 0) {
      setError('Provide a valid title and positive amount.');
      return;
    }
    setError('');
    onSubmit(billTitle.trim(), amount);
  };

  return (
    <Modal open={open} onClose={onClose} title={title} maxWidthClass="max-w-sm">
      <form onSubmit={handleSave} className="space-y-4">
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-on-surface-variant">Title</label>
          <input
            type="text"
            value={billTitle}
            onChange={(e) => setBillTitle(e.target.value)}
            placeholder="e.g., Building Maintenance"
            className="w-full rounded-xl border border-outline-variant bg-surface-low px-3.5 py-2 text-sm text-on-surface"
          />
        </div>
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-on-surface-variant">Amount (৳)</label>
          <input
            type="number"
            step="any"
            min="0"
            value={amountStr}
            onChange={(e) => setAmountStr(e.target.value)}
            placeholder="e.g., 1500"
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
            Save Utility
          </button>
        </div>
      </form>
    </Modal>
  );
};

import React, { useMemo, useState } from 'react';
import { Edit2, Plus, ShoppingCart, Trash2 } from 'lucide-react';
import { Modal } from '../components/Modal';
import { useMess } from '../context/MessContext';
import { BazaarExpense } from '../types/mess';
import { DhakaTimeHelper, formatTaka } from '../utils/dhakaTime';

const BAZAAR_CATEGORIES = ['Groceries', 'Meat & Fish', 'Vegetables', 'Spices', 'Misc'];

export const BazaarLogScreen: React.FC = () => {
  const {
    bazaarExpenses,
    summary,
    isManager,
    currentUserId,
    members,
    todayDhakaDate,
    addBazaarExpense,
    updateBazaarExpense,
    deleteBazaarExpense,
    showUiMessage,
  } = useMess();

  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [expenseToEdit, setExpenseToEdit] = useState<BazaarExpense | null>(null);
  const [expenseToDelete, setExpenseToDelete] = useState<BazaarExpense | null>(null);

  const currentMember = members.find((m) => m.userId === currentUserId);
  const myMemberId = currentMember?.id || currentUserId;

  const filteredExpenses = useMemo(
    () =>
      selectedCategory === 'All'
        ? bazaarExpenses
        : bazaarExpenses.filter((e) => e.category === selectedCategory),
    [bazaarExpenses, selectedCategory],
  );

  const myPurchasesTotal = useMemo(
    () =>
      bazaarExpenses
        .filter((e) => e.buyerMemberId === myMemberId)
        .reduce((sum, e) => sum + e.amount, 0),
    [bazaarExpenses, myMemberId],
  );

  return (
    <div className="mx-auto max-w-5xl space-y-5 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-on-surface">
            Bazaar &amp; Grocery Log
          </h1>
          <p className="text-xs text-on-surface-variant">
            Strictly food &amp; cooking market expenses (isolated from shared utility bills).
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowAddDialog(true)}
          className="inline-flex items-center gap-1.5 rounded-2xl bg-primary px-4 py-2.5 text-sm font-bold text-on-primary shadow-sm transition-opacity hover:opacity-95"
        >
          <Plus className="h-4.5 w-4.5" />
          <span>Add Bazaar</span>
        </button>
      </div>

      {/* Dual Metric Banner */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-3xl bg-primary p-5 text-on-primary shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-wider opacity-85">
            TOTAL BAZAAR EXPENDITURE
          </p>
          <p className="mt-1 tabular-nums text-3xl font-extrabold">
            {formatTaka(summary.totalBazaarCost)}
          </p>
          <p className="mt-1 text-xs opacity-85">
            {bazaarExpenses.length} expense{bazaarExpenses.length === 1 ? '' : 's'} logged
          </p>
        </div>
        <div className="rounded-3xl border border-outline-variant/80 bg-surface p-5 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
            MY PURCHASES
          </p>
          <p className="mt-1 tabular-nums text-3xl font-extrabold text-secondary">
            {formatTaka(myPurchasesTotal)}
          </p>
          <p className="mt-1 text-xs text-on-surface-variant">
            Recorded by {currentMember?.displayName || 'you'}
          </p>
        </div>
      </div>

      {/* Category Filter Chips */}
      <div className="flex flex-wrap gap-2">
        {['All', ...BAZAAR_CATEGORIES].map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setSelectedCategory(cat)}
            className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition-colors ${
              selectedCategory === cat
                ? 'bg-primary text-on-primary'
                : 'border border-outline-variant bg-surface text-on-surface-variant hover:text-on-surface'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Expense List */}
      {filteredExpenses.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-outline-variant bg-surface-low/60 px-6 py-12 text-center">
          <ShoppingCart className="h-9 w-9 text-on-surface-variant/60" />
          <p className="mt-3 text-sm font-bold text-on-surface">
            No bazaar expenses in {selectedCategory}
          </p>
          <p className="mt-1 text-xs text-on-surface-variant">
            Tap &ldquo;Add Bazaar&rdquo; to log daily market purchases for the mess.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredExpenses.map((expense) => {
            const canModify = isManager || expense.buyerMemberId === myMemberId;
            return (
              <div
                key={expense.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-outline-variant/80 bg-surface p-4 shadow-xs"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-lg bg-primary-container px-2 py-0.5 text-[11px] font-bold text-on-primary-container">
                      {expense.category}
                    </span>
                    <span className="text-xs text-on-surface-variant">
                      {DhakaTimeHelper.formatReadableDate(expense.date)}
                    </span>
                  </div>
                  <p className="mt-1.5 text-sm font-bold text-on-surface">
                    {expense.itemsDescription}
                  </p>
                  <p className="mt-0.5 text-xs text-on-surface-variant">
                    Purchased by {expense.buyerName}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span className="tabular-nums text-lg font-extrabold text-primary">
                    {formatTaka(expense.amount)}
                  </span>
                  {canModify && (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setExpenseToEdit(expense)}
                        aria-label="Edit bazaar expense"
                        className="rounded-xl p-2 text-on-surface-variant transition-colors hover:bg-surface-low hover:text-primary"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setExpenseToDelete(expense)}
                        aria-label="Delete bazaar expense"
                        className="rounded-xl p-2 text-on-surface-variant transition-colors hover:bg-error-container/40 hover:text-error"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Bazaar Modal */}
      <BazaarFormModal
        open={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        title="Log Bazaar Expense"
        todayDhakaDate={todayDhakaDate}
        onSubmit={(amount, desc, cat, date) => {
          addBazaarExpense(amount, desc, cat, date);
          setShowAddDialog(false);
        }}
      />

      {/* Edit Bazaar Modal */}
      {expenseToEdit && (
        <BazaarFormModal
          open={true}
          onClose={() => setExpenseToEdit(null)}
          title="Edit Bazaar Expense"
          todayDhakaDate={todayDhakaDate}
          initialExpense={expenseToEdit}
          onSubmit={(amount, desc, cat, date) => {
            updateBazaarExpense({
              ...expenseToEdit,
              amount,
              itemsDescription: desc,
              category: cat,
              date,
            });
            setExpenseToEdit(null);
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        open={Boolean(expenseToDelete)}
        onClose={() => setExpenseToDelete(null)}
        title="Delete Bazaar Expense?"
        maxWidthClass="max-w-sm"
        footer={
          <>
            <button
              type="button"
              onClick={() => setExpenseToDelete(null)}
              className="rounded-xl border border-outline-variant px-4 py-2 text-xs font-semibold text-on-surface"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                if (expenseToDelete) {
                  deleteBazaarExpense(expenseToDelete.id);
                  showUiMessage('Bazaar expense deleted.');
                  setExpenseToDelete(null);
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
          Remove <strong className="text-on-surface">{expenseToDelete?.itemsDescription}</strong> (
          <strong className="tabular-nums text-on-surface">
            {formatTaka(expenseToDelete?.amount ?? 0)}
          </strong>
          ) from the mess bazaar log?
        </p>
      </Modal>
    </div>
  );
};

interface BazaarFormModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  todayDhakaDate: string;
  initialExpense?: BazaarExpense;
  onSubmit: (amount: number, description: string, category: string, date: string) => void;
}

const BazaarFormModal: React.FC<BazaarFormModalProps> = ({
  open,
  onClose,
  title,
  todayDhakaDate,
  initialExpense,
  onSubmit,
}) => {
  const [amountStr, setAmountStr] = useState(
    initialExpense ? String(initialExpense.amount) : '',
  );
  const [description, setDescription] = useState(
    initialExpense?.itemsDescription ?? '',
  );
  const [category, setCategory] = useState(
    initialExpense?.category ?? BAZAAR_CATEGORIES[0],
  );
  const [date, setDate] = useState(initialExpense?.date ?? todayDhakaDate);
  const [error, setError] = useState('');

  const yesterdayDate = DhakaTimeHelper.shiftDate(todayDhakaDate, -1);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number.parseFloat(amountStr);
    if (Number.isNaN(amount) || amount <= 0) {
      setError('Enter a valid positive amount.');
      return;
    }
    if (!description.trim()) {
      setError('Please describe the items purchased.');
      return;
    }
    setError('');
    onSubmit(amount, description.trim(), category, date);
  };

  return (
    <Modal open={open} onClose={onClose} title={title} maxWidthClass="max-w-md">
      <form onSubmit={handleSave} className="space-y-4">
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-on-surface-variant">
            Amount (৳)
          </label>
          <input
            type="number"
            step="any"
            min="0"
            value={amountStr}
            onChange={(e) => setAmountStr(e.target.value)}
            placeholder="e.g., 1450"
            className="w-full rounded-xl border border-outline-variant bg-surface-low px-3.5 py-2.5 text-sm text-on-surface outline-none focus:border-primary"
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-on-surface-variant">
            Items Purchased
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g., Chicken 3kg, Potatoes, Onions, Oil"
            className="w-full rounded-xl border border-outline-variant bg-surface-low px-3.5 py-2.5 text-sm text-on-surface outline-none focus:border-primary"
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-on-surface-variant">
            Category
          </label>
          <div className="flex flex-wrap gap-1.5">
            {BAZAAR_CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-colors ${
                  category === cat
                    ? 'bg-primary text-on-primary'
                    : 'border border-outline-variant bg-surface-low text-on-surface-variant'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-on-surface-variant">
            Purchase Date (Asia/Dhaka)
          </label>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setDate(todayDhakaDate)}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold ${
                date === todayDhakaDate
                  ? 'bg-secondary text-on-secondary'
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
                  ? 'bg-secondary text-on-secondary'
                  : 'border border-outline-variant bg-surface-low text-on-surface-variant'
              }`}
            >
              Yesterday
            </button>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="flex-1 rounded-xl border border-outline-variant bg-surface-low px-3 py-1.5 text-xs text-on-surface outline-none focus:border-primary"
            />
          </div>
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
            Save Expense
          </button>
        </div>
      </form>
    </Modal>
  );
};

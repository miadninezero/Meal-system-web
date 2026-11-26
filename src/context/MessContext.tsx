import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { MessCalculationEngine } from '../engine/calculationEngine';
import { AuthSession, LocalMessStore } from '../services/localStore';
import {
  AuditLog,
  BazaarExpense,
  BillAllocationType,
  DailyMealRecord,
  Deposit,
  FinalOrderSummary,
  InAppNotification,
  KitchenOrderSummary,
  Member,
  Mess,
  MessSummary,
  ServiceStatus,
  SharedBill,
  UserProfile,
  UtilityBill,
  createDefaultBooking,
  isUserMessManager,
} from '../types/mess';
import { DhakaTimeHelper } from '../utils/dhakaTime';

interface MessContextValue {
  session: AuthSession | null;
  currentUserId: string;
  userProfile: UserProfile | null;
  knownUsers: UserProfile[];
  allMesses: Mess[];
  selectedMessId: string;
  currentMess: Mess | null;
  isManager: boolean;
  members: Member[];
  dailyMeals: DailyMealRecord[];
  bazaarExpenses: BazaarExpense[];
  deposits: Deposit[];
  utilityBills: UtilityBill[];
  sharedBills: SharedBill[];
  notifications: InAppNotification[];
  unreadNotificationsCount: number;
  auditLogs: AuditLog[];
  summary: MessSummary;
  kitchenSummary: KitchenOrderSummary;
  todayDhakaDate: string;
  selectedDate: string;
  uiMessage: string | null;
  showUiMessage: (msg: string) => void;
  clearUiMessage: () => void;
  setSelectedDate: (date: string) => void;
  signIn: (displayName: string, email: string) => void;
  signOut: () => void;
  selectMess: (messId: string) => void;
  createMess: (name: string, managerName: string) => void;
  joinMess: (messId: string, memberName: string, room: string) => void;
  configureDeadlines: (lunchDeadline: string, nightDeadline: string) => void;
  updateMealServiceStatus: (
    date: string,
    lunchStatus: ServiceStatus,
    nightStatus: ServiceStatus,
    cancellationReason: string,
  ) => void;
  saveMyBooking: (
    date: string,
    statusLunch: 'BOOKED' | 'CANCELLED',
    statusNight: 'BOOKED' | 'CANCELLED',
    guestLunch: number,
    guestNight: number,
  ) => void;
  setAutoBooking: (enabled: boolean, bookLunch?: boolean, bookNight?: boolean) => void;
  managerOverrideBooking: (
    date: string,
    memberId: string,
    memberName: string,
    statusLunch: 'BOOKED' | 'CANCELLED',
    statusNight: 'BOOKED' | 'CANCELLED',
    guestLunch: number,
    guestNight: number,
    reason: string,
  ) => void;
  saveFinalOrderSummary: (date: string, mealType: 'LUNCH' | 'NIGHT') => void;
  addBazaarExpense: (
    amount: number,
    description: string,
    category: string,
    date: string,
  ) => void;
  updateBazaarExpense: (expense: BazaarExpense) => void;
  deleteBazaarExpense: (expenseId: string) => void;
  addDeposit: (
    memberId: string,
    memberName: string,
    amount: number,
    paymentMethod: string,
    notes: string,
    date?: string,
  ) => void;
  updateDeposit: (deposit: Deposit) => void;
  deleteDeposit: (deposit: Deposit) => void;
  addUtilityBill: (title: string, amount: number) => void;
  updateUtilityBill: (bill: UtilityBill) => void;
  deleteUtilityBill: (bill: UtilityBill) => void;
  promoteMemberToManager: (targetMember: Member) => void;
  demoteManagerToMember: (targetMember: Member) => void;
  resignAsManager: (successor: Member | null) => void;
  createSharedBill: (
    title: string,
    allocationType: BillAllocationType,
    amountInput: number,
    deadline: string,
    notes: string,
    customShares?: Record<string, number>,
  ) => void;
  updateSharedBill: (bill: SharedBill, updatedShares?: Record<string, number> | null) => void;
  deleteSharedBill: (bill: SharedBill) => void;
  recordBillPayment: (
    billId: string,
    memberId: string,
    memberName: string,
    assignedShare: number,
    amountPaid: number,
    paymentMethod: string,
    paymentDate: string,
    notes: string,
  ) => void;
  markNotificationAsRead: (notificationId: string) => void;
  markAllNotificationsAsRead: () => void;
}

const MessContext = createContext<MessContextValue | null>(null);

export const MessProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [revision, setRevision] = useState(0);
  const bump = useCallback(() => setRevision((r) => r + 1), []);

  const todayDhakaDate = useMemo(() => DhakaTimeHelper.getTodayDhakaDate(), []);
  const [selectedDate, setSelectedDate] = useState<string>(todayDhakaDate);
  const [uiMessage, setUiMessage] = useState<string | null>(null);
  const autoBookedKeysRef = useRef<Set<string>>(new Set());

  const showUiMessage = useCallback((msg: string) => {
    setUiMessage(msg);
  }, []);

  const clearUiMessage = useCallback(() => {
    setUiMessage(null);
  }, []);

  const dbSnapshot = useMemo(() => {
    void revision;
    return LocalMessStore.getDb();
  }, [revision]);

  const session = dbSnapshot.session;
  const currentUserId = session?.uid ?? '';
  const userProfile = currentUserId ? (dbSnapshot.users[currentUserId] ?? null) : null;
  const knownUsers = useMemo(() => Object.values(dbSnapshot.users), [dbSnapshot]);
  const allMesses = useMemo(
    () => Object.values(dbSnapshot.messes).map((b) => b.mess),
    [dbSnapshot],
  );

  const selectedMessId = useMemo(() => {
    if (!currentUserId) return '';
    const stored = localStorage.getItem(`current_mess_id_${currentUserId}`) || '';
    if (stored && dbSnapshot.messes[stored]) return stored;
    if (userProfile?.currentMessId && dbSnapshot.messes[userProfile.currentMessId]) {
      return userProfile.currentMessId;
    }
    return '';
  }, [currentUserId, dbSnapshot.messes, userProfile]);

  const bucket = selectedMessId ? (dbSnapshot.messes[selectedMessId] ?? null) : null;
  const currentMess = bucket?.mess ?? null;
  const isManager = isUserMessManager(currentMess, currentUserId);
  const members = useMemo(() => bucket?.members ?? [], [bucket]);
  const dailyMeals = useMemo(() => bucket?.dailyMeals ?? [], [bucket]);
  const bazaarExpenses = useMemo(() => bucket?.bazaarExpenses ?? [], [bucket]);
  const deposits = useMemo(() => bucket?.deposits ?? [], [bucket]);
  const utilityBills = useMemo(() => bucket?.utilityBills ?? [], [bucket]);
  const sharedBills = useMemo(() => bucket?.sharedBills ?? [], [bucket]);
  const auditLogs = useMemo(() => bucket?.auditLogs ?? [], [bucket]);

  const notifications = useMemo(() => {
    const all = bucket?.notifications ?? [];
    if (!currentUserId) return [];
    const currentMember = members.find((m) => m.userId === currentUserId);
    const memberId = currentMember?.id || currentUserId;
    return all.filter(
      (n) =>
        n.targetMemberId === memberId ||
        n.targetMemberId === 'ALL' ||
        n.targetMemberId === '',
    );
  }, [bucket, currentUserId, members]);

  const unreadNotificationsCount = useMemo(
    () => notifications.filter((n) => !n.isRead).length,
    [notifications],
  );

  const summary = useMemo(
    () =>
      MessCalculationEngine.calculateSummary({
        members,
        dailyMeals,
        bazaarExpenses,
        deposits,
        utilityBills,
        sharedBills,
        lunchDeadline: currentMess?.lunchBookingDeadline ?? '09:00',
        nightDeadline: currentMess?.nightBookingDeadline ?? '17:00',
      }),
    [members, dailyMeals, bazaarExpenses, deposits, utilityBills, sharedBills, currentMess],
  );

  const kitchenSummary = useMemo<KitchenOrderSummary>(() => {
    const record = dailyMeals.find(
      (r) => r.id === selectedDate || r.date === selectedDate,
    );
    const isFri = record?.isFriday ?? DhakaTimeHelper.isFriday(selectedDate);
    const lunchActive = record?.lunchServiceStatus !== 'CANCELLED';
    const nightActive = isFri ? false : record?.nightServiceStatus !== 'CANCELLED';

    const lunchDeadline = currentMess?.lunchBookingDeadline ?? '09:00';
    const nightDeadline = currentMess?.nightBookingDeadline ?? '17:00';
    const isLunchLocked = DhakaTimeHelper.isDeadlinePassed(selectedDate, lunchDeadline);
    const isNightLocked = isFri
      ? true
      : DhakaTimeHelper.isDeadlinePassed(selectedDate, nightDeadline);

    let lunchMembers = 0;
    let lunchGuests = 0;
    let nightMembers = 0;
    let nightGuests = 0;

    const accountedMemberIds = new Set<string>();
    for (const member of members) {
      accountedMemberIds.add(member.id);
      const explicit = record?.bookings[member.id];
      const effective =
        selectedDate >= todayDhakaDate || record != null
          ? MessCalculationEngine.resolveEffectiveBooking(
              member,
              explicit,
              selectedDate,
              isFri,
            )
          : (explicit ?? createDefaultBooking());

      if (lunchActive && effective.statusLunch === 'BOOKED') {
        lunchMembers += 1;
        lunchGuests += Math.max(0, effective.guestLunch);
      }
      if (nightActive && effective.statusNight === 'BOOKED') {
        nightMembers += 1;
        nightGuests += Math.max(0, effective.guestNight);
      }
    }

    if (record) {
      for (const [id, b] of Object.entries(record.bookings)) {
        if (!accountedMemberIds.has(id)) {
          if (lunchActive && b.statusLunch === 'BOOKED') {
            lunchMembers += 1;
            lunchGuests += Math.max(0, b.guestLunch);
          }
          if (nightActive && b.statusNight === 'BOOKED') {
            nightMembers += 1;
            nightGuests += Math.max(0, b.guestNight);
          }
        }
      }
    }

    let aLunch = 0;
    let aNight = 0;
    if (record) {
      for (const a of Object.values(record.attendances)) {
        if (lunchActive && a.attendedLunch) {
          aLunch += 1 + Math.max(0, a.guestLunchAttended);
        }
        if (nightActive && a.attendedNight) {
          aNight += 1 + Math.max(0, a.guestNightAttended);
        }
      }
    }

    return {
      lunchTotalPortions: lunchMembers + lunchGuests,
      lunchMemberCount: lunchMembers,
      lunchGuestCount: lunchGuests,
      nightTotalPortions: nightMembers + nightGuests,
      nightMemberCount: nightMembers,
      nightGuestCount: nightGuests,
      attendedLunchCount: aLunch,
      attendedNightCount: aNight,
      lunchActive,
      nightActive,
      isFriday: isFri,
      cancellationReason: record?.cancellationReason ?? '',
      isLunchLocked,
      isNightLocked,
      lunchFinalOrder: record?.lunchFinalOrder ?? null,
      nightFinalOrder: record?.nightFinalOrder ?? null,
    };
  }, [dailyMeals, selectedDate, currentMess, members, todayDhakaDate]);

  // Auto-save final order summary at deadline when viewed/selected
  useEffect(() => {
    if (!selectedMessId || !selectedDate || !currentMess || !currentUserId) return;
    let saved = false;
    if (
      kitchenSummary.isLunchLocked &&
      !kitchenSummary.lunchFinalOrder &&
      kitchenSummary.lunchActive
    ) {
      const finalOrder: FinalOrderSummary = {
        mealType: 'LUNCH',
        date: selectedDate,
        totalPortions: kitchenSummary.lunchTotalPortions,
        memberCount: kitchenSummary.lunchMemberCount,
        guestCount: kitchenSummary.lunchGuestCount,
        deadline: currentMess.lunchBookingDeadline,
        isLocked: true,
        lockedAtDhakaTime: DhakaTimeHelper.format12Hour(
          currentMess.lunchBookingDeadline,
        ),
      };
      LocalMessStore.saveFinalMealOrderSummary({
        messId: selectedMessId,
        actorUid: currentUserId,
        actorName: session?.displayName || 'Manager',
        date: selectedDate,
        mealType: 'LUNCH',
        summary: finalOrder,
      });
      saved = true;
    }
    if (
      kitchenSummary.isNightLocked &&
      !kitchenSummary.isFriday &&
      !kitchenSummary.nightFinalOrder &&
      kitchenSummary.nightActive
    ) {
      const finalOrder: FinalOrderSummary = {
        mealType: 'NIGHT',
        date: selectedDate,
        totalPortions: kitchenSummary.nightTotalPortions,
        memberCount: kitchenSummary.nightMemberCount,
        guestCount: kitchenSummary.nightGuestCount,
        deadline: currentMess.nightBookingDeadline,
        isLocked: true,
        lockedAtDhakaTime: DhakaTimeHelper.format12Hour(
          currentMess.nightBookingDeadline,
        ),
      };
      LocalMessStore.saveFinalMealOrderSummary({
        messId: selectedMessId,
        actorUid: currentUserId,
        actorName: session?.displayName || 'Manager',
        date: selectedDate,
        mealType: 'NIGHT',
        summary: finalOrder,
      });
      saved = true;
    }
    if (saved) bump();
  }, [selectedMessId, selectedDate, currentMess, currentUserId, session, kitchenSummary, bump]);

  // Auto-booking observer
  useEffect(() => {
    if (!selectedMessId || !currentMess || !currentUserId) return;
    const currentMember = members.find((m) => m.userId === currentUserId);
    if (!currentMember || !currentMember.autoBookEnabled || !currentMember.isActive) {
      return;
    }

    const memberId = currentMember.id || currentUserId;
    const lunchCutoff = currentMess.lunchBookingDeadline;
    const nightCutoff = currentMess.nightBookingDeadline;

    const targetDates = Array.from(new Set([todayDhakaDate, selectedDate])).filter(
      (d) =>
        d >= todayDhakaDate &&
        (!currentMember.autoBookUpdatedAt || d >= currentMember.autoBookUpdatedAt),
    );

    let updated = false;
    for (const targetDate of targetDates) {
      const isFri = DhakaTimeHelper.isFriday(targetDate);
      const record = dailyMeals.find(
        (r) => r.id === targetDate || r.date === targetDate,
      );
      const lunchActive = record?.lunchServiceStatus !== 'CANCELLED';
      const nightActive = isFri ? false : record?.nightServiceStatus !== 'CANCELLED';

      const lunchPassed = DhakaTimeHelper.isDeadlinePassed(targetDate, lunchCutoff);
      const nightPassed = isFri
        ? true
        : DhakaTimeHelper.isDeadlinePassed(targetDate, nightCutoff);

      const prev = record?.bookings[memberId] ?? createDefaultBooking();
      const needLunch =
        !lunchPassed && lunchActive && prev.statusLunch === 'NO_RESPONSE';
      const needNight =
        !nightPassed && nightActive && !isFri && prev.statusNight === 'NO_RESPONSE';

      if (!needLunch && !needNight) continue;

      const key = `${selectedMessId}|${memberId}|${targetDate}|${currentMember.autoBookLunch}|${currentMember.autoBookNight}|${prev.statusLunch}|${prev.statusNight}`;
      if (autoBookedKeysRef.current.has(key)) continue;
      autoBookedKeysRef.current.add(key);

      const newLunch = needLunch
        ? currentMember.autoBookLunch
          ? 'BOOKED'
          : 'CANCELLED'
        : prev.statusLunch;
      const newNight = isFri
        ? 'CANCELLED'
        : needNight
          ? currentMember.autoBookNight
            ? 'BOOKED'
            : 'CANCELLED'
          : prev.statusNight;

      try {
        LocalMessStore.saveMemberBooking({
          messId: selectedMessId,
          actorUid: currentUserId,
          date: targetDate,
          memberId,
          booking: {
            ...prev,
            statusLunch: newLunch,
            statusNight: newNight,
            updatedBy: currentUserId,
            autoBooked: true,
          },
          lunchDeadline: lunchCutoff,
          nightDeadline: nightCutoff,
          isManager,
        });
        updated = true;
      } catch {
        autoBookedKeysRef.current.delete(key);
      }
    }
    if (updated) bump();
  }, [
    selectedMessId,
    currentMess,
    currentUserId,
    members,
    dailyMeals,
    selectedDate,
    todayDhakaDate,
    isManager,
    bump,
  ]);

  const signIn = useCallback(
    (displayName: string, email: string) => {
      LocalMessStore.signIn(displayName, email);
      autoBookedKeysRef.current.clear();
      bump();
    },
    [bump],
  );

  const signOut = useCallback(() => {
    LocalMessStore.signOut();
    autoBookedKeysRef.current.clear();
    bump();
  }, [bump]);

  const selectMess = useCallback(
    (messId: string) => {
      if (!currentUserId) return;
      localStorage.setItem(`current_mess_id_${currentUserId}`, messId);
      const current = userProfile ?? {
        id: currentUserId,
        displayName: session?.displayName || 'User',
        email: session?.email || '',
        currentMessId: messId,
      };
      LocalMessStore.saveUserProfile({ ...current, currentMessId: messId });
      bump();
    },
    [currentUserId, userProfile, session, bump],
  );

  const createMess = useCallback(
    (name: string, managerName: string) => {
      if (!currentUserId) return;
      try {
        const currentMonth = DhakaTimeHelper.getCurrentDhakaMonth();
        const newMessId = LocalMessStore.createMess({
          userId: currentUserId,
          userEmail: session?.email || '',
          messName: name,
          managerName,
          defaultMonth: currentMonth,
        });
        localStorage.setItem(`current_mess_id_${currentUserId}`, newMessId);
        bump();
        showUiMessage(`Mess '${name}' created successfully!`);
      } catch (e) {
        showUiMessage(
          `Failed to create mess: ${e instanceof Error ? e.message : String(e)}`,
        );
      }
    },
    [currentUserId, session, bump, showUiMessage],
  );

  const joinMess = useCallback(
    (messId: string, memberName: string, room: string) => {
      if (!currentUserId) return;
      try {
        LocalMessStore.joinMess({
          userId: currentUserId,
          userEmail: session?.email || '',
          messId: messId.trim(),
          memberName: memberName.trim(),
          room: room.trim(),
        });
        const cleanCode =
          Object.keys(LocalMessStore.getDb().messes).find(
            (k) => k.toLowerCase() === messId.trim().toLowerCase(),
          ) ?? messId.trim();
        localStorage.setItem(`current_mess_id_${currentUserId}`, cleanCode);
        bump();
        showUiMessage('Joined mess successfully!');
      } catch (e) {
        showUiMessage(
          `Failed to join mess: ${e instanceof Error ? e.message : String(e)}`,
        );
      }
    },
    [currentUserId, session, bump, showUiMessage],
  );

  const configureDeadlines = useCallback(
    (lunchDeadline: string, nightDeadline: string) => {
      if (!selectedMessId) return;
      LocalMessStore.updateBookingDeadlines(
        selectedMessId,
        currentUserId,
        session?.displayName || 'Manager',
        lunchDeadline,
        nightDeadline,
      );
      bump();
      showUiMessage('Booking deadlines updated (Asia/Dhaka)!');
    },
    [selectedMessId, currentUserId, session, bump, showUiMessage],
  );

  const updateMealServiceStatus = useCallback(
    (
      date: string,
      lunchStatus: ServiceStatus,
      nightStatus: ServiceStatus,
      cancellationReason: string,
    ) => {
      if (!selectedMessId) return;
      LocalMessStore.updateMealServiceStatus(
        selectedMessId,
        currentUserId,
        session?.displayName || 'Manager',
        date,
        lunchStatus,
        nightStatus,
        cancellationReason,
      );
      bump();
      showUiMessage('Meal service status updated. Kitchen summary refreshed.');
    },
    [selectedMessId, currentUserId, session, bump, showUiMessage],
  );

  const saveMyBooking = useCallback(
    (
      date: string,
      statusLunch: 'BOOKED' | 'CANCELLED',
      statusNight: 'BOOKED' | 'CANCELLED',
      guestLunch: number,
      guestNight: number,
    ) => {
      if (!selectedMessId) return;
      const currentMember = members.find((m) => m.userId === currentUserId);
      const memberId = currentMember?.id || currentUserId;
      const lunchCutoff = currentMess?.lunchBookingDeadline ?? '09:00';
      const nightCutoff = currentMess?.nightBookingDeadline ?? '17:00';
      const isFri = DhakaTimeHelper.isFriday(date);

      const lunchPassed = DhakaTimeHelper.isDeadlinePassed(date, lunchCutoff);
      const nightPassed = isFri
        ? true
        : DhakaTimeHelper.isDeadlinePassed(date, nightCutoff);

      const record = dailyMeals.find((r) => r.id === date || r.date === date);
      const prevBooking = record?.bookings[memberId] ?? createDefaultBooking();

      const effectiveLunch = lunchPassed ? prevBooking.statusLunch : statusLunch;
      const effectiveNight = isFri
        ? 'CANCELLED'
        : nightPassed
          ? prevBooking.statusNight
          : statusNight;
      const effectiveGuestLunch = lunchPassed
        ? prevBooking.guestLunch
        : Math.max(0, guestLunch);
      const effectiveGuestNight = isFri
        ? 0
        : nightPassed
          ? prevBooking.guestNight
          : Math.max(0, guestNight);

      if (lunchPassed && nightPassed) {
        showUiMessage(
          'Deadlines have passed. Bookings are locked. Contact Manager/Admin for overrides.',
        );
        return;
      }

      try {
        LocalMessStore.saveMemberBooking({
          messId: selectedMessId,
          actorUid: currentUserId,
          date,
          memberId,
          booking: {
            statusLunch: effectiveLunch,
            statusNight: effectiveNight,
            guestLunch: effectiveGuestLunch,
            guestNight: effectiveGuestNight,
            updatedBy: currentUserId,
            managerOverrideReason: '',
            autoBooked: false,
          },
          lunchDeadline: lunchCutoff,
          nightDeadline: nightCutoff,
          isManager,
        });
        bump();
        showUiMessage(
          `Meal booking saved (${effectiveLunch === 'BOOKED' ? 'Lunch Booked' : 'Lunch Cancelled'} | ${effectiveNight === 'BOOKED' ? 'Night Booked' : 'Night Cancelled'}).`,
        );
      } catch (e) {
        showUiMessage(`Booking error: ${e instanceof Error ? e.message : String(e)}`);
      }
    },
    [
      selectedMessId,
      members,
      currentUserId,
      currentMess,
      dailyMeals,
      isManager,
      bump,
      showUiMessage,
    ],
  );

  const setAutoBooking = useCallback(
    (enabled: boolean, bookLunch = true, bookNight = true) => {
      if (!selectedMessId) return;
      const currentMember = members.find((m) => m.userId === currentUserId);
      const memberId = currentMember?.id || currentUserId;
      const effectiveLunchPref = enabled && !bookLunch && !bookNight ? true : bookLunch;
      const effectiveNightPref = bookNight;
      const lunchCutoff = currentMess?.lunchBookingDeadline ?? '09:00';
      const nightCutoff = currentMess?.nightBookingDeadline ?? '17:00';

      autoBookedKeysRef.current.clear();
      const updatedAt = enabled ? todayDhakaDate : '';
      LocalMessStore.updateMemberAutoBookPreference({
        messId: selectedMessId,
        memberId,
        enabled,
        bookLunch: effectiveLunchPref,
        bookNight: effectiveNightPref,
        updatedDate: updatedAt,
      });

      if (enabled) {
        const targetDates = Array.from(new Set([todayDhakaDate, selectedDate])).filter(
          (d) => d >= todayDhakaDate,
        );
        for (const date of targetDates) {
          const isFri = DhakaTimeHelper.isFriday(date);
          const record = dailyMeals.find((r) => r.id === date || r.date === date);
          const lunchActive = record?.lunchServiceStatus !== 'CANCELLED';
          const nightActive = isFri ? false : record?.nightServiceStatus !== 'CANCELLED';
          const lunchPassed = DhakaTimeHelper.isDeadlinePassed(date, lunchCutoff);
          const nightPassed = isFri
            ? true
            : DhakaTimeHelper.isDeadlinePassed(date, nightCutoff);
          const prev = record?.bookings[memberId] ?? createDefaultBooking();

          const canAutoLunch =
            !lunchPassed &&
            lunchActive &&
            (prev.statusLunch === 'NO_RESPONSE' || prev.autoBooked);
          const canAutoNight =
            !nightPassed &&
            nightActive &&
            !isFri &&
            (prev.statusNight === 'NO_RESPONSE' || prev.autoBooked);
          if (!canAutoLunch && !canAutoNight) continue;

          const newLunch = canAutoLunch
            ? effectiveLunchPref
              ? 'BOOKED'
              : 'CANCELLED'
            : prev.statusLunch;
          const newNight = isFri
            ? 'CANCELLED'
            : canAutoNight
              ? effectiveNightPref
                ? 'BOOKED'
                : 'CANCELLED'
              : prev.statusNight;

          try {
            LocalMessStore.saveMemberBooking({
              messId: selectedMessId,
              actorUid: currentUserId,
              date,
              memberId,
              booking: {
                ...prev,
                statusLunch: newLunch,
                statusNight: newNight,
                updatedBy: currentUserId,
                autoBooked: true,
              },
              lunchDeadline: lunchCutoff,
              nightDeadline: nightCutoff,
              isManager,
            });
          } catch {
            // ignore locked date
          }
        }
        const scopeLabel =
          effectiveLunchPref && effectiveNightPref
            ? 'Lunch & Night'
            : effectiveLunchPref
              ? 'Lunch only'
              : 'Night only';
        showUiMessage(
          `Auto-booking turned ON (${scopeLabel}). Upcoming meals will book automatically.`,
        );
      } else {
        LocalMessStore.clearAutoBookedEntries({
          messId: selectedMessId,
          actorUid: currentUserId,
          memberId,
          todayDate: todayDhakaDate,
          lunchDeadline: lunchCutoff,
          nightDeadline: nightCutoff,
        });
        showUiMessage('Auto-booking turned OFF. Please book your meals manually.');
      }
      bump();
    },
    [
      selectedMessId,
      members,
      currentUserId,
      currentMess,
      todayDhakaDate,
      selectedDate,
      dailyMeals,
      isManager,
      bump,
      showUiMessage,
    ],
  );

  const managerOverrideBooking = useCallback(
    (
      date: string,
      memberId: string,
      memberName: string,
      statusLunch: 'BOOKED' | 'CANCELLED',
      statusNight: 'BOOKED' | 'CANCELLED',
      guestLunch: number,
      guestNight: number,
      reason: string,
    ) => {
      if (!selectedMessId) return;
      if (!isManager) {
        showUiMessage('Access Denied: Only Admins/Managers can override locked bookings.');
        return;
      }
      if (!reason.trim()) {
        showUiMessage('Please provide an override reason for audit history.');
        return;
      }
      LocalMessStore.overrideMemberBooking({
        messId: selectedMessId,
        actorUid: currentUserId,
        actorName: session?.displayName || 'Manager',
        date,
        memberId,
        memberName,
        booking: {
          statusLunch,
          statusNight,
          guestLunch: Math.max(0, guestLunch),
          guestNight: Math.max(0, guestNight),
          updatedBy: currentUserId,
          managerOverrideReason: reason.trim(),
          autoBooked: false,
        },
        reason: reason.trim(),
      });
      bump();
      showUiMessage('Admin booking override recorded in audit history with reason.');
    },
    [selectedMessId, isManager, currentUserId, session, bump, showUiMessage],
  );

  const saveFinalOrderSummary = useCallback(
    (date: string, mealType: 'LUNCH' | 'NIGHT') => {
      if (!selectedMessId) return;
      const isLunch = mealType === 'LUNCH';
      const total = isLunch
        ? kitchenSummary.lunchTotalPortions
        : kitchenSummary.nightTotalPortions;
      const memCount = isLunch
        ? kitchenSummary.lunchMemberCount
        : kitchenSummary.nightMemberCount;
      const guestCount = isLunch
        ? kitchenSummary.lunchGuestCount
        : kitchenSummary.nightGuestCount;
      const deadline = isLunch
        ? (currentMess?.lunchBookingDeadline ?? '09:00')
        : (currentMess?.nightBookingDeadline ?? '17:00');

      const finalOrder: FinalOrderSummary = {
        mealType,
        date,
        totalPortions: total,
        memberCount: memCount,
        guestCount,
        deadline,
        isLocked: true,
        lockedAtDhakaTime: DhakaTimeHelper.format12Hour(deadline),
      };

      LocalMessStore.saveFinalMealOrderSummary({
        messId: selectedMessId,
        actorUid: currentUserId,
        actorName: session?.displayName || 'Manager',
        date,
        mealType,
        summary: finalOrder,
      });
      bump();
      showUiMessage(`Final ${mealType} kitchen order summary saved & locked!`);
    },
    [
      selectedMessId,
      kitchenSummary,
      currentMess,
      currentUserId,
      session,
      bump,
      showUiMessage,
    ],
  );

  const addBazaarExpense = useCallback(
    (amount: number, description: string, category: string, date: string) => {
      if (!selectedMessId) return;
      const currentMember = members.find((m) => m.userId === currentUserId);
      LocalMessStore.addBazaarExpense(selectedMessId, {
        buyerMemberId: currentMember?.id || currentUserId,
        buyerName: currentMember?.displayName || session?.displayName || 'Member',
        amount,
        itemsDescription: description,
        category,
        date,
      });
      bump();
      showUiMessage('Bazaar expense recorded!');
    },
    [selectedMessId, members, currentUserId, session, bump, showUiMessage],
  );

  const updateBazaarExpense = useCallback(
    (expense: BazaarExpense) => {
      if (!selectedMessId) return;
      LocalMessStore.updateBazaarExpense(
        selectedMessId,
        currentUserId,
        session?.displayName || 'Manager',
        expense,
      );
      bump();
      showUiMessage('Bazaar expense updated!');
    },
    [selectedMessId, currentUserId, session, bump, showUiMessage],
  );

  const deleteBazaarExpense = useCallback(
    (expenseId: string) => {
      if (!selectedMessId) return;
      LocalMessStore.deleteBazaarExpense(selectedMessId, expenseId);
      bump();
    },
    [selectedMessId, bump],
  );

  const addDeposit = useCallback(
    (
      memberId: string,
      memberName: string,
      amount: number,
      paymentMethod: string,
      notes: string,
      date = todayDhakaDate,
    ) => {
      if (!selectedMessId) return;
      if (!isManager) {
        showUiMessage('Access Denied: Only Managers can add deposits.');
        return;
      }
      LocalMessStore.addDeposit(
        selectedMessId,
        currentUserId,
        session?.displayName || 'Manager',
        {
          memberId,
          memberName,
          amount,
          date: date.trim() || todayDhakaDate,
          paymentMethod,
          notes,
        },
      );
      bump();
      showUiMessage('Deposit added successfully!');
    },
    [
      selectedMessId,
      isManager,
      currentUserId,
      session,
      todayDhakaDate,
      bump,
      showUiMessage,
    ],
  );

  const updateDeposit = useCallback(
    (deposit: Deposit) => {
      if (!selectedMessId) return;
      if (!isManager) {
        showUiMessage('Access Denied: Only Managers can edit deposits.');
        return;
      }
      LocalMessStore.updateDeposit(
        selectedMessId,
        currentUserId,
        session?.displayName || 'Manager',
        deposit,
      );
      bump();
      showUiMessage('Deposit updated successfully!');
    },
    [selectedMessId, isManager, currentUserId, session, bump, showUiMessage],
  );

  const deleteDeposit = useCallback(
    (deposit: Deposit) => {
      if (!selectedMessId) return;
      if (!isManager) {
        showUiMessage('Access Denied: Only Managers can delete deposits.');
        return;
      }
      LocalMessStore.deleteDeposit(
        selectedMessId,
        currentUserId,
        session?.displayName || 'Manager',
        deposit,
      );
      bump();
      showUiMessage('Deposit removed.');
    },
    [selectedMessId, isManager, currentUserId, session, bump, showUiMessage],
  );

  const addUtilityBill = useCallback(
    (title: string, amount: number) => {
      if (!selectedMessId) return;
      if (!isManager) {
        showUiMessage('Access Denied: Only Managers can add utility bills.');
        return;
      }
      LocalMessStore.addUtilityBill(
        selectedMessId,
        currentUserId,
        session?.displayName || 'Manager',
        {
          title,
          amount,
          month: DhakaTimeHelper.getCurrentDhakaMonth(),
        },
      );
      bump();
      showUiMessage('Utility bill added!');
    },
    [selectedMessId, isManager, currentUserId, session, bump, showUiMessage],
  );

  const updateUtilityBill = useCallback(
    (bill: UtilityBill) => {
      if (!selectedMessId) return;
      if (!isManager) {
        showUiMessage('Access Denied: Only Managers can edit utility bills.');
        return;
      }
      LocalMessStore.updateUtilityBill(
        selectedMessId,
        currentUserId,
        session?.displayName || 'Manager',
        bill,
      );
      bump();
      showUiMessage('Utility bill updated!');
    },
    [selectedMessId, isManager, currentUserId, session, bump, showUiMessage],
  );

  const deleteUtilityBill = useCallback(
    (bill: UtilityBill) => {
      if (!selectedMessId) return;
      if (!isManager) {
        showUiMessage('Access Denied: Only Managers can delete utility bills.');
        return;
      }
      LocalMessStore.deleteUtilityBill(
        selectedMessId,
        currentUserId,
        session?.displayName || 'Manager',
        bill.id,
        bill.title,
        bill.amount,
      );
      bump();
      showUiMessage('Utility bill removed.');
    },
    [selectedMessId, isManager, currentUserId, session, bump, showUiMessage],
  );

  const promoteMemberToManager = useCallback(
    (targetMember: Member) => {
      if (!selectedMessId) return;
      if (!isManager) {
        showUiMessage('Access Denied: Only Managers can assign manager roles.');
        return;
      }
      LocalMessStore.promoteMemberToManager(
        selectedMessId,
        currentUserId,
        session?.displayName || 'Manager',
        targetMember,
      );
      bump();
      showUiMessage(`${targetMember.displayName} is now a Manager.`);
    },
    [selectedMessId, isManager, currentUserId, session, bump, showUiMessage],
  );

  const demoteManagerToMember = useCallback(
    (targetMember: Member) => {
      if (!selectedMessId) return;
      if (!isManager) {
        showUiMessage('Access Denied: Only Managers can change manager roles.');
        return;
      }
      LocalMessStore.demoteManagerToMember(
        selectedMessId,
        currentUserId,
        session?.displayName || 'Manager',
        targetMember,
      );
      bump();
      showUiMessage(`${targetMember.displayName}'s role updated to Member.`);
    },
    [selectedMessId, isManager, currentUserId, session, bump, showUiMessage],
  );

  const resignAsManager = useCallback(
    (successor: Member | null) => {
      if (!selectedMessId) return;
      if (!isManager) {
        showUiMessage('You are not a Manager.');
        return;
      }
      const currentMember = members.find((m) => m.userId === currentUserId);
      const memberId = currentMember?.id || currentUserId;
      LocalMessStore.resignAsManager(
        selectedMessId,
        currentUserId,
        session?.displayName || 'Manager',
        memberId,
        successor,
      );
      bump();
      showUiMessage(
        successor
          ? `Resigned as Manager. Handed over to ${successor.displayName}.`
          : 'You have stepped down from Manager role.',
      );
    },
    [
      selectedMessId,
      isManager,
      members,
      currentUserId,
      session,
      bump,
      showUiMessage,
    ],
  );

  const createSharedBill = useCallback(
    (
      title: string,
      allocationType: BillAllocationType,
      amountInput: number,
      deadline: string,
      notes: string,
      customShares: Record<string, number> = {},
    ) => {
      if (!selectedMessId) return;
      if (!isManager) {
        showUiMessage(
          'Access Denied: Only Managers and Admins can create shared bills.',
        );
        return;
      }
      const activeMems = members.filter((m) => m.isActive);
      if (activeMems.length === 0) {
        showUiMessage('Cannot create bill: No active members found in this mess.');
        return;
      }
      LocalMessStore.createSharedBill({
        messId: selectedMessId,
        actorUid: currentUserId,
        actorName: session?.displayName || 'Manager',
        title: title.trim(),
        allocationType,
        amountInput,
        month: DhakaTimeHelper.getCurrentDhakaMonth(),
        deadline: deadline.trim(),
        notes: notes.trim(),
        activeMembers: activeMems,
        customShares,
      });
      bump();
      showUiMessage(
        `Shared bill '${title}' published! In-app notifications sent to ${activeMems.length} members.`,
      );
    },
    [
      selectedMessId,
      isManager,
      members,
      currentUserId,
      session,
      bump,
      showUiMessage,
    ],
  );

  const updateSharedBill = useCallback(
    (bill: SharedBill, updatedShares: Record<string, number> | null = null) => {
      if (!selectedMessId) return;
      if (!isManager) {
        showUiMessage('Access Denied: Only Managers can edit shared bills.');
        return;
      }
      LocalMessStore.updateSharedBill(
        selectedMessId,
        currentUserId,
        session?.displayName || 'Manager',
        bill,
        updatedShares,
      );
      bump();
      showUiMessage('Shared bill updated successfully!');
    },
    [selectedMessId, isManager, currentUserId, session, bump, showUiMessage],
  );

  const deleteSharedBill = useCallback(
    (bill: SharedBill) => {
      if (!selectedMessId) return;
      if (!isManager) {
        showUiMessage('Access Denied: Only Managers can delete shared bills.');
        return;
      }
      LocalMessStore.deleteSharedBill(
        selectedMessId,
        currentUserId,
        session?.displayName || 'Manager',
        bill.id,
        bill.title,
        bill.totalAmount,
      );
      bump();
      showUiMessage(`Shared bill '${bill.title}' removed.`);
    },
    [selectedMessId, isManager, currentUserId, session, bump, showUiMessage],
  );

  const recordBillPayment = useCallback(
    (
      billId: string,
      memberId: string,
      memberName: string,
      assignedShare: number,
      amountPaid: number,
      paymentMethod: string,
      paymentDate: string,
      notes: string,
    ) => {
      if (!selectedMessId) return;
      if (!isManager) {
        showUiMessage('Access Denied: Only Managers can record payments.');
        return;
      }
      LocalMessStore.recordBillPayment({
        messId: selectedMessId,
        actorUid: currentUserId,
        actorName: session?.displayName || 'Manager',
        billId,
        memberId,
        memberName,
        assignedShare,
        amountPaid,
        paymentMethod,
        paymentDate,
        notes,
      });
      bump();
      const statusText =
        amountPaid >= assignedShare && assignedShare > 0
          ? 'Paid in full'
          : amountPaid > 0
            ? `Partially paid (৳${amountPaid})`
            : 'Marked as unpaid';
      showUiMessage(`Payment recorded for ${memberName}: ${statusText}.`);
    },
    [selectedMessId, isManager, currentUserId, session, bump, showUiMessage],
  );

  const markNotificationAsRead = useCallback(
    (notificationId: string) => {
      if (!selectedMessId) return;
      LocalMessStore.markNotificationAsRead(selectedMessId, notificationId);
      bump();
    },
    [selectedMessId, bump],
  );

  const markAllNotificationsAsRead = useCallback(() => {
    if (!selectedMessId) return;
    const unreadIds = notifications.filter((n) => !n.isRead).map((n) => n.id);
    if (unreadIds.length === 0) return;
    LocalMessStore.markAllNotificationsAsRead(selectedMessId, unreadIds);
    bump();
    showUiMessage('All notifications marked as read.');
  }, [selectedMessId, notifications, bump, showUiMessage]);

  const value: MessContextValue = {
    session,
    currentUserId,
    userProfile,
    knownUsers,
    allMesses,
    selectedMessId,
    currentMess,
    isManager,
    members,
    dailyMeals,
    bazaarExpenses,
    deposits,
    utilityBills,
    sharedBills,
    notifications,
    unreadNotificationsCount,
    auditLogs,
    summary,
    kitchenSummary,
    todayDhakaDate,
    selectedDate,
    uiMessage,
    showUiMessage,
    clearUiMessage,
    setSelectedDate,
    signIn,
    signOut,
    selectMess,
    createMess,
    joinMess,
    configureDeadlines,
    updateMealServiceStatus,
    saveMyBooking,
    setAutoBooking,
    managerOverrideBooking,
    saveFinalOrderSummary,
    addBazaarExpense,
    updateBazaarExpense,
    deleteBazaarExpense,
    addDeposit,
    updateDeposit,
    deleteDeposit,
    addUtilityBill,
    updateUtilityBill,
    deleteUtilityBill,
    promoteMemberToManager,
    demoteManagerToMember,
    resignAsManager,
    createSharedBill,
    updateSharedBill,
    deleteSharedBill,
    recordBillPayment,
    markNotificationAsRead,
    markAllNotificationsAsRead,
  };

  return <MessContext.Provider value={value}>{children}</MessContext.Provider>;
};

export function useMess(): MessContextValue {
  const ctx = useContext(MessContext);
  if (!ctx) {
    throw new Error('useMess must be used within a MessProvider');
  }
  return ctx;
}

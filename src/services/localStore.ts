import { MessCalculationEngine } from '../engine/calculationEngine';
import {
  AuditLog,
  BazaarExpense,
  BillAllocationType,
  BillPaymentRecord,
  BillPaymentStatus,
  DailyMealRecord,
  Deposit,
  FinalOrderSummary,
  InAppNotification,
  MealBookingEntry,
  Member,
  Mess,
  ServiceStatus,
  SharedBill,
  UserProfile,
  UtilityBill,
} from '../types/mess';
import { DhakaTimeHelper } from '../utils/dhakaTime';

const STORAGE_KEY = 'mess_meal_app_db_v1';

export interface AuthSession {
  uid: string;
  displayName: string;
  email: string;
}

export interface MessDataBucket {
  mess: Mess;
  members: Member[];
  dailyMeals: DailyMealRecord[];
  bazaarExpenses: BazaarExpense[];
  deposits: Deposit[];
  utilityBills: UtilityBill[];
  sharedBills: SharedBill[];
  notifications: InAppNotification[];
  auditLogs: AuditLog[];
}

export interface LocalDbSchema {
  session: AuthSession | null;
  users: Record<string, UserProfile>;
  messes: Record<string, MessDataBucket>;
}

function generateId(prefix = ''): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let out = prefix;
  for (let i = 0; i < 12; i++) {
    out += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return out;
}

function generateMessCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < 6; i++) {
    out += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return out;
}

function loadDb(): LocalDbSchema {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { session: null, users: {}, messes: {} };
    }
    const parsed = JSON.parse(raw) as LocalDbSchema;
    return {
      session: parsed.session ?? null,
      users: parsed.users ?? {},
      messes: parsed.messes ?? {},
    };
  } catch {
    return { session: null, users: {}, messes: {} };
  }
}

function saveDb(db: LocalDbSchema): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
}

function createAuditEntry(
  performedByUid: string,
  performedByName: string,
  params: {
    action: string;
    targetMemberId?: string;
    targetMemberName?: string;
    details: string;
    reason?: string;
  },
): AuditLog {
  const now = Date.now();
  return {
    id: generateId('audit_'),
    action: params.action,
    performedByUid,
    performedByName,
    targetMemberId: params.targetMemberId ?? '',
    targetMemberName: params.targetMemberName ?? '',
    details: params.details,
    reason: params.reason ?? '',
    timestamp: now,
    timestampFormatted: DhakaTimeHelper.formatDhakaTimestamp(now),
  };
}

export const LocalMessStore = {
  getDb(): LocalDbSchema {
    return loadDb();
  },

  getSession(): AuthSession | null {
    return loadDb().session;
  },

  signIn(displayName: string, email: string): AuthSession {
    const db = loadDb();
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = displayName.trim() || 'User';

    // Reuse existing UID for same email so switching accounts locally works smoothly
    const existingUser = Object.values(db.users).find(
      (u) => u.email.trim().toLowerCase() === cleanEmail && cleanEmail.length > 0,
    );

    const uid = existingUser?.id || generateId('usr_');
    const now = Date.now();

    const session: AuthSession = {
      uid,
      displayName: cleanName,
      email: cleanEmail || `${uid.toLowerCase()}@local.mess`,
    };

    const existingProfile = db.users[uid];
    db.users[uid] = {
      id: uid,
      displayName: cleanName,
      email: session.email,
      currentMessId: existingProfile?.currentMessId ?? '',
      createdAt: existingProfile?.createdAt ?? now,
      updatedAt: now,
    };
    db.session = session;
    saveDb(db);
    return session;
  },

  signOut(): void {
    const db = loadDb();
    db.session = null;
    saveDb(db);
  },

  getKnownUsers(): UserProfile[] {
    return Object.values(loadDb().users);
  },

  getUserProfile(userId: string): UserProfile | null {
    return loadDb().users[userId] ?? null;
  },

  saveUserProfile(profile: UserProfile): void {
    const db = loadDb();
    const now = Date.now();
    db.users[profile.id] = {
      ...profile,
      createdAt: profile.createdAt ?? now,
      updatedAt: now,
    };
    saveDb(db);
  },

  getMessBucket(messId: string): MessDataBucket | null {
    if (!messId) return null;
    return loadDb().messes[messId] ?? null;
  },

  getAllMesses(): Mess[] {
    return Object.values(loadDb().messes).map((b) => b.mess);
  },

  createMess(params: {
    userId: string;
    userEmail: string;
    messName: string;
    managerName: string;
    defaultMonth: string;
  }): string {
    const db = loadDb();
    let messId = generateMessCode();
    while (db.messes[messId]) {
      messId = generateMessCode();
    }
    const now = Date.now();
    const cleanMessName = params.messName.trim();
    const cleanManagerName = params.managerName.trim();

    const mess: Mess = {
      id: messId,
      name: cleanMessName,
      managerUid: params.userId,
      adminUids: [params.userId],
      memberUids: [params.userId],
      activeMonth: params.defaultMonth,
      lunchBookingDeadline: '09:00',
      nightBookingDeadline: '17:00',
      createdAt: now,
      updatedAt: now,
    };

    const managerMember: Member = {
      id: params.userId,
      userId: params.userId,
      displayName: cleanManagerName,
      room: 'Manager',
      role: 'MANAGER',
      isActive: true,
      autoBookEnabled: false,
      autoBookLunch: true,
      autoBookNight: true,
      autoBookUpdatedAt: '',
      createdAt: now,
    };

    db.messes[messId] = {
      mess,
      members: [managerMember],
      dailyMeals: [],
      bazaarExpenses: [],
      deposits: [],
      utilityBills: [],
      sharedBills: [],
      notifications: [],
      auditLogs: [],
    };

    const existingProfile = db.users[params.userId];
    db.users[params.userId] = {
      id: params.userId,
      displayName: existingProfile?.displayName || cleanManagerName,
      email: existingProfile?.email || params.userEmail,
      currentMessId: messId,
      createdAt: existingProfile?.createdAt ?? now,
      updatedAt: now,
    };

    saveDb(db);
    return messId;
  },

  joinMess(params: {
    userId: string;
    userEmail: string;
    messId: string;
    memberName: string;
    room: string;
  }): void {
    const db = loadDb();
    const cleanMessId = params.messId.trim();
    // Case-insensitive lookup for convenience with 6-char codes
    const matchedKey =
      Object.keys(db.messes).find(
        (k) => k.toLowerCase() === cleanMessId.toLowerCase(),
      ) ?? '';

    if (!matchedKey) {
      throw new Error(`No mess found with code "${cleanMessId}". Check the Mess ID from your manager.`);
    }

    const bucket = db.messes[matchedKey];
    const now = Date.now();
    const cleanMemberName = params.memberName.trim();

    if (!bucket.mess.memberUids.includes(params.userId)) {
      bucket.mess.memberUids = [...bucket.mess.memberUids, params.userId];
    }
    bucket.mess.updatedAt = now;

    const existingIdx = bucket.members.findIndex(
      (m) => m.id === params.userId || m.userId === params.userId,
    );
    const memberObj: Member = {
      id: params.userId,
      userId: params.userId,
      displayName: cleanMemberName,
      room: params.room.trim(),
      role: bucket.mess.managerUid === params.userId || bucket.mess.adminUids.includes(params.userId) ? 'MANAGER' : 'MEMBER',
      isActive: true,
      autoBookEnabled: existingIdx >= 0 ? bucket.members[existingIdx].autoBookEnabled : false,
      autoBookLunch: existingIdx >= 0 ? bucket.members[existingIdx].autoBookLunch : true,
      autoBookNight: existingIdx >= 0 ? bucket.members[existingIdx].autoBookNight : true,
      autoBookUpdatedAt: existingIdx >= 0 ? bucket.members[existingIdx].autoBookUpdatedAt : '',
      createdAt: existingIdx >= 0 ? bucket.members[existingIdx].createdAt : now,
    };

    if (existingIdx >= 0) {
      bucket.members[existingIdx] = memberObj;
    } else {
      bucket.members.push(memberObj);
    }

    const existingProfile = db.users[params.userId];
    db.users[params.userId] = {
      id: params.userId,
      displayName: existingProfile?.displayName || cleanMemberName,
      email: existingProfile?.email || params.userEmail,
      currentMessId: matchedKey,
      createdAt: existingProfile?.createdAt ?? now,
      updatedAt: now,
    };

    saveDb(db);
  },

  updateBookingDeadlines(
    messId: string,
    actorUid: string,
    actorName: string,
    lunchDeadline: string,
    nightDeadline: string,
  ): void {
    const db = loadDb();
    const bucket = db.messes[messId];
    if (!bucket) return;
    bucket.mess.lunchBookingDeadline = lunchDeadline;
    bucket.mess.nightBookingDeadline = nightDeadline;
    bucket.mess.updatedAt = Date.now();
    bucket.auditLogs.unshift(
      createAuditEntry(actorUid, actorName, {
        action: 'DEADLINE_CONFIGURED',
        details: `Lunch cutoff: ${lunchDeadline}, Night cutoff: ${nightDeadline} (Asia/Dhaka)`,
      }),
    );
    saveDb(db);
  },

  promoteMemberToManager(
    messId: string,
    actorUid: string,
    actorName: string,
    targetMember: Member,
  ): void {
    const db = loadDb();
    const bucket = db.messes[messId];
    if (!bucket) return;
    const targetUid = targetMember.userId || targetMember.id;
    const mIdx = bucket.members.findIndex((m) => m.id === targetMember.id || m.userId === targetUid);
    if (mIdx >= 0) {
      bucket.members[mIdx] = { ...bucket.members[mIdx], role: 'MANAGER' };
    }
    if (!bucket.mess.adminUids.includes(targetUid)) {
      bucket.mess.adminUids = [...bucket.mess.adminUids, targetUid];
    }
    bucket.mess.updatedAt = Date.now();
    bucket.auditLogs.unshift(
      createAuditEntry(actorUid, actorName, {
        action: 'MEMBER_PROMOTED_TO_MANAGER',
        targetMemberId: targetMember.id,
        targetMemberName: targetMember.displayName,
        details: `Promoted ${targetMember.displayName} to Manager`,
      }),
    );
    saveDb(db);
  },

  demoteManagerToMember(
    messId: string,
    actorUid: string,
    actorName: string,
    targetMember: Member,
  ): void {
    const db = loadDb();
    const bucket = db.messes[messId];
    if (!bucket) return;
    const targetUid = targetMember.userId || targetMember.id;
    const mIdx = bucket.members.findIndex((m) => m.id === targetMember.id || m.userId === targetUid);
    if (mIdx >= 0) {
      bucket.members[mIdx] = { ...bucket.members[mIdx], role: 'MEMBER' };
    }
    bucket.mess.adminUids = bucket.mess.adminUids.filter((id) => id !== targetUid);
    if (bucket.mess.managerUid === targetUid) {
      bucket.mess.managerUid = bucket.mess.adminUids[0] ?? '';
    }
    bucket.mess.updatedAt = Date.now();
    bucket.auditLogs.unshift(
      createAuditEntry(actorUid, actorName, {
        action: 'MANAGER_DEMOTED_TO_MEMBER',
        targetMemberId: targetMember.id,
        targetMemberName: targetMember.displayName,
        details: `Changed ${targetMember.displayName}'s role to Member`,
      }),
    );
    saveDb(db);
  },

  resignAsManager(
    messId: string,
    actorUid: string,
    actorName: string,
    currentMemberId: string,
    successor: Member | null,
  ): void {
    const db = loadDb();
    const bucket = db.messes[messId];
    if (!bucket) return;

    const curIdx = bucket.members.findIndex(
      (m) => m.id === currentMemberId || m.userId === actorUid,
    );
    if (curIdx >= 0) {
      bucket.members[curIdx] = { ...bucket.members[curIdx], role: 'MEMBER' };
    }
    bucket.mess.adminUids = bucket.mess.adminUids.filter((id) => id !== actorUid);

    if (successor) {
      const successorUid = successor.userId || successor.id;
      const sIdx = bucket.members.findIndex(
        (m) => m.id === successor.id || m.userId === successorUid,
      );
      if (sIdx >= 0) {
        bucket.members[sIdx] = { ...bucket.members[sIdx], role: 'MANAGER' };
      }
      if (!bucket.mess.adminUids.includes(successorUid)) {
        bucket.mess.adminUids = [...bucket.mess.adminUids, successorUid];
      }
      if (bucket.mess.managerUid === actorUid) {
        bucket.mess.managerUid = successorUid;
      }
    } else if (bucket.mess.managerUid === actorUid && bucket.mess.adminUids.length > 0) {
      bucket.mess.managerUid = bucket.mess.adminUids[0];
    }

    bucket.mess.updatedAt = Date.now();
    const detailsText = successor
      ? `${actorName} resigned and transferred Manager role to ${successor.displayName}`
      : `${actorName} resigned from Manager role`;

    bucket.auditLogs.unshift(
      createAuditEntry(actorUid, actorName, {
        action: 'MANAGER_RESIGNED',
        targetMemberId: successor?.id ?? currentMemberId,
        targetMemberName: successor?.displayName ?? '',
        details: detailsText,
      }),
    );
    saveDb(db);
  },

  updateMealServiceStatus(
    messId: string,
    actorUid: string,
    actorName: string,
    date: string,
    lunchStatus: ServiceStatus,
    nightStatus: ServiceStatus,
    cancellationReason: string,
  ): void {
    const db = loadDb();
    const bucket = db.messes[messId];
    if (!bucket) return;
    const isFriday = DhakaTimeHelper.isFriday(date);
    const effectiveNight: ServiceStatus = isFriday ? 'CANCELLED' : nightStatus;

    const idx = bucket.dailyMeals.findIndex((r) => r.id === date || r.date === date);
    if (idx >= 0) {
      bucket.dailyMeals[idx] = {
        ...bucket.dailyMeals[idx],
        isFriday,
        lunchServiceStatus: lunchStatus,
        nightServiceStatus: effectiveNight,
        cancellationReason,
        updatedBy: actorUid,
        updatedAt: Date.now(),
      };
    } else {
      bucket.dailyMeals.push({
        id: date,
        date,
        isFriday,
        lunchServiceStatus: lunchStatus,
        nightServiceStatus: effectiveNight,
        cancellationReason,
        bookings: {},
        attendances: {},
        totalDayUnits: 0,
        updatedBy: actorUid,
        updatedAt: Date.now(),
      });
    }

    bucket.auditLogs.unshift(
      createAuditEntry(actorUid, actorName, {
        action: 'SERVICE_STATUS_UPDATED',
        details: `Date: ${date} | Lunch: ${lunchStatus}, Night: ${effectiveNight} | Reason: ${cancellationReason}`,
        reason: cancellationReason,
      }),
    );
    saveDb(db);
  },

  saveMemberBooking(params: {
    messId: string;
    actorUid: string;
    date: string;
    memberId: string;
    booking: MealBookingEntry;
    lunchDeadline: string;
    nightDeadline: string;
    isManager: boolean;
  }): void {
    const {
      messId,
      actorUid,
      date,
      memberId,
      booking,
      lunchDeadline,
      nightDeadline,
      isManager,
    } = params;
    const isFriday = DhakaTimeHelper.isFriday(date);
    const isLunchPassed = DhakaTimeHelper.isDeadlinePassed(date, lunchDeadline);
    const isNightPassed = isFriday
      ? true
      : DhakaTimeHelper.isDeadlinePassed(date, nightDeadline);

    if (!isManager && isLunchPassed && isNightPassed) {
      throw new Error(
        'Booking deadlines for both Lunch and Night have passed. Bookings are locked.',
      );
    }

    const db = loadDb();
    const bucket = db.messes[messId];
    if (!bucket) return;

    const effectiveBooking: MealBookingEntry = isFriday
      ? {
          ...booking,
          statusNight: 'CANCELLED',
          guestNight: 0,
          updatedBy: actorUid,
        }
      : {
          ...booking,
          updatedBy: actorUid,
        };

    const idx = bucket.dailyMeals.findIndex((r) => r.id === date || r.date === date);
    if (idx < 0) {
      bucket.dailyMeals.push({
        id: date,
        date,
        isFriday,
        lunchServiceStatus: 'ACTIVE',
        nightServiceStatus: isFriday ? 'CANCELLED' : 'ACTIVE',
        cancellationReason: '',
        bookings: { [memberId]: effectiveBooking },
        attendances: {},
        totalDayUnits: 0,
        updatedBy: actorUid,
        updatedAt: Date.now(),
      });
    } else {
      bucket.dailyMeals[idx] = {
        ...bucket.dailyMeals[idx],
        isFriday,
        bookings: {
          ...bucket.dailyMeals[idx].bookings,
          [memberId]: effectiveBooking,
        },
        updatedBy: actorUid,
        updatedAt: Date.now(),
      };
    }

    saveDb(db);
  },

  updateMemberAutoBookPreference(params: {
    messId: string;
    memberId: string;
    enabled: boolean;
    bookLunch: boolean;
    bookNight: boolean;
    updatedDate: string;
  }): void {
    const db = loadDb();
    const bucket = db.messes[params.messId];
    if (!bucket) return;
    const idx = bucket.members.findIndex((m) => m.id === params.memberId);
    if (idx >= 0) {
      bucket.members[idx] = {
        ...bucket.members[idx],
        autoBookEnabled: params.enabled,
        autoBookLunch: params.bookLunch,
        autoBookNight: params.bookNight,
        autoBookUpdatedAt: params.updatedDate,
      };
      saveDb(db);
    }
  },

  clearAutoBookedEntries(params: {
    messId: string;
    actorUid: string;
    memberId: string;
    todayDate: string;
    lunchDeadline: string;
    nightDeadline: string;
  }): void {
    const db = loadDb();
    const bucket = db.messes[params.messId];
    if (!bucket) return;

    let changed = false;
    bucket.dailyMeals = bucket.dailyMeals.map((record) => {
      const date = record.date || record.id;
      if (!date || date < params.todayDate) return record;
      const entry = record.bookings[params.memberId];
      if (!entry || !entry.autoBooked) return record;

      const isFri = record.isFriday || DhakaTimeHelper.isFriday(date);
      const lunchPassed = DhakaTimeHelper.isDeadlinePassed(date, params.lunchDeadline);
      const nightPassed = isFri
        ? true
        : DhakaTimeHelper.isDeadlinePassed(date, params.nightDeadline);
      if (lunchPassed && nightPassed) return record;

      changed = true;
      return {
        ...record,
        bookings: {
          ...record.bookings,
          [params.memberId]: {
            ...entry,
            statusLunch: !lunchPassed ? 'NO_RESPONSE' : entry.statusLunch,
            statusNight: !isFri && !nightPassed ? 'NO_RESPONSE' : entry.statusNight,
            guestLunch: !lunchPassed ? 0 : entry.guestLunch,
            guestNight: !isFri && !nightPassed ? 0 : entry.guestNight,
            updatedBy: params.actorUid,
            autoBooked: false,
          },
        },
        updatedBy: params.actorUid,
        updatedAt: Date.now(),
      };
    });

    if (changed) {
      saveDb(db);
    }
  },

  saveFinalMealOrderSummary(params: {
    messId: string;
    actorUid: string;
    actorName: string;
    date: string;
    mealType: 'LUNCH' | 'NIGHT';
    summary: FinalOrderSummary;
  }): void {
    const db = loadDb();
    const bucket = db.messes[params.messId];
    if (!bucket) return;

    const isFriday = DhakaTimeHelper.isFriday(params.date);
    const savedSummary: FinalOrderSummary = {
      ...params.summary,
      isLocked: true,
      savedAt: Date.now(),
    };
    const fieldName = params.mealType === 'LUNCH' ? 'lunchFinalOrder' : 'nightFinalOrder';

    const idx = bucket.dailyMeals.findIndex(
      (r) => r.id === params.date || r.date === params.date,
    );
    if (idx < 0) {
      bucket.dailyMeals.push({
        id: params.date,
        date: params.date,
        isFriday,
        lunchServiceStatus: 'ACTIVE',
        nightServiceStatus: isFriday ? 'CANCELLED' : 'ACTIVE',
        cancellationReason: '',
        bookings: {},
        attendances: {},
        [fieldName]: savedSummary,
        totalDayUnits: 0,
        updatedBy: params.actorUid,
        updatedAt: Date.now(),
      });
    } else {
      bucket.dailyMeals[idx] = {
        ...bucket.dailyMeals[idx],
        [fieldName]: savedSummary,
        updatedAt: Date.now(),
      };
    }

    bucket.auditLogs.unshift(
      createAuditEntry(params.actorUid, params.actorName, {
        action: 'FINAL_ORDER_LOCKED',
        details: `Final ${params.summary.mealType} order locked for ${params.date}: ${params.summary.totalPortions} total portions (${params.summary.memberCount} members, ${params.summary.guestCount} guests). Kitchen preparation summary saved.`,
      }),
    );
    saveDb(db);
  },

  overrideMemberBooking(params: {
    messId: string;
    actorUid: string;
    actorName: string;
    date: string;
    memberId: string;
    memberName: string;
    booking: MealBookingEntry;
    reason: string;
  }): void {
    const db = loadDb();
    const bucket = db.messes[params.messId];
    if (!bucket) return;
    const isFriday = DhakaTimeHelper.isFriday(params.date);

    const effectiveBooking: MealBookingEntry = {
      statusLunch: params.booking.statusLunch,
      statusNight: isFriday ? 'CANCELLED' : params.booking.statusNight,
      guestLunch: params.booking.guestLunch,
      guestNight: isFriday ? 0 : params.booking.guestNight,
      updatedBy: params.actorUid,
      managerOverrideReason: params.reason,
      autoBooked: false,
    };

    const idx = bucket.dailyMeals.findIndex(
      (r) => r.id === params.date || r.date === params.date,
    );
    if (idx < 0) {
      bucket.dailyMeals.push({
        id: params.date,
        date: params.date,
        isFriday,
        lunchServiceStatus: 'ACTIVE',
        nightServiceStatus: isFriday ? 'CANCELLED' : 'ACTIVE',
        cancellationReason: '',
        bookings: { [params.memberId]: effectiveBooking },
        attendances: {},
        totalDayUnits: 0,
        updatedBy: params.actorUid,
        updatedAt: Date.now(),
      });
    } else {
      bucket.dailyMeals[idx] = {
        ...bucket.dailyMeals[idx],
        isFriday,
        bookings: {
          ...bucket.dailyMeals[idx].bookings,
          [params.memberId]: effectiveBooking,
        },
        updatedBy: params.actorUid,
        updatedAt: Date.now(),
      };
    }

    bucket.auditLogs.unshift(
      createAuditEntry(params.actorUid, params.actorName, {
        action: 'BOOKING_OVERRIDE',
        targetMemberId: params.memberId,
        targetMemberName: params.memberName,
        details: `Date: ${params.date} | Lunch: ${effectiveBooking.statusLunch}, Night: ${effectiveBooking.statusNight}, Guests: L${effectiveBooking.guestLunch}/N${effectiveBooking.guestNight}`,
        reason: params.reason,
      }),
    );
    saveDb(db);
  },

  addDeposit(
    messId: string,
    actorUid: string,
    actorName: string,
    deposit: Omit<Deposit, 'id' | 'recordedBy' | 'createdAt'>,
  ): void {
    const db = loadDb();
    const bucket = db.messes[messId];
    if (!bucket) return;
    const newDeposit: Deposit = {
      ...deposit,
      id: generateId('dep_'),
      recordedBy: actorUid,
      createdAt: Date.now(),
    };
    bucket.deposits.unshift(newDeposit);
    bucket.auditLogs.unshift(
      createAuditEntry(actorUid, actorName, {
        action: 'DEPOSIT_RECORDED',
        targetMemberId: deposit.memberId,
        targetMemberName: deposit.memberName,
        details: `Amount: ${deposit.amount} | Method: ${deposit.paymentMethod} | Notes: ${deposit.notes}`,
      }),
    );
    saveDb(db);
  },

  updateDeposit(
    messId: string,
    actorUid: string,
    actorName: string,
    deposit: Deposit,
  ): void {
    const db = loadDb();
    const bucket = db.messes[messId];
    if (!bucket) return;
    bucket.deposits = bucket.deposits.map((d) => (d.id === deposit.id ? deposit : d));
    bucket.auditLogs.unshift(
      createAuditEntry(actorUid, actorName, {
        action: 'DEPOSIT_UPDATED',
        targetMemberId: deposit.memberId,
        targetMemberName: deposit.memberName,
        details: `Updated deposit to: ${deposit.amount} (${deposit.paymentMethod}) | Notes: ${deposit.notes}`,
      }),
    );
    saveDb(db);
  },

  deleteDeposit(
    messId: string,
    actorUid: string,
    actorName: string,
    deposit: Deposit,
  ): void {
    const db = loadDb();
    const bucket = db.messes[messId];
    if (!bucket) return;
    bucket.deposits = bucket.deposits.filter((d) => d.id !== deposit.id);
    bucket.auditLogs.unshift(
      createAuditEntry(actorUid, actorName, {
        action: 'DEPOSIT_DELETED',
        targetMemberId: deposit.memberId,
        targetMemberName: deposit.memberName,
        details: `Deleted deposit of ${deposit.amount} (${deposit.paymentMethod})`,
      }),
    );
    saveDb(db);
  },

  addUtilityBill(
    messId: string,
    actorUid: string,
    actorName: string,
    bill: Omit<UtilityBill, 'id' | 'createdAt'>,
  ): void {
    const db = loadDb();
    const bucket = db.messes[messId];
    if (!bucket) return;
    bucket.utilityBills.unshift({
      ...bill,
      id: generateId('util_'),
      createdAt: Date.now(),
    });
    bucket.auditLogs.unshift(
      createAuditEntry(actorUid, actorName, {
        action: 'UTILITY_BILL_ADDED',
        details: `Title: ${bill.title} | Amount: ${bill.amount} | Month: ${bill.month}`,
      }),
    );
    saveDb(db);
  },

  updateUtilityBill(
    messId: string,
    actorUid: string,
    actorName: string,
    bill: UtilityBill,
  ): void {
    const db = loadDb();
    const bucket = db.messes[messId];
    if (!bucket) return;
    bucket.utilityBills = bucket.utilityBills.map((b) =>
      b.id === bill.id ? bill : b,
    );
    bucket.auditLogs.unshift(
      createAuditEntry(actorUid, actorName, {
        action: 'UTILITY_BILL_UPDATED',
        details: `Updated bill: ${bill.title} | Amount: ${bill.amount} | Month: ${bill.month}`,
      }),
    );
    saveDb(db);
  },

  deleteUtilityBill(
    messId: string,
    actorUid: string,
    actorName: string,
    billId: string,
    billTitle: string,
    amount: number,
  ): void {
    const db = loadDb();
    const bucket = db.messes[messId];
    if (!bucket) return;
    bucket.utilityBills = bucket.utilityBills.filter((b) => b.id !== billId);
    bucket.auditLogs.unshift(
      createAuditEntry(actorUid, actorName, {
        action: 'UTILITY_BILL_DELETED',
        details: `Deleted bill: ${billTitle} | Amount: ${amount}`,
      }),
    );
    saveDb(db);
  },

  addBazaarExpense(
    messId: string,
    expense: Omit<BazaarExpense, 'id' | 'createdAt'>,
  ): void {
    const db = loadDb();
    const bucket = db.messes[messId];
    if (!bucket) return;
    bucket.bazaarExpenses.unshift({
      ...expense,
      id: generateId('baz_'),
      createdAt: Date.now(),
    });
    saveDb(db);
  },

  updateBazaarExpense(
    messId: string,
    actorUid: string,
    actorName: string,
    expense: BazaarExpense,
  ): void {
    const db = loadDb();
    const bucket = db.messes[messId];
    if (!bucket) return;
    bucket.bazaarExpenses = bucket.bazaarExpenses.map((e) =>
      e.id === expense.id ? expense : e,
    );
    bucket.auditLogs.unshift(
      createAuditEntry(actorUid, actorName, {
        action: 'BAZAAR_UPDATED',
        details: `Updated expense: ${expense.itemsDescription} | Amount: ${expense.amount} | Date: ${expense.date}`,
      }),
    );
    saveDb(db);
  },

  deleteBazaarExpense(messId: string, expenseId: string): void {
    const db = loadDb();
    const bucket = db.messes[messId];
    if (!bucket) return;
    bucket.bazaarExpenses = bucket.bazaarExpenses.filter((e) => e.id !== expenseId);
    saveDb(db);
  },

  createSharedBill(params: {
    messId: string;
    actorUid: string;
    actorName: string;
    title: string;
    allocationType: BillAllocationType;
    amountInput: number;
    month: string;
    deadline: string;
    notes: string;
    activeMembers: Member[];
    customShares: Record<string, number>;
  }): string {
    const {
      messId,
      actorUid,
      actorName,
      title,
      allocationType,
      amountInput,
      month,
      deadline,
      notes,
      activeMembers,
      customShares,
    } = params;
    if (activeMembers.length === 0) {
      throw new Error('Cannot create a shared bill with 0 active members.');
    }

    const db = loadDb();
    const bucket = db.messes[messId];
    if (!bucket) throw new Error('Mess not found');

    const memberCount = activeMembers.length;
    const isCustom =
      allocationType === BillAllocationType.CUSTOM_PER_MEMBER &&
      Object.keys(customShares).length > 0;

    let totalAmount = 0;
    let perMemberAmount = 0;

    if (isCustom) {
      totalAmount = MessCalculationEngine.roundTwoDecimals(
        Object.values(customShares).reduce((a, b) => a + b, 0),
      );
      perMemberAmount =
        memberCount > 0
          ? MessCalculationEngine.roundTwoDecimals(totalAmount / memberCount)
          : 0;
    } else if (allocationType === BillAllocationType.FIXED_PER_MEMBER) {
      totalAmount = MessCalculationEngine.roundTwoDecimals(amountInput * memberCount);
      perMemberAmount = MessCalculationEngine.roundTwoDecimals(amountInput);
    } else {
      totalAmount = MessCalculationEngine.roundTwoDecimals(amountInput);
      perMemberAmount = MessCalculationEngine.roundTwoDecimals(totalAmount / memberCount);
    }

    const assignedMemberIds = activeMembers.map((m) => m.id);
    const memberShares: Record<string, number> = {};
    const memberNames: Record<string, string> = {};
    const initialPayments: Record<string, BillPaymentRecord> = {};

    for (const m of activeMembers) {
      const share = isCustom ? (customShares[m.id] ?? 0) : perMemberAmount;
      memberShares[m.id] = share;
      memberNames[m.id] = m.displayName.trim() || 'Member';
      initialPayments[m.id] = {
        memberId: m.id,
        memberName: memberNames[m.id],
        amountPaid: 0,
        status: BillPaymentStatus.UNPAID,
        paymentDate: '',
        paymentMethod: 'Cash',
        notes: '',
        recordedByUid: '',
        recordedByName: '',
      };
    }

    const billId = generateId('sb_');
    const now = Date.now();
    const newBill: SharedBill = {
      id: billId,
      title,
      allocationType,
      totalAmount,
      perMemberAmount,
      month,
      deadline,
      notes,
      assignedMemberIds,
      memberShares,
      memberNames,
      payments: initialPayments,
      createdByUid: actorUid,
      createdByName: actorName,
      createdAt: now,
      updatedAt: now,
    };

    bucket.sharedBills.unshift(newBill);

    // Send in-app notification to all assigned members
    for (const member of activeMembers) {
      const memShare = memberShares[member.id] ?? perMemberAmount;
      bucket.notifications.unshift({
        id: generateId('notif_'),
        messId,
        targetMemberId: member.id,
        targetMemberName: member.displayName,
        title: `New Shared Bill: ${title}`,
        message: `You have been assigned ৳${memShare} for '${title}'. Payment deadline: ${deadline}.`,
        billId,
        amount: memShare,
        deadline,
        isRead: false,
        createdAt: now,
        timestampFormatted: DhakaTimeHelper.formatDhakaTimestamp(now),
      });
    }

    bucket.auditLogs.unshift(
      createAuditEntry(actorUid, actorName, {
        action: 'SHARED_BILL_PUBLISHED',
        details: `Published '${title}': ৳${totalAmount} total (${allocationType}) for ${memberCount} members. Deadline: ${deadline}`,
      }),
    );

    saveDb(db);
    return billId;
  },

  updateSharedBill(
    messId: string,
    actorUid: string,
    actorName: string,
    bill: SharedBill,
    updatedShares: Record<string, number> | null = null,
  ): void {
    const db = loadDb();
    const bucket = db.messes[messId];
    if (!bucket) return;

    const finalShares = updatedShares ?? bill.memberShares;
    const finalTotal = updatedShares
      ? MessCalculationEngine.roundTwoDecimals(
          Object.values(finalShares).reduce((a, b) => a + b, 0),
        )
      : bill.totalAmount;
    const finalPerMem =
      bill.assignedMemberIds.length > 0
        ? MessCalculationEngine.roundTwoDecimals(
            finalTotal / bill.assignedMemberIds.length,
          )
        : bill.perMemberAmount;

    const updatedPayments: Record<string, BillPaymentRecord> = {};
    for (const [memId, record] of Object.entries(bill.payments)) {
      const share = finalShares[memId] ?? finalPerMem;
      let status = BillPaymentStatus.UNPAID;
      if (record.amountPaid >= share && share > 0) {
        status = BillPaymentStatus.PAID;
      } else if (record.amountPaid > 0) {
        status = BillPaymentStatus.PARTIALLY_PAID;
      }
      updatedPayments[memId] = {
        ...record,
        status,
        updatedAt: Date.now(),
      };
    }

    const updatedBill: SharedBill = {
      ...bill,
      totalAmount: finalTotal,
      perMemberAmount: finalPerMem,
      memberShares: finalShares,
      payments: updatedPayments,
      updatedAt: Date.now(),
    };

    bucket.sharedBills = bucket.sharedBills.map((b) =>
      b.id === bill.id ? updatedBill : b,
    );
    bucket.auditLogs.unshift(
      createAuditEntry(actorUid, actorName, {
        action: 'SHARED_BILL_UPDATED',
        details: `Updated bill details for '${bill.title}' (Total: ৳${finalTotal}, Deadline: ${bill.deadline})`,
      }),
    );
    saveDb(db);
  },

  deleteSharedBill(
    messId: string,
    actorUid: string,
    actorName: string,
    billId: string,
    billTitle: string,
    totalAmount: number,
  ): void {
    const db = loadDb();
    const bucket = db.messes[messId];
    if (!bucket) return;
    bucket.sharedBills = bucket.sharedBills.filter((b) => b.id !== billId);
    bucket.auditLogs.unshift(
      createAuditEntry(actorUid, actorName, {
        action: 'SHARED_BILL_DELETED',
        details: `Deleted shared bill '${billTitle}' (Total: ৳${totalAmount})`,
      }),
    );
    saveDb(db);
  },

  recordBillPayment(params: {
    messId: string;
    actorUid: string;
    actorName: string;
    billId: string;
    memberId: string;
    memberName: string;
    assignedShare: number;
    amountPaid: number;
    paymentMethod: string;
    paymentDate: string;
    notes: string;
  }): void {
    const db = loadDb();
    const bucket = db.messes[params.messId];
    if (!bucket) return;

    let status = BillPaymentStatus.UNPAID;
    if (params.amountPaid >= params.assignedShare && params.assignedShare > 0) {
      status = BillPaymentStatus.PAID;
    } else if (params.amountPaid > 0) {
      status = BillPaymentStatus.PARTIALLY_PAID;
    }

    const paymentRecord: BillPaymentRecord = {
      memberId: params.memberId,
      memberName: params.memberName,
      amountPaid: params.amountPaid,
      status,
      paymentDate: params.paymentDate,
      paymentMethod: params.paymentMethod,
      notes: params.notes,
      recordedByUid: params.actorUid,
      recordedByName: params.actorName,
      updatedAt: Date.now(),
    };

    bucket.sharedBills = bucket.sharedBills.map((b) =>
      b.id === params.billId
        ? {
            ...b,
            payments: { ...b.payments, [params.memberId]: paymentRecord },
            updatedAt: Date.now(),
          }
        : b,
    );

    bucket.auditLogs.unshift(
      createAuditEntry(params.actorUid, params.actorName, {
        action: 'BILL_PAYMENT_RECORDED',
        targetMemberId: params.memberId,
        targetMemberName: params.memberName,
        details: `Recorded payment of ৳${params.amountPaid} for ${params.memberName} (Status: ${status}, Method: ${params.paymentMethod})`,
      }),
    );
    saveDb(db);
  },

  markNotificationAsRead(messId: string, notificationId: string): void {
    const db = loadDb();
    const bucket = db.messes[messId];
    if (!bucket) return;
    bucket.notifications = bucket.notifications.map((n) =>
      n.id === notificationId ? { ...n, isRead: true } : n,
    );
    saveDb(db);
  },

  markAllNotificationsAsRead(messId: string, notificationIds: string[]): void {
    const db = loadDb();
    const bucket = db.messes[messId];
    if (!bucket || notificationIds.length === 0) return;
    const idSet = new Set(notificationIds);
    bucket.notifications = bucket.notifications.map((n) =>
      idSet.has(n.id) ? { ...n, isRead: true } : n,
    );
    saveDb(db);
  },
};

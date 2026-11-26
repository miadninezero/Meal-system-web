# Mess Meal

Hostel and bachelor mess meal management web application rewritten with React, Vite, TypeScript, and Tailwind CSS.

## Features

- **Dashboard**: Live meal rate, personal deposit/cost balance, today's kitchen order snapshot, mess fund health, invite code sharing, and manager role governance (promote, demote, resign with handover).
- **Daily Meals & Bookings**: `Asia/Dhaka` (UTC+6) cutoff enforcement, Friday night off handling, Lunch (1.5) / Night (1.0) / Full Day (2.0) unit weighting, guest meal tracking, auto-booking preferences, final kitchen order locking, and audited manager overrides.
- **Bazaar Log**: Food and grocery expenditure tracking isolated from shared utility bills, category filters, and buyer/manager editing.
- **Shared Mess Bills**: Fixed-per-member, equal-split, and custom-share billing with payment tracking (`Cash`, `bKash`, `Nagad`, `Bank`) and in-app member notifications.
- **Advance Deposits**: Member advance deposit ledger with read-only visibility for members and manager CRUD.
- **Monthly Settlement**: Per-member meal cost, shared bill dues, deposits, refunds, clipboard statement export, legacy utility management, and audit history.

## Local Persistence

Data is persisted locally in `localStorage` (`mess_meal_app_db_v1`) per browser, with local profile sign-in and multi-profile switching supported out of the box.

## Scripts

```bash
npm install
npm run dev
npm run build
npm run lint
```

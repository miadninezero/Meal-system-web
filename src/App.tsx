import React, { useState } from 'react';
import { AppShell } from './components/AppShell';
import { MessProvider, useMess } from './context/MessContext';
import { BazaarLogScreen } from './screens/BazaarLogScreen';
import { DailyMealsScreen } from './screens/DailyMealsScreen';
import { DashboardScreen } from './screens/DashboardScreen';
import { DepositsScreen } from './screens/DepositsScreen';
import { MessSelectScreen } from './screens/MessSelectScreen';
import { SettlementScreen } from './screens/SettlementScreen';
import { SharedBillsScreen } from './screens/SharedBillsScreen';
import { SignInScreen } from './screens/SignInScreen';
import { Screen } from './types/mess';

const MessAppRouter: React.FC = () => {
  const { session, selectedMessId } = useMess();
  const [currentScreen, setCurrentScreen] = useState<Screen>(Screen.DASHBOARD);

  if (!session) {
    return <SignInScreen />;
  }

  if (!selectedMessId || currentScreen === Screen.MESS_SELECT) {
    return (
      <MessSelectScreen
        onEnteredMess={() => setCurrentScreen(Screen.DASHBOARD)}
      />
    );
  }

  return (
    <AppShell currentScreen={currentScreen} onNavigate={setCurrentScreen}>
      {currentScreen === Screen.DASHBOARD && (
        <DashboardScreen onNavigate={setCurrentScreen} />
      )}
      {currentScreen === Screen.DAILY_MEALS && <DailyMealsScreen />}
      {currentScreen === Screen.BAZAAR_LOG && <BazaarLogScreen />}
      {currentScreen === Screen.SHARED_BILLS && <SharedBillsScreen />}
      {currentScreen === Screen.DEPOSITS && <DepositsScreen />}
      {currentScreen === Screen.SETTLEMENT && (
        <SettlementScreen onNavigate={setCurrentScreen} />
      )}
    </AppShell>
  );
};

export function App() {
  return (
    <MessProvider>
      <MessAppRouter />
    </MessProvider>
  );
}

export default App;

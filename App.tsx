// App.tsx
import React, { useEffect } from 'react';
import { initDatabase } from './src/database/database';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  useEffect(() => {
    initDatabase();
  }, []);

  return <AppNavigator />;
}
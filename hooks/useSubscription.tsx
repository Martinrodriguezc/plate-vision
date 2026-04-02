import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { useAuth } from "./useAuth";
import { configurePurchases, checkProStatus } from "../services/purchases";
import { canScanToday } from "../services/scanLimit";

interface SubscriptionContextType {
  isPro: boolean;
  scansRemaining: number;
  scansTotal: number;
  loading: boolean;
  refresh: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType>({
  isPro: false,
  scansRemaining: 0,
  scansTotal: 3,
  loading: true,
  refresh: async () => {},
});

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [isPro, setIsPro] = useState(false);
  const [scansRemaining, setScansRemaining] = useState(0);
  const [scansTotal, setScansTotal] = useState(3);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) return;

    try {
      await configurePurchases(user.id);
    } catch {
      // Expo Go no soporta RevenueCat
    }

    try {
      const proStatus = await checkProStatus();
      setIsPro(proStatus);
    } catch {
      setIsPro(false);
    }

    try {
      const { remaining, total } = await canScanToday(false);
      setScansRemaining(remaining);
      setScansTotal(total);
    } catch {
      // Default free values
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) refresh();
  }, [user, refresh]);

  return (
    <SubscriptionContext.Provider
      value={{ isPro, scansRemaining, scansTotal, loading, refresh }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  return useContext(SubscriptionContext);
}

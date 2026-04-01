import Purchases, {
  CustomerInfo,
  PurchasesPackage,
} from "react-native-purchases";
import { Platform } from "react-native";
import Constants from "expo-constants";

const REVENUECAT_API_KEY = Constants.expoConfig?.extra?.revenueCatApiKey ?? "";
const ENTITLEMENT_ID = "pro";

let isConfigured = false;

export async function configurePurchases(userId: string) {
  if (isConfigured || !REVENUECAT_API_KEY) return;

  if (Platform.OS === "ios") {
    Purchases.configure({
      apiKey: REVENUECAT_API_KEY,
      appUserID: userId,
    });
    isConfigured = true;
  }
}

export async function checkProStatus(): Promise<boolean> {
  try {
    const customerInfo = await Purchases.getCustomerInfo();
    return customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;
  } catch {
    return false;
  }
}

export async function getOfferings(): Promise<PurchasesPackage | null> {
  try {
    const offerings = await Purchases.getOfferings();
    return offerings.current?.availablePackages[0] ?? null;
  } catch {
    return null;
  }
}

export async function purchasePackage(
  pkg: PurchasesPackage
): Promise<{ success: boolean; error?: string }> {
  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    const isPro = customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;
    return { success: isPro };
  } catch (error: any) {
    if (error.userCancelled) {
      return { success: false };
    }
    return { success: false, error: error.message || "Error al procesar compra" };
  }
}

export async function restorePurchases(): Promise<{
  success: boolean;
  isPro: boolean;
  error?: string;
}> {
  try {
    const customerInfo = await Purchases.restorePurchases();
    const isPro = customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;
    return { success: true, isPro };
  } catch (error: any) {
    return { success: false, isPro: false, error: error.message };
  }
}

export async function getManagementUrl(): Promise<string | null> {
  try {
    const customerInfo = await Purchases.getCustomerInfo();
    return customerInfo.managementURL;
  } catch {
    return null;
  }
}

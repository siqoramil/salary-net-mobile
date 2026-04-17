import { env } from '../config/env';
import { PAYWALL_RESULT, revenuecatApi } from './revenuecat.api';
import { PRO_ENTITLEMENT_ID } from './revenuecat.types';

let configured = false;

export const revenuecatService = {
  init(): void {
    if (configured) return;
    if (!env.REVENUECAT_KEY) {
      if (__DEV__) {
        console.warn('[RevenueCat] No API key configured — skipping init');
      }
      return;
    }
    revenuecatApi.configure(env.REVENUECAT_KEY);
    configured = true;
  },

  isConfigured(): boolean {
    return configured;
  },

  async hasProEntitlement(): Promise<boolean> {
    if (!configured) return false;
    try {
      const info = await revenuecatApi.getCustomerInfo();
      return typeof info.entitlements.active[PRO_ENTITLEMENT_ID] !== 'undefined';
    } catch (err) {
      if (__DEV__) console.warn('[RevenueCat] getCustomerInfo failed:', err);
      return false;
    }
  },

  async presentPaywall(): Promise<boolean> {
    if (!configured) {
      if (__DEV__) console.warn('[RevenueCat] presentPaywall called before init');
      return false;
    }
    try {
      const result = await revenuecatApi.presentPaywall();
      return result === PAYWALL_RESULT.PURCHASED || result === PAYWALL_RESULT.RESTORED;
    } catch (err) {
      if (__DEV__) console.warn('[RevenueCat] presentPaywall failed:', err);
      return false;
    }
  },

  async restorePurchases(): Promise<boolean> {
    if (!configured) return false;
    try {
      const info = await revenuecatApi.restorePurchases();
      return typeof info.entitlements.active[PRO_ENTITLEMENT_ID] !== 'undefined';
    } catch (err) {
      if (__DEV__) console.warn('[RevenueCat] restorePurchases failed:', err);
      return false;
    }
  },
};

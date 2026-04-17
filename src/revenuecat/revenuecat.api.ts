import Purchases, { LOG_LEVEL } from 'react-native-purchases';
import RevenueCatUI, { PAYWALL_RESULT } from 'react-native-purchases-ui';

import type { CustomerInfo } from './revenuecat.types';

export const revenuecatApi = {
  configure(apiKey: string): void {
    Purchases.setLogLevel(__DEV__ ? LOG_LEVEL.DEBUG : LOG_LEVEL.ERROR);
    Purchases.configure({ apiKey });
  },

  async getCustomerInfo(): Promise<CustomerInfo> {
    return Purchases.getCustomerInfo();
  },

  async presentPaywall(): Promise<PAYWALL_RESULT> {
    return RevenueCatUI.presentPaywall();
  },

  async restorePurchases(): Promise<CustomerInfo> {
    return Purchases.restorePurchases();
  },

  async logIn(appUserId: string): Promise<CustomerInfo> {
    const { customerInfo } = await Purchases.logIn(appUserId);
    return customerInfo;
  },

  async logOut(): Promise<CustomerInfo> {
    return Purchases.logOut();
  },
};

export { PAYWALL_RESULT };

import type { CustomerInfo, PurchasesOffering } from 'react-native-purchases';

export type { CustomerInfo, PurchasesOffering };

export const PRO_ENTITLEMENT_ID = 'Ramils Pro';

export interface PaywallOutcome {
  purchased: boolean;
  restored: boolean;
  cancelled: boolean;
  error: boolean;
}

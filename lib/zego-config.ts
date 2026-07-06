// Zego Cloud Configuration
// Credentials collected from mobile projects

export const ZEGO_CONFIG = {
  appID: 1139669565,
  appSign: 'e18df5685326cd89a88fa58e41c72a16a380f42e65842e8878cecb2cd5631c29',
} as const

// Zego Cloud Server Regions
export enum ZegoRegion {
  US = 'US',
  EU = 'EU',
  ASIA = 'ASIA',
  ASIA_INDIA = 'ASIA_INDIA',
  ASIA_JAPAN = 'ASIA_JAPAN',
  ASIA_SINGAPORE = 'ASIA_SINGAPORE',
  ASIA_SOUTH_KOREA = 'ASIA_SOUTH_KOREA',
  CHINA = 'CHINA',
  DEFAULT = 'DEFAULT',
}

// Default region (can be changed based on your needs)
export const DEFAULT_ZEGO_REGION = ZegoRegion.DEFAULT



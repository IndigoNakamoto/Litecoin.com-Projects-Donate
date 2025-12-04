// utils/defaultValues.ts

import { AddressStats, BountyStatus } from './types'

export const defaultAddressStats: AddressStats = {
  tx_count: 0,
  funded_txo_sum: 0,
  supporters: [],
}

export const defaultBountyStatus: BountyStatus = BountyStatus.OPEN


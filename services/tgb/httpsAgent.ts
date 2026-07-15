import https from 'node:https'

/** Prefer IPv4 for outbound TGB calls (some Docker/macOS paths stall on IPv6). */
export const tgbHttpsAgent = new https.Agent({ family: 4 })

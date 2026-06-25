// utils/urlSafety.ts
import { URL } from 'url';
import dns from 'dns/promises';

const BLOCKED_HOSTNAMES = ['localhost', '127.0.0.1', '0.0.0.0'];

function isPrivateIp(ip: string): boolean {
  return (
    /^10\./.test(ip) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(ip) ||
    /^192\.168\./.test(ip) ||
    /^127\./.test(ip) ||
    ip === '::1'
  );
}

export async function assertUrlIsSafe(rawUrl: string): Promise<void> {
  const url = new URL(rawUrl);

  if (BLOCKED_HOSTNAMES.includes(url.hostname)) {
    throw new Error('This URL is not allowed');
  }

  const addresses = await dns.lookup(url.hostname, { all: true });

  for (const { address } of addresses) {
    if (isPrivateIp(address)) {
      throw new Error('This URL resolves to a private network address and is not allowed');
    }
  }
}
/**
 * Phantom wallet connect: build connect URL and decrypt redirect response.
 * Uses nacl.box (x25519) per Phantom docs.
 */
import 'react-native-get-random-values';
import bs58 from 'bs58';
import nacl from 'tweetnacl';

const PHANTOM_CONNECT_BASE = 'https://phantom.app/ul/v1/connect';
const REDIRECT_PATH = 'wallet-connected';

export type PhantomKeyPair = {
  publicKey: Uint8Array;
  secretKey: Uint8Array;
};

export function createKeyPair(): PhantomKeyPair {
  const kp = nacl.box.keyPair();
  return { publicKey: kp.publicKey, secretKey: kp.secretKey };
}

export function buildConnectUrl(dappPublicKeyBase58: string): string {
  const redirectLink = `pulse://${REDIRECT_PATH}`;
  const appUrl = 'https://pulseapp.io';
  const params = new URLSearchParams({
    dapp_encryption_public_key: dappPublicKeyBase58,
    app_url: appUrl,
    redirect_link: redirectLink,
    cluster: 'mainnet-beta',
  });
  return `${PHANTOM_CONNECT_BASE}?${params.toString()}`;
}

export function isWalletConnectRedirect(url: string): boolean {
  return url.startsWith('pulse://') && url.includes(REDIRECT_PATH);
}

export function getParamsFromRedirectUrl(url: string): URLSearchParams | null {
  const q = url.includes('?') ? url.slice(url.indexOf('?') + 1) : '';
  if (!q) return null;
  try {
    return new URLSearchParams(q);
  } catch {
    return null;
  }
}

export function decryptConnectResponse(
  dataBase58: string,
  nonceBase58: string,
  phantomPublicKeyBase58: string,
  dappSecretKey: Uint8Array
): { public_key: string; session: string } {
  const sharedSecret = nacl.box.before(
    bs58.decode(phantomPublicKeyBase58),
    dappSecretKey
  );
  const data = bs58.decode(dataBase58);
  const nonce = bs58.decode(nonceBase58);
  const decrypted = nacl.box.open.after(data, nonce, sharedSecret);
  if (!decrypted) throw new Error('Unable to decrypt Phantom response');
  const json = new TextDecoder().decode(decrypted);
  return JSON.parse(json) as { public_key: string; session: string };
}


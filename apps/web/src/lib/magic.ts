import { Magic } from 'magic-sdk';
import { OAuthExtension } from '@magic-ext/oauth2';

const key = import.meta.env.VITE_MAGIC_PUBLISHABLE_KEY as string | undefined;

export const magic =
  key && key.trim() !== ''
    ? new Magic(key, { extensions: [new OAuthExtension()] })
    : null;

export const isMagicEnabled = (): boolean => !!magic;

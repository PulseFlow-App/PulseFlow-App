declare module 'heic-decode' {
  interface DecodeResult {
    width: number;
    height: number;
    data: Uint8ClampedArray;
  }
  function decode(options: { buffer: ArrayBuffer }): Promise<DecodeResult>;
  export = decode;
}

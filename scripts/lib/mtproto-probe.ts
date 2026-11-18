import {
  createCipheriv,
  createDecipheriv,
  createHash,
  createHmac,
  generateKeyPairSync,
  randomBytes,
  timingSafeEqual,
  type Decipheriv,
} from 'node:crypto';
import net from 'node:net';

/**
 * MTProto-aware availability probe shared by the curated monitor and the
 * automated collector.
 *
 * Two transports are supported:
 *
 * 1. Plain / secure obfuscated2 (`secret`, `dd…`): an obfuscated2 handshake
 *    followed by an unencrypted `req_pq_multi`.
 * 2. Fake TLS (`ee…`): a TLS ClientHello whose random carries an HMAC-SHA256
 *    of the hello proving knowledge of the secret, a validated ServerHello
 *    HMAC, then the same obfuscated2 exchange wrapped in TLS records.
 *
 * The probe only reports ONLINE when the response is an unencrypted `resPQ`
 * whose nonce matches the request. TCP connect success, DNS resolution, an
 * HTTP status, or an arbitrary TLS-looking response are never treated as
 * proof.
 */

const RES_PQ = 0x05162463;
const REQ_PQ_MULTI = 0xbe7e8ef1;

const TL_VERS = Buffer.from([0x03, 0x03]);
const TL_RECORD_HANDSHAKE = 0x16;
const TL_RECORD_CHANGE_CIPHER = 0x14;
const TL_RECORD_APPDATA = 0x17;
const TL_MAX_RECORD = 16384 + 24;
const TL_TLS_PAYLOAD_CHUNK = 1400;

/** Offset of the 32-byte random inside a TLS handshake record. */
const TLS_RANDOM_OFFSET = 11;

export interface ProbeEndpoint {
  server: string;
  port: number;
  secret: string;
  /** Pre-resolved public address. When present the socket connects here. */
  address?: string;
}

export type ProbeOutcome =
  | { kind: 'online'; latencyMs: number }
  | { kind: 'offline'; reason: string }
  | { kind: 'timeout'; reason: string }
  | { kind: 'unknown'; reason: string };

const SNI_PATTERN = /^(?=.{1,253}$)[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?$/i;

export function probeMtproto(endpoint: ProbeEndpoint, timeoutMs: number): Promise<ProbeOutcome> {
  const secretBytes = Buffer.from(endpoint.secret, 'hex');
  // A 17+-byte `ee…` secret is fake TLS; a 16-byte secret may legitimately
  // start with 0xee, so the length check matters. Extended fake-TLS secrets
  // append the SNI domain after the 16-byte key; the domain is not key
  // material but must be mirrored in the ClientHello.
  const fakeTls = secretBytes.length >= 17 && endpoint.secret.startsWith('ee');
  const secureSecret = secretBytes.length === 17 && endpoint.secret.startsWith('dd');

  let secret: Buffer;
  let sni = 'www.google.com';
  if (fakeTls) {
    secret = secretBytes.subarray(1, 17);
    const domainBytes = secretBytes.subarray(17);
    if (domainBytes.length > 0) {
      const domain = domainBytes.toString('ascii');
      if (SNI_PATTERN.test(domain)) sni = domain;
    }
  } else if (secureSecret) {
    secret = secretBytes.subarray(1);
  } else {
    secret = secretBytes.subarray(0, 16);
  }

  if (secret.length < 16) {
    return Promise.resolve({ kind: 'unknown', reason: 'secret too short for MTProto verification' });
  }

  const nonce = randomBytes(16);
  const request = buildObfuscatedRequest(secret, nonce);

  if (fakeTls) return probeFakeTls(endpoint, secret, sni, nonce, request, timeoutMs);
  return probePlain(endpoint, request, nonce, timeoutMs);
}

interface ObfuscatedRequest {
  /** 64-byte client header, with the randomized-intermediate tail in place. */
  header: Buffer;
  /** Encrypted `req_pq_multi` frame, continuing the same AES-CTR stream. */
  payload: Buffer;
  decryptor: Decipheriv;
}

function buildObfuscatedRequest(secret: Buffer, nonce: Buffer): ObfuscatedRequest {
  const init = randomBytes(64);
  init.writeUInt32LE(0xdddddddd, 56); // secure randomized-intermediate envelope
  init.writeUInt16LE(2, 60); // DC 2 is the common proxy route.
  init.writeUInt16LE(0, 62);

  /* With a secret, only the AES key is mixed: key = SHA256(key + secret).
     The IV is the 16-byte header slice used as-is (mtprotoproxy, mtg). */
  const key = createHash('sha256')
    .update(Buffer.concat([init.subarray(8, 40), secret]))
    .digest();
  const iv = init.subarray(40, 56);

  const cipher = createCipheriv('aes-256-ctr', key, iv);
  /* AES-CTR is a stream: do not finalize the cipher after the header or the
     following payload would be encrypted with a fresh (wrong) keystream. */
  const encryptedInit = cipher.update(init);
  const header = Buffer.from(init);
  encryptedInit.copy(header, 56, 56, 64);

  const message = Buffer.alloc(40);
  const msgId = (BigInt(Date.now()) << 32n) & 0xffffffffffffffffn;
  message.writeBigUInt64LE(msgId, 8);
  message.writeUInt32LE(20, 16);
  message.writeUInt32LE(REQ_PQ_MULTI, 20);
  nonce.copy(message, 24);

  const frame = Buffer.alloc(4 + message.length);
  frame.writeUInt32LE(message.length, 0);
  message.copy(frame, 4);

  // Telethon/Telegram reverse the two header halves for the server->client
  // direction and derive a separate key, rather than reversing only the IV.
  const reversed = Buffer.from(init.subarray(8, 56)).reverse();
  const decryptKey = createHash('sha256')
    .update(Buffer.concat([reversed.subarray(0, 32), secret]))
    .digest();
  const decryptIv = reversed.subarray(32, 48);
  const decryptor = createDecipheriv('aes-256-ctr', decryptKey, decryptIv);
  const payload = Buffer.concat([cipher.update(frame)]);

  return { header, payload, decryptor };
}

type FrameCheck =
  | { kind: 'need-more' }
  | { kind: 'online' }
  | { kind: 'unknown'; reason: string };

function inspectResPqFrame(decrypted: Buffer, nonce: Buffer): FrameCheck {
  if (decrypted.length < 4) return { kind: 'need-more' };
  const payloadLength = decrypted.readUInt32LE(0);
  const payloadStart = 4;

  if (payloadLength < 40 || payloadLength > 4096) {
    return { kind: 'unknown', reason: 'unexpected frame length' };
  }
  if (decrypted.length < payloadStart + payloadLength) return { kind: 'need-more' };

  const body = decrypted.subarray(payloadStart, payloadStart + payloadLength);
  if (body.length < 40) return { kind: 'unknown', reason: 'truncated resPQ' };
  if (body.readBigUInt64LE(0) !== 0n) {
    return { kind: 'unknown', reason: 'expected an unencrypted resPQ' };
  }
  if (body.readUInt32LE(16) < 20) {
    return { kind: 'unknown', reason: 'invalid message length' };
  }
  if (body.readUInt32LE(20) !== RES_PQ) {
    return { kind: 'unknown', reason: 'response was not resPQ' };
  }
  if (!body.subarray(24, 40).equals(nonce)) {
    return { kind: 'unknown', reason: 'nonce mismatch' };
  }
  return { kind: 'online' };
}

/**
 * Shared socket plumbing: connect, enforce a timeout, settle exactly once.
 */
function runProbe(
  endpoint: ProbeEndpoint,
  timeoutMs: number,
  onConnect: (socket: net.Socket) => void,
  onData: (chunk: Buffer, finish: (outcome: ProbeOutcome) => void, socket: net.Socket) => void,
): Promise<ProbeOutcome> {
  return new Promise<ProbeOutcome>((resolveOutcome) => {
    const socket = net.connect({ host: endpoint.address ?? endpoint.server, port: endpoint.port });
    const started = Date.now();
    let settled = false;

    const finish = (outcome: ProbeOutcome) => {
      if (settled) return;
      settled = true;
      socket.destroy();
      resolveOutcome(
        outcome.kind === 'online' ? { kind: 'online', latencyMs: Date.now() - started } : outcome,
      );
    };

    socket.setTimeout(timeoutMs);

    socket.on('connect', () => {
      onConnect(socket);
    });

    socket.on('data', (chunk: Buffer) => {
      onData(chunk, finish, socket);
    });

    socket.on('timeout', () => finish({ kind: 'timeout', reason: `no response in ${timeoutMs}ms` }));

    socket.on('error', (error: NodeJS.ErrnoException) => {
      const code = error.code ?? 'network error';
      if (code === 'ETIMEDOUT') finish({ kind: 'timeout', reason: code });
      else finish({ kind: 'offline', reason: code });
    });

    socket.on('close', () => {
      if (!settled) finish({ kind: 'unknown', reason: 'connection closed before resPQ' });
    });
  });
}

function probePlain(
  endpoint: ProbeEndpoint,
  request: ObfuscatedRequest,
  nonce: Buffer,
  timeoutMs: number,
): Promise<ProbeOutcome> {
  let decrypted = Buffer.alloc(0);

  return runProbe(
    endpoint,
    timeoutMs,
    (socket) => {
      socket.write(Buffer.concat([request.header, request.payload]));
    },
    (chunk, finish) => {
      try {
        decrypted = Buffer.concat([decrypted, request.decryptor.update(chunk)]);
      } catch {
        finish({ kind: 'unknown', reason: 'decryption failed' });
        return;
      }
      const check = inspectResPqFrame(decrypted, nonce);
      if (check.kind === 'need-more') return;
      finish(check.kind === 'online' ? { kind: 'online', latencyMs: 0 } : check);
    },
  );
}

function wrapTlsRecord(payload: Buffer): Buffer {
  const chunks: Buffer[] = [];
  for (let start = 0; start < payload.length; start += TL_TLS_PAYLOAD_CHUNK) {
    const end = Math.min(start + TL_TLS_PAYLOAD_CHUNK, payload.length);
    const header = Buffer.alloc(5);
    header.writeUInt8(TL_RECORD_APPDATA, 0);
    TL_VERS.copy(header, 1);
    header.writeUInt16BE(end - start, 3);
    chunks.push(header, payload.subarray(start, end));
  }
  return Buffer.concat(chunks);
}

function u16(value: number): Buffer {
  const buffer = Buffer.alloc(2);
  buffer.writeUInt16BE(value, 0);
  return buffer;
}

function extension(type: number, data: Buffer): Buffer {
  return Buffer.concat([u16(type), u16(data.length), data]);
}

/**
 * Builds a realistic 517-byte TLS 1.2 ClientHello (the size real Telegram
 * clients use) whose random field commits to the proxy secret.
 */
function buildClientHello(secret: Buffer, sni: string): Buffer {
  const host = Buffer.from(sni);
  const sessionId = randomBytes(32);
  const x25519 = generateKeyPairSync('x25519');
  const keyShare = Buffer.from(
    x25519.publicKey.export({ type: 'spki', format: 'der' }).subarray(-32),
  );

  const extensions = Buffer.concat([
    extension(0x0000, Buffer.concat([u16(3 + host.length), Buffer.from([0]), u16(host.length), host])),
    extension(0x000a, Buffer.concat([u16(6), u16(0x001d), u16(0x0017), u16(0x0018)])),
    extension(0x000b, Buffer.from([0x01, 0x00])),
    extension(
      0x000d,
      Buffer.concat([
        u16(16),
        u16(0x0403),
        u16(0x0804),
        u16(0x0401),
        u16(0x0503),
        u16(0x0805),
        u16(0x0501),
        u16(0x0806),
        u16(0x0601),
      ]),
    ),
    extension(0x002b, Buffer.from([0x02, 0x03, 0x04])),
    extension(0x0033, Buffer.concat([u16(36), u16(0x001d), u16(32), keyShare])),
    extension(
      0x0010,
      Buffer.concat([u16(12), Buffer.from([0x02]), Buffer.from('h2'), Buffer.from([0x08]), Buffer.from('http/1.1')]),
    ),
  ]);

  /* Pad to the 517-byte total used by real clients (401 extension bytes),
     expanding the record for unusually long SNI values. */
  const targetExtensions = Math.max(401, extensions.length + 4);
  const paddingData = Buffer.alloc(targetExtensions - extensions.length - 4);
  const padded = Buffer.concat([extensions, extension(0x0015, paddingData)]);

  const cipherSuites = Buffer.concat([
    u16(34),
    ...[
      0x1301, 0x1302, 0x1303, 0xc02b, 0xc02f, 0xc02c, 0xc030, 0xcca9, 0xcca8, 0xc013, 0xc014,
      0x009c, 0x009d, 0x002f, 0x0035, 0x000a, 0x0100,
    ].map((suite) => u16(suite)),
  ]);

  const body = Buffer.concat([
    TL_VERS,
    Buffer.alloc(32), // random placeholder for the HMAC
    Buffer.from([sessionId.length]),
    sessionId,
    cipherSuites,
    Buffer.from([0x01, 0x00]), // null compression
    u16(padded.length),
    padded,
  ]);

  const handshake = Buffer.concat([
    Buffer.from([0x01]),
    Buffer.from([(body.length >> 16) & 0xff, (body.length >> 8) & 0xff, body.length & 0xff]),
    body,
  ]);

  const record = Buffer.concat([
    Buffer.from([TL_RECORD_HANDSHAKE, 0x03, 0x01]),
    u16(handshake.length),
    handshake,
  ]);

  /* digest = HMAC(secret, hello with zeroed random); the last 4 bytes carry
     the current Unix time XORed into the digest. */
  const timestamp = Buffer.alloc(4);
  timestamp.writeUInt32LE(Math.floor(Date.now() / 1000) >>> 0, 0);
  const digest = createHmac('sha256', secret).update(record).digest();
  for (let i = 0; i < 4; i += 1) {
    digest[28 + i] = (digest[28 + i] ?? 0) ^ (timestamp[i] ?? 0);
  }
  digest.copy(record, TLS_RANDOM_OFFSET);

  return record;
}

function probeFakeTls(
  endpoint: ProbeEndpoint,
  secret: Buffer,
  sni: string,
  nonce: Buffer,
  request: ObfuscatedRequest,
  timeoutMs: number,
): Promise<ProbeOutcome> {
  const clientHello = buildClientHello(secret, sni);
  const clientRandom = Buffer.from(clientHello.subarray(TLS_RANDOM_OFFSET, TLS_RANDOM_OFFSET + 32));

  let buffer = Buffer.alloc(0);
  let offset = 0;
  let handshakeComplete = false;
  let sawServerHello = false;
  let decrypted = Buffer.alloc(0);

  return runProbe(
    endpoint,
    timeoutMs,
    (socket) => {
      socket.write(clientHello);
    },
    (chunk, finish, socket) => {
      buffer = Buffer.concat([buffer, chunk]);

      for (;;) {
        if (buffer.length - offset < 5) return;
        const type = buffer[offset];
        if (buffer[offset + 1] !== 0x03 || buffer[offset + 2] !== 0x03) {
          finish({ kind: 'unknown', reason: 'response was not a TLS record' });
          return;
        }
        const length = buffer.readUInt16BE(offset + 3);
        if (length === 0 || length > TL_MAX_RECORD) {
          finish({ kind: 'unknown', reason: 'unexpected TLS record length' });
          return;
        }
        if (buffer.length - offset < 5 + length) return;

        const payload = buffer.subarray(offset + 5, offset + 5 + length);

        if (!handshakeComplete) {
          if (type === TL_RECORD_HANDSHAKE) {
            if (payload[0] !== 0x02 || payload.readUInt16BE(4) !== 0x0303 || payload.length < 38) {
              finish({ kind: 'unknown', reason: 'unexpected TLS ServerHello' });
              return;
            }
            sawServerHello = true;
          } else if (type === TL_RECORD_CHANGE_CIPHER) {
            if (!sawServerHello) {
              finish({ kind: 'unknown', reason: 'TLS change-cipher before ServerHello' });
              return;
            }
          } else if (type === TL_RECORD_APPDATA) {
            if (!sawServerHello) {
              finish({ kind: 'unknown', reason: 'TLS application data before ServerHello' });
              return;
            }
            /* The first app-data record is the proxy's fake certificate. The
               ServerHello HMAC commits to it, so validate now that it is
               complete, then discard it and start the real stream. */
            const helloPacket = Buffer.from(buffer.subarray(0, offset + 5 + length));
            const zeroed = Buffer.from(helloPacket);
            zeroed.fill(0, TLS_RANDOM_OFFSET, TLS_RANDOM_OFFSET + 32);
            const expected = createHmac('sha256', secret)
              .update(Buffer.concat([clientRandom, zeroed]))
              .digest();
            const actual = helloPacket.subarray(TLS_RANDOM_OFFSET, TLS_RANDOM_OFFSET + 32);
            if (!timingSafeEqual(expected, actual)) {
              finish({ kind: 'unknown', reason: 'fake-TLS handshake HMAC mismatch' });
              return;
            }
            handshakeComplete = true;
            /* Send the obfuscated2 header and request as one TLS app-data
               stream. This is flushed only once the HMAC is verified. */
            socket.write(wrapTlsRecord(Buffer.concat([request.header, request.payload])));
          } else {
            finish({ kind: 'unknown', reason: 'unexpected TLS record during handshake' });
            return;
          }
        } else if (type === TL_RECORD_APPDATA) {
          try {
            decrypted = Buffer.concat([decrypted, request.decryptor.update(payload)]);
          } catch {
            finish({ kind: 'unknown', reason: 'decryption failed' });
            return;
          }
          const check = inspectResPqFrame(decrypted, nonce);
          if (check.kind === 'online') {
            finish({ kind: 'online', latencyMs: 0 });
            return;
          }
          if (check.kind === 'unknown') {
            finish(check);
            return;
          }
        }

        offset += 5 + length;
      }
    },
  );
}

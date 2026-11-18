import net from 'node:net';
import { createCipheriv, createDecipheriv, createHash, createHmac } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { probeMtproto } from '../scripts/lib/mtproto-probe';

const HEX = 'a1b2c3d4e5f60718293a4b5c6d7e8f90';
const OTHER_HEX = 'ffeeddccbbaa99887766554433221100';
const DD_HEX = `dd${HEX}`;
const EE_HEX = `ee${HEX}`;
const EE_DOMAIN_HEX = `ee${HEX}${Buffer.from('www.google.com').toString('hex')}`;

function u16(value: number): Buffer {
  const buffer = Buffer.alloc(2);
  buffer.writeUInt16BE(value, 0);
  return buffer;
}

function u24(value: number): Buffer {
  return Buffer.from([(value >> 16) & 0xff, (value >> 8) & 0xff, value & 0xff]);
}

function tlsRecord(type: number, payload: Buffer): Buffer {
  return Buffer.concat([Buffer.from([type, 0x03, 0x03]), u16(payload.length), payload]);
}

/** Minimal server-side obfuscated2 (secure envelope) + resPQ round trip. */
function mockMtProxy(secretHex: string) {
  return (socket: net.Socket) => {
    const secret = Buffer.from(secretHex, 'hex');
    let buffer = Buffer.alloc(0);
    let clearBuffer = Buffer.alloc(0);
    let decryptor: ReturnType<typeof createDecipheriv> | null = null;
    let encryptor: ReturnType<typeof createCipheriv> | null = null;

    const respond = (frame: Buffer) => {
      if (!encryptor) return;
      socket.end(encryptor.update(frame));
    };

    const readPayload = () => {
      if (!decryptor) return;
      clearBuffer = Buffer.concat([clearBuffer, decryptor.update(buffer)]);
      buffer = Buffer.alloc(0);
      if (clearBuffer.length < 4) return;
      const length = clearBuffer.readUInt32LE(0);
      if (clearBuffer.length < 4 + length) return;
      const body = clearBuffer.subarray(4, 4 + length);
      if (body.readUInt32LE(20) !== 0xbe7e8ef1) {
        socket.destroy();
        return;
      }
      const nonce = body.subarray(24, 40);

      const reply = Buffer.alloc(40);
      reply.writeUInt32LE(20, 16);
      reply.writeUInt32LE(0x05162463, 20);
      nonce.copy(reply, 24);
      const frame = Buffer.alloc(4 + reply.length);
      frame.writeUInt32LE(reply.length, 0);
      reply.copy(frame, 4);
      respond(frame);
    };

    socket.on('data', (chunk) => {
      buffer = Buffer.concat([buffer, chunk]);
      if (!decryptor) {
        if (buffer.length < 64) return;
        const header = buffer.subarray(0, 64);
        buffer = buffer.subarray(64);
        const key = createHash('sha256')
          .update(Buffer.concat([header.subarray(8, 40), secret]))
          .digest();
        const iv = header.subarray(40, 56);
        decryptor = createDecipheriv('aes-256-ctr', key, iv);
        decryptor.update(header); // consume the encrypted tag, keep the stream position
        const reversed = Buffer.from(header.subarray(8, 56)).reverse();
        const encryptKey = createHash('sha256')
          .update(Buffer.concat([reversed.subarray(0, 32), secret]))
          .digest();
        encryptor = createCipheriv('aes-256-ctr', encryptKey, reversed.subarray(32, 48));
      }
      readPayload();
    });
  };
}

/** Minimal server-side FakeTLS handshake followed by obfuscated2 + resPQ. */
function mockFakeTlsProxy(secretHex: string) {
  return (socket: net.Socket) => {
    const secret = Buffer.from(secretHex, 'hex');
    let raw = Buffer.alloc(0);
    let helloDone = false;
    let decryptor: ReturnType<typeof createDecipheriv> | null = null;
    let encryptor: ReturnType<typeof createCipheriv> | null = null;
    let clear = Buffer.alloc(0);

    const onPayload = (payload: Buffer) => {
      if (!decryptor) {
        if (payload.length < 64) return;
        const header = payload.subarray(0, 64);
        const key = createHash('sha256')
          .update(Buffer.concat([header.subarray(8, 40), secret]))
          .digest();
        const iv = header.subarray(40, 56);
        decryptor = createDecipheriv('aes-256-ctr', key, iv);
        decryptor.update(header);
        const reversed = Buffer.from(header.subarray(8, 56)).reverse();
        encryptor = createCipheriv(
          'aes-256-ctr',
          createHash('sha256').update(Buffer.concat([reversed.subarray(0, 32), secret])).digest(),
          reversed.subarray(32, 48),
        );
        payload = payload.subarray(64);
      }
      clear = Buffer.concat([clear, decryptor.update(payload)]);
      if (clear.length < 4) return;
      const length = clear.readUInt32LE(0);
      if (clear.length < 4 + length) return;
      const body = clear.subarray(4, 4 + length);
      clear = clear.subarray(4 + length);
      if (body.readUInt32LE(20) !== 0xbe7e8ef1 || !encryptor) {
        socket.destroy();
        return;
      }
      const reply = Buffer.alloc(40);
      reply.writeUInt32LE(20, 16);
      reply.writeUInt32LE(0x05162463, 20);
      body.subarray(24, 40).copy(reply, 24);
      const frame = Buffer.alloc(4 + reply.length);
      frame.writeUInt32LE(reply.length, 0);
      reply.copy(frame, 4);
      socket.end(tlsRecord(0x17, encryptor.update(frame)));
    };

    socket.on('data', (chunk) => {
      raw = Buffer.concat([raw, chunk]);
      for (;;) {
        if (raw.length < 5) return;
        const type = raw[0];
        const length = raw.readUInt16BE(3);
        if (raw.length < 5 + length) return;
        const payload = raw.subarray(5, 5 + length);
        raw = raw.subarray(5 + length);

        if (!helloDone) {
          if (type === 0x16 && payload[0] === 0x01) {
            const clientRandom = payload.subarray(6, 38);
            const sidLen = payload[38] ?? 0;
            const sid = payload.subarray(39, 39 + sidLen);
            const srvBody = Buffer.concat([
              Buffer.from([0x03, 0x03]),
              Buffer.alloc(32),
              Buffer.from([sidLen]),
              sid,
              Buffer.from([0x13, 0x01, 0x00]),
              Buffer.from([0x00, 0x2e, 0x00, 0x33, 0x00, 0x24, 0x00, 0x1d, 0x00, 0x20]),
              Buffer.alloc(32, 0x11),
              Buffer.from([0x00, 0x2b, 0x00, 0x02, 0x03, 0x04]),
            ]);
            const helloPacket = Buffer.concat([
              Buffer.from([0x16, 0x03, 0x03]),
              u16(srvBody.length + 4),
              Buffer.from([0x02]),
              u24(srvBody.length),
              srvBody,
              Buffer.from([0x14, 0x03, 0x03, 0x00, 0x01, 0x01]),
              tlsRecord(0x17, Buffer.alloc(64, 0x5a)),
            ]);
            const hmac = createHmac('sha256', secret)
              .update(Buffer.concat([clientRandom, helloPacket]))
              .digest();
            hmac.copy(helloPacket, 11);
            helloDone = true;
            socket.write(helloPacket);
            continue;
          }
          continue;
        }
        if (type === 0x17) onPayload(payload);
      }
    });
  };
}

async function withServer(
  handler: (socket: net.Socket) => void,
  run: (port: number) => Promise<void>,
): Promise<void> {
  const open = new Set<net.Socket>();
  const server = net.createServer((socket) => {
    open.add(socket);
    socket.on('close', () => open.delete(socket));
    socket.on('error', () => undefined);
    handler(socket);
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('No test port');
  try {
    await run(address.port);
  } finally {
    open.forEach((socket) => socket.destroy());
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
}

describe('MTProto probe safety', () => {
  it('completes a FakeTLS handshake and accepts a matching resPQ', async () => {
    await withServer(
      mockFakeTlsProxy(HEX),
      async (port) => {
        const outcome = await probeMtproto({ server: '127.0.0.1', port, secret: EE_HEX }, 2000);
        expect(outcome.kind).toBe('online');
      },
    );
  });

  it('ignores the SNI suffix of extended FakeTLS secrets when deriving keys', async () => {
    await withServer(
      mockFakeTlsProxy(HEX),
      async (port) => {
        const outcome = await probeMtproto(
          { server: '127.0.0.1', port, secret: EE_DOMAIN_HEX },
          2000,
        );
        expect(outcome.kind).toBe('online');
      },
    );
  });

  it('rejects a FakeTLS ServerHello whose HMAC does not match the secret', async () => {
    await withServer(
      mockFakeTlsProxy(OTHER_HEX),
      async (port) => {
        const outcome = await probeMtproto({ server: '127.0.0.1', port, secret: EE_HEX }, 500);
        expect(outcome.kind).not.toBe('online');
        if (outcome.kind === 'unknown') expect(outcome.reason).toMatch(/HMAC/i);
      },
    );
  });

  it('reports a timeout instead of online when the endpoint is silent', async () => {
    await withServer(
      () => undefined,
      async (port) => {
        const outcome = await probeMtproto({ server: '127.0.0.1', port, secret: HEX }, 300);
        expect(outcome.kind).toBe('timeout');
      },
    );
  });

  it('never treats an early close as online', async () => {
    await withServer(
      (socket) => socket.end(),
      async (port) => {
        const outcome = await probeMtproto({ server: '127.0.0.1', port, secret: HEX }, 500);
        expect(outcome.kind).not.toBe('online');
      },
    );
  });

  it('never treats arbitrary bytes as a successful resPQ', async () => {
    await withServer(
      (socket) => {
        socket.once('data', () => socket.write(Buffer.alloc(96, 0x42)));
      },
      async (port) => {
        const outcome = await probeMtproto({ server: '127.0.0.1', port, secret: HEX }, 500);
        expect(outcome.kind).not.toBe('online');
      },
    );
  });

  it('completes a real handshake and accepts a matching resPQ', async () => {
    await withServer(
      mockMtProxy(HEX),
      async (port) => {
        const outcome = await probeMtproto({ server: '127.0.0.1', port, secret: HEX }, 2000);
        expect(outcome.kind).toBe('online');
      },
    );
  });

  it('handles dd randomized-intermediate secrets without the prefix in the key', async () => {
    await withServer(
      mockMtProxy(HEX),
      async (port) => {
        const outcome = await probeMtproto({ server: '127.0.0.1', port, secret: DD_HEX }, 2000);
        expect(outcome.kind).toBe('online');
      },
    );
  });

  it('never treats an HTTP response as proof of MTProto support', async () => {
    await withServer(
      (socket) => {
        socket.once('data', () =>
          socket.end(
            'HTTP/1.1 200 OK\r\nContent-Length: 2\r\nContent-Type: text/plain\r\n\r\nOK',
          ),
        );
      },
      async (port) => {
        const outcome = await probeMtproto({ server: '127.0.0.1', port, secret: HEX }, 500);
        expect(outcome.kind).not.toBe('online');
      },
    );
  });
});

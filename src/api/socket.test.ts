import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

type Listener = (payload: unknown) => void;

const fakeSocket = vi.hoisted(() => {
  const listeners = new Map<string, Listener[]>();

  return {
    connect: vi.fn(),
    disconnect: vi.fn(),
    on: (event: string, listener: Listener) => {
      listeners.set(event, [...(listeners.get(event) ?? []), listener]);
    },
    fire: (event: string, payload: unknown) =>
      listeners.get(event)?.forEach((listener) => listener(payload)),
    removeAllListeners: () => listeners.clear(),
  };
});

const session = vi.hoisted(() => {
  const endListeners: (() => void)[] = [];

  return {
    refreshSession: vi.fn(),
    endSession: vi.fn(),
    onSessionEnd: vi.fn((listener: () => void) => endListeners.push(listener)),
    fireSessionEnd: () => endListeners.forEach((listener) => listener()),
  };
});

vi.mock('socket.io-client', () => ({ default: () => fakeSocket }));
vi.mock('./session.ts', () => ({
  refreshSession: session.refreshSession,
  endSession: session.endSession,
  onSessionEnd: session.onSessionEnd,
}));

const TOKEN_REFRESH_INTERVAL_MS = 30_000;

describe('socket', () => {
  beforeEach(async () => {
    fakeSocket.removeAllListeners();
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.resetModules();
    await import('./socket.ts');
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('refreshes the token and reconnects when the server closes the socket', async () => {
    session.refreshSession.mockResolvedValue({});

    fakeSocket.fire('disconnect', 'io server disconnect');
    await vi.runAllTimersAsync();

    expect(session.refreshSession).toHaveBeenCalledOnce();
    expect(fakeSocket.connect).toHaveBeenCalledOnce();
  });

  it('refreshes the token when the handshake is refused', async () => {
    session.refreshSession.mockResolvedValue({});

    fakeSocket.fire('connect_error', new Error('Unauthorized'));
    await vi.runAllTimersAsync();

    expect(fakeSocket.connect).toHaveBeenCalledOnce();
  });

  it('ends the session when the refresh fails', async () => {
    session.refreshSession.mockRejectedValue(new Error('401'));

    fakeSocket.fire('disconnect', 'io server disconnect');
    await vi.runAllTimersAsync();

    expect(session.endSession).toHaveBeenCalledOnce();
    expect(fakeSocket.connect).not.toHaveBeenCalled();
  });

  it('ignores a disconnect the client asked for', async () => {
    fakeSocket.fire('disconnect', 'io client disconnect');
    await vi.runAllTimersAsync();

    expect(session.refreshSession).not.toHaveBeenCalled();
  });

  it('waits before a second refresh in a row', async () => {
    session.refreshSession.mockResolvedValue({});

    fakeSocket.fire('disconnect', 'io server disconnect');
    await vi.advanceTimersByTimeAsync(0);
    fakeSocket.fire('disconnect', 'io server disconnect');
    await vi.advanceTimersByTimeAsync(TOKEN_REFRESH_INTERVAL_MS - 1);

    expect(session.refreshSession).toHaveBeenCalledOnce();

    await vi.advanceTimersByTimeAsync(1);
    expect(session.refreshSession).toHaveBeenCalledTimes(2);
  });

  it('stops after three reconnects that never connected', async () => {
    session.refreshSession.mockResolvedValue({});

    for (let attempt = 0; attempt < 4; attempt += 1) {
      fakeSocket.fire('connect_error', new Error('Unauthorized'));
      await vi.advanceTimersByTimeAsync(TOKEN_REFRESH_INTERVAL_MS);
    }

    expect(session.refreshSession).toHaveBeenCalledTimes(3);
  });

  it('does not reconnect when the session ended during the refresh', async () => {
    let finishRefresh = () => {};
    session.refreshSession.mockReturnValue(
      new Promise<void>((resolve) => {
        finishRefresh = resolve;
      }),
    );

    fakeSocket.fire('disconnect', 'io server disconnect');
    await vi.advanceTimersByTimeAsync(0);
    session.fireSessionEnd();
    finishRefresh();
    await vi.runAllTimersAsync();

    expect(fakeSocket.connect).not.toHaveBeenCalled();
  });
});

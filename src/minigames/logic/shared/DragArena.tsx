import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSharedValue, type SharedValue } from 'react-native-reanimated';
import type { Point, Rect, SlotRect } from './dragGeometry';

export type Measurable = { measureInWindow: (cb: (x: number, y: number, w: number, h: number) => void) => void };

interface ArenaApi {
  /** every registered slot, in arena coordinates — read from gesture worklets */
  slots: SharedValue<SlotRect[]>;
  /** id of the slot currently under the dragged finger (UI thread) */
  hovered: SharedValue<string | null>;
  /** arena top-left in window coordinates (UI thread) */
  origin: SharedValue<Point>;
  /** measure a mounted host view into arena coordinates */
  measureNode: (node: Measurable | null, cb: (r: Rect) => void) => void;
  putSlot: (slot: SlotRect) => void;
  dropSlot: (id: string) => void;
  getSlot: (id: string) => SlotRect | undefined;
  /** re-measure notifications (arena moved / resized) */
  subscribe: (fn: () => void) => () => void;
}

const ArenaContext = createContext<ArenaApi | null>(null);

/** Delays (ms) at which we re-measure after a layout — lets entrance springs settle. */
const SETTLE_DELAYS = [0, 260, 700];

/**
 * The coordinate space shared by draggables and slots.
 *
 * Children measure themselves into arena-relative rectangles (via
 * `measureInWindow` on both ends, which behaves the same on iOS, Android and
 * react-native-web) and publish them into a shared value so the pan gesture
 * can hit-test on the UI thread without a round trip.
 */
export function DragArena({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  const arenaRef = useRef<React.ComponentRef<typeof View>>(null);
  const originRef = useRef<{ x: number; y: number; measured: boolean }>({ x: 0, y: 0, measured: false });
  const slotMap = useRef(new Map<string, SlotRect>());
  const subs = useRef(new Set<() => void>());
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const slots = useSharedValue<SlotRect[]>([]);
  const hovered = useSharedValue<string | null>(null);
  const origin = useSharedValue<Point>({ x: 0, y: 0 });

  const flush = useCallback(() => {
    slots.value = Array.from(slotMap.current.values());
  }, [slots]);

  const putSlot = useCallback(
    (slot: SlotRect) => {
      slotMap.current.set(slot.id, slot);
      flush();
    },
    [flush],
  );

  const dropSlot = useCallback(
    (id: string) => {
      if (slotMap.current.delete(id)) flush();
    },
    [flush],
  );

  const getSlot = useCallback((id: string) => slotMap.current.get(id), []);

  const subscribe = useCallback((fn: () => void) => {
    subs.current.add(fn);
    return () => {
      subs.current.delete(fn);
    };
  }, []);

  const measureNode = useCallback((node: Measurable | null, cb: (r: Rect) => void) => {
    if (!node) return;
    const attempt = (n: number) => {
      node.measureInWindow((x, y, w, h) => {
        const o = originRef.current;
        if ((!o.measured || (w === 0 && h === 0)) && n < 5) {
          const t = setTimeout(() => attempt(n + 1), 60);
          timers.current.push(t);
          return;
        }
        cb({ x: x - o.x, y: y - o.y, width: w, height: h });
      });
    };
    attempt(0);
  }, []);

  const remeasure = useCallback(() => {
    for (const t of timers.current) clearTimeout(t);
    timers.current = [];
    for (const delay of SETTLE_DELAYS) {
      const run = () => {
        arenaRef.current?.measureInWindow((x, y) => {
          originRef.current = { x, y, measured: true };
          origin.value = { x, y };
          subs.current.forEach((fn) => fn());
        });
      };
      if (delay === 0) run();
      else timers.current.push(setTimeout(run, delay));
    }
  }, [origin]);

  useEffect(() => {
    const list = timers.current;
    return () => {
      for (const t of list) clearTimeout(t);
    };
  }, []);

  const api = useMemo<ArenaApi>(
    () => ({ slots, hovered, origin, measureNode, putSlot, dropSlot, getSlot, subscribe }),
    [slots, hovered, origin, measureNode, putSlot, dropSlot, getSlot, subscribe],
  );

  return (
    <ArenaContext.Provider value={api}>
      <View ref={arenaRef} onLayout={remeasure} collapsable={false} style={[styles.arena, style]}>
        {children}
      </View>
    </ArenaContext.Provider>
  );
}

export function useDragArena(): ArenaApi {
  const ctx = useContext(ArenaContext);
  if (!ctx) throw new Error('useDragArena must be used inside a <DragArena> (GameFrame provides one).');
  return ctx;
}

/**
 * Measure a host view into arena coordinates whenever it (or the arena) moves.
 * `depsKey` is a primitive signature of anything the callback depends on
 * (a slot's id / group / enabled state) — changing it re-publishes the rect.
 */
export function useArenaMeasure(
  ref: React.RefObject<Measurable | null>,
  onRect: (r: Rect) => void,
  depsKey = '',
) {
  const arena = useDragArena();
  const cb = useRef(onRect);
  cb.current = onRect;
  const measure = useCallback(() => {
    arena.measureNode(ref.current, (r) => cb.current(r));
  }, [arena, ref]);
  useEffect(() => {
    measure();
    return arena.subscribe(measure);
  }, [arena, measure, depsKey]);
  return measure;
}

const styles = StyleSheet.create({ arena: { flex: 1 } });

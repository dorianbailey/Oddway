"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
} from "react";
import { detectUnitSystem, type UnitSystem } from "@/lib/units";

const STORAGE_KEY = "oddway.units";

/**
 * The preference lives in localStorage rather than React state, so it survives
 * reloads and stays in step across tabs. `useSyncExternalStore` is the
 * sanctioned way to read that: it gives the server a defined snapshot and
 * re-renders after hydration if the client disagrees, instead of a
 * setState-in-effect dance that fights the React Compiler.
 */

const listeners = new Set<() => void>();

/** Locale detection is stable for a session, so only work it out once. */
let detected: UnitSystem | null = null;

function subscribe(onChange: () => void): () => void {
  listeners.add(onChange);
  window.addEventListener("storage", onChange);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onChange);
  };
}

function getSnapshot(): UnitSystem {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "imperial" || stored === "metric") return stored;
  } catch {
    // Private browsing can block storage; fall through to detection.
  }

  detected ??= detectUnitSystem();
  return detected;
}

/**
 * The server has no locale and no storage, so it always renders imperial.
 * A metric visitor sees one frame of miles before it corrects — the
 * alternative is blocking render on the client, which is worse.
 */
function getServerSnapshot(): UnitSystem {
  return "imperial";
}

function writeUnits(next: UnitSystem) {
  try {
    window.localStorage.setItem(STORAGE_KEY, next);
  } catch {
    // A preference that doesn't persist still applies for this session.
  }
  for (const listener of listeners) listener();
}

interface UnitsContextValue {
  units: UnitSystem;
  setUnits: (units: UnitSystem) => void;
}

const UnitsContext = createContext<UnitsContextValue | null>(null);

export function UnitsProvider({ children }: { children: React.ReactNode }) {
  const units = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const setUnits = useCallback((next: UnitSystem) => writeUnits(next), []);
  const value = useMemo(() => ({ units, setUnits }), [units, setUnits]);

  return <UnitsContext value={value}>{children}</UnitsContext>;
}

export function useUnits(): UnitsContextValue {
  const context = useContext(UnitsContext);
  if (!context) {
    throw new Error("useUnits must be used inside <UnitsProvider>.");
  }
  return context;
}

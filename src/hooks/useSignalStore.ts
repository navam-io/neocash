"use client";

import { get, set, del, keys } from "idb-keyval";
import type { SignalRecord } from "@/types";

const SIGNAL_PREFIX = "signal:";

function signalKey(id: string) {
  return `${SIGNAL_PREFIX}${id}`;
}

export async function saveSignal(signal: SignalRecord): Promise<void> {
  await set(signalKey(signal.id), signal);
}

export async function getSignal(
  id: string,
): Promise<SignalRecord | undefined> {
  return get<SignalRecord>(signalKey(id));
}

export async function deleteSignal(id: string): Promise<void> {
  await del(signalKey(id));
}

export async function listSignalsForGoal(
  goalId: string,
): Promise<SignalRecord[]> {
  const allKeys = await keys();
  const signalKeys = allKeys.filter(
    (k) => typeof k === "string" && k.startsWith(SIGNAL_PREFIX),
  );

  const signals: SignalRecord[] = [];
  for (const key of signalKeys) {
    const signal = await get<SignalRecord>(key as string);
    if (signal && signal.goalId === goalId) {
      signals.push(signal);
    }
  }

  return signals.sort((a, b) => b.createdAt - a.createdAt);
}

export async function clearAllSignals(): Promise<void> {
  const allKeys = await keys();
  const signalKeys = allKeys.filter(
    (k) => typeof k === "string" && k.startsWith(SIGNAL_PREFIX),
  );
  for (const key of signalKeys) await del(key);
}

export async function deleteSignalsForGoal(goalId: string): Promise<void> {
  const allKeys = await keys();
  const signalKeys = allKeys.filter(
    (k) => typeof k === "string" && k.startsWith(SIGNAL_PREFIX),
  );

  for (const key of signalKeys) {
    const signal = await get<SignalRecord>(key as string);
    if (signal && signal.goalId === goalId) {
      await del(key);
    }
  }
}

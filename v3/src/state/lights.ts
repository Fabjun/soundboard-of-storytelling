/**
 * @fileoverview lights — the lamps the app can start light on (docs/product/features/light.md C2,
 * ADR-0091)
 *
 * Settings → LIGHT keeps a list of lamps, each a name and the address the user typed; the list
 * lives in the preferences (`light-lamps`, read before the first render). A lamp is contacted only
 * for a light command or the connection test (ADR-0091) — never discovered in the network.
 */

import { getLamps, setLamps, type Lamp } from './prefs';
import { nanoid } from '../lib/nanoid';
import { lampUrl } from '../light/wled';

/** The longest lamp name, in characters. */
export const LAMP_NAME_MAX = 40;

/** Why a lamp could not be added, in plain words — or null when it was added. */
export type AddLampProblem = 'no-name' | 'bad-address' | 'known-address';

/**
 * Adds a lamp with the typed name and address. Resolves with the new lamp, or with the problem:
 * no name, an address that is no host, or one a lamp of the list already has.
 */
export function addLamp(name: string, address: string): Lamp | AddLampProblem {
  const n = name.trim().slice(0, LAMP_NAME_MAX);
  if (!n) return 'no-name';
  const url = lampUrl(address);
  if (!url) return 'bad-address';
  const lamps = getLamps();
  if (lamps.some((l) => lampUrl(l.address) === url)) return 'known-address';
  const lamp: Lamp = { id: nanoid(), name: n, address: address.trim() };
  setLamps([...lamps, lamp]);
  return lamp;
}

/** Removes a lamp; pads that name it send it nothing any more. */
export function removeLamp(id: string): void {
  setLamps(getLamps().filter((l) => l.id !== id));
}

/** Says what is wrong with a lamp that could not be added, and what to do. */
export function describeProblem(problem: AddLampProblem): string {
  switch (problem) {
    case 'no-name':
      return 'Give the lamp a name, e.g. "Floor lamp".';
    case 'bad-address':
      return 'This is no lamp address — type its IP address, e.g. 192.168.1.50, or its name ending in .local.';
    case 'known-address':
      return 'A lamp with this address is already in the list.';
  }
}

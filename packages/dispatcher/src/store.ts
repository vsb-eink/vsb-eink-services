import { JSONPreset } from 'lowdb/node';
import { GROUPS_FILE } from './env.js';

export interface Group {
	name: string;
	panels: string[];
}

export interface Store {
	groups: Group[];
}

const store = await JSONPreset<Store>(GROUPS_FILE, { groups: [] });

export { store };

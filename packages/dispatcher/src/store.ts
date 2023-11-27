import {JSONPreset} from "lowdb/node";
import {GROUPS_FILE} from "./env.js";
import {GroupType} from "./schemas.js";

export interface Store {
    groups: GroupType[];
}

const store = await JSONPreset<Store>(GROUPS_FILE, { groups: [] });

export { store };
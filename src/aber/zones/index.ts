/**
 * Zone based name generator
 */
import State from "../state";
import {isGod} from "../newuaf/reducer";
import {setExits} from "./reducer";
import {setThere} from "../parse/reducer";

interface Zone {
    name: string,
    channelId: number,
}

export const zones: Zone[] = [
    { name: 'LIMBO', channelId: 1 },
    { name: 'WSTORE', channelId: 2 },
    { name: 'HOME', channelId: 4 },
    { name: 'START', channelId: 5 },
    { name: 'PIT', channelId: 6 },
    { name: 'WIZROOM', channelId: 19 },
    { name: 'DEAD', channelId: 99 },
    { name: 'BLIZZARD', channelId: 299 },
    { name: 'CAVE', channelId: 399 },
    { name: 'LABRNTH', channelId: 499 },
    { name: 'FOREST', channelId: 599 },
    { name: 'VALLEY', channelId: 699 },
    { name: 'MOOR', channelId: 799 },
    { name: 'ISLAND', channelId: 899 },
    { name: 'SEA', channelId: 999 },
    { name: 'RIVER', channelId: 1049 },
    { name: 'CASTLE', channelId: 1069 },
    { name: 'TOWER', channelId: 1099 },
    { name: 'HUT', channelId: 1101 },
    { name: 'TREEHOUSE', channelId: 1105 },
    { name: 'QUARRY', channelId: 2199 },
    { name: 'LEDGE', channelId: 2299 },
    { name: 'INTREE', channelId: 2499 },
    { name: 'WASTE', channelId: 99999 },
];

const fscanf = (f: any, length: number): Promise<number[]> => Promise.resolve([0, 0, 0, 0, 0, 0]);

export const findZone = (channelId: number): Zone => {
    const roomId = -channelId;
    const selected = zones
        .filter(zone => zone.channelId <= roomId)
        .sort((a, b) => {
            if (a.channelId < b.channelId) {
                return 1;
            } else if (a.channelId > b.channelId) {
                return -1;
            } else {
                return 0;
            }
        });
    if (!selected.length) {
        return { name: 'TCHAN', channelId: 0 };
    }
    const offset = (selected.length > 1)
        ? selected[1].channelId
        : 0;
    return { name: selected[0].name, channelId: roomId - offset }
};

export const loadExits = (state: State, f: any) => fscanf(f, 6)
    .then(exits => setExits(state, exits));

export const getLocationIdByZone = (state: State, name: string, roomId: number): number => {
    const zone = zones.find(zone => zone.name.toLowerCase() === name);
    const zoneId = zones.indexOf(zone);
    if (zoneId === -1) {
        return 0;
    }
    if (!roomId) {
        return 0;
    }
    const offset = zoneId === 0
        ? 0
        : zones[zoneId - 1].channelId;
    const channelId = (roomId || 1) + offset;
    setThere(state, name, roomId);
    if (channelId > zone.channelId) {
        return 0;
    }
    return -channelId;
};

export const getLocationName = (state: State, locationId: number): string => {
    const {
        name,
        channelId,
    } = findZone(locationId);
    setThere(state, name, channelId);
    const locationIdText = isGod(state)
        ? `[ ${locationId} ]`
        : '';
    return `${name}${channelId}${locationIdText}`;
};

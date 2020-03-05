import {ItemData, PlayerData} from "../state";

const FILENAME = '/usr/tmp/-iy7AM';

export interface MetaData {
    firstEventId: number,
    lastEventId: number,
}

export interface Event {
    channelId?: number,
    code: number,
    payload?: any,
    receiver?: string,
    sender?: string,
}

export interface WorldInterface {
    meta: MetaData,
    items: ItemData[],
    players: PlayerData[],
    events: Event[],
}

const world: WorldInterface = {
    meta: {
        firstEventId: 0,
        lastEventId: 0,
    },
    items: [],
    players: [],
    events: [],
};

export default {
    readMeta: (): Promise<MetaData> => Promise.resolve(world.meta),
    readItems: (): Promise<ItemData[]> => Promise.resolve(world.items),
    readPlayers: (): Promise<PlayerData[]> => Promise.resolve(world.players),
    readEvent: (eventId: number): Promise<Event> => Promise.resolve(world.events[eventId - world.meta.firstEventId]),
    writeMeta: (data: MetaData): Promise<void> => new Promise((resolve) => {
        world.meta = data;
        resolve();
    }),
    writeItems: (data: ItemData[]): Promise<void> => new Promise((resolve) => {
        world.items = data;
        resolve();
    }),
    writePlayers: (data: PlayerData[]): Promise<void> => new Promise((resolve) => {
        world.players = data;
        resolve();
    }),
    writeEvent: (data: Event): Promise<number> => new Promise((resolve) => {
        const {
            firstEventId,
            lastEventId,
        } = world.meta;
        world.meta = {
            firstEventId,
            lastEventId: lastEventId + 1,
        };
        world.events.push(data);
        return resolve(lastEventId - firstEventId);
    }),
};

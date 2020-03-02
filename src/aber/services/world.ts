import {ItemData, PlayerData} from "../state";

const FILENAME = '/usr/tmp/-iy7AM';

interface WorldInterface {
    items: ItemData[],
    players: PlayerData[],
}

const world: WorldInterface = {
    items: [],
    players: [],
};

export default {
    readItems: (): Promise<ItemData[]> => Promise.resolve(world.items),
    readPlayers: (): Promise<PlayerData[]> => Promise.resolve(world.players),
    writeItems: (data: ItemData[]): Promise<void> => new Promise((resolve) => {
        world.items = data;
        resolve();
    }),
    writePlayers: (data: PlayerData[]): Promise<void> => new Promise((resolve) => {
        world.players = data;
        resolve();
    }),
};

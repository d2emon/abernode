import State, {ItemData, PlayerData} from "./state";
import {endGame} from "./gamego/endGame";
import World, {MetaData, WorldInterface, Event} from './services/world';

/* Fast File Controller v0.1 */

const cache = {
    loaded: false,
    meta: {
        firstEventId: 0,
        lastEventId: 0,
    },
    events: [],
};

const saveCache = (state: State): Promise<void> => Promise.resolve();
const saveNoCache = (state: State): Promise<void> => Promise.all([
    World.writeItems(state.objinfo),
    World.writePlayers(state.ublock),
])
    .then(() => {
        cache.loaded = false;
    });

const loadCache = (state: State): Promise<WorldInterface> => Promise.resolve({
    meta: cache.meta,
    items: state.objinfo,
    players: state.ublock,
    events: cache.events,
});
const loadNoCache = (state: State): Promise<WorldInterface> => Promise.all([
    World.readMeta(),
    World.readItems(),
    World.readPlayers(),
])
    .then(([
        meta,
        items,
        players,
    ]): WorldInterface => ({
        meta,
        items,
        players,
        events: [],
    }))
    .then((world: WorldInterface) => {
        cache.loaded = true;
        cache.meta = world.meta;
        cache.events = world.events;
        state.objinfo = world.items;
        state.ublock = world.players;
        return world;
    })
    .catch(() => endGame(state, 'Cannot find World file').then(() => Promise.reject(new Error())));

export const saveWorld = (state: State): Promise<void> => !cache.loaded
    ? saveCache(state)
    : saveNoCache(state);

export const loadWorld = (state: State): Promise<WorldInterface> => cache.loaded
    ? loadCache(state)
    : loadNoCache(state);

export const loadMeta = (): Promise<MetaData> => World.readMeta();
export const loadEvent = (eventId: number): Promise<Event> => World.readEvent(eventId);
export const saveEvent = (event: Event): Promise<number> => World.writeEvent(event);

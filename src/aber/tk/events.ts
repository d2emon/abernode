import State from "../state";
import {Event} from '../services/world';
import {loadWorld, saveEvent} from "../opensys";
import {endGame} from "../gamego/endGame";
import {getPlayers, Player, setPlayer} from "../support";
import {
    getLocationId,
    getName, setEventsUnprocessed,
} from "./reducer";
import {dropItems} from "../objsys";

export interface Attack {
    characterId: number,
    damage: number,
    weaponId?: number,
}

const longwthr = (state: State): void => undefined;
const loseme = (state: State): Promise<void> => undefined;

const onTimeout = (state: State) => (player: Player): Promise<void> => Promise.all([
    Events.broadcast(state, `${player.name} has been timed out\n`),
    dropItems(state, player),
    setPlayer(state, player.playerId, { name: '' }),
])
    .then(() => null);

const removeTimeout = (state: State, firstEventId: number): Promise<void> => loadWorld(state)
    .then(world => getPlayers(state, state.maxu))
    .then(players => players.filter(
        player => player.exists && !player.isAbsent && (player.eventId < firstEventId)
    ))
    .then(players => Promise.all(players.map(onTimeout(state))))
    .then(() => null);

const clean = (state: State, recordId: number): Promise<void> => loadWorld(state)
    .then((world) => {
        const { meta } = world;
        /*
        for(let i = 1; i < 100; i += 20) {
            const bk = sec_read(world, 100 + i, 1280);
            sec_write(world, bk, i, 1280);
        }
        */
        /*
        meta = {
            firstEventId: meta.firstEventId + 100,
            lastEventId: recordId,
        };
        sec_write(unit, inpbk, 0, 64);
         */
        return removeTimeout(state, meta.firstEventId / 2);
    });


const onSave = (state: State) => (recordId: number): Promise<void> => {
    if (recordId < 199) {
        return Promise.resolve();
    }
    return Promise.all([
        clean(state, recordId),
        Promise.resolve(longwthr(state)),
    ])
        .then(() => {});
};

const onError = (state: State) => (): Promise<void> => loseme(state)
    .then(() => endGame(state, 'AberMUD: FILE_ACCESS : Access failed'));

export const emitEvent = (state: State, event: Event, force: boolean = false): Promise<void> => saveEvent(event)
    .then(onSave(state))
    .then(() => {
        if (force) {
            setEventsUnprocessed(state);
        }
    })
    .catch(onError(state));

const Events = {
    broadcast: (state: State, message: string): Promise<void> => emitEvent(state, {
        receiver: undefined,
        sender: undefined,
        code: -1,
        channelId: undefined,
        payload: message,
    }, true),
    sendStopSnoop: (state: State, snooped: Player): Promise<void> => emitEvent(state, {
        receiver: snooped.name,
        sender: undefined,
        code: -400,
        channelId: undefined,
        payload: undefined,
    }),
    sendSnoop: (state: State, snooped: Player, snooper: string): Promise<void> => emitEvent(state, {
        receiver: snooped.name,
        sender: snooper,
        code: -401,
        channelId: undefined,
        payload: undefined,
    }),
    sendChangePerson: (state: State, person: Player, payload: {}): Promise<void> => emitEvent(state, {
        receiver: person.name,
        sender: undefined,
        code: -599,
        channelId: undefined,
        payload,
    }),
    sendEvil: (state: State): Promise<void> => emitEvent(state, {
        receiver: undefined,
        sender: undefined,
        code: -666,
        channelId: undefined,
        payload: undefined,
    }),
    sendVisibility: (state: State, payload: {}): Promise<void> => emitEvent(state, {
        receiver: undefined,
        sender: undefined,
        code: -9900,
        channelId: undefined,
        payload,
    }),
    sendLocalMessage: (state: State, channelId: number, sender: string, message: string): Promise<void> => emitEvent(state, {
        receiver: sender,
        sender,
        code: -10000,
        channelId,
        payload: message,
    }),
    sendExorcise: (state: State, sender: string, receiver: Player, channelId: number): Promise<void> => emitEvent(state, {
        receiver: receiver.name,
        sender,
        code: -10001,
        channelId,
        payload: undefined,
    }),
    sendSimpleShout: (state: State, message: string): Promise<void> => emitEvent(state, {
        receiver: getName(state),
        sender: getName(state),
        code: -10002,
        channelId: getLocationId(state),
        payload: message,
    }),
    sendSay: (state: State, message: string): Promise<void> => emitEvent(state, {
        receiver: getName(state),
        sender: getName(state),
        code: -10003,
        channelId: getLocationId(state),
        payload: message,
    }),
    sendTell: (state: State, receiver: Player, message: string): Promise<void> => emitEvent(state, {
        receiver: receiver.name,
        sender: getName(state),
        code: -10004,
        channelId: undefined,
        payload: message,
    }),
    sendKick: (state: State, receiver: Player): Promise<void> => emitEvent(state, {
        receiver: receiver.name,
        sender: undefined,
        code: -10010,
        channelId: undefined,
        payload: undefined,
    }),
    sendPrivate: (state: State, receiver: Player, message: string): Promise<void> => emitEvent(state, {
        receiver: receiver.name,
        sender: undefined,
        code: -10011,
        channelId: undefined,
        payload: message,
    }),
    sendSummon: (state: State, victim: Player, sender: string, channelId: number): Promise<void> => emitEvent(state, {
        receiver: victim.name,
        sender,
        code: -10020,
        channelId,
        payload: undefined,
    }),
    sendDamage: (state: State, victim: Player, attack: Attack): Promise<void> => emitEvent(state, {
        receiver: victim.name,
        sender: undefined,
        code: -10021,
        channelId: getLocationId(state),
        payload: attack,
    }),
    sendWeather: (state: State, weatherId: number): Promise<void> => emitEvent(state, {
        receiver: undefined,
        sender: undefined,
        code: -10030,
        channelId: undefined,
        payload: weatherId,
    }),
    sendEndFight: (state: State, receiver: string): Promise<void> => emitEvent(state, {
        receiver: receiver,
        sender: undefined,
        code: -20000,
        channelId: undefined,
        payload: undefined,
    }),
};

export default Events;
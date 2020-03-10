import State from "../state";
import {Event} from '../services/world';
import {getDebugMode} from "../parse/reducer";
import {sendMessage} from "../bprintf/bprintf";
import {loadEvent, loadMeta, loadWorld, saveWorld} from "../opensys";
import {
    disableCalibrate,
    getEventId, getGameMode, getLocationId,
    getName, getNeedUpdate,
    isEventsUnprocessed, setChannelId,
    setEventId,
    setEventsProcessed, setUpdated,
} from "./reducer";
import {endGame} from "../gamego/endGame";
import Events from "./events";
import {Player, setPlayer} from "../support";
import {asyncUnsetAlarm} from "../gamego/reducer";
import {dropMyItems, findPlayer, isDark, listPeople, showItems} from "../objsys";
import {sendWizards} from "../new1/events";
import {savePerson} from "../newuaf";
import {checkSnoop} from "../bprintf/snoop";
import {logger} from "../files";
import {cureBlind, getBlind} from "../new1/reducer";
import {isWizard} from "../newuaf/reducer";
import {onLook} from "../mobile";

const eorte = (state: State, interrupt: boolean = false) => (): Promise<void> => Promise.resolve();
const gamrcv = (state: State, event: Event) => (): Promise<void> => Promise.resolve();
const showname = (state: State, roomId: number): Promise<void> => Promise.resolve();
const openroom = (roomId: number, permissions: string): Promise<any> => Promise.resolve({});
const lodex = (state: State, room: any): Promise<void> => Promise.resolve();
const fclose = (room: any): Promise<void> => Promise.resolve();
const getstr = (room: any): Promise<string[]> => Promise.resolve([]);

/**
 * AberMUD II   C
 *
 * This game systems, its code scenario and design
 * are (C) 1987/88  Alan Cox,Jim Finnis,Richard Acott
 *
 * This file holds the basic communications routines
 */


/**
 * Data format for mud packets
 *
 * Sector 0
 * [64 words]
 * 0   Current first message pointer
 * 1   Control Word
 * Sectors 1-n  in pairs ie [128 words]
 *
 * [channel][controlword][text data]
 *
 * [controlword]
 * 0 = Text
 * - 1 = general request
 */

const saveEventId = (state: State, player: Player, eventId: number): Promise<void> => {
    setEventId(state, eventId);
    if (getNeedUpdate(state, eventId)) {
        return Promise.resolve();
    }
    setUpdated(state, eventId);
    return loadWorld(state)
        .then(() => setPlayer(state, player.playerId, { eventId }));
};

export const fadePlayer = (state: State, player: Player): Promise<void> => saveEventId(state, player, -2);

const processEvent = (state: State) => (event: Event): Promise<void> => {
    const systemEvent = (state: State, event: Event, message: string): Promise<void> => sendMessage(state, message)
        .then(gamrcv(state, event));

    /* Print appropriate stuff from data block */
    const eventCode = getDebugMode(state) ? `\n<${event.code}>` : '';
    if (event.code < -3) {
        return systemEvent(state, event, eventCode);
    } else {
        return sendMessage(state, `${eventCode}${event.payload}`);
    }
};

const loadAndProcess = (state: State, eventId: number): Promise<void> => {
    setEventId(state, eventId);
    return loadEvent(eventId)
        .then(processEvent(state));
};

const getEvents = (state: State, firstEventId: number | undefined, lastEventId: number): Promise<void>[] => {
    firstEventId = (firstEventId !== undefined) ? firstEventId : lastEventId;
    const events = [];
    for (let eventId = firstEventId; eventId < lastEventId; eventId += 1) {
        events.push(loadAndProcess(state, eventId));
    }
    setEventId(state, lastEventId);
    return events;
};

export const processEvents = (
    state: State,
    player: Player,
    interrupt: boolean = false,
): Promise<void> => loadMeta()
    .then(({ lastEventId }) => Promise.all(getEvents(
        state,
        getEventId(state),
        lastEventId,
    )))
    .then(() => saveEventId(state, player, getEventId(state)))
    .then(eorte(state, interrupt))
    .then(() => {
        state.rdes = 0;
        state.tdes = 0;
        state.vdes = 0;
    })
    .catch(() => endGame(state, 'AberMUD: FILE_ACCESS : Access failed'));

export const processAndSave = (
    state: State,
    player: Player,
    lazy: boolean = false,
): Promise<State> => {
    const process = (!lazy || isEventsUnprocessed(state))
        ? processEvents(state, player)
        : Promise.resolve();
    return process
        .then(() => lazy && setEventsProcessed(state))
        .then(() => saveWorld(state))
        .then(() => state);
};

const tbroad = Events.broadcast;

export const describeChannel = (state: State, roomId: number, actor: Player, noBrief: boolean = false): Promise<void> => {
    const darkRoom = (un1: any): Promise<void> => fclose(un1)
        .then(() => sendMessage(state, 'It is dark\n'))
        .then(() => loadWorld(state))
        .then(() => onLook(state, actor));

    const lightRoom = (un1: any): Promise<void> => getstr(un1)
        .then(content => Promise.all(content.map((row, rowId) => {
            if (row === '#DIE') {
                if (getBlind(state)) {
                    cureBlind(state);
                    return Promise.resolve();
                }
                if (isWizard(state)) {
                    return sendMessage(state, '<DEATH ROOM>\n');
                } else {
                    return looseGame(state, actor, 'bye bye.....');
                }
            } else if (row === '#NOBR') {
                if (!noBrief) {
                    state.brmode = false;
                }
            } else {
                if (getBlind(state)) {
                    return Promise.resolve();
                }
                const show = noBrief || !state.brmode || (rowId === 0);
                return show && sendMessage(state, `${row}\n`);
            }
        })))
        .then(() => fclose(un1));

    const showRoom = (un1: any) => lodex(state, un1)
        .then(() => isDark(state, roomId))
        .then((dark) => (dark
            ? darkRoom(un1)
            : lightRoom(un1)
        ));

    const listContents = (): Promise<void> => showItems(state)
        .then(() => getGameMode(state) ? listPeople(state) : [])
        .then(messages => messages.forEach(message => sendMessage(state, message)));

    return loadWorld(state)
        .then(() => saveWorld(state))
        .then(() => getBlind(state) && sendMessage(state, 'You are blind... you can\'t see a thing!\n'))
        .then(() => isWizard(state) && showname(state, roomId))
        .then(() => openroom(roomId, 'r'))
        .then((room) => (room
            ? showRoom(room)
            : sendMessage(state, `\nYou are on channel ${roomId}\n`)
        ))
        .then(() => loadWorld(state))
        .then(() => getBlind(state)
            ? undefined
            : listContents()
        )
        .then(() => sendMessage(state, '\n'))
        .then(() => onLook(state, actor));
};

export const setLocationId = (state: State, locationId: number, player: Player): Promise<void> => {
    setChannelId(state, locationId);
    return loadWorld(state)
        .then(world => setPlayer(state, player.playerId, { locationId }))
        .then(() => describeChannel(state, locationId, player));
};

const doLoose = (state: State, player: Player): Promise<void> => Promise.all([
    dropMyItems(state, player),
    setPlayer(state, player.playerId, { exists: false }),
    (player.visibility < 10000)
        ? sendWizards(state, `${getName(state)} has departed from AberMUDII\n`)
        : Promise.resolve(),
])
    .then(() => null);

const onLoose = (state: State, player: Player): Promise<void> => Promise.all([
    savePerson(state, player),
    checkSnoop(state),
])
    .then(() => null);

const loosePlayer = (state: State, player?: Player): Promise<void> => loadWorld(state)
    .then(() => disableCalibrate(state))
    .then(() => doLoose(state, player))
    .then(() => saveWorld(state))
    .then(() => onLoose(state, player));

export const looseGame = (state: State, player: Player, message?: string): Promise<void> => asyncUnsetAlarm(state)
    .then(() => player && loosePlayer(state, player))
    .then(() => message && endGame(state, message));

const loodrv = (state: State, player: Player): Promise<void> => describeChannel(state, getLocationId(state), player);

const userwrap = (state: State, actor: Player): Promise<void> => findPlayer(state, getName(state))
    .then(player => player && logger
        .write(`System Wrapup exorcised ${getName(state)}`)
        .catch(error => looseGame(state, actor, error))
        .then(() => looseGame(state, actor, undefined))
    );

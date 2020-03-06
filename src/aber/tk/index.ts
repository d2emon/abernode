import State from "../state";
import {Event} from '../services/world';
import {getDebugMode} from "../parse/reducer";
import {sendMessage} from "../bprintf/bprintf";
import {loadEvent, loadMeta, loadWorld, saveWorld} from "../opensys";
import {
    disableCalibrate,
    getEventId,
    getEventUnset,
    getName,
    isEventsUnprocessed, setChannelId,
    setEventId,
    setEventsProcessed,
    setEventsUnprocessed
} from "./reducer";
import {endGame} from "../gamego/endGame";
import Events from "./events";
import {Player, setPlayer} from "../support";
import {asyncUnsetAlarm} from "../gamego/reducer";
import {dropMyItems} from "../objsys";
import {sendWizards} from "../new1/events";
import {savePerson} from "../newuaf";
import {checkSnoop} from "../bprintf/snoop";

const eorte = (state: State, interrupt: boolean = false) => (): Promise<void> => Promise.resolve();
const gamrcv = (state: State, event: Event) => (): Promise<void> => Promise.resolve();
const lookin = (state: State, locationId: number) => (): Promise<void> => Promise.resolve();
const update = (state: State, name: string) => (): Promise<void> => Promise.resolve();

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
    name?: string,
    interrupt: boolean = false,
): Promise<void> => loadMeta()
    .then(({ lastEventId }) => Promise.all(getEvents(
        state,
        getEventId(state),
        lastEventId,
    )))
    .then(update(state, name || getName(state)))
    .then(eorte(state, interrupt))
    .then(() => {
        state.rdes = 0;
        state.tdes = 0;
        state.vdes = 0;
    })
    .catch(() => endGame(state, 'AberMUD: FILE_ACCESS : Access failed'));

export const processAndSave = (
    state: State,
    name?: string,
    lazy: boolean = false,
): Promise<State> => {
    const process = (!lazy || isEventsUnprocessed(state))
        ? processEvents(state, name)
        : Promise.resolve();
    return process
        .then(() => lazy && setEventsProcessed(state))
        .then(() => saveWorld(state))
        .then(() => state);
};

const tbroad = Events.broadcast;

export const setLocationId = (state: State, locationId: number, player: Player): Promise<void> => {
    setChannelId(state, locationId);
    return loadWorld(state)
        .then(world => setPlayer(state, player.playerId, { locationId }))
        .then(lookin(state, locationId));
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


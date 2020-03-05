import State from "../state";
import {Event} from '../services/world';
import {getDebugMode} from "../parse/reducer";
import {sendMessage} from "../bprintf/bprintf";
import {loadEvent, loadMeta, loadWorld, saveWorld} from "../opensys";
import {
    getEventId,
    getEventUnset,
    getName,
    isEventsUnprocessed,
    setEventId,
    setEventsProcessed,
    setEventsUnprocessed
} from "./reducer";
import {endGame} from "../gamego/endGame";

const eorte = (state: State, interrupt: boolean = false) => (): Promise<void> => Promise.resolve();
const gamrcv = (state: State, event: Event) => (): Promise<void> => Promise.resolve();
const update = (state: State, name: string) => (): Promise<void> => Promise.resolve();

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
    ))
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

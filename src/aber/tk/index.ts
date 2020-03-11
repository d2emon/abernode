import State from "../state";
import {Event} from '../services/world';
import {
    checkInterrupt, disableBriefMode,
    getCalibrationNeeded,
    getDebugMode,
    getSummon, isBriefMode,
    isDrunk,
    isSummoned,
    resetCalibration, resetIsDamagedBy,
    resetSummoned,
    tickDrunk,
    tickInvisibility
} from "../parse/reducer";
import {sendMessage} from "../bprintf/bprintf";
import {loadEvent, loadMeta, loadWorld, saveWorld} from "../opensys";
import {
    disableCalibrate,
    getEventId, getGameMode, getLocationId,
    getName, getNeedUpdate,
    isEventsUnprocessed, isHere, setChannelId,
    setEventId,
    setEventsProcessed, setUpdated,
} from "./reducer";
import {endGame} from "../gamego/endGame";
import Events from "./events";
import {getItem, getPlayer, Player, setPlayer} from "../support";
import {asyncUnsetAlarm} from "../gamego/reducer";
import {dropMyItems, findPlayer, isDark, listPeople, showItems} from "../objsys";
import {sendWizards} from "../new1/events";
import {savePerson} from "../newuaf";
import {checkSnoop} from "../bprintf/snoop";
import {logger} from "../files";
import {clearForce, cureBlind, getBlind, getDumb, getForce} from "../new1/reducer";
import {isWizard, updateStrength} from "../newuaf/reducer";
import {onLook} from "../mobile";
import {getLocationName, loadExits} from "../zones";
import {receiveEvent} from "../parse/events";
import {sendBaseMessage} from "../bprintf";
import {calibrate, getChannel} from "../parse";
import {hitPlayer} from "../blood";
import {checkRoll} from "../magic";
import {isWornBy} from "../new1";
import {executeCommand} from "../parse/parser";
import {getEnemy, getFight, getWeapon, resetFight} from "../blood/reducer";

const fclose = (room: any): Promise<void> => Promise.resolve();
const getstr = (room: any): Promise<string[]> => Promise.resolve([]);

const dosumm = (state: State, ades: number): Promise<void> => Promise.resolve();

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

const onEventsProcessed = (oldState: State, actor: Player, interrupt: boolean) => (): Promise<void> => {
    const checkInvisibility = (state: State): Promise<State> => Promise.resolve(tickInvisibility(state))
        .then(() => state);
    const doCalibrate = (state: State): Promise<State> => getCalibrationNeeded(state)
        ? calibrate(state, actor)
            .then(() => resetCalibration(state))
            .then(() => state)
        : Promise.resolve(state);
    const doSummon = (state: State): Promise<State> => isSummoned(state)
        ? dosumm(state, getSummon(state))
            .then(() => state)
        : Promise.resolve(state);
    const doHit = (state: State, enemy: Player) => getWeapon(state)
        .then(weapon => hitPlayer(state, actor, enemy, weapon))
        .then(() => resetFight(state));
    const doFight = (state: State): Promise<State> => {
        if (!getFight(state)) {
            return Promise.resolve(state);
        }
        return getEnemy(state)
            .then((enemy) => {
                if (!enemy) {
                    return resetFight(state);
                } else if (!isHere(state, enemy.playerId)) {
                    return resetFight(state);
                } else if (!enemy.exists) {
                    return resetFight(state);
                } else {
                    return interrupt && doHit(state, enemy);
                }
            })
            .then(() => state);
    };
    const checkXp = (state: State): Promise<State> => Promise.all([
        checkRoll(r => r < 10),
        getItem(state, 18),
    ])
        .then(([
            xpRoll,
            item,
        ]) => {
            if (xpRoll || isWornBy(state, item, actor)) {
                updateStrength(state, 1);
                return calibrate(state, actor);
            }
        })
        .then(() => state);
    const checkForce = (state: State): Promise<State> => Promise.resolve(getForce(state))
        .then((force) => force
            ? executeCommand(state, force, actor, true)
            : Promise.resolve()
        )
        .then(() => clearForce(state))
        .then(() => state);
    const checkDrunk = (state: State): Promise<void> => Promise.resolve(isDrunk(state))
        .then((drunk) => {
            if (!drunk) {
                return;
            }
            tickDrunk(state);
            if (getDumb(state)) {
                return;
            } else {
                return executeCommand(state, 'hiccup', actor);
            }
        });


    return checkInvisibility(oldState)
        .then(doCalibrate)
        .then(doSummon)
        .then(doFight)
        .then(checkXp)
        .then(checkForce)
        .then(checkDrunk);
};

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

const processEvent = (state: State, actor: Player) => (event: Event): Promise<void> => {
    const systemEvent = (state: State, event: Event, message: string): Promise<void> => sendMessage(state, message)
        .then(() => receiveEvent(state, actor, event));

    /* Print appropriate stuff from data block */
    const eventCode = getDebugMode(state) ? `\n<${event.code}>` : '';
    if (event.code < -3) {
        return systemEvent(state, event, eventCode);
    } else {
        return sendMessage(state, `${eventCode}${event.payload}`);
    }
};

const loadAndProcess = (state: State, actor: Player, eventId: number): Promise<void> => {
    setEventId(state, eventId);
    return loadEvent(eventId)
        .then(processEvent(state, actor));
};

const getEvents = (state: State, actor: Player, firstEventId: number | undefined, lastEventId: number): Promise<void>[] => {
    firstEventId = (firstEventId !== undefined) ? firstEventId : lastEventId;
    const events = [];
    for (let eventId = firstEventId; eventId < lastEventId; eventId += 1) {
        events.push(loadAndProcess(state, actor, eventId));
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
        player,
        getEventId(state),
        lastEventId,
    )))
    .then(() => saveEventId(state, player, getEventId(state)))
    .then(onEventsProcessed(state, player, checkInterrupt(state, interrupt)))
    .then(() => {
        resetSummoned(state);
        resetIsDamagedBy(state);
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
        .then(() => sendBaseMessage(state, 'It is dark\n'))
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
                    return sendBaseMessage(state, '<DEATH ROOM>\n');
                } else {
                    return looseGame(state, actor, 'bye bye.....');
                }
            } else if (row === '#NOBR') {
                if (!noBrief) {
                    disableBriefMode(state);
                }
            } else {
                if (getBlind(state)) {
                    return Promise.resolve();
                }
                const show = noBrief || !isBriefMode(state) || (rowId === 0);
                return show && sendMessage(state, `${row}\n`);
            }
        })))
        .then(() => fclose(un1));

    const showRoom = (room: any) => loadExits(state, room)
        .then(() => isDark(state, roomId))
        .then((dark) => (dark
            ? darkRoom(room)
            : lightRoom(room)
        ));

    const listContents = (): Promise<void> => showItems(state)
        .then(() => getGameMode(state) ? listPeople(state) : [])
        .then(messages => messages.forEach(message => sendMessage(state, message)));

    return loadWorld(state)
        .then(() => saveWorld(state))
        .then(() => getBlind(state) && sendBaseMessage(state, 'You are blind... you can\'t see a thing!\n'))
        .then(() => isWizard(state) && sendBaseMessage(state, `${getLocationName(state, roomId)}\n`))
        .then(() => getChannel(roomId))
        .then((room) => (room
            ? showRoom(room)
            : sendBaseMessage(state, `\nYou are on channel ${roomId}\n`)
        ))
        .then(() => loadWorld(state))
        .then(() => getBlind(state)
            ? undefined
            : listContents()
        )
        .then(() => sendBaseMessage(state, '\n'))
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

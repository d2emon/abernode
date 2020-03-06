import State from "../state";
import Events from "./events";
import {logger} from "../files";
import {getPlayer, getPlayers, setPlayer} from "../support";
import {dropItems, dropMyItems, findPlayer, findVisiblePlayer, listPeople, showItems} from "../objsys";
import {sendVisiblePlayer} from "../bprintf";
import {checkSnoop} from "../bprintf/snoop";
import {endGame} from "../gamego/endGame";
import {asyncUnsetAlarm} from "../gamego/reducer";
import {roll} from "../magic";
import {onLook} from "../mobile";
import {cureBlind, getBlind} from "../new1/reducer";
import {sendWizards} from "../new1/events";
import {isWizard} from "../newuaf/reducer";
import {savePerson} from "../newuaf";
import {loadWorld, saveWorld} from "../opensys";
import {
    disableCalibrate,
    getEventId,
    getGameMode,
    getLocationId,
    getName,
} from "./reducer";

/*
long mynum=0;
*/

const putmeon = (state: State, name: string): Promise<void> => {
    state.iamon = false;
    return loadWorld(state)
        .then(newState => findVisiblePlayer(newState, name))
        .then((player) => {
            if (player) {
                return endGame(state, 'You are already on the system - you may only be on once at a time');
            }
            return getPlayers(state, state.maxu)
                .then((players) => {
                    let f = null;
                    players.forEach((player) => {
                        if (f !== null) {
                            return;
                        }
                        if (!player.exists) {
                            f = player.playerId;
                        }
                    });
                    if (f === null) {
                        state.mynum = state.maxu;
                        return;
                    }
                    return setPlayer(state, f, {
                        name,
                        locationId: getLocationId(state),
                        level: 1,
                        strength: -1,
                        visibility: 0,
                        sex: 0,
                        eventId: -1,
                        weaponId: -1,
                    })
                        .then(() => {
                            state.mynum = f;
                            state.iamon = true;
                        });
                });

        })
};

const loseme = (state: State, name: string): Promise<void> => getPlayer(state, state.mynum)
    .then((player) => {
        return asyncUnsetAlarm(state)
            .then(() => {
                /* No interruptions while you are busy dying */
                /* ABOUT 2 MINUTES OR SO */
                disableCalibrate(state);
                return loadWorld(state);
            })
            .then(newState => {
                const promises = [
                    dropMyItems(newState),
                    setPlayer(newState, player.playerId, { exists: false }),
                ];
                if (player.visibility < 10000) {
                    promises.push(sendWizards(newState, `${getName(newState)} has departed from AberMUDII\n`));
                }
                return Promise.all(promises)
            })
            .then(() => saveWorld(state))
            .then(() => savePerson(state))
            .then(() => checkSnoop(state));
    });

/*
long lasup=0;
*/

const update = (state: State, name: string): Promise<void> => {
    const eventId = getEventId(state);
    const xp = Math.abs(eventId - state.lasup);
    if (xp < 10) {
        return Promise.resolve();
    }
    return loadWorld(state)
        .then(newState => {
            newState.lasup = eventId;
            return setPlayer(newState, newState.mynum, { eventId });
        });
};

const lookin = (state: State, roomId: number): Promise<void> => loadWorld(state)
    .then(newState => saveWorld(newState))
    .then(() => {
        /* Lords ???? */
        if (getBlind(state)) {
            bprintf(state, 'You are blind... you can\'t see a thing!\n');
        }
        if (isWizard(state)) {
            showname(state, roomId);
        }
        return openroom(roomId, 'r')
            .then((un1) => {
                const xx1 = () => {
                    let xxx = false;
                    lodex(state, un1);
                    if (isdark(state)) {
                        return fclose(un1)
                            .then(() => {
                                bprintf(state, 'It is dark\n');
                                return loadWorld(state);
                            })
                            .then(newState => onLook(newState));
                    }
                    return getstr(un1)
                        .then((content) => {
                            content.forEach((s) => {
                                if (s === '#DIE') {
                                    if (getBlind(state)) {
                                        return rewind(state, un1)
                                            .then(() => {
                                                cureBlind(state);
                                                return xx1();
                                            });
                                    }
                                    if (isWizard(state)) {
                                        return bprintf(state, '<DEATH ROOM>\n');
                                    } else {
                                        loseme(state, getName(state));
                                        return endGame(state, 'bye bye.....');
                                    }
                                } else if (s === '#NOBR') {
                                    state.brmode = false;
                                } else {
                                    if (!getBlind(state) && !xxx) {
                                        bprintf(state, `${s}\n`);
                                    }
                                    xxx = state.brmode
                                }
                            });
                            return fclose(state, un1);
                        });
                };
                return xx1();
            })
            .catch(() => {
                bprintf(state, `\nYou are on channel ${roomId}\n`);
            })
            .then(() => loadWorld(state))
            .then(newState => {
                if (getBlind(newState)) {
                    return;
                }
                return showItems(newState)
                    .then(
                        () => getGameMode(newState) && listPeople(newState)
                            .then(messages => messages.forEach(message => bprintf(newState, message)))
                    )
            })
            .then(() => {
                bprintf(state, '\n');
                return onLook(state);
            });
    });

const loodrv = (state: State) => lookin(state, getLocationId(state));

/*
long iamon=0;
*/

const userwrap = (state: State): Promise<void> => findPlayer(state, getName(state))
    .then((player) => {
        if (!player) {
            return;
        }
        loseme(state);
        return logger.write(`System Wrapup exorcised ${getName(state)}`);
    });

/*
fcloselock(file)
FILE *file;
{
	fflush(file);
	flock(fileno(file),LOCK_UN);
	fclose(file);
}


 */
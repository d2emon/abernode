import State from "../state";
import {logger} from "../files";
import {
    Player,
    setPlayer,
} from "../support";
import {
    findPlayer,
    listPeople,
    showItems,
} from "../objsys";
import {onLook} from "../mobile";
import {
    cureBlind,
    getBlind,
} from "../new1/reducer";
import {isWizard} from "../newuaf/reducer";
import {
    loadWorld,
    saveWorld,
} from "../opensys";
import {
    getEventId,
    getGameMode,
    getLocationId,
    getName,
} from "./reducer";
import {looseGame} from "./index";

/*
long lasup=0;
*/

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
                            .then(newState => onLook(state, actor));
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
                                        return looseGame(state, actor, 'bye bye.....');
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
                return onLook(state, actor);
            });
    });

const loodrv = (state: State) => lookin(state, getLocationId(state));

/*
long iamon=0;
*/

const userwrap = (state: State, actor: Player): Promise<void> => findPlayer(state, getName(state))
    .then(player => player && logger
        .write(`System Wrapup exorcised ${getName(state)}`)
        .catch(error => looseGame(state, actor, error))
        .then(() => looseGame(state, actor, undefined))
    );

/*
fcloselock(file)
FILE *file;
{
	fflush(file);
	flock(fileno(file),LOCK_UN);
	fclose(file);
}
 */
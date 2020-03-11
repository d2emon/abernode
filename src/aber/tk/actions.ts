import State from "../state";
import {Player, setPlayer} from "../support";
import {initPerson} from "../newuaf";
import {loadWorld} from "../opensys";
import {getLevel, getSex, getStrength, isGod} from "../newuaf/reducer";
import {sendWizards} from "../new1/events";
import {createVisiblePlayerMessage} from "../bprintf";
import {getLocationId, getName, setGameOn} from "./reducer";
import {roll} from "../magic";
import {processEvents, setLocationId} from "./index";
import Events, {PLAYER_MESSAGE} from "./events";

const setStartingLocationId = (state: State, player: Player): Promise<number> => roll()
    .then((locationRoll) => {
        if (locationRoll > 50) {
            return setLocationId(state, -5, player);
        } else {
            return setLocationId(state, -183, player);
        }
    })
    .then(() => getLocationId(state));

const startGame = (state: State, player: Player): Promise<boolean> => initPerson(state)
    .then(() => loadWorld(state))
    .then((world) => Promise.all([
        setPlayer(state, player.playerId, {
            strength: getStrength(state),
            level: getLevel(state),
            visibility: isGod(state) ? 0 : 10000,
            flags: { sex: getSex(state) },
            weaponId: -1,
            helping: -1,
        }),
        sendWizards(state, createVisiblePlayerMessage(getName(state), '[ [author]  has entered the game ]\n')),
        Promise.resolve(setGameOn(state)),
    ]))
    .then(() => Promise.all([
        setStartingLocationId(state, player),
        processEvents(state, player),
    ]))
    .then(([
        locationId,
    ]) => Events.sendSocialEvent(
        state,
        '[author]  has entered the game\n',
        PLAYER_MESSAGE,
    ))
    .then(() => true);

const defaultCommand = (): Promise<boolean> => {
    console.log('Unknown . option');
    return Promise.resolve(true);
};

export const executeSpecial = (state: State, command: string, actor: Player): Promise<boolean> => {
    if (!command) {
        return Promise.resolve(false);
    } else if (command[0] !== '.') {
        return Promise.resolve(false);
    } else if (command.substr(1).toLowerCase() === 'g') {
        return startGame(state, actor);
    } else {
        return defaultCommand();
    }
};

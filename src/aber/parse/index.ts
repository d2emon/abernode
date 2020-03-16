import State from "../state";
import Battle from "../blood/battle";
import { DefaultWeapon } from "../blood/weapon";
import {getTitle, Player, setPlayer} from "../support";
import {getCanCalibrate, getName} from "../tk/reducer";
import {getLevel, getScore, getSex, getStrength, setLevel, setStrength, updateScore} from "../newuaf/reducer";
import {GWIZ, logger, ROOMS} from "../files";
import {looseGame} from "../tk";
import {sendWizards} from "../new1/events";
import {
    actorName, sendBaseMessage,
    sendTextMessage,
} from "../bprintf";

const levelof = (state: State, score: number): number => 0;

export const calibrate = (state: State, actor: Player, score?: number): Promise<void> => {
    const updateLevel = (level: number): Promise<void> => {
        if (level === getLevel(state)) {
            return Promise.resolve();
        }
        setLevel(state, level);
        return Promise.all([
            sendBaseMessage(state, `You are now ${getName(state)} ${getTitle(level, getSex(state), state.hasfarted)}\n`),
            sendWizards(state, `${actorName(state)} is now level ${level}\n`),
            logger
                .write(`${getName(state)} to level ${level}`)
                .catch(error => looseGame(state, actor, error)),
            (level === 10)
                ? sendTextMessage(state, GWIZ)
                : Promise.resolve(),
        ])
            .then(() => null);
    };

    const calibrateStrength = (maxStrength: number): void => getStrength(state) > maxStrength
        && setStrength(state, maxStrength);

    if (score) {
        updateScore(state, score);
    }

    /* Routine to correct me in user file */
    return getCanCalibrate(state)
        ? updateLevel(levelof(state, getScore(state)))
            .then(() => Promise.all([
                getLevel(state),
                getStrength(state),
                getSex(state),
                DefaultWeapon(state),
            ]))
            .then(([
                level,
                strength,
                sex,
                weapon,
            ]) => setPlayer(state, actor.playerId, {
                level,
                strength,
                sex,
                weaponId: weapon.weaponId,
            }))
            .then(() => calibrateStrength(30 + 10 * getLevel(state)))
        : Promise.resolve();
};

export const getChannel = (channelId: number, permissions: string = 'r'): Promise<any> => Promise.resolve({
    fileName: `${ROOMS}${-channelId}`,
    permissions,
});
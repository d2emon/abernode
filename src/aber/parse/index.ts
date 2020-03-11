import State from "../state";
import {getTitle, Player, setPlayer} from "../support";
import {getCanCalibrate, getName} from "../tk/reducer";
import {getLevel, getScore, getSex, getStrength, setLevel, setStrength, updateScore} from "../newuaf/reducer";
import {GWIZ, logger} from "../files";
import {looseGame} from "../tk";
import {sendWizards} from "../new1/events";
import {
    actorName,
    sendTextMessage,
} from "../bprintf";
import {sendMessage} from "../bprintf/bprintf";

const levelof = (state: State, score: number): number => 0;

export const calibrate = (state: State, actor: Player, score?: number): Promise<void> => {
    const updateLevel = (level: number): Promise<void> => {
        if (level === getLevel(state)) {
            return Promise.resolve();
        }
        setLevel(state, level);
        return Promise.all([
            sendMessage(state, `You are now ${getName(state)} ${getTitle(level, getSex(state), state.hasfarted)}\n`),
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
            .then(() => setPlayer(state, actor.playerId, {
                level: getLevel(state),
                strength: getStrength(state),
                sex: getSex(state),
                weaponId: state.wpnheld,
            }))
            .then(() => calibrateStrength(30 + 10 * getLevel(state)))
        : Promise.resolve();
};


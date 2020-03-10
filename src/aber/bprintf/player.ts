import State from "../state";
import {Player} from "../support";
import {getBlind} from "../new1/reducer";
import {getLevel} from "../newuaf/reducer";
import {getLocationId, isHere, playerIsMe} from "../tk/reducer";
import {isDark} from "../objsys";

export const canSeePlayer = (state: State, player: Player): Promise<boolean> => {
    if (!player) {
        return Promise.resolve(true);
    }
    if (playerIsMe(state, player.playerId)) {
        /* me */
        return Promise.resolve(true);
    }
    if (player.visibility > getLevel(state)) {
        return Promise.resolve(false);
    }
    if (getBlind(state)) {
        /* Cant see */
        return Promise.resolve(false);
    }
    if (!isHere(state, player.locationId)) {
        return Promise.resolve(true);
    }
    return isDark(state, getLocationId(state))
        .then(result => !result);
};

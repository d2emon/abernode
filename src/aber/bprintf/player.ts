import State from "../state";
import {Player} from "../support";
import {getBlind} from "../new1/reducer";
import {getLevel} from "../newuaf/reducer";

const isdark = (state: State, locationId: number): boolean => false;

export const canSeePlayer = (state: State, player: Player): boolean => {
    if (!player) {
        return true;
    }
    if (player.playerId === state.mynum) {
        /* me */
        return true;
    }
    if (player.visibility > getLevel(state)) {
        return false;
    }
    if (getBlind(state)) {
        /* Cant see */
        return false;
    }
    if (player.locationId !== state.curch) {
        return true;
    }
    return !isdark(state, state.curch);
};

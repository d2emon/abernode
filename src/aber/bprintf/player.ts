import State from "../state";
import {Player} from "../support";

const isdark = (state: State, locationId: number): boolean => false;

export const setName = (state: State, player: Player): void => {
    const itBots = [
        'riatha',
        'shazareth',
    ];
    if (!player) {
        return;
    }
    if (player.playerId === state.mynum) {
        return;
    }
    /* Assign Him her etc according to who it is */
    if (player.isBot && itBots.every(bot => (player.name !== bot))) {
        state.wd_it = player.name;
        return;
    }
    if (player.sex) {
        state.wd_her = player.name;
    } else {
        state.wd_him = player.name;
    }
    state.wd_them = player.name;
};

export const canSeePlayer = (state: State, player: Player): boolean => {
    if (!player) {
        return true;
    }
    if (player.playerId === state.mynum) {
        /* me */
        return true;
    }
    if (player.visibility > state.my_lev) {
        return false;
    }
    if (state.ail_blind) {
        /* Cant see */
        return false;
    }
    if (player.locationId !== state.curch) {
        return true;
    }
    return !isdark(state, state.curch);
};

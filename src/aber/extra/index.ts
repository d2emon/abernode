import State from '../state';
import {
    CONTAINED_IN,
    LOCATED_IN,
} from '../object';
import {
    getItem,
    getPlayer,
} from '../support';
import {playerName} from '../bprintf';
import {isWizard} from "../newuaf/reducer";
import {getLocationName} from "../zones";
import {getChannel} from "../parse";

const fclose = (file: any): Promise<void> => Promise.resolve();
const getstr = (file: any): Promise<string[]> => Promise.resolve([]);

const showChannel = (state: State, locationId: number, channel: any): Promise<string> => getstr(channel)
    .then((text) => {
        const short = text[7];
        const name = isWizard(state) ? ` | ${getLocationName(state, locationId)}` : '';
        return fclose(channel).then(() => `${short}${name}`);
    });

export const showLocation = (state: State, locationId: number, carryFlag: number): Promise<string> => {
    if (!isWizard(state) && (carryFlag === LOCATED_IN) && (locationId > -5)) {
        return Promise.resolve('Somewhere.....');
    }
    if (carryFlag === CONTAINED_IN) {
        return getItem(state, locationId)
            .then(item => `In the ${item.name}`);
    }
    if (carryFlag !== LOCATED_IN) {
        return getPlayer(state, locationId)
            .then(player => `Carried by ${playerName(player)}`);
    }
    return getChannel(locationId)
        .then(channel => channel
            ? showChannel(state, locationId, channel)
            :  'Out in the void'
        );
};

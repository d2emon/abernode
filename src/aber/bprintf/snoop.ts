import State from "../state";
import {getSnooped, startSnoop, stopSnoop} from "./reducer";
import {Player} from "../support";
import Snoop from '../services/snoop';
import {sendStopSnoop} from "../parse/events";
import {getName} from "../tk/reducer";

export const viewSnoop = (state: State, snooped: Player): Promise<void> => Snoop.connectSnoop(getName(state))
    .then(() => Snoop.readSnoop(getName(state)))
    .then(text => text.forEach(s => console.log(`|${s}`)))
    .then(() => Snoop.clearSnoop(getName(state)))
    .then(() => {
        stopSnoop(state);
        // showMessages(state);
        startSnoop(state, snooped);
    })
    .catch(() => null);
export const touchSnoop = (name: string): Promise<boolean> => Snoop.createSnoop(name);
export const writeSnoop = (name: string, text: string): Promise<void> => Snoop.connectSnoop(name)
    .then(() => Snoop.writeSnoop(name, text));

export const checkSnoop = (state: State): Promise<void> => getSnooped(state)
    .then(snooped => snooped && sendStopSnoop(state, snooped));

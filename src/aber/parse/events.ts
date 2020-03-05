import State from "../state";
import {getLocationId, getName} from "../tk/reducer";
import Events from '../tk/events';

export const sendMyMessage = (state: State, message: string): Promise<void> => Events.sendLocalMessage(
    state,
    getLocationId(state),
    getName(state),
    message,
);

import State from "../state";
import Events, {
    MessageType,
} from '../tk/events';
import {
    sendVisibleMessage,
} from "../bprintf";
import {adjustWeather} from "./index";
import {EventData} from "../parse/events";
import {getName} from "../tk/reducer";

export const sendSocialEvent = (
    state: State,
    message: string,
    messageType: MessageType,
): Promise<void> => Events.sendMyMessage(
    state,
    message,
    messageType,
    getName(state),
);

export const receiveWeather = (state: State, data:EventData): Promise<void> => {
    const weatherId = adjustWeather(state, data.payload);
    if (weatherId === 0) {
        return sendVisibleMessage(state, 'The sun comes out of the clouds\n');
    } else if (weatherId === 1) {
        return sendVisibleMessage(state, 'It has started to rain\n');
    } else if (weatherId === 2) {
        return Promise.resolve();
    } else if (weatherId === 3) {
        return sendVisibleMessage(state, 'It has started to snow\n');
    } else if (weatherId === 4) {
        return sendVisibleMessage(state, 'You are half blinded by drifting snow, as a white, icy blizzard sweeps across\nthe land\n');
    }
    return Promise.resolve();
};


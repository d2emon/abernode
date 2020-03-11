import State from "../state";
import {sendVisibleName} from "../bprintf";
import {sendMessage} from "../bprintf/bprintf";
import {adjustWeather} from "./index";
import {EventData, sendMyMessage} from "../parse/events";
import {getName} from "../tk/reducer";

export const sendSocialEvent = (state: State, text: string): Promise<void> => sendMyMessage(
    state,
    text.replace('%s', getName(state)),
);

export const receiveWeather = (state: State, data:EventData): Promise<void> => {
    const weatherId = adjustWeather(state, data.payload);
    if (weatherId === 0) {
        return sendMessage(state, sendVisibleName('The sun comes out of the clouds\n'));
    } else if (weatherId === 1) {
        return sendMessage(state, sendVisibleName('It has started to rain\n'));
    } else if (weatherId === 2) {
        return Promise.resolve();
    } else if (weatherId === 3) {
        return sendMessage(state, sendVisibleName('It has started to snow\n'));
    } else if (weatherId === 4) {
        return sendMessage(state, sendVisibleName('You are half blinded by drifting snow, as a white, icy blizzard sweeps across\nthe land\n'));
    }
    return Promise.resolve();
};


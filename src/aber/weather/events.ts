import State from "../state";
import {
    createAudibleMessage,
    createVisibleMessage,
    createVisiblePlayerMessage,
} from "../bprintf";
import {sendMessage} from "../bprintf/bprintf";
import {adjustWeather} from "./index";
import {EventData, sendMyMessage} from "../parse/events";
import {getName} from "../tk/reducer";

type EventType = 'DEFAULT_EVENT' | 'AUDIBLE_EVENT' | 'VISIBLE_EVENT';

export const DEFAULT_EVENT = 'DEFAULT_EVENT';
export const AUDIBLE_EVENT = 'AUDIBLE_EVENT';
export const VISIBLE_EVENT = 'VISIBLE_EVENT';

const createEventMessage = (name: string, message: string, eventType: EventType): string => {
    if (eventType === AUDIBLE_EVENT) {
        return createAudibleMessage(message, name);
    } else if (eventType === VISIBLE_EVENT) {
        return createVisiblePlayerMessage(name, message);
    } else {
        return message.replace('%s', name);
    }
};

export const sendSocialEvent = (state: State, message: string, eventType: EventType): Promise<void> => sendMyMessage(
    state,
    createEventMessage(getName(state), message, eventType),
);

export const receiveWeather = (state: State, data:EventData): Promise<void> => {
    const weatherId = adjustWeather(state, data.payload);
    if (weatherId === 0) {
        return sendMessage(state, createVisibleMessage('The sun comes out of the clouds\n'));
    } else if (weatherId === 1) {
        return sendMessage(state, createVisibleMessage('It has started to rain\n'));
    } else if (weatherId === 2) {
        return Promise.resolve();
    } else if (weatherId === 3) {
        return sendMessage(state, createVisibleMessage('It has started to snow\n'));
    } else if (weatherId === 4) {
        return sendMessage(state, createVisibleMessage('You are half blinded by drifting snow, as a white, icy blizzard sweeps across\nthe land\n'));
    }
    return Promise.resolve();
};


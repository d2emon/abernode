/**
 * The next part of the universe...
 */
import State from "../state";
import {getItem, setItem} from "../support";
import Events from "../tk/events";
import {roll} from "../magic";
import {getLocationId} from "../tk/reducer";
import {createVisibleMessage} from "../bprintf";

/**
 * Weather Routines
 *
 * Current weather defined by state of object 47
 *
 * states are
 *
 * 0    Sunny
 * 1    Rain
 * 2    Stormy
 * 3    Snowing
 */

const isOutdoors = (channelId: number): boolean => {
    if ([-100, -101, -102].indexOf(channelId) >= 0) {
        return true;
    } else if ([-183, -170].indexOf(channelId) >= 0) {
        return false;
    } else if ((channelId > -191) && (channelId < -168)) {
        return true;
    } else if ((channelId > -172) && (channelId < -181)) {
        return true;
    } else  {
        return false;
    }
};

const getWeather = (state: State) => getItem(state, 0);

export const modifyWeather = (state: State, weatherId: number): Promise<void> => getWeather(state)
    .then((weather) => (weather.state === weatherId)
        && setItem(state, weather.itemId, { state: weatherId })
            .then(() => Events.sendWeather(state, weatherId))
    );

export const nextWeather = (state: State): Promise<void> => roll()
    .then((a) => {
        if (a < 50) {
            return 1;
        } else if (a > 90) {
            return 2;
        } else {
            return 0;
        }
    })
    .then(weatherId => modifyWeather(state, weatherId));

export const adjustWeather = (state: State, weatherId: number): number => {
    const channelId = getLocationId(state);
    if (!isOutdoors(channelId)) {
        return undefined
    }
    if ((channelId >= -179) && (channelId <= -199)) {
        return (weatherId > 1)
            ? weatherId % 2
            : weatherId;
    } else if ((channelId >= -178) && (channelId <= -100)) {
        return ((weatherId === 1) || (weatherId === 2))
            ? weatherId + 2
            : weatherId;
    } else {
        return weatherId;
    }
};

export const showWeather = (state: State): Promise<string | void> => getWeather(state)
    .then((weather) => {
        const weatherId = adjustWeather(state, weather.state);
        if (weatherId === 1) {
            return ((getLocationId(state) > -199) && (getLocationId(state) < -178))
                ? 'It is raining, a gentle mist of rain, which sticks to everything around\n'
                    + 'you making it glisten and shine. High in the skies above you is a rainbow\n'
                : createVisibleMessage('It is raining\n');
        } else if (weatherId === 2) {
            return createVisibleMessage('The skies are dark and stormy\n');
        } else if (weatherId === 3) {
            return createVisibleMessage('It is snowing\n');
        } else if (weatherId === 4) {
            return createVisibleMessage('A blizzard is howling around you\n');
        }
        return undefined;
    });


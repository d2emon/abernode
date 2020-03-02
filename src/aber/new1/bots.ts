import State from "../state";
import {
    getPlayers,
    setPlayer,
} from "../support";

interface Bot {
    name: string,
    locationId: number,
    strength: number,
    sex: number,
    level: number,
    visibility: number,
    weaponId: number,
}

const newBot = (
    name: string,
    locationId: number,
    strength: number,
    sex: number,
    level: number,
): Bot => ({
    name,
    locationId,
    strength,
    sex,
    level,
    visibility: 0,
    weaponId: -1,
});

const BOTS: Bot[] = [
    newBot('The Wraith', -1077, 60, 0, -2),
    newBot('Shazareth', -1080, 99, 0, -30),
    newBot('Bomber', -308, 50, 0, -10),
    newBot('Owin', -311, 50, 0, -11),
    newBot('Glowin', -318, 50, 0, -12),
    newBot('Smythe', -320, 50, 0, -13),
    newBot('Dio', -332, 50, 0, -14),
    newBot('The Dragon', -326, 500, 0, -2),
    newBot('The Zombie', -639, 20, 0, -2),
    newBot('The Golem', -1056, 90, 0, -2),
    newBot('The Haggis', -341, 50, 0, -2),
    newBot('The Piper', -630, 50, 0, -2),
    newBot('The Rat', -1064, 20, 0, -2),
    newBot('The Ghoul', -129, 40, 0, -2),
    newBot('The Figure', -130, 90, 0, -2),
    newBot('The Ogre', -144, 40, 0, -2),
    newBot('Riatha', -165, 50, 0, -31),
    newBot('The Yeti', -173, 80, 0, -2),
    newBot('The Guardian', -197, 50, 0, -2),
    newBot('Prave', -201, 60, 0, -400),
    newBot('Wraith', -350, 60, 0, -2),
    newBot('Bath', -1, 70, 0, -401),
    newBot('Ronnie', -809, 40, 0, -402),
    newBot('The Mary', -1, 50, 0, -403),
    newBot('The Cookie', -126, 70, 0, -404),
    newBot('MSDOS', -1, 50, 0, -405),
    newBot('The Devil', -1, 70, 0, -2),
    newBot('The Copper', -1, 40, 0, -2)
];

export const resetPlayers = (state: State): Promise<void> => getPlayers(state)
    .then(players => players.filter(player => player.isBot))
    .then(players => players.forEach((player) => {
        const bot = (player.playerId < 35) && BOTS[player.playerId - 16];
        const newPlayer = bot || { exists: false };
        return setPlayer(state, player.playerId, newPlayer);
    }));

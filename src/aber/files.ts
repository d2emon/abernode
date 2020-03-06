import State from "./state";
import {endGame} from "./gamego/endGame";
import state from "./state";

export const UAF_RAND = '/cygdrive/c/Programs/Adv/AberMUD2/mud/uaf.rand';
export const ROOMS = '/cygdrive/c/Programs/Adv/AberMUD2/mud/TEXT/ROOMS/';
export const LOG_FILE = '/cygdrive/c/Programs/Adv/AberMUD2/mud/mud_syslog';
export const BAN_FILE = '/cygdrive/c/Programs/Adv/AberMUD2/mud/banned_file';
export const NOLOGIN = '/cygdrive/c/Programs/Adv/AberMUD2/mud/nologin';
export const RESET_T = '/cygdrive/c/Programs/Adv/AberMUD2/mud/reset_t';
export const RESET_N = '/cygdrive/c/Programs/Adv/AberMUD2/mud/reset_n';
export const RESET_DATA = '/cygdrive/c/Programs/Adv/AberMUD2/mud/reset_data';
export const MOTD = '/cygdrive/c/Programs/Adv/AberMUD2/mud/TEXT/gmotd2';
export const GWIZ = '/cygdrive/c/Programs/Adv/AberMUD2/mud/TEXT/gwiz';
export const HELP1 = '/cygdrive/c/Programs/Adv/AberMUD2/mud/TEXT/help1';
export const HELP2 = '/cygdrive/c/Programs/Adv/AberMUD2/mud/TEXT/help2';
export const HELP3 = '/cygdrive/c/Programs/Adv/AberMUD2/mud/TEXT/help3';
export const WIZLIST = '/cygdrive/c/Programs/Adv/AberMUD2/mud/TEXT/wiz.list';
export const CREDITS = '/cygdrive/c/Programs/Adv/AberMUD2/mud/TEXT/credits';
export const EXAMINES = '/cygdrive/c/Programs/Adv/AberMUD2/mud/EXAMINES/';
export const LEVELS = '/cygdrive/c/Programs/Adv/AberMUD2/mud/TEXT/level.txt';
export const PFL = '/cygdrive/c/Programs/Adv/AberMUD2/mud/user_file';
export const PFT = '/cygdrive/c/Programs/Adv/AberMUD2/mud/user_file.b';
export const EXE = '/cygdrive/c/Programs/Adv/AberMUD2/mud/mud.exe';
export const EXE2 = '/cygdrive/c/Programs/Adv/AberMUD2/mud/mud.1';
export const SNOOP = '/cygdrive/c/Programs/Adv/AberMUD2/mud/SNOOP/';
export const HOST_MACHINE = 'DAVIDPOOTER';

export const logger = {
    write: (message: string): Promise<void> => new Promise<void>((resolve) => {
        const date = new Date();
        console.log(LOG_FILE, `${date.toString()}: ${message}`);
        resolve();
        // On Error
        // looseGame(state, actor, 'Log fault : Access Failure')
        throw new Error('Log fault : Access Failure');
    }),
};

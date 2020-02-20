import State from '../state';
import {logger} from '../files';
import {Player} from "../support";
import {brkword} from "../__dummies";
import {findVisiblePlayer} from "../objsys";

const loseme = (state: State): void => undefined;
const crapup = (state: State, message: string): void => undefined;
const isdark = (state: State, locationId: number): boolean => false;
const opensnoop = (fileName: string, mode: string): Promise<any> => Promise.resolve({});

const clearMessages = (state: State): void => {
    state.sysbuf = '';
};
const addMessage = (state: State, message: string): void => {
    state.sysbuf += message;
};

export const resetMessages = (state: State): void => {
    try {
        clearMessages(state); /* 4K of chars should be enough for worst case */
    } catch (e) {
        crapup(state, 'Out Of Memory')
    }
};

const bprintf = (state: State, message: string): Promise<void> => {
    /* Max 240 chars/msg */
    if (message.length > 235) {
        return logger.write('Bprintf Short Buffer overflow')
            .then(() => crapup(state, 'Internal Error in BPRINTF'));
    }

    /* Now we have a string of chars expanded */
    if ((message.length + state.sysbuf.length) > 4095) {
        loseme(state);
        return logger.write(`Buffer overflow on user ${state.globme}`)
            .then(() => crapup(state, 'PANIC - Buffer overflow'))
    }
    addMessage(state, message);

    return Promise.resolve();
};

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

// Wrappers

export const showFile = (text: string): string => `[f]${text}[/f]`;
export const sendSound = (text: string): string => `[d]${text}[/d]`;
export const sendVisiblePlayer = (player: string, text: string): string => `[s name="${player}"]${text}[/s]`;
export const sendName = (text: string): string => `[p]${text}[/p]`;
export const sendVisibleName = (text: string): string => `[c]${text}[/c]`;
export const sendSoundPlayer = (text: string): string => `[P]${text}[/P]`;
export const sendPlayerForVisible = (text: string): string => `[D]${text}[/D]`;
export const sendKeyboard = (text: string): string => `[l]${text}[/l]`;


/*

long snoopd= -1;

FILE *opensnoop(user,per)
char *per;
char *user;
    {
    FILE *x;
    extern FILE *openlock();
    char z[256];
    sprintf(z,"%s%s",SNOOP,user);
    x=openlock(z,per);
    return(x);
    }

long snoopt= -1;

char sntn[32];
*/

const snoopcom = (state: State): Promise<void> => {
    if (state.my_lev < 10) {
        bprintf(state, 'Ho hum, the weather is nice isn\'t it\n');
        return Promise.resolve();
    }
    if (state.snoopt !== -1) {
        bprintf(state, `Stopped snooping on ${state.sntn}\n`);
        state.snoopt = -1;
        sendsys(state, state.sntn, state.globme, -400, 0, null);
        return Promise.resolve();
    }
    if (brkword() === -1) {
        return Promise.resolve();
    }
    return findVisiblePlayer(state, state.wordbuf)
        .then((snooped) => {
            if (!snooped) {
                return bprintf(state, 'Who is that ?\n');
            }
            if (((state.my_lev < 10000) && snooped.isWizard) || !snooped.canBeSnooped) {
                bprintf(state, 'Your magical vision is obscured\n');
                state.snoopt = -1;
                return;
            }
            state.sntn = snooped.name;
            state.snoopt = snooped.playerId;
            bprintf(state, `Started to snoop on ${snooped.name}\n`);
            sendsys(state, state.sntn, state.globme, -401, 0, null);
            return opensnoop(state.globme, 'w')
                .then((fx) => fprint(fx, '').then(() => fcloselock(fx)));
        });
};

/*
void viewsnoop()
    {
    long x;
    char z[128];
    FILE *fx;
    fx=opensnoop(globme,"r+");
    if(snoopt==-1) return;
    if(fx==0)return;
    while((!feof(fx))&&(fgets(z,127,fx)))
           printf("|%s",z);
    ftruncate(fileno(fx),0);
    fcloselock(fx);
    x=snoopt;
    snoopt= -1;
    *//*
    pbfr();
    *//*
    snoopt=x;
    }
void chksnp()
{
if(snoopt==-1) return;
sendsys(sntn,globme,-400,0,"");
}
*/

import {
    bprintf,
    brkword,
    sendsys,
} from './__dummies';
import State from "./state";
import {createItem, getItem, getPlayer, setPlayer, holdItem, Item, putItem} from "./support";
import {dropItems, findItem, findVisiblePlayer, isCarriedBy} from "./objsys";
import state from "./state";
import {sendName, sendVisibleName, sendVisiblePlayer} from "./bprintf/bprintf";

/*
#include "files.h"

extern long curch;
extern long mynum;
extern long my_lev;
extern char globme[];
extern char wordbuf[];
extern FILE *openroom();
extern FILE *openuaf();
extern FILE *openlock();

randperc()
{
    long x;
    time(&x);
    srand(x);
    x=rand();
    return(x%100);
}
*/

const sumcom = (state: State): Promise<void> => {
    const sumob = (item: Item): Promise<void> => {
        if (state.my_lev < 10) {
            bprintf(state, 'You can only summon people\n');
            return Promise.resolve();
        }
        return Promise.resolve()
            .then(() => (
                item.heldBy
                    ? getPlayer(state, item.heldBy).then(player => player.locationId)
                    : item.locationId
            ))
            .then((locationId) => {
                const ms = `${sendName(state.globme)} has summoned the ${item.name}\n`;
                sendsys(state, state.globme, state.globme, -10000, locationId, ms);
                bprintf(state, `The ${item.name} flies into your hand, was `);
                desrm(state, item.locationId, item.carryFlag);
                return holdItem(state, item.itemId, state.mynum);
            })
    };

    const willwork = (characterId): Promise<void> => getPlayer(state, characterId)
        .then((player) => {
            bprintf(state, 'You cast the summoning......\n');
            if (player.playerId < 16) {
                sendsys(state, player.name, state.globme, -10020, state.curch, '');
                return;
            }
            if ((player.playerId === 17) || (player.playerId === 23)) {
                return;
            }

            return dropItems(state, player)
                .then(() => {
                    const seg = sendVisiblePlayer(player.name, `${player.name} has arrived\n`);
                    sendsys(state, null, null, -10000, state.curch, seg);
                    return setPlayer(state, player.playerId, {locationId: state.curch});
                });
        });

    if (brkword(state) === -1) {
        bprintf(state, 'Summon who ?\n');
        return Promise.resolve();
    }

    return findItem(state, state.wordbuf)
        .then((item) => {
            if (item && (item.itemId !== -1)) {
                return sumob(item);
            }
            return findVisiblePlayer(state, state.wordbuf)
                .then((player) => {
                    if (!player) {
                        return bprintf(state, 'I dont know who that is\n');
                    }
                    if (state.my_str < 10) {
                        return bprintf(state, 'You are too weak\n');
                    }
                    if (state.my_lev < 10) {
                        state.my_str -= 2;
                    }
                    let c = state.my_lev * 2;
                    if (state.my_lev > 9) {
                        c = 101;
                    }
                    return getPlayer(state, state.mynum)
                        .then((me) => {
                            return Promise.all([
                                111,
                                121,
                                163,
                            ].map(itemId => getItem(state, itemId)))
                                .then(items => items.filter(item => isCarriedBy(item, me, (state.my_lev < 10))))
                                .then(items => items.forEach(() => {
                                    c += state.my_lev;
                                }))
                                .then(() => {
                                    const d = randperc(state);
                                    if (state.my_lev > 9) {
                                        return willwork(player.playerId);
                                    }
                                    if (iswornby(state, 90, player.playerId) || (c < d)) {
                                        return bprintf(state, 'The spell fails....\n');
                                    }
                                    return Promise.all([
                                        32,
                                        159,
                                        174
                                    ].map(itemId => getItem(state, itemId)))
                                        .then((items) => {
                                            return findVisiblePlayer(state, 'wraith')
                                                .then((wraith) => {
                                                    if ((wraith && (player.playerId === wraith.playerId)) || items.some(item => isCarriedBy(item, me, (state.my_lev < 10)))) {
                                                        return bprintf(state, 'Something stops your summoning from succeeding\n');
                                                    }
                                                    if (player.playerId === state.mynum) {
                                                        return bprintf(state, 'Seems a waste of effort to me....\n');
                                                    }
                                                    if ((state.curch >= -1082) && (state.curch <= -1076)) {
                                                        return bprintf(state, 'Something about this place makes you fumble the magic\n');
                                                    }
                                                    return willwork(player.playerId);
                                                });
                                        });
                                });
                        });
                });
        });
};

/*

 delcom()
    {
    extern long my_lev;
    extern char wordbuf[];
    if(my_lev<11)
       {
       bprintf("What ?\n");
       return;
       }
    if(brkword()== -1)
       {
       bprintf("Who ?\n");
       return;
       }
    if(delu2(wordbuf)== -1)bprintf("failed\n");
    }

 passcom()
    {
    extern char globme[];
    chpwd(globme);
    }
*/

const goloccom = (state: State): Promise<void> => {
    if (state.my_lev < 10) {
        bprintf(state, 'huh ?\n');
        return Promise.resolve();
    }
    if (brkword(state) === -1) {
        bprintf(state, 'Go where ?\n');
        return Promise.resolve();
    }
    const n1 = state.wordbuf;
    if (brkword(state) === -1) {
        state.wordbuf = '';
    }
    const a = roomnum(n1, state.wordbuf);
    return openroom(state, a, 'r')
        .then((b) => {
            if ((a >= 0) || !b) {
                return bprintf(state, 'Unknown Room\n')
            }
            return fclose(b);
        })
        .then(() => {
            const bf1 = sendVisiblePlayer('%s', `%s ${state.mout_ms}\n`);
            sillycom(state, bf1);
            state.curch = a;
            trapch(state, state.curch);
            const bf2 = sendVisiblePlayer('%s', `%s ${state.min_ms}\n`);
            sillycom(state, bf2);
        });
};

const wizcom = (state: State): Promise<void> => {
    if (state.my_lev < 10) {
        bprintf(state, 'Such advanced conversation is beyond you\n');
        return Promise.resolve();
    }
    state.wordbuf = getreinput(state);
    const bf = `${sendName(state.globme)} : ${state.wordbuf}\n`;
    sendsys(state, state.globme, state.globme, -10113, state.curch, bf);
    state.rd_wd = true;
};

const viscom = (state: State): Promise<void> => getPlayer(state, state.mynum)
    .then((player) => {
        if (state.my_lev < 10) {
            return bprintf(state, 'You can\'t just do that sort of thing at will you know.\n');
        }
        if (!player.visibility) {
            return bprintf(state, 'You already are visible\n');
        }
        return setPlayer(state, player.playerId, { visibility: 0 })
            .then(() => {
                const ar = [
                    player.playerId,
                    player.visibility,
                ];
                sendsysy(state, null, null, -9900, 0, ar);
                bprintf(state, 'Ok\n');
                sillycom(state, sendVisiblePlayer('%s', '%s suddenely appears in a puff of smoke\n'))
            });


    });

const inviscom = (state: State): Promise<void> => getPlayer(state, state.mynum)
    .then((player) => {
        if (state.my_lev < 10) {
            return bprintf(state, 'You can\'t just turn invisible like that!\n');
        }
        let visibility = 10;
        if (state.my_lev > 9999) {
            visibility = 10000;
        }
        if ((state.my_lev === 10033) && (brkword(state) !== -1)) {
            visibility = Number(state.wordbuf);
        }

        if (player.visibility) {
            return bprintf(state, 'You are already invisible\n');
        }
        return setPlayer(state, player.playerId, { visibility })
            .then(() => {
                const ar = [
                    player.playerId,
                    player.visibility,
                ];
                sendsysy(state, null, null, -9900, 0, ar);
                bprintf(state, 'Ok\n');
                sillycom(state, sendVisibleName('%s vanishes!\n'));
            });


    });

const ressurcom = (state: State): Promise<void> => {
    if (state.my_lev < 10) {
        bprintf(state, 'Huh ?\n');
        return Promise.resolve();
    }
    if (brkword(state) === -1) {
        bprintf(state, 'Yes but what ?\n');
        return Promise.resolve();
    }
    return findItem(state, state.wordbuf)
        .then((item) => {
            if (item.itemId === -1) {
                return bprintf(state, 'You can only ressurect objects\n')
            }
            if (!item.isDestroyed) {
                return bprintf(state, 'That already exists\n')
            }
            return createItem(state, item.itemId)
                .then((created) => putItem(state, created.itemId, state.curch))
                .then(() => {
                    const bf = `The ${item.name} suddenly appears\n`;
                    sendsys(state, null, null, -10000, state.curch, bf);
                });
        });
};

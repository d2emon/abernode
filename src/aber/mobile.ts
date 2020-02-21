import {
    bprintf, brkword,
    sendsys,
} from './__dummies';
import State from "./state";
import {getItem, getItems, getPlayer, getPlayers, setPlayer} from "./support";
import {IS_LIT} from "./object";
import {isCarriedBy, byMask, findAvailableItem, findPlayer} from "./objsys";
import {hitPlayer} from "./blood/blood";
import {sendSound, sendSoundPlayer, sendVisibleName} from "./bprintf/bprintf";
import {showMessages} from "./bprintf/output";

/*
#include "files.h"

extern FILE *openlock();

on_timing()
{
	if(randperc()>80) onlook();
}
*/

const onlook = (state: State): Promise<void> => Promise.all([
    getPlayer(state, state.mynum),
    getItem(state, 45),
    getItem(state, 32),
])
    .then(([
        player,
        item45,
        runeSword,
    ]) => {
        chkfight(state, fpbnd(state, 'shazareth'));
        if (!isCarriedBy(item45, player, (state.my_lev < 10))) {
            chkfight(state, fpbnd(state, 'wraith'));
        }
        chkfight(state, fpbnd(state, 'bomber'));
        chkfight(state, fpbnd(state, 'owin'));
        chkfight(state, fpbnd(state, 'glowin'));
        chkfight(state, fpbnd(state, 'smythe'));
        chkfight(state, fpbnd(state, 'dio'));
        if (!isCarriedBy(item45, player, (state.my_lev < 10))) {
            chkfight(state, fpbnd(state, 'zombie'));
        }
        chkfight(state, fpbnd(state, 'rat'));
        chkfight(state, fpbnd(state, 'ghoul'));
        chkfight(state, fpbnd(state, 'ogre'));
        chkfight(state, fpbnd(state, 'riatha'));
        chkfight(state, fpbnd(state, 'yeti'));
        chkfight(state, fpbnd(state, 'guardian'));
        if (isCarriedBy(runeSword, player, (state.my_lev < 10))) {
            dorune(state);
        }

        if (player.helping !== -1) {
            helpchkr(state);
        }
    });

const chkfight = (state: State, playerId: number): Promise<void> => Promise.all([
    getPlayer(state, playerId),
    getPlayer(state, state.mynum),
])
    .then(([
        player,
        me,
    ]) => {
        if (player.playerId < 0) {
            /* No such being */
            return;
        }
        /* Maybe move it */
        consid_move(state, player.playerId);
        if (!player.exists) {
            return;
        }
        if (player.locationId !== state.curch) {
            return;
        }
        if (me.visibility) {
            /* Im invis */
            return;
        }
        if (randperc(state) > 40) {
            return;
        }
        return Promise.all([
            byMask(state, { [IS_LIT]: true }),
            findPlayer(state, 'yeti'),
        ])
            .then(([found, yeti]) => {
                if ((player.playerId === yeti.playerId) && found) {
                    return;
                }
                mhitplayer(state, player.playerId, me.playerId);
            })
    });

/*
 consid_move(x)
 {;}

 crashcom(  )
    {
    extern long my_lev ;
    if( my_lev<10 )
       {
       bprintf( "Hmmm....\n" ) ;
       bprintf( "I expect it will sometime\n" ) ;
       return ;
       }
    bprintf( "Bye Bye Cruel World...\n" ) ;
    sendsys( "", "", -666, 0, "" ) ;
    rescom(  ) ;
    }

 singcom(  )
    {
    if( chkdumb(  ) ) return ;
    sillycom( "" ) ;
    bprintf( "You sing\n" ) ;
    }
*/

const singcom = (state: State): Promise<void> => {
    if (chkdumb()) {
        return Promise.resolve();
    }
    sillycom(`${sendSoundPlayer('%s')}${sendSound(' sings in Gaelic\n')}`);

};

const spraycom = (state: State): Promise<void> => {
    const [b, playerId] = vichere();
    if (b === -1) {
        return Promise.resolve();
    }
    if (brkword(state) === -1) {
        bprintf(state, 'With what ?\n');
        return Promise.resolve();
    }
    if (state.wordbuf === 'with') {
        if (brkword(state) === -1) {
            bprintf(state, 'With what ?\n');
            return Promise.resolve();
        }
    }
    return findAvailableItem(state, state.wordbuf)
        .then((item) => {
            if (item.itemId === -1) {
                return bprintf(state, 'With what ?\n');
            } else {
                return bprintf(state, 'You can\'t do that\n');
            }
        })
};

/* More new stuff */

const dircom = (state: State): Promise<void> => {
    if (state.my_lev < 10) {
        bprintf(state, 'That\'s a wiz command\n');
        return Promise.resolve();
    }
    return getItems(state)
        .then((items) => items.forEach((item) => {
            const [b, c] = findzone(state, item.locationId);
            let d = `${b}${c}`;
            if (item.heldBy !== undefined) {
                d += ' CARRIED';
            }
            if (item.containedIn !== undefined) {
                d += ' IN ITEM';
            }
            bprintf(state, `${item.name} ${d}`);
            if (item.itemId % 3 === 2) {
                bprintf(state, '\n');
            }
            if (item.itemId % 18 === 17) {
                return showMessages(state);
            }
        }))
        .then(() => bprintf(state, '\n'));
};

/*
 sys_reset(  )
    {
    extern long my_lev ;
    char xx[ 128 ] ;
    FILE *fl ;
    long t, u ;
    if( tscale(  )!=2 )
       {
       bprintf( "There are other people on.... So it wont work!\n" ) ;
       return ;
       }
    time( &t ) ;
    fl=openlock( RESET_N, "ruf" ) ;
    if(fl==NULL) goto errk;
    fscanf( fl, "%ld", &u ) ;
    fclose(fl ) ;
    if( ( t-u<( 3600 ) )&&( u<t ) )
       {
       bprintf( "Sorry at least an hour must pass between resets\n" ) ;
       return ;
       }
errk:t=my_lev ;
    my_lev=10 ;
    rescom(  ) ;
    my_lev=t ;
    }
*/

const dorune = (state: State): Promise<void> => {
    if (state.in_fight) {
        return Promise.resolve();
    }
    let hitRune = false;
    return getPlayers(state, 32)
        .then(players => players.forEach((player) => {
            if (hitRune) {
                return;
            }
            if (player.playerId === state.mynum) {
                return;
            }
            if (!player.exists) {
                return;
            }
            if (player.isWizard) {
                return;
            }
            if (player.locationId === state.curch) {
                hitRune = true;
                if (randperc(state) < 9 * state.my_lev) {
                    return;
                }
                return findPlayer(state, player.name)
                    .then((player1) => {
                        if (!player1) {
                            return;
                        }
                        bprintf(state, 'The runesword twists in your hands lashing out savagely\n');
                        return getItem(state, 32)
                            .then(weapon => hitPlayer(state, player1, weapon));
                    });
            }
        }))
};

const pepdrop = (state: State): Promise<void> => {
    sendsys(state, null, null, -10000, state.curch, 'You start sneezing ATISCCHHOOOOOO!!!!\n');
    return getPlayer(state, 32)
        .then((dragon) => {
            if (!dragon.exists || (dragon.locationId !== state.curch)) {
                return Promise.resolve();
            }
            /* Ok dragon and pepper time */
            return Promise.all([
                getPlayer(state, state.mynum),
                getItem(state, 89),
            ])
                .then(([player, pepper]) => {
                    if (isCarriedBy(pepper, player, (state.my_lev < 10)) && (pepper.heldBy !== undefined)) {
                        /* Fried dragon */
                        return setPlayer(state, dragon.playerId, { exists: false })
                            .then(() => {
                                /* No dragon */
                                state.my_sco += 100;
                                calibme(state);
                            });
                    }
                    /* Whoops !*/
                    bprintf(state, 'The dragon sneezes forth a massive ball of flame.....\n');
                    bprintf(state, 'Unfortunately you seem to have been fried\n');
                    loseme();
                    crapup(state, 'Whoops.....   Frying tonight\n');
                });
        });
};

const dragget = (state: State): Promise<boolean> => {
    if (state.my_lev > 9) {
        return Promise.resolve(false);
    }
    return findPlayer(state, 'dragon')
        .then((dragon) => {
            if (dragon.playerId === -1) {
                return false;
            }
            if (dragon.locationId !== state.curch) {
                return false;
            }
            return true;
        });
};

const helpchkr = (state: State): Promise<void> => getPlayer(state, state.mynum)
    .then(player => getPlayer(state, player.helping))
    .then((player) => {
        const nhelp = () => {
            bprintf(state, `You can no longer help ${sendVisibleName(player.name)}\n`);
            return setPlayer(state, state.mynum, { helping: -1 });
        };

        if (!state.i_setup) {
            return;
        }
        if (!player.exists) {
            return nhelp();
        }
        if (player.locationId !== state.curch) {
            return nhelp();
        }
    });

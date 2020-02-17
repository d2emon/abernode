import {
    bprintf,
    sendsys,
} from './__dummies';
import State from "./state";
import {availableByMask, getItem, getItems, getPlayer, getPlayers} from "./support";
import {IS_LIT} from "./object";

/*
#include <stdio.h>
#include "files.h"

extern FILE *openlock();
extern char *pname(  ) ;

on_timing()
{
	if(randperc()>80) onlook();
}

onlook(  )
    {
long a ;
extern long mynum ;
chkfight( fpbns( "shazareth" ) ) ;
if( !iscarrby( 45, mynum ) )chkfight( fpbns( "wraith" ) ) ;
chkfight( fpbns( "bomber" ) ) ;
chkfight( fpbns( "owin" ) ) ;
chkfight( fpbns( "glowin" ) ) ;
chkfight( fpbns( "smythe" ) ) ;
chkfight( fpbns( "dio" ) ) ;
if( !iscarrby( 45, mynum ) ) chkfight( fpbns( "zombie" ) ) ;
chkfight( fpbns( "rat" ) ) ;
chkfight( fpbns( "ghoul" ) ) ;
chkfight( fpbns( "ogre" ) ) ;
chkfight( fpbns( "riatha" ) ) ;
chkfight( fpbns( "yeti" ) ) ;
chkfight( fpbns( "guardian"));
if( iscarrby( 32, mynum ) ) dorune(  ) ;
if(phelping(mynum)!=-1) helpchkr();
    }
*/

const chkfight = (state: State, playerId: number): Promise<void> => {
    if (playerId < 0) {
        /* No such being */
        return Promise.resolve();
    }
    /* Maybe move it */
    consid_move(state, playerId);
    if (!pname(state, playerId)) {
        return Promise.resolve();
    }
    return getPlayer(state, playerId)
        .then((player) => {
            if (player.locationId !== state.curch) {
                return Promise.resolve();
            }
            if (pvis(state, state.mynum)) {
                /* Im invis */
                return Promise.resolve();
            }
            if (randperc(state) > 40) {
                return Promise.resolve();
            }
            return availableByMask(state, { [IS_LIT]: true })
                .then((found) => {
                    if ((player.playerId === fpbns('yeti')) && found) {
                        return;
                    }
                    mhitplayer(state, player.playerId, state.mynum);
                })
        });
};

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
    sillycom( "\001P%s\001\001d sings in Gaelic\n\001" ) ;
    bprintf( "You sing\n" ) ;
    }

 spraycom(  )
    {
    long a, b ;
    long c ;
    char bk[ 128 ] ;
    extern long wordbuf[  ] ;
    extern long mynum ;
    extern long curch ;
    b=vichere( &a ) ;
    if( b== -1 ) return ;
    if( brkword(  )== -1 )
       {
       bprintf( "With what ?\n" ) ;
       return ;
       }
    if( !strcmp( wordbuf, "with" ) )
       {
       if( brkword(  )== -1 )
          {
          bprintf( "With what ?\n" ) ;
          return ;
          }
       }
    c=fobna( wordbuf ) ;
    if( c== -1 )
       {
       bprintf( "With what ?\n" ) ;
       return ;
       }
    switch( c )
       {
       default:
          bprintf( "You can't do that\n" ) ;
          break ;
          }
    return ;
    }

 */

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
                pbfr(state);
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
    return getPlayers(state)
        .then(players => players.filter(player => player.playerId < 32))
        .then(players => players.forEach((player) => {
            if (hitRune) {
                return;
            }
            if (player.playerId === state.mynum) {
                return;
            }
            if (!pname(state, player.playerId)) {
                return;
            }
            if (plev(state, player.playerId) > 9) {
                return;
            }
            if (player.locationId === state.curch) {
                hitRune = true;
                if (randperc(state) < 9 * state.my_lev) {
                    return;
                }
                if (fpbns(state, pname(state, player.playerId)) === -1) {
                    return;
                }
                bprintf(state, 'The runesword twists in your hands lashing out savagely\n');
                hitplayer(state, player.playerId, 32);
                return;
            }
        }))
};

const pepdrop = (state: State): Promise<void> => {
    sendsys(state, null, null, -10000, state.curch, 'You start sneezing ATISCCHHOOOOOO!!!!\n');
    return getPlayer(state, 32)
        .then((dragon) => {
            if (!pname(state, dragon.playerId).length || (dragon.locationId !== state.curch)) {
                return Promise.resolve();
            }
            /* Ok dragon and pepper time */
            return getItem(state, 89)
                .then((pepper) => {
                    if (iscarrby(state, pepper.itemId, state.mynum) && (pepper.heldBy !== undefined)) {
                        /* Fried dragon */
                        setpname(state, dragon.playerId, '');
                        /* No dragon */
                        state.my_sco += 100;
                        calibme(state);
                        return;
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
    return getPlayer(state, fpbns(state, 'dragon'))
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

const helpchkr = (state: State): Promise<void> => getPlayer(state, phelping(state, state.mynum))
    .then((player) => {
        const nhelp = () => {
            bprintf(state, `You can no longer help [c]${pname(state, player.playerId)}[/c]\n`);
            setphelping(state, state.mynum, -1);
        };

        if (!state.i_setup) {
            return;
        }
        if (!pname(state, player.playerId)) {
            return nhelp();
        }
        if (player.locationId !== state.curch) {
            return nhelp();
        }
    });

import {
    bprintf,
    brkword,
    sendsys,
} from './__dummies';
import State from "./state";
import {getItem, holdItem, putItem} from "./support";

/*
#include <stdio.h>
#include "files.h"

extern long curch;
extern long mynum;
extern long my_lev;
extern char globme[];
extern char wordbuf[];
extern char *pname();
extern char *oname();
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

const sumcom = (state: State): void => {
    const sumob = (itemId): void => {
        if (state.my_lev < 10) {
            return bprintf(state, 'You can only summon people\n');
        }
        const item = getItem(state, itemId);
        const locationId = item.heldBy ? ploc(state, item.heldBy) : item.locationId;
        const ms = `[p name=\"${state.globme}\"] has summoned the ${oname(state, item.itemId)}[/p]\n`;
        sendsys(state, state.globme, state.globme, -10000, locationId, ms);
        bprintf(state, `The ${oname(state, item.itemId)} flies into your hand, was `);
        desrm(state, item.locationId, item.carryFlag);
        holdItem(state, item.itemId, state.mynum);
    };

    const willwork = (characterId): void => {
        bprintf(state, 'You cast the summoning......\n');
        if (characterId < 16) {
            return sendsys(state, pname(state, characterId), state.globme, -10020, state.curch, '');
        }
        if ((characterId === 17) || (characterId === 23)) {
            return;
        }
        dumpstuff(state, characterId, ploc(state, characterId));
        const seg = `[s name=\"${pname(state, characterId)}\"]${pname(state, characterId)} has arrived\n[/s]`;
        sendsys(state, null, null, -10000, state.curch, seg);
        setploc(state, state.curch);
    };

    if (brkword(state) === -1) {
        return bprintf(state, 'Summon who ?\n');
    }

    const itemId = fobn(state, state.wordbuf);
    if (itemId !== -1) {
        return sumob(itemId);
    }
    const playerId = fpbn(state, state.wordbuf);
    if (playerId !== -1) {
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
    if (iscarby(state, 111, state.mynum)) {
        c += state.my_lev;
    }
    if (iscarby(state, 121, state.mynum)) {
        c += state.my_lev;
    }
    if (iscarby(state, 163, state.mynum)) {
        c += state.my_lev;
    }
    const d = randperc(state);
    if (state.my_lev > 9) {
        return willwork(playerId);
    }
    if (iswornby(state, 90, playerId) || (c < d)) {
        return bprintf(state, 'The spell fails....\n');
    }
    if ((playerId === fpbn(state, 'wraith')) || iscarrby(state, 32, playerId) || iscarrby(state, 159, playerId) || iscarrby(state, 174, playerId)) {
        return bprintf(state, 'Something stops your summoning from succeeding\n');
    }
    if (playerId === state.mynum) {
        return bprintf(state, 'Seems a waste of effort to me....\n');
    }
    if ((state.curch >= -1082) && (state.curch <= -1076)) {
        return bprintf(state, 'Something about this place makes you fumble the magic\n');
    }
    return willwork(playerId);
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

 goloccom()
    {
    extern long curch,my_lev;
    extern char globme[];
    char n1[128];
    char bf[128];
    extern char mout_ms[],min_ms[];
    extern char wordbuf[];
    long a;
    FILE *b;
    if(my_lev<10)
       {
       bprintf("huh ?\n");
       return;
       }
    if(brkword()== -1)
       {
       bprintf("Go where ?\n");
       return;
       }
    strcpy(n1,wordbuf);
    if(brkword()== -1) strcpy(wordbuf,"");
    a=roomnum(n1,wordbuf);
    if((a>=0)||((b=openroom(a,"r"))==0))
       {
       bprintf("Unknown Room\n");
       return;
       }
    fclose(b);
    sprintf(bf,"\001s%%s\001%%s %s\n\001",mout_ms);
    sillycom(bf);
    curch=a;
    trapch(curch);
    sprintf(bf,"\001s%%s\001%%s %s\n\001",min_ms);
    sillycom(bf);
    }




 wizcom()
    {
    extern long my_lev;
    extern char globme[],wordbuf[];
    extern long curch;
    extern long rd_qd;
    char bf[128];
    if(my_lev<10)
       {
       bprintf("Such advanced conversation is beyond you\n");
       return;
       }
    getreinput(wordbuf);
    sprintf(bf,"\001p%s\001 : %s\n",globme,wordbuf);
    sendsys(globme,globme,-10113,curch,bf);
    rd_qd=1;
    }

 viscom()
    {
    long f;
    extern long my_lev;
    extern long mynum;
    extern char globme[];
    long ar[4];
    if(my_lev<10)
       {
       bprintf("You can't just do that sort of thing at will you know.\n");
       return;
       }
    if(!pvis(mynum))
       {
       bprintf("You already are visible\n");
       return;
       }
    setpvis(mynum,0);
    ar[0]=mynum;
    ar[1]=pvis(mynum);
    sendsys("","",-9900,0,ar);
    bprintf("Ok\n");
    sillycom("\001s%s\001%s suddenely appears in a puff of smoke\n\001");
    }

 inviscom()
    {
    extern long mynum,my_lev;
    extern char globme[];
    extern char wordbuf[];
    long f,x;
    long ar[4];
    if(my_lev<10)
       {
       bprintf("You can't just turn invisible like that!\n");
       return;
       }
    x=10;
    if(my_lev>9999) x=10000;
    if((my_lev==10033)&&(brkword()!=-1)) x=numarg(wordbuf);
    if(pvis(mynum)==x)
       {
       bprintf("You are already invisible\n");
       return;
       }
    setpvis(mynum,x);
    ar[0]=mynum;
    ar[1]=pvis(mynum);
    sendsys("","",-9900,0,ar);
    bprintf("Ok\n");
    sillycom("\001c%s vanishes!\n\001");
    }
*/

const ressurcom = (state: State): void => {
    if (state.my_lev < 10) {
        return bprintf(state, 'Huh ?\n')
    }
    if (brkword(state) === -1) {
        return bprintf(state, 'Yes but what ?\n')
    }
    const itemId = fobn(state, state.wordbuf);
    const item = getItem(state, itemId);
    if (item.itemId === -1) {
        return bprintf(state, 'You can only ressurect objects\n')
    }
    if (ospare(state, item.itemId) !== -1) {
        return bprintf(state, 'That already exists\n')
    }
    ocreate(state, item.itemId);
    putItem(state, item.itemId, state.curch);
    const bf = `The ${oname(state, item.itemId)} suddenly appears\n`;
    sendsys(state, null, null, -10000, state.curch, bf);
};

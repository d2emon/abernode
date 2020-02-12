import {
    bprintf,
    brkword,
    desrm,
    sendsys,
} from './__dummies';
import State from "./state";
import {getItem, holdItem} from "./support";
import { EXAMINES } from "./files";

/*
#include <stdio.h>
#include "files.h"
extern FILE * openlock();
extern FILE * openuaf();
extern FILE * openroom();
extern char *oname();
extern char *pname();
extern char globme[];
extern char wordbuf[];
extern long mynum;
extern long curch;
extern long my_lev;
long getnarg();



helpcom()
    {
extern char wordbuf[];
extern long curch,mynum;
extern char globme[];
extern long my_lev;
long a;
char b[128];
if(brkword()!= -1)
{
	a=fpbn(wordbuf);
	if(a== -1)
	{
		bprintf("Help who ?\n");
		return;
	}
	if((ploc(a)!=curch))
	{
		bprintf("They are not here\n");
		return;
	}
	if(a==mynum)
	{
		bprintf("You can't help yourself.\n");
		return;
	}
	if(phelping(mynum)!=-1)
	{
		sprintf(b,"\001c%s\001 has stopped helping you\n",globme);
		sendsys(pname(a),pname(a),-10011,curch,b);
		bprintf("Stopped helping %s\n",pname(phelping(mynum)));
	}
	setphelping(mynum,a);
	sprintf(b,"\001c%s\001 has offered to help you\n",globme);
	sendsys(pname(a),pname(a),-10011,curch,b);
	bprintf("OK...\n");
	return;
    }
    closeworld();
    bprintf("\001f%s\001",HELP1);
    if(my_lev>9)
       {
       bprintf("Hit <Return> For More....\n");
       pbfr();
       while(getchar()!='\n');
       bprintf("\001f%s\001",HELP2);
       }
    bprintf("\n");
    if(my_lev>9999)
       {
       bprintf("Hit <Return> For More....\n");
       pbfr();
       while(getchar()!='\n');
       bprintf("\001f%s\001",HELP3);
       }
    bprintf("\n");
    }

 levcom()
    {
    closeworld();
    bprintf("\001f%s\001",LEVELS);
    }

 valuecom()
    {
    long a,b;
    extern char wordbuf[];
    extern long mynum;
    if(brkword()== -1)
       {
       bprintf("Value what ?\n");
       return;
       }
    b=fobna(wordbuf);
    if(b== -1)
       {
       bprintf("There isn't one of those here.\n");
       return;
       }
    bprintf("%s : %d points\n",wordbuf,(tscale()*(obaseval(b)))/5);
    return;
    }
*/

const stacom = (state: State): void => {
    if (brkword(state) == -1) {
        return bprintf(state, 'STATS what ?\n');
    }
    if (state.my_lev < 10) {
        return bprintf(state, 'Sorry, this is a wizard command buster...\n');
    }

    const item = getItem(state, fobn(state, state.wordbuf));
    if (item.itemId === -1) {
        return statplyr(state);
    }

    bprintf(state, `\nItem        :${oname(state, item.itemId)}`);
    if (item.containedIn !== undefined) {
        bprintf(state, `\nContained in:${oname(state, item.containedIn)}`);
    } else if (item.heldBy !== undefined) {
        bprintf(state, `\nHeld By     :${pname(state, item.heldBy)}`);
    } else {
        bprintf(state, '\nPosition    :');
        showname(state, item.locationId);
    }

    bprintf(state, `\nState       :${__state(state, item.itemId)}`);
    bprintf(state, `\nCarr_Flag   :${item.carryFlag}`);
    bprintf(state, `\nSpare       :${ospare(state, item.itemId)}`);
    bprintf(state, `\nMax State   :${omaxstate(state, item.itemId)}`);
    bprintf(state, `\nBase Value  :${obaseval(state, item.itemId)}`);
    bprintf(state, '\n');
};

const examcom = (state: State): void => {
    if (brkword(state) == -1) {
        return bprintf(state, 'Examine what ?\n');
    }
    const itemId = fobna(state.wordbuf);
    const item = getItem(state, itemId);
    if (item.itemId === -1) {
        return bprintf(state, 'You see nothing special at all\n');
    }
    if (item.itemId === 144) {
        if (obyte(state, item.itemId, 0) == 0) {
            osetbyte(state, item.itemId, 0, 1);
            bprintf(state, 'You take a scroll from the tube.\n');
            ocreate(state, 145);
            holdItem(state, 145, state.mynum);
            return;
        }
    } else if (item.itemId === 145) {
        state.curch = -114;
        bprintf(state, 'As you read the scroll you are teleported!\n');
        destroy(state, item.itemId);
        trapch(state, state.curch);
        return;
    } else if (item.itemId === 101) {
        if (obyte(state, item.itemId, 0) == 0) {
            bprintf(state, 'You take a key from one pocket\n');
            osetbyte(state, item.itemId, 0, 1);
            oclrbit(state, 107, 0);
            holdItem(state, 107, state.mynum);
            return;
        }
    } else if (item.itemId === 7) {
        setstate(state, item.itemId, randperc(state) % 3 + 1)
        if (__state(state, item.itemId) === 1) {
            bprintf(state, 'It glows red');
        } else if (__state(state, item.itemId) === 2) {
            bprintf(state, 'It glows blue');
        } else if (__state(state, item.itemId) === 3) {
            bprintf(state, 'It glows green');
        }
        bprintf(state, '\n');
        return;
    } else if (item.itemId === 8) {
        if (__state(state, 7) !== 0) {
            if (iscarrby(state, 3 + __state(state, 7), state.mynum) && otstbit(state, 3 + __state(state, 7), 13)) {
                bprintf(state, 'Everything shimmers and then solidifies into a different view!\n');
                destroy(state, item.itemId);
                teletrap(state, -1074);
                return;
            }
        }
    } else if (item.itemId === 85) {
        if (!obyte(state, 83, 0)) {
            bprintf(state, 'Aha. under the bed you find a loaf and a rabbit pie\n');
            ocreate(state, 83);
            ocreate(state, 84);
            osetbyte(state, 83, 0, 1);
            return;
        }
    } else if (item.itemId === 91) {
        if (!obyte(state, 90, 0)) {
            ocreate(state, 90);
            bprintf(state, 'You pull an amulet from the bedding\n');
            osetbyte(state, 90, 0, 1);
            return;
        }
    }

    const r = `${EXAMINES}${item.itemId}`;
    const x = fopen(r, 'r');
    if (x === null) {
        return bprintf(state, 'You see nothing special.\n');
    }
    while (getstr(x, r)) {
        bprintf(state, `${r}\n`);
    }
    fclose(x);
};

/*
 statplyr()
 {
 extern char wordbuf[];
 long a,b;
 b=fpbn(wordbuf);
 if(b== -1)
 {
 bprintf("Whats that ?\n");
 return;
 }
 bprintf("Name      : %s\n",pname(b));
 bprintf("Level     : %d\n",plev(b));
 bprintf("Strength  : %d\n",pstr(b));
 bprintf("Sex       : %s\n",(psex(b)==0)?"MALE":"FEMALE");
 bprintf("Location  : ");
 showname(ploc(b));
 }
 wizlist()
 {
 extern long my_lev;
 if(my_lev<10)
 {
 bprintf("Huh ?\n");
 return;
 }
 closeworld();
 bprintf("\001f%s\001",WIZLIST);
 }

 incom()
 {
 extern long my_lev,curch;
 extern char wordbuf[];
 char st[80],rn[80],rv[80];
 long ex_bk[7];
 extern long ex_dat[];
 long a;
 long x;
 long y;
 FILE *unit;
 a=0;
 if(my_lev<10){bprintf("Huh\n");return;}
 while(a<7)
 {
 ex_bk[a]=ex_dat[a];
 a++;
 }
 if(brkword()== -1)
 {
 bprintf("In where ?\n");
 return;
 }
 strcpy(rn,wordbuf);
 if(brkword()== -1)
 {
 bprintf("In where ?\n");
 return;
 }
 strcpy(rv,wordbuf);
 x=roomnum(rn,rv);
 if(x==0)
 {
 bprintf("Where is that ?\n");
 return;
 }
 getreinput(st);
 y=curch;
 curch=x;
 closeworld();
 unit=openroom(curch,"r");
if(unit==NULL){curch=y;bprintf("No such room\n");return;}
 lodex(unit);
 fclose(unit);
 openworld();
 gamecom(st);
 openworld();
 if(curch==x)
 {
 a=0;
 while(a<7) {ex_dat[a]=ex_bk[a];a++;}
 }
 curch=y;
 }
 smokecom()
 {
 lightcom();
 }

 jumpcom()
 {
 long a,b;
 extern long jumtb[],mynum,curch;
 extern long my_lev;
 char ms[128];
 extern char globme[];
 a=0;
 b=0;
 while(jumtb[a])
 {
 if(jumtb[a]==curch){b=jumtb[a+1];break;}
 a+=2;
 }
 if(b==0){bprintf("Wheeeeee....\n");
 return;}
 if((my_lev<10)&&((!iscarrby(1,mynum))||(state(1)==0)))
 {
 	curch=b;
 bprintf("Wheeeeeeeeeeeeeeeee  <<<<SPLAT>>>>\n");
 bprintf("You seem to be splattered all over the place\n");
 loseme();
 crapup("I suppose you could be scraped up - with a spatula");
 }
 sprintf(ms,"\001s%s\001%s has just left\n\001",globme,globme);
 sendsys(globme,globme,-10000,curch,ms);
 curch=b;
 sprintf(ms,"\001s%s\001%s has just dropped in\n\001",globme,globme);
 sendsys(globme,globme,-10000,curch,ms);
 trapch(b);
 }

long jumtb[]={-643,-633,-1050,-662,-1082,-1053,0,0};

*/

const wherecom = (state: State): void => {
    if (state.my_str < 10) {
        return bprintf(state, 'You are too weak\n');
    }
    if (state.my_lev < 10) {
        state.my_str -= 2;
    }

    const rnd: number = randperc(state);
    let cha = 10 * state.my_lev;
    if (iscarrby(state, 111, state.mynum) || iscarrby(state, 121, state.mynum) || iscarrby(state, 163, state.mynum)) {
        cha = 100;
    }
    closeworld(state);
    if (rnd > cha) {
        return bprintf(state, 'Your spell fails...\n');
    }

    if (brkword(state) === -1) {
        return bprintf(state, 'What is that ?\n');
    }

    let found = false;
    for(let itemId=0; itemId < state.numobs; itemId += 1) {
        const item = getItem(state, itemId);
        if (oname(state, item.itemId) === state.wordbuf) {
            found = true;
            if (state.my_lev > 9999) {
                bprintf(state, `[${item.itemId}]`);
            }
            bprintf(state, `${oname(state, item.itemId)} - `);
            if ((state.my_lev < 10) && (ospare(state, item.itemId) === -1)) {
                bprintf(state, 'Nowhere\n');
            } else {
                desrm(state, item.locationId, item.carryFlag);
            }
        }
    }

    const playerId: number = fpbn(state.wordbuf);
    if (playerId !== -1) {
        found = true;
        bprintf(state, `${pname(state, playerId)} - `);
        desrm(state, ploc(state, playerId),0);
    }
    if (!found) {
        return bprintf(state, 'I dont know what that is\n');
    }
};

/*
 desrm(loc,cf)
 {
 extern long my_lev;
 FILE *a;
 FILE *unit;
 long b;
 long x[32];
 if((my_lev<10)&&(cf==0)&&(loc>-5))
 {
 bprintf("Somewhere.....\n");
 return;
 }
if(cf==3){
bprintf("In the %s\n",oname(loc));
return;
}
 if(cf>0)
 {
 bprintf("Carried by \001c%s\001\n",pname(loc));
 return;
 }
 unit=openroom(loc,"r");
 if(unit==NULL)
 {
 bprintf("Out in the void\n");
 return;
 }
 b=0;
 while(b++<7) getstr(unit,x);
 bprintf("%-36s",x);
if(my_lev>9){bprintf(" | ");showname(loc);;}
else bprintf("\n");
 fclose(unit);
 }



edit_world()
{
	extern long my_lev,numobs;
	extern char wordbuf[];
	extern long ublock[];
	extern long objinfo[];
	char a[80],b,c,d;
	extern long genarg();
	extern long mynum;
	if(!ptstbit(mynum,5))
	{
		bprintf("Must be Game Administrator\n");
		return;
	}
	if(brkword()==-1)
	{
		bprintf("Must Specify Player or Object\n");
		return;
	}
	if(!strcmp(wordbuf,"player")) goto e_player;
	if(strcmp(wordbuf,"object"))
	{
		bprintf("Must specify Player or Object\n");
		return;
	}
	b=getnarg(0,numobs-1);
	if(b==-1) return;
	c=getnarg(0,3);
	if(c==-1) return;
	d=getnarg(0,0);
	if(d==-1) return;
	objinfo[4*b+c]=d;
        bprintf("Tis done\n");
        return;
e_player:b=getnarg(0,47);
	if(b==-1) return;
	c=getnarg(0,15);
	if(c==-1) return;
	d=getnarg(0,0);
	if(d==-1) return;
	ublock[16*b+c]=d;
        bprintf("Tis done\n");
        return;
}

long getnarg(bt,to)
long bt,to;
{
	extern char wordbuf[];
	long x;
	if(brkword()==-1)
	{
		bprintf("Missing numeric argument\n");
		return(-1);
	}
	x=numarg(wordbuf);
	if(x<bt) {bprintf("Invalid range\n");return(-1);}
	if((to)&&(x>to)) {bprintf("Invalid range\n");return(-1);}
	return(x);
}
 */
import State from "./state";
import {createItem, getItem, getItems, holdItem, itemIsAvailable, putItem} from "./support";
import {bprintf, brkword, sendsys} from "./__dummies";

/*

 Object structure

 Name,
 Long Text 1
 Long Text 2
 Long Text 3
 Long Text 4
 statusmax
 Value
 flags (0=Normal 1+flannel)

 */

/*
#define OBMUL 8

extern FILE *openlock();
extern FILE *openworld();
extern char * pname();

 inventory()
    {
    extern long mynum;
   bprintf("You are carrying\n");
    lobjsat(mynum);
    }
*/
 /*
 Objinfo

 Loc
 Status
 Stamina
 Flag 1=carr 0=here
 */
/*
lobjsat(loc)
{
aobjsat(loc,1);
}
*/

const aobjsat = (state: State, locationId: number, mode: number): Promise<void> => {
    /* Carried Loc ! */
    let d = 0;
    let e = 0;
    let f = 0;
    return getItems(state)
        .then(items => items.forEach((item) => {
            if ((iscarrby(state, item.itemId, locationId) && (mode === 1)) || (iscontin(state, item.itemId, locationId) && (mode === 3))) {
                let x = '';
                e = 1;
                f += 1 + item.name.length;
                if (state.debug_mode) {
                    f += 5;
                    x = `${item.itemId}`;
                }
                if (item.isDestroyed) {
                    f += 2;
                }
                if (iswornby(state, item.itemId, locationId)) {
                    f += '<worn> '.length;
                }
                if (f > 79) {
                    f = 0;
                    bprintf(state, '\n');
                }

                if (item.isDestroyed) {
                    bprintf(state, '(');
                }
                bprintf(state, item.name);
                if (state.debug_mode) {
                    bprintf(state, x);
                }
                if (iswornby(state, item.itemId, locationId)) {
                    bprintf(state, ' <worn>');
                }
                if (item.isDestroyed) {
                    bprintf(state, ')');
                }
                bprintf(state, ' ');
                f += 1;
            }
            d += 4;
        }))
        .then(() => {
            if (!e) {
                bprintf(state, 'Nothing');
            }
            bprintf(state, '\n');
        });
};

const iscontin = (state: State, itemId1: number, itemId2: number): Promise<boolean> => getItem(state, itemId1)
    .then((item1) => {
        if (item1.containedIn === undefined) {
            return false;
        }
        if (item1.locationId !== itemId2) {
            return false;
        }
        if ((state.my_lev < 10) && iddest(state, itemId1)) {
            return false;
        }
        return true;
    });

const fobnsys = (state: State, name: string, control: number, ctInf: number): Promise<number> => {
    const l1 = name.toLowerCase();
    const a = 0;
    if (l1 === 'red') {
        brkword(state);
        return Promise.resolve(4);
    } else if (l1 === 'blue') {
        brkword(state);
        return Promise.resolve(5);
    } else if (l1 === 'green') {
        brkword(state);
        return Promise.resolve(6);
    }

    let found = undefined;
    return getItems(state)
        .then(items => items.forEach((item) => {
            if (found !== undefined) return;
            const l2 = item.name.toLowerCase();
            if (l1 === l2) {
                state.wd_it = name;
                if (control === 0) {
                    found = item.itemId;
                } else if (control === 1) {
                    /* Patch for shields */
                    if ((item.itemId === 112) && iscarrby(state, 113, state.mynum)) {
                        found = 113;
                    } else if ((item.itemId === 112) && iscarrby(state, 114, state.mynum)) {
                        found = 114;
                    } else if (itemIsAvailable(state, item)) {
                        found = item.itemId
                    }
                } else if (control === 2) {
                    if (iscarrby(state, item.itemId, state.mynum)) {
                        found = item.itemId;
                    }
                } else if (control === 3) {
                    if (iscarrby(state, item.itemId, ctInf)) {
                        found = item.itemId;
                    }
                } else if (control === 4) {
                    if (ishere(state, item.itemId)) {
                        found = item.itemId;
                    }
                } else if (control === 5) {
                    if (iscontin(state, item.itemId, ctInf)) {
                        found = item.itemId;
                    }
                } else {
                    found = item.itemId;
                }
            }
        }))
        .then(() => (found === undefined) ? -1 : found);
};

/*
 fobn(word)
 char *word;
    {
long x;
x=fobna(word);
if(x!=-1) return(x);
    return(fobnsys(word,0,0));
    }

 fobna(word)
 char *word;
    {
    return(fobnsys(word,1,0));
    }

 fobnin(word,ct)
 char *word;
 long ct;
 {
 	return(fobnsys(word,5,ct));
 }

 fobnc(word)
 char *word;
    {
    return(fobnsys(word,2,0));
    }

 fobncb(word,by)
 char *word;
    {
    return(fobnsys(word,3,by));
    }

 fobnh(word)
 char *word;
    {
    return(fobnsys(word,4,0));
    }
*/

const getobj = (state: State): Promise<void> => {
    let des_inf: number = -1;

    if (brkword(state) === -1) {
        bprintf(state, 'Get what ?\n');
        return Promise.resolve();
    }
    return getItem(state, fobnh(state, state.wordbuf))
        .then((item) => {
            /* Hold */
            const i = state.stp;
            const bf = state.wordbuf;
            if ((brkword(state) !== -1) && ((state.wordbuf === 'from') || (state.wordbuf === 'out'))) {
                if (brkword(state) === -1) {
                    return bprintf(state, 'From what ?\n')
                }
                des_inf = fobna(state, state.wordbuf);
                if (des_inf === -1) {
                    return bprintf(state, 'You can\'t take things from that - it\'s not here\n');
                }
                state.stp = i;
                return getItem(state, fobnin(state, bf, des_inf));
            }
            state.stp = i;
            return item;
        })
        .then((item) => {
            if (item.itemId === -1) {
                return bprintf(state, 'That is not here.\n');
            }

            if ((item.itemId === 112) && (des_inf === -1)) {
                return Promise.all([
                    getItem(state, 113),
                    getItem(state, 114),
                ])
                    .then(([shield1, shield2]) => {
                        if (shield1.isDestroyed) {
                            return shield1;
                        } else if (shield2.isDestroyed) {
                            return shield2;
                        } else {
                            return undefined;
                        }
                    })
                    .then((shield) => {
                        if (shield !== undefined) {
                            createItem(state, shield.itemId)
                                .then((created) => {
                                    item = created;
                                });
                        } else {
                            return bprintf(state, 'The shields are all to firmly secured to the walls\n');
                        }
                    })
            }

            if (item.flannel) {
                return bprintf(state, 'You can\'t take that!\n');
            }
            if (dragget(state)) {
                return;
            }
            if (!cancarry(state, state.mynum)) {
                return bprintf(state, 'You can\'t carry any more\n');
            }
            if ((item.itemId === 32) && (__state(state, item.itemId) === 1) && (ptothlp(state, state.mynum)) === -1) {
                return bprintf(state, 'Its too well embedded to shift alone.\n');
            }
            holdItem(state, item.itemId, state.mynum);
            const bf2 = `[D]${state.globme}[/D][c] takes the ${item.name}\n[/c]`;
            bprintf(state, 'Ok...\n');
            sendsys(state, state.globme, state.globme, -10000, state.curch, bf2);
            if (item.changeStateOnTake) {
                setstate(state, item.itemId, 0);
            }
            if (state.curch === -1081) {
                setstate(state, 20, 1);
                bprintf(state, 'The door clicks shut....\n');
            }
        });
};

const ishere = (state: State, itemId: number): Promise<boolean> => getItem(state, itemId)
    .then((item) => {
        if ((state.my_lev < 10) && item.isDestroyed) {
            return false;
        }
        if (item.locatedIn !== undefined) {
            return false
        }
        if (item.locationId !== state.curch) {
            return false;
        }
        return true;
    });

const iscarrby = (state: State, itemId: number, characterId: number): Promise<boolean> => getItem(state, itemId)
    .then((item) => {
        if ((state.my_lev < 10) && iddest(state, item.itemId)) {
            return false;
        }
        if (item.locatedIn === undefined && item.heldBy === undefined) {
            return false
        }
        if (item.locationId !== characterId) {
            return false;
        }
        return true;
    });

const dropitem = (state: State): Promise<void> => {
    if (brkword(state) === -1) {
        bprintf(state, 'Drop what ?\n');
        return Promise.resolve();
    }
    return getItem(state, fobnc(state, state.wordbuf))
        .then((item) => {
            if (item.itemId === -1) {
                return bprintf(state, 'You are not carrying that.\n');
            }

            if ((state.my_lev < 10) && (item.itemId === 32)) {
                return bprintf(state, 'You can\'t let go of it!\n');
            }
            return putItem(state, item.itemId, state.curch)
                .then(() => {
                    bprintf(state, 'OK..\n');
                    const bf = `[D]${state.globme}[/D][c] drops the ${state.wordbuf}.\n\n[/c]`;
                    sendsys(state, state.globme, state.globme, -10000, state.curch, bf);
                    if ((state.curch !== -183) && (state.curch !== -183)) {
                        return;
                    }
                    const bf2 = `The ${state.wordbuf} disappears into the bottomless pit.\n`;
                    bprintf(state, 'It disappears down into the bottomless pit.....\n');
                    sendsys(state, state.globme, state.globme, -10000, state.curch, bf2);
                    state.my_sco += item.value;
                    calibme(state);
                    return putItem(state, item.itemId, -6);
                });
        });
};

/*
 lisobs()
    {
    lojal2(1);
    showwthr();
    lojal2(0);
    }
*/

const lojal2 = (state: State, flannel: boolean): Promise<void> => getItems(state)
    .then(items => items.forEach((item) => {
        if (ishere(state, item.itemId) && (item.flannel === flannel)) {
            if (__state(state, item.itemId) > 3) {
                return;
            }
            if (item.description) {
                /*OLONGT NOTE TO BE ADDED */
                if (item.isDestroyed) {
                    bprintf(state, '--');
                }
                oplong(state, item.itemId);
                state.wd_it = item.name;
            }
        }
    }));

/*
 dumpitems()
    {
    extern long mynum;
    extern long curch;
    dumpstuff(mynum,curch);
    }
*/

const dumpstuff = (state: State, playerId: number, locationId: number): Promise<void> => getItems(state)
    .then(items => items.forEach((item) => {
        if (iscarrby(state, item.itemId, playerId)) {
            return putItem(state, item.itemId, locationId);
        }
    }));

/*
long ublock[16*49];


 whocom()
    {
    long a;
    extern long my_lev;
    long bas;
    a=0;
    bas=16;
    if(my_lev>9)
       {
      bprintf("Players\n");
       bas=48;
       }
    while(a<bas)
       {
       if(a==16)bprintf("----------\nMobiles\n");
       if(!strlen(pname(a))) goto npas;
       dispuser(a);
       npas:a++;
       }
   bprintf("\n");
    }

 dispuser(ubase)
    {
extern long my_lev;
    if(pstr(ubase)<0) return; *//* On  Non game mode *//*
    if(pvis(ubase)>my_lev) return;
if(pvis(ubase)) bprintf("(");
   bprintf("%s ",pname(ubase));
    disl4(plev(ubase),psex(ubase));
if(pvis(ubase)) bprintf(")");
if(ppos(ubase)==-2) bprintf(" [Absent From Reality]");
bprintf("\n");
    }

 disle3(n,s)
    {
    disl4(n,s);
   bprintf("\n");
    }
 disl4(n,s)
    {
    extern long hasfarted;
    switch(n)
       {
       case 1:
         bprintf("The Novice");
          break;
       case 2:
          if(!s)bprintf("The Adventurer");
          else
            bprintf("The Adventuress");
          break;
       case 3:
         bprintf("The Hero");
          if(s)bprintf("ine");
          break;
       case 4:
         bprintf("The Champion");
          break;
       case 5:
          if(!s)bprintf("The Conjurer");
          else
            bprintf("The Conjuress");
          break;
       case 6:
         bprintf("The Magician");
          break;
       case 7:
          if(s)bprintf("The Enchantress");
          else
            bprintf("The Enchanter");
          break;
       case 8:
          if(s)bprintf("The Sorceress");
          else
            bprintf("The Sorceror");
          break;
case 9:bprintf("The Warlock");
break;
       case 10:
          if(s)bprintf("The Apprentice Witch");
          else
            bprintf("The Apprentice Wizard");
          break;
case 11:bprintf("The 370");
break;
case 12:bprintf("The Hilbert-Space");
break;
case 14:bprintf("The Completely Normal Naughty Spud");
break;
case 15:bprintf("The Wimbledon Weirdo");
break;
case 16:bprintf("The DangerMouse");
break;
case 17:bprintf("The Charred Wi");
if(s) bprintf("tch");
else bprintf("zard");
break;
case 18:bprintf("The Cuddly Toy");
break;
case 19:if(!hasfarted) bprintf("Of The Opera");
else bprintf("Raspberry Blower Of Old London Town");
break;
case 20:bprintf("The 50Hz E.R.C.S");
break;
case 21:bprintf("who couldn't decide what to call himself");
break;
case 22:bprintf("The Summoner");
break;
case 10000:
bprintf("The 159 IQ Mega-Creator");
break;
case 10033:
case 10001:bprintf("The Arch-Wi");
if(s)bprintf("tch");
else bprintf("zard");
break;
case 10002:bprintf("The Wet Kipper");
break;
case 10003:bprintf("The Thingummy");
break;
case 68000:
bprintf("The Wanderer");
break;
case -2:
bprintf("\010");
break;
case -11:bprintf("The Broke Dwarf");break;
case -12:bprintf("The Radioactive Dwarf");break;
case -10:bprintf("The Heavy-Fan Dwarf");break;
case -13:bprintf("The Upper Class Dwarven Smith");break;
case -14:bprintf("The Singing Dwarf");break;
case -30:bprintf("The Sorceror");break;
case -31:bprintf("the Acolyte");break;
       default:
         bprintf("The Cardboard Box");
          break;
          }
    }
fpbn(name)
char *name;
{
long s;
extern char wd_them[],wd_him[],wd_her[],wd_it[];
s=fpbns(name);
if(s==-1) return(s);
if(!seeplayer(s)) return(-1);
return(s);
}

 fpbns(name)
 char *name;
    {
    char *n1[40],n2[40];
    long a;
    a=0;
    while(a<48)
       {
       strcpy(n1,name);strcpy(n2,pname(a));
       lowercase(n1);lowercase(n2);
if((!!strlen(n2))&&(!strcmp(n1,n2))) return(a);
       if(strncmp(n2,"the ",4)==0)
       if((!!strlen(n2))&&(!strcmp(n1,n2+4)))return(a);
       a++;
       }
    return(-1);
    }
 lispeople()
    {
    extern long debug_mode;
    extern long curch;
    extern long mynum;
    extern char wd_him[],wd_her[];
    long a,b;
    b=0;
    a=0;
    while(a<48)
       {
       if(a==mynum)
          {
          a++;
          continue;
          }
       if((!!strlen(pname(a)))&&(ploc(a)==curch)&&(seeplayer(a)))
          {
          b=1;
         bprintf("%s ",pname(a));
         if(debug_mode) bprintf("{%d}",a);
          disl4(plev(a),psex(a));
          if(psex(a)) strcpy(wd_her,pname(a));
          else strcpy(wd_him,pname(a));
         bprintf(" is here carrying\n");
          lobjsat(a);
          }
       a++;
       }
    }

usercom()
{
extern long my_lev;
long a;
a=my_lev;
my_lev=0;
whocom();
my_lev=a;
}
 */

const oplong = (state: State, itemId: number): Promise<void> => getItem(state, itemId)
    .then((item) => {
        if (state.debug_mode) {
            return bprintf(state, `{${item.itemId}} ${item.description}\n`);
        }
        if (item.description) {
            return bprintf(state, `${item.description}\n`);
        }
    });

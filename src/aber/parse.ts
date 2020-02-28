import State from "./state";
import {createItem, getItem, getItems, getPlayer, getTitle, holdItem, putItem, setItem, setPlayer} from "./support";
import {bprintf, brkword, sendsys} from "./__dummies";
import {CREDITS, GWIZ, logger, RESET_DATA, ROOMS} from "./files";
import {CONTAINED_IN, IS_DESTROYED} from "./object";
import {
    isCarriedBy,
    isAvailable,
    findAvailableItem,
    findCarriedItem,
    findItem,
    dropItems,
    dropMyItems,
    findVisiblePlayer, findPlayer
} from "./objsys";
import {hitPlayer} from "./blood";
import {receiveDamage} from './blood/events';
import {
    sendName,
    sendPlayerForVisible,
    sendSound,
    sendSoundPlayer,
    sendVisibleName,
    sendVisiblePlayer,
    showFile
} from "./bprintf";
import {showMessages} from "./bprintf/output";
import {endGame} from "./gamego/endGame";
import {checkRoll, roll} from "./magic";
import {getAvailableItem, isWornBy, sendBotDamage, teleport} from "./new1";
import {checkCrippled, checkDumb, clearForce, getDumb, getForce} from "./new1/reducer";
import {newReceive, sendShout, sendWizards} from "./new1/events";
import {resetPlayers} from "./new1/bots";

const debug2 = (state: State): Promise<void> => Promise.resolve(bprintf(state, 'No debugger available\n'));

const checkForce = (state: State): void => {
    const force = getForce(state);
    state.isforce = true;
    if (force) {
        gamecom(state, force);
    }
    state.isforce = false;
    clearForce(state);
};

const onFlee = (state: State): Promise<void> => Promise.all([
    getPlayer(state, state.mynum),
    getItems(state),
])
    .then(([
        player,
        items,
    ]) => items.forEach((item) => isCarriedBy(item, player, (state.my_lev < 10)) && !isWornBy(state, item, player) && putItem(state, item.itemId, item.locationId)))
    .then(() => undefined);

/*
#include "files.h"
*/
 /*

 globme holds global me data

 */
/*
#define  OBMUL 8
#include <stdio.h>

extern FILE *openlock();

*/
/*

 Objects held in format

 [Short Text]
 [4 Long texts]
 [Max State]

 */

 /*

 Objects in text file in form

 Stam:state:loc:flag

 */

 /*
long debug_mode=0;

void sendsys(to,from,codeword,chan,text)
char *to,*from;
long codeword,chan;
char *text;
    {
    long  block[128];
    long *i;
    i=(long *)text;
    block[1]=codeword;
    block[0]=chan;
    sprintf((char *)(block+2),"%s%s%s%s",to,".",from,".");
    if((codeword!= -9900)&&(codeword!= -10021)) strcpy((char *)(block+64),text);
    else
       {
       block[64]=i[0];
       block[65]=i[1];
       block[66]=i[2];
       }
    send2(block);
    }

char  strbuf[128];
char  wordbuf[128]="";
char  wd_it[64]="";
char  wd_him[16]="";
char  wd_her[16]="";
char  wd_them[16]="";
char  wd_there[128]="";
long  stp;

void pncom()
{
	extern long my_lev;
	extern char globme[];
	bprintf("Current pronouns are:\n");
	bprintf("Me              : %s\n",globme);
	bprintf("Myself          : %s\n",globme);
	bprintf("It              : %s\n",wd_it);
	bprintf("Him             : %s\n",wd_him);
	bprintf("Her             : %s\n",wd_her);
	bprintf("Them            : %s\n",wd_them);
	if(my_lev>9)
	{
		bprintf("There           : %s\n",wd_there);
	}
}

int gamecom(str)
char *str;
    {
    long  a;
    extern long in_fight;
    extern long stp;
    extern char strbuf[];
    if(strcmp(str,"!")) strcpy(strbuf,str);
    if(!strcmp(str,".q")) strcpy(str,"");  *//* Otherwise drops out after command *//*
    stp=0;
    if(!strlen(str)) return(0);
    if(!strcmp(str,"!")) strcpy(str,strbuf);
    if(brkword()== -1)
       {
       bprintf("Pardon ?\n");
       return(-1);
       }
    if((a=chkverb())== -1)
       {
       bprintf("I don't know that verb\n");
       return(-1);
       }
    doaction(a);
    return(0);
    }

int brkword()
    {
    extern char wd_it[],wd_them[],wd_her[],wd_him[],globme[];
    extern long stp;
    extern char strbuf[],wordbuf[];
    int  worp;
    x1:worp=0;
    while(strbuf[stp]==' ') stp++;
    while((strbuf[stp])&&(strbuf[stp]!=' '))
       {
       wordbuf[worp++]=strbuf[stp++];
       }
    wordbuf[worp]=0;
    lowercase(wordbuf);
    if(!strcmp(wordbuf,"it"))strcpy(wordbuf,wd_it);
    if(!strcmp(wordbuf,"them"))strcpy(wordbuf,wd_them);
    if(!strcmp(wordbuf,"him"))strcpy(wordbuf,wd_him);
    if(!strcmp(wordbuf,"her"))strcpy(wordbuf,wd_her);
    if(!strcmp(wordbuf,"me")) strcpy(wordbuf,globme);
    if(!strcmp(wordbuf,"myself")) strcpy(wordbuf,globme);
    if(!strcmp(wordbuf,"there")) strcpy(wordbuf,wd_there);
    if(worp)return(0);
    else
       return(-1);
    }


chklist(word,lista,listb)
char *word;
char *lista[];
int listb[];
    {
    long  a,b,c,d;
    a=0;
    b=0;
    c=0;
    d= -1;
    lowercase(word);
    while(lista[a])
       {
       b=Match(word,lista[a]);
       if (b>c) { c=b; d=listb[a]; }
       a++;
       }
    if(c<5) return(-1); *//* No good matches *//*
    return(d);
    }

int Match(x,y)
char *x,*y;
    {
    long  c,n;
    c=0; n=0;
    if (!strcmp(x,y)) return(10000);
    if(!strcmp(y,"reset")) return(-1);
    if (*x==0) return(0);
    while((x[n]!=0)&&(y[n]!=0))
       {
       if (x[n]==y[n])
          {
          if(n==0) c+=2;
          if(n==1) c++;
          c++;
          }
       n++;
       }
    return(c);
    }

 chkverb()
    {
    extern char wordbuf[],*verbtxt[];
    extern int verbnum[];
    return(chklist(wordbuf,verbtxt,verbnum));
    }

char *verbtxt[]={"go","climb","n","e","s","w","u","d",
    "north","east","south","west","up","down",
    "quit",
    "get","take","drop","look","i","inv","inventory","who",
    "reset","zap","eat","drink","play",
    "shout","say","tell","save","score"
    ,"exorcise","give","steal","pinch","levels","help","value"
    ,"stats","examine","read","delete","pass","password",
    "summon","weapon","shoot","kill","hit","fire","launch","smash","break",
    "laugh","cry","burp","fart","hiccup","grin","smile","wink","snigger"
    ,"pose","set","pray","storm","rain","sun","snow","goto",
    "wear","remove","put","wave","blizzard","open","close",
    "shut","lock","unlock","force","light","extinguish","where","turn",
    "invisible","visible","pull","press","push","cripple","cure","dumb",
    "change","missile","shock","fireball","translocate","blow",
    "sigh","kiss","hug","slap","tickle","scream","bounce","wiz"
    ,"stare","exits","crash","sing","grope","spray"
    ,"groan","moan","directory","yawn","wizlist","in","smoke"
    ,"deafen","resurrect","log","tss","rmedit","loc","squeeze","users"
    ,"honeyboard","inumber","update","become","systat","converse"
    ,"snoop","shell","raw","purr","cuddle","sulk","roll","credits"
    ,"brief","debug","jump","wield","map","flee","bug","typo","pn"
    ,"blind","patch","debugmode","pflags","frobnicate","strike"
    ,"setin","setout","setmin","setmout","emote","dig","empty"
    ,0 };
int verbnum[]={1,1,2,3,4,5,6,7,2,3,4,5,6,7,8,9,9,10,11,12,12,12,13,14
    ,15,16,16,17,18,19,20,21,22,23,24,25,25,26,27,28,29,30,30,31,32,32,33,34,35,35,35,35,35
    ,35,35,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,65,66
    ,100,101,102,103,104,105,106,106,107,108,109,110,111,112,117,114,115,117,117,117
    ,118,119,120,121,122,123,124,125,126,127,128,129,130,131,132,133
    ,134,135,136,137,138,139,140,141,142,143,144,145,146,147,148,149
    ,150,151,152,153,154,155,156,157,158,159,160,161,162,163,164,165,166,167,168,169,170
    ,171,172,34,173,174,175,176,177,178,179,180,181,182,35,183,184,185,186,187,188,189};

char *exittxt[]={"north","east","south","west","up","down","n","e","s","w","u","d",0};
long exitnum[]={1,2,3,4,5,6,1,2,3,4,5,6};

*/

const doaction = (state: State, actionId: number): Promise<void> => {
    const actions = {
        /*
       case 1:
          dogocom();
          break;
       case 139:
          if(in_fight)
             {
             bprintf("Not in a fight!\n");break;
             }
          gropecom();
          break;
          */
        8: () => new Promise((resolve) => {
            if (state.isforce) {
                bprintf(state, 'You can\'t be forced to do that\n');
                return resolve();
            }
            rte(state, state.globme);
            openworld(state);
            if (state.in_fight) {
                bprintf(state, 'Not in the middle of a fight!\n');
                return resolve();
            }
            const xx1 = `${state.globme} has left the game\n`;
            bprintf(state, 'Ok');
            sendsys(state, state.globme, state.globme, -10000, state.curch, xx1);
            return Promise.all([
                sendWizards(state, `[ Quitting Game : ${state.globme} ]\n`),
                dropMyItems(state),
                setPlayer(state, state.mynum, {
                    exists: false,
                    isDead: true,
                }),
            ])
                .then(() => {
                    closeworld(state);
                    state.curmode = 0;
                    state.curch = 0;
                    saveme(state);
                    return endGame(state, 'Goodbye');
                })
        }),
        /*
       case 9:
          getobj();
          break;
       case 137:
          crashcom();
          break;
       case 10:
          dropitem();
          break;
       case 11:
          look_cmd();
          break;
       case 12:
          inventory();
          break;
       case 13:
          whocom();
          break;
       case 14:
          rescom();
          break;
       case 15:
          lightning();
          break;
       case 16:
          eatcom();
          break;
       case 17:
          playcom();
          break;
       case 18:
          shoutcom();
          break;
       case 19:
          saycom();
          break;
       case 20:
          tellcom();
          break;
       case 21:
          saveme();
          break;
       case 22:
          scorecom();
          break;
       case 23:
          exorcom();
          break;
       case 24:
          givecom();
          break;
       case 25:
          stealcom();
          break;
       case 26:
          levcom();
          break;
       case 27:
          helpcom();
          break;
       case 28:
          valuecom();
          break;
       case 29:
          stacom();
          break;
       case 30:
          examcom();
          break;
       case 31:
          delcom();
          break;
       case 32:
          passcom();
          break;
       case 33:
          sumcom();
          break;
       case 34:
          weapcom();
          break;
       case 35:
          killcom();
          break;
       case 50:
          laughcom();
          break;
       case 51:
          crycom();
          break;
       case 52:
          burpcom();
          break;
       case 53:
          fartcom();
          break;
       case 54:
          hiccupcom();
          break;
       case 55:
          grincom();
          break;
       case 56:
          smilecom();
          break;
       case 57:
          winkcom();
          break;
       case 58:
          sniggercom();
          break;
       case 59:
          posecom();
          break;
       case 60:
          setcom();
          break;
       case 61:
          praycom();
          break;
       case 62:
          stormcom();
          break;
       case 63:
          raincom();
          break;
       case 64:
          suncom();
          break;
       case 65:
          snowcom();
          break;
       case 66:
          goloccom();
          break;
       case 100:
          wearcom();
          break;
       case 101:
          removecom();
          break;
       case 102:
          putcom();
          break;
       case 103:
          wavecom();
          break;
       case 104:
          blizzardcom();
          break;
       case 105:
          opencom();
          break;
       case 106:
          closecom();
          break;
       case 107:
          lockcom();
          break;
       case 108:
          unlockcom();
          break;
       case 109:
          forcecom();
          break;
       case 110:
          lightcom();
          break;
       case 111:
          extinguishcom();
          break;
       case 118:
          cripplecom();
          break;
       case 119:
          curecom();
          break;
       case 120:
          dumbcom();
          break;
       case 121:
          changecom();
          break;
       case 122:
          missilecom();
          break;
       case 123:
          shockcom();
          break;
       case 124:
          fireballcom();
          break;
       case 126:
          blowcom();
          break;
       case 127:
          sighcom();
          break;
       case 128:
          kisscom();
          break;
       case 129:
          hugcom();
          break;
       case 130:
          slapcom();
          break;
       case 131:
          ticklecom();
          break;
       case 132:
          screamcom();
          break;
       case 133:
          bouncecom();
          break;
       case 134:
          wizcom();
          break;
       case 135:
          starecom();
          break;
       case 136:
          exits();
          break;
       case 138:
          singcom();
          break;
       case 140:
          spraycom();
          break;
       case 141:
          groancom();
          break;
       case 142:
          moancom();
          break;
       case 143:
          dircom();
          break;
       case 144:
          yawncom();
          break;
       case 117:;
       case 113:
          pushcom();
          break;
       case 145:
          wizlist();
          break;
       case 146:
          incom();
          break;
       case 147:
          lightcom();
          break;
       case 114:
          inviscom();
          break;
       case 115:
          viscom();
          break;
       case 148:
          deafcom();
          break;
       case 149:
          ressurcom();
          break;
       case 150:
          logcom();
          break;
       case 151:
          tsscom();
          break;
       case 152:
          rmeditcom();
          break;
       case 154:
          squeezecom();
          break;
       case 153:
          loccom();
          break;
       case 155:
          usercom();
          break;
       case 156:
          u_system();
          break;
       case 157:
          inumcom();
          break;
       case 158:
          updcom();
          break;
       case 159:
          becom();
          break;
       case 160:
          systat();
          break;
       case 161:
          convcom();
          break;
       case 162:
          snoopcom();
          break;
       case 163:
          shellcom();
          break;
       case 164:
          rawcom();
          break;
       case 165:
          purrcom();
          break;
       case 166:
          cuddlecom();
          break;
       case 167:
          sulkcom();
          break;
       case 168:
          rollcom();
          break;
       */
            169: () => new Promise((resolve) => {
                bprintf(state, showFile(CREDITS));
                resolve();
            }),
        /*
       case 170:
          brmode=!brmode;
          break;
       case 171:
          debugcom();
          break;
       case 172:
          jumpcom();
          break;
       case 112:
          wherecom();
          break;
       case 173:
          bprintf("Your adventurers automatic monster detecting radar, and long range\n");
          bprintf("mapping kit, is, sadly, out of order.\n");break;
       */
            174: () => new Promise((resolve) => {
                if (!state.in_fight) {
                    return dogocom(state);
                }
                return Promise.all([
                    getPlayer(state, state.mynum),
                    getItem(state, 32),
                ])
                    .then(([
                        player,
                        runeSword,
                    ]) => {
                        if (isCarriedBy(runeSword, player, (state.my_lev < 10))) {
                            bprintf(state, 'The sword won\'t let you!!!!\n');
                            return resolve();
                        }
                        const ar = `${sendVisibleName(state.globme)} drops everything in a frantic attempt to escape\n`;
                        sendsys(state, state.globme, state.globme, -10000, state.curch, ar);
                        sendsys(state, state.globme, state.globme, -20000, state.curch, null);
                        state.my_sco -= state.my_sco / 33;
                        /* loose 3% */
                        calibme(state);
                        state.in_fight = 0;
                        return onFlee(state)
                            .then(() => dogocom(state));
                    });
            }),
        /*
       case 175:
          bugcom();
          break;
       case 176:
          typocom();
          break;
       case 177:
          pncom();
          break;
       case 178:
          blindcom();
          break;
       case 179:
          edit_world();
          break;
          */
         180: () => getPlayer(state, state.mynum)
             .then((player) => {
                 if (player.canUseDebugMode) {
                     state.debug_mode = !state.debug_mode;
                 }
             }),
        /*
       case 181:
          setpflags();
          break;
       case 182:
          frobnicate();
          break;
       case 183:
          setincom();
          break;
       case 184:
          setoutcom();
          break;
       case 185:
          setmincom();
          break;
       case 186:
          setmoutcom();
          break;
       case 187:
          emotecom();
          break;
       case 188:
          digcom();
          break;
       case 189:
          emptycom();
          break;
         */
    };
    const defaultAction = () => new Promise((resolve) => {
        if (state.my_lev > 9999) {
            bprintf(state, `Sorry not written yet[COMREF ${actionId}]\n`);
        } else {
            bprintf(state, 'I don\'t know that verb.\n');
        }
        return resolve();
    });
    if ((actionId > 1) && (actionId < 8)) {
        return dodirn(state, actionId);
    }
    const action = actions[actionId] || defaultAction;
    return action();
};

/*

 doaction(n)
    {
    char xx[128];
    extern long my_sco;
    extern long curmode;
    extern long curch;
    extern long debug_mode;
    extern char globme[];
    extern long isforce;
    extern long in_fight;
    extern long brmode;
    long  brhold;
    extern long mynum;
    extern long my_lev;
    openworld();
    if((n>1)&&(n<8)){dodirn(n);return;}
    switch(n)
       {
    }

char in_ms[81]="has arrived.";
char out_ms[81]="";
char mout_ms[81]="vanishes in a puff of smoke.";
char min_ms[81]="appears with an ear-splitting bang.";
char here_ms[81]="is here";

dogocom(n)
    {
    extern char *exittxt[];
    extern long exitnum[];
    extern char wordbuf[];
    long  a;
    if(brkword()== -1)
       {
       bprintf("GO where ?\n");
       return(-1);
       }
    if(!strcmp(wordbuf,"rope")) strcpy(wordbuf,"up");
    a=chklist(wordbuf,exittxt,exitnum);
    if(a== -1)
       {
       bprintf("Thats not a valid direction\n");
       return(-1);
       }
    return(dodirn(a+1));
    }
    */

const dodirn = (state: State, n: number): Promise<void> => {
    if (state.in_fight > 0) {
        bprintf(state, 'You can\'t just stroll out of a fight!\n');
        bprintf(state, 'If you wish to leave a fight, you must FLEE in a direction\n');
        return Promise.resolve();
    }

    return  Promise.all([
        getPlayer(state, state.mynum),
        getItem(state, 32),
        getPlayer(state, 25),
    ])
        .then(([
            player,
            runeSword,
            player25,
        ]) => {
            if (isCarriedBy(runeSword, player, (state.my_lev < 10)) && (player25.locationId === state.curch) && player25.exists) {
                bprintf(state, `${sendVisibleName('The Golem')} bars the doorway!`);
                return;
            }
            n -= 2;
            return checkCrippled(state)
                .then(() => state.ex_dat[n])
                .then((newch) => {
                    if ((newch > 999) && (newch < 2000)) {
                        const drnum = newch - 1000;
                        return Promise.all([
                            getItem(state, drnum /* other door side */),
                            getItem(state, drnum ^ 1 /* other door side */),
                        ])
                            .then(([drnum, droff]) => {
                                if (drnum.state !== 0) {
                                    if ((drnum.name === "door") || isdark(state) || !drnum.description.length) {
                                        throw new Error('You can\'t go that way\n');
                                        /* Invis doors */
                                    } else {
                                        throw new Error('The door is not open\n');
                                    }
                                }
                                return droff.locationId;
                            });
                    }
                    return newch;
                })
                .then((newch) => {
                    if (newch === -139) {
                        Promise.all([
                            89,
                            113,
                            114,
                        ].map(itemId => getItem(state, itemId)))
                            .then((shields) => {
                                if (shields.some(shield => isWornBy(state, shield, player))) {
                                    bprintf(state, 'The shield protects you from the worst of the lava stream\'s heat\n');
                                } else {
                                    return bprintf(state, 'The intense heat drives you back\n');
                                }
                            });
                    }
                    let p = Promise.resolve(true);
                    if (n === 2) {
                        p = Promise.all([
                            findPlayer(state, 'figure'),
                            Promise.all([
                                101,
                                102,
                                103,
                            ].map(itemId => getItem(state, itemId))),
                        ])
                            .then(([
                                figure,
                                items,
                            ]) => {
                                if (figure && (figure.playerId !== state.mynum) && (figure.locationId === state.curch) && !items.some(item => isWornBy(state, item, player))) {
                                    bprintf(state, `${sendName('The Figure')} holds you back\n`);
                                    bprintf(state, `${sendName('The Figure')} says \'Only true sorcerors may pass\'\n`);
                                    return false;
                                }
                                return true;
                            });
                    }
                    return p
                        .then((result) => {
                            if (!result) {
                                return;
                            }
                            if (newch >= 0) {
                                throw new Error('You can\'t go that way\n');
                            }
                            return getPlayer(state, state.mynum)
                                .then((player) => {
                                    const block = sendVisiblePlayer(player.name, `${player.name} has gone ${state.exittxt[n]} ${state.out_ms}.\n`);
                                    sendsys(state, state.globme, state.globme, -10000, state.curch, block);
                                    state.curch = newch;
                                    const block1 = sendVisiblePlayer(player.name, `${player.name} ${state.in_ms}.\n`);
                                    sendsys(state, state.globme, state.globme, -10000, newch, block1);
                                    trapch(state, state.curch);
                                });
                        });
                })
                .catch(err => bprintf(state, err));
        });
};

/*
long tdes=0;
long vdes=0;
long rdes=0;
long ades=0;
long zapped;
*/

const gamrcv = (state: State, block: { locationId: number, code: number }): Promise<void> => {
    const actions = {
        '-9900': () => setPlayer(state, i[0], { visibility: i[1] }),
        '-666': () => {
            bprintf(state, 'Something Very Evil Has Just Happened...\n');
            loseme(state);
            return endGame(state, 'Bye Bye Cruel World....');
        },
        /*
       case -599:
          if(isme)
             {
             sscanf(text,"%d.%d.%d.",&my_lev,&my_sco,&my_str);
             calibme();
             }
          break;
       */
        '-750': () => {
            if (!isme) {
                return Promise.resolve();
            }
            return findPlayer(state, name2)
                .then((player2) => {
                    if (!player2) {
                        return loseme(state);
                    }
                    closeworld(state);
                    console.log('***HALT');
                    return exit(0);
                });
        },
        '-400': () => {
            if (isme) {
                state.snoopd = -1;
            }
            return Promise.resolve();
        },
        '-401': () => {
            if (!isme) {
                return Promise.resolve();
            }
            return findPlayer(state, name2)
                .then((player2) => {
                    state.snoopd = player2 ? player2.playerId : -1;
                });
        },
        /*
       case -10000:
          if((isme!=1)&&(blok[0]==curch))
             {
             bprintf("%s",text);
             }
          break;
       case -10030:
          wthrrcv(blok[0]);break;
       */
        '-10021': (payload) => {
            if (!isme) {
                return Promise.resolve();
            }
            if (state.curch !== block.locationId) {
                return Promise.resolve();
            }
            state.rdes = 1;
            state.vdes = payload.characterId;
            return receiveDamage(state, payload, isme);
        },
        '-10020': (payload) => {
            if (!isme) {
                return Promise.resolve();
            }
            const ades = block.locationId;
            if (state.my_lev < 10) {
                bprintf(state, `You drop everything you have as you are summoned by ${sendName(name2)}`);
            } else {
                bprintf(state, `${sendName(name2)} tried to summon you`);
                return Promise.resolve();
            }
            state.tdes = 1;
            return Promise.resolve();
        },
        '-10001': () => {
            if (isme) {
                if (state.my_lev > 10) {
                    bprintf(state, `${sendName(name2)} cast a lightning bolt at you\n`);
                    return Promise.resolve();
                }
                /* You are in the .... */
                bprintf(state, 'A massive lightning bolt arcs down out of the sky to strike');
                return sendWizards(state, `[ ${sendName(state.globme)} has just been zapped by ${sendName(name2)} and terminated ]\n`)
                    .then(() => {
                        state.zapped = true;
                        delpers(state, state.globme);
                        const zb2 = sendVisiblePlayer(state.globme, `${state.globme} has just died.\\n\n`);
                        sendsys(state, state.globme, state.globme, -10000, state.curch, zb2);
                        loseme(state);
                        bprintf(state, `You have been utterly destroyed by ${name2}\n`);
                        return endGame(state, 'Bye Bye.... Slain By Lightning');
                    });
            } else if (block.locationId === state.curch) {
                bprintf(state, `${sendVisibleName('A massive lightning bolt strikes ')}${sendPlayerForVisible(name2)}${sendVisibleName('\n')}`);
                return Promise.resolve();
            }
        },
        '-10002': () => {
            if (isme) {
                return Promise.resolve();
            }
            if ((block.locationId === state.curch) || (state.my_lev > 9)) {
                bprintf(state, `${sendSoundPlayer(name2)}${sendSound(` shouts '${text}'\n`)}`);
                return Promise.resolve();
            } else {
                bprintf(state, sendSound(`A voice shouts '${text}'\n`));
                return Promise.resolve();
            }
        },
        '-10003': () => {
            if (isme) {
                return Promise.resolve();
            }
            if (block.locationId === state.curch) {
                bprintf(state, `${sendSoundPlayer(name2)}${sendSound(` says '${text}'\n`)}`);
                return Promise.resolve();
            }
        },
        '-10004': () => {
            if (isme) {
                bprintf(state, `${sendSoundPlayer(name2)}${sendSound(` tells you '${text}'\n`)}`);
            }
            return Promise.resolve();
        },
        '-10010': () => {
            if (isme) {
                loseme(state);
                return endGame(state, 'You have been kicked off');
            } else {
                bprintf(state, `${name1} has been kicked off\\n`);
                return Promise.resolve();
            }
        }
        /*
       case -10011:
          if(isme==1)
             {
             bprintf("%s",text);
             }
          break;
         */
    };
    const nameme = state.globme.toLowerCase();
    const [isme, name1, name2, text] = split(state, block, nameme);
    const i = text;
    return findPlayer(state, name1)
        .then((player1) => {
            if ((block.code === -20000) && (player1.playerId === state.fighting) {
                state.in_fight = 0;
                state.fighting = -1;
                return;
            } else if (block.code < -10099) {
                return newReceive(state, isme, block.locationId, name1, name2, block.code, text);
            } else {
                const action = actions[block.code] || (() => undefined);
                return action(text);
            }
        });
};

/*
ong me_ivct=0;
long last_io_interrupt=0;
*/

const eorte = (state: State): Promise<void> => {
    const ctm = time();
    if (ctm - state.last_io_interrupt > 2) {
        state.interrupt = true;
    }
    if (state.interrupt) {
        state.last_io_interrupt = ctm;
    }
    if (state.me_ivct) {
        state.me_ivct -= 1;
    }
    if (state.me_cal) {
        state.me_cal = false;
        calibme(state);
    }
    if (state.tdes) {
        dosumm(state.ades);
    }
    let p = Promise.resolve();
    if (state.in_fight) {
        p = getPlayer(state, state.fighting)
            .then((enemy) => {
                if (enemy.playerId !== state.curch) {
                    state.fighting = -1;
                    state.in_fight = 0;
                    return;
                }
                if (!enemy.exists) {
                    state.fighting = -1;
                    state.in_fight = 0;
                    return;
                }
                if (state.in_fight) {
                    if (state.interrupt) {
                        state.in_fight = 0;
                        return Promise.all([
                            getPlayer(state, state.fighting),
                            getItem(state, state.wpnheld),
                        ])
                            .then(([enemy, weapon]) => hitPlayer(state, enemy, weapon));
                    }
                }
            });
    }
    return p
        .then(() => Promise.all([
            checkRoll(r => r < 10),
            getPlayer(state, state.mynum),
            getItem(state, 18),
        ])
        .then(([
            xpRoll,
            player,
            item,
        ]) => {
            if (xpRoll || isWornBy(state, item, player)) {
                state.my_str += 1;
                if (state.i_setup) {
                    calibme(state);
                }
            }
            checkForce(state);
            if (state.me_drunk > 0) {
                state.me_drunk -= 1;
                if (!getDumb(state)) {
                    gamecom(state, 'hiccup');
                }
            }
            state.interrupt = false;
        });
};

/*
long me_drunk=0;

FILE *openroom(n,mod)
    {
    long  blob[64];
    FILE *x;
    sprintf(blob,"%s%d",ROOMS,-n);
    x=fopen(blob,mod);
    return(x);
    }

long me_cal=0;
*/

const rescom = (state: State): Promise<void> => {
    if (state.my_lev < 10) {
        bprintf(state, 'What ?\\n');
        return Promise.resolve();
    }
    broad(state, 'Reset in progress....\\nReset Completed....\\n');
    return openlock(RESET_DATA, 'r')
        .then((b) => {
            return Promise.all(sec_read(state, b, 0, 4 * state.numobs))
                .then(items => items.map((data, itemId) => setItem(state, itemId, data)))
                .then(() => fcloselock(b));
        })
        .then(() => fopen(RESET_T, 'w'))
        .then((s) => fprintf(state, s, `Last Reset At ${ctime(time())}\n`).then(() => fclose(a)))
        .then(() => fopen(RESET_N, 'w'))
        .then((s) => fprintf(state, s, time()).then(() => fclose(a)))
        .then(() => resetPlayers(state));
}

const lightning = (state: State): Promise<void> => {
    if (state.my_lev < 10) {
        bprintf(state, 'Your spell fails.....\n');
        return Promise.resolve();
    }
    if (brkword(state) === -1) {
        bprintf(state, 'But who do you wish to blast into pieces....\n');
        return Promise.resolve();
    }
    return findVisiblePlayer(state, state.wordbuf)
        .then((player) => {
            if (player.playerId === -1) {
                return bprintf(state, 'There is no one on with that name\n');
            }
            sendsys(state, player.name, state.globme, -10001, player.locationId, null);
            return logger.write(`${state.globme} zapped ${player.name}`)
                .then(() => sendBotDamage(state, player, 10000))
                .then(() => broad(state, sendSound('You hear an ominous clap of thunder in the distance\n')));
        });
};

const eatcom = (state: State): Promise<void> => {
    if (brkword(state) === -1) {
        bprintf(state, 'What\n');
        return Promise.resolve();
    }
    if ((state.curch === -609) && (state.wordbuf === 'water')) {
        state.wordbuf = 'spring';
    }
    if (state.wordbuf === 'from') {
        brkword(state);
    }
    return findAvailableItem(state, state.wordbuf)
        .then((item) => {
            if (item.itemId === -1) {
                return bprintf(state, 'There isn\'t one of those here\n');
            } else if (item.itemId === 11) {
                bprintf(state, 'You feel funny, and then pass out\n');
                bprintf(state, 'You wake up elsewhere....\n');
                teleport(state, -1076);
                return;
            } else if (item.itemId === 75) {
                return bprintf(state, 'very refreshing\n');
            } else if (item.itemId === 175) {
                if (state.my_lev < 3) {
                    state.my_sco += 40;
                    calibme(state);
                    bprintf(state, 'You feel a wave of energy sweeping through you.\n');
                } else {
                    bprintf(state, 'Faintly magical by the taste.\n');
                    if (state.my_str < 40) {
                        state.my_str += 2;
                    }
                    calibme(state);
                }
                return;
            } else if (item.isFood) {
                return setItem(state, item.itemId, { flags: { [IS_DESTROYED]: true }})
                    .then(() => {
                        bprintf(state, 'Ok....\n');
                        state.my_str += 12;
                        calibme(state);
                    });
            } else {
                return bprintf(state, 'Thats sure not the latest in health food....\n');
            }
        });
};

const calibme = (state: State): Promise<void> => {
    /* Routine to correct me in user file */
    if (!state.i_setup) {
        return;
    }
    const level = levelof(state, state.my_sco);
    if (level !== state.my_lev) {
        state.my_lev = level;
        bprintf(state, `You are now ${state.globme} `);
        logger.write(`${state.globme} to level ${level}`)
            .then(() => {
                bprintf(state, `${getTitle(level, state.my_sex, state.hasfarted)}\n`);
                return getPlayer(state, state.mynum);
            })
            .then((player) => {
                return sendWizards(state, `${sendName(state.globme)} is now level ${level}\n`)
                    .then(() => {
                        if (level === 10) {
                            bprintf(state, showFile(GWIZ));
                        }
                    });
            });
    }
    return setPlayer(state, state.mynum, {
        level: state.my_lev,
        strength: state.my_str,
        sex: state.my_sex,
        weaponId: state.wpnheld,
    })
        .then(() => {
            if (state.my_str > (30 + 10 * state.my_lev)) {
                state.my_str = 30 + 10 * state.my_lev;
            }
        });
};

/*
 levelof(score)
    {
    extern long my_lev;
    score=score/2;  *//* Scaling factor *//*
    if(my_lev>10) return(my_lev);
    if(score<500) return(1);
    if(score<1000) return(2);
    if(score<3000) return(3);
    if(score<6000) return(4);
    if(score<10000) return(5);
    if(score<20000) return(6);
    if(score<32000) return(7);
    if(score<44000) return(8);
    if(score<70000) return(9);
    return(10);
    }

*/

const playcom = (state: State): Promise<void> => {
    if (brkword(state) === -1) {
        bprintf(state, 'Play what ?\n');
        return Promise.resolve();
    }
    return Promise.all([
        getPlayer(state, state.mynum),
        findAvailableItem(state, state.wordbuf),
    ])
        .then(([
            player,
            item,
        ]) => {
            if ((item.itemId === -1) || !isAvailable(item, player, state.curch, (state.my_lev < 10))) {
                return bprintf(state, 'That isn\'t here\n');
            }
        })
};

/*
 getreinput(blob)
    {
    extern long stp;
    extern char strbuf[];
    strcpy(blob,"");
    while(strbuf[stp]==' ') stp++;
    while(strbuf[stp]) addchar(blob,strbuf[stp++]);
    }
*/

const shoutcom = (state: State): Promise<void> => checkDumb(state)
    .then(() => {
        const blob = getreinput(state);
        if (state.my_lev > 9) {
            return sendShout(state, blob);
        } else {
            return sendsys(state, state.globme, state.globme, -10002, state.curch, blob);
        }
    })
    .then(() => bprintf(state, 'Ok\n'));

const saycom = (state: State): Promise<void> => checkDumb(state)
    .then(() => {
        const blob = getreinput(state);
        sendsys(state, state.globme, state.globme, -10003, state.curch, blob);
        return bprintf(state, `You say '${blob}'\n`)
    });

const tellcom = (state: State): Promise<void> => checkDumb(state)
    .then(() => {
        if (brkword(state) === -1) {
            bprintf(state, 'Tell who ?\n');
            return Promise.resolve();
        }
        return findVisiblePlayer(state, state.wordbuf)
            .then((player) => {
                if (player.playerId === -1) {
                    return bprintf(state, 'No one with that name is playing\n');
                }
                const blob = getreinput();
                sendsys(state, player.name, state.globme, -10004, state.curch, blob);
                return;
            });
    });

const scorecom = (state: State): Promise<void> => {
    if (state.my_lev === 1) {
        bprintf(state, `Your strength is ${state.my_str}\n`);
        return Promise.resolve();
    }
    bprintf(state, `Your strength is ${state.my_str}(from ${50 + 8 * state.my_lev}),Your score is ${state.my_sco}\n`);
    bprintf(state, `This ranks you as ${state.globme} ${getTitle(state.my_lev, state.my_sex, state.hasfarted)}\n`);
};

const exorcom = (state: State): Promise<void> => {
    if (state.my_lev < 10) {
        bprintf(state, 'No chance....\n');
        return Promise.resolve();
    }
    if (brkword(state) === -1) {
        bprintf(state, 'Exorcise who ?\n');
        return Promise.resolve();
    }
    return findVisiblePlayer(state, state.wordbuf)
        .then((player) => {
            if (!player) {
                return bprintf(state, 'They aren\'t playing\n');
            }
            if (!player.canBeExorcised) {
                return bprintf(state, 'You can\'t exorcise them, they dont want to be exorcised\n');
            }
            return logger.write(`${state.globme} exorcised ${player.name}`)
                .then(() => dropItems(state, player))
                .then(() => {
                    sendsys(state, player.name, state.globme, -10010, state.curch, null);
                    return setPlayer(state, player.playerId, { exists: false });
                });
        })
};

const givecom = (state: State): Promise<void> => {
    const obfrst = (player: Player) => {
        if (!player) {
            return bprintf(state, `Who is ${state.wordbuf}\n`);
        }
        if (brkword(state) === -1) {
            return bprintf(state, 'Give them what ?\n');
        }
        return findAvailableItem(state, state.wordbuf)
            .then((item) => {
                if (item.itemId === -1) {
                    return bprintf(state, 'You are not carrying that\n');
                }
                return dogive(state, item.itemId, player.playerId);
            })
    };

    if (brkword(state) === -1) {
        bprintf(state, 'Give what to who ?\n');
        return Promise.resolve();
    }
    findVisiblePlayer(state, state.wordbuf)
        .then((player) => {
            if (player) {
                return obfrst(player);
            }
            return findAvailableItem(state, state.wordbuf)
                .then((item) => {
                    if (item.itemId === -1) {
                        return bprintf(state, 'You aren\'t carrying that\n');
                    }
                    /* a = item giving */
                    if (brkword(state) === -1) {
                        return bprintf(state, 'But to who ?\n');
                    }
                    if (state.wordbuf === 'to') {
                        if (brkword(state) === -1) {
                            return bprintf(state, 'But to who ?\n');
                        }
                    }
                    return findVisiblePlayer(state, state.wordbuf)
                        .then((player) => {
                            if (!player) {
                                return bprintf(state, `I don't know who ${state.wordbuf} is\n`);
                            }
                            return dogive(state, item.itemId, player.playerId);
                        });
                });
        })
};

const dogive = (state: State, itemId: number, playerId: number): Promise<void> => Promise.all([
    getPlayer(state, state.mynum),
    getItem(state, itemId),
    getPlayer(state, playerId),
])
    .then(([
        me,
        item,
        player,
    ]) => {
        if ((state.my_lev < 10) && (player.locationId !== state.curch)) {
            return bprintf(state, 'They are not here\n');
        }
        if (!isCarriedBy(item, me, (state.my_lev < 10))) {
            return bprintf(state, 'You are not carrying that\n');
        }
        if (!cancarry(state, player.playerId)) {
            return bprintf(state, 'They can\'t carry that\n');
        }
        if ((state.my_lev < 10) && (item.itemId === 32)) {
            return bprintf(state, 'It doesn\'t wish to be given away.....\n');
        }
        return holdItem(state, item.itemId, player.playerId)
            .then(() => {
                const z = `${sendName(state.globme)} gives you the ${item.name}\n`;
                sendsys(state, player.name, state.globme, -10011, state.curch, z);
            });
    });

const stealcom = (state: State): Promise<void> => {
    if (brkword(state) === -1) {
        bprintf(state, 'Steal what from who ?\n');
        return Promise.resolve();
    }
    const x = state.wordbuf;
    if (brkword(state) === -1) {
        bprintf(state, 'From who ?\n');
        return Promise.resolve();
    }
    if (state.wordbuf === 'from') {
        if (brkword(state) === -1) {
            bprintf(state, 'From who ?\n');
            return Promise.resolve();
        }
    }
    return findVisiblePlayer(state, state.wordbuf)
        .then((player) => {
            if (!player) {
                return bprintf(state, 'Who is that ?\n');
            }
            return findCarriedItem(state, x, player)
                .then((item) => {
                    if (item.itemId === -1) {
                        return bprintf(state, 'They are not carrying that\n');
                    }
                    if ((state.my_lev < 10) && (player.locationId !== state.curch)) {
                        return bprintf(state, 'But they aren\'t here\n');
                    }
                    if (item.wearingBy !== undefined) {
                        return bprintf(state, 'They are wearing that\n');
                    }
                    if (player.weaponId === item.itemId) {
                        return bprintf(state, 'They have that firmly to hand .. for KILLING people with\n');
                    }
                    if (!cancarry(state, state.mynum)) {
                        return bprintf(state, 'You can\'t carry any more\n');
                    }

                    const t = time(state);
                    srand(state, t);
                    let e = 10 + state.my_lev - player.level;
                    e *= 5;
                    return roll()
                        .then((f) => {
                            if (f < e) {
                                const tb = `${sendName(state.globme)} steals the ${item.name} from you !\n`;
                                if (f & 1) {
                                    sendsys(state, player.name, state.globme, -10011, state.curch, tb);
                                    return sendBotDamage(state, player, 0);
                                }
                                return holdItem(state, item.itemId, state.mynum);
                            } else {
                                return bprintf(state, 'Your attempt fails\n');
                            }
                        });
                });

        })
};

const dosumm = (state: State, locationId: number): Promise<void> => {
    const ms1 = sendVisiblePlayer(state.globme, `${state.globme} vanishes in a puff of smoke\n`);
    sendsys(state, state.globme, state.globme, -10000, state.curch, ms1);
    return dropMyItems(state)
        .then(() => {
            state.curch = locationId;
            const ms2 = sendVisiblePlayer(state.globme, `${state.globme} appears in a puff of smoke\n`);
            sendsys(state, state.globme, state.globme, -10000, state.curch, ms2);
            trapch(state, state.curch);
        })
};

const tsscom = (state: State): Promise<void> => {
    if (state.my_lev < 10000) {
        bprintf(state, 'I don\'t know that verb\n');
        return Promise.resolve();
    }
    const s = getreinpout(state);
    closeworld(state);
    if (getuid(state) === geteuid(state)) {
        system(state, s);
        return Promise.resolve();
    } else {
        bprintf(state, 'Not permitted on this ID\n');
        return Promise.resolve();
    }
};

const rmedit = (state: State): Promise<void> => getPlayer(state, state.mynum)
    .then((editor) => {
        if (!editor.isEditor) {
            return bprintf(state, 'Dum de dum.....\n');
        }
        return sendWizards(state, sendVisiblePlayer(state.globme, `${state.globme} fades out of reality\n`))
            .then(() => {
                /* Info */
                state.cms = -2; /* CODE NUMBER */
                update(state, state.globme);
                return showMessages(state);
            })
            .then(() => {
                closeworld(state);
                if (chdir(state, ROOMS) === -1) {
                    bprintf(state, 'Warning: Can\'t CHDIR\n');
                }
                const ms2 = '/cs_d/aberstudent/yr2/hy8/.sunbin/emacs';
                system(state, ms2);
                state.cms = -1;
                openworld(state);
                return findPlayer(state, state.globme)
                    .then((me) => {
                        if (!me) {
                            loseme(state);
                            return endGame(state, 'You have been kicked off');
                        }
                        return sendWizards(state, sendVisiblePlayer(state.globme, `${state.globme} re-enters the normal universe\n`));
                    })
                    .then(() => rte(state));
            });
    });

const u_system = (state: State): Promise<void> => getPlayer(state, state.mynum)
    .then((editor) => {
        if (state.my_lev < 10) {
            return bprintf(state, 'You\'ll have to leave the game first!\n');
        }

        state.cms = -2; /* CODE NUMBER */
        update(state, state.globme);
        return sendWizards(state, sendVisiblePlayer(state.globme, `${state.globme} has dropped into BB\n`))
            .then(() => {
                closeworld(state);

                system(state, '/cs_d/aberstudent/yr2/iy7/bt');

                openworld(state);
                state.cms = -1;

                return findPlayer(state, state.globme);
            })
            .then((me) => {
                if (!me) {
                    loseme(state);
                    return endGame(state, 'You have been kicked off');
                }
                rte(state);
                openworld(state);
                return sendWizards(state, sendVisiblePlayer(state.globme, `${state.globme} has returned to AberMud\n`));
            });
    });

const inumcom = (state: State): Promise<void> => {
    if (state.my_lev < 10000) {
        bprintf(state, 'Huh ?\n');
        return;
    }
    if (brkword(state) === -1) {
        bprintf(state, 'What...\n');
        return;
    }
    return findItem(state, state.wordbuf)
        .then(item => bprintf(state, `Item Number is ${item.itemId}\n`));
};

const updcom = (state: State): Promise<void> => {
    if (state.my_lev < 10) {
        bprintf(state, 'Hmmm... you can\'t do that one\n');
        return Promise.resolve();
    }
    loseme();
    return sendWizards(state, `[ ${state.globme} has updated ]\n`)
        .then(() => {
            closeworld(state);
            return execl(EXE, '   --{----- ABERMUD -----}--   ', `-n${state.globme}`); /* GOTOSS eek! */
        })
        .catch(() => bprintf(state, 'Eeek! someones pinched the executable!\n'));
};

const becom = (state: State): Promise<void> => {
    if (state.my_lev < 10) {
        bprintf(state, 'Become what ?\n');
        return Promise.resolve();
    }
    const x2 = getreinput(state);
    if (!x2) {
        bprintf(state, 'To become what ?, inebriated ?\n');
        return Promise.resolve();
    }
    return sendWizards(state, `${state.globme} has quit, via BECOME\n`)
        .then(() => {
            loseme(state);
            closeworld(state);
            return execl(state, '   --}----- ABERMUD ------   ', `-n${x2}`);
        })
        .catch(() => bprintf(state, 'Eek! someone\'s just run off with mud!!!!\n'));
};

/*
 systat()
    {
    extern long my_lev;
    if(my_lev<10000000)
       {
       bprintf("What do you think this is a DEC 10 ?\n");
       return;
       }
    }

 convcom()
    {
    extern long convflg;
    convflg=1;
    bprintf("Type '**' on a line of its own to exit converse mode\n");
    }

 shellcom()
    {
    extern long convflg,my_lev;
    if(my_lev<10000)
       {
       bprintf("There is nothing here you can shell\n");
       return;
       }
    convflg=2;
    bprintf("Type ** on its own on a new line to exit shell\n");
    }

 rawcom()
    {
    extern long my_lev;
    char x[100],y[100];
    if(my_lev<10000)
       {
       bprintf("I don't know that verb\n");
       return;
       }
    getreinput(x);
    if((my_lev==10033)&&(x[0]=='!'))
       {
       broad(x+1);
       return;
       }
    else
       {
       sprintf(y,"%s%s%s","** SYSTEM : ",x,"\n\007\007");
       broad(y);
       }
    }
*/

const rollcom = (state: State): Promise<void> => getAvailableItem(state)
    .then((item) => {
        if ((item.itemId === 122) || (item.itemId === 123)) {
            return gamecom(state, 'push pillar');
        } else {
            return bprintf(state, 'You can\'t roll that\n');
        }
    })

/*
long brmode=0;
*/

const debugcom = (state: State): Promise<void> => {
    if (state.my_lev < 10000) {
        bprintf(state, 'I don\'t know that verb\n');
        return Promise.resolve();
    }
    return debug2(state);
};

const bugcom = (state: State): Promise<void> => {
    const x = getreinput(state);
    return logger.write(`Bug by ${state.globme} : ${x}`);
};

const typocom = (state: State): Promise<void> => {
    const y = `${state.globme} in ${state.curch}`;
    const x = getreinput(state);
    return logger.write(`Typo by ${y} : ${x}`);
};

const look_cmd = (state: State): Promise<void> => {
    /*
	int a;
	extern long brmode;
	extern char wordbuf[];
    */
    if (brkword(state) === -1) {
        const brhold = state.brmode;
        state.brmode = false;
        lookin(state, state.curch);
        state.brmode = brhold;
        return Promise.resolve();
    }

    if (state.wordbuf === 'at') {
        examcom(state);
        return Promise.resolve();
    }
    if ((state.wordbuf !== 'in') && (state.wordbuf !== 'into')) {
        return Promise.resolve();
    }
    if (brkword(state) === -1) {
        bprintf(state, 'In what ?\n');
        return Promise.resolve();
    }
    return findAvailableItem(state, state.wordbuf)
        .then((item) => {
            if (item.itemId === -1) {
                return bprintf(state, 'What ?\n');
            }
            if (!item.isContainer) {
                return bprintf(state, 'That isn\'t a container\n');
            }
            if (item.canBeOpened && (item.state !== 0)) {
                return bprintf(state, 'It\'s closed!\n');
            }
            bprintf(state, `The ${item.name} contains:\n`);
            return itemsAt(state, item.itemId, CONTAINED_IN)
                .then((result) => bprintf(state, result));
        });
};

/*

set_ms(x)
char *x;
{
	extern long my_lev;
	extern char globme[];
	if((my_lev<10)&&(strcmp(globme,"Lorry")))
	{
		bprintf("No way !\n");
	}
	else
	{
		getreinput(x);
	}
	return;
}

setmincom()
{
	extern char min_ms[];
	set_ms(min_ms);
}
setincom()
{
	extern char min_ms[];
	set_ms(in_ms);
}
setoutcom()
{
	extern char out_ms[];
	set_ms(out_ms);
}
setmoutcom()
{
	extern char mout_ms[];
	set_ms(mout_ms);
}

setherecom()
{
	extern char here_ms[];
	set_ms(here_ms);
}
*/

const digcom = (state: State): Promise<void> => getItem(state, 186)
    .then((slab) => {
        if ((slab.locationId === state.curch) && slab.isDestroyed) {
            bprintf(state, 'You uncover a stone slab!\n');
            return createItem(state, slab.itemId).then(() => undefined);
        }
        if ((state.curch !== -172) && (state.curch !== -192)) {
            return bprintf(state, 'You find nothing.\n');
        }
        return getItem(state, 176)
            .then((item176) => {
                if (item176.state === 0) {
                    return bprintf(state, 'You widen the hole, but with little effect.\n');
                }
                bprintf(state, 'You rapidly dig through to another passage.\n');
                return setItem(state, item176.itemId, { state: 0 })
            });
    });

const emptycom = (state: State): Promise<void> => {
    return  getAvailableItem(state)
        .then((container) => {
            return getItems(state)
                .then(items => items.filter((item) => {
                    return isContainedIn(item, container, (state.my_lev < 10));
                }))
                .then(items => items.forEach((item) => {
                    return holdItem(state, item.itemId, state.mynum)
                        .then(() => {
                            bprintf(state, `You empty the ${item.name} from the ${container.name}\n`);
                            const x = `drop ${item.name}`;
                            gamecom(state, x);
                            return showMessages(state);
                        })
                        .then(() => {
                            openworld(state);
                        });
                }));
        });
};

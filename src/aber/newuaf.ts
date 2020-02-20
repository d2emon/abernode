import State from "./state";
import {getPlayer} from "./support";
import {bprintf} from "./__dummies";
import {findItem} from "./objsys";
import {showMessages} from "./bprintf/output";

/*
#include <errno.h>
#include <stdio.h>
#include "files.h"

extern FILE *openuaf();
extern FILE *openlock();
extern char *oname();
extern char *pname();

extern char globme[];

struct uaf_being
{
	char p_name[16];
	long p_score;
	long p_strength;
	long p_sex;
	long p_level;
};

typedef struct uaf_being PERSONA;

long personactl(name,d,act)
char *name;
PERSONA *d;
int act;
{
	FILE *a;
	char c[32],e[32];
	a=openuaf("r+");
	strcpy(e,name);
	lowercase(e);
	while(getpersona(a,d))
	{
		strcpy(c,d->p_name);
		lowercase(c);
		if(strcmp(c,e)==0)
		{
			switch(act)
			{
			case 0:
				fcloselock(a);
				return(1);
			case 1:	fseek(a,ftell(a)-sizeof(PERSONA),0);
				return((long)a);
			}
		}
	}
	fcloselock(a);
	return(-1);
}

#define PCTL_GET 0
#define PCTL_FIND 1

findpers(name,x)
char *name;
PERSONA *x;
{
	return(personactl(name,x,PCTL_GET));
}

delpers(name)
char *name;
{
	FILE *i;
	PERSONA x;
l1:	i=(FILE *)personactl(name,&x,PCTL_FIND);
	if(i==(FILE *)-1) return;
	lowercase(name);
	lowercase(x.p_name);
	if(strcmp(x.p_name,name))
	       crapup("Panic: Invalid Persona Delete");
	strcpy(x.p_name,"");
	x.p_level= -1;
	fwrite(&x,sizeof(PERSONA),1,i);
	fcloselock(i);
	goto l1;
}



putpers(name,pers)
char *name;
PERSONA *pers;
{
	FILE *i;
	unsigned long flen;
	PERSONA s;
	i=(FILE *)personactl(name,&s,PCTL_FIND);
	if(i==(FILE *)-1)
	{
		flen= -1;
		i=(FILE *)personactl("",&s,PCTL_FIND);
		if(i!=(FILE *)-1) goto fiok;
		i=openuaf("a");
		flen=ftell(i);
        fiok: 	if(fwrite(pers,sizeof(PERSONA),1,i)!=1)
		{
			bprintf("Save Failed - Device Full ?\n");
			if(flen!=-1)ftruncate(fileno(i),flen);
			fcloselock(i);
			return;
		}
		fcloselock(i);
		return;
	}
	fwrite(pers,sizeof(PERSONA),1,i);
	fcloselock(i);
}

FILE *openuaf(perm)
char *perm;
{
	FILE *i;
	i=openlock(UAF_RAND,perm);
	if(i==NULL)
	{
		crapup("Cannot access UAF\n");
	}
	return(i);
}

decpers(pers,name,str,score,lev,sex)
PERSONA *pers;
char *name;
long *str,*score,*lev,*sex;
{
	strcpy(name,pers->p_name);
	*str=pers->p_strength;
	*score=pers->p_score;
	*lev=pers->p_level;
	*sex=pers->p_sex;
}

long my_sco;
long my_lev;
long my_str;
long my_sex;
*/

const initme = (state: State): Promise<void> => {
    let errno = 0;
    const x = findpers(state);
    if (x !== -1) {
        const [
            name,
            strength,
            score,
            level,
            sex,
        ] = decpers(x);
        state.my_str = strength;
        state.my_sco = score;
        state.my_lev = level;
        state.my_sex = sex;
        return Promise.resolve();
    }

    if (errno) {
        return crapup(state, 'Panic: Timeout event on user file');
    }

    const moan1 = (state: State) => {
        bprintf(state, '\nSex (M/F) : ');
        return showMessages(state)
            .then(() => {
                keysetback(state);
                const s = getkbd(2).toLowerCase();
                keysetup(state);
                if (s === 'm') {
                    state.my_sex = 0;
                } else if (s === 'f') {
                    state.my_sex = 1;
                } else {
                    bprintf(state, 'M or F');
                    return moan1(state)
                }
            });
    };

    x.score = 0;
    bprintf(state, 'Creating character....\n');
    state.my_sco = 0;
    state.my_str = 40;
    state.my_lev = 1;
    return moan1(state)
        .then(() => putpers(state, state.globme, {
            ...x,
            name: state.globme,
            strength: state.my_str,
            level: state.my_lev,
            sex: state.my_sex,
            score: state.my_sco
        }));
};

const saveme = (state: State): Promise<void> => getPlayer(state, state.mynum)
    .then((player) => {
        if (state.zapped) {
            return;
        }
        const x = {
            name: state.globme,
            strength: state.my_str,
            level: state.my_lev,
            sex: player.flags,
            score: state.my_sco,
        };
        bprintf(state, `\nSaving ${state.globme}\n`);
        return putpers(state.globme, x);
    });

const validname = (state: State, name: string): Promise<boolean> => {
    if (resword(state, name)) {
        bprintf(state, 'Sorry I cant call you that\n');
        return Promise.resolve(false);
    }
    if (name.length > 10) {
        return Promise.resolve(false);
    }
    if (name.indexOf(' ')) {
        return Promise.resolve(false);
    }
    return findItem(state, name)
        .then((item) => {
            if (item.itemId !== -1) {
                bprintf(state, 'I can\'t call you that , It would be confused with an object\n');
                return false;
            }
        })
        .then(() => true);
};

/*
resword(name)
{
if(!strcmp(name,"The")) return(1);
if(!strcmp(name,"Me")) return(1);
if(!strcmp(name,"Myself")) return(1);
if(!strcmp(name,"It")) return(1);
if(!strcmp(name,"Them")) return(1);
if(!strcmp(name,"Him")) return(1);
if(!strcmp(name,"Her")) return(1);
if(!strcmp(name,"Someone")) return(1);
return(0);
}


getpersona(file,pers)
FILE *file;
PERSONA *pers;
{
	if(fread(pers,sizeof(PERSONA),1,file)!=1) return(0);
	return(1);
}

 */
import State from "./state";
import {bprintf} from "./__dummies";
import {isGod, isWizard} from "./newuaf/reducer";
import {setThere} from "./parse/reducer";

/*
#include <stdio.h>

*/
/*
 Zone based name generator
 */
/*
struct zone
{
	char *z_name ;
	long z_loc ;
} ;

typedef struct zone ZONE ;

ZONE zoname[  ]={
    "LIMBO", 1, "WSTORE", 2, "HOME", 4, "START", 5, "PIT", 6, "WIZROOM", 19, "DEAD", 99,
    "BLIZZARD", 299, "CAVE", 399, "LABRNTH", 499, "FOREST", 599, "VALLEY", 699, "MOOR", 799,
    "ISLAND", 899, "SEA", 999, "RIVER", 1049, "CASTLE", 1069, "TOWER", 1099, "HUT", 1101,
    "TREEHOUSE", 1105, "QUARRY", 2199, "LEDGE", 2299, "INTREE", 2499, "WASTE", 99999
    } ;

 findzone( x, str )
 char *str ;
    {
    extern ZONE zoname[] ;
    long a, b ;
    long c ;
    a=0 ;
    b=0 ;
    x= -x ;
    if( x<=0 )
       {
       strcpy( str, "TCHAN" ) ;
       return( 0 ) ;
       }

    while( a<x )
       {
       strcpy( str, zoname[ b ].z_name ) ;
       c=a ;
       a=zoname[ b ].z_loc ;
       b++;
       }
    return( x-c ) ;
    }

long ex_dat[ 7 ] ;
*/

const exits = (state: State): Promise<void> => {
    let b = false;
    bprintf(state, 'Obvious exits are\n');
    for (let a = 0; a < 6; a += 1) {
        if (state.ex_dat[a] >= 0) {
            continue;
        }
        if (!isWizard(state)) {
            bprintf(state, `${dirns[a]}\n`)
        } else {
            const [v, st] = findzone(state, state.ex_dat[a]);
            bprintf(state, `${dirns[a]} : ${st}${v}\n`)
        }
        b = true;
    }
    if (!b) {
        bprintf(state, 'None....\n');
    }
    return Promise.resolve();

};

/*
char *dirns[  ]={"North", "East ", "South", "West ", "Up   ", "Down "} ;

 lodex( file )
 FILE *file;
    {
    long a ;
    extern long ex_dat[] ;
    a=0 ;
    while( a<6 )
       {
       fscanf(file," %ld ",&ex_dat[ a ]);
       a++ ;
       }
    }
*/

const roomnum = (state: State, name: string, roomId: number): number => {
    let b = 0;

    const fnd1 = (zone): number => {
        const c = zone.locationId;
        const d = roomId || 1;
        setThere(state, name, roomId);
        if (!d) {
            return 0;
        }
        if (d + b > c) {
            return 0;
        }
        return -(d + b);
    };

    let c = 0;
    let w = '';
    for (let a  = 0; b < 9999; a += 1) {
        w = zoname[a].name.toLowerCase();
        if (w === name) {
            return fnd1(zoname[a]);
        }
        b = zoname[a].locationId;
        a += 1;
    }
    return 0;
}

const showname = (state: State, loc: number): void => {
    const [b, a] = findzone(state, loc);
    bprintf(state, `${a}${b}`);
    if (isGod(state)) {
        bprintf(state, `[ ${loc} ]`);
    }
    setThere(state, a, b);
    bprintf(state, '\n');
};

const loccom = (state: State): Promise<void> => {
    const l1 = (a: number): Promise<void> => {
        bprintf(state, `${state.zoname[a].name}`);
        if (a % 4 === 3) {
            bprintf(state, '\n');
        }
        if (state.zoname[a + 1].loc !== 99999) {
            return l1(a + 1);
        }
        bprintf(state, '\n');
        return Promise.resolve();
    };

    if (isWizard(state)) {
        bprintf(state, 'Oh go away, thats for wizards\n');
        return Promise.resolve();
    }
    bprintf(state, '\nKnown Location Nodes Are\n\n');
    return l1(0);
};

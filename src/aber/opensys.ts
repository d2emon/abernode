import State from "./state";
import {endGame} from "./gamego/endGame";

/* Fast File Controller v0.1 */

/*
FILE *filrf=NULL;  *//* - = not open *//*

extern FILE *openlock();
closeworld()
{
	extern FILE *filrf;
        extern long objinfo[],numobs,ublock[];
	if(filrf==NULL) return;
	sec_write(filrf,objinfo,400,4*numobs);
	sec_write(filrf,ublock,350,16*48);
	fcloselock(filrf);
	filrf= NULL;
}
 */

const openworld = (state: State): Promise<any> => state.filrf || openlock('/usr/tmp/-iy7AM', 'r+')
    .then((filrf) => {
        state.filrf = filrf;
        state.objinfo = sec_read(state, filrf, 400, state.numobs);
        state.ublock = sec_read(state, filrf, 350, 48);
        return filrf;
    })
    .catch(() => endGame(state, 'Cannot find World file'));
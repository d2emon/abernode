import State from "./state";
import {bprintf} from "./__dummies";
import {showMessages} from "./bprintf/output";

const getNeedPrompt = (state: State): boolean => state.pr_due;
const unsetNeedPrompt = (state: State): void => {
    state.pr_due = false;
};

const setNeedLineBreak = (state: State): void => {
    state.pr_qcr = false;
};

/*  Key drivers */
/*

#include <stdio.h>
#include <termios.h>

long save_flag= -1;

keysetup()
{
*//*
	struct sgttyb x;
	gtty(fileno(stdin),&x);
	save_flag=x.sg_flags;
	x.sg_flags&=~ECHO;
	x.sg_flags|=CBREAK;
	stty(fileno(stdin),&x);
*//*
	struct termios ios;
	tcgetattr(fileno(stdin),&ios);
	save_flag=ios.c_lflag;
	ios.c_lflag&=~(ECHO|ICANON);
	tcsetattr(fileno(stdin),TCSANOW,&ios);
}

keysetback()
{
*//*
	struct sgttyb x;
	if(save_flag== -1) return;
	gtty(fileno(stdin),&x);
	x.sg_flags=save_flag;
	stty(fileno(stdin),&x);
*//*
	struct termios ios;
	tcgetattr(fileno(stdin),&ios);
	ios.c_lflag=save_flag;
	tcsetattr(fileno(stdin),TCSANOW,&ios);
}

char key_buff[256];
char pr_bf[32];
long key_mode= -1;
*/

const key_input = (state: State, prompt: string, maxLength: number): Promise<void> => {
    let currentLength = 0;
    state.key_mode = 0;
    state.pr_bf = prompt;
    bprintf(state, prompt);
    return showMessages(state)
        .then(() => {
            unsetNeedPrompt(state);
            state.key_buff = '';
            return getchar();
        })
        .then((result) => {
            state.key_buff = result;
            console.log(`${result}\n`);
            state.key_mode = -1;
        });
};

const key_reprint = (state: State): Promise<void> => {
    setNeedLineBreak(state);
    return showMessages(state)
        .then(() => {
            if ((state.key_mode === 0) && getNeedPrompt(state)) {
                console.log(`\n${state.pr_bf}${state.key_buff}`)
            }
            unsetNeedPrompt(state);
            return fflush();
        });
};

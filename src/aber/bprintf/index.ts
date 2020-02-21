// Wrappers

export const showFile = (text: string): string => `[f]${text}[/f]`;
export const sendSound = (text: string): string => `[d]${text}[/d]`;
export const sendVisiblePlayer = (player: string, text: string): string => `[s name="${player}"]${text}[/s]`;
export const sendName = (text: string): string => `[p]${text}[/p]`;
export const sendVisibleName = (text: string): string => `[c]${text}[/c]`;
export const sendSoundPlayer = (text: string): string => `[P]${text}[/P]`;
export const sendPlayerForVisible = (text: string): string => `[D]${text}[/D]`;
export const sendKeyboard = (text: string): string => `[l]${text}[/l]`;

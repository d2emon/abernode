interface MessagesInterface {
    messageId: number,
    data: string[],
}

const messages: MessagesInterface[] = [];

export default {
    createMessages: (): Promise<number> => new Promise((resolve) => {
        const messageId = messages.length;
        messages.push({
            messageId,
            data: [],
        });
        return resolve(messageId);
    }),
    getMessages: (messagesId: number): Promise<string> => Promise.resolve(messages[messagesId].data.join('')),
    putMessage: (messagesId: number, message: string): Promise<void> => new Promise(((resolve) => {
        messages[messagesId].data.push(message);
        return resolve();
    })),
    clearMessages: (messagesId: number): Promise<void> => new Promise(((resolve) => {
        messages[messagesId].data = [];
        return resolve();
    })),
};

export const numberGame = {
    async number(ctx) {
        const randomNumber = Math.floor(Math.random() * 100) + 1
        ctx.session.randomNumber = randomNumber
        ctx.session.attempts = 0;
        ctx.reply('badger thinks of a number between 1 and 100... which is it?');
    }
}
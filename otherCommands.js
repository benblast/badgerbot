export const otherCommands = {
    async biteballs(ctx) {
        try {
            const username = ctx.message.from.first_name
            const insult = await axios.get('https://insult.mattbas.org/api/insult')
        
            let insult_display = insult.data.toLowerCase()
            let message = `stfu ${username} ${insult_display}`
            await ctx.replyWithMarkdown(message, {parse_mode: "HTML", reply_to_message_id: ctx.message.message_id})
        } catch(err) {
            console.log(err)
            await ctx.reply(`uhh stfu ${username}`)
        }
    }
}
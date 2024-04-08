import axios from 'axios'
async function sendToApi(q, username) {
    let response = await axios.post('http://localhost:5000/query', {
        question: q,
        user: username
      })
      console.log(response.data.response.choices[0])
    const ai_bullshit_reply = response.data.response.choices[0].text
    const startIndex = ai_bullshit_reply.indexOf("### Response:");

    // Take the substring after "A: [/INST]"
    const extractedText = ai_bullshit_reply.substring(startIndex + 13)

    console.log(extractedText)
    return extractedText
}
export const otherCommands = {
    async biteballs(ctx) {
        const username = ctx.message.from.first_name
        try {
            const insult = await axios.get('https://insult.mattbas.org/api/insult')
        
            let insult_display = insult.data.toLowerCase()
            let message = `stfu ${username} ${insult_display}`
            await ctx.replyWithMarkdown(message, {parse_mode: "HTML", reply_to_message_id: ctx.message.message_id})
        } catch(err) {
            console.log(err)
            await ctx.reply(`uhh stfu ${username}`)
        }
    },
    async askbadger(ctx) {
        const username = ctx.message.from.first_name
        try {
            const commandText = ctx.message.text.replace('/askbadger', '').trim();
            if(commandText === '') throw err
            const aiResponse = await sendToApi(commandText, username)


            await ctx.replyWithMarkdown(aiResponse, {parse_mode: "HTML", reply_to_message_id: ctx.message.message_id})
        } catch(err) {
            console.log(err)
            await ctx.reply(`uhh stfu ${username}`)
        }
    }
}
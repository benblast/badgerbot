import axios from 'axios'

async function sendToApi(q) {
    await axios.post('http://localhost:5000/query', {
        question: q
      })
      .then(response => {
        const ai_bullshit_reply = response.data.response.choices[0].text
        const startIndex = ai_bullshit_reply.indexOf("A: [/INST]");

        // Take the substring after "A: [/INST]"
        const extractedText = ai_bullshit_reply.substring(startIndex + 10)

        console.log(extractedText)
      })
      .catch(error => {
        console.error('Error:', error);
      });
}
export const otherCommands = {
    async askbadger(ctx) {
        const username = ctx.message.from.first_name
        try {
            const commandText = ctx.message.text.replace('/askbadger', '').trim();
            const aiResponse = await sendToApi(commandText)
        
            await ctx.replyWithMarkdown(aiResponse, {parse_mode: "HTML", reply_to_message_id: ctx.message.message_id})
        } catch(err) {
            console.log(err)
            await ctx.reply(`uhh stfu ${username}`)
        }
    }
}
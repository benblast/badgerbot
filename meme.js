import dotenv from 'dotenv';
dotenv.config();
import axios from 'axios'
import fs from 'fs'
import {createCanvas, loadImage} from 'canvas'



async function downloadImage(filePath) {
    const fileUrl = `https://api.telegram.org/file/bot${process.env.token}/${filePath}`;
    const response = await axios({
        url: fileUrl,
        method: 'GET',
        responseType: 'stream'
    })

    const writer = fs.createWriteStream('downloaded_image.jpg');

    response.data.pipe(writer)

    await new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
    });

    console.log('Image downloaded successfully.');
}

async function cleanUp() {
    try {
        // Delete the file synchronously
        fs.unlinkSync('mergedOutput.png');
        fs.unlinkSync('downloaded_image.jpg');
        console.log('File deleted successfully');
      } catch (err) {
        console.error('Failed to delete the file:', err);
      }
}

async function mergeImages(bg, overlay) {
    // Load the background and overlay images
    const backgroundImage = await loadImage(bg); // Load the background image
    const overlayImage = await loadImage(overlay); // Load the image to overlay

    // Get the dimensions of the background image
    const width = backgroundImage.width;
    const height = backgroundImage.height;

    // Create a canvas with the same dimensions as the background image
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Draw the background image on the canvas
    ctx.drawImage(backgroundImage, 0, 0, width, height);

    // Draw the overlay image scaled to the background image's dimensions
    ctx.drawImage(overlayImage, 0, 0, width, height); // This scales the overlay image


    // Convert the canvas to a Buffer
    const buffer = canvas.toBuffer('image/png');

    // Save the buffer to a file asynchronously
    fs.promises.writeFile('mergedOutput.png', buffer).then(() => {
        console.log('Merged image saved successfully!');
    }).catch(err => {
        console.error('Failed to save the merged image:', err);
    });
}

export const memeBot = {
    async memePhoto(ctx) {
    // Check if the photo message has a caption and if it matches '/meme'
        if (ctx.message.caption && ctx.message.caption.toLowerCase().includes('/meme')) {
            // Get the file ID of the photo
            const fileId = ctx.message.photo[ctx.message.photo.length - 1].file_id;

            //let filePath = await axios.get(`https://api.telegram.org/bot${token}/getFile?file_id=${fileId}`)
            //console.log('FUCKING FILEPATH FUCK GOUY TELEGRAM', filePath)

            const downloadUrl = `https://api.telegram.org/bot${process.env.token}/getFile?file_id=${fileId}`
            const res = await axios.get(downloadUrl)
            const filePath = res.data.result.file_path;
            await downloadImage(filePath)

            await mergeImages('downloaded_image.jpg', 'tv_logo.png')

            //await sharp(layers[0].input).composite(layers).toFile('./assets/the_meme_to_send.png')

            // You can then process the photo as needed. For simplicity, this example just echoes the photo back.
            await ctx.replyWithPhoto({ source: 'mergedOutput.png' }, {caption: `nice meme ${ctx.from.first_name}`,reply_to_message_id: ctx.message.message_id})

            await cleanUp()
        }
    },
    async memeReply(ctx) {
        if (ctx.message.text.trim() === '/meme' && ctx.message.reply_to_message && ctx.message.reply_to_message.photo) {
            // Get the largest available photo size
            const photo = ctx.message.reply_to_message.photo[ctx.message.reply_to_message.photo.length - 1];
            
            // Extract the file_id of the photo
            const fileId = photo.file_id;
            const downloadUrl = `https://api.telegram.org/bot${process.env.token}/getFile?file_id=${fileId}`
            const res = await axios.get(downloadUrl)
            const filePath = res.data.result.file_path
            await downloadImage(filePath)
            await mergeImages('downloaded_image.jpg', 'tv_logo.png')
            await ctx.replyWithPhoto({ source: 'mergedOutput.png' }, {caption: `nice meme ${ctx.from.first_name}`,reply_to_message_id: ctx.message.message_id})
            await cleanUp();
        }
    }

}



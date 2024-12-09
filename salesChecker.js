// salesChecker.js
import moment from 'moment'
import dotenv from 'dotenv'
import axios from 'axios'
dotenv.config()

// the honey bastards contract addy
const contractAddress = '0xcf24db2b8bDA5E1c93fC4Fa045C78c2cD73Ec991'


// last checked timestamp
let lastCheckedTimestamp = moment().subtract(5, 'minutes').unix()

export async function getNFTSales() {
  try {
    // build the call to reservoir
    const options = {
        method: 'GET',
        url: `https://api.reservoir.tools/sales/v4?collection=${contractAddress}&startTimestamp=${lastCheckedTimestamp}`,
        headers: {accept: '*/*', 'x-api-key': `${process.env.reservoir_api}`}
    }

    const response = await axios.request(options)

    const sales = response.data.sales;
    lastCheckedTimestamp = moment().unix()

    return sales
  } catch (error) {
    console.error('Error fetching NFT sales:', error)
    return []
  }
}

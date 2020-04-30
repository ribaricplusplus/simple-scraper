const puppeteer = require('puppeteer')
const fs = require("fs")

async function scrape(page){
  console.log("Starting the scraping process...")
  const tableHandle = await page.$('.js_equities_lists')
  const tableBodyHandle = await tableHandle.$('tbody')
  const rowHandles = await tableBodyHandle.$$('tr')
  for (let rowHandle of rowHandles){
    const columnHandles = await rowHandle.$$('td')
    await scrapeRowEntry(columnHandles)
  }
  process.exit(0)
}

async function scrapeRowEntry(columnHandles){

}

process.on('message', (message) => {
  console.log("Child: received message ", message)
  puppeteer.connect({browserWSEndpoint: message.endpoint})
  .then((browser) => {
    browser.pages()
    .then(pageArray => {
      scrape(pageArray[0])
    })
    .catch(err => {
      console.error(err)
    })
  })
  .catch(err => {
    console.error(err)
  })
})
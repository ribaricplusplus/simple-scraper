const puppeteer = require('puppeteer')
const fs = require('fs')

let fd, pageCounter = 0
const PAGE_COUNT = 61


const dataNames = ['Code', 'Name', 'Last', 'Change %', 'Turnover', 'Market Cap'] // Order is important
const writeStream = fs.createWriteStream('extracted_data.csv')
writeStream.write(dataNames.join(',') + '\n')
registerOutputFileListeners(writeStream)

async function scrape(page) {
  while (morePagesExist()) {
    await gotoNextPage(page)
    const tableHandle = await page.$('.js_equities_lists')
    const tableBodyHandle = await tableHandle.$('tbody')
    const rowHandles = await tableBodyHandle.$$('tr')
    console.log("Obtained table rows")
    for (let rowHandle of rowHandles) {
      const columnHandles = await rowHandle.$$('td')
      await scrapeRowEntry(columnHandles, writeStream)
    }
  }
  console.log("Scraping finished")
  fs.closeSync(fd)
  process.exit()
}

async function gotoNextPage(page) {
  if (pageCounter === 1) return
  const pageInputHandle = await page.$('.search_input.showEquities_page_no')
  await pageInputHandle.type(String(pageCounter))
  await page.click('.pagination .search')
  await new Promise((res) => {
    setTimeout(res, 500)
  })
  console.log(`Navigating to page ${pageCounter}`)
}

function morePagesExist() {
  ++pageCounter;
  if (pageCounter <= PAGE_COUNT) return true
  else return false
}

function registerOutputFileListeners() {
  writeStream.on('open', descriptor => {
    console.log(`Created output file with descriptor ${fd}`)
    fd = descriptor
  })
  writeStream.on('close', () => {
    console.log("Closing output file stream")
  })
}

async function scrapeRowEntry(columnHandles, writeStream) {
  console.group("Scraping row entry on page " + pageCounter)
  let data = []
  const codeColumn = columnHandles[0]
  columnHandles.shift()
  data[0] = await codeColumn.$eval('a', a => a.innerHTML)
  console.log("Extracted code ", data[0])
  for (let i = 0; i < columnHandles.length; ++i) {
    data[i + 1] = await columnHandles[i].evaluate(td => td.innerHTML)
    console.log(`Extracted ${dataNames[i + 1]}`, data[i + 1])
  }
  await new Promise((resolve, reject) => {
    writeStream.write(data.join(',') + '\n', err => {
      if (err) reject(err)
      resolve()
    })
  })
  console.log("Row entry scraped.")
  console.groupEnd()
}

process.on('message', (message) => {
  console.log("Child: received message ", message)
  puppeteer.connect({ browserWSEndpoint: message.endpoint })
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
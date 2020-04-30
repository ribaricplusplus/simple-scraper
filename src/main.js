const puppeteer = require('puppeteer')
const cp = require('child_process')
const repl = require('repl')

let childProcess
let wsEndpoint
let browserRef

async function loadPage(){
  console.log("Starting to load page.")
  const browser = await puppeteer.launch()
  browserRef = browser
  wsEndpoint = browser.wsEndpoint()
  console.log(`Obtained wsEndpoint ${wsEndpoint}`)
  const page = await browser.newPage()
  console.log("Obtained new page")
  await page.goto('http://english.sse.com.cn/markets/equities/data/', {timeout: 60000})
  console.log("Page loaded")
}

function startScraper(){
  childProcess = cp.fork('src/script.js', {stdio: 'inherit'})
  childProcess.on('error', (err) => {
    console.log("Child returned error")
    console.error(err)
  })

  childProcess.on('exit', (code) => {
    console.log("Child exited with code ", code)
  })

  childProcess.send({endpoint: wsEndpoint}, (err) => {
    if (err) console.error(err)
  })
}

function stopScraper(){
  childProcess.kill()
}

const server = repl.start()

server.context.startChild = startScraper
server.context.stopChild = stopScraper
loadPage()
server.on('exit', () => {
  console.log("Exiting...")
  process.exit()
})
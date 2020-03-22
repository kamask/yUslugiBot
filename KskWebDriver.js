const {Builder, Key, until, WebDriver} = require('selenium-webdriver')
const chrome = require('selenium-webdriver/chrome')

class self{

    static key = Key
    static until = until
    static WD = WebDriver

    async building(browser, visible = false){
        try{
            this.d = visible ? await new Builder().forBrowser(browser).build() : await new Builder().forBrowser(browser).setChromeOptions(new chrome.Options().headless()).build()
            this.state = {}
            this.key = self.key
            return this
        }catch(e){
            console.error(e)
            return false
        }
    }

    find(locator, time = undefined){
        return this.d.wait(until.elementLocated(locator), time)
    }

    reload(t = 0){
        return new Promise(resolve => {
            setTimeout(async () => {
                await this.d.navigate().refresh()
                resolve(true)
            }, t)
        })
    }
}

module.exports = self
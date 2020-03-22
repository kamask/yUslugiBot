const log = (...m) => console.log(...m)
const TBot = require('./KskTelegramBot')
const WD = require('./KskWebDriver')

class self {
    static wdGT = null
    static wdTA = null

    static urlTasks(count){
        return 'https://yandex.ru/uslugi/api/orders?max_reactions_count=30&numdoc='+count+'&p=0&region=10738-%D0%9B%D1%8E%D0%B1%D0%B5%D1%80%D1%86%D1%8B&region=21651-%D0%9A%D0%BE%D1%82%D0%B5%D0%BB%D1%8C%D0%BD%D0%B8%D0%BA%D0%B8&region=101060-%D0%A2%D0%BE%D0%BC%D0%B8%D0%BB%D0%B8%D0%BD%D0%BE&region=213-%D0%9C%D0%BE%D1%81%D0%BA%D0%B2%D0%B0&region=121006-%D0%B3%D0%BE%D1%80%D0%BE%D0%B4%D1%81%D0%BA%D0%BE%D0%B9%20%D0%BE%D0%BA%D1%80%D1%83%D0%B3%20%D0%9A%D0%BE%D1%82%D0%B5%D0%BB%D1%8C%D0%BD%D0%B8%D0%BA%D0%B8&rubric=%2Fkomp_utery-i-it%2Fkomp_uternaa-pomos_'
    }

    static async init(){
        self.wdGT = await new WD().building('chrome') // GT - Get Task

        self.wdTA = await new WD().building('chrome', true) // TA - Task Answer

        let auth, authTrying = 1
        do{
            if(authTrying++ > 1) log('Auth try - ' + (authTrying))
            await self.wdTA.d.get('https://passport.yandex.ru/auth?origin=uslugi&retpath=https://yandex.ru/uslugi/')
            const res = await self.wdTA.d.executeAsyncScript(() => {
                let csrf = document.getElementsByName('csrf_token')[0].value
                fetch('/registration-validations/auth/multi_step/start', {
                    headers: {
                        "Accept": "application/json, text/javascript, */*; q=0.01",
                        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8"
                    },
                    method: 'POST',
                    body: 'csrf_token='+csrf+'&login='+arguments[0]+'&process_uuid='+document.querySelector(".passp-exp-register-button .passp-form-button").getAttribute('href').match(/process_uuid=([^&]*).*/)[1]+'&retpath=https%3A%2F%2Fyandex.ru%2Fuslugi%2F&origin=uslugi'
                }).then(async res =>{
                    res = await res.json()
                    const r = await fetch('/registration-validations/auth/multi_step/commit_password', {
                        headers: {
                            "Accept": "application/json, text/javascript, */*; q=0.01",
                            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8"
                        },
                        method: 'POST',
                        body: 'csrf_token='+csrf+'&password='+arguments[1]+'&track_id='+res.track_id
                    })
                    arguments[2](r.json())
                }).catch(e=>{
                    arguments[2](e)
                })
            }, process.env.YANDEX_LOGIN, process.env.YANDEX_PASS)
            auth = res.status === 'ok'
        }while(!auth)

        log('WebDriver: Task Answer - auth!')
        if(TBot.auth) TBot.send('sendMessage', {text: 'Task Answer - auth!'})
    }
}


module.exports = self
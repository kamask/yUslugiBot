const log = (...m) => console.log(...m)
const rp = require('request-promise')

class self{
    static bot = null
    static handlers = {string: new Map(), regexp: new Map(), callback: new Map()}
    static #uri = (process.env.TELEGRAM_BOT_PROXY || 'https://api.telegram.org') + '/bot' + process.env.TELEGRAM_BOT_TOKEN + '/'
    static #chatId = process.env.TELEGRAM_BOT_CHAT_ID || null
    static auth = Boolean(self.#chatId)

    static text(t, cb){
        if(typeof t === 'string') self.handlers.string.set(t, cb)
        else if(t instanceof RegExp) self.handlers.regexp.set(t, cb)
        else throw new Error('Telegram bot handler text fail type string parameter')
    }

    static callback(re, cb){
        self.handlers.callback.set(re, cb)
    }

    static async listenWebhook(req, res){
        req.on('data', data => {
            try{
                data = JSON.parse(data.toString())
                if('message' in data){
                    const m = data.message
                    if('text' in m){
                        if(m.text !== '/start' && self.#chatId !== String(m.chat.id)) throw new Error('chatId is no correct')
                        let handler = self.handlers.string.get(m.text)
                        if(!handler){
                            for(let re of self.handlers.regexp.keys()){
                                const match = m.text.match(re)
                                if(match){
                                    m.match = match
                                    handler = self.handlers.regexp.get(re)
                                    break
                                }
                            }
                        }
                        handler(m)
                    }
                }

                if('callback_query' in data){
                    self.send('answerCallbackQuery', {'callback_query_id': data.callback_query.id})
                    for(let re of self.handlers.callback.keys()){
                        const match = data.callback_query.data.match(re)
                        if(match){
                            self.handlers.callback.get(re)(match, data.callback_query.message.message_id)
                            break
                        }
                    }
                }
            }catch(e){
                console.error(e)
            }
        })
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end('{"status":"ok"}')
    }

    static send(method, data, chatId = null){
        return new Promise((resolve, reject) => {
            data.chat_id = chatId || self.#chatId
            if(!data.chat_id) reject(new Error('Telegram bot ChatId not found'))
            resolve(rp({
                method: 'POST',
                uri: self.#uri + method,
                json: true,
                body: data
            }))
        })
    }

}

module.exports = self
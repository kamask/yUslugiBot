const log = (...m) => console.log(...m)
const rp = require('request-promise')
const TBot = require('./KskTelegramBot')
const YBot = require('./KskYUslugiBot')

function dateFormat(d){
    d*=1000
    let now = new Date(Date.now()), tomorrow = new Date(Date.now()+(1000*3600*24)), afterTomorrow = new Date(Date.now()+(1000*3600*48)), i = new Date(d)
    return i.getMonth() === now.getMonth() && i.getDate() === now.getDate() ? i.toLocaleString('ru-RU', { hour: 'numeric', minute: 'numeric'}) :
        i.getMonth() === tomorrow.getMonth() && i.getDate() === tomorrow.getDate() ? 'завтра ' + i.toLocaleString('ru-RU', { hour: 'numeric', minute: 'numeric'}) :
            i.getMonth() === afterTomorrow.getMonth() && i.getDate() === afterTomorrow.getDate() ?
                'послезавтра (' + i.toLocaleString('ru-RU', { day: 'numeric', month: 'long'}) + ') ' + i.toLocaleString('ru-RU', { hour: 'numeric', minute: 'numeric'}) :
                i.toLocaleString('ru-RU', { day: 'numeric', month: 'long', hour: 'numeric', minute: 'numeric'})
}

class self {
    constructor(o){
        this.id = o.id
        this.createTime = o.createTime
        this.title = o.title
        this.text = o.description
        this.address = o.address.name
        if('price' in o) this.price = o.price.amount
        if(!/#/.test(o.customerName)) this.customerName = o.customerName
        this.docs = o.docs
        this.reactionsCount = o.reactionsCount
        if('date' in o){
            const start =  new Date(o.date.dateFrom+'T00:00:00.000+03:00')
            const end =  new Date(o.date.dateTo+'T00:00:00.000+03:00')
            const day =  o.date.timeOfDay === 'allday' ? 'в течение всего дня' : o.date.timeOfDay === 'day' ? 'днём (с 12 до 17)' : o.date.timeOfDay === 'evening' ? 'вечером (с 17 до 22)' : o.date.timeOfDay === 'morning' ? 'утром (до 12)' :  o.date.timeOfDay === 'night' ? 'ночью (после 22)' : o.date.timeOfDay
            function dateFormatWithOnlyDate(d){
                const s = 86400000
                const t = new Date(new Date().toDateString())
                return d - t === 0 ? 'сегодня' : d - t === s ? 'завтра' : d - t === s*2 ? 'послезавтра('+ d.toLocaleString('ru-RU', { day: 'numeric', month: 'long'}) + ')' : d.toLocaleString('ru-RU', { day: 'numeric', month: 'long'})
            }

            if(end - start === 0){
                this.date = dateFormatWithOnlyDate(end) + ' ' + day
            }else{
                this.date = dateFormatWithOnlyDate(start) + ' - ' + dateFormatWithOnlyDate(end) + ' ' + day
            }
        }
    }

    async sendToTelegram(){
        this.tgText = `${dateFormat(this.createTime)}
<b><a href="https://yandex.ru/uslugi/order/${this.id}">${this.title}</a></b>
${this.text}
--------------------
${this.address ? 'Адрес: <a href="https://yandex.ru/maps/?text='+this.address+'">'+ this.address + '</a>\n\n' : ''}${this.date ? 'Время: '+this.date+'\n\n' : ''}${this.price ? 'Оплата: '+this.price+'\n\n' : ''}${this.customerName ? 'Имя: '+this.customerName+'\n\n' : ''}Откликов: ${this.reactionsCount}
`
        await TBot.send('sendMessage',{
            text: this.tgText,
            parse_mode: 'HTML',
            disable_web_page_preview: true,
            reply_markup: {
                inline_keyboard: [
                    [{text:'Предложить помощь', callback_data: 'answer_'+this.id}]
                ]
            }
        })

        if(this.docs.length > 0){
            this.docs.forEach( async i => {
                await TBot.send('sendPhoto',{photo: i+'/bigger', caption: this.title})
            })
        }
    }

    async sendAnswer(){
        const answerText = `Здравствуйте${this.answer.name ? ' '+this.answer.name : ''}!
Готов ${this.answer.remote ? 'приступить ' : 'приехать '} ${this.answer.time[0] === '0' ? '' : require('./templateData').time[Number(this.answer.time[0])] + ' или '}в удобное для Вас время и дату${this.answer.time[1] === '1' ? ', на данный момент свободен' : ''}. Согласен на ${this.answer.price}руб.

${this.answer.template ? this.answer.template+'\n' : ''}Мой сайт-визитка с более подробной информацией - mskmaster.tilda.ws

Всю работу провожу быстро и качественно! Работаю на репутацию!
Обращайтесь!
`

        await YBot.wdTA.d.get('https://yandex.ru/uslugi/order/'+this.id)
        const res = await YBot.wdTA.d.executeAsyncScript(async ()=>{
            const scripts = document.getElementsByTagName('script')
            const script = scripts.length > 0 ? scripts[0].innerText : ''
            const match = script.match(/window.__CSRF_TOKEN__="([a-z\d]+:\d+)";window.__USER_REGION_ID__/)
            const csrf = match.length > 1 ? match[1] : ''
            const res = await fetch('/uslugi/api/create_order_reaction', {
                headers: {
                    "Accept": "application/json, text/plain, */*; q=0.01",
                    "Content-Type": "application/json;charset=UTF-8",
                    "x-csrf-token": csrf
                },
                method: 'POST',
                body: JSON.stringify({data:{
                    params:{
                        order_id: arguments[0],
                        order_reaction_info: {
                            text: arguments[1],
                            desired_datetime: null,
                            price: {
                                measure: 'service',
                                amount: Number(arguments[2])
                            },
                            photo_urls: []
                        }
                    }
                    }})
            })
            arguments[3](res.json())
        }, this.id, answerText, this.answer.price)
        YBot.wdTA.reload()
        return res.remainingReactionsCount
    }
}
module.exports = self
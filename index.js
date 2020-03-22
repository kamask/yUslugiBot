const log = (...m) => console.log(...m)
const TBot = require('./KskTelegramBot')
const YBot = require('./KskYUslugiBot')
const Task = require('./KskYUslugiTask')
const http = require('http')
let restart = false, stop = false, currentLtTime = 0

http.createServer({}, TBot.listenWebhook).listen(3001)


const tasks = new Map()
global.exitApp = false
;(async function() {
    while(!exitApp){
        try{
            log('Bot runing!')

            await YBot.init()

            while(YBot.wdGT){

                if(restart){
                    restart = false
                    break
                }
                if(stop){
                    stop = false
                    exitApp = true
                    break
                }

                await YBot.wdGT.d.get(YBot.urlTasks(15))
                const newTasks = JSON.parse((await YBot.wdGT.d.executeScript(()=>document.getElementsByTagName('pre')[0].innerText))).orders.items
                let newCurrentLtTime = 0, i = 0;
                for(let t in newTasks){

                    if(newTasks[t].status !== 'open') continue
                    if(currentLtTime >= newTasks[t].createTime) break

                    if(!currentLtTime){
                        let task = new Task(newTasks[t])
                        tasks.set(t, task)
                        log('\nNew task - '+ task.title + ' | ' + new Date().toLocaleString('ru'))
                        currentLtTime = task.createTime
                        await task.sendToTelegram()
                        break
                    }

                    let task = new Task(newTasks[t])
                    tasks.set(t, task)
                    log('\nNew task - '+ task.title + ' | ' + new Date().toLocaleString('ru'))
                    await task.sendToTelegram()

                    if(i === 0) newCurrentLtTime = newTasks[t].createTime
                    i = 1
                }

                if(newCurrentLtTime > currentLtTime) currentLtTime = newCurrentLtTime

                await YBot.wdGT.d.sleep(1000)
            }

        }catch (e) {
            console.error(e)
        }finally {
            YBot.wdGT = null
            YBot.wdTA = null
            currentLtTime = 0
        }
    }
    log('ExitApp is True')

    if(TBot.auth) TBot.send('sendMessage', {text: 'ExitApp is True'})
})()




TBot.send('sendMessage', {text: 'Bot running!'})

TBot.text('/start', m => {
    TBot.send('sendMessage', {text: m.chat.id}, m.chat.id)
    TBot.send('deleteMessage', {message_id: m.message_id}, m.chat.id)
})

TBot.text('/restart', m => {
    restart = true
    TBot.send('sendMessage', {text: 'Bot restarting'})
    TBot.send('deleteMessage', {message_id: m.message_id})
})

TBot.text('/stop', m => {
    stop = true
    TBot.send('deleteMessage', {message_id: m.message_id})
})

TBot.text('last', m => {
    currentLtTime = 0
    TBot.send('deleteMessage', {message_id: m.message_id})
})

let waitData = null

TBot.text(/.*/, m => {
    TBot.send('deleteMessage', {message_id: m.message_id})
    if(!waitData) return
    switch (waitData.type){
        case 'name':
            setName(m.match[0], waitData.taskId)
            break
        case 'template':
            setTemplate(m.match.input, waitData.taskId)
            break
    }
    waitData = null
})

function cbb(text, callback_data){
    return {text, callback_data}
}

TBot.callback(/^answer_([a-z\d-]*)$/, (match, mid)=>{
    const task = tasks.get(match[1])
    task.mid = mid
    task.answer = {info: '\n********************'}
    if(task.customerName){
        TBot.send('editMessageText',{
            message_id: task.mid,
            text: task.tgText,
            parse_mode: 'HTML',
            disable_web_page_preview: true,
            reply_markup: {
                inline_keyboard: [
                    [
                        cbb(task.customerName, 'name_'+task.id+'_0'),
                        cbb('Ввести', 'name_'+task.id+'_1'),
                        cbb('Без имени', 'name_'+task.id+'_2')
                    ],
                    [cbb('Отмена', 'cancel_'+task.id)]
                ]
            }
        })
    }else{
        setName('', task.id)
    }
})

TBot.callback(/^name_([a-z\d-]*)_(\d)$/, match => {
    const task = tasks.get(match[1])
    if(match[2] === '1'){
        waitData = {type: 'name', taskId: match[1]}
        TBot.send('editMessageText',{
            message_id: task.mid,
            text: task.tgText+`
********************
Введите имя вручную...`,
            parse_mode: 'HTML',
            disable_web_page_preview: true
        })
    }else{
        setName(match[2] === '0' ? task.customerName : '', match[1])
    }
})

function setName(name, id){
    const task = tasks.get(id)
    task.answer.name = name
    task.answer.info += '\nИмя: ' + (name ? name : 'нет')
    TBot.send('editMessageText',{
        message_id: task.mid,
        text: task.tgText + task.answer.info,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
        reply_markup: require('./kbs/kbTemplates')(id)
    })
}

TBot.callback(/^template_([a-z\d-]*)_(\d\d?)/, match => {
    const task = tasks.get(match[1])
    if(match[2] === '10'){
        waitData = {taskId: match[1], type: 'template'}
        TBot.send('editMessageText',{
            message_id: task.mid,
            text: task.tgText+`
********************
Введите текст вручную...`,
            parse_mode: 'HTML',
            disable_web_page_preview: true
        })
    }else{
        if(match[2] === '9') task.answer.remote = true
        setTemplate(require('./templateData').templateText[match[2]], match[1])
    }
})

function setTemplate(text, id){
    const task = tasks.get(id)
    task.answer.template = text
    task.answer.info += '\nШаблон: ' + task.answer.template
    TBot.send('editMessageText',{
        message_id: task.mid,
        text: task.tgText + task.answer.info,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
        reply_markup: require('./kbs/kbTime')(id)
    })
}

TBot.callback(/^time_([a-z\d-]*)_(\d)(\d)/, match => {
    const task = tasks.get(match[1])
    task.answer.time = [match[2], match[3]]
    task.answer.info += '\nВремя: ' + require('./templateData').time[match[2]] + (match[3] === '1' ? ', сейчас свободен' : '')
    TBot.send('editMessageText',{
        message_id: task.mid,
        text: task.tgText + task.answer.info,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
        reply_markup: require('./kbs/kbPrice')(task.id)
    })
})

TBot.callback(/^price_([a-z\d-]*)_(\d{3,5})/, match => {
    const task = tasks.get(match[1])
    task.answer.price = match[2]
    task.answer.info += '\nОплата: '+match[2]+'руб.'
    TBot.send('editMessageText',{
        message_id: task.mid,
        text: task.tgText + task.answer.info,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
        reply_markup: {
            inline_keyboard: [
                [cbb('Подтвердить', 'access_'+task.id), cbb('Отмена', 'cancel_'+task.id)]
            ]
        }
    })
})

TBot.callback(/^access_([a-z\d-]*)$/, async match => {
    const task = tasks.get(match[1])
    TBot.send('editMessageText',{
        message_id: task.mid,
        text: task.tgText + '--------------------\nОтправка предложения...',
        parse_mode: 'HTML',
        disable_web_page_preview: true,
        reply_markup: {}
    })
    const otv = await task.sendAnswer()
    TBot.send('editMessageText',{
        message_id: task.mid,
        text: task.tgText + '--------------------\nПредложение оставлено.\nОсталось ' + otv + ' откликов сегодня.',
        parse_mode: 'HTML',
        disable_web_page_preview: true,
        reply_markup: {}
    })
})

TBot.callback(/^cancel_([a-z\d-]*)$/, (match, mid)=>{
    const task = tasks.get(match[1])
    delete task.answer
    TBot.send('editMessageText',{
        message_id: mid,
        text: task.tgText,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
        reply_markup: {
            inline_keyboard: [
                [cbb('Предложить помощь', 'answer_'+task.id)]
            ]
        }
    })
})
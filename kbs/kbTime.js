const templateData = require('../templateData')

module.exports = id => {
    return {
        inline_keyboard: [
            [
                {text: templateData.time[0], callback_data: 'time_' + id + '_00'},
                {text: 'Свободен', callback_data: 'time_' + id + '_01'}
            ],[
                {text: templateData.time[1], callback_data: 'time_' + id + '_10'},
                {text: 'Свободен', callback_data: 'time_' + id + '_11'}
            ],[
                {text: templateData.time[2], callback_data: 'time_' + id + '_20'},
                {text: 'Свободен', callback_data: 'time_' + id + '_21'}
            ],[
                {text: templateData.time[3], callback_data: 'time_' + id + '_30'},
                {text: 'Свободен', callback_data: 'time_' + id + '_31'}
            ],[
                {text: templateData.time[4], callback_data: 'time_' + id + '_40'},
                {text: 'Свободен', callback_data: 'time_' + id + '_41'}
            ],[
                {text: 'Отмена', callback_data: 'cancel_' + id}
            ]
        ]
    }
}
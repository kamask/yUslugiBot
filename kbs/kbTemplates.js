const templateData = require('../templateData')

module.exports = id => {
    return {
        inline_keyboard: [
            [
                {text: templateData.templateName[0], callback_data: 'template_'+id+'_0'},
                {text: templateData.templateName[1], callback_data: 'template_'+id+'_1'},
                {text: templateData.templateName[2], callback_data: 'template_'+id+'_2'}
            ],[
                {text: templateData.templateName[3], callback_data: 'template_'+id+'_3'},
                {text: templateData.templateName[4], callback_data: 'template_'+id+'_4'}
            ],[
                {text: templateData.templateName[5], callback_data: 'template_'+id+'_5'},
                {text: templateData.templateName[6], callback_data: 'template_'+id+'_6'},
                {text: templateData.templateName[7], callback_data: 'template_'+id+'_7'}
            ],[
                {text: templateData.templateName[8], callback_data: 'template_'+id+'_8'},
                {text: templateData.templateName[9], callback_data: 'template_'+id+'_9'},
                {text: 'Ввести', callback_data: 'template_'+id+'_10'}

            ],[
                {text: 'Отмена', callback_data: 'cancel_'+id}
            ]
        ]
    }
}
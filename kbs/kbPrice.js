module.exports = id => {
    function cbb(text, callback_data){
        return {text, callback_data}
    }
    function cbbPrice(a){
        return cbb(String(a), 'price_'+id+'_'+a)
    }
    return {
        inline_keyboard: [
            [
                cbbPrice(500),
                cbbPrice(800),
                cbbPrice(1000),
                cbbPrice(1200),
                cbbPrice(1500),
                cbbPrice(1800)
            ],[
                cbbPrice(400),
                cbbPrice(2000),
                cbbPrice(2200),
                cbbPrice(2500),
                cbbPrice(2800)
            ],[
                cbbPrice(3000),
                cbbPrice(3500),
                cbbPrice(4000),
                cbbPrice(4500),
                cbbPrice(5000),
                cbbPrice(5500)
            ],[
                cbbPrice(6000),
                cbbPrice(6500),
                cbbPrice(7000),
                cbbPrice(8000),
                cbbPrice(9000)
            ],[
                cbbPrice(10000),
                cbbPrice(11000),
                cbbPrice(12000),
                cbbPrice(13000),
                cbbPrice(15000)
            ],[
                cbb('Отмена','cancel_'+id)
            ]
        ]
    }
}

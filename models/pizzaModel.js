const mongoose = require("mongoose");

const pizzaSchema = mongoose.Schema(){
    name: {type: String, require},
    varients: [],
    prices: [],
    category: {type: String, require},
    image: {type: String, require},
    description: {Type: String, require}
}, {
    timestamp: true,
}

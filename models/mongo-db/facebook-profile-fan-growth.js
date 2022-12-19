const mongoose = require('mongoose');
const { Schema } = mongoose;


const FacebookProfileFanGrowthSchema = new Schema({
    profile_id: {
        type: Number,
        required: true,
    },
    fan_count: {
        type: Number,
        required: true,
    },
    fan_growth: {
        type: Number, 
        required: true,
        default: 0
    },
    date: {
        type: String,
        required: true,
    },
},
{timestamps: true},
);

const FacebookProfileFanGrowth = mongoose.model('facebook_profile_fan_growths', FacebookProfileFanGrowthSchema);

module.exports = FacebookProfileFanGrowth;
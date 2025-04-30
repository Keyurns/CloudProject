const mongoose = require('mongoose');

const ExpenseSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a name'],
        trim: true
    },
    amount: {
        type: Number,
        required: [true, 'Please add an amount'],
        min: [0, 'Amount cannot be negative']
    },
    category: {
        type: String,
        required: [true, 'Please add a category'],
        enum: ['Food', 'Transport', 'Shopping', 'Entertainment', 'Health', 'Education', 'Bills', 'Other']
    },
    date: {
        type: String,
        required: [true, 'Please add a date']
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Expense', ExpenseSchema);
const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const orderSchema = new Schema({
	user: {
		email : {
			type: String,
			required: true
		},
		userId: {
			type: Schema.Types.ObjectId,
			required: true,
		}
	},
	orders: [{
		product: {
			type: Schema.Types.Object,
			required: true,
			ref: 'Product'
		},
		quantity: {
			type: Number,
			required: true
		}
	}]
});

orderSchema.methods.createOrder = function(userId, cart){
	this.order.userId = userId;
	this.order.orders.push(cart);
	console.log(this);
	return this.save();
}

module.exports = mongoose.model('Order', orderSchema);

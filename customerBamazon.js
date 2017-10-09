// Required node modules.
var mysql = require("mysql");
var inquirer = require("inquirer");

// Connects to the database.
var cnx = mysql.createConnection({
	host: "localhost",
	port: 3306,
	user: "root",
	password: "root1",
	database: "bamazon"
});

cnx.connect(function(error) {
	if (error) throw error;

	showProducts();

});

function showProducts () {
	var query = "Select * FROM products";
	cnx.query(query, function(error, result) {

		if (error) throw error;

		for (var i = 0; i < result.length; i++) {
			console.log("Product ID: " + result[i].item_id + " || Product Name: " +
						result[i].product_name + " || Price: " + result[i].price);
		}
  		requestProduct();
	});
}

function requestProduct() {
	inquirer.prompt([{
		name: "productID",
		type: "input",
		message: "Please enter product ID for product you want.",
		validate: function(value) {
			if (isNaN(value) === false) {
				return true;
			}
			return false;
		}
	}, {
		name: "productUnits",
		type: "input",
		message: "How many units do you want?",
		validate: function(value) {
			if (isNaN(value) === false) {
				return true;
			}
			return false
		}
	}]).then(function(answer) {

		// Check database for the product.
		var query = "Select stock_quantity, price, product_sales, department_name FROM products WHERE ?";
		cnx.query(query, { item_id: answer.productID}, function(error, result) {
			
			if (error) throw error;

			var available_stock = result[0].stock_quantity;
			var price_per_unit = result[0].price;
			var sales = result[0].product_sales;
			var department = result[0].department_name;

			// Checks there's enough inventory.
			if (available_stock >= answer.productUnits) {

				buyProduct(available_stock, price_per_unit, sales, department, answer.productID, answer.productUnits);
			
			} else {

				console.log("There isn't enough stock left!");

				requestProduct();
			}
		});
	});
}

function buyProduct (stockLeft, price, sales, department, selectedProductID, selectedProductUnits) {
	
	var updatedStockQuantity = stockLeft - selectedProductUnits;
	var totalPrice = price * selectedProductUnits;
	var updateSales = parseInt(sales) + parseInt(totalPrice);
	
	var query = "UPDATE products SET ? WHERE ?";
	cnx.query(query, [{
		stock_quantity: updatedStockQuantity,
		product_sales: updateSales
	}, {
		item_id: selectedProductID
	}], function(error, result) {

		if (error) throw error;

		console.log("Yay, your purchase is complete.");

		console.log("Your payment has been received in the amount of : " + totalPrice);

		updateRevenue(updateSales, department);

	});
}

function updateRevenue (updateSales, department) {

	// Query database for total sales value for department.
	var query = "Select total_sales FROM departments WHERE ?";
	cnx.query(query, { department_name: department}, function(error, result) {

		if (error) throw error;

		var departmentSales = result[0].total_sales;

		var updateSales = parseInt(departmentSales) + parseInt(updateSales);

		salesUpdate(updateSales, department);
	});
}

function salesUpdate(updateSales, department) {

	var query = "UPDATE departments SET ? WHERE ?";
	cnx.query(query, [{
		total_sales: updateSales
	}, {
		department_name: department
	}], function(error, result) {

		if (error) throw error;

		showProducts();
	});
}
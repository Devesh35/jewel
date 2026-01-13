import { connectMongo } from "../src/core/db";
import { Order } from "../src/modules/order/order.model";
import { createOrder, getOrderById } from "../src/modules/order/order.service";
import { OrderStatus } from "../src/modules/order/order.types";
import { Payment } from "../src/modules/payment/payment.model";
import { initiatePayment } from "../src/modules/payment/payment.service";
import { PaymentMethod } from "../src/modules/payment/payment.types";
import { Price } from "../src/modules/product/price.model";
import { Product } from "../src/modules/product/product.model";
import { PriceType } from "../src/modules/product/product.types";
import { setRate } from "../src/modules/rates/rates.service";
import { User } from "../src/modules/user/user.model";

const verifyFlow = async () => {
  try {
    console.log("Connecting to Mongo...");
    await connectMongo();

    console.log("Cleaning up...");
    await User.deleteMany({ email: "test_order@example.com" });
    await Product.deleteMany({ itemId: "TEST-ITEM-001" });
    await Order.deleteMany({});
    await Payment.deleteMany({});

    console.log("Creating User...");
    const user = new User({
      email: "test_order@example.com",
      keycloakId: "test-kcid-order-" + Date.now(),
      role: "customer",
      authProvider: "email",
    });
    await user.save();
    const userId = user._id.toString();
    console.log("User created:", userId);

    console.log("Setting Rates...");
    await setRate({
      gold: { "24k": 7000, "22k": 6500 }, // Example rates
    });

    console.log("Creating Product...");
    const product = new Product({
      itemId: "TEST-ITEM-001",
      name: "Gold Ring",
      stock: 10,
      attributes: {
        material: "gold",
        purity: "22k",
        weight: 5,
      },
    });
    await product.save();

    const price = new Price({
      productId: product._id,
      type: PriceType.DYNAMIC,
      baseValue: 500, // Making charges
      formula: "rate * weight + makingCharges",
      currency: "INR",
    });
    await price.save();
    product.priceId = price._id as any;
    await product.save();
    const productId = product._id.toString();
    console.log("Product created:", productId);

    console.log("Creating Order...");
    // Should calculate: 6500 * 5 + 500 = 32500 + 500 = 33000
    const order = await createOrder(userId, [{ productId, quantity: 1 }]);
    console.log("Order created:", order._id, "Total:", order.totalAmount);

    if (order.totalAmount !== 33000) {
      throw new Error(`Expected total 33000, got ${order.totalAmount}`);
    }

    console.log("Initiating Partial Payment...");
    const payment1 = await initiatePayment(
      userId,
      order._id.toString(),
      10000,
      PaymentMethod.UPI
    );
    console.log("Payment 1 status:", payment1.status);

    const orderAfterPay1 = await getOrderById(order._id.toString());
    console.log("Order paid amount:", orderAfterPay1.paidAmount);

    if (orderAfterPay1.paidAmount !== 10000) {
      throw new Error(
        `Expected paidAmount 10000, got ${orderAfterPay1.paidAmount}`
      );
    }
    if (orderAfterPay1.status !== OrderStatus.PENDING) {
      throw new Error(`Expected status PENDING, got ${orderAfterPay1.status}`);
    }

    console.log("Initiating Remaining Payment...");
    const payment2 = await initiatePayment(
      userId,
      order._id.toString(),
      23000,
      PaymentMethod.UPI
    );

    const orderAfterPay2 = await getOrderById(order._id.toString());
    console.log("Order paid amount:", orderAfterPay2.paidAmount);
    console.log("Order status:", orderAfterPay2.status);

    if (orderAfterPay2.paidAmount !== 33000) {
      throw new Error(
        `Expected paidAmount 33000, got ${orderAfterPay2.paidAmount}`
      );
    }

    // logic says >= totalAmount -> CONFIRMED
    if (
      orderAfterPay2.status !== OrderStatus.CONFIRMED &&
      orderAfterPay2.status !== OrderStatus.COMPLETED
    ) {
      throw new Error(`Status is ${orderAfterPay2.status}, Expected CONFIRMED`);
    }

    console.log("Verification Successful!");
    process.exit(0);
  } catch (err) {
    console.error("Verification Failed:", err);
    process.exit(1);
  }
};

verifyFlow();

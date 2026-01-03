import dotenv from "dotenv";
import axios from "axios";
import { orderStatusMessages } from "./orderStatusManager.js";
dotenv.config();

const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;
const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;


const baseUrl = 'https://api.downtown.ng/' //'https://downtownbyhai-api.onrender.com/';
const directUrl = 'https://vendorbot-1.onrender.com/' // this will be changed to the vps url later on

//
export async function createOrder(user_id, vendor_id, user_name, vendor_name, food_name, price, order_type, user_location, user_phone_number, vendor_phone_number){
  console.log("Sending to server:", {
  user_id,
  vendor_id,
  user_name,
  vendor_name,
  food_name,
  price,
  order_type,
  user_location,
  user_phone_number,
  vendor_phone_number
});

    try {
    const response = await axios.post(
      `${baseUrl}orders`,
      { 
        user_id: user_id,
        vendor_id: vendor_id,
        user_name: user_name,
        vendor_name: vendor_name,
        food_name: food_name,
        price:price,
        order_type:order_type,
        user_location:user_location,
        user_phone_number:user_phone_number,
        vendor_phone_number:vendor_phone_number
       }
    );
    console.log(response.data.data); 
    return response.data.data;
  } catch (err) {
    console.log(err);
    return err;
  }
}


export async function sendtovendor(user_id, vendor_id, user_name, vendor_name, food_name, price, order_type, user_location, user_phone_number, vendor_phone_number){
  console.log("Sending to vendorbot");

    try {
    const response = await axios.post(
      `${directUrl}create-order`,
      { 
        user_id: user_id,
        vendor_id: vendor_id,
        user_name: user_name,
        vendor_name: vendor_name,
        food_name: food_name,
        price:price,
        order_type:order_type,
        user_location:user_location,
        user_phone_number:user_phone_number,
        vendor_phone_number:vendor_phone_number
       }
    );


    console.log(response.data.data); 


    return response.data.data;
  } catch (err) {
    console.log(err);
    return err;
  }
}

export async function getUserOrderStatus(req, res) {
  const order = req.body;

  const statusHandler = orderStatusMessages[order.status];

  if (!statusHandler) {
    return res.status(400).json({
      error: "Unknown order status",
    });
  }

  let response;

  switch (order.status) {
    case "received":
      response = statusHandler(order);
      break;

    case "pick_up_ready":
      response = statusHandler(order.vendorName);
      break;

    default:
      response = statusHandler();
  }

  await sendStatusMessage(order.userPhone, response);

  return res.status(200).json(response);
}


export async function sendStatusMessage(to, response) {
  await axios({
    url: `https://graph.facebook.com/v22.0/${PHONE_NUMBER_ID}/messages`,
    method: "post",
    headers: {
      Authorization: `Bearer ${ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    },
    data: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: {
        body: response,
      },
    }),
  });
}
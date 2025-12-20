import dotenv from "dotenv";
import axios from "axios";
dotenv.config();

const baseUrl = 'https://downtownbyhai-api.onrender.com/';

//
export async function createOrder(user_id, vendor_id, user_name, vendor_name, food_name, price, order_type, user_location, user_phone_number, vendor_phone_number){
//   console.log("Sending to server:", {
//   user_id,
//   vendor_id,
//   user_name,
//   vendor_name,
//   food_name,
//   price,
//   order_type,
//   user_location,
//   user_phone_number,
//   vendor_phone_number
// });

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

export async function CheckUserOrder(user_id) {
    try {
      const response = await axios.get(`${baseUrl}orders/${user_id}`)
      console.log(response.data.data)
      const status = response.data.data;
      if (status.vendor_notified===true) {
        //send user that their order has been notified
      }
      if (status.status === 'accepted') {
        //send user that their order has been accepted
      }
    } catch (err) {
      console.log('error from checking user order: ', err)
    }
}
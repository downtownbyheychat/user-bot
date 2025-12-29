import pool from "../db/database.js";
import express from "express";
import dotenv from "dotenv";
dotenv.config();
import axios from "axios";

const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;

export const ARENA = [
  "44b0khv39e",
  "6nmpel399n",
  "7hqswixygi",
  "99e9wxy2h8",
  "abegzqz4om",
  "ek3ddflak5",
  "euas01isag",
  "j4ng5gbr91",
  "lnnyayvp1u",
  "n4md5ca0ql",
  "sd6or84l3k",
  "u2h4hkjf3v",
  "4in2gswzsa",
  "5pa7vjt2s7",
  "6d46xrl6o3",
  "9tnk0nnb94",
  "com0t5197s",
  "gcvheugluv",
  "itrhko3dkv",
  "kf322j5gsj",
  "stryje2uao",
  "euy5dj4gos",
  "s951b3acsz",
  "4wjy8mij32",
  "28fjyk9fr3",
];
export const BESTMAN = [
  // Food
  "6ncrgiqowk",
  "9hzblhb1kd",
  "9uuxzyinl3",
  "nzgih18vxo",
  "uuqvr976iz",
  "y7ybr499il",
  "ykxwg8twzf",
  "0os37g0kt7",
  "2xxqkyqmaj",
  "40eq627eiz",
  "8yn6ly86o4",
  "9sdxy07n85",
  "ble276ig5u",
  "cxtphlgy11",
  "hdumwiz1c9",
  "m08n6rk0jk",
  "n1iwco48v6",
  "uogh75dzzf",
  "y853r1wppi",

  // Drinks
  "55yxzxwd6y",
  "6ea89olj5y",
  "ai46479kt6",
  "q3wbk8a1qh",
  "zggh8vz9wz",
  "47cunuy9s2",
  "une890w6wq",

  // Snacks
  "0qoh95acyw",
  "fpl4wv1jqi",
  "t7gq4tnrqr",
  "t9yjfefhyl",
];
export const FAMOT = [
  // food
  "uqfi9opf7x",
  "40eq627eiz",
  "7rshheo9iy",
  "abz02fljsz",

  // drink
  "ardwfsar5t",

  // snacks
  "39gdluahn6",
  "a1mxq21n6d",
  "b17ok1ouzh",
  "ifg30maaga",
  "nnkwrznazn",
  "nw4ytnkd6f",
  "p32twz95bz",
  "qf1z9ftt9b",
  "qqmqnnx4ag",
  "sgprxkuxzs",
  "t2571yrs80",
  "w8syi0bcwj",
  "xvmw3rfpyu",
  "3xaij3ygfo",
  "53mcqpctpp",
  "f58aq6irld",
  "fivs744k56",
  "jc6q3ut099",
  "npgmx476rk",
  "qpncupn577",
  "r5ocujobj2",
  "szf9juvs0x",
  "uo46rs3y8a",
  "x3gzozvnrc",
  "yphygwyd3a",
];
export const RENEES = [
  // food
  "13ulzm8fjl",
  "2o371n8p2u",
  "2th4oeggc0",
  "2uloubl9q6",
  "909nchy1de",
  "9kel4eh4i6",
  "ee5pqazyba",
  "eom4yhaacf",
  "jundf7f0gm",
  "p32m3tdiwh",
  "prvtk5t52o",
  "vb8gpcfyzx",
  "ztp2ycc8wc",

  // sides / extras
  "1d0nsob25b",
  "2yltkn1oj7",
  "74h7z4cz9h",
  "9y5gfbp6tg",

  // meals
  "hyqbcruuql",
  "j4sbhgfaro",
  "s579fq44gx",
  "tnl64lgxr0",
  "ujtcw4yfsk",
  "vclcqpthsg",
  "x16kik9wbz",
  "x8dpxfknnr",

  // swallow
  "ac0esxwcaz",
  "pqs5ml8px6",
  "06qhmkptxm",
  "gw73ix1u3z",
  "ydk0zbp5x9",
];
export const RUKAMAT = [
  // food
  "1on129lwf4",
  "3bc85ty9mh",
  "4zzkb17f7k",
  "by99dfe18y",
  "cdkio4b7x2",
  "g3mxixqw0a",
  "rmrh9id3cc",
  "ufknarol53",
  "xh4wmx09je",
  "yu8l37ynu6",
  "zaiv1tuh6n",
  "2er65l7i4d",
  "bhqn77nj4w",
  "g8unqdibtz",
  "lv4x40exyb",
  "phgm6s5d8i",
  "r3lf1fq8xf",
  "ybjgk1a0px",

  // soups
  "455waa0xux",
  "b42cugvddk",
  "dppq5kyzch",
  "yoadi424om",
  "c7p1vokgyv",
];
export const YOMICE = [
  // meals
  "02d43u3ce4",
  "2624zhq21i",
  "617amdid3g",
  "gnu0h7kv2o",
  "i25dlzduwv",
  "ijnrusdunr",
  "k6v6hn9kra",

  // extras
  "xkjtgvptpa",
  "y2gt7d7g9i",
  "y44y2q1nn6",
  "zbe9yhvvru",
  "3tjg4erhpe",
  "k5fhm1yvrc",
  "ktp43ms04w",
  "uqdarxv4z6",
  "bibvv48yr0",
  "lqleg4d8oh",

  // soups
  "lxrd7bcsay",
  "sq34r2e675",
  "tk8yvam8dg",
  "vw0212lfcd",
];
export const AFRICAN_KITCHEN = [
  // food
  "2n8bp8lfrs",
  "3dsafog43h",
  "3hd0fxtteg",
  "5i8em3l4nx",
  "5z7ycfh9zw",
  "cd3sc455ip",
  "d9nneqwn6i",
  "ltni895hrj",
  "nazvem4pgg",
  "sffdinjv25",
  "vxww1o8o00",
  "wm4ord6r5s",
  "zkdl8yejr8",
  "8q1t9rx6jz",
  "amq159kuzh",
  "dlydhutgo9",
  "jg36t28jwq",
  "qqfxb5wlnk",
  "rea45ktyqm",
  "wpfwtwahpa",

  // soups
  "qd12flt1sb",
  "sh6e1gyl49",
];
export const ALPHA = [
  "2eacx2kxnd",
  "d5nadsdylk",
  "d7d9dt2lo6",
  "f8iv914e15",
  "gi2osymjdf",
  "kdvar350fa",
  "ndxp09lxmg",
  "p3hljg2atz",
  "pdleszxpnq",
  "rq30ck7wpv",
  "shbyfxgfom",
  "ta4s2p3rv6",
  "w18i9z6d8u",
  "w52bnkq6x4",
  "wwwmlduvxg",
  "2rqsei4iwz",
  "4rkv7editj",
  "5imiczb98j",
  "5itq3us8c2",
  "6ex1b8wxch",
  "6udg8c0jnh",
  "czuwj237e8",
  "fnohgvs3df",
  "lfblb5k7do",
  "lqy7x92elu",
  "woh0t9ql4e",
  "xl3cd66ikm",
  "yy2gdc4281",
];
export const CHEF_MAYO = [
  "25yikxyx8q",
  "4gn1i14n8w",
  "818uz3c4q6",
  "8xtkg918r1",
  "9blr5uccvh",
  "bgxvh6vtnv",
  "bzipx2dd9m",
  "cts3z7vai6",
  "gzv14wrx3q",
  "jismb2fhq0",
  "kynb60lowr",
  "pgwmi1c0zf",
  "qqaarvhl1y",
  "uonje8hfeu",
  "wvuk4j1hip",
  "2cr2acgbcd",
  "42ox4jvpl6",
  "4lqy7xnacn",
  "8m79w57qvl",
  "c1mso66cdl",
  "duunpd5iyl",
  "eb8pyvdj9m",
  "kh2545rbdq",
  "qee2pb1i6x",
  "sjju1fiwm5",
  "tntwac3rzq",
  "tyk6z8ocej",
  "witk74riqa",
  "xnl5rqd54a",
];
export const EXCEEDING_GRACE = [
  "0ie7gonsp9",
  "4k1d2m6426",
  "5zwn6bds3y",
  "8bn6qwhdg6",
  "96hyz1v2jb",
  "ifzqnqulrm",
  "l1l6667nj2",
  "nes1buwk3v",
  "os0oexo98d",
  "pn5kpp9adi",
  "wa4f02xtq1",
  "xufdmtfvk0",
  "y416cz4j2i",
  "z10tvrat1t",
  "zhrwm086ah",
  "50u1jiuw9v",
  "7yjotytonk",
  "etnpp1acwx",
  "gct415miau",
  "ib1bw6v4di",
  "idscw3mv2u",
  "jxdih64kz6",
  "kux41y4w38",
  "nkb9wrawyc",
  "rupmy858i1",
  "sthyg473mn",
  "t4u4gi4u06",
  "yh6x8c5p1x",
  "yn19uwwd33",
  "zcm6t0przz",
];

// Helper function to find which vendor array a product_id belongs to
function findVendorArray(productId) {
  const vendors = {
    ARENA,
    BESTMAN,
    FAMOT,
    RENEES,
    RUKAMAT,
    YOMICE,
    AFRICAN_KITCHEN,
    ALPHA,
    CHEF_MAYO,
    EXCEEDING_GRACE,
  };

  for (const [vendorName, productArray] of Object.entries(vendors)) {
    if (productArray.includes(productId)) {
      return { vendorName, productArray };
    }
  }

  return null;
}

export async function processCart(cart, to) {
  console.log(`cart from: ${cart.from}`);

  const itemsList = [];
  let vendorName = "";
  let vendorId = "";
  let grandTotal = 0;
  let firstVendorInfo = null;

  for (let i = 0; i < cart.order.product_items.length; i++) {
    const product = cart.order.product_items[i];
    const product_id = product.product_retailer_id;
    console.log("product id", product_id);

    // Find which vendor array this product belongs to
    const currentVendorInfo = findVendorArray(product_id);

    if (!currentVendorInfo) {
      console.log(`Product ${product_id} not found in any vendor array`);
      continue;
    }

    // First product - save the vendor info
    if (i === 0) {
      firstVendorInfo = currentVendorInfo;
      console.log(`First product vendor: ${firstVendorInfo.vendorName}`);
    } else {
      // Check if subsequent products are from the same vendor
      if (currentVendorInfo.vendorName !== firstVendorInfo.vendorName) {
        console.log(
          `ERROR: Cannot order from multiple vendors! First vendor: ${firstVendorInfo.vendorName}, Current product vendor: ${currentVendorInfo.vendorName}`
        );

        // Send a message to the user
        await sendMultiVendorError(
          to,
          firstVendorInfo.vendorName,
          currentVendorInfo.vendorName
        );

        return; // Stop the function
      }
    }

    // Fetch menu item
    const menuResult = await pool.query(
      `SELECT * FROM menus WHERE product_id = $1`,
      [product.product_retailer_id]
    );

    if (menuResult.rows.length === 0) continue;
    const menu = menuResult.rows[0];

    // Fetch vendor (only once)
    if (!vendorName) {
      const vendorResult = await pool.query(
        `SELECT id, name FROM vendors WHERE id = $1`,
        [menu.vendor_id]
      );
      if (vendorResult.rows.length > 0) {
        vendorName = vendorResult.rows[0].name;
        vendorId = vendorResult.rows[0].id;
      }
    }

    const quantity = product.quantity;
    const price = product.item_price;
    const total = quantity * price;
    grandTotal += total;

    // Store item with correct structure
    itemsList.push({
      name: menu.food_name,
      price,
      quantity,
      total,
      saleQuantity: menu.sale_quantity,
      startingPrice: menu.price,
      productId: menu.product_id,
    });
  }

  // Check for per_price items with prices below starting price
  for (const item of itemsList) {
    if (item.saleQuantity === "per_price") {
      if (item.total < item.startingPrice) {
        console.log(
          `ERROR: Item "${item.name}" price (₦${item.total}) is below minimum starting price (₦${item.startingPrice})`
        );
        
        await sendMinimumPriceError(to, item.name, item.startingPrice);
        
        return; // Stop the function
      }
    }
  }

  // Create consistent session data format
  const orderSummary = {
    vendorId,
    vendorName,
    items: itemsList,
    total: grandTotal,
  };

  console.log("ORDER SUMMARY:", orderSummary);

  // Save session
  const { setPendingOrder, getPendingOrder } = await import(
    "./sessionManager.js"
  );
  const customerId = to.replace(/\D/g, "");
  setPendingOrder(customerId, { orderSummary });

  console.log("Saved pending order:", getPendingOrder(customerId));

  function buildItemsList(orderSummary) {
    const itemLines = orderSummary.items
      .map((i) => `${i.name} (x${i.quantity}) — ₦${i.total}`)
      .join("\n");

    return (
      `*Vendor:* ${orderSummary.vendorName}\n` +
      `*Items:*\n${itemLines}\n\n` +
      `*Total:* ₦${orderSummary.total}`
    );
  }

  await sendOrderSummary(to, vendorId, orderSummary);

  async function sendOrderSummary(to, vendorId, orderSummary) {
    const displayList = buildItemsList(orderSummary);
    try {
      await axios({
        url: `https://graph.facebook.com/v22.0/${PHONE_NUMBER_ID}/messages`,
        method: "post",
        headers: {
          Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
        data: JSON.stringify({
          messaging_product: "whatsapp",
          to,
          type: "interactive",
          interactive: {
            type: "button",
            body: {
              text: `${displayList}\n\nPickup or Delivery?\n\nPickup - ₦50\nDelivery - ₦100`,
            },
            action: {
              buttons: [
                {
                  type: "reply",
                  reply: {
                    id: `pickup_${vendorId}`,
                    title: "Pickup",
                  },
                },
                {
                  type: "reply",
                  reply: {
                    id: `delivery_${vendorId}`,
                    title: "Delivery",
                  },
                },
              ],
            },
          },
        }),
      });

      console.log(`Sent order summary with buttons to ${to}`);
    } catch (error) {
      console.error(
        "Failed to send order summary",
        error.response?.data || error.message
      );
    }
  }
}

// Function to notify user about multi-vendor error
async function sendMultiVendorError(to, firstVendor, secondVendor) {
  try {
    await axios({
      url: `https://graph.facebook.com/v22.0/${PHONE_NUMBER_ID}/messages`,
      method: "post",
      headers: {
        Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      data: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: {
          body: `Sorry, you cannot order from multiple vendors in one cart.`,
        },
      }),
    });
  } catch (error) {
    console.error("Failed to send multi-vendor error message", error);
  }
}

// Function to notify user about minimum price error
async function sendMinimumPriceError(to, itemName, startingPrice) {
  try {
    await axios({
      url: `https://graph.facebook.com/v22.0/${PHONE_NUMBER_ID}/messages`,
      method: "post",
      headers: {
        Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      data: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: {
          body: `Sorry, "${itemName}" cannot be ordered below the minimum starting price of ₦${startingPrice}. Please adjust your order and try again.`,
        },
      }),
    });
  } catch (error) {
    console.error("Failed to send minimum price error message", error);
  }
}
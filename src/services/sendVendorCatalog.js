import dotenv from "dotenv";
dotenv.config();
import express from "express";
import axios from "axios";

const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const WEBHOOK_VERIFY_TOKEN = process.env.WEBHOOK_VERIFY_TOKEN;
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;

//code to generate product retailer ID automatically
function generateProductIds(vendorName, count) {
  const prefix = vendorName
  const ids = [];

  for (let i = 1; i <= count; i++) {
    const serial = String(i).padStart(3, "0");
    ids.push(`${prefix}${serial}`);
  }

  return ids;
}

function buildSections(vendorName, count) {
  const prefix = vendorName

  return [
    {
      title: "Menu",
      product_items: Array.from({ length: count }, (_, i) => ({
        product_retailer_id: `${prefix}${String(i + 1).padStart(3, "0")}`,
      })),
    },
  ];
}

export async function sendArenaCatalog(to) {
  await axios({
    url: `https://graph.facebook.com/v22.0/${PHONE_NUMBER_ID}/messages`,
    method: "post",
    headers: {
      Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    },
    data: JSON.stringify({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to,
      type: "interactive",
      interactive: {
        type: "product_list",
        header: {
          type: "text",
          text: "Arena's menu",
        },
        body: {
          text: "Discover the Arena's Menu. ‼️Note that each order is for a single pack.",
        },
        action: {
          catalog_id: "1456615208749246",
          sections: [
            {
              title: "Food",
              product_items: [
                
                {
                  product_retailer_id: "44b0khv39e",
                },
                {
                  product_retailer_id: "6nmpel399n",
                },
                {
                  product_retailer_id: "7hqswixygi",
                },
                {
                  product_retailer_id: "99e9wxy2h8",
                },
                {
                  product_retailer_id: "abegzqz4om",
                },
                {
                  product_retailer_id: "ek3ddflak5",
                },
                {
                  product_retailer_id: "euas01isag",
                },
                {
                  product_retailer_id: "j4ng5gbr91",
                },
                {
                  product_retailer_id: "lnnyayvp1u",
                },
                {
                  product_retailer_id: "n4md5ca0ql",
                },
                {
                  product_retailer_id: "sd6or84l3k",
                },
                {
                  product_retailer_id: "u2h4hkjf3v",
                },
                {
                  product_retailer_id: "4in2gswzsa",
                },
                {
                  product_retailer_id: "5pa7vjt2s7",
                },
                {
                  product_retailer_id: "6d46xrl6o3",
                },
                {
                  product_retailer_id: "9tnk0nnb94",
                },
                {
                  product_retailer_id: "com0t5197s",
                },
                {
                  product_retailer_id: "gcvheugluv",
                },
                {
                  product_retailer_id: "itrhko3dkv",
                },
                {
                  product_retailer_id: "kf322j5gsj",
                },
                {
                  product_retailer_id: "stryje2uao",
                },
                {
                  product_retailer_id: "euy5dj4gos",
                },
                {
                  product_retailer_id: "s951b3acsz",
                },
                {
                  product_retailer_id: "4wjy8mij32",
                },
                {
                  product_retailer_id: "28fjyk9fr3",
                },
              ],
            },
          ],
        },
      },
    }),
  });
}
export async function sendBestmanCatalog(to) {
  await axios({
    url: `https://graph.facebook.com/v22.0/${PHONE_NUMBER_ID}/messages`,
    method: "post",
    headers: {
      Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    },
    data: JSON.stringify({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to,
      type: "interactive",
      interactive: {
        type: "product_list",
        header: {
          type: "text",
          text: "Bestman's menu",
        },
        body: {
          text: "Discover the Bestman's Menu. ‼️Note that each order is for a single pack.",
        },
        action: {
          catalog_id: "1456615208749246",
          sections: [
            {
              title: "Food",
              product_items: [
                //food items
                
                
                {
                  product_retailer_id: "6ncrgiqowk",
                },
                {
                  product_retailer_id: "9hzblhb1kd",
                },
                {
                  product_retailer_id: "9uuxzyinl3",
                },
                
                
                {
                  product_retailer_id: "nzgih18vxo",
                },
                
                
                {
                  product_retailer_id: "uuqvr976iz",
                },
                {
                  product_retailer_id: "y7ybr499il",
                },
                {
                  product_retailer_id: "ykxwg8twzf",
                },
                
                {
                  product_retailer_id: "0os37g0kt7",
                },
                {
                  product_retailer_id: "2xxqkyqmaj",
                },
                {
                  product_retailer_id: "40eq627eiz",
                },
                
                {
                  product_retailer_id: "8yn6ly86o4",
                },
                {
                  product_retailer_id: "9sdxy07n85",
                },
                {
                  product_retailer_id: "ble276ig5u",
                },
                {
                  product_retailer_id: "cxtphlgy11",
                },
                {
                  product_retailer_id: "hdumwiz1c9",
                },
                {
                  product_retailer_id: "m08n6rk0jk",
                },
                {
                  product_retailer_id: "n1iwco48v6",
                },
                
                
                {
                  product_retailer_id: "uogh75dzzf",
                },
                {
                  product_retailer_id: "y853r1wppi",
                },

                //drinks
                {
                  product_retailer_id: "55yxzxwd6y",
                },
                {
                  product_retailer_id: "6ea89olj5y",
                },
                {
                  product_retailer_id: "ai46479kt6",
                },
                {
                  product_retailer_id: "q3wbk8a1qh",
                },
                {
                  product_retailer_id: "zggh8vz9wz",
                },
                {
                  product_retailer_id: "47cunuy9s2",
                },
                {
                  product_retailer_id: "une890w6wq",
                },
                //snacks
                {
                  product_retailer_id: "0qoh95acyw",
                },
                {
                  product_retailer_id: "fpl4wv1jqi",
                },
                {
                  product_retailer_id: "t7gq4tnrqr",
                },
                {
                  product_retailer_id: "t9yjfefhyl",
                },
              ],
            },
          ],
        },
      },
    }),
  });
}
export async function sendFamotCatalog(to) {
  await axios({
    url: `https://graph.facebook.com/v22.0/${PHONE_NUMBER_ID}/messages`,
    method: "post",
    headers: {
      Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    },
    data: JSON.stringify({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to,
      type: "interactive",
      interactive: {
        type: "product_list",
        header: {
          type: "text",
          text: "Famot's menu",
        },
        body: {
          text: "Discover the Famot's Menu. ‼️Note that each order is for a single pack.",
        },
        action: {
          catalog_id: "1456615208749246",
          sections: [
            {
              title: "Food",
              product_items: [
                //food
                
                
                
                {
                  product_retailer_id: "uqfi9opf7x",
                },
                
                {
                  product_retailer_id: "40eq627eiz",
                },
                {
                  product_retailer_id: "7rshheo9iy",
                },
                {
                  product_retailer_id: "abz02fljsz",
                },
                
                //drink
                {
                  product_retailer_id: "ardwfsar5t",
                },
                //snacks
                {
                  product_retailer_id: "39gdluahn6",
                },
                {
                  product_retailer_id: "a1mxq21n6d",
                },
                {
                  product_retailer_id: "b17ok1ouzh",
                },
                {
                  product_retailer_id: "ifg30maaga",
                },
                {
                  product_retailer_id: "nnkwrznazn",
                },
                {
                  product_retailer_id: "nw4ytnkd6f",
                },
                {
                  product_retailer_id: "p32twz95bz",
                },
                {
                  product_retailer_id: "qf1z9ftt9b",
                },
                {
                  product_retailer_id: "qqmqnnx4ag",
                },
                {
                  product_retailer_id: "sgprxkuxzs",
                },
                {
                  product_retailer_id: "t2571yrs80",
                },
                {
                  product_retailer_id: "w8syi0bcwj",
                },
                {
                  product_retailer_id: "xvmw3rfpyu",
                },
                {
                  product_retailer_id: "3xaij3ygfo",
                },
                {
                  product_retailer_id: "53mcqpctpp",
                },
                {
                  product_retailer_id: "f58aq6irld",
                },
                {
                  product_retailer_id: "fivs744k56",
                },
                {
                  product_retailer_id: "jc6q3ut099",
                },
                {
                  product_retailer_id: "npgmx476rk",
                },
                {
                  product_retailer_id: "qpncupn577",
                },
                {
                  product_retailer_id: "r5ocujobj2",
                },
                {
                  product_retailer_id: "szf9juvs0x",
                },
                {
                  product_retailer_id: "uo46rs3y8a",
                },
                {
                  product_retailer_id: "x3gzozvnrc",
                },
                {
                  product_retailer_id: "yphygwyd3a",
                },
              ],
            },
          ],
        },
      },
    }),
  });
}
export async function sendReneesCatalog(to) {
  await axios({
    url: `https://graph.facebook.com/v22.0/${PHONE_NUMBER_ID}/messages`,
    method: "post",
    headers: {
      Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    },
    data: JSON.stringify({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to,
      type: "interactive",
      interactive: {
        type: "product_list",
        header: {
          type: "text",
          text: "Renees Cafe's menu",
        },
        body: {
          text: "Discover the Renees Cafe's Menu. ‼️Note that each order is for a single pack.",
        },
        action: {
          catalog_id: "1456615208749246",
          sections: [
            {
              title: "Food",
              product_items: [
                {
                  product_retailer_id: "13ulzm8fjl",
                },
                {
                  product_retailer_id: "2o371n8p2u",
                },
                {
                  product_retailer_id: "2th4oeggc0",
                },
                {
                  product_retailer_id: "2uloubl9q6",
                },
                {
                  product_retailer_id: "909nchy1de",
                },
                {
                  product_retailer_id: "9kel4eh4i6",
                },
                
                {
                  product_retailer_id: "ee5pqazyba",
                },
                {
                  product_retailer_id: "eom4yhaacf",
                },
                {
                  product_retailer_id: "jundf7f0gm",
                },
                {
                  product_retailer_id: "p32m3tdiwh",
                },
                
                {
                  product_retailer_id: "prvtk5t52o",
                },
                {
                  product_retailer_id: "vb8gpcfyzx",
                },
                {
                  product_retailer_id: "ztp2ycc8wc",
                },
                
                {
                  product_retailer_id: "1d0nsob25b",
                },
                {
                  product_retailer_id: "2yltkn1oj7",
                },
                {
                  product_retailer_id: "74h7z4cz9h",
                },
                {
                  product_retailer_id: "9y5gfbp6tg",
                },
                
                {
                  product_retailer_id: "hyqbcruuql",
                },
                {
                  product_retailer_id: "j4sbhgfaro",
                },
                {
                  product_retailer_id: "s579fq44gx",
                },
                {
                  product_retailer_id: "tnl64lgxr0",
                },
                {
                  product_retailer_id: "ujtcw4yfsk",
                },
                {
                  product_retailer_id: "vclcqpthsg",
                },
                {
                  product_retailer_id: "x16kik9wbz",
                },
                {
                  product_retailer_id: "x8dpxfknnr",
                },
                //swallow
                {
                  product_retailer_id: "ac0esxwcaz",
                },
                {
                  product_retailer_id: "pqs5ml8px6",
                },
                {
                  product_retailer_id: "06qhmkptxm",
                },
                {
                  product_retailer_id: "gw73ix1u3z",
                },
                {
                  product_retailer_id: "ydk0zbp5x9",
                },
              ],
            },
          ],
        },
      },
    }),
  });
}
export async function sendRukamatCatalog(to) {
  generateProductIds('ruk', 23);
  const vendorSections = buildSections("ruk", 23);
  await axios({
    url: `https://graph.facebook.com/v22.0/${PHONE_NUMBER_ID}/messages`,
    method: "post",
    headers: {
      Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    },
    data: JSON.stringify({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to,
      type: "interactive",
      interactive: {
        type: "product_list",
        header: {
          type: "text",
          text: "Rukamat's menu",
        },
        body: {
          text: "Discover the Rukamat's Menu. ‼️Note that each order is for a single pack.",
        },
        action: {
          catalog_id: "1456615208749246",

          //just replace with vendorSections variable to auto generate product retailer IDs
          sections: [
            {
              title: "Food",
              product_items: [
                {
                  product_retailer_id: "1on129lwf4",
                },
                {
                  product_retailer_id: "3bc85ty9mh",
                },
                
                {
                  product_retailer_id: "4zzkb17f7k",
                },
                
                {
                  product_retailer_id: "by99dfe18y",
                },
                {
                  product_retailer_id: "cdkio4b7x2",
                },
                
                {
                  product_retailer_id: "g3mxixqw0a",
                },
                {
                  product_retailer_id: "rmrh9id3cc",
                },
                {
                  product_retailer_id: "ufknarol53",
                },
                {
                  product_retailer_id: "xh4wmx09je",
                },
                
                {
                  product_retailer_id: "yu8l37ynu6",
                },
                {
                  product_retailer_id: "zaiv1tuh6n",
                },
                {
                  product_retailer_id: "2er65l7i4d",
                },
                {
                  product_retailer_id: "bhqn77nj4w",
                },
                
                {
                  product_retailer_id: "g8unqdibtz",
                },
                {
                  product_retailer_id: "lv4x40exyb",
                },
                {
                  product_retailer_id: "phgm6s5d8i",
                },
                {
                  product_retailer_id: "r3lf1fq8xf",
                },
                {
                  product_retailer_id: "ybjgk1a0px",
                },
                //soups
                {
                  product_retailer_id: "455waa0xux",
                },
                {
                  product_retailer_id: "b42cugvddk",
                },
                {
                  product_retailer_id: "dppq5kyzch",
                },
                {
                  product_retailer_id: "yoadi424om",
                },
                {
                  product_retailer_id: "c7p1vokgyv",
                },
              ],
            },
          ],
        },
      },
    }),
  });
}
export async function sendYomiceCatalog(to) {
  await axios({
    url: `https://graph.facebook.com/v22.0/${PHONE_NUMBER_ID}/messages`,
    method: "post",
    headers: {
      Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    },
    data: JSON.stringify({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to,
      type: "interactive",
      interactive: {
        type: "product_list",
        header: {
          type: "text",
          text: "Yomice Cafe's menu",
        },
        body: {
          text: "Discover the Yomice Cafe's Menu. ‼️Note that each order is for a single pack.",
        },
        action: {
          catalog_id: "1456615208749246",
          sections: [
            {
              title: "Food",
              product_items: [
                {
                  product_retailer_id: "02d43u3ce4",
                },
                {
                  product_retailer_id: "2624zhq21i",
                },
                {
                  product_retailer_id: "617amdid3g",
                },
                {
                  product_retailer_id: "gnu0h7kv2o",
                },
                {
                  product_retailer_id: "i25dlzduwv",
                },
                {
                  product_retailer_id: "ijnrusdunr",
                },
                {
                  product_retailer_id: "k6v6hn9kra",
                },
                
                
                
                {
                  product_retailer_id: "xkjtgvptpa",
                },
                {
                  product_retailer_id: "y2gt7d7g9i",
                },
                {
                  product_retailer_id: "y44y2q1nn6",
                },
                {
                  product_retailer_id: "zbe9yhvvru",
                },
                {
                  product_retailer_id: "3tjg4erhpe",
                },
                {
                  product_retailer_id: "k5fhm1yvrc",
                },
                {
                  product_retailer_id: "ktp43ms04w",
                },
                {
                  product_retailer_id: "uqdarxv4z6",
                },
                {
                  product_retailer_id: "bibvv48yr0",
                },
                {
                  product_retailer_id: "lqleg4d8oh",
                },
                //soups
                {
                  product_retailer_id: "lxrd7bcsay",
                },
                {
                  product_retailer_id: "sq34r2e675",
                },
                {
                  product_retailer_id: "tk8yvam8dg",
                },
                {
                  product_retailer_id: "vw0212lfcd",
                },
              ],
            },
          ],
        },
      },
    }),
  });
}
export async function sendAfricanKitchenCatalog(to) {
  await axios({
    url: `https://graph.facebook.com/v22.0/${PHONE_NUMBER_ID}/messages`,
    method: "post",
    headers: {
      Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    },
    data: JSON.stringify({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to,
      type: "interactive",
      interactive: {
        type: "product_list",
        header: {
          type: "text",
          text: "African Kitchen's menu",
        },
        body: {
          text: "Discover the African Kitchen's Menu. ‼️Note that each order is for a single pack.",
        },
        footer: {
          text: "Menu",
        },
        action: {
          catalog_id: "1456615208749246",
          sections: [
            {
              title: "Food",
              product_items: [
                {
                  product_retailer_id: "2n8bp8lfrs",
                },
                {
                  product_retailer_id: "3dsafog43h",
                },
                {
                  product_retailer_id: "3hd0fxtteg",
                },
                {
                  product_retailer_id: "5i8em3l4nx",
                },
                {
                  product_retailer_id: "5z7ycfh9zw",
                },
                {
                  product_retailer_id: "cd3sc455ip",
                },
                {
                  product_retailer_id: "d9nneqwn6i",
                },
                {
                  product_retailer_id: "ltni895hrj",
                },
                {
                  product_retailer_id: "nazvem4pgg",
                },
                
                {
                  product_retailer_id: "sffdinjv25",
                },
                
                {
                  product_retailer_id: "vxww1o8o00",
                },
                {
                  product_retailer_id: "wm4ord6r5s",
                },
                {
                  product_retailer_id: "zkdl8yejr8",
                },
                {
                  product_retailer_id: "8q1t9rx6jz",
                },
                {
                  product_retailer_id: "amq159kuzh",
                },
                {
                  product_retailer_id: "dlydhutgo9",
                },
                {
                  product_retailer_id: "jg36t28jwq",
                },
                {
                  product_retailer_id: "qqfxb5wlnk",
                },
                {
                  product_retailer_id: "rea45ktyqm",
                },
                {
                  product_retailer_id: "wpfwtwahpa",
                },
                //soup
                {
                  product_retailer_id: "qd12flt1sb",
                },
                {
                  product_retailer_id: "sh6e1gyl49",
                },
              ],
            },
          ],
        },
      },
    }),
  });
}
export async function sendAlphaCatalog(to) {
  await axios({
    url: `https://graph.facebook.com/v22.0/${PHONE_NUMBER_ID}/messages`,
    method: "post",
    headers: {
      Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    },
    data: JSON.stringify({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to,
      type: "interactive",
      interactive: {
        type: "product_list",
        header: {
          type: "text",
          text: "Alphas Place's menu",
        },
        body: {
          text: "Discover the Alphas Place's Menu. ‼️Note that each order is for a single pack.",
        },
        action: {
          catalog_id: "1456615208749246",
          sections: [
            {
              title: "Food",
              product_items: [
                {
                  product_retailer_id: "2eacx2kxnd",
                },
                {
                  product_retailer_id: "d5nadsdylk",
                },
                {
                  product_retailer_id: "d7d9dt2lo6",
                },
                {
                  product_retailer_id: "f8iv914e15",
                },
                {
                  product_retailer_id: "gi2osymjdf",
                },
                {
                  product_retailer_id: "kdvar350fa",
                },
                {
                  product_retailer_id: "ndxp09lxmg",
                },
                {
                  product_retailer_id: "p3hljg2atz",
                },
                {
                  product_retailer_id: "pdleszxpnq",
                },
                {
                  product_retailer_id: "rq30ck7wpv",
                },
                {
                  product_retailer_id: "shbyfxgfom",
                },
                {
                  product_retailer_id: "ta4s2p3rv6",
                },
                {
                  product_retailer_id: "w18i9z6d8u",
                },
                {
                  product_retailer_id: "w52bnkq6x4",
                },
                {
                  product_retailer_id: "wwwmlduvxg",
                },
                {
                  product_retailer_id: "2rqsei4iwz",
                },
                {
                  product_retailer_id: "4rkv7editj",
                },
                {
                  product_retailer_id: "5imiczb98j",
                },
                {
                  product_retailer_id: "5itq3us8c2",
                },
                {
                  product_retailer_id: "6ex1b8wxch",
                },
                {
                  product_retailer_id: "6udg8c0jnh",
                },
                {
                  product_retailer_id: "czuwj237e8",
                },
                {
                  product_retailer_id: "fnohgvs3df",
                },
                {
                  product_retailer_id: "lfblb5k7do",
                },
                {
                  product_retailer_id: "lqy7x92elu",
                },
                {
                  product_retailer_id: "woh0t9ql4e",
                },
                {
                  product_retailer_id: "xl3cd66ikm",
                },
                {
                  product_retailer_id: "yy2gdc4281",
                },
              ],
            },
          ],
        },
      },
    }),
  });
}
export async function sendChefMayoCatalog(to) {
  await axios({
    url: `https://graph.facebook.com/v22.0/${PHONE_NUMBER_ID}/messages`,
    method: "post",
    headers: {
      Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    },
    data: JSON.stringify({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to,
      type: "interactive",
      interactive: {
        type: "product_list",
        header: {
          type: "text",
          text: "Chef mayo's menu",
        },
        body: {
          text: "Discover the Chef Mayo's Menu. ‼️Note that each order is for a single pack.",
        },
        action: {
          catalog_id: "1456615208749246",
          sections: [
            {
              title: "Food",
              product_items: [
                {
                  product_retailer_id: "25yikxyx8q",
                },
                {
                  product_retailer_id: "4gn1i14n8w",
                },
                {
                  product_retailer_id: "818uz3c4q6",
                },
                {
                  product_retailer_id: "8xtkg918r1",
                },
                {
                  product_retailer_id: "9blr5uccvh",
                },
                {
                  product_retailer_id: "bgxvh6vtnv",
                },
                {
                  product_retailer_id: "bzipx2dd9m",
                },
                {
                  product_retailer_id: "cts3z7vai6",
                },
                {
                  product_retailer_id: "gzv14wrx3q",
                },
                {
                  product_retailer_id: "jismb2fhq0",
                },
                {
                  product_retailer_id: "kynb60lowr",
                },
                {
                  product_retailer_id: "pgwmi1c0zf",
                },
                {
                  product_retailer_id: "qqaarvhl1y",
                },
                {
                  product_retailer_id: "uonje8hfeu",
                },
                {
                  product_retailer_id: "wvuk4j1hip",
                },
                {
                  product_retailer_id: "2cr2acgbcd",
                },
                {
                  product_retailer_id: "42ox4jvpl6",
                },
                {
                  product_retailer_id: "4lqy7xnacn",
                },
                {
                  product_retailer_id: "8m79w57qvl",
                },
                {
                  product_retailer_id: "c1mso66cdl",
                },
                {
                  product_retailer_id: "duunpd5iyl",
                },
                {
                  product_retailer_id: "eb8pyvdj9m",
                },
                {
                  product_retailer_id: "kh2545rbdq",
                },
                {
                  product_retailer_id: "qee2pb1i6x",
                },
                {
                  product_retailer_id: "sjju1fiwm5",
                },
                {
                  product_retailer_id: "tntwac3rzq",
                },
                {
                  product_retailer_id: "tyk6z8ocej",
                },
                {
                  product_retailer_id: "witk74riqa",
                },
                {
                  product_retailer_id: "xnl5rqd54a",
                },
              ],
            },
          ],
        },
      },
    }),
  });
}
export async function sendExceedingGraceCatalog(to) {
  await axios({
    url: `https://graph.facebook.com/v22.0/${PHONE_NUMBER_ID}/messages`,
    method: "post",
    headers: {
      Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    },
    data: JSON.stringify({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to,
      type: "interactive",
      interactive: {
        type: "product_list",
        header: {
          type: "text",
          text: "Exceeding grace's menu",
        },
        body: {
          text: "Discover the Exceeding grace's Menu. ‼️Note that each order is for a single pack.",
        },
        action: {
          catalog_id: "1456615208749246",
          sections: [
            {
              title: "Food",
              product_items: [
                {
                  product_retailer_id: "0ie7gonsp9",
                },
                {
                  product_retailer_id: "4k1d2m6426",
                },
                {
                  product_retailer_id: "5zwn6bds3y",
                },
                {
                  product_retailer_id: "8bn6qwhdg6",
                },
                {
                  product_retailer_id: "96hyz1v2jb",
                },
                {
                  product_retailer_id: "ifzqnqulrm",
                },
                {
                  product_retailer_id: "l1l6667nj2",
                },
                {
                  product_retailer_id: "nes1buwk3v",
                },
                {
                  product_retailer_id: "os0oexo98d",
                },
                {
                  product_retailer_id: "pn5kpp9adi",
                },
                {
                  product_retailer_id: "wa4f02xtq1",
                },
                {
                  product_retailer_id: "xufdmtfvk0",
                },
                {
                  product_retailer_id: "y416cz4j2i",
                },
                {
                  product_retailer_id: "z10tvrat1t",
                },
                {
                  product_retailer_id: "zhrwm086ah",
                },
                {
                  product_retailer_id: "50u1jiuw9v",
                },
                {
                  product_retailer_id: "7yjotytonk",
                },
                {
                  product_retailer_id: "etnpp1acwx",
                },
                {
                  product_retailer_id: "gct415miau",
                },
                {
                  product_retailer_id: "ib1bw6v4di",
                },
                {
                  product_retailer_id: "idscw3mv2u",
                },
                {
                  product_retailer_id: "jxdih64kz6",
                },
                {
                  product_retailer_id: "kux41y4w38",
                },
                {
                  product_retailer_id: "nkb9wrawyc",
                },
                {
                  product_retailer_id: "rupmy858i1",
                },
                {
                  product_retailer_id: "sthyg473mn",
                },
                {
                  product_retailer_id: "t4u4gi4u06",
                },
                {
                  product_retailer_id: "yh6x8c5p1x",
                },
                {
                  product_retailer_id: "yn19uwwd33",
                },
                {
                  product_retailer_id: "zcm6t0przz",
                },
              ],
            },
          ],
        },
      },
    }),
  });
}
export async function sendTestvendor(to) {
  await axios({
    url: `https://graph.facebook.com/v22.0/${PHONE_NUMBER_ID}/messages`,
    method: "post",
    headers: {
      Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    },
    data: JSON.stringify({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to,
      type: "interactive",
      interactive: {
        type: "product_list",
        header: {
          type: "text",
          text: "Test vendor's menu",
        },
        body: {
          text: "Discover the Test vendor's Menu. ‼️Note that each order is for a single pack.",
        },
        action: {
          catalog_id: "1456615208749246",
          sections: [
            {
              title: "Food",
              product_items: [
                {
                  product_retailer_id: "0ie7gonsp9",
                },
                {
                  product_retailer_id: "4k1d2m6426",
                },
                {
                  product_retailer_id: "5zwn6bds3y",
                },
                {
                  product_retailer_id: "8bn6qwhdg6",
                },
                {
                  product_retailer_id: "96hyz1v2jb",
                },
                {
                  product_retailer_id: "ifzqnqulrm",
                },
                {
                  product_retailer_id: "l1l6667nj2",
                },
                {
                  product_retailer_id: "nes1buwk3v",
                },
                {
                  product_retailer_id: "os0oexo98d",
                },
                {
                  product_retailer_id: "pn5kpp9adi",
                },
                {
                  product_retailer_id: "wa4f02xtq1",
                },
                {
                  product_retailer_id: "xufdmtfvk0",
                },
                {
                  product_retailer_id: "y416cz4j2i",
                },
                {
                  product_retailer_id: "z10tvrat1t",
                },
                {
                  product_retailer_id: "zhrwm086ah",
                },
                {
                  product_retailer_id: "50u1jiuw9v",
                },
                {
                  product_retailer_id: "7yjotytonk",
                },
                {
                  product_retailer_id: "etnpp1acwx",
                },
                {
                  product_retailer_id: "gct415miau",
                },
                {
                  product_retailer_id: "ib1bw6v4di",
                },
                {
                  product_retailer_id: "idscw3mv2u",
                },
                {
                  product_retailer_id: "jxdih64kz6",
                },
                {
                  product_retailer_id: "kux41y4w38",
                },
                {
                  product_retailer_id: "nkb9wrawyc",
                },
                {
                  product_retailer_id: "rupmy858i1",
                },
                {
                  product_retailer_id: "sthyg473mn",
                },
                {
                  product_retailer_id: "t4u4gi4u06",
                },
                {
                  product_retailer_id: "yh6x8c5p1x",
                },
                {
                  product_retailer_id: "yn19uwwd33",
                },
                {
                  product_retailer_id: "zcm6t0przz",
                },
              ],
            },
          ],
        },
      },
    }),
  });
}

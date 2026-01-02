import dotenv from "dotenv";
dotenv.config();
import express from "express";
import axios from "axios";

const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const WEBHOOK_VERIFY_TOKEN = process.env.WEBHOOK_VERIFY_TOKEN;
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;

//code to generate product retailer ID automatically
function generateProductIds(vendorName, count) {
  const prefix = vendorName;
  const ids = [];

  for (let i = 1; i <= count; i++) {
    const serial = String(i).padStart(3, "0");
    ids.push(`${prefix}${serial}`);
  }

  return ids;
}

export let arenaProductIds = [];
export let bestmanProductIds = []
export let famotProductIds = []
export let reneesProductIds = []
export let rukamatProductIds = []
export let yomiceProductIds = []
export let afkProductIds = []
export let alphaProductIds = []
export let mayoProductIds = []
export let excProductIds = []

function buildSections(vendorName, count, start = 0) {
  const prefix = vendorName;

  return [
    {
      title: "Menu",
      product_items: Array.from({ length: count }, (_, i) => ({
        product_retailer_id: `${prefix}${String(start + i + 1).padStart(
          3,
          "0"
        )}`,
      })),
    },
  ];
}

export async function sendArenaCatalog(to) {
  const vendorSections = buildSections("are", 24);
  arenaProductIds = vendorSections.flatMap((section) =>
    section.product_items.map((item) => item.product_retailer_id)
  );
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
          sections: vendorSections,
        },
      },
    }),
  });
}

//bestman has 3 sections due to number of items
export async function sendBestmanCatalog(to) {
  const vendorSection = buildSections("bes", 93);
  bestmanProductIds = vendorSection.flatMap((section) =>
    section.product_items.map((item) => item.product_retailer_id)
  );
  const vendorSections = buildSections("bes", 30);
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
          sections: vendorSections,
        },
      },
    }),
  });
  await sendBestmanCatalog2(to);
}
export async function sendBestmanCatalog2(to) {
  const vendorSections = buildSections("bes", 30, 30);

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
          sections: vendorSections,
        },
      },
    }),
  });
  await sendBestmanCatalog3(to);
}
export async function sendBestmanCatalog3(to) {
  const vendorSections = buildSections("bes", 30, 60);

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
          sections: vendorSections,
        },
      },
    }),
  });
}
//famot has many items, so split into 2 sections
export async function sendFamotCatalog(to) {
  const vendorSection = buildSections("fam", 35);
  famotProductIds = vendorSection.flatMap((section) =>
    section.product_items.map((item) => item.product_retailer_id)
  );
  const vendorSections = buildSections("fam", 30);
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
          sections: vendorSections,
        },
      },
    }),
  });
  await sendFamotCatalog2(to);
}
export async function sendFamotCatalog2(to) {
  const vendorSections = buildSections("fam", 30, 30);
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
          sections: vendorSections,
        },
      },
    }),
  });
}

//with 38 items, renees needs to be split into 2 sections
export async function sendReneesCatalog(to) {
  const vendorSection = buildSections("ren", 35);
  reneesProductIds = vendorSection.flatMap((section) =>
    section.product_items.map((item) => item.product_retailer_id)
  );
  const vendorSections = buildSections("ren", 30);
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
          sections: vendorSections
        },
      },
    }),
  });
  sendReneesCatalog2(to);
}
export async function sendReneesCatalog2(to) {
  const vendorSection = buildSections("ren", 30);
  reneesProductIds = vendorSection.flatMap((section) =>
    section.product_items.map((item) => item.product_retailer_id)
  );
  const vendorSections = buildSections("ren", 30, 30);
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
          sections: vendorSections
        },
      },
    }),
  });
}
// rukamat has only 23 items, so no need to split
export async function sendRukamatCatalog(to) {
  const vendorSections = buildSections("ruk", 30);
   rukamatProductIds = vendorSections.flatMap((section) =>
    section.product_items.map((item) => item.product_retailer_id)
  );
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
          sections: vendorSections,
        },
      },
    }),
  });
}

// rukamat has only 23 items, so no need to split
export async function sendYomiceCatalog(to) {
  const vendorSections = buildSections("yom", 30);
   yomiceProductIds = vendorSections.flatMap((section) =>
    section.product_items.map((item) => item.product_retailer_id)
  );
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
          sections: vendorSections,
        },
      },
    }),
  });
}

// african kitchen has only 24 items, so no need to split
export async function sendAfricanKitchenCatalog(to) {
  const vendorSections = buildSections("afr", 30);
  afkProductIds = vendorSections.flatMap((section) =>
    section.product_items.map((item) => item.product_retailer_id)
  );
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
          sections: vendorSections,
        },
      },
    }),
  });
}

//alpha has exactly 29 items, so no need to split
export async function sendAlphaCatalog(to) {
  const vendorSections = buildSections("alp", 30);
  alphaProductIds = vendorSections.flatMap((section) =>
    section.product_items.map((item) => item.product_retailer_id)
  );
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
          sections: vendorSections,
        },
      },
    }),
  });
}

//mayor has exactly 20 items, so no need to split
export async function sendChefMayoCatalog(to) {
  const vendorSections = buildSections("may", 30);
  mayoProductIds = vendorSections.flatMap((section) =>
    section.product_items.map((item) => item.product_retailer_id)
  );
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
          sections: vendorSections,
        },
      },
    }),
  });
}

//exceeding grace has many items, so split into 2 sections
export async function sendExceedingGraceCatalog(to) {
  const vendorSection = buildSections("exc", 37);
  excProductIds = vendorSection.flatMap((section) =>
    section.product_items.map((item) => item.product_retailer_id)
  );
  const vendorSections = buildSections("exc", 30);
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
          sections: vendorSections,
        },
      },
    }),
  });
  await sendExceedingGraceCatalog2(to);
}
export async function sendExceedingGraceCatalog2(to) {
  const vendorSections = buildSections("exc", 30, 30);
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
          sections: vendorSections,
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

# List-Based Responses Summary

All responses that present lists for user selection now use WhatsApp's interactive list format with data from PostgreSQL database.

## 1. Vendor Selection (Food Ordering Intent)
**Trigger:** User orders items without specifying vendor
**Database Query:** `searchItemAcrossVendors()` - searches for vendors that have ALL requested items
**Format:**
```javascript
{
  data: {
    list: {
      header: "Available Vendors",
      body: "Found \"[item names]\" at these vendors:",
      button: "Select Vendor",
      sections: [{
        title: "Vendors",
        rows: validVendors.map((v, i) => ({
          id: `vendor_${i}_${v.replace(/\s+/g, '_')}`,
          title: v,
          description: `Order from ${v}`
        }))
      }]
    }
  }
}
```

## 2. Find Restaurant Intent
**Trigger:** User asks to find/view restaurants
**Database Query:** `getAllVendors()` - fetches all active vendors
**Format:**
```javascript
{
  data: {
    list: {
      header: "Campus Restaurants",
      body: "Here are the available restaurants on campus:",
      button: "View Menu",
      sections: [{
        title: "Restaurants",
        rows: vendors.map(v => ({
          id: `vendor_${v.id}`,
          title: v.name,
          description: v.description || "View menu"
        }))
      }]
    }
  }
}
```

## 3. View Order History Intent
**Trigger:** User asks to view past orders or reorder
**Database Query:** `getUserOrderHistory(customerId, 5)` - fetches user's last 5 orders
**Format:**
```javascript
{
  data: {
    list: {
      header: "Past Orders",
      body: "Choose from your recent orders:",
      button: "Reorder",
      sections: [{
        title: "Recent Orders",
        rows: orders.map(order => ({
          id: `order_${order.id}`,
          title: itemsSummary.substring(0, 24),
          description: `₦${order.total_amount} - ${order.vendor_name}`
        }))
      }]
    }
  }
}
```

## Message Formatter
The `messageFormatter.js` handles converting these list objects into WhatsApp API format:
```javascript
if (response.data?.list) {
  const { header, body, button, sections, footer } = response.data.list;
  return {
    messaging_product: "whatsapp",
    to: recipientPhoneNumber,
    type: "interactive",
    interactive: {
      type: "list",
      header: { type: "text", text: header },
      body: { text: body },
      ...(footer && { footer: { text: footer } }),
      action: {
        button,
        sections
      }
    }
  };
}
```

## Webhook Handler
The webhook now handles list replies:
```javascript
if (message.interactive.type === 'list_reply') {
  interactionId = message.interactive.list_reply.id;
  interactionTitle = message.interactive.list_reply.title;
}
```

## Database Functions Used
- `getAllVendors()` - src/db/Utils/vendor.js
- `searchItemAcrossVendors(itemName)` - src/db/Utils/vendor.js
- `getUserOrderHistory(customerId, limit)` - src/db/Utils/orders.js

All data is fetched directly from PostgreSQL - no hardcoded lists!

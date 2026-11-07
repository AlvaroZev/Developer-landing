import {
  L,
  area,
  bars,
  count,
  date,
  defineBlueprint,
  donut,
  email,
  entity,
  flow,
  money,
  num,
  opt,
  rel,
  select,
  status,
  sum,
  text,
} from "../dsl";
import type { Blueprint } from "../types";

const stocked = [opt("active", "Active", "Activo"), opt("hidden", "Hidden", "Oculto")];

function orderFields(destination = false) {
  return [
    text("number", "Number", "Número", { required: true }),
    money("subtotal", "Subtotal", "Subtotal", { readonly: true }),
    money("tax", "Tax", "Impuesto", { readonly: true }),
    money("total", "Total", "Total", { readonly: true }),
    text("summary", "Summary", "Resumen", { readonly: true }),
    ...(destination ? [text("destination", "Destination", "Destino")] : []),
    status([
      opt("placed", "Placed", "Registrado"),
      opt("packed", "Packed", "Preparado"),
      opt("fulfilled", "Fulfilled", "Cumplido"),
      opt("cancelled", "Cancelled", "Cancelado"),
    ]),
  ];
}

export const commerceBlueprints: Blueprint[] = [
  defineBlueprint({
    slug: "ecommerce",
    presentation: "commerce",
    order: {
      productEntity: "products",
      orderEntity: "orders",
      stockField: "stock",
      priceField: "price",
    },
    entities: [
      entity(
        "products",
        L("Product", "Producto"),
        L("Products", "Productos"),
        [
          text("sku", "SKU", "SKU", { required: true }),
          text("name", "Name", "Nombre", { required: true }),
          money("price", "Price", "Precio", { required: true, min: 0 }),
          num("stock", "Stock", "Existencias", { min: 0 }),
          text("category", "Category", "Categoría"),
          status(stocked),
        ],
        flow(["active", "hidden"]),
      ),
      entity("customers", L("Customer", "Cliente"), L("Customers", "Clientes"), [
        text("fullName", "Name", "Nombre", { required: true }),
        email("email", "Email", "Correo", { required: true }),
        text("city", "City", "Ciudad"),
        select("segment", "Segment", "Segmento", [
          opt("new", "New", "Nuevo"),
          opt("returning", "Returning", "Recurrente"),
        ]),
      ]),
      entity(
        "orders",
        L("Order", "Pedido"),
        L("Orders", "Pedidos"),
        [rel("customerId", "Customer", "Cliente", "customers"), ...orderFields()],
        flow(["placed", "packed", "fulfilled"], [{ from: "placed", to: ["cancelled"] }]),
      ),
      entity(
        "returns",
        L("Return", "Devolución"),
        L("Returns", "Devoluciones"),
        [
          rel("orderId", "Order", "Pedido", "orders", { required: true }),
          text("reason", "Reason", "Motivo", { required: true }),
          status([
            opt("requested", "Requested", "Solicitada"),
            opt("accepted", "Accepted", "Aceptada"),
            opt("refused", "Refused", "Rechazada"),
          ]),
        ],
        flow(["requested", "accepted"], [{ from: "requested", to: ["refused"] }]),
      ),
    ],
    dashboard: [
      count("to-pack", "Orders to pack", "Pedidos por preparar", "orders", "placed"),
      sum("revenue", "Order total", "Total de pedidos", "orders", "total"),
      bars("stock", "Stock", "Existencias", "products", "stock"),
      donut("orders", "Orders", "Pedidos", "orders"),
    ],
  }),
  defineBlueprint({
    slug: "marketplaces",
    presentation: "commerce",
    order: {
      productEntity: "listings",
      orderEntity: "orders",
      stockField: "stock",
      priceField: "price",
    },
    entities: [
      entity(
        "sellers",
        L("Seller", "Vendedor"),
        L("Sellers", "Vendedores"),
        [
          text("name", "Name", "Nombre", { required: true }),
          num("feeRate", "Fee rate", "Comisión", { min: 0, max: 1 }),
          status([
            opt("pending", "Pending", "Pendiente"),
            opt("active", "Active", "Activo"),
            opt("suspended", "Suspended", "Suspendido"),
          ]),
        ],
        flow(["pending", "active", "suspended"]),
      ),
      entity(
        "listings",
        L("Listing", "Anuncio"),
        L("Listings", "Anuncios"),
        [
          rel("sellerId", "Seller", "Vendedor", "sellers", { required: true }),
          text("title", "Title", "Título", { required: true }),
          money("price", "Price", "Precio", { required: true, min: 0 }),
          num("stock", "Stock", "Existencias", { min: 0 }),
          status([opt("draft", "Draft", "Borrador"), opt("live", "Live", "Publicado")]),
        ],
        flow(["draft", "live"]),
      ),
      entity(
        "orders",
        L("Order", "Pedido"),
        L("Orders", "Pedidos"),
        [rel("listingId", "Listing", "Anuncio", "listings"), ...orderFields()],
        flow(["placed", "packed", "fulfilled"], [{ from: "placed", to: ["cancelled"] }]),
      ),
      entity(
        "payouts",
        L("Payout", "Pago al vendedor"),
        L("Payouts", "Pagos a vendedores"),
        [
          rel("sellerId", "Seller", "Vendedor", "sellers", { required: true }),
          money("amount", "Amount", "Importe"),
          status([opt("pending", "Pending", "Pendiente"), opt("released", "Released", "Liberado")]),
        ],
        flow(["pending", "released"]),
      ),
    ],
    dashboard: [
      count("live", "Live listings", "Anuncios publicados", "listings", "live"),
      sum("payouts", "Pending payouts", "Pagos pendientes", "payouts", "amount"),
      donut("sellers", "Sellers", "Vendedores", "sellers"),
      bars("stock", "Listing stock", "Existencias", "listings", "stock"),
    ],
  }),
  defineBlueprint({
    slug: "point-of-sale",
    presentation: "commerce",
    order: {
      productEntity: "products",
      orderEntity: "tickets",
      stockField: "stock",
      priceField: "price",
    },
    entities: [
      entity(
        "products",
        L("Item", "Artículo"),
        L("Items", "Artículos"),
        [
          text("sku", "SKU", "SKU", { required: true }),
          text("name", "Name", "Nombre", { required: true }),
          money("price", "Price", "Precio", { required: true, min: 0 }),
          num("stock", "Stock", "Existencias", { min: 0 }),
          text("aisle", "Aisle", "Pasillo"),
          status(stocked),
        ],
        flow(["active", "hidden"]),
      ),
      entity(
        "tickets",
        L("Ticket", "Ticket"),
        L("Tickets", "Tickets"),
        [
          text("number", "Number", "Número", { required: true }),
          select("tender", "Tender", "Pago", [
            opt("card", "Card", "Tarjeta"),
            opt("cash", "Cash", "Efectivo"),
          ]),
          money("subtotal", "Subtotal", "Subtotal", { readonly: true }),
          money("tax", "Tax", "Impuesto", { readonly: true }),
          money("total", "Total", "Total", { readonly: true }),
          text("summary", "Summary", "Resumen", { readonly: true }),
          status([
            opt("open", "Open", "Abierto"),
            opt("paid", "Paid", "Pagado"),
            opt("void", "Void", "Anulado"),
          ]),
        ],
        flow(["open", "paid"], [{ from: "open", to: ["void"] }]),
      ),
      entity(
        "shifts",
        L("Shift", "Turno"),
        L("Shifts", "Turnos"),
        [
          text("cashier", "Cashier", "Cajero", { required: true }),
          money("counted", "Counted", "Contado"),
          status([opt("open", "Open", "Abierto"), opt("closed", "Closed", "Cerrado")]),
        ],
        flow(["open", "closed"]),
      ),
    ],
    dashboard: [
      sum("takings", "Ticket total", "Total de tickets", "tickets", "total"),
      count("open-shifts", "Open shifts", "Turnos abiertos", "shifts", "open"),
      bars("stock", "Stock", "Existencias", "products", "stock"),
      donut("tender", "Tickets", "Tickets", "tickets"),
    ],
  }),
  defineBlueprint({
    slug: "inventory-management",
    presentation: "operations",
    entities: [
      entity("locations", L("Location", "Ubicación"), L("Locations", "Ubicaciones"), [
        text("name", "Name", "Nombre", { required: true }),
        text("kind", "Kind", "Tipo"),
        num("capacity", "Capacity", "Capacidad", { min: 0 }),
      ]),
      entity(
        "skus",
        L("SKU", "SKU"),
        L("SKUs", "SKUs"),
        [
          text("sku", "SKU", "SKU", { required: true }),
          text("name", "Name", "Nombre", { required: true }),
          rel("locationId", "Location", "Ubicación", "locations"),
          num("onHand", "On hand", "Existencias", { min: 0 }),
          num("reorderAt", "Reorder at", "Reponer en", { min: 0 }),
          status([opt("ok", "OK", "Correcto"), opt("reorder", "Reorder", "Reponer")]),
        ],
        flow(["ok", "reorder"]),
      ),
      entity(
        "movements",
        L("Movement", "Movimiento"),
        L("Movements", "Movimientos"),
        [
          rel("skuId", "SKU", "SKU", "skus", { required: true }),
          num("quantity", "Quantity", "Cantidad"),
          text("reason", "Reason", "Motivo", { required: true }),
          status([opt("draft", "Draft", "Borrador"), opt("posted", "Posted", "Registrado")]),
        ],
        flow(["draft", "posted"]),
      ),
    ],
    dashboard: [
      count("reorder", "Below reorder", "Bajo el mínimo", "skus", "reorder"),
      bars("on-hand", "On hand", "Existencias", "skus", "onHand"),
      donut("movements", "Movements", "Movimientos", "movements"),
    ],
  }),
  defineBlueprint({
    slug: "order-management",
    presentation: "commerce",
    order: {
      productEntity: "products",
      orderEntity: "orders",
      stockField: "stock",
      priceField: "price",
    },
    entities: [
      entity(
        "products",
        L("Product", "Producto"),
        L("Products", "Productos"),
        [
          text("sku", "SKU", "SKU", { required: true }),
          text("name", "Name", "Nombre", { required: true }),
          money("price", "Price", "Precio", { min: 0 }),
          num("stock", "Available", "Disponible", { min: 0 }),
          status(stocked),
        ],
        flow(["active", "hidden"]),
      ),
      entity(
        "orders",
        L("Order", "Pedido"),
        L("Orders", "Pedidos"),
        [...orderFields(true)],
        flow(["placed", "packed", "fulfilled"], [{ from: "placed", to: ["cancelled"] }]),
      ),
      entity(
        "shipments",
        L("Shipment", "Envío"),
        L("Shipments", "Envíos"),
        [
          rel("orderId", "Order", "Pedido", "orders", { required: true }),
          text("carrier", "Carrier", "Transportista", { required: true }),
          status([
            opt("ready", "Ready", "Listo"),
            opt("in_transit", "In transit", "En tránsito"),
            opt("delivered", "Delivered", "Entregado"),
          ]),
        ],
        flow(["ready", "in_transit", "delivered"]),
      ),
      entity(
        "exceptions",
        L("Exception", "Excepción"),
        L("Exceptions", "Excepciones"),
        [
          rel("orderId", "Order", "Pedido", "orders", { required: true }),
          text("reason", "Reason", "Motivo", { required: true }),
          status([opt("open", "Open", "Abierta"), opt("cleared", "Cleared", "Cerrada")]),
        ],
        flow(["open", "cleared"]),
      ),
    ],
    dashboard: [
      count("open", "Open orders", "Pedidos abiertos", "orders", "placed"),
      count("exceptions", "Open exceptions", "Excepciones abiertas", "exceptions", "open"),
      sum("value", "Order value", "Valor de pedidos", "orders", "total"),
      donut("shipments", "Shipments", "Envíos", "shipments"),
    ],
  }),
  defineBlueprint({
    slug: "subscription-management",
    presentation: "ledger",
    entities: [
      entity(
        "plans",
        L("Plan", "Plan"),
        L("Plans", "Planes"),
        [
          text("name", "Name", "Nombre", { required: true }),
          money("price", "Price", "Precio", { min: 0 }),
          select("interval", "Interval", "Intervalo", [
            opt("month", "Monthly", "Mensual"),
            opt("year", "Yearly", "Anual"),
          ]),
          status([opt("active", "Active", "Activo"), opt("retired", "Retired", "Retirado")]),
        ],
        flow(["active", "retired"]),
      ),
      entity(
        "subscriptions",
        L("Subscription", "Suscripción"),
        L("Subscriptions", "Suscripciones"),
        [
          text("customer", "Customer", "Cliente", { required: true }),
          rel("planId", "Plan", "Plan", "plans", { required: true }),
          num("seats", "Seats", "Puestos", { min: 1 }),
          status([
            opt("trial", "Trial", "Prueba"),
            opt("active", "Active", "Activa"),
            opt("past_due", "Past due", "Vencida"),
            opt("canceled", "Canceled", "Cancelada"),
          ]),
        ],
        flow(
          ["trial", "active", "past_due"],
          [
            { from: "trial", to: ["canceled"] },
            { from: "active", to: ["canceled"] },
          ],
        ),
      ),
      entity(
        "invoices",
        L("Invoice", "Factura"),
        L("Invoices", "Facturas"),
        [
          rel("subscriptionId", "Subscription", "Suscripción", "subscriptions", { required: true }),
          money("amount", "Amount", "Importe"),
          status([opt("open", "Open", "Abierta"), opt("paid", "Paid", "Pagada")]),
        ],
        flow(["open", "paid"]),
      ),
      entity("usage", L("Usage", "Uso"), L("Usage", "Uso"), [
        rel("subscriptionId", "Subscription", "Suscripción", "subscriptions", { required: true }),
        text("metric", "Metric", "Métrica", { required: true }),
        num("quantity", "Quantity", "Cantidad", { min: 0 }),
      ]),
    ],
    dashboard: [
      count("active", "Active subscriptions", "Suscripciones activas", "subscriptions", "active"),
      sum("billed", "Open invoices", "Facturas abiertas", "invoices", "amount"),
      donut("subs", "Subscriptions", "Suscripciones", "subscriptions"),
      bars("usage", "Usage", "Uso", "usage", "quantity"),
    ],
  }),
  defineBlueprint({
    slug: "billing",
    presentation: "ledger",
    entities: [
      entity(
        "accounts",
        L("Account", "Cuenta"),
        L("Accounts", "Cuentas"),
        [
          text("name", "Name", "Nombre", { required: true }),
          text("terms", "Terms", "Condiciones"),
          money("balance", "Balance", "Saldo"),
          status([opt("current", "Current", "Al día"), opt("overdue", "Overdue", "Vencida")]),
        ],
        flow(["current", "overdue"]),
      ),
      entity(
        "invoices",
        L("Invoice", "Factura"),
        L("Invoices", "Facturas"),
        [
          rel("accountId", "Account", "Cuenta", "accounts", { required: true }),
          text("number", "Number", "Número", { required: true }),
          money("amount", "Amount", "Importe"),
          money("balance", "Balance", "Saldo"),
          date("issuedOn", "Issued", "Emitida"),
          status([
            opt("draft", "Draft", "Borrador"),
            opt("issued", "Issued", "Emitida"),
            opt("paid", "Paid", "Pagada"),
            opt("void", "Void", "Anulada"),
          ]),
        ],
        flow(
          ["draft", "issued", "paid"],
          [
            { from: "draft", to: ["void"] },
            { from: "issued", to: ["void"] },
          ],
        ),
      ),
      entity(
        "payments",
        L("Payment", "Pago"),
        L("Payments", "Pagos"),
        [
          rel("invoiceId", "Invoice", "Factura", "invoices", { required: true }),
          money("amount", "Amount", "Importe"),
          status([opt("pending", "Pending", "Pendiente"), opt("settled", "Settled", "Liquidado")]),
        ],
        flow(["pending", "settled"]),
      ),
    ],
    dashboard: [
      sum("outstanding", "Open balances", "Saldos abiertos", "invoices", "balance"),
      count("issued", "Issued invoices", "Facturas emitidas", "invoices", "issued"),
      sum("collected", "Settled payments", "Pagos liquidados", "payments", "amount"),
      donut("invoices", "Invoices", "Facturas", "invoices"),
    ],
  }),
  defineBlueprint({
    slug: "payment-systems",
    presentation: "ledger",
    entities: [
      entity(
        "payments",
        L("Payment", "Pago"),
        L("Payments", "Pagos"),
        [
          text("reference", "Reference", "Referencia", { required: true }),
          text("payer", "Payer", "Pagador", { required: true }),
          money("amount", "Amount", "Importe", { min: 0 }),
          select("method", "Method", "Método", [
            opt("card", "Card", "Tarjeta"),
            opt("transfer", "Transfer", "Transferencia"),
          ]),
          status([
            opt("authorized", "Authorized", "Autorizado"),
            opt("settled", "Settled", "Liquidado"),
            opt("failed", "Failed", "Fallido"),
          ]),
        ],
        flow(["authorized", "settled"], [{ from: "authorized", to: ["failed"] }]),
      ),
      entity(
        "refunds",
        L("Refund", "Reembolso"),
        L("Refunds", "Reembolsos"),
        [
          rel("paymentId", "Payment", "Pago", "payments", { required: true }),
          money("amount", "Amount", "Importe", { min: 0 }),
          status([opt("requested", "Requested", "Solicitado"), opt("sent", "Sent", "Enviado")]),
        ],
        flow(["requested", "sent"]),
      ),
      entity(
        "disputes",
        L("Dispute", "Disputa"),
        L("Disputes", "Disputas"),
        [
          rel("paymentId", "Payment", "Pago", "payments", { required: true }),
          text("reason", "Reason", "Motivo", { required: true }),
          status([
            opt("open", "Open", "Abierta"),
            opt("won", "Won", "Ganada"),
            opt("lost", "Lost", "Perdida"),
          ]),
        ],
        flow(["open", "won"], [{ from: "open", to: ["lost"] }]),
      ),
    ],
    dashboard: [
      sum("volume", "Payment volume", "Volumen de pagos", "payments", "amount"),
      count("disputes", "Open disputes", "Disputas abiertas", "disputes", "open"),
      donut("payments", "Payments", "Pagos", "payments"),
      sum("refunds", "Refunds", "Reembolsos", "refunds", "amount"),
    ],
  }),
  defineBlueprint({
    slug: "product-catalogs",
    presentation: "commerce",
    entities: [
      entity(
        "products",
        L("Product", "Producto"),
        L("Products", "Productos"),
        [
          text("sku", "SKU", "SKU", { required: true }),
          text("name", "Name", "Nombre", { required: true }),
          money("price", "Price", "Precio", { min: 0 }),
          money("cost", "Cost", "Costo", { min: 0 }),
          money("margin", "Margin", "Margen", { readonly: true }),
          text("category", "Category", "Categoría"),
          status([opt("draft", "Draft", "Borrador"), opt("published", "Published", "Publicado")]),
        ],
        flow(["draft", "published"]),
      ),
      entity(
        "variants",
        L("Variant", "Variante"),
        L("Variants", "Variantes"),
        [
          rel("productId", "Product", "Producto", "products", { required: true }),
          text("name", "Name", "Nombre", { required: true }),
          money("price", "Price", "Precio", { min: 0 }),
          status([opt("draft", "Draft", "Borrador"), opt("published", "Published", "Publicado")]),
        ],
        flow(["draft", "published"]),
      ),
      entity(
        "priceLists",
        L("Price list", "Lista de precios"),
        L("Price lists", "Listas de precios"),
        [
          text("name", "Name", "Nombre", { required: true }),
          text("currency", "Currency", "Moneda"),
          status([opt("active", "Active", "Activa"), opt("retired", "Retired", "Retirada")]),
        ],
        flow(["active", "retired"]),
      ),
    ],
    dashboard: [
      count("published", "Published products", "Productos publicados", "products", "published"),
      sum("margin", "Catalog margin", "Margen del catálogo", "products", "margin"),
      donut("products", "Products", "Productos", "products"),
      bars("price", "Prices", "Precios", "products", "price"),
    ],
  }),
  defineBlueprint({
    slug: "customer-management",
    presentation: "pipeline",
    entities: [
      entity(
        "customers",
        L("Customer", "Cliente"),
        L("Customers", "Clientes"),
        [
          text("fullName", "Name", "Nombre", { required: true }),
          email("email", "Email", "Correo", { required: true }),
          select("segment", "Segment", "Segmento", [
            opt("new", "New", "Nuevo"),
            opt("loyal", "Loyal", "Fiel"),
            opt("at_risk", "At risk", "En riesgo"),
          ]),
          num("points", "Points", "Puntos", { min: 0 }),
          status([opt("active", "Active", "Activo"), opt("inactive", "Inactive", "Inactivo")]),
        ],
        flow(["active", "inactive"]),
      ),
      entity(
        "interactions",
        L("Interaction", "Interacción"),
        L("Interactions", "Interacciones"),
        [
          rel("customerId", "Customer", "Cliente", "customers", { required: true }),
          select("channel", "Channel", "Canal", [
            opt("visit", "Visit", "Visita"),
            opt("call", "Call", "Llamada"),
            opt("email", "Email", "Correo"),
          ]),
          area("note", "Note", "Nota"),
          status([opt("open", "Open", "Abierta"), opt("closed", "Closed", "Cerrada")]),
        ],
        flow(["open", "closed"]),
      ),
      entity(
        "segments",
        L("Segment", "Segmento"),
        L("Segments", "Segmentos"),
        [
          text("name", "Name", "Nombre", { required: true }),
          num("size", "Size", "Tamaño", { min: 0 }),
          status([opt("active", "Active", "Activo"), opt("archived", "Archived", "Archivado")]),
        ],
        flow(["active", "archived"]),
      ),
    ],
    dashboard: [
      count("customers", "Active customers", "Clientes activos", "customers", "active"),
      sum("points", "Loyalty points", "Puntos de fidelidad", "customers", "points"),
      donut("segments", "Customers", "Clientes", "customers"),
      count("open", "Open interactions", "Interacciones abiertas", "interactions", "open"),
    ],
  }),
];

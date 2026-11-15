import { calcTotals, lineUnit } from '../utils/calculations.js'
import { DAY, isoDay, startOfDay } from '../utils/formatters.js'

/* ---------- deterministic RNG ---------- */
export function rng(seed) {
  let a = seed >>> 0
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/* ---------- constants ---------- */
export const CATEGORIES = ['Coffee', 'Tea', 'Beverages', 'Burgers', 'Sandwiches', 'Pizza', 'Desserts', 'Snacks']
export const ORDER_TYPES = [
  { value: 'dine-in', label: 'Dine-in' },
  { value: 'takeaway', label: 'Takeaway' },
  { value: 'delivery', label: 'Delivery' },
]
export const ORDER_STATUSES = ['pending', 'preparing', 'ready', 'completed', 'cancelled']
export const NEXT_STATUS = { pending: 'preparing', preparing: 'ready', ready: 'completed' }
export const PAY_METHODS = [
  { value: 'cash', label: 'Cash' },
  { value: 'upi', label: 'UPI' },
  { value: 'card', label: 'Card' },
]
export const ROLES = ['Admin', 'Manager', 'Cashier', 'Kitchen Staff', 'Waiter']
export const EXPENSE_CATEGORIES = ['Rent', 'Salaries', 'Electricity', 'Ingredients', 'Maintenance', 'Marketing', 'Miscellaneous']
export const MODULES = ['Overview', 'Point of Sale', 'Orders', 'Tables', 'Kitchen', 'Menu', 'Inventory', 'Customers', 'Staff', 'Reports', 'Expenses', 'Settings']

/* ---------- menu ---------- */
const SIZE = [{ name: 'Small', delta: -20 }, { name: 'Regular', delta: 0 }, { name: 'Large', delta: 30 }]
const PZ = [{ name: 'Regular (7")', delta: 0 }, { name: 'Medium (9")', delta: 90 }, { name: 'Large (12")', delta: 190 }]
const A_COFFEE = [{ name: 'Extra espresso shot', price: 40 }, { name: 'Oat milk', price: 50 }, { name: 'Caramel syrup', price: 30 }, { name: 'Whipped cream', price: 30 }]
const A_TEA = [{ name: 'Extra ginger', price: 10 }, { name: 'Honey', price: 20 }, { name: 'Oat milk', price: 50 }]
const A_BEV = [{ name: 'Extra ice', price: 0 }, { name: 'Ice cream scoop', price: 50 }, { name: 'Whipped cream', price: 30 }]
const A_BURGER = [{ name: 'Extra cheese slice', price: 30 }, { name: 'Extra patty', price: 60 }, { name: 'Jalapeños', price: 20 }]
const A_SAND = [{ name: 'Extra cheese', price: 30 }, { name: 'Make it grilled', price: 0 }, { name: 'Add fries', price: 60 }]
const A_PIZZA = [{ name: 'Extra cheese', price: 50 }, { name: 'Olives', price: 30 }, { name: 'Jalapeños', price: 20 }, { name: 'Mushrooms', price: 40 }]
const A_DESS = [{ name: 'Vanilla ice cream', price: 50 }, { name: 'Chocolate sauce', price: 25 }]
const A_SNACK = [{ name: 'Cheese dip', price: 30 }, { name: 'Peri peri seasoning', price: 15 }]

const M = (id, name, category, price, veg = true, gst = 5, pop = 5, extra = {}) => ({
  id, name, category, price, veg, gst, pop, available: true, image: '', ...extra,
})

const IMG = { m01: 'cappuccino', m02: 'coldcoffee', m03: 'latte', m04: 'espresso', m05: 'cappuccino', m06: 'espresso', m07: 'espresso', m08: 'tea', m09: 'tea', m10: 'tea', m11: 'icedtea', m12: 'icedtea', m13: 'shake', m14: 'oreo', m15: 'icedtea', m16: 'burger1', m17: 'burger2', m18: 'burger3', m19: 'burger2', m20: 'sandwich', m21: 'sandwich', m22: 'sandwich', m23: 'sandwich', m24: 'pizza1', m25: 'pizza2', m26: 'pizza2', m27: 'pizza2', m28: 'brownie', m29: 'tiramisu', m30: 'cake', m32: 'fries', m33: 'fries' }

export const MENU_SEED = [
  M('m01', 'Cappuccino', 'Coffee', 149, true, 5, 10, { variants: SIZE, addons: A_COFFEE, desc: 'Double espresso with velvety steamed milk foam.' }),
  M('m02', 'Cold Coffee', 'Coffee', 179, true, 5, 10, { variants: SIZE, addons: A_COFFEE, desc: 'Blended iced coffee with a creamy finish.' }),
  M('m03', 'Latte', 'Coffee', 159, true, 5, 8, { variants: SIZE, addons: A_COFFEE, desc: 'Smooth espresso with plenty of steamed milk.' }),
  M('m04', 'Espresso', 'Coffee', 99, true, 5, 6, { variants: [{ name: 'Single', delta: 0 }, { name: 'Double', delta: 40 }], addons: [A_COFFEE[2]], desc: 'Bold, concentrated single-origin shot.' }),
  M('m05', 'Mocha', 'Coffee', 189, true, 5, 5, { variants: SIZE, addons: A_COFFEE, desc: 'Espresso, dark chocolate and steamed milk.' }),
  M('m06', 'Americano', 'Coffee', 119, true, 5, 4, { variants: SIZE, addons: A_COFFEE, desc: 'Espresso topped with hot water.' }),
  M('m07', 'Filter Coffee', 'Coffee', 89, true, 5, 6, { variants: SIZE, addons: [], desc: 'South-Indian style decoction coffee.' }),
  M('m08', 'Masala Tea', 'Tea', 49, true, 5, 10, { variants: [{ name: 'Cutting', delta: -15 }, { name: 'Regular', delta: 0 }, { name: 'Pot (2 cups)', delta: 60 }], addons: A_TEA, desc: 'Spiced Indian chai brewed with fresh ginger.' }),
  M('m09', 'Ginger Lemon Tea', 'Tea', 69, true, 5, 4, { variants: [], addons: A_TEA, desc: 'Soothing ginger and lemon infusion.' }),
  M('m10', 'Green Tea', 'Tea', 79, true, 5, 3, { variants: [], addons: A_TEA, desc: 'Light, antioxidant-rich Darjeeling green tea.' }),
  M('m11', 'Iced Peach Tea', 'Tea', 129, true, 5, 5, { variants: SIZE, addons: A_BEV, desc: 'Chilled black tea with peach and mint.' }),
  M('m12', 'Fresh Lime Soda', 'Beverages', 89, true, 5, 6, { variants: [{ name: 'Sweet', delta: 0 }, { name: 'Salted', delta: 0 }, { name: 'Mixed', delta: 0 }], addons: A_BEV, desc: 'Freshly squeezed lime with soda.' }),
  M('m13', 'Mango Smoothie', 'Beverages', 169, true, 5, 6, { variants: SIZE, addons: A_BEV, desc: 'Alphonso mango blended with yoghurt.' }),
  M('m14', 'Oreo Shake', 'Beverages', 189, true, 5, 7, { variants: SIZE, addons: A_BEV, desc: 'Thick shake with crushed Oreo cookies.' }),
  M('m15', 'Virgin Mojito', 'Beverages', 149, true, 5, 5, { variants: [], addons: A_BEV, desc: 'Mint, lime and soda over crushed ice.' }),
  M('m16', 'Veg Burger', 'Burgers', 189, true, 5, 9, { variants: [], addons: A_BURGER, desc: 'Crispy veggie patty, lettuce and house sauce.' }),
  M('m17', 'Paneer Tikka Burger', 'Burgers', 219, true, 5, 6, { variants: [], addons: A_BURGER, desc: 'Tandoori paneer, mint mayo and onion rings.' }),
  M('m18', 'Aloo Tikki Burger', 'Burgers', 159, true, 5, 6, { variants: [], addons: A_BURGER, desc: 'Spiced potato patty with tangy chutney.' }),
  M('m19', 'Chicken Burger', 'Burgers', 229, false, 5, 6, { variants: [], addons: A_BURGER, desc: 'Crumb-fried chicken with garlic aioli.' }),
  M('m20', 'Cheese Sandwich', 'Sandwiches', 159, true, 5, 8, { variants: [], addons: A_SAND, desc: 'Grilled sandwich with three-cheese melt.' }),
  M('m21', 'Grilled Veg Sandwich', 'Sandwiches', 169, true, 5, 5, { variants: [], addons: A_SAND, desc: 'Seasonal vegetables, pesto and cheese.' }),
  M('m22', 'Club Sandwich', 'Sandwiches', 209, true, 5, 5, { variants: [], addons: A_SAND, desc: 'Triple-decker with veggies and egg-free mayo.' }),
  M('m23', 'Chicken Tikka Sandwich', 'Sandwiches', 229, false, 5, 5, { variants: [], addons: A_SAND, desc: 'Smoky chicken tikka with mint chutney.' }),
  M('m24', 'Margherita Pizza', 'Pizza', 249, true, 5, 8, { variants: PZ, addons: A_PIZZA, desc: 'Hand-stretched base, basil and fresh mozzarella.' }),
  M('m25', 'Farmhouse Pizza', 'Pizza', 329, true, 5, 5, { variants: PZ, addons: A_PIZZA, desc: 'Capsicum, onion, mushroom and sweet corn.' }),
  M('m26', 'Paneer Tikka Pizza', 'Pizza', 349, true, 5, 5, { variants: PZ, addons: A_PIZZA, desc: 'Marinated paneer with tandoori sauce.' }),
  M('m27', 'Pepperoni Pizza', 'Pizza', 379, false, 5, 4, { variants: PZ, addons: A_PIZZA, desc: 'Loaded with spicy pepperoni and cheese.' }),
  M('m28', 'Chocolate Brownie', 'Desserts', 129, true, 5, 9, { variants: [{ name: 'Plain', delta: 0 }, { name: 'With ice cream', delta: 50 }], addons: A_DESS, desc: 'Warm walnut brownie with fudgy centre.' }),
  M('m29', 'Tiramisu', 'Desserts', 189, true, 5, 4, { variants: [], addons: [], desc: 'Classic Italian coffee-soaked dessert.', available: false }),
  M('m30', 'Chocolate Truffle Cake', 'Desserts', 219, true, 5, 4, { variants: [], addons: A_DESS, desc: 'Rich dark-chocolate truffle layers with ganache.' }),
  M('m31', 'Belgian Waffle', 'Desserts', 169, true, 5, 5, { variants: [], addons: A_DESS, desc: 'Crisp waffle with maple syrup and cream.' }),
  M('m32', 'French Fries', 'Snacks', 119, true, 5, 10, { variants: [{ name: 'Regular', delta: 0 }, { name: 'Large', delta: 40 }], addons: A_SNACK, desc: 'Golden, salted shoestring fries.' }),
  M('m33', 'Peri Peri Fries', 'Snacks', 139, true, 5, 6, { variants: [{ name: 'Regular', delta: 0 }, { name: 'Large', delta: 40 }], addons: A_SNACK, desc: 'Fries tossed in peri peri spice.' }),
  M('m34', 'Garlic Bread', 'Snacks', 129, true, 5, 6, { variants: [], addons: [A_SNACK[0]], desc: 'Toasted baguette with garlic butter and herbs.' }),
  M('m35', 'Loaded Nachos', 'Snacks', 179, true, 5, 4, { variants: [], addons: A_SNACK, desc: 'Corn chips, salsa, beans and cheese sauce.' }),
  M('m36', 'Veg Puff', 'Snacks', 59, true, 5, 6, { variants: [], addons: [], desc: 'Flaky pastry with spiced vegetable filling.' }),
].map((m) => ({ ...m, image: IMG[m.id] ? `/menu/${IMG[m.id]}.jpg` : '' }))

/* ---------- inventory ---------- */
const I = (id, name, category, stock, unit, min, cost, supplier, hoursAgo) => ({ id, name, category, stock, unit, min, cost, supplierId: supplier, updatedHoursAgo: hoursAgo })
const INGREDIENT_ROWS = [
  I('i01', 'Coffee Beans (Arabica)', 'Coffee & Tea', 14.5, 'kg', 6, 920, 's1', 6),
  I('i02', 'Full Cream Milk', 'Dairy', 38, 'L', 30, 62, 's2', 2),
  I('i03', 'Oat Milk', 'Dairy', 0, 'L', 6, 240, 's2', 30),
  I('i04', 'Fresh Cream', 'Dairy', 4.2, 'L', 4, 310, 's2', 18),
  I('i05', 'Sugar', 'Grocery', 22, 'kg', 8, 46, 's3', 40),
  I('i06', 'Tea Leaves (Assam CTC)', 'Coffee & Tea', 5.8, 'kg', 3, 480, 's1', 52),
  I('i07', 'Chocolate Syrup', 'Grocery', 3.1, 'L', 3, 380, 's3', 12),
  I('i08', 'Burger Buns', 'Bakery', 46, 'pcs', 40, 9, 's4', 5),
  I('i09', 'Bread Loaf', 'Bakery', 9, 'pcs', 8, 45, 's4', 5),
  I('i10', 'Pizza Base (9")', 'Bakery', 28, 'pcs', 20, 22, 's4', 8),
  I('i11', 'Mozzarella Cheese', 'Dairy', 6.4, 'kg', 5, 520, 's2', 9),
  I('i12', 'Cheese Slices', 'Dairy', 96, 'pcs', 60, 7, 's2', 9),
  I('i13', 'Paneer', 'Dairy', 3.5, 'kg', 4, 340, 's2', 7),
  I('i14', 'Potatoes', 'Produce', 31, 'kg', 15, 28, 's3', 20),
  I('i15', 'Mixed Vegetables', 'Produce', 12, 'kg', 8, 55, 's3', 20),
  I('i16', 'Chicken (boneless)', 'Meat', 2.4, 'kg', 5, 290, 's3', 14),
  I('i17', 'Tomato Sauce', 'Grocery', 9, 'L', 4, 120, 's3', 70),
  I('i18', 'Brownie Mix', 'Bakery', 7.5, 'kg', 3, 260, 's4', 26),
  I('i19', 'Cooking Oil', 'Grocery', 18, 'L', 10, 135, 's3', 48),
  I('i20', 'Mango Pulp', 'Produce', 1.6, 'kg', 3, 190, 's3', 36),
  I('i21', 'Paper Cups (250ml)', 'Packaging', 420, 'pcs', 300, 2.4, 's5', 15),
  I('i22', 'Takeaway Boxes', 'Packaging', 0, 'pcs', 100, 8, 's5', 60),
  I('i23', 'Carry Bags', 'Packaging', 230, 'pcs', 150, 3.2, 's5', 15),
  I('i24', 'Peri Peri Seasoning', 'Grocery', 1.1, 'kg', 1, 410, 's3', 90),
]

export const SUPPLIERS_SEED = [
  { id: 's1', name: 'Nilgiri Coffee Traders', contact: 'Suresh Menon', phone: '+91 98450 22114', email: 'orders@nilgiricoffee.in', category: 'Coffee & Tea', lastOrder: 4 },
  { id: 's2', name: 'Fresh Farms Dairy', contact: 'Harpreet Kaur', phone: '+91 98765 40021', email: 'supply@freshfarms.in', category: 'Dairy', lastOrder: 2 },
  { id: 's3', name: 'Metro Wholesale Mart', contact: 'Ganesh Pillai', phone: '+91 99020 87312', email: 'b2b@metromart.in', category: 'Grocery & Produce', lastOrder: 3 },
  { id: 's4', name: 'Oven Fresh Bakers', contact: 'Fatima Sheikh', phone: '+91 97422 66018', email: 'hello@ovenfresh.in', category: 'Bakery', lastOrder: 1 },
  { id: 's5', name: 'PackPro Supplies', contact: 'Nitin Agarwal', phone: '+91 98110 55409', email: 'sales@packpro.in', category: 'Packaging', lastOrder: 12 },
]

/* recipes: itemId -> [[ingredientId, qty]] ; category fallbacks below */
const RECIPE_BY_CAT = {
  Coffee: [['i01', 0.018], ['i02', 0.15], ['i21', 1]],
  Tea: [['i06', 0.005], ['i02', 0.1], ['i05', 0.01], ['i21', 1]],
  Beverages: [['i05', 0.02], ['i21', 1]],
  Burgers: [['i08', 1], ['i12', 1], ['i15', 0.08], ['i17', 0.02]],
  Sandwiches: [['i09', 0.2], ['i12', 2], ['i15', 0.06]],
  Pizza: [['i10', 1], ['i11', 0.09], ['i17', 0.04], ['i15', 0.06]],
  Desserts: [['i18', 0.1], ['i04', 0.03]],
  Snacks: [['i14', 0.2], ['i19', 0.05]],
}
const RECIPE_OVERRIDE = {
  m03: [['i01', 0.018], ['i02', 0.22], ['i21', 1]],
  m04: [['i01', 0.018], ['i21', 1]],
  m13: [['i20', 0.1], ['i02', 0.1], ['i21', 1]],
  m14: [['i02', 0.2], ['i04', 0.03], ['i21', 1]],
  m17: [['i08', 1], ['i13', 0.07], ['i12', 1]],
  m19: [['i08', 1], ['i16', 0.1], ['i12', 1]],
  m23: [['i09', 0.2], ['i16', 0.1]],
  m26: [['i10', 1], ['i11', 0.09], ['i13', 0.07]],
  m33: [['i14', 0.2], ['i19', 0.05], ['i24', 0.005]],
}
export const recipeFor = (item) => RECIPE_OVERRIDE[item.id] || RECIPE_BY_CAT[item.category] || []

/* ---------- customers ---------- */
const CUST_NAMES = [
  ['Aarav Mehta', 'aarav.mehta'], ['Diya Kapoor', 'diya.kapoor'], ['Rohan Desai', 'rohan.desai'], ['Ishita Banerjee', 'ishita.b'],
  ['Kabir Malhotra', 'kabir.m'], ['Meera Joshi', 'meera.joshi'], ['Arjun Nair', 'arjun.nair'], ['Sana Qureshi', 'sana.q'],
  ['Vihaan Gupta', 'vihaan.g'], ['Tanvi Kulkarni', 'tanvi.k'], ['Aditya Rao', 'aditya.rao'], ['Nisha Patel', 'nisha.patel'],
  ['Siddharth Jain', 'sid.jain'], ['Pooja Iyer', 'pooja.iyer'], ['Rahul Verma', 'rahul.verma'], ['Kavya Reddy', 'kavya.reddy'],
  ['Manav Chopra', 'manav.c'], ['Riya Sen', 'riya.sen'], ['Yash Bhatt', 'yash.bhatt'], ['Anjali Shetty', 'anjali.s'],
  ['Harsh Agarwal', 'harsh.a'], ['Neha Deshpande', 'neha.d'], ['Dev Sharma', 'dev.sharma'], ['Simran Gill', 'simran.gill'],
]

/* ---------- staff ---------- */
export const STAFF_SEED = [
  { id: 'u1', name: 'Rohan Mehta', role: 'Admin', phone: '+91 98200 11001', email: 'rohan@thecoffeehouse.in', active: true, joined: '2021-03-01', shift: 'General (9 AM – 6 PM)' },
  { id: 'u2', name: 'Priya Nair', role: 'Manager', phone: '+91 98200 11002', email: 'priya@thecoffeehouse.in', active: true, joined: '2021-06-14', shift: 'General (9 AM – 6 PM)' },
  { id: 'u3', name: 'Aarav Sharma', role: 'Cashier', phone: '+91 98200 11003', email: 'aarav@thecoffeehouse.in', active: true, joined: '2022-01-10', shift: 'Morning (7 AM – 3 PM)' },
  { id: 'u4', name: 'Sneha Kulkarni', role: 'Cashier', phone: '+91 98200 11004', email: 'sneha@thecoffeehouse.in', active: true, joined: '2022-08-22', shift: 'Evening (2 PM – 10 PM)' },
  { id: 'u5', name: 'Vikram Singh', role: 'Kitchen Staff', phone: '+91 98200 11005', email: 'vikram@thecoffeehouse.in', active: true, joined: '2021-09-05', shift: 'Morning (7 AM – 3 PM)' },
  { id: 'u6', name: 'Karan Patel', role: 'Kitchen Staff', phone: '+91 98200 11006', email: 'karan@thecoffeehouse.in', active: true, joined: '2023-02-18', shift: 'Evening (2 PM – 10 PM)' },
  { id: 'u7', name: 'Ananya Iyer', role: 'Waiter', phone: '+91 98200 11007', email: 'ananya@thecoffeehouse.in', active: true, joined: '2023-05-02', shift: 'Morning (7 AM – 3 PM)' },
  { id: 'u8', name: 'Imran Qureshi', role: 'Waiter', phone: '+91 98200 11008', email: 'imran@thecoffeehouse.in', active: true, joined: '2023-07-19', shift: 'Evening (2 PM – 10 PM)' },
  { id: 'u9', name: 'Deepa Reddy', role: 'Cashier', phone: '+91 98200 11009', email: 'deepa@thecoffeehouse.in', active: false, joined: '2022-11-03', shift: 'Weekend' },
]
const CASHIERS = ['u3', 'u4', 'u2']

/* ---------- settings ---------- */
export const SETTINGS_SEED = {
  business: {
    name: 'The Coffee House', tagline: 'Smart Cafe Operations', address: '14, Linking Road, Bandra West, Mumbai, Maharashtra 400050',
    phone: '+91 22 2640 8812', email: 'hello@thecoffeehouse.in', gstin: '27AABCT1234F1Z5', fssai: '11521998000123', logo: '',
  },
  billing: {
    invoicePrefix: 'TCH', invoiceStart: 1051, inclusive: false, defaultGst: 5, serviceCharge: 0, roundOff: true,
    defaultDiscount: 0, maxDiscount: 30, footer: 'Thank you for visiting! See you soon.',
    coupons: [{ code: 'WELCOME10', type: 'percent', value: 10 }, { code: 'FLAT50', type: 'flat', value: 50 }, { code: 'STAFF20', type: 'percent', value: 20 }],
  },
  printer: { receiptPrinter: 'Epson TM-T82 (USB)', kotPrinter: 'Star TSP143 (Kitchen LAN)', paper: '80mm', autoPrintReceipt: true, autoPrintKot: true, copies: 1, showLogo: true, showQr: true },
  orders: { defaultType: 'dine-in', prepTime: 15, orderPrefix: 'ORD', nextOrder: 1150, autoAccept: true, kdsAlertMinutes: 10, soundAlerts: true },
  notifications: { newOrder: true, lowStock: true, dailySummary: true, kitchenDelay: true, email: false, sms: false },
  system: { theme: 'light', compact: false, language: 'English (India)', timezone: 'Asia/Kolkata (IST)', currency: 'INR (₹)', dateFormat: 'DD MMM YYYY' },
  permissions: {
    Admin: Object.fromEntries(MODULES.map((m) => [m, true])),
    Manager: Object.fromEntries(MODULES.map((m) => [m, m !== 'Settings'])),
    Cashier: Object.fromEntries(MODULES.map((m) => [m, ['Overview', 'Point of Sale', 'Orders', 'Tables', 'Customers'].includes(m)])),
    'Kitchen Staff': Object.fromEntries(MODULES.map((m) => [m, ['Kitchen', 'Orders', 'Inventory'].includes(m)])),
    Waiter: Object.fromEntries(MODULES.map((m) => [m, ['Point of Sale', 'Orders', 'Tables'].includes(m)])),
  },
}

/* ---------- tables ---------- */
const TABLE_ROWS = [
  ['T01', 2, 'Main Hall'], ['T02', 2, 'Main Hall'], ['T03', 4, 'Main Hall'], ['T04', 4, 'Main Hall'],
  ['T05', 4, 'Main Hall'], ['T06', 6, 'Main Hall'], ['T07', 2, 'Window'], ['T08', 2, 'Window'],
  ['T09', 4, 'Patio'], ['T10', 4, 'Patio'], ['T11', 6, 'Patio'], ['T12', 2, 'Patio'],
  ['T13', 4, 'Lounge'], ['T14', 6, 'Lounge'], ['T15', 8, 'Lounge'],
]

/* ---------- build seed ---------- */
function pickWeighted(r, items) {
  const tot = items.reduce((s, i) => s + i.pop, 0)
  let x = r() * tot
  for (const i of items) { x -= i.pop; if (x <= 0) return i }
  return items[0]
}

export function buildLine(item, qty = 1, variant = null, addons = [], note = '') {
  return {
    itemId: item.id, name: item.name, category: item.category, veg: item.veg, price: item.price, gst: item.gst,
    qty, variant, addons, note,
  }
}

export function createSeed(now = Date.now()) {
  const r = rng(20261115)
  const menu = MENU_SEED.map((m) => ({ ...m }))
  const customers = CUST_NAMES.map(([name, h], i) => {
    const orders = 2 + Math.floor(r() * 46)
    const spend = Math.round(orders * (150 + r() * 120))
    return {
      id: `c${i + 1}`, name, phone: `+91 9${Math.floor(1000 + r() * 8999)}${Math.floor(10000 + r() * 89999)}`,
      email: `${h}@gmail.com`, totalOrders: orders, spend, points: Math.floor(spend / 20) - Math.floor(r() * 40),
      lastOrder: now - Math.floor(r() * 25) * DAY - Math.floor(r() * 12) * 3600000, joined: now - (30 + Math.floor(r() * 500)) * DAY,
      tier: spend > 9000 ? 'Gold' : spend > 4000 ? 'Silver' : 'Bronze', notes: '', birthday: '',
    }
  })

  const inventory = INGREDIENT_ROWS.map((x) => ({ ...x, updated: now - x.updatedHoursAgo * 3600000 }))

  /* today's orders */
  const dayStart = startOfDay(now)
  const spanStart = Math.max(dayStart, now - 11 * 3600000)
  const TOTAL = 148
  const times = Array.from({ length: TOTAL }, (_, i) => {
    const f = Math.pow((i + 1) / TOTAL, 0.92)
    return Math.floor(spanStart + f * (now - spanStart - 60000) + r() * 120000)
  }).sort((a, b) => a - b)
  const orders = []
  const cheap = menu.map((m) => ({ ...m, pop: m.pop * (m.price < 130 ? 2.6 : m.price < 190 ? 1.1 : m.price < 260 ? 0.3 : 0.06) }))
  let seq = 1149 - TOTAL
  const ACTIVE = 13
  const typeRoll = () => { const x = r(); return x < 0.52 ? 'dine-in' : x < 0.82 ? 'takeaway' : 'delivery' }
  times.forEach((t, idx) => {
    const fromEnd = TOTAL - 1 - idx
    const nLines = r() < 0.86 ? 1 : r() < 0.8 ? 2 : 3
    const lines = []
    for (let k = 0; k < nLines; k++) {
      const it = pickWeighted(r, cheap)
      if (lines.find((l) => l.itemId === it.id)) continue
      const variant = it.variants.length && r() < 0.25 ? it.variants[Math.floor(r() * it.variants.length)] : null
      const addons = it.addons.length && r() < 0.18 ? [it.addons[Math.floor(r() * it.addons.length)]] : []
      lines.push(buildLine(it, r() < 0.05 ? 2 : 1, variant, addons))
    }
    const totals = calcTotals(lines.map((l) => ({ unit: lineUnit(l), qty: l.qty, gst: l.gst })), r() < 0.07 ? { type: 'percent', value: 10 } : null)
    let status = 'completed'
    let type = typeRoll()
    if (fromEnd < ACTIVE) {
      status = fromEnd < 6 ? 'pending' : fromEnd < 10 ? 'preparing' : 'ready'
      if (fromEnd < 8) type = 'dine-in'
      else if (type === 'dine-in') type = 'takeaway'
    } else if (r() < 0.025) status = 'cancelled'
    const cust = r() < 0.55 ? customers[Math.floor(r() * customers.length)] : null
    const unpaid = fromEnd < 8
    const m = r()
    const method = m < 0.5 ? 'upi' : m < 0.73 ? 'cash' : m < 0.94 ? 'card' : 'split'
    const splits = method === 'split' ? [{ method: 'cash', amount: Math.round(totals.total / 2) }, { method: 'upi', amount: totals.total - Math.round(totals.total / 2) }] : [{ method, amount: totals.total }]
    seq++
    const createdAt = fromEnd < ACTIVE ? now - (fromEnd < 6 ? 1 + fromEnd * 1.5 : fromEnd < 10 ? 7 + (fromEnd - 6) * 2.6 : 16 + (fromEnd - 10) * 3) * 60000 - Math.floor(r() * 40000) : t
    orders.push({
      id: `ORD-${seq}`, seq, createdAt, updatedAt: createdAt, customerId: cust?.id || null, customerName: cust?.name || 'Walk-in',
      type, table: null, items: lines, note: '', discount: totals.discount ? { type: 'percent', value: 10, code: 'WELCOME10' } : null, totals,
      payment: status === 'cancelled' ? { method: null, status: 'refunded', splits: [] } : unpaid ? { method: null, status: 'unpaid', splits: [] } : { method, status: 'paid', splits },
      status, staffId: CASHIERS[Math.floor(r() * 3)], invoiceNo: `${SETTINGS_SEED.billing.invoicePrefix}-${String(seq - 99).padStart(5, '0')}`,
      history: [{ status: 'pending', at: createdAt }],
    })
  })
  /* sprinkle notes on active orders */
  const NOTES = ['Less sugar', 'Extra hot', 'No onion', 'Serve together', 'Allergic to nuts', 'Pack separately']
  orders.slice(-ACTIVE).forEach((o, i) => { if (i % 3 === 0) { o.note = NOTES[i % NOTES.length]; o.items[0].note = o.note } })

  /* tables */
  const tables = TABLE_ROWS.map(([name, seats, area]) => ({ id: name, name, seats, area, status: 'available', guests: 0, orderId: null, since: null, reservedFor: null, reservedAt: null }))
  const dineActive = orders.filter((o) => o.type === 'dine-in' && ['pending', 'preparing', 'ready'].includes(o.status) && o.payment.status === 'unpaid')
  const occTables = ['T01', 'T03', 'T04', 'T06', 'T07', 'T09', 'T13', 'T14']
  dineActive.slice(0, 8).forEach((o, i) => {
    const t = tables.find((x) => x.id === occTables[i])
    o.table = t.id
    t.status = 'occupied'; t.orderId = o.id; t.guests = Math.min(t.seats, 1 + Math.floor(r() * t.seats)); t.since = o.createdAt - Math.floor(r() * 25) * 60000
  })
  ;[['T05', 'Kapoor family', 4, 35], ['T11', 'Birthday – Desai', 6, 70], ['T15', 'Team lunch – Infosys', 8, 120]].forEach(([id, who, g, mins]) => {
    const t = tables.find((x) => x.id === id)
    t.status = 'reserved'; t.reservedFor = who; t.guests = g; t.reservedAt = now + mins * 60000
  })
  /* tables count */
  customers.forEach((c) => {
    const mine = orders.filter((o) => o.customerId === c.id)
    if (mine.length) { c.totalOrders += mine.length; c.spend += mine.reduce((s, o) => s + o.totals.total, 0); c.lastOrder = Math.max(...mine.map((o) => o.createdAt)) }
  })
  /* staff activity */
  const acts = ['Logged in', 'Opened cash drawer', 'Applied 10% discount', 'Marked order ready', 'Processed refund', 'Updated menu price', 'Closed shift report']
  const staff = STAFF_SEED.map((s, i) => ({
    ...s, activity: Array.from({ length: 5 }, (_, k) => ({ text: acts[(i + k * 2) % acts.length], at: now - (k * 47 + i * 13 + 10) * 60000 })),
  }))

  /* expenses */
  const expenses = []
  const addE = (days, category, amount, method, vendor, note) =>
    expenses.push({ id: `e${expenses.length + 1}`, date: now - days * DAY, category, amount, method, vendor, note })
  addE(0, 'Ingredients', 6840, 'upi', 'Metro Wholesale Mart', 'Weekly produce & grocery restock')
  addE(1, 'Ingredients', 4200, 'cash', 'Fresh Farms Dairy', 'Milk, paneer & cream')
  addE(2, 'Maintenance', 2800, 'upi', 'CoolTech Services', 'Espresso machine descaling')
  addE(3, 'Marketing', 3500, 'card', 'Meta Ads', 'Instagram weekend promo')
  addE(4, 'Electricity', 18600, 'upi', 'MSEDCL', 'October electricity bill')
  addE(5, 'Ingredients', 11800, 'upi', 'Nilgiri Coffee Traders', 'Arabica beans 12 kg')
  addE(6, 'Miscellaneous', 950, 'cash', 'Local Stationers', 'Bill rolls & KOT paper')
  addE(8, 'Ingredients', 5100, 'cash', 'Oven Fresh Bakers', 'Buns & pizza bases')
  addE(9, 'Maintenance', 4500, 'card', 'Urban Company', 'Deep cleaning and pest control')
  addE(10, 'Marketing', 6000, 'upi', 'Zomato Ads', 'Sponsored listing – week 2')
  addE(12, 'Ingredients', 7250, 'upi', 'Metro Wholesale Mart', 'Mid-month restock')
  addE(14, 'Miscellaneous', 1800, 'cash', 'PackPro Supplies', 'Takeaway boxes top-up')
  addE(15, 'Salaries', 142000, 'upi', 'Payroll – October', 'Staff salaries for 8 employees')
  addE(16, 'Ingredients', 3900, 'cash', 'Fresh Farms Dairy', 'Dairy restock')
  addE(18, 'Maintenance', 3200, 'upi', 'Sharma Electricals', 'Display lights & wiring')
  addE(20, 'Electricity', 4200, 'upi', 'Tata Power', 'Generator fuel top-up')
  addE(22, 'Marketing', 2500, 'card', 'Canva', 'Menu & poster design subscription')
  addE(24, 'Ingredients', 9400, 'upi', 'Nilgiri Coffee Traders', 'Beans & tea leaves')
  addE(26, 'Miscellaneous', 1200, 'cash', 'Misc', 'Staff tea & snacks')
  addE(28, 'Rent', 95000, 'upi', 'Bandra Realty LLP', 'Monthly rent – November')

  const notifications = [
    { id: 'n1', type: 'stock', title: 'Out of stock: Oat Milk', body: 'Oat Milk has run out. 2 menu add-ons are affected.', at: now - 25 * 60000, read: false },
    { id: 'n2', type: 'stock', title: 'Low stock: Chicken (boneless)', body: '2.4 kg left — below minimum of 5 kg.', at: now - 70 * 60000, read: false },
    { id: 'n3', type: 'order', title: 'Delivery order ready', body: 'A Swiggy delivery order is ready for pickup.', at: now - 8 * 60000, read: false },
    { id: 'n4', type: 'kitchen', title: 'Kitchen delay', body: 'Table T06 order has been waiting over 12 minutes.', at: now - 14 * 60000, read: true },
    { id: 'n5', type: 'system', title: 'Daily summary ready', body: "Yesterday's sales report is available in Reports.", at: now - 9 * 3600000, read: true },
  ]

  return {
    version: 3, menu, categories: CATEGORIES.slice(), orders, tables, customers, staff, inventory, movements: seedMovements(now), suppliers: SUPPLIERS_SEED.map((s) => ({ ...s })),
    purchases: [
      { id: 'p1', date: now - 2 * DAY, supplierId: 's2', invoice: 'FFD-2291', items: [{ ingredientId: 'i02', qty: 60, cost: 62 }, { ingredientId: 'i13', qty: 6, cost: 340 }], total: 5760, status: 'received' },
      { id: 'p2', date: now - 4 * DAY, supplierId: 's1', invoice: 'NCT-0871', items: [{ ingredientId: 'i01', qty: 12, cost: 920 }], total: 11040, status: 'received' },
      { id: 'p3', date: now - 12 * DAY, supplierId: 's5', invoice: 'PP-5521', items: [{ ingredientId: 'i21', qty: 1000, cost: 2.4 }], total: 2400, status: 'received' },
    ],
    wastage: [
      { id: 'w1', date: now - 1 * DAY, ingredientId: 'i02', qty: 2, reason: 'Expired', by: 'Karan Patel' },
      { id: 'w2', date: now - 3 * DAY, ingredientId: 'i15', qty: 1.5, reason: 'Spoiled', by: 'Vikram Singh' },
    ],
    expenses, notifications, settings: JSON.parse(JSON.stringify(SETTINGS_SEED)), currentUserId: 'u1',
  }
}

/* seed some stock movements for history */
export function seedMovements(now) {
  return [
    { id: 'mv_p1', at: now - 2 * DAY, ingredientId: 'i02', type: 'purchase', qty: 60, note: 'PO FFD-2291', by: 'Priya Nair' },
    { id: 'mv_p2', at: now - 4 * DAY, ingredientId: 'i01', type: 'purchase', qty: 12, note: 'PO NCT-0871', by: 'Priya Nair' },
    { id: 'mv_w1', at: now - 1 * DAY, ingredientId: 'i02', type: 'wastage', qty: -2, note: 'Expired', by: 'Karan Patel' },
    { id: 'mv_a1', at: now - 20 * 3600000, ingredientId: 'i03', type: 'adjustment', qty: -3, note: 'Stock count correction', by: 'Priya Nair' },
    { id: 'mv_u1', at: now - 5 * 3600000, ingredientId: 'i01', type: 'usage', qty: -1.8, note: 'Auto-deducted from sales', by: 'System' },
    { id: 'mv_u2', at: now - 4 * 3600000, ingredientId: 'i08', type: 'usage', qty: -24, note: 'Auto-deducted from sales', by: 'System' },
  ].sort((a, b) => b.at - a.at)
}

/* ---------- 30-day history (constant per load) ---------- */
export function buildHistory(now = Date.now(), menu = MENU_SEED) {
  const r = rng(777)
  const today = startOfDay(now)
  const hourW = [0, 0, 0, 0, 0, 0, 0, 3, 7, 9, 8, 7, 11, 12, 8, 6, 8, 9, 11, 10, 7, 4, 1, 0]
  const catShare = { Coffee: 0.3, Tea: 0.1, Beverages: 0.11, Burgers: 0.12, Sandwiches: 0.1, Pizza: 0.12, Desserts: 0.08, Snacks: 0.07 }
  const popTot = menu.reduce((s, m) => s + m.pop, 0)
  const days = []
  for (let d = 30; d >= 1; d--) {
    const date = today - d * DAY
    const wd = new Date(date).getDay()
    const wf = wd === 0 ? 1.28 : wd === 6 ? 1.22 : wd === 5 ? 1.1 : wd === 1 ? 0.84 : 1
    const trend = 1 + (30 - d) * 0.004
    const revenue = Math.round((21800 + r() * 4600) * wf * trend)
    const aov = 158 + r() * 26
    const orders = Math.round(revenue / aov)
    const tShare = [0.5 + r() * 0.06, 0.3 + r() * 0.04]
    const pay = { upi: 0.48 + r() * 0.06, cash: 0.2 + r() * 0.05, card: 0.2 + r() * 0.04 }
    pay.split = 1 - pay.upi - pay.cash - pay.card
    const hw = hourW.map((h) => h * (0.85 + r() * 0.3)); const hs = hw.reduce((a, b) => a + b, 0)
    const hourly = hw.map((h) => Math.round((h / hs) * revenue))
    const hourlyOrders = hw.map((h) => Math.round((h / hs) * orders))
    const byProduct = {}
    menu.forEach((m) => { byProduct[m.id] = Math.round((m.pop / popTot) * orders * 1.15 * (0.8 + r() * 0.4)) })
    const byCategory = {}
    Object.keys(catShare).forEach((c) => { byCategory[c] = Math.round(revenue * catShare[c] * (0.88 + r() * 0.24)) })
    days.push({
      date: isoDay(date), ts: date, revenue, orders,
      dineIn: Math.round(orders * tShare[0]), takeaway: Math.round(orders * tShare[1]), delivery: orders - Math.round(orders * tShare[0]) - Math.round(orders * tShare[1]),
      payments: { upi: Math.round(revenue * pay.upi), cash: Math.round(revenue * pay.cash), card: Math.round(revenue * pay.card), split: Math.round(revenue * pay.split) },
      tax: Math.round(revenue * 0.0476), discounts: Math.round(revenue * (0.025 + r() * 0.03)), refunds: Math.round(revenue * (r() * 0.012)),
      hourly, hourlyOrders, byProduct, byCategory,
    })
  }
  return days
}

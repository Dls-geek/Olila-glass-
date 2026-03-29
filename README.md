# 🛒 ShopEase - Retail Management System

A **complete, production-ready web application** for small retail business owners to manage their store operations efficiently. This system replaces manual account books with a modern, user-friendly interface.

---

## 🎯 Core Features

### 🔐 Authentication System
- Simple login system (email + password)
- Role support: Admin & Staff
- Demo credentials pre-configured

### 📦 Product Management
Each product includes:
- **Product Name**
- **Category** (Glassware, Ceramic, Tableware, etc.)
- **Purchase Price** & **Selling Price**
- **Stock Quantity** tracking
- **Low Stock Alert Level**
- **Product Image** (URL upload)
- **SKU / Barcode** (optional)

**Functions:**
- ✅ Add new products
- ✅ Edit existing products
- ✅ Delete products
- ✅ Search & filter by name/category
- ✅ Image preview

### 📊 Inventory System
- **Auto stock decrease** when sale is completed
- **Stock status indicators:**
  - 🟢 In Stock
  - 🟡 Low Stock Warning
  - 🔴 Out of Stock
- **Inventory History Logs**
  - Stock additions
  - Stock sales

### 💰 Billing & Sales System
This is the **MAIN FEATURE**:
- **Add products to cart** with one click
- **Cart management:**
  - Product name & image
  - Price display
  - Quantity controls
  - Subtotal calculation
- **Auto total calculation**
- **Customer info (MINIMAL):**
  - Customer Name (optional)
  - Phone Number (optional)
- **Actions:**
  - ✅ Complete Sale
  - ✅ Print / Download Invoice (PDF)
  - ✅ Save sale record
- **Auto inventory updates** after sale

### 🧾 Sales History
- List all sales transactions
- **Filter options:**
  - By Date
  - By Customer Name
- View detailed invoice
- Customer information display

### 📈 Reports & Analytics
- **Daily Sales Total**
- **Monthly Sales Overview**
- **Top Selling Products**
- **Weekly Sales Chart**
- **Low Stock Alerts**

---

## 🖼️ UI/UX Features

### Dashboard Overview
![Dashboard Preview](https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&q=80&w=600&h=300)

### Key UI Elements:
- **Clean, modern interface** with gradient colors
- **Mobile responsive** design
- **Large buttons** for fast billing
- **Minimal typing** - click to add products
- **Real-time stock status**
- **Beautiful card-based layouts**
- **Smooth animations & transitions**

### Navigation:
- **Sidebar Menu** with icons
- **Top Bar** with date & store status
- **Quick Action Cards**
- **Search & Filter** options

---

## 🏗️ System Architecture

### Frontend Stack
- **React 19** with modern hooks
- **TypeScript** for type safety
- **Tailwind CSS 4** for styling
- **Lucide React** for icons
- **Recharts** for charts
- **html2canvas & jspdf** for PDF generation

### State Management
- **Context API** (lightweight solution)
- **AppReducer** for state transitions
- **Local state** for UI controls

### Data Structure

#### 📁 Collections

**Products:**
```typescript
{
  id: string,
  name: string,
  category: string,
  purchase_price: number,
  selling_price: number,
  stock: number,
  low_stock_alert: number,
  image_url: string,
  sku?: string,
  created_at: string
}
```

**Sales:**
```typescript
{
  id: string,
  date: string,
  total_amount: number,
  customer_name?: string,
  customer_phone?: string,
  items: SaleItem[]
}
```

**Sale Items:**
```typescript
{
  product_id: string,
  product_name: string,
  quantity: number,
  price: number,
  subtotal: number
}
```

**Inventory Logs:**
```typescript
{
  id: string,
  product_id: string,
  product_name: string,
  change_type: 'add' | 'sell',
  quantity: number,
  date: string
}
```

---

## 🔄 Business Logic Rules

### Critical Workflows:

**When a Sale is Completed:**
1. ✅ **Reduce product stock** quantities
2. ✅ **Create sale record** with all details
3. ✅ **Create sale items** entries
4. ✅ **Add inventory log** entry
5. ✅ **Clear cart** for next transaction

**Stock Protection:**
- 🚫 **Prevent selling** if stock = 0
- ⚠️ **Show warning** if stock is low
- 🛡️ **Quantity validation** during cart updates

**Stock Status Colors:**
- 🟢 **Green**: Stock > Low Alert Level
- 🟡 **Yellow**: Stock ≤ Low Alert Level
- 🔴 **Red**: Stock = 0

---

## 🚀 Getting Started

### Installation

1. **Install dependencies:**
```bash
npm install
```

2. **Start development server:**
```bash
npm run dev
```

3. **Build for production:**
```bash
npm run build
```

4. **Preview production build:**
```bash
npm run preview
```

### Demo Access

**Login Credentials:**
- **Email:** `admin@shop.com`
- **Password:** `1234`

*(Any email and password ≥4 characters will work)*

---

## 📱 Pages & Navigation

### 1. **Dashboard Page** (`/dashboard`)
- **Weekly Sales Chart**
- **Low Stock Alerts**
- **Top Selling Products**
- **Quick Actions**
- **Statistics Cards**
  - Today's Sales
  - Monthly Sales
  - Total Products
  - Total Sales

### 2. **Billing Page** (`/billing`)
- **Product Grid** with search
- **Shopping Cart** with quantity controls
- **Customer Info** form
- **Total Calculation**
- **Complete Sale** button
- **Invoice Generation**

### 3. **Products Page** (`/products`)
- **Product Grid** display
- **Add/Edit/Delete** products
- **Category Filter**
- **Search Functionality**
- **Image Upload**
- **Profit Calculation** display

### 4. **Inventory Page** (`/inventory`)
- **Stock Status Overview**
- **Inventory Table**
- **Status Filters**
- **Inventory Logs** history
- **Low Stock Warnings**

### 5. **Sales History Page** (`/sales`)
- **Sales List** table
- **Date & Search Filters**
- **Invoice Details** modal
- **Sales Statistics**
- **Total Revenue** display

---

## 🎨 Design System

### Color Palette
| Color | Hex | Usage |
|-------|-----|-------|
| **Primary Blue** | `#3B82F6` | Main buttons, accents |
| **Primary Purple** | `#8B5CF6` | Gradients, highlights |
| **Success Green** | `#10B981` | Sales, in-stock |
| **Warning Yellow** | `#F59E0B` | Low stock alerts |
| **Danger Red** | `#EF4444` | Out of stock, delete |
| **Gray** | `#6B7280` | Text, borders |

### Typography
- **Font Family**: System fonts (Inter, -apple-system, BlinkMacSystemFont)
- **Headings**: Bold, large sizes
- **Body**: Regular weight
- **Numbers**: Bold for emphasis

### Components
- **Cards**: Rounded corners (`rounded-2xl`), soft shadows
- **Buttons**: Gradient backgrounds, hover effects
- **Inputs**: Bordered, focus states
- **Badges**: Colored backgrounds, rounded

---

## 🔧 Technical Features

### Performance
- **Lazy Loading** components
- **Optimized re-renders** with useMemo/useCallback
- **Responsive images**
- **Efficient state management**

### Security
- **Input validation**
- **XSS protection** (React built-in)
- **Form validation**
- **Error boundaries**

### Accessibility
- **Semantic HTML**
- **Keyboard navigation**
- **Color contrast**
- **Screen reader support**

---

## 📊 Sample Data

The app comes pre-loaded with **sample products** to demonstrate functionality:

| Product | Category | Price | Stock |
|---------|----------|-------|-------|
| Glass Tumbler Set | Glassware | ₹299 | 45 |
| Ceramic Bowl | Ceramic | ₹180 | 5 |
| Dinner Plate Set | Tableware | ₹450 | 25 |
| Wine Glass | Glassware | ₹250 | 0 |
| Ceramic Mug | Ceramic | ₹120 | 60 |
| Cutlery Set | Tableware | ₹380 | 15 |

---

## 🎯 Usage Guide

### For Business Owners:

1. **Login** to the system
2. **Add your products** in the Products page
3. **Set low stock alerts** for each product
4. **Use Billing page** for daily transactions
5. **Check Dashboard** for overview
6. **View Sales History** for records
7. **Monitor Inventory** for stock levels

### Daily Workflow:

1. **Morning**: Check Dashboard for alerts
2. **During Day**: Use Billing for sales
3. **Evening**: Review sales reports
4. **Weekly**: Check inventory levels
5. **Monthly**: Analyze sales data

---

## 🌟 Key Advantages Over Manual Books

| Feature | ShopEase System | Manual Notebook |
|---------|-----------------|----------------|
| **Speed** | ⚡ Instant calculations | 🐢 Manual math |
| **Accuracy** | ✅ Zero errors | ❌ Human error |
| **Inventory** | 📊 Auto-tracked | 📝 Manual count |
| **Reports** | 📈 Real-time analytics | 📊 None |
| **Search** | 🔍 Instant find | 🔖 Page flipping |
| **Backup** | 💾 Digital storage | 📦 Physical risk |
| **Invoices** | 🖨️ Print/PDF | ✍️ Handwritten |
| **Analytics** | 📉 Sales trends | 📈 None |

---

## 🔮 Future Enhancements

### Planned Features:
1. **Firebase Integration** (Cloud sync)
2. **Barcode Scanner** support
3. **Multiple Users** with roles
4. **Supplier Management**
5. **Expense Tracking**
6. **Email Invoices**
7. **Advanced Reports**
8. **Dark Mode**
9. **Multi-store Support**
10. **Mobile App**

---

## 📞 Support

For support or queries:
- **Check the documentation** above
- **Test all features** in the app
- **Explore each page** to understand functionality

---

## 🎉 Conclusion

**ShopEase** is a **complete retail management solution** that:

✅ **Replaces manual account books** completely
✅ **Is fast and efficient** for daily use
✅ **Reduces human errors** in calculations
✅ **Provides real-time insights**
✅ **Is easy to learn** for non-tech users
✅ **Looks professional** and modern
✅ **Works on mobile** and desktop
✅ **Includes all essential features**

---

### 🚀 Ready to Use!

The application is **fully functional** and ready for daily use. Start exploring the features and transform your retail business management!

---

**Made with ❤️ for small business owners**

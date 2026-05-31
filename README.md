# Scatch — A Premium Bag Shop 🛍️

A full-stack e-commerce web application for buying and selling premium bags, built with Node.js, Express, MongoDB, and EJS.

🔗 **Live Demo:** [https://a-premium-bag-shop.onrender.com](https://a-premium-bag-shop.onrender.com)

---

## Features

### Buyer
- Register and login as a buyer
- Browse all products with sorting (Popular, Newest, Price)
- Filter by New Collection or Discounted Products
- Add products to cart
- Adjust quantity in cart
- Checkout with delivery address and payment mode (COD, UPI, Card)
- View order history with order ID, delivery date, and payment status
- Manage account details

### Seller
- Register and login as a seller (with GSTIN)
- Create new products with image, price, discount, and custom colors
- View and manage only their own listed products
- Edit or delete their own products

### General
- Fully responsive — works on mobile and desktop
- Flash messages for success/error feedback
- Auto-dismiss cart notification after 3 seconds
- Secure JWT-based authentication for both buyers and sellers
- Protected routes — sellers can only edit their own products

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Node.js, Express.js |
| Frontend | EJS, Tailwind CSS |
| Database | MongoDB Atlas (Mongoose) |
| Auth | JWT, bcrypt |
| File Upload | Multer (memory storage) |
| Session | express-session, connect-flash |
| Deployment | Render |

---

## Project Structure

```
Apremiumbagshop/
├── config/
│   ├── mongoose-connection.js
│   └── multer-config.js
├── controllers/
│   └── authController.js
├── middlewares/
│   └── isLoggedIn.js
├── models/
│   ├── owner-model.js
│   ├── product-model.js
│   └── user-model.js
├── public/
│   ├── images/
│   ├── javascripts/
│   └── stylesheets/
├── routes/
│   ├── index.js
│   ├── ownersRouter.js
│   ├── productsRouter.js
│   └── usersRouter.js
├── utils/
│   └── generateToken.js
├── views/
│   ├── partials/
│   │   ├── header.ejs
│   │   └── footer.ejs
│   ├── account.ejs
│   ├── admin.ejs
│   ├── cart.ejs
│   ├── checkout.ejs
│   ├── createproducts.ejs
│   ├── editproduct.ejs
│   ├── index.ejs
│   ├── orderconfirmation.ejs
│   ├── owner-login.ejs
│   └── shop.ejs
├── .env
├── app.js
└── package.json
```

---

## Getting Started Locally

### Prerequisites
- Node.js installed
- MongoDB Atlas account

### Installation

```bash
# Clone the repository
git clone https://github.com/Parishmitabanik/A-premium-bag-shop.git
cd A-premium-bag-shop

# Install dependencies
npm install
```

### Environment Variables

Create a `.env` file in the root directory:

```env
MONGO_URI=your_mongodb_connection_string
JWT_KEY=your_jwt_secret
EXPRESS_SESSION_SECRET=your_session_secret
```

### Run the App

```bash
npm start
```

Visit `http://localhost:3000`

---

## Screenshots

> Add screenshots of your app here

---

## Author

**Parishmita Banik**  
GitHub: [@Parishmitabanik](https://github.com/Parishmitabanik)

---

## License

This project is open source and available under the [MIT License](LICENSE).

const express = require("express");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const cors = require("cors");

const app = express();
const port = process.env.PORT || 4000;

// CORS Configuration
const allowedOrigins = [
    'http://localhost:5173', // For local development
    'https://shopsy-mitalee.netlify.app', // Main application
    'https://master--shopsyadmin.netlify.app', // Admin panel
];

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
}));

// Middleware to log requests
app.use((req, res, next) => {
    console.log(`Received a ${req.method} request to ${req.url}`);
    next();
});

app.use(express.json());

// Database Connection
mongoose.connect("mongodb+srv://your_mongodb_connection_string");

// Image Storage Engine
const storage = multer.diskStorage({
    destination: './upload/images',
    filename: (req, file, cb) => {
        return cb(null, `${file.filename}_${Date.now()}${path.extname(file.originalname)}`);
    }
});

const upload = multer({ storage: storage });
app.use('/images', express.static('upload/images'));

// API Creation
app.get("/", (req, res) => {
    res.send("Express App is Running");
});

// Upload Endpoint for images
app.post("/upload", upload.single('product'), (req, res) => {
    const host = req.get('host');
    const protocol = req.protocol;
    res.json({
        success: 1,
        image_url: `${protocol}://${host}/images/${req.file.filename}`
    });
});

// Product Schema
const Product = mongoose.model("Product", {
    id: { type: Number, required: true },
    name: { type: String, required: true },
    image: { type: String, required: true },
    category: { type: String, required: true },
    new_price: { type: Number, required: true },
    old_price: { type: Number, required: true },
    date: { type: Date, default: Date.now },
    available: { type: Boolean, default: true },
});

// Add Product Endpoint
app.post('/addproduct', async (req, res) => {
    let products = await Product.find({});
    let id = products.length > 0 ? products[products.length - 1].id + 1 : 1;
    
    const product = new Product({
        id: id,
        name: req.body.name,
        image: req.body.image,
        category: req.body.category,
        new_price: req.body.new_price,
        old_price: req.body.old_price,
    });
    
    await product.save();
    res.json({ success: true, name: req.body.name });
});

// Other routes...
app.post('/removeproduct', async (req, res) => {
    await Product.findOneAndDelete({ id: req.body.id });
    res.json({ success: true });
});

app.get('/allproducts', async (req, res) => {
    let products = await Product.find({});
    res.send(products);
});

// User model and authentication endpoints...

app.listen(port, (error) => {
    if (!error) {
        console.log("Server Running on Port " + port);
    } else {
        console.log("Error:" + error);
    }
});

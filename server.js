const express = require('express');
const fs = require('fs');
const cors=require('cors');
const app = express();
const port = 2410;

const rawData = fs.readFileSync('data.json'); 
const data = JSON.parse(rawData);
app.use(express.json());
app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin");
  res.header(
    "Access-Control-Methods",
    "GET,POST,OPTIONS,PUT,PATCH,DELETE,HEAD"
  );
  res.header(
    "Access-Control-Allow-Headers",
    "Origin,X-Requested-With,Content-Type,Accept"
  );
  next();
});
app.use(cors());
app.get("/", (req, res) => {
  res.send("Backend is working fine");
});


app.get('/shops', (req, res) => {
    const shops = data.shops.map(shop => ({ shopId: shop.shopId, shopName: shop.name, rent:shop.rent }));
    res.json(shops);
  });
  
  
  app.post('/shops', (req, res) => {
    const { name, rent } = req.body;
    const newShopId = data.shops.length + 1;
    const newShop = { shopId: newShopId, name, rent };
    data.shops.push(newShop);
    res.json(newShop);
  });
  

  app.get('/products', (req, res) => {
    const products = data.products.map(product => ({
      productId: product.productId,
      productName: product.productName,
      category: product.category,
      description: product.description,
    }));
    res.json(products);
  });
  
 
  app.post('/products', (req, res) => {
    const { productName, category, description } = req.body;
    const newProductId = data.products.length + 1;
    const newProduct = {
      productId: newProductId,
      productName,
      category,
      description,
    };
    data.products.push(newProduct);
    res.json(newProduct);
  });
  
 
  app.put('/products/:id', (req, res) => {
    const productId = parseInt(req.params.id);
    const { category, description } = req.body;
    const product = data.products.find(p => p.productId === productId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    product.category = category;
    product.description = description;
    res.json(product);
  });
  app.get('/product/:id', (req, res) => {
    const productId = parseInt(req.params.id);
    const product = data.products.filter(p => p.productId === productId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(product);
  });
  
  

  app.post('/purchases', (req, res) => {
    const { shopId, productid, quantity, price } = req.body;
    const newPurchaseId = data.purchases.length + 1;
    const newPurchase = {
      purchaseId: newPurchaseId,
      shopId,
      productid,
      quantity,
      price,
    };
    data.purchases.push(newPurchase);
    res.json(newPurchase);
  });
  
 
  app.get('/purchases/shops/:id', (req, res) => {
    const shopId = parseInt(req.params.id);
    const shopPurchases = data.purchases.filter(purchase => purchase.shopId === shopId);
    res.json(shopPurchases);
  });
  

  app.get('/purchases/products/:id', (req, res) => {
    const productid = parseInt(req.params.id);
    const productPurchases = data.purchases.filter(purchase => purchase.productid === productid);
    res.json(productPurchases);
  });
  
 
  app.get('/purchases', (req, res) => {
    const { shop, product, sort } = req.query;
    let purchases = [...data.purchases];
  
    if (shop) {
      const shopIds = Array.isArray(shop) ? shop.map(Number) : [Number(shop)];
      purchases = purchases.filter(purchase => shopIds.includes(purchase.shopId));
    }
  
  
    if (product) {
      const productIds = Array.isArray(product) ? product.map(Number) : [Number(product)];
      purchases = purchases.filter(purchase => productIds.includes(purchase.productid));
    }
  
    if (sort) {
      switch (sort) {
        case 'QtyAsc':
          purchases.sort((a, b) => a.quantity - b.quantity);
          break;
        case 'QtyDesc':
          purchases.sort((a, b) => b.quantity - a.quantity);
          break;
        case 'ValueAsc':
          purchases.sort((a, b) => a.price * a.quantity - b.price * b.quantity);
          break;
        case 'ValueDesc':
          purchases.sort((a, b) => b.price * b.quantity - a.price * a.quantity);
          break;
        default:
          break;
      }
    }
  
    res.json(purchases);
  });
  
  
  app.get('/totalPurchase/shop/:id', (req, res) => {
    const shopId = parseInt(req.params.id);

    const shop = data.shops.find((shop) => shop.shopId === shopId);

    if (!shop) {
        return res.status(404).json({ message: 'Shop not found' });
    }

    const shopPurchases = data.purchases.filter((purchase) => purchase.shopId === shopId);

    const productWiseTotalPurchase = shopPurchases.reduce((result, purchase) => {
        const productId = purchase.productid;

        const product = data.products.find((product) => product.productId === productId);

        if (!product) {
            return result;
        }

        const productName = product.productName;
        const quantity = purchase.quantity;
        const existingProduct = result.find((item) => item.productname === productName);

        if (existingProduct) {
            existingProduct.quantity += quantity;
        } else {
            result.push({ productname: productName, quantity: quantity });
        }

        return result;
    }, []);

    res.json({ shop, productWiseTotalPurchase });
});

  
  app.get('/totalPurchase/product/:id', (req, res) => {
    const productId = parseInt(req.params.id);
  
    const product = data.products.find((product) => product.productId === productId);
  
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
  
    const shopWiseTotalPurchase = data.purchases.reduce((result, purchase) => {
      if (purchase.productid === productId) {
        const shopId = purchase.shopId;
        const shop = data.shops.find((shop) => shop.shopId === shopId);
        if (shop) {
          const shopName = shop.name;
          result[shopName] = (result[shopName] || 0) + purchase.quantity;
        }
      }
      return result;
    }, []);
  
    const result = Object.keys(shopWiseTotalPurchase).map((shopName) => ({
      shopName,
      totalPurchase: shopWiseTotalPurchase[shopName],
    }));
  
    res.json({ product, shopWiseTotalPurchase: result });
  });
  


  
  
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
  
const httpStatus = require("http-status");
const { Cart, Product, User} = require("../models");
const ApiError = require("../utils/ApiError");
const config = require("../config/config");


/**
 * Fetches cart for a user
 * - Fetch user's cart from Mongo
 * - If cart doesn't exist, throw ApiError
 * --- status code  - 404 NOT FOUND
 * --- message - "User does not have a cart"
 *
 * @param {User} user
 * @returns {Promise<Cart>}
 * @throws {ApiError}
 */
const getCartByUser = async (user) => {
  let USER = await Cart.findOne({'email': user.email});
  if(!USER){
    throw new ApiError(httpStatus.NOT_FOUND, "User does not have a cart")
  }
  return USER
};

/**
 * Adds a new product to cart
 * - Get user's cart object using "Cart" model's findOne() method
 * --- If it doesn't exist, create one
 * --- If cart creation fails, throw ApiError with "500 Internal Server Error" status code
 *
 * - If product to add already in user's cart, throw ApiError with
 * --- status code  - 400 BAD REQUEST
 * --- message - "Product already in cart. Use the cart sidebar to update or remove product from cart"
 *
 * - If product to add not in "products" collection in MongoDB, throw ApiError with
 * --- status code  - 400 BAD REQUEST
 * --- message - "Product doesn't exist in database"
 *
 * - Otherwise, add product to user's cart
 *
 *
 *
 * @param {User} user
 * @param {string} productId
 * @param {number} quantity
 * @returns {Promise<Cart>}
 * @throws {ApiError}
 */
const addProductToCart = async (user, productId, quantity) => {
  let USER = await Cart.findOne({'email': user.email});
  let Product_data = await Product.findOne({"_id":productId})
  if(!Product_data){
    throw new ApiError(httpStatus.BAD_REQUEST, "Product doesn't exist in database")
  }
  if(USER){
    let USER_CART = USER.cartItems;
    for(let i=0; i<USER_CART.length; i++){
      if(USER_CART[i].product._id.toString()===productId){
        const propresent  = USER_CART[i].product
        if(propresent){
          throw new ApiError(httpStatus.BAD_REQUEST, "Product already in cart. Use the cart sidebar to update or remove product from cart")
        }
        //const propresent = await USER.cartItems.findById({"_id": productId})
      }
    }
    USER.cartItems.push({product : Product_data,quantity : quantity})
    usercartupdated = await USER.save()
    return usercartupdated
  }else{
    //create cart with the product
    let cartToCreate = {"email":user.email,"cartItems":[{"product":Product_data,"quantity":quantity}]}
    const newCart = await Cart.create(cartToCreate);
    if(!newCart) {
      throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR,"Internal server Error! Cart Creation failed.")
    }
    return newCart;
  }
};

/**
 * Updates the quantity of an already existing product in cart
 * - Get user's cart object using "Cart" model's findOne() method
 * - If cart doesn't exist, throw ApiError with
 * --- status code  - 400 BAD REQUEST
 * --- message - "User does not have a cart. Use POST to create cart and add a product"
 *
 * - If product to add not in "products" collection in MongoDB, throw ApiError with
 * --- status code  - 400 BAD REQUEST
 * --- message - "Product doesn't exist in database"
 *
 * - If product to update not in user's cart, throw ApiError with
 * --- status code  - 400 BAD REQUEST
 * --- message - "Product not in cart"
 *
 * - Otherwise, update the product's quantity in user's cart to the new quantity provided
 *
 *
 * @param {User} user
 * @param {string} productId
 * @param {number} quantity
 * @returns {Promise<Cart>
 * @throws {ApiError}
 */
const updateProductInCart = async (user, productId, quantity) => {
  let USER = await Cart.findOne({'email': user.email});
  let Product_data = await Product.findById({"_id":productId})

  if(!Product_data){
    throw new ApiError(httpStatus.BAD_REQUEST,"Product doesn't exist in database")
  }

  if(USER){
    let USER_CART = USER.cartItems;
    let flag = false;
    for(let i=0; i<USER_CART.length; i++){
      if(USER_CART[i].product._id.toString()===productId){
        flag=true;
        USER.cartItems[i].quantity = quantity;
        break;
      }
    }
    if(flag){
      await USER.save();
      return USER;
    }
    else{
      throw new ApiError(httpStatus.BAD_REQUEST,"Product not in cart")
    }
  }
  else{
    throw new ApiError(httpStatus.BAD_REQUEST,"User does not have a cart. Use POST to create cart and add a product")
  }
  
};

/**
 * Deletes an already existing product in cart
 * - If cart doesn't exist for user, throw ApiError with
 * --- status code  - 400 BAD REQUEST
 * --- message - "User does not have a cart"
 *
 * - If product to update not in user's cart, throw ApiError with
 * --- status code  - 400 BAD REQUEST
 * --- message - "Product not in cart"
 *
 * Otherwise, remove the product from user's cart
 *
 *
 * @param {User} user
 * @param {string} productId
 * @throws {ApiError}
 */
const deleteProductFromCart = async (user, productId) => {
  let USER = await Cart.findOne({'email': user.email});
  if(!USER){
    throw new ApiError(httpStatus.BAD_REQUEST, "User does not have a cart") 
  }
  //let proincart = await USER.findOne({"_id": productId})
  /*let USER_CART = USER.cartItems;
    for(let i=0; i<USER_CART.length; i++){
      if(USER_CART[i].product._id.toString()===productId){
        const proincart  = USER_CART[i].product
        if(!proincart){
          throw new ApiError(httpStatus.BAD_REQUEST, "Product not in cart") 
        }
      }
    }
  if(!proincart){
    throw new ApiError(httpStatus.BAD_REQUEST, "Product not in cart") 
  }*/
  
  /*USER.cartItems.remove({"_id": productId})
  await USER.save()
  return USER*/
  let cartContent = USER.cartItems;
  let productInCart = false;
  let cartItemToDropIndex = -1;
  for(let i=0; i<cartContent.length; i++){
    if(cartContent[i].product._id.toString()===productId){
      productInCart = true;
      cartItemToDropIndex = i;
      break;
    }
  }
  if(!productInCart){
    throw new ApiError(httpStatus.BAD_REQUEST, "Product not in cart")
  }
  USER.cartItems.splice(cartItemToDropIndex,1);
  return await USER.save();
};


// TODO: CRIO_TASK_MODULE_TEST - Implement checkout function
/**
 * Checkout a users cart.
 * On success, users cart must have no products.
 *
 * @param {User} user
 * @returns {Promise}
 * @throws {ApiError} when cart is invalid
 */
const checkout = async (user) => {
  // console.log(user);
  const USER_CART = await Cart.findOne({'email':user.email});
  // console.log(USER_CART)
  if(!USER_CART)
    throw new ApiError(httpStatus.NOT_FOUND,"User does not have a cart");
  if(USER_CART.cartItems.length===0)
    throw new ApiError(httpStatus.BAD_REQUEST,"No product in a cart");
  if(user.address===config.default_address)
    throw new ApiError(httpStatus.BAD_REQUEST,"ADDRESS_NOT_SET")
  if(user.hasSetNonDefaultAddress()){  
    let amount = 0;
    for(let i=0;i<USER_CART.cartItems.length;i++)
        amount+= USER_CART.cartItems[i].product.cost*USER_CART.cartItems[i].quantity;
    if(amount>user.walletMoney)
      throw new ApiError(httpStatus.BAD_REQUEST,"wallet balance is insufficient")
    else{
      user.walletMoney-=amount;
      USER_CART.cartItems=[];
      await user.save();
      await USER_CART.save();
      // return USER_CART;
    }
  }
};

module.exports = {
  getCartByUser,
  addProductToCart,
  updateProductInCart,
  deleteProductFromCart,
  checkout,
};

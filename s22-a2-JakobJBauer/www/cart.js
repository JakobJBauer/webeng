import {calculatePrice} from "./frame.js";

const CART_KEY = 'cart';
/**
 * 
 * @returns An array containing all cart items in the local storage.
 */
export function getCartItems() {
    let cart = JSON.parse(localStorage.getItem(CART_KEY));
    if (!cart) {
        cart = [];
    }
    return cart;
}

export function getCartSizeText() {
    const size = getCartItems().length;
    return 'Cart' + (size !== 0 ? ` (${size})` : '');
}

export function addCartItem(item) {
    let items = getCartItems();
    items.push(item);
    localStorage.setItem(CART_KEY, JSON.stringify(items));
}

export function deleteCartItem(item) {
    let items = getCartItems();
    items = items.filter((curr_item) => JSON.stringify(curr_item) !== JSON.stringify(item));
    localStorage.setItem(CART_KEY, JSON.stringify(items));
}

export function getTotal() {
    return getCartItems().map(item => calculatePrice(item.printSize, item.frameStyle, item.frameWidth, item.matWidth)).reduce((prev, curr) => prev + curr, 0);
}
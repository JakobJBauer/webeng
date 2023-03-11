/**
 * This class represents the cart for one session
 */
const fs = require("fs");
const path = require("path");
const {calculatePrice} = require("./price");

const MISSING = 'missing';
const INVALID = 'invalid';

class Cart {
  items = new Map();

  /**
   * Get all items in the cart
   * @return {any[]} The items as an array
   */
  getItems() {
    return [...this.items.values()];
  }

  getItem(cartId) {
    return this.items.get(cartId);
  }

  addItem(item) {
    const frameStyles = JSON.parse(fs.readFileSync(path.join(__dirname, '../resources/frames.json'))).map(frame => frame.id);
    const matColors = JSON.parse(fs.readFileSync(path.join(__dirname, '../resources/mat-colors.json'))).map(color => color.id);

    let errorMsg = {
      message: 'Validation failed',
      errors: {}
    }

    if (item.artworkId === undefined) errorMsg.errors.artworkId = MISSING;
    else if (typeof item.artworkId !== 'number') errorMsg.errors.artworkId = INVALID;

    if (item.printSize === undefined) errorMsg.errors.printSize = MISSING;
    else if (!['S', 'M', 'L'].includes(item.printSize)) errorMsg.errors.printSize = INVALID;

    if (item.frameStyle === undefined) errorMsg.errors.frameStyle = MISSING;
    else if (!frameStyles.includes(item.frameStyle)) errorMsg.errors.frameStyle = INVALID;

    if (item.frameWidth === undefined) errorMsg.errors.frameWidth = MISSING;
    else if (typeof item.frameWidth !== 'number' || item.frameWidth > 50 || item.frameWidth < 20)
      errorMsg.errors.frameWidth = INVALID;

    if (!item.matColor && item.matWidth && item.matWidth !== 0) errorMsg.errors.matColor = MISSING;
    else if (item.matColor && !matColors.includes(item.matColor)) errorMsg.errors.matColor = INVALID;

    if (item.matWidth === undefined) errorMsg.errors.matWidth = MISSING;
    else if (typeof item.matWidth !== 'number' || item.matWidth > 100 || item.matWidth < 0)
      errorMsg.errors.matWidth = INVALID;

    if (Object.keys(errorMsg.errors).length) return errorMsg;

    const mappedItem = {
      cartItemId: this.getItems().length + 1,
      artworkId: item.artworkId,
      printSize: item.printSize,
      frameStyle: item.frameStyle,
      frameWidth: item.frameWidth,
      matColor: item.matColor,
      matWidth: item.matWidth,
      price: calculatePrice(item.printSize, item.frameStyle, item.frameWidth, item.matWidth)
    }
    this.items.set(mappedItem.cartItemId, mappedItem);
  }

  deleteItem(itemId) {
    if (!this.items.get(itemId)) return false;
    this.items.delete(itemId);
    return true;
  }

  deleteCart() {
    this.items = new Map;
  }
}

module.exports = Cart;

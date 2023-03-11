<template>
  <main>
    <section class="cart">
      <span v-if="$store.getters.cartIsEmpty">There are no items in your shopping cart.</span>

      <cart-item v-for="item in $store.state.cart" :key="item.cartItemId" :cart-item="item"></cart-item>
      <div class="cart-total" v-if="!$store.getters.cartIsEmpty">
        <div class="price">Total: € {{($store.getters.cartTotal/100).toFixed(2)}}</div>
        <router-link class="cart-checkout" to="/checkout" tag="button">Checkout</router-link>
      </div>
    </section>
  </main>
</template>

<script>
import CartItem from "@/components/CartItem";
export default {
  name: "Cart",
  components: {
    CartItem
  },
  data() {
    return {
      cart: null
    }
  },
  mounted() {
    this.cart = this.$store.state.cart;
  }
};
</script>

<style scoped>
.cart {
  display: flex;
  flex-direction: column;
}

.cart-total {
  align-self: flex-end;
  font-size: 1.5rem;
  font-weight: bold;
  margin: 1rem;
  text-align: right;
}

.cart-checkout {
  align-self: flex-end;
  margin-top: 1em;
  font-size: 1rem;
}

@media (max-width: 600px) {
  .cart-total {
    align-self: stretch;
    text-align: center;
  }

  .cart-checkout {
    align-self: stretch;
    width: 100%;
  }
}

</style>

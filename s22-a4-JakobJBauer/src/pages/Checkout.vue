<template>
  <main v-if="status === 'ready' || status === 'error'">

    <div class="error-message" v-if="status === 'error'">An error occurred during payment. Please try again.</div>

    <form class="checkout-form" id="checkout-form" @submit.prevent="status ='processing'; sendForm()">
      <fieldset>
        <legend>Contact information</legend>
        <div class="grid">
          <label for="email">Email</label>
          <input type="email" name="email" id="email" required v-model="customer.email"/>
        </div>
      </fieldset>

      <fieldset>
        <legend>Shipping address</legend>
        <div class="grid">
          <label for="name">Name</label>
          <input
            type="text"
            name="name"
            id="name"
            required
            v-model="customer.shipping_address.name"
          />

          <label for="address">Address</label>
          <input
            type="text"
            name="address"
            id="address"
            required
            v-model="customer.shipping_address.address"
          />

          <label for="city">City</label>
          <input
            type="text"
            name="city"
            id="city"
            required
            v-model="customer.shipping_address.city"
          />

          <label for="country">Country</label>
          <select name="country" id="country" v-model="customer.shipping_address.country">
            <option v-for="country in $store.state.destinations.values()" :key="country.isoCode" :value="country.isoCode">{{country.displayName}}</option>
          </select>

          <label for="postalcode">Postal code</label>
          <input
            type="text"
            name="postalcode"
            id="postalcode"
            v-model="customer.shipping_address.postal_code"
            required
          />

          <label for="phone">Phone (optional)</label>
          <input type="tel" name="phone" id="phone" v-model="customer.shipping_address.phone" placeholder="+43 123456789" />
        </div>
      </fieldset>

      <fieldset>
        <legend>Card details</legend>
        <div class="grid">
          <label for="cardholder">Name on card</label>
          <input type="text" name="cardholder" id="cardholder" v-model="card.cardholder" required />

          <label for="cardnumber">Card number</label>
          <input type="text" name="cardnumber" id="cardnumber" v-model="card.cardnumber" required />

          <label for="cardexpiry">Expiration</label>
          <input
            type="text"
            name="cardexpiry"
            id="cardexpiry"
            v-model="cardexpiry"
            pattern="\d{2}/\d{4}"
            placeholder="MM/YYYY"
            required
          />

          <label for="cardcvc">CVC</label>
          <input
            name="cardcvc"
            id="cardcvc"
            v-model.number="card.cvc"
            type="text"
            pattern="\d{3}"
            required
          />
        </div>
      </fieldset>

      <div>
        <div>
          Subtotal: €
          <span id="price-subtotal">{{($store.getters.cartTotal/100).toFixed(2)}}</span>
        </div>
        <div>
          Shipping Costs: 
          <span id="price-shipping" :style="{ fontWeight: (shippingCosts !== 0 ? 'normal' : 'bold')}">{{shippingCosts === 0 ? "Free" : "€ " + (shippingCosts/100).toFixed(2)}}</span>
        </div>
        <div v-if="shippingCosts !== 0 && destCountry && destCountry.freeShippingPossible" id="free-shipping-from">(Free shipping from: €
          <span id="free-shipping-threshold">{{destCountry && (destCountry.freeShippingThreshold/100).toFixed(2)}}</span>)
        </div>
      </div>

      <div>
        <div class="checkout-total">
          Total: €
          <span id="price-total">{{(($store.getters.cartTotal + shippingCosts)/100).toFixed(2)}}</span>
        </div>
      </div>

      <div class="button-row">
        <router-link to="/cart">&larr; Back to Cart</router-link>
        <button type="submit" id="pay-button">Pay</button>
      </div>
    </form>
  </main>

  <div v-else-if="status === 'processing'">
    <h2>Processing payment...</h2>
    <img src="@/assets/images/spinner.gif" width="50" height="50" />
  </div>

  <div v-else-if="status === 'successful'">
    <div>Your payment was completed successfully.</div>
    <h2>Thank you for your purchase!</h2>
    <div>
      <router-link to="/search">&larr; Back to Search</router-link>
    </div>
  </div>
</template>

<script>
import {checkout} from "@/services/ArtmartService";
import {confirmPaymentIntent} from "@/services/BlingService";

export default {
  name: "Checkout",
  data: function() {
    return {
      status: "ready",
      error: false,
      customer: {
        email: "",
        shipping_address: {
          name: "",
          address: "",
          city: "",
          country: "AT",
          postal_code: "",
          phone: ""
        }
      },
      card: {
        cardholder: "",
        cardnumber: "",
        cvc: null
      },
      cardexpiry: ""
    };
  },
  computed: {
    destCountry() {
      return this.$store.state.destinations.get(this.customer.shipping_address.country);
    },
    shippingCosts() {
      if (this.destCountry?.freeShippingPossible && this.$store.getters.cartTotal >= this.destCountry?.freeShippingThreshold)
        return 0;
      return this.destCountry?.price;
    }
  },
  methods: {
    async sendForm() {
      const payment_intend = await checkout(this.customer);
      if (!payment_intend) {
        this.status = 'error';
        return;
      }

      const card = {
        cardholder: this.card.cardholder,
        cardnumber: this.card.cardnumber,
        cvc: this.card.cvc,
        exp_month: Number.parseInt(this.cardexpiry.split('/')[0]),
        exp_year: Number.parseInt(this.cardexpiry.split('/')[1])
      };

      const payment = await confirmPaymentIntent(payment_intend.payment_intent_id, payment_intend.client_secret, card);
      this.status = payment ? 'successful' : 'error';
    }
  },
  mounted() {
    if (this.$store.getters.cartIsEmpty) this.$router.push('/cart');
  }
};
</script>

<style scoped>
.error-message {
  color: red;
}

.checkout-form > div {
  margin: 1rem 0;
  text-align: right;
}

/* this is a workaround for a Chrome bug that disallows display:grid on fieldset elements */
.checkout-form div.grid {
  display: grid;
  grid-template-columns: 1fr 300px;
  grid-gap: 0.5em 1em;
  align-items: center;
}

.checkout-form fieldset {
  border: none;
  margin: 2rem 0;
  padding: 0;
}

.checkout-form fieldset legend {
  font-weight: bold;
  font-size: 1.5em;
  margin-bottom: 0.5rem;
}

.checkout-form input {
  -moz-appearance: textfield;
  font-family: inherit;
  font-size: 1em;
  height: 1.25rem;
  line-height: 1.25rem;
  padding: 3px;
  text-indent: 1.25px;
  border: 1px solid rgba(0, 0, 0, 0.10);
}

.checkout-total {
  font-size: 1.5rem;
  font-weight: bold;
}

.checkout-form .button-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

#free-shipping-from {
  font-size: 0.65em;
}

@media (max-width: 600px) {
  .checkout-form {
    width: 100%;
  }
  .checkout-form label {
    margin-bottom: -0.25em;
    margin-top: 0.25em;
  }
  .checkout-form input {
    margin: 0;
  }
  .checkout-form select {
    width: 100%;
  }
  .checkout-form div.grid {
    grid-template-columns: 1fr;
  }

  .checkout-form .button-row {
    flex-direction: column-reverse;
    align-items: flex-start;
  }

  .checkout-form .button-row button {
    width: 100%;
    margin-bottom: 1em;
  }
}
</style>

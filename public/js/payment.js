var stripe = Stripe('pk_test_l8x1BfMfBFnoGfXEgUeHFLi100OFbnHJpk');

var checkoutButton = document.querySelector('#checkout-button');
checkoutButton.addEventListener('click', function () {
  stripe.redirectToCheckout({
    items: [{
      // Define the product and SKU in the Dashboard first, and use the SKU
      // ID in your client-side code.
      sku: 'sku_123',
      quantity: 1
    }],
    successUrl: 'https://www.example.com/success',
    cancelUrl: 'https://www.example.com/cancel'
  });
});
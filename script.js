let cart = JSON.parse(localStorage.getItem('MODERN_SHOP_CART')) || [];
let wishlist = JSON.parse(localStorage.getItem('MODERN_SHOP_WISH')) || [];

document.addEventListener('DOMContentLoaded', () => {
    injectFullUIStyles();
    injectSideDrawers();
    setupProductActions();
    updateUI();
});

// 1. Unified Styles - RESPONSIVE UPDATE
function injectFullUIStyles() {
    const style = document.createElement('style');
    style.innerHTML = `
        .navbar .icons span { position: relative; display: inline-block; background: transparent; cursor: pointer; }
        
        .badge {
            position: absolute; top: -2px; right: -2px;
            background: #ff4757; color: white;
            font-size: 10px; font-weight: bold;
            width: 18px; height: 18px;
            display: flex; align-items: center; justify-content: center;
            border-radius: 50%; border: 2px solid #FFFDD0;
            pointer-events: none;
        }

        /* Drawer Base Styles */
        .side-drawer {
            position: fixed; top: 0; right: -100%; width: 400px; height: 100vh;
            background: white; box-shadow: -10px 0 30px rgba(0,0,0,0.1);
            z-index: 10000; transition: 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
            display: flex; flex-direction: column;
        }
        .side-drawer.active { right: 0; }

        .drawer-header { 
            padding: 25px; display: flex; justify-content: space-between; 
            align-items: center; border-bottom: 1px solid #f1f1f1; background: #fff;
        }

        .drawer-list { 
            flex: 1; overflow-y: auto; padding: 20px; background: #fff;
        }

        .drawer-footer { 
            background: white; padding: 25px; border-top: 1px solid #f1f1f1;
        }

        .btn-main { 
            width: 100%; background: #f7903b; color: white; border: none; 
            padding: 18px; border-radius: 12px; font-weight: 800; cursor: pointer;
            font-size: 16px; transition: 0.3s;
        }
        
        .btn-main:active { transform: scale(0.98); }

        .item-row { display: flex; gap: 15px; margin-bottom: 20px; padding-bottom: 15px; border-bottom: 1px solid #fafafa; align-items: center; }
        .item-row img { width: 60px; height: 60px; border-radius: 8px; object-fit: cover; }
        .item-info { flex: 1; background: transparent; }
        
        .move-btn { color: #ff4757; cursor: pointer; margin-right: 10px; background: transparent; }
        .del-btn { color: #ddd; cursor: pointer; background: transparent; }

        /* --- RESPONSIVE MOBILE OVERRIDES --- */
        @media (max-width: 600px) {
            .side-drawer {
                width: 100% !important; /* Drawer fills screen width on mobile */
                right: -100%;
            }
            .drawer-header {
                padding: 15px 20px;
            }
            .drawer-footer {
                padding: 15px 20px;
                padding-bottom: 30px; /* Extra space for mobile bottom bars */
            }
            .btn-main {
                padding: 15px;
                font-size: 14px;
            }
            .item-row img {
                width: 50px;
                height: 50px;
            }
        }
    `;
    document.head.appendChild(style);
}

// 2. Create the HTML for BOTH Cart and Wishlist sidebars
function injectSideDrawers() {
    const cartDrawer = document.createElement('div');
    cartDrawer.id = 'cart-overlay';
    cartDrawer.className = 'side-drawer';
    cartDrawer.innerHTML = `
        <div class="drawer-header">
            <h3 style="background:transparent;"><i class="fa-solid fa-shopping-cart"></i> CART</h3>
            <span class="close-drawer" style="cursor:pointer; font-size:24px; background:transparent;">&times;</span>
        </div>
        <div id="cart-list" class="drawer-list"></div>
        <div class="drawer-footer">
            <div style="display:flex; justify-content:space-between; margin-bottom:15px; font-weight:900; background:transparent;">
                <span style="background:transparent;">Total</span><span id="cart-total" style="background:transparent;">₦0</span>
            </div>
            <button class="btn-main" id="checkout-btn">Complete Order</button>
        </div>
    `;

    const wishDrawer = document.createElement('div');
    wishDrawer.id = 'wish-overlay';
    wishDrawer.className = 'side-drawer';
    wishDrawer.innerHTML = `
        <div class="drawer-header">
            <h3 style="background:transparent;"><i class="fa-solid fa-heart"></i> WISHLIST</h3>
            <span class="close-drawer" style="cursor:pointer; font-size:24px; background:transparent;">&times;</span>
        </div>
        <div id="wish-list" class="drawer-list"></div>
        <div class="drawer-footer">
            <button class="btn-main" onclick="moveAllToCart()">Move All to Cart</button>
        </div>
    `;

    document.body.appendChild(cartDrawer);
    document.body.appendChild(wishDrawer);

    const navIcons = document.querySelectorAll('.navbar .icons span');
    
    if(navIcons[0]) {
        navIcons[0].addEventListener('click', (e) => {
            e.preventDefault();
            wishDrawer.classList.add('active');
            cartDrawer.classList.remove('active');
        });
    }

    if(navIcons[1]) {
        navIcons[1].addEventListener('click', (e) => {
            e.preventDefault();
            cartDrawer.classList.add('active');
            wishDrawer.classList.remove('active');
        });
    }

    document.querySelectorAll('.close-drawer').forEach(btn => {
        btn.onclick = () => btn.closest('.side-drawer').classList.remove('active');
    });

    document.getElementById('checkout-btn').addEventListener('click', () => {
        if(cart.length > 0) {
            alert("Order Placed Successfully!");
            cart = [];
            saveAndUpdate();
        } else {
            alert("Your cart is empty!");
        }
    });
}

function setupProductActions() {
    document.addEventListener('click', (e) => {
        const card = e.target.closest('.cards');
        if (!card) return;

        const product = {
            title: card.querySelector('p:not(.tags)').innerText,
            price: parseInt(card.querySelector('h2').innerText.replace(/[^0-9]/g, '')),
            img: card.querySelector('img').src,
            category: card.querySelector('.tags').innerText
        };

        if (e.target.tagName === 'BUTTON' && e.target.innerText.includes('Cart')) {
            cart.push(product);
            saveAndUpdate();
            document.getElementById('cart-overlay').classList.add('active');
        }
    });
}

function updateUI() {
    const cartCont = document.getElementById('cart-list');
    const wishCont = document.getElementById('wish-list');
    let total = 0;

    cartCont.innerHTML = cart.length ? '' : '<p style="text-align:center; padding:20px; color:#999; background:transparent;">Cart is empty</p>';
    cart.forEach((item, i) => {
        total += item.price;
        cartCont.innerHTML += `
            <div class="item-row" style="background:transparent;">
                <img src="${item.img}">
                <div class="item-info">
                    <h4 style="margin:0; font-size:14px; background:transparent;">${item.title}</h4>
                    <p style="color:orangered; font-weight:bold; margin:5px 0; background:transparent;">₦${item.price.toLocaleString()}</p>
                </div>
                <i class="fa-solid fa-heart move-btn" title="Move to Wishlist" onclick="moveToWish(${i})"></i>
                <i class="fa-solid fa-trash del-btn" onclick="removeCart(${i})"></i>
            </div>`;
    });

    wishCont.innerHTML = wishlist.length ? '' : '<p style="text-align:center; padding:20px; color:#999; background:transparent;">Wishlist is empty</p>';
    wishlist.forEach((item, i) => {
        wishCont.innerHTML += `
            <div class="item-row" style="background:transparent;">
                <img src="${item.img}">
                <div class="item-info">
                    <h4 style="margin:0; font-size:14px; background:transparent;">${item.title}</h4>
                    <p style="color:orangered; font-weight:bold; margin:5px 0; background:transparent;">₦${item.price.toLocaleString()}</p>
                </div>
                <i class="fa-solid fa-cart-plus move-btn" style="color:#f7903b" title="Add to Cart" onclick="wishToCart(${i})"></i>
                <i class="fa-solid fa-trash del-btn" onclick="removeWish(${i})"></i>
            </div>`;
    });

    document.getElementById('cart-total').innerText = `₦${total.toLocaleString()}`;
    updateBadgeCounts();
}

function saveAndUpdate() {
    localStorage.setItem('MODERN_SHOP_CART', JSON.stringify(cart));
    localStorage.setItem('MODERN_SHOP_WISH', JSON.stringify(wishlist));
    updateUI();
}

function updateBadgeCounts() {
    const icons = document.querySelectorAll('.navbar .icons span');
    [wishlist.length, cart.length].forEach((count, i) => {
        if(!icons[i]) return;
        let b = icons[i].querySelector('.badge');
        if (!b) icons[i].insertAdjacentHTML('beforeend', `<div class="badge">${count}</div>`);
        else { b.innerText = count; b.style.display = count > 0 ? 'flex' : 'none'; }
    });
}

window.moveToWish = (i) => {
    wishlist.push(cart[i]);
    cart.splice(i, 1);
    saveAndUpdate();
};

window.wishToCart = (i) => {
    cart.push(wishlist[i]);
    wishlist.splice(i, 1);
    saveAndUpdate();
};

window.removeCart = (i) => { cart.splice(i, 1); saveAndUpdate(); };
window.removeWish = (i) => { wishlist.splice(i, 1); saveAndUpdate(); };

window.moveAllToCart = () => {
    cart = [...cart, ...wishlist];
    wishlist = [];
    saveAndUpdate();
    document.getElementById('wish-overlay').classList.remove('active');
    document.getElementById('cart-overlay').classList.add('active');
};
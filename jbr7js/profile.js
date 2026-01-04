// Profile Page Functionality - Unified Version

// Show specific profile section
function showProfileSection(sectionName) {
    // Hide all sections
    const sections = document.querySelectorAll('.profile-section');
    sections.forEach(section => {
        section.classList.remove('active');
        section.style.display = 'none';
    });
    
    // Remove active class from all menu items
    const menuItems = document.querySelectorAll('.profile-menu-item');
    menuItems.forEach(item => {
        item.classList.remove('active');
    });
    
    // Show selected section
    const selectedSection = document.getElementById(`${sectionName}-section`);
    if (selectedSection) {
        selectedSection.classList.add('active');
        selectedSection.style.display = 'block';
    }
    
    // Add active class to clicked menu item
    const activeMenuItem = document.querySelector(`[data-section="${sectionName}"]`);
    if (activeMenuItem) {
        activeMenuItem.classList.add('active');
    }
}

// Fetch session info and populate profile page
async function fetchSessionAndPopulateProfile() {
    try {
        console.debug('profile.js: requesting /jbr7php/profile.php');
        const response = await fetch('/jbr7php/profile.php', {
            method: 'GET',
            credentials: 'same-origin',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        console.debug('profile.js: response status', response.status);

        if (!response.ok) {
            if (response.status === 401) {
                // Not authenticated - redirect to login
                window.location.href = '/login.html';
                return;
            }
            // Try to read error message
            try {
                const txt = await response.text();
                console.warn('profile.php returned non-ok:', response.status, txt);
            } catch (e) {
                console.warn('profile.php error:', response.status);
            }
            populateGuestProfile();
            return;
        }

        const data = await response.json();
        console.debug('profile.js: profile.php json', data);

        if (!data || !data.success || !data.user) {
            console.error('Invalid response format:', data);
            populateGuestProfile();
            return;
        }

        populateProfilePage(data);
    } catch (error) {
        console.error('Error fetching profile:', error);
        populateGuestProfile();
        showNotification('Unable to load profile data', 'info');
    }
}

// Populate the profile page with user data
function populateProfilePage(data) {
    const user = data.user;
    const stats = data.stats || {};
    const savedItems = data.items || data.saved_items || [];

    // Update profile header
    const profileName = document.querySelector('.profile-name');
    const profileEmail = document.querySelector('.profile-email');
    const profileMemberSince = document.querySelector('.profile-member-since');

    if (profileName) {
        profileName.textContent = user.username || 'User';
    }

    if (profileEmail) {
        profileEmail.innerHTML = `<i class="fas fa-envelope"></i> ${user.email || ''}`;
    }

    if (profileMemberSince) {
        const memberSince = formatMemberSince(user.created_at);
        profileMemberSince.innerHTML = `<i class="fas fa-calendar-alt"></i> Member since ${memberSince}`;
    }

    // Update stats cards
    const statCards = document.querySelectorAll('.profile-stats .stat-card');
    statCards.forEach(card => {
        const label = (card.querySelector('.stat-label') || {}).textContent || '';
        const numEl = card.querySelector('.stat-number');
        if (!numEl) return;
        
        if (/Total Orders/i.test(label)) {
            numEl.textContent = stats.orders || stats.total_orders || 0;
        } else if (/Saved Items/i.test(label)) {
            numEl.textContent = stats.saved || stats.saved_items || 0;
        } else if (/Favorites/i.test(label)) {
            numEl.textContent = stats.favorites || 0;
        } else if (/Reviews/i.test(label)) {
            numEl.textContent = stats.reviews || 0;
        }
    });

    // Update loyalty points
    const loyaltyPoints = document.querySelector('.loyalty-points h3');
    if (loyaltyPoints) {
        loyaltyPoints.textContent = user.points || 0;
    }

    // Update rewards section points
    const rewardsPoints = document.querySelector('.rewards-card-large h3');
    if (rewardsPoints) {
        rewardsPoints.textContent = `${user.points || 0} Points`;
    }

    // Populate saved items (wishlist)
    populateWishlist(savedItems);

    // Populate orders if available
    if (data.orders && data.orders.length > 0) {
        populateOrders(data.orders);
    }
}

// Populate guest profile (when not logged in)
function populateGuestProfile() {
    try {
        const nameEl = document.querySelector('.profile-name');
        const emailEl = document.querySelector('.profile-email');
        const sinceEl = document.querySelector('.profile-member-since');
        
        if (nameEl) nameEl.textContent = 'Guest';
        if (emailEl) emailEl.innerHTML = '<i class="fas fa-envelope"></i> Not signed in';
        if (sinceEl) sinceEl.innerHTML = '<i class="fas fa-calendar-alt"></i> -';

        // Set stats to zero
        const statCards = document.querySelectorAll('.profile-stats .stat-card');
        statCards.forEach(card => {
            const numEl = card.querySelector('.stat-number');
            if (numEl) numEl.textContent = '0';
        });

        // Clear wishlist grid
        const grid = document.querySelector('.wishlist-grid');
        if (grid) grid.innerHTML = '<div class="empty-wishlist"><p>Please log in to view saved items.</p></div>';
    } catch (e) {
        console.warn('populateGuestProfile failed', e);
    }
}

// Format member since date
function formatMemberSince(dateString) {
    if (!dateString) return 'Recently';
    
    try {
        const date = new Date(dateString);
        const options = { year: 'numeric', month: 'long' };
        return date.toLocaleDateString('en-US', options);
    } catch (e) {
        return 'Recently';
    }
}

// Populate wishlist section
function populateWishlist(items) {
    const wishlistGrid = document.querySelector('.wishlist-grid');
    if (!wishlistGrid) return;

    wishlistGrid.innerHTML = '';

    if (!Array.isArray(items) || items.length === 0) {
        wishlistGrid.innerHTML = '<div class="empty-wishlist"><p>Your wishlist is empty</p></div>';
        return;
    }

    items.forEach(item => {
        const metadata = item.metadata || {};
        const imageUrl = metadata.image || 'https://via.placeholder.com/300x300?text=No+Image';
        
        const itemCard = document.createElement('div');
        itemCard.className = 'wishlist-item';
        itemCard.innerHTML = `
            <div class="wishlist-item-image">
                <img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(item.title)}" onerror="this.src='https://via.placeholder.com/300x300?text=No+Image'">
                <button class="remove-wishlist-btn" onclick="removeSavedItem('${encodeURIComponent(item.title)}', this)" title="Remove from wishlist">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="wishlist-item-details">
                <h3>${escapeHtml(item.title)}</h3>
                <p class="wishlist-item-price">₱${escapeHtml(item.price)}</p>
                <div class="wishlist-item-actions">
                    <button class="btn-primary" onclick="addWishlistItemToCart('${escapeHtml(item.title)}', '${escapeHtml(item.price)}', '${escapeHtml(imageUrl)}')">
                        <i class="fas fa-shopping-cart"></i> Add to Cart
                    </button>
                </div>
            </div>
        `;
        wishlistGrid.appendChild(itemCard);
    });
}

// Populate orders section
function populateOrders(orders) {
    const ordersList = document.querySelector('#orders-section .orders-list');
    if (!ordersList) return;

    ordersList.innerHTML = '';

    if (orders.length === 0) {
        ordersList.innerHTML = '<div class="empty-orders"><p>You have no orders yet.</p></div>';
        return;
    }

    orders.forEach(order => {
        const orderCard = document.createElement('div');
        orderCard.className = 'order-card';
        orderCard.setAttribute('data-status', order.status);
        
        const statusClass = getStatusClass(order.status);
        const formattedDate = formatOrderDate(order.created_at);
        
        orderCard.innerHTML = `
            <div class="order-header">
                <div class="order-info">
                    <h3>Order #${escapeHtml(order.order_number)}</h3>
                    <p class="order-date">${formattedDate}</p>
                </div>
                <span class="order-status ${statusClass}">${escapeHtml(order.status)}</span>
            </div>
            <div class="order-details">
                <p class="order-total">Total: ₱${escapeHtml(order.total)}</p>
                <button class="btn-secondary" onclick="viewOrderDetails('${escapeHtml(order.order_number)}')">
                    View Details
                </button>
            </div>
        `;
        ordersList.appendChild(orderCard);
    });
}

// Remove saved item
async function removeSavedItem(encodedTitle, buttonEl) {
    const title = decodeURIComponent(encodedTitle);
    
    if (!confirm(`Remove "${title}" from saved items?`)) return;
    
    try {
        const response = await fetch('/jbr7php/delete_saved_item.php', {
            method: 'POST',
            credentials: 'same-origin',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title })
        });

        if (response.ok) {
            const row = buttonEl && buttonEl.closest ? buttonEl.closest('.wishlist-item') : null;
            if (row) {
                row.style.opacity = '0';
                row.style.transform = 'scale(0.9)';
                setTimeout(() => {
                    row.remove();
                    showNotification('Item removed from wishlist', 'success');
                }, 300);
            }
        } else {
            showNotification('Failed to remove item', 'info');
        }
    } catch (e) {
        console.warn('removeSavedItem failed', e);
        showNotification('Failed to remove item', 'info');
    }
}

// Add wishlist item to cart
function addWishlistItemToCart(title, price, image) {
    try {
        const item = {
            name: title,
            price: price,
            image: image,
            quantity: 1
        };

        let cart = JSON.parse(localStorage.getItem('cart') || '[]');
        const existingIndex = cart.findIndex(c => c.name === item.name);
        
        if (existingIndex > -1) {
            cart[existingIndex].quantity = (cart[existingIndex].quantity || 0) + 1;
        } else {
            cart.push(item);
        }
        
        localStorage.setItem('cart', JSON.stringify(cart));
        
        // Update cart badge
        if (typeof updateCartCount === 'function') {
            updateCartCount();
        } else if (window.updateNavBadge) {
            window.updateNavBadge();
        }
        
        showNotification(`${title} added to cart`, 'success');
    } catch (error) {
        console.error('Error adding to cart:', error);
        showNotification('Failed to add item to cart', 'info');
    }
}

// Profile Header Functions
function editAvatar() {
    showNotification('Opening avatar editor...', 'info');
}

function shareProfile() {
    showNotification('Profile link copied to clipboard!', 'success');
}

// Logout Function
function handleLogout() {
    if (confirm('Are you sure you want to logout?')) {
        showNotification('Logging out...', 'info');
        
        localStorage.removeItem('userSession');
        sessionStorage.clear();

        fetch('/jbr7php/logout.php', { method: 'GET', credentials: 'same-origin' })
            .finally(() => setTimeout(() => { window.location.href = 'index.html'; }, 600));
    }
}

// Order Functions
function filterOrders(status) {
    const orders = document.querySelectorAll('.order-item, .order-card');
    const filterBtns = document.querySelectorAll('.filter-btn');
    
    filterBtns.forEach(btn => btn.classList.remove('active'));
    
    let clicked = (typeof event !== 'undefined' && event && event.target) ? event.target : null;
    if (!clicked) {
        clicked = Array.from(filterBtns).find(b => {
            try { return (b.getAttribute('onclick') || '').indexOf("'" + status + "'") !== -1; } 
            catch (e) { return false; }
        }) || filterBtns[0];
    }
    
    const btnEl = clicked && clicked.closest ? clicked.closest('.filter-btn') : clicked;
    if (btnEl) btnEl.classList.add('active');
    
    orders.forEach(order => {
        const orderStatus = order.getAttribute('data-status');
        if (status === 'all' || orderStatus === status) {
            order.style.display = 'block';
        } else {
            order.style.display = 'none';
        }
    });
}

function viewOrderDetails(orderNumber) {
    showNotification(`Opening order ${orderNumber}...`, 'info');
}

function trackOrder(orderId) {
    showNotification(`Tracking order #${orderId}...`, 'info');
}

function reorder(orderId) {
    showNotification('Adding items to cart...', 'success');
}

function cancelOrder(orderId) {
    if (confirm('Are you sure you want to cancel this order?')) {
        showNotification(`Order #${orderId} has been cancelled`, 'success');
    }
}

// Wishlist Functions
function removeFromWishlist(button) {
    const wishlistItem = button.closest('.wishlist-item');
    if (wishlistItem) {
        wishlistItem.style.opacity = '0';
        wishlistItem.style.transform = 'scale(0.8)';
        setTimeout(() => {
            wishlistItem.remove();
            showNotification('Item removed from wishlist', 'info');
        }, 300);
    }
}

function clearWishlist() {
    if (confirm('Are you sure you want to clear your entire wishlist?')) {
        const wishlistItems = document.querySelectorAll('.wishlist-item');
        wishlistItems.forEach((item, index) => {
            setTimeout(() => {
                item.style.opacity = '0';
                item.style.transform = 'scale(0.8)';
                setTimeout(() => item.remove(), 300);
            }, index * 100);
        });
        showNotification('Wishlist cleared', 'success');
    }
}

function moveToCart(button) {
    const wishlistItem = button.closest('.wishlist-item');
    const productName = wishlistItem.querySelector('h3').textContent;
    
    showNotification(`${productName} added to cart!`, 'success');
    
    wishlistItem.style.opacity = '0';
    wishlistItem.style.transform = 'translateX(100px)';
    setTimeout(() => wishlistItem.remove(), 300);
}

// Review Functions
function editReview(button) {
    showNotification('Opening review editor...', 'info');
}

function deleteReview(button) {
    if (confirm('Are you sure you want to delete this review?')) {
        const reviewItem = button.closest('.review-item');
        reviewItem.style.opacity = '0';
        reviewItem.style.transform = 'translateX(-100px)';
        setTimeout(() => {
            reviewItem.remove();
            showNotification('Review deleted', 'success');
        }, 300);
    }
}

// Rewards Functions
function viewRewards() {
    showProfileSection('rewards');
}

function redeemPoints() {
    showNotification('Opening rewards redemption...', 'info');
}

function claimReward(pointsCost) {
    const currentPoints = 2450;
    
    if (currentPoints >= pointsCost) {
        if (confirm(`Redeem ${pointsCost} points for this reward?`)) {
            showNotification(`Reward claimed! ${pointsCost} points deducted.`, 'success');
        }
    } else {
        showNotification(`You need ${pointsCost - currentPoints} more points for this reward`, 'info');
    }
}

// Helper functions
function escapeHtml(text) {
    if (text === null || text === undefined) return '';
    return String(text).replace(/[&<>"']/g, function(c) {
        return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'": '&#39;' }[c];
    });
}

function getStatusClass(status) {
    const statusMap = {
        'processing': 'status-processing',
        'shipped': 'status-shipped',
        'delivered': 'status-delivered',
        'cancelled': 'status-cancelled'
    };
    return statusMap[status.toLowerCase()] || 'status-processing';
}

function formatOrderDate(dateString) {
    if (!dateString) return '';
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
    } catch (e) {
        return dateString;
    }
}

// Notification system
function showNotification(message, type = 'info') {
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-info-circle'}"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => notification.classList.add('show'), 10);
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Add notification styles
if (!document.querySelector('#notification-styles')) {
    const notificationStyles = document.createElement('style');
    notificationStyles.id = 'notification-styles';
    notificationStyles.textContent = `
        .notification {
            position: fixed;
            top: 100px;
            right: -400px;
            background-color: #fff;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.15);
            display: flex;
            align-items: center;
            gap: 0.8rem;
            z-index: 10000;
            transition: right 0.3s ease;
            max-width: 350px;
        }
        .notification.show { right: 20px; }
        .notification i { font-size: 1.5rem; }
        .notification-success { border-left: 4px solid #006923; }
        .notification-success i { color: #006923; }
        .notification-info { border-left: 4px solid #3b5d72; }
        .notification-info i { color: #3b5d72; }
        .notification span { font-size: 0.95rem; color: #333; font-weight: 500; }
    `;
    document.head.appendChild(notificationStyles);
}

// Initialize on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        showProfileSection('orders');
        fetchSessionAndPopulateProfile();
    });
} else {
    showProfileSection('orders');
    fetchSessionAndPopulateProfile();
}
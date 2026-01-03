// receipt.js - read pendingCheckout from localStorage and render professional receipt
(function(){
  function fmt(n){ return '₱' + Number(n).toFixed(2); }

  // Check if pendingCheckout exists
  const raw = localStorage.getItem('pendingCheckout');
  
  if (!raw) {
    console.error('No pendingCheckout data found in localStorage');
    alert('No receipt data found. Redirecting to cart...');
    window.location.href = 'cart.html';
    return;
  }

  let data;
  try {
    data = JSON.parse(raw);
    console.log('Receipt data loaded:', data);
  } catch(e) {
    console.error('Failed to parse pendingCheckout:', e);
    alert('Error loading receipt data. Redirecting to cart...');
    window.location.href = 'cart.html';
    return;
  }

  // Populate order info
  document.getElementById('orderId').textContent = data.orderId || 'N/A';
  document.getElementById('orderDate').textContent = data.timestamp ? new Date(data.timestamp).toLocaleString() : new Date().toLocaleString();
  document.getElementById('payment').textContent = 'Payment: ' + (data.payment || 'Not specified');
  document.getElementById('courier').textContent = 'Courier: ' + (data.courier || 'Not specified');

  // Populate items table
  const tbody = document.querySelector('#itemsTable tbody');
  tbody.innerHTML = '';
  
  const items = data.items || [];
  console.log('Rendering items:', items);
  
  if (items.length === 0) {
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.colSpan = 4;
    td.textContent = 'No items in this order';
    td.style.textAlign = 'center';
    td.style.color = '#999';
    tr.appendChild(td);
    tbody.appendChild(tr);
  } else {
    items.forEach(it => {
      const tr = document.createElement('tr');
      
      // Item name column with optional size/color
      const tdName = document.createElement('td');
      let itemDetails = `<div style="font-weight:700">${escapeHtml(it.name || 'Unknown Item')}</div>`;
      if (it.size || it.color) {
        let subtext = [];
        if (it.size) subtext.push('Size: ' + escapeHtml(it.size));
        if (it.color) subtext.push('Color: ' + escapeHtml(it.color));
        itemDetails += `<div style="font-size:0.9rem;color:#666">${subtext.join(' • ')}</div>`;
      }
      tdName.innerHTML = itemDetails;
      
      // Unit price
      const tdUnit = document.createElement('td');
      tdUnit.className = 'right';
      tdUnit.textContent = fmt(it.unitPrice || it.price || 0);
      
      // Quantity
      const tdQty = document.createElement('td');
      tdQty.className = 'right';
      tdQty.textContent = it.quantity || 1;
      
      // Line total
      const tdLine = document.createElement('td');
      tdLine.className = 'right';
      tdLine.textContent = fmt(it.lineTotal || ((it.unitPrice || it.price || 0) * (it.quantity || 1)));
      
      tr.appendChild(tdName);
      tr.appendChild(tdUnit);
      tr.appendChild(tdQty);
      tr.appendChild(tdLine);
      tbody.appendChild(tr);
    });
  }

  // Populate totals
  document.getElementById('subtotal').textContent = fmt(data.subtotal || 0);
  document.getElementById('shipping').textContent = (data.shipping === 0) ? 'FREE' : fmt(data.shipping || 0);
  document.getElementById('tax').textContent = fmt(data.tax || 0);
  document.getElementById('total').textContent = fmt(data.total || 0);

  // Customer info
  const cust = [];
  if (data.customerEmail) cust.push(data.customerEmail);
  if (data.customerPhone) cust.push(data.customerPhone);
  document.getElementById('custContact').textContent = cust.join(' • ') || '—';

  // Back button
  document.getElementById('backBtn').addEventListener('click', ()=>{ 
    window.location.href = 'explore.html'; 
  });

  function escapeHtml(s){ 
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); 
  }
})();
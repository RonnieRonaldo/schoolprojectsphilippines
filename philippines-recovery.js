/* Philippines recovery bridge. Keeps original Paddle eventCallback and PDF claim logic. */
(() => {
  'use strict';
  const current=document.currentScript;
  const slug=current?.dataset.product;
  const originalBuyId=current?.dataset.originalButton;
  const worker='https://school-projects-india-downloads.gedeeldemailbox.workers.dev';
  if(!slug||!window.Paddle?.Checkout?.open)return;
  const original=window.Paddle.Checkout.open.bind(window.Paddle.Checkout);
  let busy=false;
  const valid=id=>/^txn_[a-z0-9]{10,80}$/.test(id||'');
  const showError=()=>{
    const target=document.getElementById('checkoutStatus')||document.getElementById('payment-status');
    const msg='Checkout could not open. Please try again later.';
    if(target)target.textContent=msg;else alert(msg);
  };
  window.Paddle.Checkout.open=async options=>{
    if(options?.transactionId)return original(options);
    if(busy)return;
    busy=true;
    try{
      const response=await fetch(worker+'/create-philippines-recovery',{
        method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({product:slug})
      });
      if(!response.ok)throw Error('Recovery transaction creation failed');
      const data=await response.json();
      if(!valid(data.transactionId))throw Error('Invalid transaction ID');
      const key=current?.dataset.storageKey;
      if(key)sessionStorage.setItem('ph_checkout_pending_'+slug,data.transactionId);
      return original({transactionId:data.transactionId});
    }catch(e){console.error('Checkout unavailable',e);showError();}
    finally{busy=false;}
  };
  // Existing buy buttons with unique IDs may have only one event listener.
  document.querySelectorAll('[data-ph-buy-proxy]').forEach(button=>{
    button.addEventListener('click',()=>document.getElementById(originalBuyId)?.click());
  });
  const resumed=sessionStorage.getItem('ph_recovery_resume');
  if(valid(resumed)){
    sessionStorage.removeItem('ph_recovery_resume');
    try{original({transactionId:resumed});}catch(e){console.error('Unable to resume checkout',e);showError();}
  }
})();

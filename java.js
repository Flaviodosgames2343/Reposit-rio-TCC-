/* Villa D’Italia — JavaScript puro (interações) */

(function(){
  const $ = (sel, root=document) => root.querySelector(sel);
  const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));

  const toast = $('#toast');
  function showToast(msg){
    if(!toast) return;
    toast.textContent = msg;
    toast.classList.add('is-visible');
    clearTimeout(showToast._t);
    showToast._t = setTimeout(()=>toast.classList.remove('is-visible'), 2600);
  }

  // Loading screen
  const loading = $('#loading');
  const bar = $('#loadingBar');
  const percent = $('#loadingPercent');
  (function loadingRun(){
    if(!loading || !bar || !percent) return;
    let p = 0;
    const start = performance.now();
    const duration = 1700;
    function tick(now){
      const t = Math.min(1, (now - start)/duration);
      p = Math.floor(t*100);
      bar.style.width = p + '%';
      percent.textContent = p + '%';
      if(t < 1){
        requestAnimationFrame(tick);
      } else {
        setTimeout(()=>{
          loading.classList.add('is-hidden');
          setTimeout(()=>loading.remove(), 650);
        }, 220);
      }
    }
    requestAnimationFrame(tick);
  })();

  // Sticky navbar color + blur
  const header = document.querySelector('.header');
  const onScroll = () => {
    if(!header) return;
    header.classList.toggle('scrolled', window.scrollY > 12);
  };
  window.addEventListener('scroll', onScroll, {passive:true});
  onScroll();

  // Smooth scroll for anchors (account for sticky header)
  $$('a[href^="#"]').forEach(a=>{
    a.addEventListener('click', (e)=>{
      const href = a.getAttribute('href');
      if(!href || href === '#') return;
      const id = href.slice(1);
      const target = document.getElementById(id);
      if(!target) return;
      e.preventDefault();
      const y = target.getBoundingClientRect().top + window.scrollY - 88;
      window.scrollTo({top:y, behavior:'smooth'});
    });
  });

  // Ripple effect
  $$('[data-ripple]').forEach(el=>{
    el.addEventListener('mousemove', (e)=>{
      const r = el.getBoundingClientRect();
      const x = ((e.clientX - r.left) / r.width) * 100;
      const y = ((e.clientY - r.top) / r.height) * 100;
      el.style.setProperty('--rx', x + '%');
      el.style.setProperty('--ry', y + '%');
    });
  });

  // Mobile menu
  const burger = $('#burger');
  const mobile = $('#mobileMenu');
  function setMobile(open){
    if(!burger || !mobile) return;
    burger.classList.toggle('is-open', open);
    mobile.classList.toggle('is-open', open);
    burger.setAttribute('aria-expanded', String(open));
    mobile.setAttribute('aria-hidden', String(!open));
    document.body.style.overflow = open ? 'hidden' : '';
  }
  burger?.addEventListener('click', ()=>{
    const open = !burger.classList.contains('is-open');
    setMobile(open);
  });
  $$('#mobileMenu .nav-link').forEach(l=>l.addEventListener('click', ()=>setMobile(false)));

  // Reveal on scroll
  const io = new IntersectionObserver((entries)=>{
    for(const e of entries){
      if(e.isIntersecting) e.target.classList.add('is-visible');
    }
  }, {threshold: .14});
  $$('.reveal').forEach(el=>io.observe(el));

  // Lazy loading backgrounds for elements with data-bg
  const lazyImgs = $$('.lazy[data-bg]');
  lazyImgs.forEach(el=>{
    const bg = el.getAttribute('data-bg');
    if(!bg) return;
    el.style.backgroundImage = `url('${bg}')`;
  });

  // Parallax
  const heroMedia = $('[data-parallax]');
  if(heroMedia){
    const img = heroMedia.querySelector('img');
    window.addEventListener('scroll', ()=>{
      const sc = window.scrollY;
      const speed = 0.22;
      if(img) img.style.transform = `translateY(${sc*speed*-0.01}px) scale(1.04)`;
    }, {passive:true});
  }

  // Typing effect
  const typing = $('[data-typing]');
  if(typing){
    const original = typing.textContent.trim();
    typing.textContent = '';
    let i = 0;
    const text = original;
    const interval = setInterval(()=>{
      i++;
      typing.textContent = text.slice(0,i);
      if(i >= text.length) clearInterval(interval);
    }, 26);
  }

  // Counter animated
  function animateCounter(el, value){
    const start = 0;
    const duration = 900;
    const t0 = performance.now();
    function step(t){
      const k = Math.min(1, (t - t0)/duration);
      const v = start + (value-start)* (1 - Math.pow(1-k, 3));
      el.textContent = v.toFixed(value % 1 === 0 ? 0 : 1);
      if(k < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  const counters = $$('[data-counter][data-value]');
  const ioCount = new IntersectionObserver((entries)=>{
    for(const e of entries){
      if(e.isIntersecting){
        const el = e.target;
        const value = parseFloat(el.getAttribute('data-value') || '0');
        animateCounter(el, value);
        ioCount.unobserve(el);
      }
    }
  }, {threshold: .3});
  counters.forEach(el=>ioCount.observe(el));

  // Carousels
  function initCarousel({track, prev, next, dots, slidesCount, autoplayMs=4200}){
    const t = $(track);
    const bPrev = $(prev);
    const bNext = $(next);
    const dotsEl = $(dots);
    if(!t || !bPrev || !bNext || !dotsEl) return;

    let index = 0;
    let timer = null;

    const buildDots = () =>{
      dotsEl.innerHTML = '';
      for(let i=0;i<slidesCount;i++){
        const d = document.createElement('button');
        d.className = 'dot' + (i===0?' is-active':'');
        d.addEventListener('click', ()=> go(i, true));
        dotsEl.appendChild(d);
      }
    };

    const go = (i, user=false) =>{
      index = (i + slidesCount) % slidesCount;
      t.style.transform = `translateX(${-index*100}%)`;
      $$('.dot', dotsEl).forEach((d, di)=>d.classList.toggle('is-active', di===index));
      if(user) reset();
    };

    const reset = ()=>{
      if(timer) clearInterval(timer);
      timer = setInterval(()=> go(index+1), autoplayMs);
    };

    bPrev.addEventListener('click', ()=> go(index-1, true));
    bNext.addEventListener('click', ()=> go(index+1, true));

    // touch
    const viewport = t.parentElement;
    let startX = 0, deltaX = 0;
    viewport.addEventListener('touchstart', (e)=>{ startX = e.touches[0].clientX; }, {passive:true});
    viewport.addEventListener('touchmove', (e)=>{ deltaX = e.touches[0].clientX - startX; }, {passive:true});
    viewport.addEventListener('touchend', ()=>{
      if(Math.abs(deltaX) > 40){
        go(index + (deltaX>0?-1:1), true);
      }
      deltaX = 0;
    });

    buildDots();
    reset();
  }

  // Hero carousel
  initCarousel({
    track: '#heroTrack',
    prev: '#heroPrev',
    next: '#heroNext',
    dots: '#heroDots',
    slidesCount: 4,
    autoplayMs: 3800
  });

  // Reviews carousel injected later
  function initReviewCarousel(){
    const track = $('#reviewTrack');
    if(!track) return;

    const reviews = [
      {name:'Mariana S.', city:'São Paulo', rating:5, quote:'Uma experiência que parece filme. Carbonara perfeita e atendimento impecável.'},
      {name:'Rafael G.', city:'Campinas', rating:5, quote:'Luxo sem exagero. O vinho harmoniza de forma magistral — voltarei com certeza.'},
      {name:'Carla M.', city:'Santos', rating:4, quote:'Ambiente elegante e pratos autorais. Sobremesas inesquecíveis.'},
      {name:'Eduardo P.', city:'Guarulhos', rating:5, quote:'Quatro Queijos de outro mundo. Recomendo demais a degustação.'}
    ];

    track.innerHTML = reviews.map(r=>{
      const stars = '★★★★★☆☆☆☆☆'.slice(0, r.rating) + '★★★★★☆☆☆☆☆'.slice(r.rating).replace(/★/g,'');
      return `
        <div class="review-slide">
          <p class="review-quote">“${r.quote}”</p>
          <div>
            <div class="review-person">
              <div class="review-avatar" aria-hidden="true">${r.name.split(' ')[0].slice(0,1)}${r.name.split(' ')[1].slice(0,1)}</div>
              <div class="review-meta">
                <b>${r.name}</b>
                <span>${r.city}</span>
              </div>
            </div>
            <div class="rating" style="margin-top:12px">
              <div class="stars" aria-label="Nota ${r.rating} de 5">${'★'.repeat(r.rating)}${'☆'.repeat(5-r.rating)}</div>
            </div>
          </div>
        </div>
      `;
    }).join('');

    const dotsEl = $('#reviewDots');
    const slidesCount = reviews.length;
    let index = 0;
    let timer = null;

    dotsEl.innerHTML = '';
    for(let i=0;i<slidesCount;i++){
      const d = document.createElement('button');
      d.className = 'dot' + (i===0?' is-active':'');
      d.addEventListener('click', ()=> go(i, true));
      dotsEl.appendChild(d);
    }

    const go = (i, user=false)=>{
      index = (i + slidesCount) % slidesCount;
      track.style.transform = `translateX(${-index*100}%)`;
      $$('.dot', dotsEl).forEach((d, di)=>d.classList.toggle('is-active', di===index));
      if(user) reset();
    };

    const reset = ()=>{
      if(timer) clearInterval(timer);
      timer = setInterval(()=> go(index+1), 4200);
    };

    reset();
  }

  initReviewCarousel();

  // Data for menu / chefs / gallery / cart
  const menuData = {
    massas: [
      {id:'carbonara', category:'massas', name:'Spaghetti Carbonara', desc:'Creme de parmesão, bacon crocante e toque de pimenta.', ingredientes:['Spaghetti','Bacon','Parmesão','Gema de ovo','Pimenta preta'], price:64.9, rating:4.9, img: genImg('carbonara')},
      {id:'alfredo', category:'massas', name:'Fettuccine Alfredo', desc:'Molho alfredo aveludado com manteiga e parmesão curado.', ingredientes:['Fettuccine','Manteiga','Parmesão','Creme de leite','Noz-moscada'], price:58.9, rating:4.8, img: genImg('alfredo')},
      {id:'penne', category:'massas', name:'Penne ao Molho', desc:'Molho caseiro reduzido lentamente — tradição em cada colherada.', ingredientes:['Penne','Tomates','Azeite','Alho','Manjericão'], price:52.9, rating:4.7, img: genImg('penne')},
      {id:'ravioli', category:'massas', name:'Ravioli', desc:'Recheio selecionado com manteiga dourada e ervas finas.', ingredientes:['Massa fresca','Recheio da casa','Manteiga','Ervas','Queijo'], price:69.9, rating:4.9, img: genImg('ravioli')},
      {id:'nhoque', category:'massas', name:'Nhoque', desc:'Leve e macio, com molho aromático e finalização premium.', ingredientes:['Batata','Molho','Ervas','Queijo','Pimenta'], price:54.9, rating:4.8, img: genImg('nhoque')},
      {id:'lasanha', category:'massas', name:'Lasanha', desc:'Camadas generosas com molho lento e queijo derretendo.', ingredientes:['Lasanha','Molho lento','Queijos','Molho bechamel','Manjericão'], price:73.9, rating:4.8, img: genImg('lasanha')}
    ],
    pizzas: [
      {id:'margherita', category:'pizzas', name:'Margherita', desc:'Tomate, manjericão fresco e mozzarella de sabor intenso.', ingredientes:['Massa','Mozzarella','Tomate','Manjericão','Azeite'], price:49.9, rating:4.7, img: genImg('margherita')},
      {id:'4queijos', category:'pizzas', name:'Quatro Queijos', desc:'Blend especial com textura cremosa e borda dourada.', ingredientes:['Mozzarella','Provolone','Gorgonzola','Parmesão'], price:58.9, rating:4.8, img: genImg('4queijos')},
      {id:'calabresa', category:'pizzas', name:'Calabresa', desc:'Calabresa artesanal, cebola roxa e finalização de azeite.', ingredientes:['Calabresa','Cebola roxa','Mozzarella','Azeite','Orégano'], price:56.9, rating:4.7, img: genImg('calabresa')},
      {id:'portuguesa', category:'pizzas', name:'Portuguesa', desc:'Clássica e robusta, com ovo, presunto e toque aromático.', ingredientes:['Presunto','Ovo','Batata','Ervilha','Mozzarella'], price:60.9, rating:4.6, img: genImg('portuguesa')},
      {id:'especialcasa', category:'pizzas', name:'Especial da Casa', desc:'Receita autoral com ingredientes selecionados e harmonização.', ingredientes:['Especial da casa','Ervas','Queijos','Molho','Toque do chef'], price:72.9, rating:4.9, img: genImg('especial')}
    ],
    risotos: [
      {id:'funghi', category:'risotos', name:'Risoto Funghi', desc:'Cogumelos salteados e cremosidade na medida certa.', ingredientes:['Arroz arbóreo','Cogumelos','Caldo','Parmesão','Vinho branco'], price:66.9, rating:4.9, img: genImg('funghi')},
      {id:'camarao', category:'risotos', name:'Risoto de Camarão', desc:'Camarões suculentos e redução de aromas italianos.', ingredientes:['Arroz arbóreo','Camarão','Caldo','Alho','Ervas'], price:78.9, rating:4.8, img: genImg('camarao')},
      {id:'parmesao', category:'risotos', name:'Risoto Parmesão', desc:'Creme dourado, parmesão curado e finalização refinada.', ingredientes:['Arroz arbóreo','Parmesão curado','Manteiga','Caldo','Limão'], price:64.9, rating:4.8, img: genImg('parmesao')},
      {id:'limão', category:'risotos', name:'Risoto Limão Siciliano', desc:'Brilho cítrico e cremosidade sofisticada.', ingredientes:['Arroz','Limão siciliano','Parmesão','Azeite','Caldo'], price:62.9, rating:4.7, img: genImg('limao')}
    ],
    entradas: [
      {id:'bruschetta', category:'entradas', name:'Bruschetta', desc:'Pão artesanal com tomate temperado e azeite premium.', ingredientes:['Pão','Tomate','Azeite','Manjericão','Alho'], price:36.9, rating:4.6, img: genImg('bruschetta')},
      {id:'carpaccio', category:'entradas', name:'Carpaccio', desc:'Fatias finas, toque cítrico e finalização de ervas.', ingredientes:['Carne','Limão','Ervas','Azeite','Parmesão'], price:64.9, rating:4.8, img: genImg('carpaccio')},
      {id:'focaccia', category:'entradas', name:'Focaccia', desc:'Assada no ponto, com azeite aromático e sal marinho.', ingredientes:['Focaccia','Azeite','Ervas','Sal marinho'], price:34.9, rating:4.7, img: genImg('focaccia')}
    ],
    sobremesas: [
      {id:'tiramisu', category:'sobremesas', name:'Tiramisù', desc:'Camadas cremosas com café e cacau intenso.', ingredientes:['Café','Mascarpone','Cacau','Biscoito','Açúcar'], price:44.9, rating:4.9, img: genImg('tiramisu')},
      {id:'cannoli', category:'sobremesas', name:'Cannoli', desc:'Recheio artesanal, casca crocante e doçura equilibrada.', ingredientes:['Ricota','Casca crocante','Canela','Açúcar','Chocolate'], price:42.9, rating:4.8, img: genImg('cannoli')},
      {id:'panna', category:'sobremesas', name:'Panna Cotta', desc:'Textura sedosa, calda aromática e final premium.', ingredientes:['Creme','Gelatina','Baunilha','Calda da casa'], price:39.9, rating:4.7, img: genImg('panna')},
      {id:'gelato', category:'sobremesas', name:'Gelato', desc:'Sorvete italiano com sabores clássicos e leveza incrível.', ingredientes:['Leite','Creme','Sabores','Ingredientes da estação'], price:36.9, rating:4.6, img: genImg('gelato')}
    ],
    vinhos: [
      {id:'tintos', category:'vinhos', name:'Tintos', desc:'Seleção encorpada com taninos elegantes.', ingredientes:['Uvas tintas','Tradição da casa'], price:89.9, rating:4.8, img: genImg('tintos')},
      {id:'brancos', category:'vinhos', name:'Brancos', desc:'Aromáticos, frescos e com final refinado.', ingredientes:['Uvas brancas','Aromas','Harmonização'], price:79.9, rating:4.7, img: genImg('brancos')},
      {id:'roses', category:'vinhos', name:'Rosés', desc:'Equilíbrio perfeito entre frescor e elegância.', ingredientes:['Rosé','Frutas','Harmonização'], price:74.9, rating:4.6, img: genImg('roses')},
      {id:'espumantes', category:'vinhos', name:'Espumantes', desc:'Burburinhos finos para brindar o momento.', ingredientes:['Espumante','Bolhas finas'], price:99.9, rating:4.9, img: genImg('espumantes')}
    ],
    bebidas: [
      {id:'sucos', category:'bebidas', name:'Sucos', desc:'Opções naturais e refrescantes.', ingredientes:['Frutas','Natural','Gelado'], price:22.9, rating:4.6, img: genImg('sucos')},
      {id:'refri', category:'bebidas', name:'Refrigerantes', desc:'Clássicos italianos em versão premium.', ingredientes:['Gás','Clássicos'], price:14.9, rating:4.5, img: genImg('refri')},
      {id:'drinks', category:'bebidas', name:'Drinks', desc:'Autorais com toque italiano e final suave.', ingredientes:['Bebida base','Ervas','Cítricos'], price:34.9, rating:4.7, img: genImg('drinks')},
      {id:'agua', category:'bebidas', name:'Água', desc:'Mineral com equilíbrio para acompanhar.', ingredientes:['Água mineral'], price:9.9, rating:4.5, img: genImg('agua')}
    ]
  };

  // Flatten
  const allMenu = [];
  Object.values(menuData).forEach(arr=>arr.forEach(x=>allMenu.push(x)));

  // Menu rendering
  const menuGrid = $('#menuGrid');
  const filtersWrap = $('.filters');
  let activeFilter = 'all';

  function starsText(r){
    const full = Math.round(r);
    return '★★★★★☆☆☆☆☆'.slice(0, full) + '★★★★★☆☆☆☆☆'.slice(full).replace(/★/g,'');
  }

  function cardTemplate(item){
    const imgStyle = `background-image: url('${item.img}')`;
    const stars = '★'.repeat(Math.round(item.rating)) + '☆'.repeat(5-Math.round(item.rating));
    return `
      <article class="card" data-cat="${item.category}" data-id="${item.id}">
        <div class="card__img lazy" style="${imgStyle}" role="img" aria-label="${item.name}"></div>
        <div class="card__body">
          <div class="card__top">
            <h4 class="card__name">${item.name}</h4>
            <div class="card__price">R$ ${item.price.toFixed(2).replace('.',',')}</div>
          </div>
          <p class="card__desc">${item.desc}</p>
          <div class="rating">
            <div class="stars" aria-label="Avaliação ${item.rating}">${stars}</div>
            <div class="rating__txt">${item.rating.toFixed(1)}</div>
          </div>
          <div class="card__actions">
            <button class="btn btn--gold btn--tiny btn--buy" data-buy data-qty="1" data-id="${item.id}" data-ripple>Comprar</button>
            <button class="btn btn--ghost btn--tiny" data-details data-id="${item.id}" data-ripple>Detalhes</button>
          </div>
        </div>
      </article>
    `;
  }

  function renderMenu(){
    if(!menuGrid) return;
    const items = activeFilter === 'all' ? allMenu : allMenu.filter(i=>i.category===activeFilter);
    menuGrid.innerHTML = items.map(cardTemplate).join('');
  }

  filtersWrap?.addEventListener('click', (e)=>{
    const btn = e.target.closest('.filter');
    if(!btn) return;
    activeFilter = btn.getAttribute('data-filter');
    $$('.filter', filtersWrap).forEach(b=>b.classList.toggle('is-active', b===btn));
    renderMenu();
    // micro feedback
    showToast('Filtro aplicado: ' + (btn.textContent||'').trim());
  });

  renderMenu();

  // Details modal
  const detailsModal = $('#detailsModal');
  const detailsOverlay = $('#detailsOverlay');
  const detailsClose = $('#detailsClose');
  const detailsImg = $('#detailsImg');
  const detailsCategory = $('#detailsCategory');
  const detailsName = $('#detailsName');
  const detailsDesc = $('#detailsDesc');
  const detailsIngredients = $('#detailsIngredients');
  const detailsRating = $('#detailsRating');
  const detailsPrice = $('#detailsPrice');
  const detailsQty = $('#detailsQty');
  const detailsAdd = $('#detailsAdd');
  const detailsAddDirect = $('#detailsAddDirect');

  let currentDetails = null;

  function openDetails(item){
    currentDetails = item;
    detailsModal.classList.add('is-open');
    detailsModal.setAttribute('aria-hidden','false');
    detailsImg.style.backgroundImage = `url('${item.img}')`;
    detailsCategory.textContent = item.category.toUpperCase();
    detailsName.textContent = item.name;
    detailsDesc.textContent = item.desc;
    detailsIngredients.innerHTML = item.ingredientes.map(x=>`<li>${x}</li>`).join('');
    detailsRating.innerHTML = '★'.repeat(Math.round(item.rating)) + '☆'.repeat(5-Math.round(item.rating));
    detailsPrice.textContent = `R$ ${item.price.toFixed(2).replace('.',',')}`;
    if(detailsQty) detailsQty.value = '1';
  }

  function closeDetails(){
    detailsModal?.classList.remove('is-open');
  }

  menuGrid?.addEventListener('click', (e)=>{
    const buy = e.target.closest('[data-buy]');
    const details = e.target.closest('[data-details]');
    if(details){
      const id = details.getAttribute('data-id');
      const item = allMenu.find(x=>x.id===id);
      if(item) openDetails(item);
      return;
    }
    if(buy){
      const id = buy.getAttribute('data-id');
      const item = allMenu.find(x=>x.id===id);
      if(item) addToCart(item, 1);
      return;
    }
  });

  detailsClose?.addEventListener('click', closeDetails);
  detailsOverlay?.addEventListener('click', closeDetails);
  document.addEventListener('keydown', (e)=>{
    if(e.key==='Escape'){
      closeDetails();
      closeCart();
      closeLightbox();
      closePedido();
    }
  });

  // qty buttons in modal
  $('#detailsModal')?.addEventListener('click', (e)=>{
    const btn = e.target.closest('[data-qty]');
    if(!btn || !detailsQty) return;
    const delta = btn.getAttribute('data-qty')==='inc' ? 1 : -1;
    const v = Math.max(1, parseInt(detailsQty.value||'1', 10) + delta);
    detailsQty.value = String(v);
  });

  detailsAdd?.addEventListener('click', ()=>{
    if(!currentDetails) return;
    const q = parseInt(detailsQty?.value||'1', 10);
    addToCart(currentDetails, q);
    closeDetails();
    openCart();
  });
  detailsAddDirect?.addEventListener('click', ()=>{
    if(!currentDetails) return;
    const q = parseInt(detailsQty?.value||'1', 10);
    addToCart(currentDetails, q);
    closeDetails();
    showToast('Adicionado ao carrinho');
    openCart();
  });

  // Cart system
  const cartDrawer = $('#cartDrawer');
  const cartOverlay = $('#cartOverlay');
  const cartClose = $('#cartClose');
  const cartItems = $('#cartItems');
  const cartCount = $('#cartCount');
  const subtotalEl = $('#subtotal');
  const discountEl = $('#discount');
  const totalEl = $('#total');
  const couponInput = $('#coupon');
  const applyCouponBtn = $('#applyCoupon');
  const couponMsg = $('#couponMsg');
  const clearCartBtn = $('#clearCart');
  const checkoutBtn = $('#checkout');

  let cart = [];
  let appliedCoupon = null;

  function money(n){ return 'R$ ' + n.toFixed(2).replace('.',','); }

  function updateCartCount(){
    const c = cart.reduce((sum, it)=>sum + it.qty, 0);
    if(cartCount) cartCount.textContent = String(c);
  }

  function openCart(){
    cartDrawer?.classList.add('is-open');
    cartDrawer?.setAttribute('aria-hidden','false');
  }
  function closeCart(){
    cartDrawer?.classList.remove('is-open');
    cartDrawer?.setAttribute('aria-hidden','true');
  }
  cartOverlay?.addEventListener('click', closeCart);
  cartClose?.addEventListener('click', closeCart);

  $('#cartPill')?.addEventListener('click', ()=>{
    openCart();
  });

  const couponCodes = {
    'VILLA10': {type:'percent', value:10},
    'FRETEGRÁTIS': {type:'flat', value:15},
    'SOMMELIER15': {type:'percent', value:15},
  };

  function calcTotals(){
    const subtotal = cart.reduce((sum, it)=>sum + it.price*it.qty, 0);
    let discount = 0;
    if(appliedCoupon){
      const c = couponCodes[appliedCoupon];
      if(c){
        discount = c.type==='percent' ? subtotal * (c.value/100) : c.value;
        discount = Math.min(discount, subtotal);
      }
    }
    const total = Math.max(0, subtotal - discount);
    return {subtotal, discount, total};
  }

  function renderCart(){
    if(!cartItems) return;
    if(cart.length===0){
      cartItems.innerHTML = `
        <div class="cart-item" style="grid-template-columns: 1fr; text-align:center; padding:18px;">
          <div>Seu carrinho está vazio. Explore o cardápio e comece sua experiência.</div>
        </div>
      `;
    } else {
      cartItems.innerHTML = cart.map(it=>{
        const thumb = it.img;
        return `
          <div class="cart-item" data-cartid="${it.id}">
            <div class="cart-item__thumb" style="background-image:url('${thumb}')"></div>
            <div>
              <div class="cart-item__name">${it.name}</div>
              <div class="cart-item__meta">
                <span>R$ ${it.price.toFixed(2).replace('.',',')}</span>
              </div>
              <div class="cart-item__qty" style="margin-top:10px">
                <button data-qty="dec" aria-label="Diminuir">−</button>
                <input data-qtyinput type="number" min="1" value="${it.qty}" aria-label="Quantidade" />
                <button data-qty="inc" aria-label="Aumentar">+</button>
              </div>
            </div>
            <div style="display:flex; flex-direction:column; gap:10px; align-items:flex-end;">
              <div class="cart-item__price">${money(it.price*it.qty)}</div>
              <button class="cart-item__del" data-del aria-label="Remover">✕</button>
            </div>
          </div>
        `;
      }).join('');
    }

    const {subtotal, discount, total} = calcTotals();
    subtotalEl && (subtotalEl.textContent = money(subtotal));
    discountEl && (discountEl.textContent = money(discount));
    totalEl && (totalEl.textContent = money(total));
    updateCartCount();
  }

  function addToCart(item, qty){
    const found = cart.find(x=>x.id===item.id);
    const q = Math.max(1, qty|0);
    if(found) found.qty += q;
    else cart.push({id:item.id, name:item.name, price:item.price, qty:q, img:item.img});
    renderCart();
    appliedCoupon = appliedCoupon; // keep coupon
    showToast('Adicionado ao carrinho');
  }

  function removeFromCart(id){
    cart = cart.filter(x=>x.id!==id);
    renderCart();
    showToast('Item removido');
  }

  function setQty(id, qty){
    const q = Math.max(1, qty|0);
    const it = cart.find(x=>x.id===id);
    if(!it) return;
    it.qty = q;
    renderCart();
  }

  cartItems?.addEventListener('click', (e)=>{
    const del = e.target.closest('[data-del]');
    const btn = e.target.closest('[data-qty]');
    if(!cartItems) return;
    const card = e.target.closest('.cart-item');
    if(!card) return;
    const id = card.getAttribute('data-cartid');
    if(del){ removeFromCart(id); return; }
    if(btn){
      const input = card.querySelector('[data-qtyinput]');
      const current = parseInt(input?.value||'1', 10);
      const delta = btn.getAttribute('data-qty')==='inc' ? 1 : -1;
      setQty(id, current + delta);
    }
  });

  cartItems?.addEventListener('change', (e)=>{
    const input = e.target.closest('[data-qtyinput]');
    if(!input) return;
    const card = e.target.closest('.cart-item');
    const id = card.getAttribute('data-cartid');
    const qty = parseInt(input.value||'1',10);
    setQty(id, qty);
  });

  applyCouponBtn?.addEventListener('click', ()=>{
    const code = (couponInput?.value||'').trim().toUpperCase();
    if(!code){
      couponMsg.textContent = 'Digite um cupom.';
      appliedCoupon = null;
      renderCart();
      return;
    }
    if(couponCodes[code]){
      appliedCoupon = code;
      couponMsg.textContent = 'Cupom aplicado: ' + code;
      renderCart();
      showToast('Cupom aplicado com sucesso');
    } else {
      couponMsg.textContent = 'Cupom inválido.';
      appliedCoupon = null;
      renderCart();
    }
  });

  clearCartBtn?.addEventListener('click', ()=>{
    cart = [];
    appliedCoupon = null;
    if(couponInput) couponInput.value = '';
    if(couponMsg) couponMsg.textContent = '';
    renderCart();
    showToast('Carrinho limpo');
  });

  checkoutBtn?.addEventListener('click', ()=>{
    if(cart.length===0){ showToast('Seu carrinho está vazio'); return; }
    const {total} = calcTotals();
    showToast('Pedido finalizado! Total: ' + money(total));
    cart = [];
    appliedCoupon = null;
    if(couponInput) couponInput.value = '';
    if(couponMsg) couponMsg.textContent='';
    renderCart();
    closeCart();
  });

  // Pedido modal
  const pedidoModal = $('#pedidoModal');
  const pedidoOverlay = $('#pedidoOverlay');
  const pedidoClose = $('#pedidoClose');
  const pedidoOpenCart = $('#pedidoOpenCart');
  const btnPedido = $('#btnPedido');

  function openPedido(){
    pedidoModal?.classList.add('is-open');
    pedidoModal?.setAttribute('aria-hidden','false');
    document.body.style.overflow = 'hidden';
  }
  function closePedido(){
    pedidoModal?.classList.remove('is-open');
    pedidoModal?.setAttribute('aria-hidden','true');
    document.body.style.overflow = '';
  }

  btnPedido?.addEventListener('click', ()=>openPedido());
  pedidoClose?.addEventListener('click', closePedido);
  pedidoOverlay?.addEventListener('click', closePedido);
  pedidoOpenCart?.addEventListener('click', ()=>{ closePedido(); openCart(); });

  // Form validations
  function setFieldMsg(input, msg){
    const id = input.id;
    const el = $(`[data-for="${id}"]`);
    if(el) el.textContent = msg || '';
    if(msg){
      input.style.borderColor = 'rgba(212,175,55,.65)';
      input.style.boxShadow = '0 0 0 4px rgba(212,175,55,.12)';
    }
  }

  function clearFieldMsg(input){ setFieldMsg(input, ''); }

  function isEmail(v){ return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }
  function isPhone(v){ return v.replace(/\D/g,'').length >= 10; }

  const reservationForm = $('#reservationForm');
  const reservationStatus = $('#reservationStatus');

  reservationForm?.addEventListener('submit', (e)=>{
    e.preventDefault();
    const data = {
      nome: $('#rNome').value.trim(),
      email: $('#rEmail').value.trim(),
      telefone: $('#rTel').value.trim(),
      data: $('#rData').value,
      horario: $('#rHora').value,
      pessoas: parseInt($('#rPessoas').value||'1',10),
      obs: $('#rObs').value.trim()
    };

    let ok = true;
    const nome = $('#rNome');
    const email = $('#rEmail');
    const tel = $('#rTel');
    const dt = $('#rData');
    const hr = $('#rHora');
    const pes = $('#rPessoas');

    // reset
    [nome,email,tel,dt,hr,pes].forEach(inp=>clearFieldMsg(inp));

    if(data.nome.length < 2){ setFieldMsg(nome,'Informe seu nome.'); ok=false; }
    if(!isEmail(data.email)){ setFieldMsg(email,'E-mail inválido.'); ok=false; }
    if(!isPhone(data.telefone)){ setFieldMsg(tel,'Telefone inválido.'); ok=false; }
    if(!data.data){ setFieldMsg(dt,'Selecione a data.'); ok=false; }
    if(!data.horario){ setFieldMsg(hr,'Selecione o horário.'); ok=false; }
    if(!Number.isFinite(data.pessoas) || data.pessoas < 1){ setFieldMsg(pes,'Pessoas inválidas.'); ok=false; }

    if(!ok){
      showToast('Revise os campos do formulário');
      reservationStatus.textContent = '';
      return;
    }

    reservationStatus.textContent = 'Reserva confirmada! Em instantes você receberá uma mensagem de confirmação.';
    showToast('Reserva enviada com sucesso');
    reservationForm.reset();
  });

  // Contact / Newsletter validations
  const newsletterForm = $('#newsletterForm');
  const newsletterStatus = $('#newsletterStatus');

  newsletterForm?.addEventListener('submit', (e)=>{
    e.preventDefault();
    const nome = $('#nNome').value.trim();
    const email = $('#nEmail').value.trim();
    newsletterStatus.textContent = '';

    if(nome.length < 2){ showToast('Informe seu nome'); return; }
    if(!isEmail(email)){ showToast('E-mail inválido'); return; }

    newsletterStatus.textContent = 'Inscrição realizada! Fique atento às novidades da casa.';
    showToast('Newsletter assinada');
    newsletterForm.reset();
  });

  // Input masks (telefone simples)
  const tel = $('#rTel');
  if(tel){
    tel.addEventListener('input', ()=>{
      const d = tel.value.replace(/\D/g,'').slice(0,11);
      // (11) 99999-9999 / (11) 9999-9999
      const dd = d.slice(0,2);
      const p1 = d.length>10 ? d.slice(2,7) : d.slice(2,6);
      const p2 = d.slice(d.length>10 ? 7 : 6);
      let out = '';
      if(dd) out = '('+dd;
      if(out.length===3) out += ') ';
      if(p1) out += p1;
      if(p2) out += '-' + p2;
      tel.value = out;
    });
  }

  // Chef cards injection
  function genImg(seed){
    const s = encodeURIComponent(seed);
    return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='600'%3E%3Cdefs%3E%3ClinearGradient id='l' x1='0' y1='0' x2='1' y2='1'%3E%3Cstop offset='0' stop-color='%23121212'/%3E%3Cstop offset='1' stop-color='%234A0E1A'/%3E%3C/linearGradient%3E%3CradialGradient id='r' cx='35%25' cy='28%25'%3E%3Cstop offset='0' stop-color='%23D4AF37' stop-opacity='0.8'/%3E%3Cstop offset='1' stop-color='%23D4AF37' stop-opacity='0'/%3E%3C/radialGradient%3E%3C/defs%3E%3Crect width='100%25' height='100%25' fill='url(%23l)'/%3E%3Ccircle cx='340' cy='220' r='250' fill='url(%23r)'/%3E%3Cpath d='M0 520c140-130 310-90 450-10s260 180 350 30v160H0Z' fill='%23F5E6CC' opacity='0.16'/%3E%3Ctext x='40' y='560' fill='%23F5E6CC' font-size='26' font-family='Montserrat, Arial' opacity='0.55'%3E${s}%3C/text%3E%3C/svg%3E`;
  }

  const chefData = [
    {name:'Giulia Romano', spec:'Massa &amp; Molhos', bio:'Especialista em massas artesanais e reduções de sabor profundo.', exp:'12 anos • Itália + Brasil', img: genImg('Giulia')},
    {name:'Marco Conti', spec:'Forno &amp; Pizzas', bio:'Direto da tradição napolitana: massa leve, borda dourada e forno na medida.', exp:'15 anos • Estação + Autorais', img: genImg('Marco')},
    {name:'Sofia Bellini', spec:'Vinhos &amp; Risotos', bio:'Harmonização de vinhos com risotos cremosos e aromas refinados.', exp:'10 anos • Sommelier', img: genImg('Sofia')}
  ];

  const chefGrid = $('#chefGrid');
  if(chefGrid){
    chefGrid.innerHTML = chefData.map(c=>`
      <article class="chef-card reveal">
        <div class="chef-card__img" style="background-image:url('${c.img}')"></div>
        <div class="chef-card__body">
          <h4 class="chef-card__name">${c.name}</h4>
          <div class="chef-card__spec">${c.spec}</div>
          <p class="chef-card__bio">${c.bio}</p>
          <div class="chef-card__exp"><span class="gold">Experiência</span><span>${c.exp}</span></div>
          <div class="chef-card__social" aria-label="Redes sociais">
            <a class="social" href="#" aria-label="Instagram">IG</a>
            <a class="social" href="#" aria-label="Facebook">FB</a>
            <a class="social" href="#" aria-label="YouTube">YT</a>
          </div>
        </div>
      </article>
    `).join('');
    // Observe reveal for chefs
    $$('.chef-card').forEach(el=>io.observe(el));
  }

  // Gallery injection + filters + lightbox
  const gallery = $('#gallery');
  const galleryFilters = $$('.gfilter');

  const galleryData = [
    {id:'g1', cat:'comidas', cap:'Massas &amp; artesanais', img: genImg('comidas1')},
    {id:'g2', cat:'comidas', cap:'Pasta premium', img: genImg('comidas2')},
    {id:'g3', cat:'sobremesas', cap:'Tiramisù &amp; cacau', img: genImg('sob1')},
    {id:'g4', cat:'sobremesas', cap:'Cannoli crocante', img: genImg('sob2')},
    {id:'g5', cat:'vinhos', cap:'Vinhos selecionados', img: genImg('vinho1')},
    {id:'g6', cat:'vinhos', cap:'Harmonização', img: genImg('vinho2')},
    {id:'g7', cat:'ambiente', cap:'Luzes douradas', img: genImg('amb1')},
    {id:'g8', cat:'ambiente', cap:'Mesa &amp; atmosfera', img: genImg('amb2')},
    {id:'g9', cat:'eventos', cap:'Noite Italiana', img: genImg('evt1')},
    {id:'g10', cat:'eventos', cap:'Degustação', img: genImg('evt2')}
  ];

  let galleryActive = 'all';
  function renderGallery(){
    const items = galleryActive==='all' ? galleryData : galleryData.filter(x=>x.cat===galleryActive);
    if(!gallery) return;
    gallery.innerHTML = items.map(it=>`
      <div class="gitem reveal" data-gcat="${it.cat}" data-id="${it.id}" data-img="${it.img}" data-cap="${it.cap}">
        <div class="gitem__media" style="background-image:url('${it.img}')"></div>
        <div class="gcap"><span>${it.cap}</span><span style="color:rgba(212,175,55,.95);font-weight:900">+</span></div>
      </div>
    `).join('');
    $$('.gitem').forEach(el=>io.observe(el));
  }

  galleryFilters?.forEach(btn=>{
    btn.addEventListener('click', ()=>{
      galleryActive = btn.getAttribute('data-gfilter');
      galleryFilters.forEach(b=>b.classList.toggle('is-active', b===btn));
      renderGallery();
    });
  });

  renderGallery();

  // Lightbox
  const lightbox = $('#lightbox');
  const lightboxOverlay = $('#lightboxOverlay');
  const lightboxClose = $('#lightboxClose');
  const lightboxImg = $('#lightboxImg');
  const lightboxCap = $('#lightboxCap');
  const prevBtn = $('#lightboxPrev');
  const nextBtn = $('#lightboxNext');

  let lightboxIndex = 0;
  let lightboxItems = [];

  function openLightbox(img, cap){
    if(!lightbox) return;
    lightboxImg.src = img;
    lightboxCap.textContent = cap || '';
    lightbox.classList.add('is-open');
    lightbox.setAttribute('aria-hidden','false');
    document.body.style.overflow = 'hidden';
  }
  function closeLightbox(){
    lightbox?.classList.remove('is-open');
    lightbox?.setAttribute('aria-hidden','true');
    document.body.style.overflow = '';
  }

  gallery?.addEventListener('click', (e)=>{
    const item = e.target.closest('.gitem');
    if(!item) return;
    const imgs = $$('.gitem', gallery).map(x=>({img:x.getAttribute('data-img'), cap:x.getAttribute('data-cap')}));
    lightboxItems = imgs;
    lightboxIndex = imgs.findIndex(x=>x.img===item.getAttribute('data-img'));
    openLightbox(item.getAttribute('data-img'), item.getAttribute('data-cap'));
  });

  lightboxOverlay?.addEventListener('click', closeLightbox);
  lightboxClose?.addEventListener('click', closeLightbox);
  prevBtn?.addEventListener('click', ()=>{
    if(!lightboxItems.length) return;
    lightboxIndex = (lightboxIndex-1 + lightboxItems.length) % lightboxItems.length;
    openLightbox(lightboxItems[lightboxIndex].img, lightboxItems[lightboxIndex].cap);
  });
  nextBtn?.addEventListener('click', ()=>{
    if(!lightboxItems.length) return;
    lightboxIndex = (lightboxIndex+1) % lightboxItems.length;
    openLightbox(lightboxItems[lightboxIndex].img, lightboxItems[lightboxIndex].cap);
  });

  // Initial cart totals render
  renderCart();

  // Button that opens cart
  $('#pedidoOpenCart')?.addEventListener('click', ()=>openCart());

})();


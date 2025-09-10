/* ------------------- CONFIG & SETUP ------------------- */
let limit = 12;
let loading = false;

const productsContainer = document.getElementById("products");
const loadMoreBtn = document.getElementById("loadMore");
const loadingSpinner = document.getElementById("loadingSpinner");

// ✅ Read config from HTML
const CATEGORY = window.PAGE_CONFIG?.category || null;
const API_URLS = window.PAGE_CONFIG?.apis || [];

// ✅ Safety checks
if (!CATEGORY || API_URLS.length === 0) {
  console.error("⚠️ Missing PAGE_CONFIG. Please define window.PAGE_CONFIG before including products.js");
}

/* ------------------- HELPERS ------------------- */

async function fetchProductImages(url) {
  try {
    const html = await (await fetch(url)).text();
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = html;
    return [...tempDiv.querySelectorAll("#slider .main-image img")].map(img => img.src);
  } catch (error) {
    console.error("Error fetching product images:", error);
    return [];
  }
}

function parseProducts(html) {
  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = html;
  return tempDiv.querySelectorAll(".single-product");
}

// ✅ Extract shoe sizes
function extractSizes(product) {
  return [...product.querySelectorAll("label.badge-primary")]
    .map(label => label.innerText.trim())
    .filter(size => size !== "");
}

function renderProductCard({ id, img, name, link, price, sizes }) {
  const col = document.createElement("div");
  col.className = "col-lg-3 col-md-4 col-sm-6 col-12 d-flex";

  // ✅ render sizes as badges
  const sizesHTML = sizes.length
    ? `<div class="product-sizes mt-2">
         ${sizes.map(size => `<span class="badge bg-primary me-1">${size}</span>`).join(" ")}
       </div>`
    : "";

  col.innerHTML = `
    <div class="product-card w-100"
         data-id="${id}"
         data-name="${name}"
         data-img="${img}"
         data-link="${link}"
         data-price="${price}">
      <img src="${img}" alt="${name}">
      <div class="product-name">${name}</div>
      <div class="product-price">₹ ${price.toLocaleString()}</div>
      <b><h5>Sizes</h5></b> ${sizesHTML}
    </div>
  `;

  col.querySelector(".product-card").addEventListener("click", handleProductClick);
  productsContainer.appendChild(col);
}

async function handleProductClick() {
  const { id, name, img, link, price } = this.dataset;
  console.log("Product Clicked → Name:", name, "| ID:", id);

  const modal = new bootstrap.Modal(document.getElementById("productModal"));
  document.getElementById("modalProductName").innerText = name;
  document.getElementById("modalProductPrice").innerText = "₹ " + parseInt(price).toLocaleString();

  // Show loading state
  const modalCarouselInner = document.getElementById("modalCarouselInner");
  const thumbnailContainer = document.getElementById("modalThumbnails");
  
  modalCarouselInner.innerHTML = `
    <div class="carousel-item active d-flex justify-content-center align-items-center" style="min-height: 400px;">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
    </div>
  `;
  
  if (thumbnailContainer) {
    thumbnailContainer.innerHTML = '';
  }

  const images = await fetchProductImages(link);
  const allImages = images.length > 0 ? images : [img];
  
  // Clear and populate carousel
  modalCarouselInner.innerHTML = "";
  allImages.forEach((src, i) => {
    const div = document.createElement("div");
    div.className = "carousel-item" + (i === 0 ? " active" : "");
    div.innerHTML = `<img src="${src}" class="d-block w-100" alt="Product Image ${i + 1}">`;
    modalCarouselInner.appendChild(div);
  });

  // Create thumbnail gallery
  if (thumbnailContainer && allImages.length > 1) {
    allImages.forEach((src, i) => {
      const thumbnail = document.createElement("div");
      thumbnail.className = `thumbnail-item ${i === 0 ? 'active' : ''}`;
      thumbnail.innerHTML = `<img src="${src}" alt="Thumbnail ${i + 1}">`;
      thumbnail.addEventListener('click', () => {
        // Update carousel
        const carousel = bootstrap.Carousel.getInstance(document.getElementById("modalCarousel"));
        carousel.to(i);
        
        // Update active thumbnail
        document.querySelectorAll('.thumbnail-item').forEach(t => t.classList.remove('active'));
        thumbnail.classList.add('active');
      });
      thumbnailContainer.appendChild(thumbnail);
    });
  }

  // Format price with commas
  const formattedPrice = '₹' + parseInt(price).toLocaleString('en-IN');
  
  // Get the main product image URL (use the first image from the modal or fallback to the thumbnail)
  const modalImg = document.querySelector('#modalCarouselInner .carousel-item.active img');
  const productImageUrl = modalImg ? modalImg.src : img;
  
  // Create a more detailed message with product info and image
  const message = `*Product Inquiry*%0A%0A` +
    `*Product Name:* ${name}%0A` +
    `*Price:* ${formattedPrice}%0A` +
    `*Category:* ${CATEGORY}%0A%0A` +
    `*Product Image:* ${productImageUrl}%0A%0A` +
    `Hello, I'm interested in this product. Could you please provide more details?`;
    
  // Set WhatsApp button href with the message
  const whatsappBtn = document.getElementById("whatsappBtn");
  whatsappBtn.href = `https://wa.me/919876543210?text=${message}`;

  modal.show();
}

/* ------------------- MAIN LOADER ------------------- */

async function loadProducts() {
  if (loading || !CATEGORY || API_URLS.length === 0) return;
  loading = true;

  loadingSpinner.style.display = "block";

  const formData = new URLSearchParams({
    getresult: limit,
    category_slug: CATEGORY,
    searchkeyword: "",
    orderby: "featured",
    min_price: "",
    max_price: "",
    size_ids: "",
    variant_status: 0,
    start: 0
  });

  try {
    const responses = await Promise.all(
      API_URLS.map(url =>
        fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8" },
          body: formData
        })
      )
    );

    const results = await Promise.all(responses.map(res => res.text()));
    let productFound = false;

    results.forEach(html => {
      const productBlocks = parseProducts(html);
      if (productBlocks.length > 0) productFound = true;

      productBlocks.forEach(product => {
        const id = product.querySelector(".product_add_to_cart_button")?.getAttribute("data-product_id") || "0";
        const img = product.querySelector(".product-img-block img")?.src || "";
        const name = product.querySelector(".product-details h6")?.innerText.trim() || "Unnamed Product";
        const link = product.querySelector(".product-details a")?.href || "#";
        const rawPrice = product.querySelector(".price h6")?.innerText.replace(/[^\d]/g, "") || "0";
        const price = (parseInt(rawPrice, 10) || 0) + 1200;
        const sizes = extractSizes(product); // ✅ new

        renderProductCard({ id, img, name, link, price, sizes });
      });
    });

    if (!productFound) loadMoreBtn.style.display = "none";
    limit += 12;
  } catch (error) {
    console.error("Error fetching products:", error);
  } finally {
    loadingSpinner.style.display = "none";
    loading = false;
  }
}

window.onload = loadProducts;
if (loadMoreBtn) {
  loadMoreBtn.addEventListener("click", loadProducts);
}

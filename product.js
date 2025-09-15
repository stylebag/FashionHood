/* ------------------- CONFIG & SETUP ------------------- */
let limit = 12;
let loading = false;
let searchKeyword = ""; // Track search keyword

const productsContainer = document.getElementById("products");
const loadMoreBtn = document.getElementById("loadMore");
const loadingSpinner = document.getElementById("loadingSpinner");
const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");

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

function renderProductCard({ id, img, name, link, price }) {
  const col = document.createElement("div");
  col.className = "col-lg-3 col-md-4 col-sm-6 col-12 d-flex";

  col.innerHTML = `
    <div class="product-card w-100"
         data-id="${id}"
         data-name="${name}"
         data-img="${img}"
         data-link="${link}"
         data-price="${price}">
      <img src="${img}" alt="${name}">
      <div class="product-name" title="${name}">${name}</div>
      <div class="product-price"><strong>Price : </strong> ₹ ${price.toLocaleString()}</div>
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
    `Hello, I'm interested in this product. Could you please provide more details?%0A%0A`;  
  // Set WhatsApp button href with the message
  const whatsappBtn = document.getElementById("whatsappBtn");
  whatsappBtn.href = `https://wa.me/917567265142?text=${message}`;
  
  // Add click handler to include image if possible
  whatsappBtn.onclick = function(e) {
    e.preventDefault();
    
    // Create a temporary canvas to handle the image
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.src = img;
    
    img.onload = function() {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // Set canvas dimensions
      const maxWidth = 800;
      const maxHeight = 800;
      let width = img.width;
      let height = img.height;
      
      // Calculate new dimensions maintaining aspect ratio
      if (width > height) {
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }
      
      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);
      
      // Convert canvas to blob and create object URL
      canvas.toBlob(function(blob) {
        const file = new File([blob], 'product.jpg', { type: 'image/jpeg' });
        
        // Create form data
        const formData = new FormData();
        formData.append('file', file);
        
        // In a real implementation, you would upload the image to your server
        // and get a public URL to include in the WhatsApp message
        // For now, we'll just open WhatsApp with the text message
        window.open(whatsappBtn.href, '_blank');
      }, 'image/jpeg', 0.8);
    };
    
    // If image fails to load, still open WhatsApp with text
    img.onerror = function() {
      window.open(whatsappBtn.href, '_blank');
    };
  };

  modal.show();
}

/* ------------------- MAIN LOADER ------------------- */

async function loadProducts(reset = false) {
  if (loading || !CATEGORY || API_URLS.length === 0) return;
  loading = true;
  loadingSpinner.style.display = "block";

  if (reset) {
    limit = 12;
    productsContainer.innerHTML = ""; // Clear old products on new search
  }

  const formData = new URLSearchParams({
    getresult: limit,
    category_slug: CATEGORY,
    searchkeyword: searchKeyword,   // Use the search keyword
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

        renderProductCard({ id, img, name, link, price });
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

// Initialize on page load
window.onload = () => loadProducts();

// Load more button
if (loadMoreBtn) {
  loadMoreBtn.addEventListener("click", () => loadProducts());
}

// Search functionality
if (searchBtn && searchInput) {
  searchBtn.addEventListener("click", () => {
    searchKeyword = searchInput.value.trim();
    loadProducts(true); // Reset list for new search
  });

  // Search on Enter key
  searchInput.addEventListener("keypress", e => {
    if (e.key === "Enter") {
      searchKeyword = searchInput.value.trim();
      loadProducts(true);
    }
  });
}

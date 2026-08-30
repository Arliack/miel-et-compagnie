const CART_STORAGE_KEY = "miel-ruches-panier";

let produits = [];
let panier = chargerPanier();
let categorieActive = null;

const els = {
  loading: document.getElementById("produits-loading"),
  error: document.getElementById("produits-error"),
  container: document.getElementById("fournisseurs-container"),
  categoryFilter: document.getElementById("category-filter"),
  cartButton: document.getElementById("open-cart-btn"),
  cartCount: document.getElementById("cart-count"),
  cartTotalHeader: document.getElementById("cart-total-header"),
  cartPanel: document.getElementById("cart-panel"),
  cartOverlay: document.getElementById("cart-overlay"),
  closeCartBtn: document.getElementById("close-cart-btn"),
  cartItems: document.getElementById("cart-items"),
  cartTotal: document.getElementById("cart-total"),
  checkoutBtn: document.getElementById("checkout-btn"),
  checkoutModal: document.getElementById("checkout-modal"),
  closeCheckoutBtn: document.getElementById("close-checkout-btn"),
  checkoutItems: document.getElementById("checkout-items"),
  checkoutTotal: document.getElementById("checkout-total"),
  checkoutForm: document.getElementById("checkout-form"),
  formError: document.getElementById("form-error"),
  submitOrderBtn: document.getElementById("submit-order-btn"),
  confirmationModal: document.getElementById("confirmation-modal"),
  closeConfirmationBtn: document.getElementById("close-confirmation-btn"),
  confirmationText: document.getElementById("confirmation-text"),
  helloassoLink: document.getElementById("helloasso-link")
};

init();

async function init() {
  bindEvents();
  majAffichagePanier();
  await chargerProduits();
}

async function chargerProduits() {
  try {
    const res = await fetch(API_URL, { method: "GET" });
    const data = await res.json();
    if (!data.ok) throw new Error("Réponse invalide");
    produits = data.produits;
    afficherFiltreCategories(produits);
    afficherProduits(produits);
    els.loading.classList.add("hidden");
  } catch (err) {
    els.loading.classList.add("hidden");
    els.error.classList.remove("hidden");
    console.error(err);
  }
}

function afficherFiltreCategories(liste) {
  const categories = [];
  liste.forEach((p) => {
    const cat = p.categorie || "Autres";
    if (!categories.includes(cat)) categories.push(cat);
  });

  if (categories.length < 2) {
    els.categoryFilter.classList.add("hidden");
    return;
  }

  els.categoryFilter.classList.remove("hidden");
  els.categoryFilter.innerHTML = "";

  const boutonToutes = creerBoutonFiltre("Toutes", null);
  els.categoryFilter.appendChild(boutonToutes);
  categories.forEach((cat) => {
    els.categoryFilter.appendChild(creerBoutonFiltre(cat, cat));
  });
}

function creerBoutonFiltre(label, valeur) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "filter-btn" + (categorieActive === valeur ? " active" : "");
  btn.textContent = label;
  btn.addEventListener("click", () => {
    categorieActive = valeur;
    [...els.categoryFilter.children].forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    afficherProduits(produits);
  });
  return btn;
}

function afficherProduits(liste) {
  const listeFiltree = categorieActive ? liste.filter((p) => (p.categorie || "Autres") === categorieActive) : liste;
  const parFournisseur = grouperPar(listeFiltree, "fournisseur");

  els.container.innerHTML = "";
  Object.keys(parFournisseur).forEach((fournisseur) => {
    const section = document.createElement("section");
    section.className = "fournisseur-section";

    const titre = document.createElement("h2");
    titre.className = "fournisseur-title";
    titre.textContent = fournisseur;
    section.appendChild(titre);

    const parCategorie = grouperPar(parFournisseur[fournisseur], "categorie");
    Object.keys(parCategorie).forEach((categorie) => {
      const sousSection = document.createElement("div");
      sousSection.className = "categorie-section";

      const sousTitre = document.createElement("h3");
      sousTitre.className = "categorie-title";
      sousTitre.textContent = categorie;
      sousSection.appendChild(sousTitre);

      const grid = document.createElement("div");
      grid.className = "produits-grid";
      parCategorie[categorie].forEach((p) => grid.appendChild(creerCarteProduit(p)));
      sousSection.appendChild(grid);

      section.appendChild(sousSection);
    });

    els.container.appendChild(section);
  });
}

function grouperPar(liste, champ) {
  const groupes = {};
  liste.forEach((p) => {
    const cle = p[champ] || "Autres";
    if (!groupes[cle]) groupes[cle] = [];
    groupes[cle].push(p);
  });
  return groupes;
}

function creerCarteProduit(produit) {
  const card = document.createElement("article");
  card.className = "produit-card";

  const image = document.createElement("div");
  image.className = "produit-image";
  if (produit.image) {
    const img = document.createElement("img");
    img.src = produit.image;
    img.alt = produit.nom;
    img.loading = "lazy";
    image.appendChild(img);
  } else {
    image.textContent = "🍯";
  }

  const body = document.createElement("div");
  body.className = "produit-body";
  body.innerHTML = `
    <div class="produit-nom">${escapeHtml(produit.nom)}</div>
    <div class="produit-desc">${escapeHtml(produit.description || "")}</div>
    <div class="produit-footer">
      <span class="produit-prix">${formaterPrix(produit.prix)}</span>
    </div>
  `;

  const btn = document.createElement("button");
  btn.className = "btn-add";
  btn.type = "button";
  btn.textContent = "Ajouter";
  btn.addEventListener("click", () => {
    ajouterAuPanier(produit);
    btn.textContent = "Ajouté ✓";
    btn.classList.add("added");
    setTimeout(() => {
      btn.textContent = "Ajouter";
      btn.classList.remove("added");
    }, 900);
  });

  body.querySelector(".produit-footer").appendChild(btn);
  card.appendChild(image);
  card.appendChild(body);
  return card;
}

function bindEvents() {
  els.cartButton.addEventListener("click", ouvrirPanier);
  els.closeCartBtn.addEventListener("click", fermerPanier);
  els.cartOverlay.addEventListener("click", () => {
    fermerPanier();
    fermerCheckout();
  });

  els.checkoutBtn.addEventListener("click", ouvrirCheckout);
  els.closeCheckoutBtn.addEventListener("click", fermerCheckout);
  els.checkoutForm.addEventListener("submit", validerCommande);

  els.closeConfirmationBtn.addEventListener("click", () => {
    els.confirmationModal.classList.add("hidden");
  });
}

/* --- Panier --- */

function chargerPanier() {
  try {
    return JSON.parse(localStorage.getItem(CART_STORAGE_KEY)) || {};
  } catch (e) {
    return {};
  }
}

function sauvegarderPanier() {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(panier));
}

function ajouterAuPanier(produit) {
  if (!panier[produit.id]) {
    panier[produit.id] = { produit, quantite: 0 };
  }
  panier[produit.id].quantite += 1;
  sauvegarderPanier();
  majAffichagePanier();
}

function retirerDuPanier(id) {
  delete panier[id];
  sauvegarderPanier();
  majAffichagePanier();
}

function changerQuantite(id, delta) {
  if (!panier[id]) return;
  panier[id].quantite += delta;
  if (panier[id].quantite <= 0) {
    retirerDuPanier(id);
    return;
  }
  sauvegarderPanier();
  majAffichagePanier();
}

function lignesPanier() {
  return Object.values(panier);
}

function totalPanier() {
  return lignesPanier().reduce((sum, l) => sum + l.produit.prix * l.quantite, 0);
}

function majAffichagePanier() {
  const lignes = lignesPanier();
  const nbArticles = lignes.reduce((s, l) => s + l.quantite, 0);
  const total = totalPanier();

  els.cartCount.textContent = nbArticles;
  els.cartTotalHeader.textContent = formaterPrix(total);
  els.cartTotal.textContent = formaterPrix(total);
  els.checkoutBtn.disabled = nbArticles === 0;

  els.cartItems.innerHTML = "";
  if (!lignes.length) {
    els.cartItems.innerHTML = '<p class="cart-empty">Votre panier est vide pour le moment 🐝</p>';
    return;
  }

  lignes.forEach((ligne) => {
    const div = document.createElement("div");
    div.className = "cart-item";
    div.innerHTML = `
      <div class="cart-item-info">
        <div class="cart-item-nom">${escapeHtml(ligne.produit.nom)}</div>
        <div class="cart-item-prix">${formaterPrix(ligne.produit.prix)} / unité</div>
      </div>
      <div class="qty-control">
        <button type="button" data-action="moins">-</button>
        <span>${ligne.quantite}</span>
        <button type="button" data-action="plus">+</button>
      </div>
    `;
    div.querySelector('[data-action="moins"]').addEventListener("click", () => changerQuantite(ligne.produit.id, -1));
    div.querySelector('[data-action="plus"]').addEventListener("click", () => changerQuantite(ligne.produit.id, 1));
    els.cartItems.appendChild(div);
  });
}

function ouvrirPanier() {
  els.cartPanel.classList.remove("hidden");
  els.cartOverlay.classList.remove("hidden");
}

function fermerPanier() {
  els.cartPanel.classList.add("hidden");
  els.cartOverlay.classList.add("hidden");
}

/* --- Checkout --- */

function ouvrirCheckout() {
  const lignes = lignesPanier();
  if (!lignes.length) return;

  els.checkoutItems.innerHTML = lignes
    .map(
      (l) => `
      <div class="checkout-item">
        <span>${escapeHtml(l.produit.nom)} × ${l.quantite}</span>
        <span>${formaterPrix(l.produit.prix * l.quantite)}</span>
      </div>`
    )
    .join("");
  els.checkoutTotal.textContent = formaterPrix(totalPanier());

  fermerPanier();
  els.checkoutModal.classList.remove("hidden");
  els.cartOverlay.classList.remove("hidden");
}

function fermerCheckout() {
  els.checkoutModal.classList.add("hidden");
  els.cartOverlay.classList.add("hidden");
}

async function validerCommande(event) {
  event.preventDefault();
  els.formError.classList.add("hidden");

  const nomEleve = document.getElementById("nomEleve").value.trim();
  const prenomEleve = document.getElementById("prenomEleve").value.trim();
  const classe = document.getElementById("classe").value.trim();
  const telephone = document.getElementById("telephone").value.trim();
  const email = document.getElementById("email").value.trim();
  const commune = document.getElementById("commune").value.trim();

  const payload = {
    nomEleve,
    prenomEleve,
    classe,
    telephone,
    email,
    commune,
    panier: lignesPanier().map((l) => ({ id: l.produit.id, quantite: l.quantite }))
  };

  els.submitOrderBtn.disabled = true;
  els.submitOrderBtn.textContent = "Envoi en cours…";

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      body: JSON.stringify(payload)
    });
    const data = await res.json();

    if (!data.ok) throw new Error(data.erreur || "Erreur lors de l'enregistrement.");

    afficherConfirmation(data.commande);
    panier = {};
    sauvegarderPanier();
    majAffichagePanier();
    els.checkoutForm.reset();
    fermerCheckout();
  } catch (err) {
    els.formError.textContent = "Une erreur est survenue : " + err.message;
    els.formError.classList.remove("hidden");
  } finally {
    els.submitOrderBtn.disabled = false;
    els.submitOrderBtn.textContent = "Confirmer et commander";
  }
}

function afficherConfirmation(commande) {
  els.confirmationText.textContent =
    "Commande " + commande.idCommande + " — Total : " + formaterPrix(commande.total);

  if (commande.lienHelloAsso) {
    els.helloassoLink.href = commande.lienHelloAsso;
    els.helloassoLink.classList.remove("hidden");
  } else {
    els.helloassoLink.classList.add("hidden");
  }

  els.confirmationModal.classList.remove("hidden");
  els.cartOverlay.classList.add("hidden");
}

/* --- Utils --- */

function formaterPrix(valeur) {
  return Number(valeur).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str || "";
  return div.innerHTML;
}

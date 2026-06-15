import {
  addAd,
  changeSeats,
  ensureMockData,
  getAdById,
  getAds,
  getFavorites,
  getMyAds,
  getProfile,
  removeAd,
  saveProfile,
  toggleFavorite,
  toggleNoSeats,
} from "./storage.js";
import { renderAdDetails, renderAdsGrid } from "./render.js";

const page = document.body.dataset.page;

ensureMockData();

if (page === "details") {
  initDetailsPage();
} else {
  initIndexPage();
}

function initDetailsPage() {
  const container = document.getElementById("detailsContainer");
  const profile = getProfile();
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  const ad = id ? getAdById(id) : null;
  const owner = ad ? getOwnerById(ad.ownerId) : null;
  renderAdDetails(container, ad, owner, { currentUserId: profile.id });

  container.addEventListener("click", (event) => {
    const target = event.target.closest("[data-action]");
    if (!target) return;
    const action = target.dataset.action;
    const adId = target.dataset.id;
    if (!adId) return;

    if (action === "seats-dec") {
      changeSeats(adId, -1);
    } else if (action === "seats-inc") {
      changeSeats(adId, 1);
    } else if (action === "toggle-no-seats") {
      toggleNoSeats(adId);
    } else {
      return;
    }

    const updated = getAdById(adId);
    const updatedOwner = updated ? getOwnerById(updated.ownerId) : owner;
    renderAdDetails(container, updated, updatedOwner, { currentUserId: profile.id });
  });
}

function initIndexPage() {
  const state = {
    activeTab: "taxi",
    activeSection: "home",
    favoritesOnly: false,
  };

  const profile = getProfile();

  const nodes = {
    taxiTabBtn: document.getElementById("taxiTabBtn"),
    passengerTabBtn: document.getElementById("passengerTabBtn"),
    adsGrid: document.getElementById("adsGrid"),
    myAdsGrid: document.getElementById("myAdsGrid"),
    homeSection: document.getElementById("homeSection"),
    myAdsSection: document.getElementById("myAdsSection"),
    profileSection: document.getElementById("profileSection"),
    mobileNavBtns: document.querySelectorAll(".mobile-nav__btn"),
    openCreateModalBtn: document.getElementById("openCreateModalBtn"),
    createModal: document.getElementById("createModal"),
    createAdForm: document.getElementById("createAdForm"),
    adRole: document.getElementById("adRole"),
    favoritesFilterBtn: document.getElementById("favoritesFilterBtn"),
    profileForm: document.getElementById("profileForm"),
    profileFirstName: document.getElementById("profileFirstName"),
    profileLastName: document.getElementById("profileLastName"),
    profileAvatar: document.getElementById("profileAvatar"),
    profilePhone: document.getElementById("profilePhone"),
  };

  hydrateProfileForm(nodes, profile);
  refreshRoleFields(nodes.createAdForm, nodes.adRole.value);
  renderAll(state, nodes, profile);
  bindEvents(state, nodes, profile);
}

function bindEvents(state, nodes, profile) {
  nodes.taxiTabBtn.addEventListener("click", () => {
    state.activeTab = "taxi";
    setTabButtons(nodes, state.activeTab);
    renderAll(state, nodes, profile);
  });

  nodes.passengerTabBtn.addEventListener("click", () => {
    state.activeTab = "passenger";
    setTabButtons(nodes, state.activeTab);
    renderAll(state, nodes, profile);
  });

  nodes.mobileNavBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      state.activeSection = btn.dataset.section;
      setSection(nodes, state.activeSection);
    });
  });

  nodes.openCreateModalBtn.addEventListener("click", () => {
    nodes.createModal.classList.remove("hidden");
  });

  nodes.createModal.addEventListener("click", (event) => {
    const target = event.target;
    if (target instanceof HTMLElement && target.dataset.closeModal) {
      nodes.createModal.classList.add("hidden");
    }
  });

  nodes.adRole.addEventListener("change", (event) => {
    refreshRoleFields(nodes.createAdForm, event.target.value);
  });

  nodes.createAdForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(nodes.createAdForm);
    const newAd = formDataToAd(formData, profile.id);
    addAd(newAd);
    nodes.createAdForm.reset();
    refreshRoleFields(nodes.createAdForm, "passenger");
    nodes.createModal.classList.add("hidden");
    renderAll(state, nodes, profile);
  });

  nodes.favoritesFilterBtn.addEventListener("click", () => {
    state.favoritesOnly = !state.favoritesOnly;
    nodes.favoritesFilterBtn.textContent = state.favoritesOnly ? "♥" : "♡";
    renderAll(state, nodes, profile);
  });

  nodes.adsGrid.addEventListener("click", (event) => {
    handleCardActions(event, profile.id, () => renderAll(state, nodes, profile));
  });
  nodes.myAdsGrid.addEventListener("click", (event) => {
    handleCardActions(event, profile.id, () => renderAll(state, nodes, profile));
  });

  nodes.profileForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const updated = {
      ...profile,
      firstName: nodes.profileFirstName.value.trim(),
      lastName: nodes.profileLastName.value.trim(),
      avatarUrl: nodes.profileAvatar.value.trim(),
      phone: nodes.profilePhone.value.trim(),
    };
    saveProfile(updated);
    Object.assign(profile, updated);
    renderAll(state, nodes, profile);
  });
}

function renderAll(state, nodes, profile) {
  setSection(nodes, state.activeSection);
  setTabButtons(nodes, state.activeTab);

  const allAds = getAds();
  const favorites = getFavorites();

  const filteredByTab =
    state.activeTab === "taxi"
      ? allAds.filter((ad) => ad.role !== "passenger")
      : allAds.filter((ad) => ad.role === "passenger");
  const visibleAds = state.favoritesOnly
    ? filteredByTab.filter((ad) => favorites.includes(ad.id))
    : filteredByTab;

  renderAdsGrid(nodes.adsGrid, visibleAds, getOwnerById, favorites, { currentUserId: profile.id });
  renderAdsGrid(nodes.myAdsGrid, getMyAds(profile.id), getOwnerById, favorites, { currentUserId: profile.id });
}

function handleCardActions(event, currentUserId, done) {
  const actionNode = event.target.closest("[data-action]");
  if (!actionNode) return;
  const action = actionNode.dataset.action;
  const id = actionNode.dataset.id;
  if (!id) return;

  if (action === "favorite") {
    toggleFavorite(id);
    done();
    return;
  }

  const ad = getAdById(id);
  if (!ad || ad.ownerId !== currentUserId) return;

  if (action === "toggle-no-seats") {
    toggleNoSeats(id);
    done();
    return;
  }

  if (action === "seats-dec") {
    changeSeats(id, -1);
    done();
    return;
  }

  if (action === "seats-inc") {
    changeSeats(id, 1);
    done();
    return;
  }

  if (action === "delete-ad") {
    removeAd(id);
    done();
  }
}

function setTabButtons(nodes, activeTab) {
  nodes.taxiTabBtn.classList.toggle("tab-btn--active", activeTab === "taxi");
  nodes.passengerTabBtn.classList.toggle("tab-btn--active", activeTab === "passenger");
}

function setSection(nodes, section) {
  const map = {
    home: nodes.homeSection,
    myAds: nodes.myAdsSection,
    profile: nodes.profileSection,
  };

  Object.entries(map).forEach(([key, element]) => {
    element.classList.toggle("hidden", key !== section);
  });

  nodes.mobileNavBtns.forEach((btn) => {
    btn.classList.toggle("mobile-nav__btn--active", btn.dataset.section === section);
  });
}

function hydrateProfileForm(nodes, profile) {
  nodes.profileFirstName.value = profile.firstName || "";
  nodes.profileLastName.value = profile.lastName || "";
  nodes.profileAvatar.value = profile.avatarUrl || "";
  nodes.profilePhone.value = profile.phone || "";
}

function refreshRoleFields(form, role) {
  const passengerOnly = form.querySelectorAll(".role-passenger-only");
  const driverOnly = form.querySelectorAll(".role-driver-only");
  const taxiOnly = form.querySelectorAll(".role-taxi-only");

  passengerOnly.forEach((field) => {
    const active = role === "passenger";
    field.classList.toggle("hidden", !active);
    setInputRequired(field, active);
  });

  driverOnly.forEach((field) => {
    const active = role !== "passenger";
    field.classList.toggle("hidden", !active);
    setInputRequired(field, active);
  });

  taxiOnly.forEach((field) => {
    const active = role === "driver_taxi";
    field.classList.toggle("hidden", !active);
    setInputRequired(field, active);
  });
}

function setInputRequired(fieldNode, required) {
  const input = fieldNode.querySelector("input, select");
  if (!input) return;
  input.required = required;
}

function getOwnerById(id) {
  const me = getProfile();
  if (me.id === id) return me;
  return {
    id,
    firstName: "Пользователь",
    lastName: id.slice(-3),
    avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=500&q=70",
    phone: "996700000000",
  };
}

function formDataToAd(formData, ownerId) {
  const role = formData.get("role");
  const rawSeats = role !== "passenger" ? Number(formData.get("seatsLeft") || 0) : null;
  const seatsTotal = role !== "passenger" ? Math.max(0, rawSeats || 0) : null;
  return {
    id: `ad-${Date.now()}`,
    ownerId,
    role,
    from: String(formData.get("from") || "").trim(),
    to: String(formData.get("to") || "").trim(),
    date: String(formData.get("date") || ""),
    time: String(formData.get("time") || ""),
    price: Number(formData.get("price") || 0),
    peopleCount: role === "passenger" ? Number(formData.get("peopleCount") || 1) : null,
    carModel: role !== "passenger" ? String(formData.get("carModel") || "").trim() : null,
    carPhotoUrl: role !== "passenger" ? String(formData.get("carPhotoUrl") || "").trim() : null,
    seatsLeft: role !== "passenger" ? seatsTotal : null,
    seatsTotal,
    isNoSeats: role !== "passenger" ? seatsTotal <= 0 : false,
    experienceYears: role === "driver_taxi" ? Number(formData.get("experienceYears") || 0) : null,
    createdAt: Date.now(),
  };
}


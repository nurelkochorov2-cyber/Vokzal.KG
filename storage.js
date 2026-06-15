const STORAGE_KEYS = {
  profile: "vokzal_profile_v1",
  ads: "vokzal_ads_v1",
  favorites: "vokzal_favorites_v1",
};

const mockProfile = {
  id: "u-1",
  firstName: "Нурсултан",
  lastName: "Асанов",
  avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=500&q=70",
  phone: "996700123456",
};

const mockAds = [
  {
    id: "ad-1",
    ownerId: "u-1",
    role: "driver_taxi",
    from: "Бишкек",
    to: "Ош",
    date: "2026-06-03",
    time: "09:00",
    price: 2500,
    carModel: "Toyota Camry 55",
    carPhotoUrl: "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1200&q=70",
    seatsLeft: 0,
    seatsTotal: 4,
    isNoSeats: true,
    experienceYears: 8,
    peopleCount: null,
    createdAt: Date.now() - 1000 * 60 * 60 * 3,
  },
  {
    id: "ad-2",
    ownerId: "u-2",
    role: "driver_companion",
    from: "Талас",
    to: "Бишкек",
    date: "2026-06-04",
    time: "14:30",
    price: 1800,
    carModel: "KIA Sportage",
    carPhotoUrl: "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1200&q=70",
    seatsLeft: 3,
    seatsTotal: 3,
    isNoSeats: false,
    experienceYears: null,
    peopleCount: null,
    createdAt: Date.now() - 1000 * 60 * 60 * 2,
  },
  {
    id: "ad-3",
    ownerId: "u-3",
    role: "passenger",
    from: "Кант",
    to: "Бишкек",
    date: "2026-06-02",
    time: "18:15",
    price: 450,
    peopleCount: 2,
    carModel: null,
    carPhotoUrl: null,
    seatsLeft: null,
    seatsTotal: null,
    isNoSeats: false,
    experienceYears: null,
    createdAt: Date.now() - 1000 * 60 * 40,
  },
];

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function ensureMockData() {
  if (!localStorage.getItem(STORAGE_KEYS.profile)) {
    writeJson(STORAGE_KEYS.profile, mockProfile);
  }
  if (!localStorage.getItem(STORAGE_KEYS.ads)) {
    writeJson(STORAGE_KEYS.ads, mockAds);
  }
  if (!localStorage.getItem(STORAGE_KEYS.favorites)) {
    writeJson(STORAGE_KEYS.favorites, []);
  }
}

export function getProfile() {
  return readJson(STORAGE_KEYS.profile, mockProfile);
}

export function saveProfile(profile) {
  writeJson(STORAGE_KEYS.profile, profile);
}

export function getAds() {
  const ads = readJson(STORAGE_KEYS.ads, mockAds);
  return [...ads].sort((a, b) => b.createdAt - a.createdAt);
}

export function getAdById(id) {
  return getAds().find((ad) => ad.id === id) || null;
}

export function saveAds(ads) {
  writeJson(STORAGE_KEYS.ads, ads);
}

export function addAd(ad) {
  const ads = getAds();
  ads.unshift(ad);
  saveAds(ads);
}

export function updateAd(adId, patch) {
  const ads = getAds().map((ad) => (ad.id === adId ? { ...ad, ...patch } : ad));
  saveAds(ads);
}

export function removeAd(adId) {
  const ads = getAds().filter((ad) => ad.id !== adId);
  saveAds(ads);
}

export function getMyAds(userId) {
  return getAds().filter((ad) => ad.ownerId === userId);
}

export function toggleNoSeats(adId) {
  const ad = getAdById(adId);
  if (!ad || ad.role === "passenger") return;
  if (!ad.isNoSeats) {
    // Принудительно закрываем места
    updateAd(adId, { isNoSeats: true, seatsLeft: 0 });
  } else {
    // Открываем — оставляем минимум одно место
    const max = ad.seatsTotal ?? ad.seatsLeft ?? 1;
    const newSeats = Math.max(1, Math.min(max, ad.seatsLeft || max));
    updateAd(adId, { isNoSeats: false, seatsLeft: newSeats });
  }
}

export function changeSeats(adId, delta) {
  const ad = getAdById(adId);
  if (!ad || ad.role === "passenger") return;
  const max = ad.seatsTotal ?? ad.seatsLeft ?? 0;
  const current = ad.seatsLeft ?? max;
  let seatsLeft = current + delta;
  if (seatsLeft < 0) seatsLeft = 0;
  if (seatsLeft > max) seatsLeft = max;
  const isNoSeats = seatsLeft === 0;
  updateAd(adId, { seatsLeft, isNoSeats });
}

export function getFavorites() {
  return readJson(STORAGE_KEYS.favorites, []);
}

export function toggleFavorite(adId) {
  const favorites = new Set(getFavorites());
  if (favorites.has(adId)) favorites.delete(adId);
  else favorites.add(adId);
  writeJson(STORAGE_KEYS.favorites, Array.from(favorites));
}

export function clearFavorites() {
  writeJson(STORAGE_KEYS.favorites, []);
}


function esc(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function normalizePhone(phone) {
  return String(phone || "").replace(/[^\d]/g, "");
}

export function buildContactLinks(phone) {
  const clean = normalizePhone(phone);
  if (!clean) return { wa: "#", tg: "#", tel: "#" };
  return {
    wa: `https://wa.me/${clean}`,
    tg: `https://t.me/${clean}`,
    tel: `tel:${clean}`,
  };
}

function roleLabel(role) {
  if (role === "driver_taxi") return "Водитель-таксист";
  if (role === "driver_companion") return "Водитель-попутчик";
  return "Пассажир";
}

function seatBadge(ad) {
  if (ad.role === "passenger") return "";
  if (ad.isNoSeats || (ad.seatsLeft ?? 0) === 0) {
    return `<span class="badge badge--off">Мест нет</span>`;
  }
  return `<span class="badge badge--ok">Осталось мест: ${esc(ad.seatsLeft)}</span>`;
}

function detailsMeta(ad) {
  const common = `
    <div><strong>Маршрут:</strong> ${esc(ad.from)} → ${esc(ad.to)}</div>
    <div><strong>Когда:</strong> ${esc(ad.date)} ${esc(ad.time)}</div>
    <div><strong>Цена:</strong> ${esc(ad.price)} сом</div>
  `;
  if (ad.role === "passenger") {
    return `${common}<div><strong>Пассажиров:</strong> ${esc(ad.peopleCount)}</div>`;
  }
  const taxiExtra =
    ad.role === "driver_taxi" ? `<div><strong>Стаж:</strong> ${esc(ad.experienceYears)} лет</div>` : "";
  return `${common}
    <div><strong>Авто:</strong> ${esc(ad.carModel)}</div>
    ${taxiExtra}
    <div><strong>Статус:</strong> ${ad.isNoSeats ? "Мест нет" : `Осталось мест: ${esc(ad.seatsLeft)}`}</div>
  `;
}

export function renderAdCard(ad, owner, { isMine = false, isFavorite = false } = {}) {
  const ownerName = `${owner?.firstName || ""} ${owner?.lastName || ""}`.trim() || "Пользователь";
  const avatar = owner?.avatarUrl || "https://placehold.co/120x120/e5e7eb/111827?text=U";
  const links = buildContactLinks(owner?.phone || "");
  const disabled = ad.role !== "passenger" && ad.isNoSeats;

  const actions = `
    <div class="contact-actions">
      <a class="contact-btn contact-btn--wa" ${disabled ? "aria-disabled='true'" : ""} href="${disabled ? "#" : links.wa}" target="_blank" rel="noopener">WhatsApp</a>
      <a class="contact-btn contact-btn--tg" ${disabled ? "aria-disabled='true'" : ""} href="${disabled ? "#" : links.tg}" target="_blank" rel="noopener">Telegram</a>
      <a class="contact-btn contact-btn--call" ${disabled ? "aria-disabled='true'" : ""} href="${disabled ? "#" : links.tel}">Позвонить</a>
    </div>
  `;

  const ownerVisual =
    ad.role === "driver_taxi"
      ? `<img class="avatar" src="${esc(avatar)}" alt="Фото водителя" />`
      : `<img class="avatar" src="${esc(avatar)}" alt="Аватар автора" />`;

  return `
    <article class="card ${ad.isNoSeats ? "card--inactive" : ""}">
      <div class="card__top">
        <div class="card__owner">
          ${ownerVisual}
          <div>
            <div><strong>${esc(ownerName)}</strong></div>
            <div>${roleLabel(ad.role)}</div>
          </div>
        </div>
        ${seatBadge(ad)}
      </div>

      ${
        ad.carPhotoUrl
          ? `<img class="car-photo" src="${esc(ad.carPhotoUrl)}" alt="Фото машины" loading="lazy" />`
          : ""
      }

      <div class="meta-list">${detailsMeta(ad)}</div>

      ${
        isMine && ad.role !== "passenger"
          ? `<div class="seat-counter">
              <span><strong>Свободные места:</strong> ${esc(ad.seatsLeft)}</span>
              <div class="contact-actions">
                <button class="seat-counter__btn" data-action="seats-dec" data-id="${esc(
                  ad.id
                )}" type="button">−</button>
                <button class="seat-counter__btn" data-action="seats-inc" data-id="${esc(
                  ad.id
                )}" type="button">+</button>
              </div>
            </div>`
          : ""
      }

      ${actions}

      <div class="card-actions">
        <a class="btn btn--primary" href="./details.html?id=${esc(ad.id)}">Подробнее</a>
        <button class="btn" data-action="favorite" data-id="${esc(ad.id)}" type="button">${isFavorite ? "★ В избранном" : "☆ Избранное"}</button>
        ${
          isMine
            ? `
          <button class="btn" data-action="toggle-no-seats" data-id="${esc(ad.id)}" type="button">${ad.isNoSeats ? "Открыть места" : "Мест нет"}</button>
          <button class="btn btn--danger" data-action="delete-ad" data-id="${esc(ad.id)}" type="button">Удалить</button>
        `
            : ""
        }
      </div>
    </article>
  `;
}

export function renderAdsGrid(container, ads, profileById, favorites, options = {}) {
  if (!ads.length) {
    container.innerHTML = `<div class="empty-state">Объявлений пока нет.</div>`;
    return;
  }
  const html = ads
    .map((ad) => {
      const owner = profileById(ad.ownerId);
      return renderAdCard(ad, owner, {
        isMine: options.currentUserId === ad.ownerId,
        isFavorite: favorites.includes(ad.id),
      });
    })
    .join("");
  container.innerHTML = html;
}

export function renderAdDetails(container, ad, owner, options = {}) {
  if (!ad) {
    container.innerHTML = `<div class="empty-state">Объявление не найдено.</div>`;
    return;
  }
  const links = buildContactLinks(owner?.phone || "");
  const ownerName = `${owner?.firstName || ""} ${owner?.lastName || ""}`.trim() || "Пользователь";
  const avatar = owner?.avatarUrl || "https://placehold.co/120x120/e5e7eb/111827?text=U";
  const disableContact = ad.role !== "passenger" && (ad.isNoSeats || (ad.seatsLeft ?? 0) === 0);
  const isMine = options.currentUserId && ad.ownerId === options.currentUserId && ad.role !== "passenger";
  container.innerHTML = `
    <article class="details ${ad.isNoSeats ? "card--inactive" : ""}">
      <div class="card__owner">
        <img class="avatar" src="${esc(avatar)}" alt="Аватар" />
        <div>
          <h1>${esc(ownerName)}</h1>
          <div>${roleLabel(ad.role)}</div>
        </div>
      </div>
      <div class="details__gallery">
        ${ad.carPhotoUrl ? `<img src="${esc(ad.carPhotoUrl)}" alt="Фото машины" />` : ""}
        ${ad.role === "driver_taxi" ? `<img src="${esc(avatar)}" alt="Фото водителя" />` : ""}
      </div>
      <div class="meta-list">${detailsMeta(ad)}</div>
      ${
        isMine
          ? `<div class="seat-counter">
                <span><strong>Свободные места:</strong> ${esc(ad.seatsLeft)}</span>
                <div class="contact-actions">
                  <button class="seat-counter__btn" data-action="seats-dec" data-id="${esc(
                    ad.id
                  )}" type="button">−</button>
                  <button class="seat-counter__btn" data-action="seats-inc" data-id="${esc(
                    ad.id
                  )}" type="button">+</button>
                  <button class="btn" data-action="toggle-no-seats" data-id="${esc(
                    ad.id
                  )}" type="button">${ad.isNoSeats ? "Открыть места" : "Мест нет"}</button>
                </div>
             </div>`
          : ""
      }
      ${seatBadge(ad)}
      <div class="contact-actions">
        <a class="contact-btn contact-btn--wa" href="${disableContact ? "#" : links.wa}" target="_blank" rel="noopener">WhatsApp</a>
        <a class="contact-btn contact-btn--tg" href="${disableContact ? "#" : links.tg}" target="_blank" rel="noopener">Telegram</a>
        <a class="contact-btn contact-btn--call" href="${disableContact ? "#" : links.tel}">Позвонить</a>
      </div>
    </article>
  `;
}


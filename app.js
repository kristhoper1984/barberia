document.addEventListener('DOMContentLoaded', async () => {
  const STORAGE_KEY = 'barberia-premium-v1';
  const CUSTOMER_PROFILE_KEY = 'barberia-premium-customer-profile';
  const ADMIN_SESSION_KEY = 'barberia-premium-admin';
  const ADMIN_PASSWORD = 'king2024';
  const NOTIFICATION_API_URL = window.NOTIFICATION_API_URL || '/api/notifications';
  
  const SERVICE_CATALOG = {
    corte: { name: 'Corte', price: 25000 },
    'corte-barba': { name: 'Corte con Barba', price: 30000 },
    full: { name: 'Corte con Barba y Cejas', price: 35000 }
  };

  const page = document.body.dataset.page || 'customer';
  const datePicker = document.getElementById('date-picker');
  const serviceSelect = document.getElementById('service-select');
  const timeGrid = document.getElementById('time-grid');
  const blockDate = document.getElementById('block-date');
  const blockStart = document.getElementById('block-start');
  const blockReason = document.getElementById('block-reason');
  const blockBtn = document.getElementById('block-slot-btn');
  const modal = document.getElementById('reservation-modal');
  const closeModal = document.getElementById('close-modal');
  const selectedInfo = document.getElementById('selected-info');
  const confirmBtn = document.getElementById('confirm-reservation');
  const nameInput = document.getElementById('customer-name');
  const phoneInput = document.getElementById('customer-phone');
  const emailInput = document.getElementById('customer-email');
  const saveProfileBtn = document.getElementById('save-profile-btn');
  const profileStatus = document.getElementById('profile-status');
  const myReservationsEl = document.getElementById('my-reservations');
  const shareLinkInput = document.getElementById('share-link');
  const qrCodeImg = document.getElementById('qr-code');
  const todayBookingsEl = document.getElementById('today-bookings');
  const dailyRevenueEl = document.getElementById('daily-revenue');
  const occupancyRateEl = document.getElementById('occupancy-rate');
  const totalRevenueEl = document.getElementById('total-revenue');
  const monthlyRevenueEl = document.getElementById('monthly-revenue');
  const monthlyBookingsEl = document.getElementById('monthly-bookings');
  const blockedSlotsEl = document.getElementById('blocked-slots');
  const avgServicePriceEl = document.getElementById('avg-service-price');
  const reservationsBody = document.getElementById('reservations-body');
  const selectedDateLabel = document.getElementById('selected-date-label');
  const selectedServiceLabel = document.getElementById('selected-service-label');
  const servicePricePill = document.getElementById('service-price-pill');
  const reportMonthInput = document.getElementById('report-month');
  const reportDayInput = document.getElementById('report-day');
  const adminLoginPanel = document.getElementById('admin-login-panel');
  const adminContent = document.getElementById('admin-content');
  const adminLoginForm = document.getElementById('admin-login-form');
  const adminPasswordInput = document.getElementById('admin-password');
  const adminLogoutBtn = document.getElementById('admin-logout-btn');
  const clearFiltersBtn = document.getElementById('clear-filters-btn');
  const editModal = document.getElementById('reservation-edit-modal');
  const closeEditModal = document.getElementById('close-edit-modal');
  const editReservationIdInput = document.getElementById('edit-reservation-id');
  const editCustomerName = document.getElementById('edit-customer-name');
  const editCustomerPhone = document.getElementById('edit-customer-phone');
  const editDateInput = document.getElementById('edit-date');
  const editServiceSelect = document.getElementById('edit-service-select');
  const editStartTime = document.getElementById('edit-start-time');
  const saveEditionBtn = document.getElementById('save-edition');

  let selectedStart = null;
  let selectedEnd = null;

  function formatCurrency(value) {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      maximumFractionDigits: 0
    }).format(Number(value || 0));
  }

  function toMinutes(time) {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  function toHHMM(totalMinutes) {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  }

  function getTodayISO() {
    const now = new Date();
    const offset = now.getTimezoneOffset();
    const localDate = new Date(now.getTime() - offset * 60 * 1000);
    return localDate.toISOString().slice(0, 10);
  }

  function getCurrentTimeISO() {
    const now = new Date();
    return toHHMM(now.getHours() * 60 + now.getMinutes());
  }

  function getMonthISO(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  }

  function setAdminSession(value) {
    try {
      localStorage.setItem(ADMIN_SESSION_KEY, String(value));
    } catch (error) {
      console.warn('No se pudo guardar sesión admin en localStorage:', error);
    }

    try {
      sessionStorage.setItem(ADMIN_SESSION_KEY, String(value));
    } catch (error) {
      console.warn('No se pudo guardar sesión admin en sessionStorage:', error);
    }
  }

  function isAdminLoggedIn() {
    try {
      if (localStorage.getItem(ADMIN_SESSION_KEY) === 'true') return true;
    } catch (error) {
      console.warn('No se pudo leer sesión admin desde localStorage:', error);
    }

    try {
      return sessionStorage.getItem(ADMIN_SESSION_KEY) === 'true';
    } catch (error) {
      console.warn('No se pudo leer sesión admin desde sessionStorage:', error);
      return false;
    }
  }

  function getStoredState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { reservations: [], blocks: [] };
      const parsed = JSON.parse(raw);
      return {
        reservations: Array.isArray(parsed.reservations) ? parsed.reservations : [],
        blocks: Array.isArray(parsed.blocks) ? parsed.blocks : []
      };
    } catch (error) {
      console.warn('No se pudo leer el estado local:', error);
      return { reservations: [], blocks: [] };
    }
  }

  function saveState(state) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function seedDemoData() {
    const state = getStoredState();
    if (state.reservations.length || state.blocks.length) return;

    const today = getTodayISO();
    const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);

    state.reservations = [
      {
        id: crypto.randomUUID(),
        date: today,
        start: '09:20',
        end: '10:00',
        name: 'Sofía R.',
        phone: '+56 9 1234 5678',
        service: 'corte',
        status: 'reservado',
        price: SERVICE_CATALOG.corte.price,
        createdAt: new Date().toISOString()
      },
      {
        id: crypto.randomUUID(),
        date: tomorrow,
        start: '14:00',
        end: '14:40',
        name: 'Mateo P.',
        phone: '+56 9 9876 5432',
        service: 'corte-barba',
        status: 'reservado',
        price: SERVICE_CATALOG['corte-barba'].price,
        createdAt: new Date().toISOString()
      },
      {
        id: crypto.randomUUID(),
        date: today,
        start: '17:20',
        end: '18:00',
        name: 'Daniel T.',
        phone: '+56 9 5555 0001',
        service: 'full',
        status: 'reservado',
        price: SERVICE_CATALOG.full.price,
        createdAt: new Date().toISOString()
      }
    ];

    state.blocks = [
      {
        id: crypto.randomUUID(),
        date: today,
        start: '11:20',
        end: '12:00',
        reason: 'Mantenimiento',
        status: 'bloqueado'
      }
    ];

    saveState(state);
  }

  function normalizeSupabaseRows(rows = []) {
    return rows.map((row) => ({
      id: row.id,
      date: row.date || row.fecha,
      start: row.start || row.hora_inicio || row.hora,
      end: row.end || row.hora_fin,
      name: row.name || row.nombre || row.customer_name || 'Cliente',
      phone: row.phone || row.telefono || '',
      email: row.email || '',
      service: row.service || 'corte',
      status: row.status || row.estado || 'reservado',
      price: Number(row.price || 0),
      reason: row.reason || '',
      createdAt: row.created_at || row.createdAt || new Date().toISOString()
    }));
  }

  async function fetchSupabaseRows() {
    const base = (window.SUPABASE_REST_URL || '').replace(/\/$/, '');
    if (!base || !window.SUPABASE_HEADERS) return null;

    const url = `${base}/turnos?select=*`;
    const res = await fetch(url, {
      method: 'GET',
      headers: window.SUPABASE_HEADERS || {}
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Supabase: ${res.status} ${text}`);
    }

    const data = await res.json();
    return normalizeSupabaseRows(Array.isArray(data) ? data : []);
  }

  async function loadState() {
    try {
      const rows = await fetchSupabaseRows();
      if (rows !== null) {
        const nextState = {
          reservations: rows.filter((row) => row.status !== 'bloqueado' && row.status !== 'cancelado'),
          blocks: rows.filter((row) => row.status === 'bloqueado')
        };
        saveState(nextState);
        return nextState;
      }
    } catch (error) {
      console.warn('Fallo al traer datos de Supabase, usando copia local:', error);
    }

    return getStoredState();
  }

  function getState() {
    return getStoredState();
  }

  function getServiceInfo(serviceValue = serviceSelect?.value || 'corte') {
    return SERVICE_CATALOG[serviceValue] || SERVICE_CATALOG.corte;
  }

  function generateSlots(dateString) {
    if (!dateString) return [];

    const day = new Date(`${dateString}T00:00:00`).getDay();
    const slots = [];
    const addSlotRange = (initialMinutes, finalMinutes) => {
      for (let current = initialMinutes; current <= finalMinutes; current += 40) {
        const start = toHHMM(current);
        const end = toHHMM(current + 40);
        slots.push({ start, end });
      }
    };

    if (day === 0) {
      addSlotRange(9 * 60, 11 * 60);
    } else {
      addSlotRange(8 * 60 + 40, 11 * 60 + 20);
      addSlotRange(14 * 60, 19 * 60 + 20);
    }

    return slots;
  }

  function getBusyMap(dateString, state = getState()) {
    const map = new Map();

    state.reservations
      .filter((item) => item.date === dateString && item.status !== 'cancelado')
      .forEach((item) => map.set(item.start, { status: item.status || 'reservado', reason: item.name }));

    state.blocks
      .filter((item) => item.date === dateString)
      .forEach((item) => map.set(item.start, { status: 'bloqueado', reason: item.reason || 'Bloqueado' }));

    return map;
  }

  function renderQrCode(text) {
    if (!qrCodeImg) return;
    const encoded = encodeURIComponent(text);
    qrCodeImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encoded}`;
  }

  function updateSelectedDetails() {
    if (!servicePricePill || !selectedDateLabel || !selectedServiceLabel || !serviceSelect || !datePicker) return;

    const selectedService = getServiceInfo(serviceSelect.value);
    const selectedDate = datePicker.value || 'Sin fecha';

    servicePricePill.textContent = `${selectedService.name} • ${formatCurrency(selectedService.price)}`;
    selectedDateLabel.textContent = selectedDate !== 'Sin fecha' ? `Fecha: ${selectedDate}` : 'Selecciona una fecha';
    selectedServiceLabel.textContent = `Servicio: ${selectedService.name}`;

    if (shareLinkInput) {
      const link = new URL(window.location.origin + '/index.html');
      link.searchParams.set('service', serviceSelect.value);
      link.searchParams.set('date', datePicker.value || '');
      shareLinkInput.value = link.toString();
      renderQrCode(link.toString());
    }
  }

  async function renderTimeSlots() {
    if (!datePicker || !timeGrid || !serviceSelect) return;

    const selectedDate = datePicker.value;
    const state = await loadState();
    timeGrid.innerHTML = '';

    if (!selectedDate) {
      timeGrid.innerHTML = '<p class="empty-message">Selecciona una fecha para ver los horarios disponibles.</p>';
      updateSelectedDetails();
      return;
    }

    const today = getTodayISO();
    const currentTime = getCurrentTimeISO();
    const slots = generateSlots(selectedDate).filter((slot) => {
      if (selectedDate < today) return false;
      if (selectedDate > today) return true;
      return toMinutes(slot.start) > toMinutes(currentTime);
    });
    const busyMap = getBusyMap(selectedDate, state);

    slots.forEach((slot) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'time-btn';
      button.textContent = `${slot.start} - ${slot.end}`;
      button.dataset.start = slot.start;
      button.dataset.end = slot.end;

      const busyInfo = busyMap.get(slot.start);

      if (busyInfo) {
        button.disabled = true;
        button.classList.add(busyInfo.status === 'bloqueado' ? 'blocked' : 'booked');
        button.title = busyInfo.status === 'bloqueado' ? busyInfo.reason : `Reservado por ${busyInfo.reason}`;
      } else {
        button.addEventListener('click', () => openReservationModal(slot.start, slot.end));
      }

      timeGrid.appendChild(button);
    });

    if (!slots.length) {
      timeGrid.innerHTML = '<p class="empty-message">No hay horarios disponibles para este día.</p>';
    }

    updateSelectedDetails();
  }

  function openReservationModal(start, end) {
    if (!modal || !selectedInfo || !datePicker) return;

    selectedStart = start;
    selectedEnd = end;
    const service = getServiceInfo(serviceSelect.value);
    selectedInfo.textContent = `${start} - ${end} • ${service.name} • ${formatCurrency(service.price)} • ${datePicker.value}`;
    modal.classList.remove('hidden');
  }

  function closeReservationModal() {
    if (!modal) return;
    modal.classList.add('hidden');
    selectedStart = null;
    selectedEnd = null;
  }

  function renderBlockOptions() {
    if (!blockDate || !blockStart) return;

    const options = generateSlots(blockDate.value || getTodayISO());
    blockStart.innerHTML = '';

    if (!options.length) {
      const option = document.createElement('option');
      option.value = '';
      option.textContent = 'Sin horarios disponibles';
      blockStart.appendChild(option);
      return;
    }

    options.forEach((slot) => {
      const option = document.createElement('option');
      option.value = slot.start;
      option.textContent = `${slot.start} - ${slot.end}`;
      blockStart.appendChild(option);
    });
  }

  async function renderDashboard() {
    if (!todayBookingsEl || !dailyRevenueEl || !occupancyRateEl || !totalRevenueEl || !monthlyRevenueEl || !monthlyBookingsEl || !blockedSlotsEl || !avgServicePriceEl || !reservationsBody) {
      return;
    }

    const state = await loadState();
    const today = getTodayISO();
    const monthValue = reportMonthInput && reportMonthInput.value ? reportMonthInput.value : '';
    const dayValue = reportDayInput && reportDayInput.value ? reportDayInput.value : '';
    const filteredReservations = getFilteredReservations(state, monthValue, dayValue);
    const reservationsToday = state.reservations.filter((item) => item.date === today && item.status !== 'cancelado');
    const revenueToday = reservationsToday.reduce((sum, item) => sum + Number(item.price || 0), 0);
    const totalRevenue = filteredReservations.reduce((sum, item) => sum + Number(item.price || 0), 0);
    const monthlyRevenue = filteredReservations.reduce((sum, item) => sum + Number(item.price || 0), 0);
    const totalSlots = generateSlots(today).length;
    const occupancy = totalSlots > 0 ? Math.min(100, Math.round((reservationsToday.length / totalSlots) * 100)) : 0;
    const reservationCount = filteredReservations.length;
    const average = reservationCount ? Math.round(totalRevenue / reservationCount) : 0;

    todayBookingsEl.textContent = String(reservationsToday.length);
    dailyRevenueEl.textContent = formatCurrency(revenueToday);
    occupancyRateEl.textContent = `${occupancy}%`;
    totalRevenueEl.textContent = formatCurrency(totalRevenue);
    monthlyRevenueEl.textContent = formatCurrency(monthlyRevenue);
    monthlyBookingsEl.textContent = String(filteredReservations.length);
    blockedSlotsEl.textContent = String(state.blocks.length);
    avgServicePriceEl.textContent = formatCurrency(average);

    reservationsBody.innerHTML = '';
    const latest = [...filteredReservations]
      .sort((a, b) => new Date(`${b.date}T${b.start}`) - new Date(`${a.date}T${a.start}`))
      .slice(0, 12);

    if (!latest.length) {
      reservationsBody.innerHTML = '<tr><td colspan="7">No hay reservas registradas aún.</td></tr>';
      return;
    }

    latest.forEach((reservation) => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${reservation.name}</td>
        <td>${reservation.date}</td>
        <td>${reservation.start} - ${reservation.end}</td>
        <td>${getServiceInfo(reservation.service).name}</td>
        <td>${formatCurrency(reservation.price)}</td>
        <td><span class="status-badge ${reservation.status}">${reservation.status}</span></td>
        <td>
          <div class="table-actions">
            <button type="button" class="table-btn edit" data-id="${reservation.id}">Editar</button>
            <button type="button" class="table-btn delete" data-id="${reservation.id}">Eliminar</button>
          </div>
        </td>
      `;
      reservationsBody.appendChild(row);
    });

    document.querySelectorAll('.table-btn.edit').forEach((button) => {
      button.addEventListener('click', () => openEditModal(button.dataset.id));
    });

    document.querySelectorAll('.table-btn.delete').forEach((button) => {
      button.addEventListener('click', async () => {
        await deleteReservation(button.dataset.id);
      });
    });
  }

  async function saveReservationToSupabase(record) {
    const base = (window.SUPABASE_REST_URL || '').replace(/\/$/, '');
    if (!base || !window.SUPABASE_HEADERS) return null;

    try {
      const res = await fetch(`${base}/turnos`, {
        method: 'POST',
        headers: {
          ...window.SUPABASE_HEADERS,
          Prefer: 'return=representation'
        },
        body: JSON.stringify([record])
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text);
      }
      return true;
    } catch (error) {
      console.warn('Sincronización con Supabase falló, se guarda localmente:', error);
      return false;
    }
  }

  async function sendNotification(type, record) {
    try {
      const response = await fetch(`${NOTIFICATION_API_URL}/${type}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...record,
          serviceName: getServiceInfo(record.service).name
        })
      });
      if (!response.ok) throw new Error(`Notificaciones: ${response.status}`);
    } catch (error) {
      console.warn('La reserva se guardó, pero no se pudo enviar el correo:', error.message);
    }
  }

  function getCustomerProfile() {
    try {
      return JSON.parse(localStorage.getItem(CUSTOMER_PROFILE_KEY) || 'null');
    } catch (error) {
      return null;
    }
  }

  function saveCustomerProfile() {
    const profile = {
      name: nameInput?.value.trim() || '',
      phone: phoneInput?.value.trim() || '',
      email: emailInput?.value.trim() || ''
    };
    if (!profile.name || !profile.phone || !profile.email || !emailInput.checkValidity()) {
      alert('Completa nombre, teléfono y un correo válido.');
      return false;
    }
    localStorage.setItem(CUSTOMER_PROFILE_KEY, JSON.stringify(profile));
    saveCustomerProfileToSupabase(profile);
    if (profileStatus) profileStatus.textContent = 'Datos guardados';
    renderMyReservations();
    return true;
  }

  async function saveCustomerProfileToSupabase(profile) {
    const base = (window.SUPABASE_REST_URL || '').replace(/\/$/, '');
    if (!base || !window.SUPABASE_HEADERS) return;

    try {
      const response = await fetch(`${base}/clientes?on_conflict=email`, {
        method: 'POST',
        headers: {
          ...window.SUPABASE_HEADERS,
          Prefer: 'resolution=merge-duplicates,return=minimal'
        },
        body: JSON.stringify([profile])
      });
      if (!response.ok) throw new Error(`Supabase: ${response.status}`);
    } catch (error) {
      console.warn('No se pudo sincronizar el perfil con Supabase:', error.message);
    }
  }

  async function renderMyReservations() {
    if (!myReservationsEl) return;
    const profile = getCustomerProfile();
    if (!profile?.email) {
      myReservationsEl.innerHTML = '<p class="empty-message">Guarda tus datos para consultar tus reservas.</p>';
      return;
    }
    const state = await loadState();
    const reservations = state.reservations
      .filter((item) => item.email?.toLowerCase() === profile.email.toLowerCase() && item.status !== 'cancelado')
      .sort((a, b) => `${a.date}T${a.start}`.localeCompare(`${b.date}T${b.start}`));
    if (!reservations.length) {
      myReservationsEl.innerHTML = '<p class="empty-message">No tienes reservas registradas.</p>';
      return;
    }
    myReservationsEl.innerHTML = reservations.map((reservation) => `
      <article class="reservation-item">
        <div><strong>${reservation.date}</strong><span>${reservation.start} - ${reservation.end}</span></div>
        <div><span>${getServiceInfo(reservation.service).name}</span><button type="button" class="table-btn delete cancel-own-reservation" data-id="${reservation.id}">Cancelar</button></div>
      </article>
    `).join('');
    myReservationsEl.querySelectorAll('.cancel-own-reservation').forEach((button) => {
      button.addEventListener('click', () => deleteReservation(button.dataset.id, '¿Cancelar esta reserva?'));
    });
  }

  async function saveBlockToSupabase(record) {
    const base = (window.SUPABASE_REST_URL || '').replace(/\/$/, '');
    if (!base || !window.SUPABASE_HEADERS) return null;

    try {
      const res = await fetch(`${base}/turnos`, {
        method: 'POST',
        headers: {
          ...window.SUPABASE_HEADERS,
          Prefer: 'return=representation'
        },
        body: JSON.stringify([record])
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text);
      }
      return true;
    } catch (error) {
      console.warn('Bloqueo no sincronizado con Supabase, se guarda localmente:', error);
      return false;
    }
  }

  async function persistReservation() {
    if (!datePicker || !serviceSelect || !nameInput || !phoneInput || !emailInput) return;

    const state = await loadState();
    const service = getServiceInfo(serviceSelect.value);
    const record = {
      id: crypto.randomUUID(),
      date: datePicker.value,
      fecha: datePicker.value,
      start: selectedStart,
      end: selectedEnd,
      hora_inicio: selectedStart,
      name: nameInput.value.trim(),
      phone: phoneInput.value.trim(),
      email: emailInput.value.trim(),
      service: serviceSelect.value,
      servicio: serviceSelect.value,
      status: 'reservado',
      estado: 'reservado',
      price: service.price,
      precio: service.price,
      created_at: new Date().toISOString()
    };

    state.reservations.push(record);
    const synced = await saveReservationToSupabase(record);
    if (synced === false) {
      alert('No se pudo guardar la reserva en Supabase. Intenta nuevamente.');
      return false;
    }
    saveState(state);
    sendNotification('reservation', record);
    await renderDashboard();
    await renderTimeSlots();
    return true;
  }

  async function persistBlock() {
    if (!blockDate || !blockStart || !blockReason) return;

    const state = await loadState();
    const date = blockDate.value || getTodayISO();
    const start = blockStart.value;
    const reason = blockReason.value.trim() || 'Bloqueo administrativo';

    if (!start) {
      alert('Selecciona un horario para bloquear.');
      return;
    }

    const blockTime = generateSlots(date).find((slot) => slot.start === start);
    if (!blockTime) {
      alert('El horario seleccionado no es válido.');
      return;
    }

    const existing = state.blocks.some((item) => item.date === date && item.start === start && item.status === 'bloqueado');
    if (existing) {
      alert('Ese turno ya está bloqueado.');
      return;
    }

    const record = {
      id: crypto.randomUUID(),
      date,
      fecha: date,
      start,
      end: blockTime.end,
      hora_inicio: start,
      reason,
      servicio: 'bloqueo',
      status: 'bloqueado',
      estado: 'bloqueado',
      created_at: new Date().toISOString(),
      price: 0,
      precio: 0,
      name: 'Bloqueo administrativo',
      phone: ''
    };

    state.blocks.push(record);
    const synced = await saveBlockToSupabase(record);
    if (synced === false) {
      alert('No se pudo guardar el bloqueo en Supabase. Intenta nuevamente.');
      return;
    }
    saveState(state);
    await renderDashboard();
    await renderTimeSlots();
    renderBlockOptions();
    blockReason.value = '';
    alert('Horario bloqueado con éxito.');
  }

  function getFilteredReservations(state, monthValue = '', dayValue = '') {
    return state.reservations.filter((item) => {
      if (!item || item.status === 'cancelado') return false;
      if (monthValue && item.date && !item.date.startsWith(monthValue)) return false;
      if (dayValue && item.date !== dayValue) return false;
      return true;
    });
  }

  async function deleteReservation(id, confirmationMessage = '¿Eliminar esta reserva?') {
    if (!confirm(confirmationMessage)) return;
    
    const state = await loadState();
    const cancelledReservation = state.reservations.find((item) => item.id === id);
    const nextState = {
      reservations: state.reservations.filter((item) => item.id !== id),
      blocks: state.blocks.filter((item) => item.id !== id)
    };
    saveState(nextState);

    if (cancelledReservation?.email) {
      await sendNotification('cancellation', cancelledReservation);
    }

    const base = (window.SUPABASE_REST_URL || '').replace(/\/$/, '');
    if (base && window.SUPABASE_HEADERS) {
      try {
        await fetch(`${base}/turnos?id=eq.${encodeURIComponent(id)}`, {
          method: 'DELETE',
          headers: window.SUPABASE_HEADERS
        });
      } catch (error) {
        console.warn('No se pudo eliminar en Supabase:', error);
      }
    }

    renderDashboard();
    renderTimeSlots();
    renderMyReservations();
  }

  async function updateReservationInSupabase(id, payload) {
    const base = (window.SUPABASE_REST_URL || '').replace(/\/$/, '');
    if (!base || !window.SUPABASE_HEADERS) return;

    await fetch(`${base}/turnos?id=eq.${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: {
        ...window.SUPABASE_HEADERS,
        Prefer: 'return=representation'
      },
      body: JSON.stringify(payload)
    });
  }

  function closeEditModalDialog() {
    if (editModal) editModal.classList.add('hidden');
  }

  function populateEditTimes(dateValue, selectedTime = '') {
    if (!editStartTime) return;
    editStartTime.innerHTML = '';
    const slots = generateSlots(dateValue || getTodayISO());
    slots.forEach((slot) => {
      const option = document.createElement('option');
      option.value = slot.start;
      option.textContent = `${slot.start} - ${slot.end}`;
      if (slot.start === selectedTime) option.selected = true;
      editStartTime.appendChild(option);
    });
  }

  async function openEditModal(id) {
    const state = await loadState();
    const item = state.reservations.find((entry) => entry.id === id);
    if (!item || !editModal || !editCustomerName || !editCustomerPhone || !editDateInput || !editServiceSelect || !editStartTime || !editReservationIdInput) {
      return;
    }

    const serviceValue = item.service || 'corte';
    editReservationIdInput.value = item.id;
    editCustomerName.value = item.name || '';
    editCustomerPhone.value = item.phone || '';
    editDateInput.value = item.date || getTodayISO();
    editServiceSelect.value = serviceValue;
    populateEditTimes(item.date, item.start);
    editModal.classList.remove('hidden');
  }

  async function saveEditedReservation() {
    const id = editReservationIdInput.value;
    if (!id) return;

    const state = await loadState();
    const itemIndex = state.reservations.findIndex((entry) => entry.id === id);
    if (itemIndex === -1) {
      closeEditModalDialog();
      return;
    }

    const nextDate = editDateInput.value;
    const nextStart = editStartTime.value;
    const nextService = editServiceSelect.value;
    const nextData = {
      ...state.reservations[itemIndex],
      name: editCustomerName.value.trim(),
      phone: editCustomerPhone.value.trim(),
      date: nextDate,
      start: nextStart,
      end: toHHMM(toMinutes(nextStart) + 40),
      service: nextService,
      price: SERVICE_CATALOG[nextService].price
    };

    state.reservations[itemIndex] = nextData;
    saveState(state);

    try {
      await updateReservationInSupabase(id, {
        name: nextData.name,
        phone: nextData.phone,
        date: nextData.date,
        start: nextData.start,
        end: nextData.end,
        service: nextData.service,
        price: nextData.price
      });
    } catch (error) {
      console.warn('No se pudo actualizar en Supabase:', error);
    }

    closeEditModalDialog();
    alert('Reserva actualizada.');
    renderDashboard();
    renderTimeSlots();
  }

  function initCustomerPage() {
    if (!datePicker || !serviceSelect || !timeGrid) return;

    const todayISO = getTodayISO();
    const profile = getCustomerProfile();
    if (profile) {
      nameInput.value = profile.name || '';
      phoneInput.value = profile.phone || '';
      emailInput.value = profile.email || '';
      if (profileStatus) profileStatus.textContent = 'Datos guardados';
    }
    datePicker.min = todayISO;

    const params = new URLSearchParams(window.location.search);
    const initialDate = params.get('date');
    if (initialDate && initialDate >= todayISO) {
      datePicker.value = initialDate;
    }
    if (params.get('service')) serviceSelect.value = params.get('service');
    if (!datePicker.value) datePicker.value = todayISO;

    datePicker.addEventListener('change', () => {
      if (datePicker.value < todayISO) {
        datePicker.value = todayISO;
      }
      renderTimeSlots();
    });
    serviceSelect.addEventListener('change', renderTimeSlots);
    saveProfileBtn?.addEventListener('click', saveCustomerProfile);
    closeModal?.addEventListener('click', closeReservationModal);

    confirmBtn?.addEventListener('click', async () => {
      const name = nameInput.value.trim();
      const phone = phoneInput.value.trim();
      const email = emailInput?.value.trim() || '';
      if (!name || !phone || !email) {
        alert('Por favor, completa nombre, teléfono y correo electrónico.');
        return;
      }
      if (!emailInput.checkValidity()) {
        alert('Ingresa un correo electrónico válido.');
        emailInput.focus();
        return;
      }
      if (!saveCustomerProfile()) return;
      if (!selectedStart || !selectedEnd) {
        alert('Primero selecciona un horario disponible.');
        return;
      }
      if (!datePicker.value || datePicker.value < todayISO) {
        alert('Selecciona una fecha desde hoy en adelante.');
        return;
      }

      const state = await loadState();
      const isBusy = state.reservations.some(
        (item) => item.date === datePicker.value && item.start === selectedStart && item.status !== 'cancelado'
      ) || state.blocks.some((item) => item.date === datePicker.value && item.start === selectedStart);

      if (isBusy) {
        alert('Ese horario ya no está disponible.');
        await renderTimeSlots();
        closeReservationModal();
        return;
      }

      const saved = await persistReservation();
      if (!saved) return;
      closeReservationModal();
      alert('Reserva confirmada correctamente.');
    });

    renderTimeSlots();
    renderMyReservations();
    updateSelectedDetails();
  }

  function initAdminPage() {
    if (!adminLoginPanel || !adminContent || !adminLoginForm || !adminPasswordInput || !adminLogoutBtn) return;

    if (reportMonthInput) reportMonthInput.value = '';
    if (reportDayInput) reportDayInput.value = '';
    if (blockDate) blockDate.value = getTodayISO();
    if (blockDate) blockDate.addEventListener('change', renderBlockOptions);
    if (blockBtn) blockBtn.addEventListener('click', persistBlock);
    if (reportMonthInput) reportMonthInput.addEventListener('change', renderDashboard);
    if (reportDayInput) reportDayInput.addEventListener('change', renderDashboard);
    if (closeEditModal) closeEditModal.addEventListener('click', closeEditModalDialog);
    if (saveEditionBtn) saveEditionBtn.addEventListener('click', saveEditedReservation);
    if (clearFiltersBtn) {
      clearFiltersBtn.addEventListener('click', () => {
        if (reportMonthInput) reportMonthInput.value = '';
        if (reportDayInput) reportDayInput.value = '';
        renderDashboard();
      });
    }
    if (editDateInput) {
      editDateInput.addEventListener('change', () => populateEditTimes(editDateInput.value, editStartTime.value));
    }
    if (editServiceSelect) {
      editServiceSelect.addEventListener('change', () => {
        if (editDateInput && editStartTime) {
          populateEditTimes(editDateInput.value, editStartTime.value);
        }
      });
    }

    adminLoginForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const enteredPassword = adminPasswordInput.value.trim();
      if (enteredPassword === ADMIN_PASSWORD) {
        setAdminSession(true);
        adminLoginPanel.classList.add('hidden');
        adminContent.classList.remove('hidden');
        adminLogoutBtn.classList.remove('hidden');
        renderBlockOptions();
        await renderDashboard();
        adminPasswordInput.value = '';
        return;
      }

      alert('Contraseña incorrecta.');
      adminPasswordInput.value = '';
      adminPasswordInput.focus();
    });

    adminLogoutBtn.addEventListener('click', () => {
      setAdminSession(false);
      adminContent.classList.add('hidden');
      adminLoginPanel.classList.remove('hidden');
      adminLogoutBtn.classList.add('hidden');
      adminPasswordInput.value = '';
    });

    if (isAdminLoggedIn()) {
      adminLoginPanel.classList.add('hidden');
      adminContent.classList.remove('hidden');
      adminLogoutBtn.classList.remove('hidden');
      renderBlockOptions();
      renderDashboard();
      return;
    }

    adminLoginPanel.classList.remove('hidden');
    adminContent.classList.add('hidden');
    adminLogoutBtn.classList.add('hidden');
  }

  seedDemoData();

  if (page === 'admin') {
    initAdminPage();
  } else {
    initCustomerPage();
  }
});

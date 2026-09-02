require('dotenv').config();

const path = require('path');
const express = require('express');
const nodemailer = require('nodemailer');
const cron = require('node-cron');

const app = express();
const port = Number(process.env.PORT || 8000);
const sentReminders = new Set();

app.use(express.json());
app.use(express.static(__dirname));

function getTransporter() {
  if (!process.env.MAIL_USER || !process.env.MAIL_PASSWORD) {
    throw new Error('Falta configurar MAIL_USER y MAIL_PASSWORD en .env');
  }

  return nodemailer.createTransport({
    host: process.env.MAIL_HOST || 'smtp.gmail.com',
    port: Number(process.env.MAIL_PORT || 465),
    secure: process.env.MAIL_SECURE !== 'false',
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASSWORD
    }
  });
}

function formatReservation(data) {
  return `${data.date} a las ${data.start} - ${data.end}`;
}

async function sendNotification({ to, subject, text }) {
  if (!to) return;
  await getTransporter().sendMail({
    from: process.env.MAIL_FROM || process.env.MAIL_USER,
    to,
    subject,
    text
  });
}

app.post('/api/notifications/reservation', async (req, res) => {
  const data = req.body || {};
  if (!data.email || !data.date || !data.start || !data.name) {
    return res.status(400).json({ error: 'Faltan datos de la reserva.' });
  }

  try {
    const location = formatReservation(data);
    await Promise.all([
      sendNotification({
        to: data.email,
        subject: 'Reserva confirmada | King Barber Estudio',
        text: `Hola ${data.name},\n\nTu reserva quedó confirmada para el ${location}.\nServicio: ${data.serviceName || 'Servicio de barbería'}\n\nKing Barber Estudio`
      }),
      sendNotification({
        to: process.env.ADMIN_EMAIL,
        subject: 'Nueva reserva | King Barber Estudio',
        text: `Nueva reserva de ${data.name}.\nCorreo: ${data.email}\nFecha y hora: ${location}\nServicio: ${data.serviceName || 'Servicio de barbería'}`
      })
    ]);
    res.status(204).end();
  } catch (error) {
    console.error('No se pudo enviar la confirmación:', error.message);
    res.status(503).json({ error: 'La reserva se guardó, pero el correo no pudo enviarse.' });
  }
});

app.post('/api/notifications/cancellation', async (req, res) => {
  const data = req.body || {};
  if (!data.email || !data.date || !data.start || !data.name) {
    return res.status(400).json({ error: 'Faltan datos de la cancelación.' });
  }

  try {
    await sendNotification({
      to: data.email,
      subject: 'Reserva cancelada | King Barber Estudio',
      text: `Hola ${data.name},\n\nTu reserva del ${formatReservation(data)} fue cancelada.\n\nKing Barber Estudio`
    });
    res.status(204).end();
  } catch (error) {
    console.error('No se pudo enviar la cancelación:', error.message);
    res.status(503).json({ error: 'La cancelación se realizó, pero el correo no pudo enviarse.' });
  }
});

async function sendDueReminders() {
  const base = (process.env.SUPABASE_REST_URL || '').replace(/\/$/, '');
  if (!base || !process.env.SUPABASE_KEY) return;

  const now = new Date();
  const from = new Date(now.getTime() + 59 * 60 * 1000).toISOString();
  const until = new Date(now.getTime() + 61 * 60 * 1000).toISOString();
  const response = await fetch(`${base}/turnos?select=*&status=eq.reservado&email=not.is.null` , {
    headers: { apikey: process.env.SUPABASE_KEY, Authorization: `Bearer ${process.env.SUPABASE_KEY}` }
  });
  if (!response.ok) throw new Error(`Supabase respondió ${response.status}`);

  const rows = await response.json();
  for (const reservation of rows) {
    const appointment = new Date(`${reservation.date}T${reservation.start}:00`);
    const key = String(reservation.id);
    if (appointment < new Date(from) || appointment > new Date(until) || sentReminders.has(key)) continue;

    await sendNotification({
      to: reservation.email,
      subject: 'Recordatorio de reserva | King Barber Estudio',
      text: `Hola ${reservation.name || 'cliente'},\n\nTe recordamos tu reserva para dentro de una hora: ${formatReservation(reservation)}.\n\nKing Barber Estudio`
    });
    sentReminders.add(key);
  }
}

cron.schedule('* * * * *', () => sendDueReminders().catch((error) => console.error('Recordatorio fallido:', error.message)));

app.listen(port, '0.0.0.0', () => {
  console.log(`King Barber Estudio disponible en http://localhost:${port}`);
});

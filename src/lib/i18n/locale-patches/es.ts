import type { Dictionary } from "../dictionaries/en";

/** Spanish overrides for demo seed copy and home widgets still mirroring English. */
export const esLocalePatch: Partial<Dictionary> = {
  "home.checkInsOuts": "Entradas y salidas",
  "home.noMoves": "No hay movimientos este día.",
  "home.due": "vence {date}",
  "home.weekVolumeClosed": "del volumen de tareas semanal completado",
  "home.closedLabel": "completadas",
  "home.openedLabel": "abiertas",
  "home.chartOpened": "Abiertas",
  "home.chartClosed": "Completadas",

  "demo.readOnlyBanner":
    "Solo demo. Explora libremente. Regístrate para una cuenta real.",
  "demo.jobTitle.owner": "Propietario",
  "demo.jobTitle.manager": "Gerente en sitio",
  "demo.jobTitle.cleaner": "Responsable de limpieza",

  "demo.villa.lotus.desc":
    "Apartamento de 2 habitaciones con vistas al mar y piscina privada cerca de Srithanu.",
  "demo.villa.lotus.notes": "Los huéspedes solicitaron toallas extra.",
  "demo.villa.palm.desc": "Villa familiar cerca de la playa Haad Yao.",
  "demo.villa.palm.notes": "Limpieza profunda antes del check-in de mañana.",
  "demo.villa.jungle.desc":
    "Retiro tranquilo en la colina – unidad de AC pendiente de reparación.",
  "demo.villa.jungle.notes": "Reemplazo del compresor de AC programado.",
  "demo.villa.sunset.desc": "Villa con terraza orientada al atardecer.",
  "demo.villa.sunset.notes": "Check-out mañana 11:00.",
  "demo.villa.cliff.desc": "Estudio compacto para reservas de clientes externos.",
  "demo.villa.cliff.notes": "Cliente externo – no es inventario de la empresa.",

  "demo.contact.nokNotes":
    "Preferido para cambios de huésped · en PulseFlow",
  "demo.contact.somchaiNotes": "Emergencia 24h",
  "demo.contact.poolNotes": "Semanalmente los miércoles",
  "demo.contact.coolairNotes":
    "Repuestos en Thong Sala · aún no en PulseFlow",
  "demo.contact.roleAc": "Reparación de AC/aparatos",

  "demo.task.palmDeepClean": "Finalizar limpieza profunda de Palm Villa",
  "demo.task.meetAc": "Reunirse con técnico de AC en Jungle Retreat",
  "demo.task.sunsetCheckout":
    "Preparar lista de check-out para Sunset Deck",
  "demo.task.lotusTowels": "Entregar toallas extra a Lotus House",
  "demo.task.coralRestock": "Reponer amenities en Coral Bungalow",
  "demo.task.poolChemicals": "Comprar productos químicos para piscina en Thong Sala",
  "demo.task.bambooPump": "Inspeccionar bomba de agua de Bamboo Nest",
  "demo.task.lotusTurnover": "Limpieza de cambio – Lotus House",
  "demo.task.sunsetClean": "Limpieza de check-out – Sunset Deck",

  "demo.order.turnoverCleaning": "Limpieza de cambio",
  "demo.order.turnoverDetails":
    "Cambio completo después del check-out. Toallas extra en el lavadero.",
  "demo.order.deepClean": "Limpieza profunda",
  "demo.order.acRepair": "Visita de reparación de AC",
  "demo.order.acRepairDetails":
    "Depósito del compresor ya pagado. Llevar manómetros.",

  "demo.bill.cleaningSupplies": "Suministros de limpieza para cambio",
  "demo.bill.acDeposit": "Depósito de compresor de AC",
  "demo.bill.fuel": "Combustible para viajes en la isla",

  "demo.notif.newJobTurnover": "Nuevo trabajo: Limpieza de cambio",
  "demo.notif.newJobTurnoverBody":
    "Lotus House · mañana 11:00–14:00 – toca Leído y aceptado",
  "demo.notif.jobConfirmedDeep": "Trabajo confirmado: Limpieza profunda",
  "demo.notif.jobConfirmedDeepBody": "Palm Villa · hoy 09:00–12:00",
  "demo.notif.newMessageAlex": "Nuevo mensaje de Alex",
  "demo.notif.newMessageAlexBody":
    "¿Alguien puede confirmar las toallas de Palm Villa?",
  "demo.notif.billSubmitted": "Factura enviada",
  "demo.notif.billSubmittedBody":
    "Suministros de limpieza para cambio · ฿1.250",

  "demo.msg.morningPalm":
    "Buenos días – Palm Villa debe estar lista para huéspedes antes del mediodía de mañana.",
  "demo.msg.onIt":
    "En marcha. El equipo de limpieza ya está allí. Avisaré cuando terminen.",
  "demo.msg.acConfirmed":
    "Técnico de AC confirmado para Jungle Retreat a las 14:00.",
  "demo.msg.orderAgreed":
    "📋 Orden de servicio para Nok Cleaning\nQué: Limpieza profunda\nDónde: Palm Villa\nCuándo: hoy 09:00–12:00\nDetalles: Limpieza profunda antes del check-in de mañana.\nDe: Alex Owner\n\nEquipo: abrir y tocar «Leído y aceptado» para confirmar que recibiste el trabajo.",
  "demo.msg.orderPending":
    "📋 Orden de servicio para Nok Cleaning\nQué: Limpieza de cambio\nDónde: Lotus House\nCuándo: mañana 11:00–14:00\nDetalles: Cambio completo después del check-out. Toallas extra en el lavadero.\nDe: Alex Owner\n\nEquipo: abrir y tocar «Leído y aceptado» para confirmar que recibiste el trabajo.",

  "demo.endorse.turnovers": "Cambios gestionados sin problemas.",
  "demo.endorse.guestComm": "Excelente comunicación con huéspedes.",
  "demo.endorse.spotless": "Palm Villa impecable.",
  "demo.endorse.reliable": "Confiable en todas las propiedades.",

  "demo.day.today": "hoy",
  "demo.day.tomorrow": "mañana",
  "demo.day.yesterday": "ayer",
  "demo.day.daysAgo": "hace {count} días",

  "demo.sys.appointmentTitle": "Cita {when}",
  "demo.sys.appointmentBody": "{service} · {location} · {window}",
  "demo.sys.checkInTitle": "Check-in {when}",
  "demo.sys.checkOutTitle": "Check-out {when}",
  "demo.sys.villaDateBody": "{name} · {date}",
  "demo.sys.billDueTitle": "Factura {when}",
  "demo.sys.billOverdue":
    "vencida hace {count} día|vencida hace {count} días",
  "demo.sys.billDueToday": "vence hoy",
  "demo.sys.billDueWhen": "vence {when}",
  "demo.sys.billDueBody": "{description} · {amount}",
  "demo.sys.newJobTitle": "Nuevo trabajo: {serviceType}",
  "demo.sys.newJobBody":
    "{location} · {when} – toca Leído y aceptado",
  "demo.sys.jobConfirmedTitle": "Trabajo confirmado: {serviceType}",
  "demo.sys.completedJobTitle": "{name} completó un trabajo",
  "demo.sys.agreedTitle": "{name} aceptó",
  "demo.sys.jobBody": "{service} · {location} · {when}",
  "demo.sys.jobBodyShort": "{service} · {when}",
  "demo.sys.doneMsg": "✅ Hecho – {service} en {location} ({when})",
  "demo.sys.agreedMsg":
    "✅ Leído y aceptado – {service} en {location} ({when})",
  "demo.sys.locationFallback": "ubicación",
  "demo.sys.villaFallback": "Villa",

  "demo.orderChat.header": "📋 Orden de servicio para {name}",
  "demo.orderChat.what": "Qué: {serviceType}",
  "demo.orderChat.where": "Dónde: {location}",
  "demo.orderChat.when": "Cuándo: {when}",
  "demo.orderChat.details": "Detalles: {details}",
  "demo.orderChat.from": "De: {name}",
  "demo.orderChat.staffHint":
    "Equipo: abrir y tocar «Leído y aceptado» para confirmar que recibiste el trabajo.",

  "demo.guest.ownerNotices":
    "¡Bienvenido! El calentador de la piscina está encendido desde las 16:00. Check-out 11:00 – deja las llaves en la encimera de la cocina.",
  "demo.guest.briefing.keysTitle": "Puerta y llaves",
  "demo.guest.briefing.keysBody":
    "El código de la puerta lateral es 4821#. Deja las llaves en la encimera de la cocina al hacer check-out.",
  "demo.guest.briefing.helpTitle": "Cómo contactarnos",
  "demo.guest.briefing.helpBody":
    "Usa Soporte en esta app para urgencias. Respondemos solo como equipo del anfitrión.",
  "demo.guest.support.poolQuestion":
    "Hola – ¿el calentador de la piscina ya está encendido esta noche?",
  "demo.guest.support.poolReply":
    "Sí, se enciende cada día a las 16:00. ¡Disfruta del atardecer!",
  "demo.guest.guide.bins":
    "Contenedor azul junto a la puerta lateral. Recogida mar / vie por la mañana.",
  "demo.guest.guide.checkout":
    "Cierra todas las ventanas\nApaga el aire acondicionado y las luces\nDeja las llaves en la encimera de la cocina\nCierra la puerta lateral",
  "demo.guest.guide.extra":
    "Toallas de playa en el armario izquierdo. Agua extra bajo el fregadero.",
  "demo.guest.depositNote": "Depósito retenido en el check-in.",
  "demo.guest.chargeGlass": "Copa de vino rota (reemplazo)",
};

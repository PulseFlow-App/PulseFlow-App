import type { Dictionary } from "../dictionaries/en";

/** German overrides for demo seed copy and home widgets still mirroring English. */
export const deLocalePatch: Partial<Dictionary> = {
  "brand.name": "Pulse Flow",
  "nav.guests": "Gäste",
  "nav.menu": "Menü",
  "nav.dateRequests": "Datumsanfragen",
  "nav.reports": "Berichte & Übergaben",
  "nav.talent": "Personal suchen",
  "nav.invites": "Einladungen",
  "nav.company": "Firma",
  "home.checkInsOuts": "Ein- & Auschecken",
  "home.noMoves": "Keine Bewegungen an diesem Tag.",
  "home.due": "fällig {date}",
  "home.weekVolumeClosed": "des wöchentlichen Aufgabenvolumens erledigt",
  "home.closedLabel": "erledigt",
  "home.openedLabel": "eröffnet",
  "home.chartOpened": "Eröffnet",
  "home.chartClosed": "Erledigt",

  "demo.readOnlyBanner":
    "Nur Demo. Erkunden Sie frei. Registrieren Sie sich für ein echtes Konto.",
  "demo.jobTitle.owner": "Eigentümer",
  "demo.jobTitle.manager": "Vor-Ort-Manager",
  "demo.jobTitle.cleaner": "Reinigungsleitung",

  "demo.villa.lotus.desc":
    "Meerblick-2-Zimmer-Wohnung mit privatem Pool bei Srithanu.",
  "demo.villa.lotus.notes": "Gäste haben extra Handtücher angefordert.",
  "demo.villa.palm.desc": "Familienvilla nahe dem Haad-Yao-Strand.",
  "demo.villa.palm.notes": "Grundreinigung vor dem morgigen Check-in.",
  "demo.villa.jungle.desc":
    "Ruhiger Hügelretreat – Klimaanlage reparaturbedürftig.",
  "demo.villa.jungle.notes": "Austausch des AC-Kompressors geplant.",
  "demo.villa.sunset.desc": "Villa mit Sonnenuntergangs-Terrasse.",
  "demo.villa.sunset.notes": "Check-out morgen 11:00.",
  "demo.villa.cliff.desc": "Kompaktes Studio für Nebenkunden-Buchungen.",
  "demo.villa.cliff.notes": "Nebenkunde – kein Firmenbestand.",

  "demo.contact.nokNotes":
    "Bevorzugt für Wechselreinigungen · auf PulseFlow",
  "demo.contact.somchaiNotes": "24h Notfall",
  "demo.contact.poolNotes": "Wöchentlich mittwochs",
  "demo.contact.coolairNotes":
    "Ersatzteile in Thong Sala · noch nicht auf PulseFlow",
  "demo.contact.roleAc": "Klima-/Gerätereparatur",

  "demo.task.palmDeepClean": "Grundreinigung Palm Villa abschließen",
  "demo.task.meetAc": "AC-Techniker im Jungle Retreat treffen",
  "demo.task.sunsetCheckout":
    "Check-out-Checkliste für Sunset Deck vorbereiten",
  "demo.task.lotusTowels": "Extra Handtücher zur Lotus House liefern",
  "demo.task.coralRestock": "Ausstattung Coral Bungalow auffüllen",
  "demo.task.poolChemicals": "Poolchemikalien in Thong Sala kaufen",
  "demo.task.bambooPump": "Wasserpumpe Bamboo Nest prüfen",
  "demo.task.lotusTurnover": "Wechselreinigung – Lotus House",
  "demo.task.sunsetClean": "Check-out-Reinigung – Sunset Deck",

  "demo.order.turnoverCleaning": "Wechselreinigung",
  "demo.order.turnoverDetails":
    "Komplette Wechselreinigung nach Check-out. Extra Handtücher im Waschraum.",
  "demo.order.deepClean": "Grundreinigung",
  "demo.order.acRepair": "AC-Reparaturbesuch",
  "demo.order.acRepairDetails":
    "Kompressor-Anzahlung bereits bezahlt. Manometer mitbringen.",

  "demo.bill.cleaningSupplies": "Reinigungsmittel für Wechselreinigung",
  "demo.bill.acDeposit": "AC-Kompressor-Anzahlung",
  "demo.bill.fuel": "Treibstoff für Inselfahrten",

  "demo.notif.newJobTurnover": "Neuer Job: Wechselreinigung",
  "demo.notif.newJobTurnoverBody":
    "Lotus House · morgen 11:00–14:00 – auf Gelesen & zugestimmt tippen",
  "demo.notif.jobConfirmedDeep": "Job bestätigt: Grundreinigung",
  "demo.notif.jobConfirmedDeepBody": "Palm Villa · heute 09:00–12:00",
  "demo.notif.newMessageAlex": "Neue Nachricht von Alex",
  "demo.notif.newMessageAlexBody":
    "Kann jemand die Handtücher in Palm Villa bestätigen?",
  "demo.notif.billSubmitted": "Rechnung eingereicht",
  "demo.notif.billSubmittedBody":
    "Reinigungsmittel für Wechselreinigung · ฿1.250",

  "demo.msg.morningPalm":
    "Morgen – Palm Villa muss bis morgen Mittag gastbereit sein.",
  "demo.msg.onIt":
    "Erledigt. Das Reinigungsteam ist schon vor Ort. Melde mich, wenn fertig.",
  "demo.msg.acConfirmed":
    "AC-Techniker für Jungle Retreat um 14:00 bestätigt.",
  "demo.msg.orderAgreed":
    "📋 Serviceauftrag für Nok Cleaning\nWas: Grundreinigung\nWo: Palm Villa\nWann: heute 09:00–12:00\nDetails: Grundreinigung vor dem morgigen Check-in.\nVon: Alex Owner\n\nTeam: öffnen und auf „Gelesen & zugestimmt“ tippen, um den Auftrag zu bestätigen.",
  "demo.msg.orderPending":
    "📋 Serviceauftrag für Nok Cleaning\nWas: Wechselreinigung\nWo: Lotus House\nWann: morgen 11:00–14:00\nDetails: Komplette Wechselreinigung nach Check-out. Extra Handtücher im Waschraum.\nVon: Alex Owner\n\nTeam: öffnen und auf „Gelesen & zugestimmt“ tippen, um den Auftrag zu bestätigen.",

  "demo.endorse.turnovers": "Wechselreinigungen reibungslos erledigt.",
  "demo.endorse.guestComm": "Hervorragende Gästekommunikation.",
  "demo.endorse.spotless": "Makellos saubere Palm Villa.",
  "demo.endorse.reliable": "Zuverlässig über alle Objekte hinweg.",

  "demo.day.today": "heute",
  "demo.day.tomorrow": "morgen",
  "demo.day.yesterday": "gestern",
  "demo.day.daysAgo": "vor {count} Tagen",

  "demo.sys.appointmentTitle": "Termin {when}",
  "demo.sys.appointmentBody": "{service} · {location} · {window}",
  "demo.sys.checkInTitle": "Check-in {when}",
  "demo.sys.checkOutTitle": "Check-out {when}",
  "demo.sys.villaDateBody": "{name} · {date}",
  "demo.sys.billDueTitle": "Rechnung {when}",
  "demo.sys.billOverdue":
    "überfällig seit {count} Tag|überfällig seit {count} Tagen",
  "demo.sys.billDueToday": "heute fällig",
  "demo.sys.billDueWhen": "fällig {when}",
  "demo.sys.billDueBody": "{description} · {amount}",
  "demo.sys.newJobTitle": "Neuer Job: {serviceType}",
  "demo.sys.newJobBody":
    "{location} · {when} – auf Gelesen & zugestimmt tippen",
  "demo.sys.jobConfirmedTitle": "Job bestätigt: {serviceType}",
  "demo.sys.completedJobTitle": "{name} hat einen Job abgeschlossen",
  "demo.sys.agreedTitle": "{name} zugestimmt",
  "demo.sys.jobBody": "{service} · {location} · {when}",
  "demo.sys.jobBodyShort": "{service} · {when}",
  "demo.sys.doneMsg": "✅ Erledigt – {service} bei {location} ({when})",
  "demo.sys.agreedMsg":
    "✅ Gelesen & zugestimmt – {service} bei {location} ({when})",
  "demo.sys.locationFallback": "Ort",
  "demo.sys.villaFallback": "Villa",

  "demo.orderChat.header": "📋 Serviceauftrag für {name}",
  "demo.orderChat.what": "Was: {serviceType}",
  "demo.orderChat.where": "Wo: {location}",
  "demo.orderChat.when": "Wann: {when}",
  "demo.orderChat.details": "Details: {details}",
  "demo.orderChat.from": "Von: {name}",
  "demo.orderChat.staffHint":
    "Team: öffnen und auf „Gelesen & zugestimmt“ tippen, um den Auftrag zu bestätigen.",

  "demo.guest.ownerNotices":
    "Willkommen! Poolheizung ist ab 16:00 an. Check-out 11:00 – Schlüssel auf die Küchentheke legen.",
  "demo.guest.briefing.keysTitle": "Tor & Schlüssel",
  "demo.guest.briefing.keysBody":
    "Seitentor-Code ist 4821#. Schlüssel bei Check-out auf die Küchentheke legen.",
  "demo.guest.briefing.helpTitle": "So erreichen Sie uns",
  "demo.guest.briefing.helpBody":
    "Nutzen Sie Support in dieser App bei Dringendem. Wir antworten nur als Host-Team.",
  "demo.guest.support.poolQuestion":
    "Hallo – ist die Poolheizung heute Abend schon an?",
  "demo.guest.support.poolReply":
    "Ja, sie schaltet sich täglich um 16:00 ein. Genießen Sie den Sonnenuntergang!",
  "demo.guest.guide.bins":
    "Blaue Tonne am Seitentor. Abholung Di / Fr morgens.",
  "demo.guest.guide.checkout":
    "Alle Fenster schließen\nKlimaanlage und Lichter ausschalten\nSchlüssel auf Küchentheke legen\nSeitentor abschließen",
  "demo.guest.guide.extra":
    "Strandtücher im linken Schrank. Extra Wasser unter der Spüle.",
  "demo.guest.depositNote": "Kaution bei Check-in hinterlegt.",
  "demo.guest.chargeGlass": "Zerbrochenes Weinglas (Ersatz)",

  "common.optional": "optional",
  "common.details": "Einzelheiten",
  "villas.status": "Status",
  "tasks.priority.normal": "Normal",
  "bills.category.pool": "Pool",
  "notifications.kind.team_joined": "Team",
  "settings.team": "Team",
  "billing.status": "Status",
  "billing.trial": "Testphase",
  "plan.basic": "Basic",
  "guest.host": "Gastgeber",
  "dateRequests.unknownVilla": "Villa",
  "reports.property": "Objekt",
  "reports.snapshotLabel": "Bezeichnung (optional)",
  "talent.skill.ac": "Klima / HLK",
};

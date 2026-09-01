import type { Dictionary } from "../dictionaries/en";

/** French demo gaps not filled in the main dictionary. */
export const frLocalePatch: Partial<Dictionary> = {
  "home.due": "échéance {date}",
  "home.checkInsOuts": "Arrivées et départs",
  "home.noMoves": "Aucun mouvement ce jour-là.",
  "home.weekVolumeClosed": "du volume de tâches hebdomadaire clôturé",
  "home.closedLabel": "clôturées",
  "home.openedLabel": "ouvertes",
  "home.chartOpened": "Ouvertes",
  "home.chartClosed": "Clôturées",

  "demo.sys.appointmentBody": "{service} · {location} · {window}",
  "demo.sys.villaDateBody": "{name} · {date}",
  "demo.sys.billDueBody": "{description} · {amount}",
  "demo.sys.newJobBody": "{location} · {when} - appuyez sur Lu et accepté",
  "demo.sys.jobConfirmedTitle": "Mission confirmée : {serviceType}",
  "demo.sys.completedJobTitle": "{name} a terminé une mission",
  "demo.sys.agreedTitle": "{name} a accepté",
  "demo.sys.jobBody": "{service} · {location} · {when}",
  "demo.sys.jobBodyShort": "{service} · {when}",
  "demo.sys.doneMsg": "✅ Terminé - {service} à {location} ({when})",
  "demo.sys.agreedMsg":
    "✅ Lu et accepté - {service} à {location} ({when})",
  "demo.sys.locationFallback": "lieu",
  "demo.sys.villaFallback": "Villa",

  "demo.guest.ownerNotices":
    "Bienvenue ! Le chauffage de la piscine est allumé à partir de 16h. Départ à 11h - laissez les clés sur le comptoir de la cuisine.",
  "demo.guest.briefing.keysTitle": "Portail et clés",
  "demo.guest.briefing.keysBody":
    "Code du portail latéral : 4821#. Laissez les clés sur le comptoir à votre départ.",
  "demo.guest.briefing.helpTitle": "Comment nous joindre",
  "demo.guest.briefing.helpBody":
    "Utilisez Assistance dans cette app pour l'urgent. Nous répondons en tant qu'équipe hôte uniquement.",
  "demo.guest.support.poolQuestion":
    "Bonjour - le chauffage de la piscine est-il déjà allumé ce soir ?",
  "demo.guest.support.poolReply":
    "Oui, il s'allume chaque jour à 16h. Profitez du coucher de soleil !",
  "demo.guest.guide.bins":
    "Poubelle bleue à côté du portail. Collecte mar / ven matin.",
  "demo.guest.guide.checkout":
    "Fermez toutes les fenêtres\nÉteignez la clim et les lumières\nLaissez les clés sur le comptoir\nVerrouillez le portail latéral",
  "demo.guest.guide.extra":
    "Serviettes de plage dans le placard de gauche. Eau supplémentaire sous l'évier.",
  "demo.guest.depositNote": "Caution enregistrée à l'arrivée.",
  "demo.guest.chargeGlass": "Verre à vin cassé (remplacement)",
};

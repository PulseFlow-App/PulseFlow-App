import type { Dictionary } from "../dictionaries/en";

/** Russian demo gaps (guest seed + template strings). */
export const ruLocalePatch: Partial<Dictionary> = {
  "home.due": "срок {date}",
  "home.checkInsOuts": "Заезды и выезды",
  "home.noMoves": "В этот день перемещений нет.",
  "home.weekVolumeClosed": "недельного объёма задач закрыто",
  "home.closedLabel": "закрыто",
  "home.openedLabel": "открыто",
  "home.chartOpened": "Открыто",
  "home.chartClosed": "Закрыто",

  "demo.sys.appointmentBody": "{service} · {location} · {window}",
  "demo.sys.villaDateBody": "{name} · {date}",
  "demo.sys.billDueBody": "{description} · {amount}",
  "demo.sys.jobBody": "{service} · {location} · {when}",
  "demo.sys.jobBodyShort": "{service} · {when}",

  "demo.guest.ownerNotices":
    "Добро пожаловать! Обогрев бассейна с 16:00. Выезд в 11:00 - оставьте ключи на кухонной стойке.",
  "demo.guest.briefing.keysTitle": "Ворота и ключи",
  "demo.guest.briefing.keysBody":
    "Код бокового ворота 4821#. Оставьте ключи на кухонной стойке при выезде.",
  "demo.guest.briefing.helpTitle": "Как с нами связаться",
  "demo.guest.briefing.helpBody":
    "Для срочных вопросов используйте Поддержку в приложении. Отвечаем только как команда хоста.",
  "demo.guest.support.poolQuestion":
    "Здравствуйте - обогрев бассейна уже включён сегодня вечером?",
  "demo.guest.support.poolReply":
    "Да, включается каждый день в 16:00. Наслаждайтесь закатом!",
  "demo.guest.guide.bins":
    "Синий контейнер у боковых ворот. Вывоз вт / пт утром.",
  "demo.guest.guide.checkout":
    "Закройте все окна\nВыключите кондиционер и свет\nОставьте ключи на стойке\nЗакройте боковые ворота",
  "demo.guest.guide.extra":
    "Пляжные полотенца в левом шкафу. Доп. вода под раковиной.",
  "demo.guest.depositNote": "Залог удержан при заезде.",
  "demo.guest.chargeGlass": "Разбитый бокал (замена)",
};

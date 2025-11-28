require('dotenv').config();
const { Telegraf, session, Markup } = require('telegraf');

const bot = new Telegraf(process.env.TELEGRAM_TOKEN);
const ADMIN_ID = parseInt(process.env.ADMIN_ID);
const CHANNEL_ID = 1301102683;

bot.use(session());

// ✅ ПРАВИЛЬНАЯ УСТАНОВКА КОМАНД - /admin видна только админу
async function setAdminCommands() {
  try {
    await bot.telegram.setMyCommands(
      [
        { command: 'menu', description: '☰ Главное меню' },
        { command: 'admin', description: '🔐 Админ панель' },
        { command: 'join_channel', description: '📤 Подключить к каналу' },
        { command: 'post_menu_button', description: '📮 Кнопка в канал' },
        { command: 'setup_channel_button', description: '⚙️ Меню канала' },
      ],
      { scope: { type: 'chat', chat_id: ADMIN_ID } }
    );
    
    await bot.telegram.setMyCommands(
      [
        { command: 'menu', description: '☰ Главное меню' },
      ],
      { scope: { type: 'default' } }
    );
    console.log('✅ Команды установлены! /admin видна только админу');
  } catch (error) {
    console.error('Ошибка при установке команд:', error);
  }
}

const services = [
  { id: '1', name: 'Индивидуальные 60 мин', price: 3000, duration: 60 },
  { id: '2', name: 'Индивидуальные 90 мин', price: 4500, duration: 90 },
  { id: '3', name: 'Парные занятия (1+1) 60 мин', price: 2250, duration: 60 },
  { id: '4', name: 'Групповое занятие 60 мин', price: 2000, duration: 60 },
  { id: '5', name: 'Групповой интенсив 120 мин', price: 4500, duration: 120 },
];

const trainers = [
  {
    id: '1',
    name: 'Даниэль Васильев',
    title: 'Амбассадор и ведущий тренер Скейт Класс',
    description: 'Опытный райдер по скейтбордингу. Дане 23 года, с 10 лет занимается скейтбордингом и лыжным двоеборьем. Регулярно участвует в крупных федеральных и локальных соревнованиях, занимая призовые места. Даниэль начал тренерскую деятельность в своём родном городе, где проводил занятия по скейтбордингу для взрослых и детей. Он отлично объясняет правильную технику катания, а так же замечает и исправляет ошибки учеников. Принимал участие в предыдущих скейт кэмпах школы в Санкт-Петербурге, Сочи, Москве, Казани и в других городах России и зарубежом.',
    buttonText: 'Записаться к Даниэлю Васильеву',
    reportName: 'Даниэлю'
  },
  {
    id: '2',
    name: 'Павел Мушкин',
    title: 'Основатель школы',
    description: 'Профессиональный райдер. Победитель конкурса «Синяя птица» в номинации «Лучший педагог 2019». Более 10 лет спонсируется компанией DC shoes и столько же преподаёт уроки скейтбординга. Наставник ученика, дважды ставшего чемпионом России среди молодёжи до 16 лет. Паша часто путешествует и общается с скейтерами со всего мира. Все это позволяет его ученикам расти и развиваться в скейтбординге.',
    buttonText: 'Записаться к Павлу Мушкину',
    reportName: 'Паше'
  },
];

const locations = [
  { id: '1', name: 'Скейт-парк Севкабель (Вираж)' },
  { id: '2', name: 'Скейт-парк Жесть' },
];

const skillLevels = [
  { id: '1', name: 'Начинающий' },
  { id: '2', name: 'С небольшим опытом' },
  { id: '3', name: 'Опытный' },
];

let bookings = [];
let applications = [];
let subscribers = [];
let bookingCounter = 1000;
let applicationCounter = 1;

const mainMenuKeyboard = Markup.keyboard([
  ['☰ МЕНЮ', '☰ МЕНЮ'],
]).resize();

const fullMenuKeyboard = Markup.inlineKeyboard([
  [Markup.button.callback('📝 Оставить заявку', 'app_start')],
  [Markup.button.callback('👨‍🏫 Тренеры', 'show_trainers')],
  [Markup.button.url('💬 Написать нам', 'https://t.me/skateclass')],
  [Markup.button.url('🌐 Сайт Скейт Класс', 'https://sk8class.ru')],
  [Markup.button.url('🎪 Зимний скейт кэмп в Питере', 'https://sk8class.ru/skatecamp')],
  [Markup.button.callback('📰 Подписаться на новости', 'subscribe_newsletter')],
  [Markup.button.callback('🔔 Отписаться от новостей', 'unsubscribe_newsletter')],
]);

const adminMenuKeyboard = Markup.inlineKeyboard([
  [Markup.button.callback('📊 Статистика подписчиков', 'admin_stats')],
  [Markup.button.callback('📮 Отправить рассылку', 'admin_send_newsletter')],
  [Markup.button.callback('👥 Список подписчиков', 'admin_list_subscribers')],
  [Markup.button.callback('📋 Список заявок', 'admin_list_applications')],
  [Markup.button.callback('⬅️ Назад', 'back_menu')],
]);

function formatPhoneNumber(phone) {
  let cleaned = phone.replace(/\D/g, '');
  if (!cleaned.startsWith('8')) {
    if (cleaned.startsWith('7')) {
      cleaned = '8' + cleaned.slice(1);
    } else if (cleaned.length === 10) {
      cleaned = '8' + cleaned;
    }
  }
  return cleaned.replace(/^(\d)(\d{3})(\d{3})(\d{2})(\d{2})$/, '$1($2)$3-$4-$5');
}

async function showMainMenu(ctx) {
  await ctx.reply(
    '🛹 *SKATE CLASS*\n\n' +
    '━━━━━━━━━━━━━━━━━━\n\n' +
    '*Выберите что вас интересует:*',
    { parse_mode: 'Markdown', ...fullMenuKeyboard }
  );
}

async function showAdminMenu(ctx) {
  const totalSubscribers = subscribers.length;
  await ctx.reply(
    '🔐 *АДМИН ПАНЕЛЬ*\n\n' +
    '━━━━━━━━━━━━━━━━━━\n\n' +
    `📊 Всего подписчиков: ${totalSubscribers}\n\n` +
    'Выберите действие:',
    { parse_mode: 'Markdown', ...adminMenuKeyboard }
  );
}

bot.start(async (ctx) => {
  try {
    const firstName = ctx.from.first_name || 'гость';
    await ctx.reply(
      '🛹 *SKATE CLASS*\n\n' +
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n' +
      `Привет, ${firstName}! 🎉\n\n` +
      '*Добро пожаловать в Skate Class!*\n\n' +
      'Лучшая скейт школа в Санкт-Петербурге\n\n' +
      '🏆 Что мы предлагаем:\n' +
      '✅ Опытные тренеры\n' +
      '✅ Удобное расписание\n' +
      '✅ Групповые и индивидуальные занятия\n' +
      '✅ Зимний скейт лагерь\n\n' +
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n' +
      'Нажмите *"☰ МЕНЮ"* внизу 👇',
      { parse_mode: 'Markdown', ...mainMenuKeyboard }
    );
  } catch (error) {
    console.error('Error:', error);
  }
});

bot.hears('☰ МЕНЮ', (ctx) => showMainMenu(ctx));
bot.command('menu', (ctx) => showMainMenu(ctx));

bot.command('admin', async (ctx) => {
  if (ctx.from.id !== ADMIN_ID) {
    await ctx.reply('❌ У вас нет доступа.');
    return;
  }
  await showAdminMenu(ctx);
});

bot.command('join_channel', async (ctx) => {
  if (ctx.from.id !== ADMIN_ID) {
    await ctx.reply('❌ У вас нет доступа.');
    return;
  }

  try {
    await bot.telegram.sendMessage(
      CHANNEL_ID,
      '✅ Бот @Skateclass_bot подключен к каналу и готов отправлять сообщения!'
    );
    
    await ctx.reply('✅ Бот успешно присоединился к каналу @skateclass!');
  } catch (error) {
    await ctx.reply(`❌ Ошибка подключения: ${error.message}\n\n⚠️ Убедись что:\n✅ Бот администратор канала\n✅ У бота есть право "Отправлять сообщения"`);
    console.error('Ошибка подключения к каналу:', error);
  }
});

bot.command('post_menu_button', async (ctx) => {
  if (ctx.from.id !== ADMIN_ID) {
    await ctx.reply('❌ У вас нет доступа.');
    return;
  }

  try {
    const sentMessage = await bot.telegram.sendMessage(
      CHANNEL_ID,
      '🤖 *ЗАПИСАТЬСЯ НА ЗАНЯТИЯ*\n\n' +
      'Нажми кнопку "☰ Меню" снизу, чтобы начать запись на тренировки →',
      {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
          [Markup.button.url('☰ МЕНЮ', 'https://t.me/Skateclass_bot')]
        ])
      }
    );
    
    await bot.telegram.pinChatMessage(CHANNEL_ID, sentMessage.message_id, {
      disable_notification: true
    });
    
    await ctx.reply('✅ *ГОТОВО!*\n\n📌 Кнопка отправлена и закреплена в канале @skateclass!\n\n💡 Теперь все подписчики видят кнопку "☰ МЕНЮ" снизу в поле ввода.', { parse_mode: 'Markdown' });
    
  } catch (error) {
    await ctx.reply(`❌ Ошибка: ${error.message}`);
    console.error('Ошибка при отправке в канал:', error);
  }
});

bot.command('setup_channel_button', async (ctx) => {
  if (ctx.from.id !== ADMIN_ID) {
    await ctx.reply('❌ У вас нет доступа.');
    return;
  }

  try {
    await bot.telegram.setChatMenuButton({
      chat_id: CHANNEL_ID,
      menu_button: {
        type: 'commands'
      }
    });
    
    await ctx.reply('✅ *ГОТОВО!*\n\n🔵 Голубая кнопка "☰ МЕНЮ" добавлена снизу в канале @skateclass!\n\nТеперь все подписчики видят кнопку рядом с полем для ввода сообщений.', { parse_mode: 'Markdown' });
  } catch (error) {
    await ctx.reply(`❌ Ошибка: ${error.message}`, { parse_mode: 'Markdown' });
    console.error('Ошибка при установке кнопки:', error);
  }
});

bot.help((ctx) => ctx.reply('🛹 *ПОМОЩЬ*\n\n/menu - Меню\n/admin - Админ\n/join_channel - Подключить бота\n/post_menu_button - Кнопка в канал\n/setup_channel_button - Меню канала\n/help - Справка', { parse_mode: 'Markdown' }));

bot.action('subscribe_newsletter', async (ctx) => {
  await ctx.answerCbQuery();
  const subscriber = { userId: ctx.from.id, username: ctx.from.username || ctx.from.first_name, firstName: ctx.from.first_name, subscribedAt: new Date() };
  if (subscribers.find(s => s.userId === ctx.from.id)) {
    await ctx.reply('✅ Вы уже подписаны!');
    return;
  }
  subscribers.push(subscriber);
  await ctx.reply('✅ *Спасибо за подписку!*\n\nМы будем присылать важные новости и анонсы!', { parse_mode: 'Markdown', ...Markup.inlineKeyboard([[Markup.button.url('💬 Написать нам', 'https://t.me/skateclass')]]) });
  try {
    await bot.telegram.sendMessage(ADMIN_ID, `📰 *НОВАЯ ПОДПИСКА!*\n\n👤 @${subscriber.username || subscriber.firstName}\n🆔 ${subscriber.userId}\n📅 ${subscriber.subscribedAt.toLocaleString('ru-RU')}\n\nВсего: ${subscribers.length}`, { parse_mode: 'Markdown' });
  } catch (e) { console.error(e); }
});

bot.action('unsubscribe_newsletter', async (ctx) => {
  await ctx.answerCbQuery();
  if (!subscribers.find(s => s.userId === ctx.from.id)) {
    await ctx.reply('❌ Вы не подписаны.');
    return;
  }
  subscribers = subscribers.filter(s => s.userId !== ctx.from.id);
  await ctx.reply('✅ *Вы отписались от новостей!*', { parse_mode: 'Markdown' });
});

bot.action('admin_stats', async (ctx) => {
  if (ctx.from.id !== ADMIN_ID) return ctx.answerCbQuery('❌ Доступ запрещен');
  await ctx.answerCbQuery();
  const today = subscribers.filter(s => s.subscribedAt.toDateString() === new Date().toDateString()).length;
  await ctx.reply(`📊 *СТАТИСТИКА*\n\n📈 Всего: ${subscribers.length}\n🆕 Сегодня: ${today}`, { parse_mode: 'Markdown', ...Markup.inlineKeyboard([[Markup.button.callback('⬅️ Назад', 'admin_back')]]) });
});

bot.action('admin_list_subscribers', async (ctx) => {
  if (ctx.from.id !== ADMIN_ID) return ctx.answerCbQuery('❌ Доступ запрещен');
  await ctx.answerCbQuery();
  if (subscribers.length === 0) return ctx.reply('📭 Подписчиков нет.');
  let text = '👥 *СПИСОК ПОДПИСЧИКОВ*\n\n━━━━━━━━━━━━━━━━━━\n\n';
  subscribers.forEach((s, i) => { text += `${i + 1}. @${s.username || s.firstName}\n   🆔 ${s.userId}\n   📅 ${s.subscribedAt.toLocaleDateString('ru-RU')}\n\n`; });
  text += `━━━━━━━━━━━━━━━━━━\n\n📊 Всего: ${subscribers.length}`;
  await ctx.reply(text, { parse_mode: 'Markdown', ...Markup.inlineKeyboard([[Markup.button.callback('⬅️ Назад', 'admin_back')]]) });
});

bot.action('admin_send_newsletter', async (ctx) => {
  if (ctx.from.id !== ADMIN_ID) return ctx.answerCbQuery('❌ Доступ запрещен');
  await ctx.answerCbQuery();
  if (!ctx.session) ctx.session = {};
  ctx.session.newsletter = {};
  await ctx.reply('📮 *РАССЫЛКА*\n\nНапишите текст сообщения:', { parse_mode: 'Markdown' });
});

bot.action('admin_back', async (ctx) => {
  await ctx.answerCbQuery();
  await showAdminMenu(ctx);
});

bot.action('admin_list_applications', async (ctx) => {
  if (ctx.from.id !== ADMIN_ID) return ctx.answerCbQuery('❌ Доступ запрещен');
  await ctx.answerCbQuery();
  
  if (applications.length === 0) return ctx.reply('📭 Заявок нет.');
  
  let text = '📋 *СПИСОК ЗАЯВОК*\n\n━━━━━━━━━━━━━━━━━━\n\n';
  
  const sorted = [...applications].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  
  sorted.forEach((app, index) => {
    const dateStr = new Date(app.createdAt).toLocaleDateString('ru-RU');
    const timeStr = new Date(app.createdAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    text += `${index + 1}. 📝 ${app.studentName} (${app.age} лет)\n`;
    text += `   📞 ${formatPhoneNumber(app.phone)}\n`;
    text += `   ⛹️ ${app.skillLevel}\n`;
    text += `   📍 ${app.district}\n`;
    text += `   📅 ${dateStr} ${timeStr}\n`;
    if (app.trainerType === 'specific') {
      text += `   🎯 К ${app.trainerName}\n`;
    }
    text += `\n`;
  });
  
  text += `━━━━━━━━━━━━━━━━━━\n\n📊 Всего: ${applications.length} заявок`;
  
  await ctx.reply(text, { parse_mode: 'Markdown', ...Markup.inlineKeyboard([[Markup.button.callback('⬅️ Назад', 'admin_back')]]) });
});

bot.on('text', async (ctx) => {
  const text = ctx.message.text;
  if (!ctx.session) ctx.session = {};

  if (ctx.from.id === ADMIN_ID && ctx.session.newsletter !== undefined && !ctx.session.newsletter.message) {
    ctx.session.newsletter.message = text;
    await ctx.reply('✅ Сохранено!\n\n📎 Введите ссылку (или напишите: нет)', { parse_mode: 'Markdown' });
    return;
  }

  if (ctx.from.id === ADMIN_ID && ctx.session.newsletter !== undefined && ctx.session.newsletter.message && !ctx.session.newsletter.link) {
    ctx.session.newsletter.link = text;
    let buttons = [[Markup.button.url('💬 Написать нам', 'https://t.me/skateclass')]];
    if (text !== 'нет' && text.startsWith('http')) {
      buttons.unshift([Markup.button.url('🔗 Открыть', text)]);
    }
    const preview = `📰 *ПРЕВЬЮ*\n\n━━━━━━━━━━━━━━━━━━\n\n${ctx.session.newsletter.message}\n\n━━━━━━━━━━━━━━━━━━\n\nПодписчиков: ${subscribers.length}`;
    await ctx.reply(preview, { parse_mode: 'Markdown', ...Markup.inlineKeyboard([...buttons, [Markup.button.callback('✅ Отправить', 'confirm_newsletter'), Markup.button.callback('❌ Отмена', 'cancel_newsletter')]]) });
    return;
  }

  if (ctx.session.application !== undefined && !ctx.session.application.studentName) {
    if (text.length < 2) return ctx.reply('❌ Напишите корректное имя.');
    ctx.session.application.studentName = text;
    await ctx.reply('✅ Спасибо!\n\n🎂 *Теперь введите возраст ученика:*\n\n_Например: 12_', { parse_mode: 'Markdown' });
    return;
  }

  if (ctx.session.application !== undefined && !ctx.session.application.age) {
    const age = parseInt(text);
    if (isNaN(age) || age < 5 || age > 100) return ctx.reply('❌ Введите возраст (5-100).');
    ctx.session.application.age = age;
    const skillButtons = skillLevels.map(s => Markup.button.callback(s.name, `skill_${s.id}`));
    await ctx.reply('⛹️ *Какой уровень катания?*', { parse_mode: 'Markdown', ...Markup.inlineKeyboard(skillButtons.map(b => [b])) });
    return;
  }

  if (ctx.session.application !== undefined && ctx.session.application.skillLevel && !ctx.session.application.district) {
    ctx.session.application.district = text;
    await ctx.reply('✅ Спасибо!\n\n🎪 *Вас интересует участие в скейт кэмпах?*', { parse_mode: 'Markdown', ...Markup.inlineKeyboard([[Markup.button.callback('🎪 Да, интересует', 'camp_yes')], [Markup.button.callback('🏋️ Только тренировки', 'camp_no')]]) });
    return;
  }

  if (ctx.session.application !== undefined && ctx.session.application.camp && !ctx.session.application.phone) {
    if (text.length < 10) return ctx.reply('❌ Введите корректный номер.');
    ctx.session.application.phone = text;
    await ctx.reply('💬 *Если хотите задать вопрос, напишите здесь:*\n\n_Поле опционально_', { parse_mode: 'Markdown', ...Markup.inlineKeyboard([[Markup.button.callback('➡️ Пропустить', 'skip_comment')]]) });
    return;
  }

  if (ctx.session.application !== undefined && ctx.session.application.phone && !ctx.session.application.comment) {
    ctx.session.application.comment = text;
    await ctx.reply('✅ Спасибо!\n\n📝 *Проверьте данные*', { parse_mode: 'Markdown', ...Markup.inlineKeyboard([[Markup.button.callback('✅ Отправить', 'confirm_application')], [Markup.button.callback('❌ Отмена', 'cancel_application_form')]]) });
    return;
  }

  await ctx.reply('❌ Команда не распознана.\n\nНажмите *"☰ МЕНЮ"*', { parse_mode: 'Markdown' });
});

bot.action(/^skill_(.+)$/, async (ctx) => {
  const skill = skillLevels.find(s => s.id === ctx.match[1]);
  if (!skill) return ctx.answerCbQuery('❌ Не найдено');
  if (!ctx.session) ctx.session = {};
  ctx.session.application = ctx.session.application || {};
  ctx.session.application.skillLevel = skill.name;
  await ctx.answerCbQuery('✅ Выбрано');
  await ctx.reply('📍 *Ваш район или ближайшая станция метро:*\n\n_Напишите район, где вам удобно заниматься_', { parse_mode: 'Markdown' });
});

bot.action(/^camp_(yes|no)$/, async (ctx) => {
  if (!ctx.session) ctx.session = {};
  ctx.session.application = ctx.session.application || {};
  ctx.session.application.camp = ctx.match[1] === 'yes' ? 'Да, интересует' : 'Только тренировки';
  await ctx.answerCbQuery('✅ Выбрано');
  await ctx.reply('📞 *Теперь введите номер телефона для связи:*\n\n_Например: +7 999 999 99 99_', { parse_mode: 'Markdown' });
});

bot.action('skip_comment', async (ctx) => {
  if (!ctx.session) ctx.session = {};
  ctx.session.application = ctx.session.application || {};
  ctx.session.application.comment = '(нет комментария)';
  await ctx.answerCbQuery();
  sendApplication(ctx);
});

bot.action('app_start', async (ctx) => {
  await ctx.answerCbQuery();
  if (!ctx.session) ctx.session = {};
  ctx.session.application = { trainerType: 'general' };
  await ctx.reply('📝 *ОСТАВИТЬ ЗАЯВКУ*\n\n━━━━━━━━━━━━━━━━━━\n\nНапишите *имя ученика:*\n\n_Например: Максим_', { parse_mode: 'Markdown' });
});

bot.action('booking_start', async (ctx) => {
  await ctx.answerCbQuery();
  if (!ctx.session) ctx.session = {};
  ctx.session.booking = {};
  const buttons = services.map(s => Markup.button.callback(`${s.name} (${s.price}₽)`, `service_${s.id}`));
  await ctx.reply('📅 *ЗАПИСАТЬСЯ ПО РАСПИСАНИЮ*\n\n━━━━━━━━━━━━━━━━━━\n\n*Выберите услугу:*', { parse_mode: 'Markdown', ...Markup.inlineKeyboard(buttons.map(b => [b])) });
});

bot.action(/^trainer_booking_(.+)$/, async (ctx) => {
  const trainerId = ctx.match[1];
  const trainer = trainers.find(t => t.id === trainerId);

  if (!trainer) {
    await ctx.answerCbQuery('❌ Тренер не найден');
    return;
  }

  if (!ctx.session) ctx.session = {};
  ctx.session.application = {
    trainerId: trainerId,
    trainerName: trainer.name,
    trainerType: 'specific'
  };

  await ctx.answerCbQuery();

  await ctx.reply(
    '📝 *ОСТАВИТЬ ЗАЯВКУ*\n\n' +
    '━━━━━━━━━━━━━━━━━━\n\n' +
    'Напишите *имя ученика:*\n\n' +
    '_Например: Максим_',
    { parse_mode: 'Markdown' }
  );
});

bot.action('show_trainers', async (ctx) => {
  await ctx.answerCbQuery();
  let text = '👨‍🏫 *НАШИ ТРЕНЕРЫ*\n\n━━━━━━━━━━━━━━━━━\n\n';
  trainers.forEach(t => { text += `🏆 *${t.name}*\n📍 ${t.title}\n\n${t.description}\n\n━━━━━━━━━━━━━━━━━\n\n`; });
  const buttons = trainers.map(t => Markup.button.callback(t.buttonText, `trainer_booking_${t.id}`));
  await ctx.reply(text, { parse_mode: 'Markdown', ...Markup.inlineKeyboard(buttons.map(b => [b])) });
});

bot.action('my_bookings', async (ctx) => {
  await ctx.answerCbQuery();
  const userBookings = bookings.filter(b => b.userId === ctx.from.id && b.status === 'active');
  if (userBookings.length === 0) return ctx.reply('📋 *МОИ ЗАПИСИ*\n\nУ вас нет активных записей.', { parse_mode: 'Markdown' });
  let text = '✅ *МОИ ЗАПИСИ*\n\n━━━━━━━━━━━━━━━━━\n\n';
  userBookings.forEach(b => { text += `📝 #${b.id}\n📅 ${b.date} ${b.time}\n👨‍🏫 ${b.trainerName}\n💰 ${b.price}₽\n\n`; });
  const buttons = userBookings.map(b => Markup.button.callback(`❌ #${b.id}`, `cancel_booking_${b.id}`));
  await ctx.reply(text, { parse_mode: 'Markdown', ...Markup.inlineKeyboard(buttons.map(b => [b])) });
});

bot.action(/^service_(.+)$/, async (ctx) => {
  const service = services.find(s => s.id === ctx.match[1]);
  if (!service) return ctx.answerCbQuery('❌ Не найдено');
  if (!ctx.session) ctx.session = {};
  ctx.session.booking = ctx.session.booking || {};
  ctx.session.booking.serviceId = service.id;
  ctx.session.booking.serviceName = service.name;
  ctx.session.booking.price = service.price;
  await ctx.answerCbQuery('✅ Выбрано');
  const buttons = locations.map(l => Markup.button.callback(l.name, `location_${l.id}`));
  await ctx.reply('*Выберите локацию:*', { parse_mode: 'Markdown', ...Markup.inlineKeyboard(buttons.map(b => [b])) });
});

bot.action(/^location_(.+)$/, async (ctx) => {
  const location = locations.find(l => l.id === ctx.match[1]);
  if (!location) return ctx.answerCbQuery('❌ Не найдено');
  if (!ctx.session) ctx.session = {};
  ctx.session.booking = ctx.session.booking || {};
  ctx.session.booking.locationId = location.id;
  ctx.session.booking.location = location.name;
  await ctx.answerCbQuery('✅ Выбрано');
  const buttons = trainers.map(t => Markup.button.callback(t.name, `trainer_${t.id}`));
  await ctx.reply('*Выберите тренера:*', { parse_mode: 'Markdown', ...Markup.inlineKeyboard(buttons.map(b => [b])) });
});

bot.action(/^trainer_(.+)$/, async (ctx) => {
  const trainer = trainers.find(t => t.id === ctx.match[1]);
  if (!trainer) return ctx.answerCbQuery('❌ Не найдено');
  if (!ctx.session) ctx.session = {};
  ctx.session.booking = ctx.session.booking || {};
  ctx.session.booking.trainerId = trainer.id;
  ctx.session.booking.trainerName = trainer.name;
  await ctx.answerCbQuery('✅ Выбрано');
  await ctx.reply('📅 *Выберите дату* (ДД.MM.ГГГГ)\n\n_Например: 05.02.2025_', { parse_mode: 'Markdown' });
});

bot.action(/^cancel_booking_(.+)$/, async (ctx) => {
  const booking = bookings.find(b => b.id === ctx.match[1]);
  if (!booking) return ctx.answerCbQuery('❌ Не найдено');
  booking.status = 'cancelled';
  await ctx.answerCbQuery('✅ Отменено');
  await ctx.reply(`✅ *Запись #${booking.id} отменена!*`, { parse_mode: 'Markdown' });
});

bot.action('confirm_booking', async (ctx) => {
  if (!ctx.session) ctx.session = {};
  if (!ctx.session.booking) ctx.session.booking = {};
  const booking = { id: (bookingCounter++).toString(), userId: ctx.from.id, userName: ctx.from.first_name, ...ctx.session.booking, status: 'active', createdAt: new Date() };
  bookings.push(booking);
  await ctx.answerCbQuery('✅ Записано!');
  await ctx.reply(`✅ *ЗАПИСАНЫ!*\n\n━━━━━━━━━━━━━━━━━━━━━━━━\n\n📍 ${booking.serviceName}\n👨‍🏫 ${booking.trainerName}\n📍 ${booking.location}\n📅 ${booking.date}\n⏰ ${booking.time}\n💰 ${booking.price}₽\n\n━━━━━━━━━━━━━━━━━━━━━━━━\n\nНапоминание будет отправлено за 12 и 3 часа.`, { parse_mode: 'Markdown' });
  ctx.session.booking = {};
});

bot.action('cancel_booking_form', async (ctx) => {
  await ctx.answerCbQuery();
  ctx.session.booking = {};
  await showMainMenu(ctx);
});

bot.action('confirm_newsletter', async (ctx) => {
  if (ctx.from.id !== ADMIN_ID) return ctx.answerCbQuery('❌ Доступ запрещен');
  await ctx.answerCbQuery();
  const message = ctx.session.newsletter.message;
  const link = ctx.session.newsletter.link;
  let successCount = 0, errorCount = 0;
  for (const sub of subscribers) {
    try {
      let buttons = [[Markup.button.url('💬 Написать', 'https://t.me/skateclass')]];
      if (link !== 'нет' && link.startsWith('http')) buttons.unshift([Markup.button.url('🔗 Открыть', link)]);
      await bot.telegram.sendMessage(sub.userId, message, { parse_mode: 'Markdown', ...Markup.inlineKeyboard(buttons) });
      successCount++;
    } catch (e) { errorCount++; }
  }
  await ctx.reply(`✅ *ОТПРАВЛЕНО!*\n\n━━━━━━━━━━━━━━━━━━\n\n✅ ${successCount}\n❌ ${errorCount}\n📊 Всего: ${subscribers.length}`, { parse_mode: 'Markdown' });
  ctx.session.newsletter = {};
  await showAdminMenu(ctx);
});

bot.action('cancel_newsletter', async (ctx) => {
  if (ctx.from.id !== ADMIN_ID) return ctx.answerCbQuery('❌ Доступ запрещен');
  await ctx.answerCbQuery('❌ Отменено');
  ctx.session.newsletter = {};
  await showAdminMenu(ctx);
});

bot.action('cancel_application_form', async (ctx) => {
  await ctx.answerCbQuery();
  ctx.session.application = {};
  await showMainMenu(ctx);
});

bot.action('confirm_application', async (ctx) => {
  await ctx.answerCbQuery();
  sendApplication(ctx);
});

// ✅ ОТПРАВКА ТОЛЬКО АДМИНУ
async function sendApplication(ctx) {
  if (!ctx.session || !ctx.session.application) return ctx.reply('❌ Ошибка данных.');
  const app = ctx.session.application;
  app.userId = ctx.from.id;
  app.userName = ctx.from.first_name || 'Гость';
  const applicationId = applicationCounter++;
  applications.push({ id: applicationId, ...app, createdAt: new Date() });
  const formattedPhone = formatPhoneNumber(app.phone);
  
  await ctx.reply(`✅ *ЗАЯВКА ОТПРАВЛЕНА!*\n\n━━━━━━━━━━━━━━━━━━━━━━━━\n\n📝 ${app.studentName}\n🎂 ${app.age} лет\n⛹️ ${app.skillLevel}\n📍 ${app.district}\n🎪 ${app.camp}\n📞 ${formattedPhone}\n\n━━━━━━━━━━━━━━━━━━━━━━━━\n\n📲 Мы свяжемся с вами!`, { parse_mode: 'Markdown' });
  
  try {
    let adminMsg = `📝 *НОВАЯ ЗАЯВКА!*\n\n━━━━━━━━━━━━━━━━━━━━━━━━\n\n👤 @${ctx.from.username || ctx.from.first_name}\n📝 ${app.studentName}\n🎂 ${app.age} лет\n⛹️ ${app.skillLevel}\n📍 ${app.district}\n🎪 ${app.camp}\n📞 ${formattedPhone}\n💬 ${app.comment}\n🆔 ${ctx.from.id}\n📅 ${new Date().toLocaleString('ru-RU')}`;
    
    if (app.trainerType === 'specific' && app.trainerId) {
      const trainer = trainers.find(t => t.id === app.trainerId);
      adminMsg += `\n\n🎯 *Заявка к ${trainer.reportName}*`;
    }
    
    adminMsg += `\n━━━━━━━━━━━━━━━━━━━━━━━━`;
    
    // ✅ ОТПРАВЛЯЕМ ТОЛЬКО АДМИНУ
    await bot.telegram.sendMessage(ADMIN_ID, adminMsg, { parse_mode: 'Markdown' });
    console.log(`✅ Заявка отправлена админу: ${ADMIN_ID}`);
    
  } catch (e) { 
    console.error('❌ Ошибка при отправке заявки:', e);
  }
  
  ctx.session.application = {};
}

bot.action('back_menu', async (ctx) => {
  await ctx.answerCbQuery();
  await showMainMenu(ctx);
});

bot.launch();

setAdminCommands();

console.log('✅ БОТ ЗАПУЩЕН!');
console.log('✅ Admin ID:', ADMIN_ID);
console.log('📌 /start');
console.log('⚠️  ЗАЯВКИ ОТПРАВЛЯЮТСЯ ТОЛЬКО АДМИНУ!');

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

module.exports = bot;

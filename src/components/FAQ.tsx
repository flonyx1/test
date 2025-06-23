import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Shield, Lock, Eye, MessageCircle } from 'lucide-react';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  icon: React.ReactNode;
}

export default function FAQ() {
  const [openItems, setOpenItems] = useState<Set<string>>(new Set());

  const faqItems: FAQItem[] = [
    {
      id: '1',
      question: 'Насколько безопасен APE?',
      answer: 'APE использует end-to-end шифрование для всех сообщений. Ваши данные защищены современными алгоритмами шифрования, и даже мы не можем прочитать ваши сообщения.',
      icon: <Shield className="w-5 h-5 text-green-400" />
    },
    {
      id: '2',
      question: 'Сохраняется ли анонимность?',
      answer: 'Да, мы гарантируем полную анонимность. Мы не требуем номер телефона, не отслеживаем ваше местоположение и не собираем персональные данные. Только email для регистрации.',
      icon: <Eye className="w-5 h-5 text-primary-400" />
    },
    {
      id: '3',
      question: 'Как работают голосовые сообщения?',
      answer: 'Голосовые сообщения записываются локально на вашем устройстве и передаются в зашифрованном виде. Мы не сохраняем аудиозаписи на наших серверах дольше необходимого для доставки.',
      icon: <MessageCircle className="w-5 h-5 text-accent-400" />
    },
    {
      id: '4',
      question: 'Можно ли удалить сообщения?',
      answer: 'Да, вы можете удалять сообщения как для себя, так и для всех участников чата. Удаленные сообщения полностью стираются с наших серверов.',
      icon: <Lock className="w-5 h-5 text-red-400" />
    },
    {
      id: '5',
      question: 'Как работают отчеты о прочтении?',
      answer: 'Система показывает статус доставки: одна галочка - отправлено, две галочки - доставлено, две зеленые галочки - прочитано. Крестик означает ошибку доставки.',
      icon: <MessageCircle className="w-5 h-5 text-blue-400" />
    },
    {
      id: '6',
      question: 'Сохраняются ли чаты в облаке?',
      answer: 'Чаты сохраняются локально в кэше браузера и на наших серверах в зашифрованном виде. Вы можете очистить локальный кэш в любое время.',
      icon: <Shield className="w-5 h-5 text-purple-400" />
    }
  ];

  const toggleItem = (id: string) => {
    const newOpenItems = new Set(openItems);
    if (newOpenItems.has(id)) {
      newOpenItems.delete(id);
    } else {
      newOpenItems.add(id);
    }
    setOpenItems(newOpenItems);
  };

  return (
    <div className="h-full overflow-y-auto bg-dark-800/30">
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-4">Часто задаваемые вопросы</h1>
          <p className="text-primary-300 text-lg">
            Ответы на популярные вопросы о APE
          </p>
        </div>

        <div className="space-y-4">
          {faqItems.map((item) => (
            <div
              key={item.id}
              className="bg-dark-800/50 backdrop-blur-lg rounded-2xl border border-primary-500/20 overflow-hidden"
            >
              <button
                onClick={() => toggleItem(item.id)}
                className="w-full p-6 text-left flex items-center justify-between hover:bg-primary-600/10 transition-all"
              >
                <div className="flex items-center space-x-4">
                  {item.icon}
                  <h3 className="text-lg font-semibold text-white">
                    {item.question}
                  </h3>
                </div>
                {openItems.has(item.id) ? (
                  <ChevronUp className="w-5 h-5 text-primary-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-primary-400" />
                )}
              </button>
              
              {openItems.has(item.id) && (
                <div className="px-6 pb-6">
                  <div className="pl-9 text-primary-200 leading-relaxed">
                    {item.answer}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-12 bg-gradient-to-r from-primary-600/20 to-accent-600/20 rounded-2xl p-8 border border-primary-500/30">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white mb-4">
              Не нашли ответ на свой вопрос?
            </h2>
            <p className="text-primary-300 mb-6">
              Свяжитесь с нашей службой поддержки, и мы поможем вам
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-all font-medium">
                Написать в поддержку
              </button>
              <button className="px-6 py-3 border border-primary-500 text-primary-300 rounded-lg hover:bg-primary-600/20 hover:text-white transition-all font-medium">
                Документация
              </button>
            </div>
          </div>
        </div>

        <div className="mt-8 bg-dark-800/50 backdrop-blur-lg rounded-2xl p-6 border border-green-500/20">
          <div className="flex items-start space-x-4">
            <Shield className="w-6 h-6 text-green-400 mt-1" />
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Гарантия безопасности
              </h3>
              <p className="text-primary-200 leading-relaxed">
                APE разработан с учетом самых высоких стандартов безопасности. 
                Мы регулярно проводим аудит безопасности и обновляем наши системы защиты. 
                Ваша приватность - наш главный приоритет.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
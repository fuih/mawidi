import { Bell, Calendar, AlertCircle } from "lucide-react";
import { useTranslation } from "react-i18next";

export function NotificationsWidget({ notifications = [] }: { notifications?: any[] }) {
  const { t } = useTranslation();
  return (
    <div className="bg-white rounded-xl shadow-sm border overflow-hidden h-full flex flex-col">
      <div className="px-6 py-5 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-gray-500" />
          <h2 className="text-lg font-semibold text-gray-900">{t('widgets.notifications')}</h2>
        </div>
        <button className="text-sm font-medium text-primary hover:underline">
          {t('widgets.markAllRead')}
        </button>
      </div>
      
      <div className="p-0 flex-1 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="p-8 text-center text-gray-500">{t('widgets.noNotifs')}</div>
        ) : (
          <div className="divide-y">
            {notifications.map((notif: any) => (
              <div key={notif.id} className="p-4 flex items-start gap-4 hover:bg-gray-50 transition-colors">
                <div className={`mt-1 p-2 rounded-full shrink-0 ${notif.is_read ? 'bg-gray-100 text-gray-500' : 'bg-primary/10 text-primary'}`}>
                  {notif.type === 'reminder' ? <AlertCircle className="h-4 w-4" /> : <Calendar className="h-4 w-4" />}
                </div>
                <div className="flex-1">
                  <h4 className={`text-sm ${notif.is_read ? 'text-gray-700 font-medium' : 'text-gray-900 font-semibold'}`}>
                    {notif.title || t('widgets.notificationFallback')}
                  </h4>
                  <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{notif.message}</p>
                  <p className="text-xs text-gray-400 mt-2">{t('widgets.minsAgo')}</p>
                </div>
                {!notif.is_read && (
                  <div className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0"></div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="p-4 border-t text-center">
        <a href="/dashboard/notifications" className="text-sm font-medium text-primary hover:underline">{t('widgets.viewAll')}</a>
      </div>
    </div>
  );
}

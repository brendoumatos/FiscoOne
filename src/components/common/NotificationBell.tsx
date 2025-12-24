
import { Bell } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { notificationService } from "@/services/notification";
import { useQuery } from "@tanstack/react-query";
import { NotificationType } from "@/types/notification";
import { cn } from "@/lib/utils";

export function NotificationBell() {
    const { data: notifications } = useQuery({
        queryKey: ['notifications'],
        queryFn: notificationService.getNotifications
    });

    const unreadCount = notifications?.filter(n => !n.read).length || 0;

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5 text-gray-500 hover:text-gray-700" />
                    {unreadCount > 0 && (
                        <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
                <div className="p-4 border-b border-gray-100">
                    <h4 className="font-semibold text-sm">Notificações</h4>
                </div>
                <div className="max-h-[300px] overflow-y-auto">
                    {notifications?.length === 0 ? (
                        <div className="p-4 text-center text-sm text-gray-500">
                            Nenhuma notificação nova.
                        </div>
                    ) : (
                        notifications?.map((notification) => (
                            <div key={notification.id} className={cn(
                                "p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer",
                                !notification.read && "bg-blue-50/30"
                            )}>
                                <div className="flex gap-3">
                                    <div className={cn(
                                        "h-2 w-2 mt-1.5 rounded-full shrink-0",
                                        notification.type === NotificationType.WARNING ? "bg-yellow-500" :
                                            notification.type === NotificationType.SUCCESS ? "bg-green-500" :
                                                "bg-blue-500"
                                    )} />
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">{notification.title}</p>
                                        <p className="text-xs text-gray-500 mt-0.5">{notification.message}</p>
                                        <p className="text-[10px] text-gray-400 mt-2">
                                            {new Date(notification.createdAt).toLocaleDateString('pt-BR')}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
                <div className="p-2 border-t border-gray-100 bg-gray-50 text-center">
                    <Button variant="link" size="sm" className="text-xs h-auto p-0">
                        Marcar todas como lidas
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    );
}

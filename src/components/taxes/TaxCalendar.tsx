
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

// Types
interface TaxEvent {
    id: string;
    day: number;
    title: string;
    amount: number;
    type: 'FEDERAL' | 'MUNICIPAL' | 'LABOR';
}

// Mock Data Structure
const mockTaxEvents: Record<number, TaxEvent[]> = {
    15: [
        { id: '1', day: 15, title: 'ISS Mensal', amount: 120.50, type: 'MUNICIPAL' }
    ],
    20: [
        { id: '2', day: 20, title: 'DAS Simples', amount: 350.00, type: 'FEDERAL' },
        { id: '3', day: 20, title: 'INSS', amount: 280.00, type: 'LABOR' }
    ],
    30: [
        { id: '4', day: 30, title: 'IRPJ Trimestral', amount: 1500.00, type: 'FEDERAL' }
    ]
};

export function TaxCalendar() {
    const [currentDate, setCurrentDate] = useState(new Date(2024, 10, 1)); // Nov 2024 mock

    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay(); // 0 = Sun

    const prevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const nextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const monthName = currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    // Capitalize first letter
    const formattedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);

    const renderDays = () => {
        const days = [];
        // Empty slots for previous month
        for (let i = 0; i < firstDay; i++) {
            days.push(<div key={`empty-${i}`} className="h-24 bg-gray-50/30 border-b border-r border-gray-100" />);
        }

        // Days of current month
        for (let day = 1; day <= daysInMonth; day++) {
            const events = mockTaxEvents[day];
            days.push(
                <div key={day} className="h-24 border-b border-r border-gray-100 p-2 relative hover:bg-gray-50 transition-colors group">
                    <span className={cn(
                        "text-xs font-semibold block mb-1",
                        events ? "text-gray-900" : "text-gray-400"
                    )}>
                        {day}
                    </span>
                    {events && (
                        <div className="flex flex-col gap-1 overflow-y-auto max-h-[calc(100%-1.5rem)]">
                            {events.map(event => (
                                <div key={event.id} className={cn(
                                    "text-[10px] p-1 rounded border truncate cursor-pointer shadow-sm",
                                    event.type === 'FEDERAL' ? "bg-blue-50 border-blue-100 text-blue-700" :
                                        event.type === 'MUNICIPAL' ? "bg-orange-50 border-orange-100 text-orange-700" :
                                            "bg-green-50 border-green-100 text-green-700"
                                )}>
                                    <span className="font-bold">{event.title}</span> <br />
                                    R$ {event.amount}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            );
        }
        return days;
    };

    return (
        <Card className="border-none shadow-sm h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
                <CardTitle className="text-lg font-semibold">Calendário Fiscal</CardTitle>
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" onClick={prevMonth}>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="font-medium min-w-[140px] text-center">{formattedMonth}</span>
                    <Button variant="outline" size="icon" onClick={nextMonth}>
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <div className="grid grid-cols-7 border-b border-gray-200">
                    {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => (
                        <div key={d} className="p-2 text-center text-xs font-medium text-gray-500 uppercase">
                            {d}
                        </div>
                    ))}
                </div>
                <div className="grid grid-cols-7 border-l border-t border-gray-100">
                    {renderDays()}
                </div>
            </CardContent>
        </Card>
    );
}
